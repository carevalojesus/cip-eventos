import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { Speaker } from './entities/speaker.entity';

@Injectable()
export class SpeakersService {
  constructor(
    @InjectRepository(Speaker)
    private readonly speakerRepository: Repository<Speaker>,
  ) {}

  async create(createSpeakerDto: CreateSpeakerDto) {
    const speaker = this.speakerRepository.create(createSpeakerDto);
    return this.speakerRepository.save(speaker);
  }

  findAll() {
    return this.speakerRepository.find({
      where: { isActive: true },
    });
  }

  async findOne(id: string) {
    const speaker = await this.speakerRepository.findOne({
      where: { id, isActive: true },
    });
    if (!speaker) {
      throw new NotFoundException(`Speaker with ID ${id} not found`);
    }
    return speaker;
  }

  async update(id: string, updateSpeakerDto: UpdateSpeakerDto) {
    // Verificar que el speaker existe y está activo
    const existingSpeaker = await this.speakerRepository.findOne({
      where: { id, isActive: true },
    });
    if (!existingSpeaker) {
      throw new NotFoundException(`Speaker with ID ${id} not found`);
    }

    const speaker = await this.speakerRepository.preload({
      id,
      ...updateSpeakerDto,
    });

    if (!speaker) {
      throw new NotFoundException(`Speaker with ID ${id} not found`);
    }

    return this.speakerRepository.save(speaker);
  }

  async remove(id: string) {
    const speaker = await this.speakerRepository.findOne({
      where: { id, isActive: true },
    });

    if (!speaker) {
      throw new NotFoundException(`Speaker with ID ${id} not found`);
    }

    // Soft delete: marcar como inactivo
    speaker.isActive = false;
    return this.speakerRepository.save(speaker);
  }
}
