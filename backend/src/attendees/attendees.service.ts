import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAttendeeDto } from './dto/create-attendee.dto';
import { UpdateAttendeeDto } from './dto/update-attendee.dto';
import { Attendee } from './entities/attendee.entity';
import { PersonsService } from '../persons/persons.service';

@Injectable()
export class AttendeesService {
  constructor(
    @InjectRepository(Attendee)
    private readonly attendeeRepository: Repository<Attendee>,
    private readonly personsService: PersonsService,
  ) {}

  async create(createAttendeeDto: CreateAttendeeDto) {
    // Primero, buscar o crear la persona
    const person = await this.personsService.findOrCreate({
      firstName: createAttendeeDto.firstName,
      lastName: createAttendeeDto.lastName,
      email: createAttendeeDto.email,
      documentType: createAttendeeDto.documentType,
      documentNumber: createAttendeeDto.documentNumber,
      phone: createAttendeeDto.phone,
    });

    // Crear el attendee vinculado a la persona
    const attendee = this.attendeeRepository.create({
      ...createAttendeeDto,
      person,
    });

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
