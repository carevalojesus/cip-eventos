import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CourtesiesService } from './courtesies.service';
import { GrantCourtesyDto } from './dto/grant-courtesy.dto';
import { CancelCourtesyDto } from './dto/cancel-courtesy.dto';
import { GrantSpeakerCourtesiesDto } from './dto/grant-speaker-courtesies.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('courtesies')
export class CourtesiesController {
  constructor(private readonly courtesiesService: CourtesiesService) {}

  /**
   * Otorga una cortesía a una persona
   * Solo ORG_ADMIN y SUPER_ADMIN pueden otorgar cortesías
   */
  @Post()
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async grant(
    @Body() dto: GrantCourtesyDto,
    @CurrentUser() user: User,
  ) {
    return this.courtesiesService.grant(dto, user);
  }

  /**
   * Cancela una cortesía
   * Solo ORG_ADMIN y SUPER_ADMIN pueden cancelar cortesías
   */
  @Delete(':id')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelCourtesyDto,
    @CurrentUser() user: User,
  ) {
    return this.courtesiesService.cancel(id, dto, user);
  }

  /**
   * Obtiene todas las cortesías de un evento
   * Solo ORG_ADMIN y SUPER_ADMIN pueden ver cortesías
   */
  @Get('event/:eventId')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  async findByEvent(@Param('eventId') eventId: string) {
    return this.courtesiesService.findByEvent(eventId);
  }

  /**
   * Obtiene todas las cortesías de una persona
   * Cualquier usuario autenticado puede ver sus propias cortesías
   */
  @Get('person/:personId')
  async findByPerson(@Param('personId') personId: string) {
    return this.courtesiesService.findByPerson(personId);
  }

  /**
   * Obtiene una cortesía por ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.courtesiesService.findOne(id);
  }

  /**
   * Otorga cortesías automáticas a todos los ponentes de un evento
   * Solo ORG_ADMIN y SUPER_ADMIN pueden ejecutar esta acción
   */
  @Post('event/:eventId/grant-speakers')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async grantSpeakerCourtesies(
    @Param('eventId') eventId: string,
    @Body() dto: GrantSpeakerCourtesiesDto,
    @CurrentUser() user: User,
  ) {
    return this.courtesiesService.grantSpeakerCourtesies(eventId, dto, user);
  }

  /**
   * Obtiene estadísticas de cortesías de un evento
   * Solo ORG_ADMIN y SUPER_ADMIN pueden ver estadísticas
   */
  @Get('event/:eventId/stats')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN')
  async getEventStats(@Param('eventId') eventId: string) {
    return this.courtesiesService.getEventStats(eventId);
  }
}
