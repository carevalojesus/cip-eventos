import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

// Entidades
import {
  Registration,
  RegistrationStatus,
} from './entities/registration.entity';
import { EventTicket } from '../events/entities/event-ticket.entity';
import { Attendee, DocumentType } from '../attendees/entities/attendee.entity';
import { User } from '../users/entities/user.entity';
import { EventStatus } from '../events/entities/event.entity';

// DTOs y Servicios
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { MailService } from 'src/mail/mail.service';
import { CipIntegrationService } from 'src/cip-integration/cip-integration.service';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectRepository(Registration) private regRepo: Repository<Registration>,
    @InjectRepository(EventTicket) private ticketRepo: Repository<EventTicket>,
    @InjectRepository(Attendee) private attendeeRepo: Repository<Attendee>,
    private readonly mailService: MailService,
    private readonly cipService: CipIntegrationService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateRegistrationDto, user?: User | null) {
    const { ticketId } = dto;

    // Usar transacción con bloqueo pesimista para prevenir race conditions
    return await this.dataSource.transaction(
      'SERIALIZABLE',
      async (manager) => {
        // 1. 🎫 BUSCAR TICKET Y EVENTO CON BLOQUEO PESIMISTA
        const ticket = await manager.findOne(EventTicket, {
          where: { id: ticketId },
          relations: ['event', 'event.location'],
          lock: { mode: 'pessimistic_write' }, // 🔒 Bloqueo exclusivo
        });

        if (!ticket) throw new NotFoundException('Entrada no encontrada');
        const event = ticket.event;

        if (event.status !== EventStatus.PUBLISHED)
          throw new BadRequestException('Evento no disponible');

        // 2. 📉 VALIDAR STOCK DE FORMA ATÓMICA
        const soldCount = await manager.count(Registration, {
          where: {
            eventTicket: { id: ticketId },
            status: RegistrationStatus.CONFIRMED,
          },
        });

        if (soldCount >= ticket.stock)
          throw new BadRequestException('Entradas agotadas');

        // 3. 🕵️‍♂️ RESOLVER ATTENDEE (Usuario vs Guest)
        let attendee: Attendee | null;

        if (user) {
          // Usuario Logueado: Buscamos su perfil de asistente
          attendee = await manager.findOne(Attendee, {
            where: { user: { id: user.id } },
          });
          if (!attendee) {
            // Crear perfil rápido basado en User
            attendee = manager.create(Attendee, {
              email: user.email,
              firstName: 'Usuario',
              lastName: 'Registrado',
              user: user,
              documentType: DocumentType.DNI,
              documentNumber: 'PEND-' + user.id.slice(0, 5),
            });
            attendee = await manager.save(attendee);
          }
        } else {
          // Guest: Validamos datos
          if (!dto.email || !dto.documentNumber || !dto.firstName) {
            throw new BadRequestException('Datos incompletos para invitado');
          }
          // Buscamos si ya existe (Find or Create)
          attendee = await manager.findOne(Attendee, {
            where: [
              { email: dto.email },
              { documentNumber: dto.documentNumber },
            ],
          });

          if (!attendee) {
            attendee = manager.create(Attendee, {
              ...dto,
              documentType: dto.documentType || DocumentType.DNI,
            });
            attendee = await manager.save(attendee);
          } else {
            // 🔒 VALIDAR CIP ANTES de actualizar
            if (dto.cipCode && dto.cipCode !== attendee.cipCode) {
              const cipValidation = await this.cipService.validateCip(
                dto.cipCode,
              );
              if (!cipValidation.isValid) {
                throw new BadRequestException(
                  'Código CIP inválido. Verifique e intente nuevamente.',
                );
              }
              attendee.cipCode = dto.cipCode;
              await manager.save(attendee);
            }
          }
        }

        // 4. 🚫 VALIDAR DUPLICIDAD (Misma persona, mismo evento)
        const existing = await manager.findOne(Registration, {
          where: { attendee: { id: attendee.id }, event: { id: event.id } },
        });
        if (existing)
          throw new BadRequestException('Ya estás inscrito en este evento');

        // 5. 👮‍♂️ REGLAS DE NEGOCIO (CIP)
        if (ticket.requiresCipValidation) {
          if (!attendee.cipCode)
            throw new BadRequestException('Esta entrada requiere Código CIP');

          const cipStatus = await this.cipService.validateCip(attendee.cipCode);
          if (!cipStatus.isHabilitado) {
            throw new BadRequestException(
              'Usted no está habilitado. Elija la entrada General.',
            );
          }
        }

        // 6. 💰 DEFINIR PRECIO Y ESTADO
        const finalPrice = Number(ticket.price);
        let status = RegistrationStatus.PENDING;

        // Lógica de estado inicial
        if (finalPrice === 0) {
          status = RegistrationStatus.CONFIRMED;
        } else {
          status = RegistrationStatus.PENDING;
        }

        // 7. 💾 GUARDAR
        const registration = manager.create(Registration, {
          attendee: attendee,
          eventTicket: ticket,
          event,
          ticketCode: uuidv4(),
          finalPrice,
          status,
        });

        const savedReg = await manager.save(registration);

        // 8. 📧 COMUNICACIÓN
        if (savedReg.status === RegistrationStatus.CONFIRMED) {
          // TODO: Enviar email de confirmación
        } else if (finalPrice > 0) {
          console.log('⏳ Enviar correo de instrucciones de pago...');
        }

        return {
          message: 'Proceso iniciado',
          registrationId: savedReg.id,
          status: savedReg.status,
          price: finalPrice,
        };
      },
    );
  }

  async findAll() {
    return this.regRepo.find();
  }

  async findOne(id: string) {
    const registration = await this.regRepo.findOne({
      where: { id },
      relations: ['attendee', 'event', 'eventTicket'],
    });
    if (!registration) throw new NotFoundException('Registration not found');
    return registration;
  }
}
