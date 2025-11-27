import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { I18nService, I18nContext } from 'nestjs-i18n';

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
    private readonly i18n: I18nService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const role = await this.roleRepository.findOneBy({
      id: createUserDto.roleId,
    });

    if (!role) {
      throw new NotFoundException(
        this.i18n.t('users.role_not_found', {
          lang: I18nContext.current()?.lang,
          args: { roleId: createUserDto.roleId },
        }),
      );
    }

    const emailExists = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });

    if (emailExists) {
      throw new BadRequestException(
        this.i18n.t('users.email_already_registered', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: role,
    });

    return await this.userRepository.save(newUser);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      where: { isActive: true },
      relations: ['role'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
      relations: ['role'],
    });

    if (!user)
      throw new NotFoundException(
        this.i18n.t('users.user_not_found_id', {
          lang: I18nContext.current()?.lang,
          args: { id },
        }),
      );

    return user;
  }

  // Método auxiliar para el Login (AuthService)
  async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email, isActive: true },
      relations: ['role'],
    });
  }

  // Método auxiliar para el Registro (AuthService)
  async findRoleByName(name: string): Promise<Role | null> {
    return await this.roleRepository.findOneBy({ name });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Logica normal de actualización de datos de usuario
    const dataToUpdate = { ...updateUserDto };

    if (updateUserDto.password) {
      dataToUpdate.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.userRepository.preload({
      id: id,
      ...dataToUpdate,
    });

    if (!user)
      throw new NotFoundException(
        this.i18n.t('users.user_not_found_id', {
          lang: I18nContext.current()?.lang,
          args: { id },
        }),
      );

    return await this.userRepository.save(user);
  }

  async remove(id: string): Promise<User> {
    const userEntity = await this.userRepository.findOneBy({ id });

    if (!userEntity) {
      throw new NotFoundException(
        this.i18n.t('users.user_not_found_id', {
          lang: I18nContext.current()?.lang,
          args: { id },
        }),
      );
    }

    userEntity.isActive = false;
    return await this.userRepository.save(userEntity);
  }

  async updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.userRepository.update(id, {
      currentRefreshToken: refreshToken,
    });
  }

  async findOneByVerificationToken(token: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ verificationToken: token });
  }

  async markAsVerified(id: string): Promise<void> {
    await this.userRepository.update(id, {
      isVerified: true,
      verificationToken: null,
      verificationExpires: null,
    });
  }

  async findOneByResetToken(token: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ resetPasswordToken: token });
  }

  async updatePassword(id: string, newPasswordHash: string): Promise<void> {
    await this.userRepository.update(id, {
      password: newPasswordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }

  async setVerificationData(
    id: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    await this.userRepository.update(id, {
      verificationToken: token,
      verificationExpires: expires,
    });
  }

  async setResetPasswordData(
    id: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    await this.userRepository.update(id, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });
  }
}
