import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';
import { EventOwnershipGuard } from './guards/event-ownership.guard';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @UseGuards(EmailVerifiedGuard)
  @Post()
  create(
    @Body() createEventDto: CreateEventDto,
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
}
