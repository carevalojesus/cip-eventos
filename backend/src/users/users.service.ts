import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  // 1. Tipo explícito OBLIGATORIO
  async create(createUserDto: CreateUserDto): Promise<User> {
    const role = await this.roleRepository.findOneBy({
      id: createUserDto.roleId,
    });

    if (!role) {
      throw new NotFoundException(
        `El rol con ID ${createUserDto.roleId} no existe`,
      );
    }

    const emailExists = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });

    if (emailExists) {
      throw new BadRequestException('El correo electrónico ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: role,
    });

    return await this.userRepository.save(newUser);
  }

  // 2. Tipo explícito (Array)
  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      relations: ['role'],
    });
  }

  // 3. Tipo explícito
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);

    return user;
  }

  // 4. Tipo explícito
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const dataToUpdate = { ...updateUserDto };

    if (updateUserDto.password) {
      dataToUpdate.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.userRepository.preload({
      id: id,
      ...dataToUpdate,
    });

    if (!user)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);

    return await this.userRepository.save(user);
  }

  // 5. Tipo explícito
  async remove(id: string): Promise<User> {
    const userEntity = await this.userRepository.findOneBy({ id });

    if (!userEntity) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    userEntity.isActive = false;
    return await this.userRepository.save(userEntity);
  }
}
