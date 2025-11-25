import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { Organizer } from './entities/organizer.entity';

@Injectable()
export class OrganizersService {
  constructor(
    @InjectRepository(Organizer)
    private readonly organizerRepository: Repository<Organizer>,
  ) {}

  create(createOrganizerDto: CreateOrganizerDto) {
    const organizer = this.organizerRepository.create(createOrganizerDto);
    return this.organizerRepository.save(organizer);
  }

  findAll() {
    return this.organizerRepository.find({
      where: { isActive: true },
    });
  }

  async findOne(id: string) {
    const organizer = await this.organizerRepository.findOne({
      where: { id, isActive: true },
    });
    if (!organizer)
      throw new NotFoundException(`Organizer with ID ${id} not found`);
    return organizer;
  }

  async update(id: string, updateOrganizerDto: UpdateOrganizerDto) {
    const organizer = await this.findOne(id);
    this.organizerRepository.merge(organizer, updateOrganizerDto);
    return this.organizerRepository.save(organizer);
  }

  async remove(id: string) {
    const organizer = await this.findOne(id);
    organizer.isActive = false;
    return this.organizerRepository.save(organizer);
  }
}
