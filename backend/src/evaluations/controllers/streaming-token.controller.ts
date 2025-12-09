import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { StreamingTokenService } from '../services/streaming-token.service';
import {
  GenerateStreamingTokenDto,
  ValidateStreamingTokenDto,
  StreamingConnectionDto,
  StreamingDisconnectDto,
  GenerateStreamingTokenResult,
  StreamingTokenValidationResult,
  GetActiveConnectionsResult,
} from '../dto/streaming-token.dto';

@ApiTags('Streaming Tokens')
@Controller('streaming')
export class StreamingTokenController {
  constructor(
    private readonly streamingTokenService: StreamingTokenService,
  ) {}

  @Post('generate-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generar token de streaming',
    description:
      'Genera un token único de streaming para un asistente en una sesión específica. Invalida cualquier token anterior.',
  })
  @ApiResponse({
    status: 201,
    description: 'Token generado exitosamente',
    type: GenerateStreamingTokenResult,
  })
  @ApiResponse({
    status: 404,
    description: 'Sesión o asistente no encontrado',
  })
  async generateToken(
    @Body() dto: GenerateStreamingTokenDto,
  ): Promise<GenerateStreamingTokenResult> {
    return this.streamingTokenService.generateToken(dto);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar token de streaming',
    description:
      'Valida un token de streaming y verifica que esté dentro de la ventana temporal permitida (15 min antes - 30 min después).',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado de la validación',
    type: StreamingTokenValidationResult,
  })
  async validateToken(
    @Body() dto: ValidateStreamingTokenDto,
  ): Promise<StreamingTokenValidationResult> {
    return this.streamingTokenService.validateToken(dto.token);
  }

  @Post('connect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar conexión al streaming',
    description:
      'Registra una nueva conexión al streaming. Valida el límite de conexiones simultáneas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Conexión registrada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Límite de conexiones simultáneas alcanzado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido o fuera de la ventana temporal',
  })
  async registerConnection(
    @Body() dto: StreamingConnectionDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    // Obtener IP del cliente desde el request (considerar proxies)
    const ip =
      dto.ip ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown';

    await this.streamingTokenService.registerConnection(dto.token, ip);

    return {
      message: 'Conexión registrada exitosamente',
    };
  }

  @Post('disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar desconexión del streaming',
    description:
      'Registra la desconexión de un streaming y calcula la duración de la conexión.',
  })
  @ApiResponse({
    status: 200,
    description: 'Desconexión registrada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Registro de asistencia o conexión no encontrada',
  })
  async disconnectSession(
    @Body() dto: StreamingDisconnectDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    // Obtener IP del cliente desde el request (considerar proxies)
    const ip =
      dto.ip ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown';

    await this.streamingTokenService.disconnectSession(dto.token, ip);

    return {
      message: 'Desconexión registrada exitosamente',
    };
  }

  @Post('active-connections')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener conexiones activas',
    description:
      'Obtiene la lista de conexiones activas para un token de streaming.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de conexiones activas',
    type: GetActiveConnectionsResult,
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido',
  })
  async getActiveConnections(
    @Body() dto: ValidateStreamingTokenDto,
  ): Promise<GetActiveConnectionsResult> {
    return this.streamingTokenService.getActiveConnections(dto.token);
  }

  @Post('cleanup-orphaned')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Limpiar conexiones huérfanas (Admin)',
    description:
      'Cierra automáticamente conexiones que no se desconectaron correctamente. Solo para administradores.',
  })
  @ApiResponse({
    status: 200,
    description: 'Limpieza completada',
  })
  async cleanupOrphanedConnections(): Promise<{ message: string }> {
    await this.streamingTokenService.cleanupOrphanedConnections();
    return {
      message: 'Limpieza de conexiones huérfanas completada',
    };
  }
}
