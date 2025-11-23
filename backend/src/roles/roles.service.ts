import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const role = this.roleRepository.create(createRoleDto);
    return await this.roleRepository.save(role);
  }

  async findAll() {
    // Retornamos solo los que están activos? O todos?
    // Generalmente para un admin quieres ver todos.
    return await this.roleRepository.find();
  }

  async findOne(id: number) {
    const role = await this.roleRepository.findOneBy({ id });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const role = await this.roleRepository.preload({
      id: id,
      ...updateRoleDto,
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return await this.roleRepository.save(role);
  }

  async remove(id: number) {
    // Opción A: Borrado Físico (Desaparece de la DB)
    // return await this.roleRepository.delete(id);

    // Opción B: Borrado Lógico (Recomendado - cambia isActive a false)
    const role = await this.findOne(id);
    role.isActive = false;
    return await this.roleRepository.save(role);
  }
}
