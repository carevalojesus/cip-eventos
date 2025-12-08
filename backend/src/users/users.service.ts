import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { I18nService, I18nContext } from 'nestjs-i18n';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { DataDeletionService } from '../persons/services/data-deletion.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly i18n: I18nService,
    @Inject(forwardRef(() => DataDeletionService))
    private readonly dataDeletionService: DataDeletionService,
    private readonly mailService: MailService,
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

    // Guardar la contraseña original antes de hashear (para enviar por correo)
    const originalPassword = createUserDto.password;
    const hashedPassword = await bcrypt.hash(originalPassword, 10);

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: role,
      isVerified: false,
      verificationToken,
      verificationExpires,
      verificationEmailSentAt: new Date(),
    });

    const savedUser = await this.userRepository.save(newUser);

    // Enviar correo de bienvenida con credenciales
    try {
      await this.mailService.sendAdminCreatedUser(
        savedUser.email,
        savedUser.email, // Usar email como nombre (el perfil se crea después)
        originalPassword,
        verificationToken,
      );
    } catch (error) {
      // Log error pero no fallar la creación del usuario
      console.error('Error sending admin created user email:', error);
    }

    return savedUser;
  }

  async findAll(includeInactive: boolean = false): Promise<User[]> {
    const whereCondition = includeInactive ? {} : { isActive: true };
    return await this.userRepository.find({
      where: whereCondition,
      relations: ['role', 'profile'],
      order: {
        isActive: 'DESC',      // Activos primero
        isVerified: 'DESC',    // Verificados después
        createdAt: 'DESC',     // Más recientes primero
      },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
      relations: ['role', 'profile'],
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
      relations: ['role', 'profile'],
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

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
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
      verificationEmailSentAt: new Date(),
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

  async consumeResetPasswordToken(id: string): Promise<void> {
    await this.userRepository.update(id, {
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }

  async requestDeletion(userId: string, reason?: string): Promise<void> {
    return this.dataDeletionService.requestDeletion(userId, reason);
  }
}
