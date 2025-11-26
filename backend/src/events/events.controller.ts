import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Inject,
  forwardRef,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { RegistrationsService } from '../registrations/registrations.service';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { EventOwnershipGuard } from './guards/event-ownership.guard';
import { EventModalityValidatorPipe } from './pipes/event-modality-validator.pipe';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    @Inject(forwardRef(() => RegistrationsService))
    private readonly registrationsService: RegistrationsService,
  ) {}

  @UseGuards(EmailVerifiedGuard)
  @Post()
  create(
    @Body(new EventModalityValidatorPipe()) createEventDto: CreateEventDto,
    @CurrentUser() user: { userId: string; email: string; role: string },
  ) {
    return this.eventsService.create(createEventDto, user.userId);
  }

  @Public()
  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  // Endpoint privado para obtener evento con virtualAccess
  // Solo accesible por el creador o admin
  @UseGuards(EmailVerifiedGuard, EventOwnershipGuard)
  @Get(':id/full')
  findOneWithVirtualAccess(@Param('id') id: string) {
    return this.eventsService.findOneWithVirtualAccess(id);
  }

  @UseGuards(EmailVerifiedGuard, EventOwnershipGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @UseGuards(EmailVerifiedGuard, EventOwnershipGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
  @UseGuards(EmailVerifiedGuard, EventOwnershipGuard)
  @Post(':id/speakers')
  addSpeaker(@Param('id') id: string, @Body('speakerId') speakerId: string) {
    return this.eventsService.addSpeaker(id, speakerId);
  }

  @UseGuards(EmailVerifiedGuard, EventOwnershipGuard)
  @Delete(':id/speakers/:speakerId')
  removeSpeaker(
    @Param('id') id: string,
    @Param('speakerId') speakerId: string,
  ) {
    return this.eventsService.removeSpeaker(id, speakerId);
  }

  @UseGuards(EmailVerifiedGuard, EventOwnershipGuard)
  @Post(':id/organizers')
  addOrganizer(
    @Param('id') id: string,
    @Body('organizerId') organizerId: string,
  ) {
    return this.eventsService.addOrganizer(id, organizerId);
  }

  @UseGuards(EmailVerifiedGuard, EventOwnershipGuard)
  @Delete(':id/organizers/:organizerId')
  removeOrganizer(
    @Param('id') id: string,
    @Param('organizerId') organizerId: string,
  ) {
    return this.eventsService.removeOrganizer(id, organizerId);
  }
  @UseGuards(EmailVerifiedGuard, EventOwnershipGuard)
  @Post(':id/sessions')
  addSession(
    @Param('id') eventId: string,
    @Body() createSessionDto: CreateSessionDto,
  ) {
    return this.eventsService.addSessionToEvent(eventId, createSessionDto);
  }

  @Public()
  @Get(':id/sessions')
  getSessionsByEvent(@Param('id') eventId: string) {
    return this.eventsService.getSessionsByEvent(eventId);
  }

  @Public()
  @Get(':id/sessions/:sessionId')
  getSessionById(
    @Param('id') eventId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.eventsService.getSessionById(eventId, sessionId);
  }

  @UseGuards(EmailVerifiedGuard, EventOwnershipGuard)
  @Patch(':id/sessions/:sessionId')
  updateSession(
    @Param('id') eventId: string,
    @Param('sessionId') sessionId: string,
    @Body() updateSessionDto: UpdateSessionDto,
  ) {
    return this.eventsService.updateSession(
      eventId,
      sessionId,
      updateSessionDto,
    );
  }

  @UseGuards(EmailVerifiedGuard, EventOwnershipGuard)
  @Delete(':id/sessions/:sessionId')
  deleteSession(
    @Param('id') eventId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.eventsService.deleteSession(eventId, sessionId);
  }

  // 📊 REPORTES: Estadísticas del evento
  @UseGuards(EmailVerifiedGuard, EventOwnershipGuard)
  @Get(':id/stats')
  getEventStats(@Param('id') id: string) {
    return this.registrationsService.getEventStats(id);
  }

  // 📋 REPORTES: Exportar asistentes
  @UseGuards(EmailVerifiedGuard, EventOwnershipGuard)
  @Get(':id/attendees/export')
  async exportAttendees(@Param('id') id: string, @Res() res: Response) {
    const attendees = await this.registrationsService.getEventAttendees(id);

    // Generar CSV simple
    const csvHeader =
      'Apellido,Nombre,DNI,Email,Ticket,Precio,Estado,Asistió,Hora Ingreso\n';
    const csvRows = attendees
      .map((reg) => {
        return [
          reg.attendee.lastName,
          reg.attendee.firstName,
          reg.attendee.documentNumber,
          reg.attendee.email,
          reg.eventTicket.name,
          reg.finalPrice,
          reg.status,
          reg.attended ? 'SI' : 'NO',
          reg.attendedAt ? reg.attendedAt.toISOString() : '',
        ].join(',');
      })
      .join('\n');

    const csvContent = csvHeader + csvRows;

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="asistentes-evento-${id}.csv"`,
    });

    res.send(csvContent);
  }

  @UseGuards(EmailVerifiedGuard, EventOwnershipGuard)
  @Post(':id/tickets')
  createTicket(
    @Param('id') id: string,
    @Body() createTicketDto: CreateTicketDto,
  ) {
    return this.eventsService.createTicket(id, createTicketDto);
  }
}
