import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../roles/entities/role.entity';

import { BlocksService } from '../services/blocks.service';
import { CreateBlockDto } from '../dto/create-block.dto';
import { UpdateBlockDto } from '../dto/update-block.dto';
import { BlockStatus } from '../entities/evaluable-block.entity';

@Controller('evaluations/blocks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  create(@Body() dto: CreateBlockDto) {
    return this.blocksService.create(dto);
  }

  @Get()
  findAll(@Query('eventId') eventId?: string) {
    return this.blocksService.findAll(eventId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.blocksService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBlockDto,
  ) {
    return this.blocksService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.blocksService.remove(id);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: BlockStatus,
  ) {
    return this.blocksService.updateStatus(id, status);
  }

  @Get(':id/stats')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.blocksService.getBlockStats(id);
  }

  @Get(':id/participants')
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  getParticipants(@Param('id', ParseUUIDPipe) id: string) {
    return this.blocksService.getParticipants(id);
  }
}
