import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SessionAttendance } from '../entities/session-attendance.entity';
import { EventSession } from '../../events/entities/event-session.entity';
import { Attendee } from '../../attendees/entities/attendee.entity';
import {
  GenerateStreamingTokenDto,
  GenerateStreamingTokenResult,
  StreamingTokenValidationResult,
  GetActiveConnectionsResult,
  ActiveConnectionDto,
} from '../dto/streaming-token.dto';

interface StreamingTokenPayload {
  sessionId: string;
  attendeeId: string;
  sessionStartAt: string;
  sessionEndAt: string;
  type: 'streaming';
}

interface VirtualConnection {
  connectedAt: string;
  disconnectedAt?: string;
  duration: number;
  ip?: string;
}

@Injectable()
export class StreamingTokenService {
  private readonly logger = new Logger(StreamingTokenService.name);
  private readonly windowBeforeMinutes: number;
  private readonly windowAfterMinutes: number;
  private readonly maxConcurrentConnections: number;

  constructor(
    @InjectRepository(SessionAttendance)
    private readonly sessionAttendanceRepo: Repository<SessionAttendance>,
    @InjectRepository(EventSession)
    private readonly sessionRepo: Repository<EventSession>,
    @InjectRepository(Attendee)
    private readonly attendeeRepo: Repository<Attendee>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.windowBeforeMinutes = parseInt(
      this.configService.get<string>('STREAMING_TOKEN_WINDOW_BEFORE_MINUTES', '15'),
      10,
    );
    this.windowAfterMinutes = parseInt(
      this.configService.get<string>('STREAMING_TOKEN_WINDOW_AFTER_MINUTES', '30'),
      10,
    );
    this.maxConcurrentConnections = parseInt(
      this.configService.get<string>('STREAMING_MAX_CONCURRENT_CONNECTIONS', '2'),
      10,
    );
  }

  /**
   * Genera un token único de streaming para un asistente en una sesión específica
   * Invalida cualquier token anterior al generar uno nuevo
   */
  async generateToken(
    dto: GenerateStreamingTokenDto,
  ): Promise<GenerateStreamingTokenResult> {
    const { sessionId, attendeeId } = dto;

    // Validar que la sesión existe
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Sesión con ID ${sessionId} no encontrada`);
    }

    // Validar que el asistente existe
    const attendee = await this.attendeeRepo.findOne({
      where: { id: attendeeId },
    });

    if (!attendee) {
      throw new NotFoundException(`Asistente con ID ${attendeeId} no encontrado`);
    }

    // Verificar si ya existe un registro de asistencia para esta sesión/asistente
    let attendance = await this.sessionAttendanceRepo.findOne({
      where: {
        session: { id: sessionId },
        attendee: { id: attendeeId },
      },
      relations: ['session', 'attendee'],
    });

    // Si no existe, crear uno nuevo
    if (!attendance) {
      attendance = this.sessionAttendanceRepo.create({
        session: { id: sessionId } as EventSession,
        attendee: { id: attendeeId } as Attendee,
        virtualConnections: [],
      });
    }

    // Calcular la fecha de expiración (30 minutos después del fin de la sesión)
    const expiresAt = new Date(
      session.endAt.getTime() + this.windowAfterMinutes * 60 * 1000,
    );

    // Crear el payload del token
    const payload: StreamingTokenPayload = {
      sessionId: session.id,
      attendeeId: attendee.id,
      sessionStartAt: session.startAt.toISOString(),
      sessionEndAt: session.endAt.toISOString(),
      type: 'streaming',
    };

    // Generar el token JWT
    const token = this.jwtService.sign(payload, {
      expiresIn: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    // Invalidar el token anterior guardando el nuevo
    attendance.streamingToken = token;
    attendance.virtualConnections = attendance.virtualConnections || [];

    await this.sessionAttendanceRepo.save(attendance);

    this.logger.log(
      `Token de streaming generado para asistente ${attendeeId} en sesión ${sessionId}`,
    );

    return {
      token,
      expiresAt,
      sessionId: session.id,
      attendeeId: attendee.id,
      sessionTitle: session.title,
      sessionStartAt: session.startAt,
      sessionEndAt: session.endAt,
    };
  }

  /**
   * Valida un token de streaming y verifica la ventana temporal
   */
  async validateToken(token: string): Promise<StreamingTokenValidationResult> {
    try {
      // Verificar y decodificar el token
      const payload = this.jwtService.verify<StreamingTokenPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Validar que sea un token de streaming
      if (payload.type !== 'streaming') {
        return {
          valid: false,
          message: 'El token no es un token de streaming válido',
        };
      }

      // Buscar el registro de asistencia
      const attendance = await this.sessionAttendanceRepo.findOne({
        where: {
          session: { id: payload.sessionId },
          attendee: { id: payload.attendeeId },
          streamingToken: token,
        },
        relations: ['session'],
      });

      // Verificar que el token no haya sido invalidado
      if (!attendance || attendance.streamingToken !== token) {
        return {
          valid: false,
          message: 'Token inválido o ha sido reemplazado por uno nuevo',
        };
      }

      // Verificar la ventana temporal
      const session = attendance.session;
      const isWithinWindow = this.isWithinValidWindow(session);

      if (!isWithinWindow) {
        const now = new Date();
        const windowStart = new Date(
          session.startAt.getTime() - this.windowBeforeMinutes * 60 * 1000,
        );
        const windowEnd = new Date(
          session.endAt.getTime() + this.windowAfterMinutes * 60 * 1000,
        );

        if (now < windowStart) {
          return {
            valid: false,
            message: `El acceso al streaming estará disponible ${this.windowBeforeMinutes} minutos antes del inicio de la sesión`,
            sessionId: payload.sessionId,
            attendeeId: payload.attendeeId,
            sessionStartAt: session.startAt,
            sessionEndAt: session.endAt,
          };
        } else {
          return {
            valid: false,
            message: 'La ventana de acceso al streaming ha expirado',
            sessionId: payload.sessionId,
            attendeeId: payload.attendeeId,
            sessionStartAt: session.startAt,
            sessionEndAt: session.endAt,
          };
        }
      }

      // Obtener conexiones activas
      const activeConnections = this.getActiveConnectionsCount(
        attendance.virtualConnections || [],
      );

      return {
        valid: true,
        message: 'Token válido y dentro de la ventana de tiempo permitida',
        sessionId: payload.sessionId,
        attendeeId: payload.attendeeId,
        sessionStartAt: session.startAt,
        sessionEndAt: session.endAt,
        activeConnections,
      };
    } catch (error) {
      this.logger.error(`Error validando token: ${error.message}`);
      return {
        valid: false,
        message: `Token inválido o expirado: ${error.message}`,
      };
    }
  }

  /**
   * Registra una nueva conexión al streaming
   */
  async registerConnection(token: string, ip: string): Promise<void> {
    // Validar el token primero
    const validation = await this.validateToken(token);

    if (!validation.valid) {
      throw new UnauthorizedException(validation.message);
    }

    // Decodificar el token para obtener la información
    const payload = this.jwtService.verify<StreamingTokenPayload>(token, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    // Buscar el registro de asistencia
    const attendance = await this.sessionAttendanceRepo.findOne({
      where: {
        session: { id: payload.sessionId },
        attendee: { id: payload.attendeeId },
      },
    });

    if (!attendance) {
      throw new NotFoundException('Registro de asistencia no encontrado');
    }

    // Verificar el límite de conexiones simultáneas
    const virtualConnections = attendance.virtualConnections || [];
    const activeConnections = virtualConnections.filter(
      (conn) => !conn.disconnectedAt,
    );

    if (activeConnections.length >= this.maxConcurrentConnections) {
      throw new BadRequestException(
        `Se ha alcanzado el límite máximo de ${this.maxConcurrentConnections} conexiones simultáneas`,
      );
    }

    // Verificar si ya existe una conexión activa desde esta IP
    const existingConnection = activeConnections.find((conn) => conn.ip === ip);

    if (existingConnection) {
      this.logger.warn(
        `Conexión ya existente desde IP ${ip} para sesión ${payload.sessionId}`,
      );
      return;
    }

    // Registrar la nueva conexión
    const newConnection: VirtualConnection = {
      connectedAt: new Date().toISOString(),
      duration: 0,
      ip,
    };

    attendance.virtualConnections = [...virtualConnections, newConnection];
    await this.sessionAttendanceRepo.save(attendance);

    this.logger.log(
      `Conexión registrada desde IP ${ip} para asistente ${payload.attendeeId} en sesión ${payload.sessionId}`,
    );
  }

  /**
   * Registra la desconexión de un streaming
   */
  async disconnectSession(token: string, ip: string): Promise<void> {
    try {
      // Decodificar el token
      const payload = this.jwtService.verify<StreamingTokenPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Buscar el registro de asistencia
      const attendance = await this.sessionAttendanceRepo.findOne({
        where: {
          session: { id: payload.sessionId },
          attendee: { id: payload.attendeeId },
        },
      });

      if (!attendance) {
        throw new NotFoundException('Registro de asistencia no encontrado');
      }

      const virtualConnections = attendance.virtualConnections || [];

      // Buscar la conexión activa desde esta IP
      const connectionIndex = virtualConnections.findIndex(
        (conn) => conn.ip === ip && !conn.disconnectedAt,
      );

      if (connectionIndex === -1) {
        this.logger.warn(
          `No se encontró conexión activa desde IP ${ip} para sesión ${payload.sessionId}`,
        );
        return;
      }

      // Actualizar la conexión con la hora de desconexión y duración
      const connection = virtualConnections[connectionIndex];
      const disconnectedAt = new Date();
      const connectedAt = new Date(connection.connectedAt);
      const duration = Math.floor(
        (disconnectedAt.getTime() - connectedAt.getTime()) / (1000 * 60),
      );

      virtualConnections[connectionIndex] = {
        ...connection,
        disconnectedAt: disconnectedAt.toISOString(),
        duration,
      };

      attendance.virtualConnections = virtualConnections;

      // Actualizar los minutos asistidos (suma de todas las duraciones)
      const totalMinutes = virtualConnections.reduce(
        (sum, conn) => sum + (conn.duration || 0),
        0,
      );
      attendance.minutesAttended = totalMinutes;

      await this.sessionAttendanceRepo.save(attendance);

      this.logger.log(
        `Desconexión registrada desde IP ${ip} para asistente ${payload.attendeeId} en sesión ${payload.sessionId}. Duración: ${duration} minutos`,
      );
    } catch (error) {
      this.logger.error(`Error al registrar desconexión: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene las conexiones activas para un token
   */
  async getActiveConnections(token: string): Promise<GetActiveConnectionsResult> {
    // Validar el token
    const validation = await this.validateToken(token);

    if (!validation.valid) {
      throw new UnauthorizedException(validation.message);
    }

    // Decodificar el token
    const payload = this.jwtService.verify<StreamingTokenPayload>(token, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    // Buscar el registro de asistencia
    const attendance = await this.sessionAttendanceRepo.findOne({
      where: {
        session: { id: payload.sessionId },
        attendee: { id: payload.attendeeId },
      },
    });

    if (!attendance) {
      throw new NotFoundException('Registro de asistencia no encontrado');
    }

    const virtualConnections = attendance.virtualConnections || [];

    // Filtrar solo las conexiones activas
    const activeConnections = virtualConnections.filter(
      (conn) => !conn.disconnectedAt,
    );

    // Mapear a DTOs
    const connectionDtos: ActiveConnectionDto[] = virtualConnections.map((conn) => ({
      ip: conn.ip || 'desconocida',
      connectedAt: conn.connectedAt,
      disconnectedAt: conn.disconnectedAt,
      duration: conn.duration,
    }));

    return {
      totalActive: activeConnections.length,
      maxAllowed: this.maxConcurrentConnections,
      connections: connectionDtos,
      canConnect: activeConnections.length < this.maxConcurrentConnections,
    };
  }

  /**
   * Verifica si la sesión está dentro de la ventana de validez
   * (15 minutos antes del inicio hasta 30 minutos después del fin)
   */
  isWithinValidWindow(session: EventSession): boolean {
    const now = new Date();
    const windowStart = new Date(
      session.startAt.getTime() - this.windowBeforeMinutes * 60 * 1000,
    );
    const windowEnd = new Date(
      session.endAt.getTime() + this.windowAfterMinutes * 60 * 1000,
    );

    return now >= windowStart && now <= windowEnd;
  }

  /**
   * Cuenta el número de conexiones activas (sin disconnectedAt)
   */
  private getActiveConnectionsCount(
    connections: VirtualConnection[],
  ): number {
    return connections.filter((conn) => !conn.disconnectedAt).length;
  }

  /**
   * Limpia conexiones huérfanas (para mantenimiento)
   * Cierra automáticamente conexiones que llevan más tiempo del esperado
   */
  async cleanupOrphanedConnections(): Promise<void> {
    this.logger.log('Iniciando limpieza de conexiones huérfanas...');

    const attendances = await this.sessionAttendanceRepo.find({
      where: {},
      relations: ['session'],
    });

    let cleanedCount = 0;

    for (const attendance of attendances) {
      if (!attendance.virtualConnections || attendance.virtualConnections.length === 0) {
        continue;
      }

      const session = attendance.session;
      const sessionEndTime = new Date(
        session.endAt.getTime() + this.windowAfterMinutes * 60 * 1000,
      );
      const now = new Date();

      // Si la sesión ya terminó y pasó la ventana, cerrar todas las conexiones activas
      if (now > sessionEndTime) {
        let modified = false;
        const updatedConnections = attendance.virtualConnections.map((conn) => {
          if (!conn.disconnectedAt) {
            const connectedAt = new Date(conn.connectedAt);
            const duration = Math.floor(
              (sessionEndTime.getTime() - connectedAt.getTime()) / (1000 * 60),
            );
            modified = true;
            cleanedCount++;
            return {
              ...conn,
              disconnectedAt: sessionEndTime.toISOString(),
              duration: Math.max(0, duration),
            };
          }
          return conn;
        });

        if (modified) {
          attendance.virtualConnections = updatedConnections;
          const totalMinutes = updatedConnections.reduce(
            (sum, conn) => sum + (conn.duration || 0),
            0,
          );
          attendance.minutesAttended = totalMinutes;
          await this.sessionAttendanceRepo.save(attendance);
        }
      }
    }

    this.logger.log(
      `Limpieza completada. Se cerraron ${cleanedCount} conexiones huérfanas`,
    );
  }
}
