import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAttendeeDto } from './dto/create-attendee.dto';
import { UpdateAttendeeDto } from './dto/update-attendee.dto';
import { Attendee } from './entities/attendee.entity';

@Injectable()
export class AttendeesService {
  constructor(
    @InjectRepository(Attendee)
    private readonly attendeeRepository: Repository<Attendee>,
  ) {}

  create(createAttendeeDto: CreateAttendeeDto) {
    const attendee = this.attendeeRepository.create(createAttendeeDto);
    return this.attendeeRepository.save(attendee);
  }

  findAll() {
    return this.attendeeRepository.find();
  }

  async findOne(id: string) {
    const attendee = await this.attendeeRepository.findOneBy({ id });
    if (!attendee)
      throw new NotFoundException(`Attendee with ID ${id} not found`);
    return attendee;
  }

  async findByEmail(email: string) {
    return this.attendeeRepository.findOneBy({ email });
  }

  async findByDocument(documentNumber: string) {
    return this.attendeeRepository.findOneBy({ documentNumber });
  }

  async update(id: string, updateAttendeeDto: UpdateAttendeeDto) {
    const attendee = await this.findOne(id);
    this.attendeeRepository.merge(attendee, updateAttendeeDto);
    return this.attendeeRepository.save(attendee);
  }

  async remove(id: string) {
    const attendee = await this.findOne(id);
    return this.attendeeRepository.remove(attendee);
  }
}
