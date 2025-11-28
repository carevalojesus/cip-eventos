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
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { RegistrationsService } from '../registrations/registrations.service';
import { EventsService } from './events.service';
import { UploadsService } from '../uploads/uploads.service';
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
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    @Inject(forwardRef(() => RegistrationsService))
    private readonly registrationsService: RegistrationsService,
    private readonly uploadsService: UploadsService,
  ) {}

  @UseGuards(EmailVerifiedGuard)
  @Post()
  create(
    @Body(new EventModalityValidatorPipe()) createEventDto: CreateEventDto,
    @CurrentUser() user: { userId: string; email: string; role: string },
  ) {
    return this.eventsService.create(createEventDto, user.userId);
  }

  @UseGuards(EmailVerifiedGuard)
  @Post('with-image')
  @UseInterceptors(FileInterceptor('coverImage', { storage: memoryStorage() }))
  async createWithImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('data') dataString: string,
    @CurrentUser() user: { userId: string; email: string; role: string },
  ) {
    if (!dataString) {
      throw new BadRequestException('Event data is required');
    }

    let createEventDto: CreateEventDto;
    try {
      createEventDto = JSON.parse(dataString);
    } catch {
      throw new BadRequestException('Invalid JSON data');
    }

    // Validar modalidad manualmente
    const pipe = new EventModalityValidatorPipe();
    createEventDto = pipe.transform(createEventDto);

    // Si hay archivo, subirlo a S3/MinIO
    if (file) {
      const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('Invalid image type. Allowed: PNG, JPG, WebP');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('Image size exceeds 5MB limit');
      }

      const imageUrl = await this.uploadsService.uploadEventImage(
        file.buffer,
        file.originalname,
        file.mimetype,
      );
      createEventDto.imageUrl = imageUrl;
    }

    return this.eventsService.create(createEventDto, user.userId);
  }

  @Public()
  @Get('types')
  getTypes() {
    return this.eventsService.getTypes();
  }

  @Public()
  @Get('categories')
  getCategories() {
    return this.eventsService.getCategories();
  }

  @Public()
  @Get('modalities')
  getModalities() {
    return this.eventsService.getModalities();
  }

  @Public()
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.eventsService.findAll(paginationDto);
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

    // Helper para escapar valores CSV y prevenir inyección
    const escapeCsvValue = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Si contiene comas, comillas, saltos de línea o empieza con caracteres peligrosos
      // para inyección de fórmulas (=, +, -, @), escapar con comillas dobles
      const needsQuoting = /[,"\n\r]|^[=+\-@\t\r]/.test(stringValue);
      if (needsQuoting) {
        // Escapar comillas dobles duplicándolas y envolver en comillas
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Generar CSV con BOM para Excel y caracteres especiales
    const BOM = '\uFEFF';
    const csvHeader =
      'Apellido,Nombre,DNI,Email,Ticket,Precio,Estado,Asistió,Hora Ingreso\n';
    const csvRows = attendees
      .map((reg) => {
        return [
          escapeCsvValue(reg.attendee.lastName),
          escapeCsvValue(reg.attendee.firstName),
          escapeCsvValue(reg.attendee.documentNumber),
          escapeCsvValue(reg.attendee.email),
          escapeCsvValue(reg.eventTicket.name),
          escapeCsvValue(reg.finalPrice),
          escapeCsvValue(reg.status),
          reg.attended ? 'SI' : 'NO',
          reg.attendedAt ? reg.attendedAt.toISOString() : '',
        ].join(',');
      })
      .join('\n');

    const csvContent = BOM + csvHeader + csvRows;

    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
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
