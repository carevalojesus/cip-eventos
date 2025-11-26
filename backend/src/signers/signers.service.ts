import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSignerDto } from './dto/create-signer.dto';
import { UpdateSignerDto } from './dto/update-signer.dto';
import { Signer } from './entities/signer.entity';

@Injectable()
export class SignersService {
  constructor(
    @InjectRepository(Signer)
    private readonly signerRepository: Repository<Signer>,
  ) {}

  async create(createSignerDto: CreateSignerDto) {
    const signer = this.signerRepository.create(createSignerDto);
    return this.signerRepository.save(signer);
  }

  async findAll() {
    return this.signerRepository.find();
  }

  async findOne(id: string) {
    const signer = await this.signerRepository.findOne({ where: { id } });
    if (!signer) throw new NotFoundException(`Signer with ID ${id} not found`);
    return signer;
  }

  async update(id: string, updateSignerDto: UpdateSignerDto) {
    const signer = await this.findOne(id);
    Object.assign(signer, updateSignerDto);
    return this.signerRepository.save(signer);
  }

  async remove(id: string) {
    const signer = await this.findOne(id);
    return this.signerRepository.remove(signer);
  }
}
