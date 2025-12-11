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
import { AuditService } from '../audit/audit.service';

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
    private readonly auditService: AuditService,
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

    // Registrar auditoría de creación
    await this.auditService.logCreate(
      'User',
      savedUser.id,
      { email: savedUser.email, roleId: savedUser.role?.id },
      undefined,
      undefined,
      undefined,
    );

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

  async findOne(id: string, includeInactive: boolean = false): Promise<User> {
    const whereCondition = includeInactive ? { id } : { id, isActive: true };
    const user = await this.userRepository.findOne({
      where: whereCondition,
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
    // Obtener valores anteriores para auditoría
    const previousUser = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!previousUser)
      throw new NotFoundException(
        this.i18n.t('users.user_not_found_id', {
          lang: I18nContext.current()?.lang,
          args: { id },
        }),
      );

    const previousValues = {
      email: previousUser.email,
      roleId: previousUser.role?.id,
      isActive: previousUser.isActive,
      isVerified: previousUser.isVerified,
    };

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

    const updatedUser = await this.userRepository.save(user);

    // Registrar auditoría de actualización
    const newValues = {
      email: updatedUser.email,
      roleId: updateUserDto.roleId !== undefined ? updateUserDto.roleId : previousUser.role?.id,
      isActive: updatedUser.isActive,
      isVerified: updatedUser.isVerified,
    };

    await this.auditService.logUpdate(
      'User',
      updatedUser.id,
      previousValues,
      newValues,
      undefined,
      undefined,
      undefined,
    );

    return updatedUser;
  }

  async remove(id: string): Promise<User> {
    const userEntity = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!userEntity) {
      throw new NotFoundException(
        this.i18n.t('users.user_not_found_id', {
          lang: I18nContext.current()?.lang,
          args: { id },
        }),
      );
    }

    // Capturar valores anteriores para auditoría
    const previousValues = {
      email: userEntity.email,
      roleId: userEntity.role?.id,
      isActive: userEntity.isActive,
    };

    userEntity.isActive = false;
    const deletedUser = await this.userRepository.save(userEntity);

    // Registrar auditoría de eliminación (soft delete)
    await this.auditService.logDelete(
      'User',
      deletedUser.id,
      previousValues,
      undefined,
      undefined,
      undefined,
    );

    return deletedUser;
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
      forcePasswordReset: false, // Limpiar flag después de cambiar contraseña
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

  /**
   * Verificar correo manualmente (solo SUPER_ADMIN)
   */
  async verifyEmailManually(userId: string, adminId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'profile'],
    });

    if (!user) {
      throw new NotFoundException(
        this.i18n.t('users.user_not_found_id', {
          lang: I18nContext.current()?.lang,
          args: { id: userId },
        }),
      );
    }

    if (user.isVerified) {
      throw new BadRequestException(
        this.i18n.t('users.already_verified', {
          lang: I18nContext.current()?.lang,
          defaultValue: 'El usuario ya está verificado',
        }),
      );
    }

    const previousValues = { isVerified: false };

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationExpires = null;

    const updatedUser = await this.userRepository.save(user);

    // Registrar auditoría
    const admin = await this.userRepository.findOne({ where: { id: adminId } });
    await this.auditService.logUpdate(
      'User',
      updatedUser.id,
      previousValues,
      { isVerified: true },
      admin || undefined,
      undefined,
      undefined,
      'Verificación manual de correo por administrador',
    );

    return updatedUser;
  }

  /**
   * Cambiar rol de usuario (solo SUPER_ADMIN)
   */
  async changeRole(userId: string, roleId: number, adminId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'profile'],
    });

    if (!user) {
      throw new NotFoundException(
        this.i18n.t('users.user_not_found_id', {
          lang: I18nContext.current()?.lang,
          args: { id: userId },
        }),
      );
    }

    const newRole = await this.roleRepository.findOneBy({ id: roleId });

    if (!newRole) {
      throw new NotFoundException(
        this.i18n.t('users.role_not_found', {
          lang: I18nContext.current()?.lang,
          args: { roleId },
        }),
      );
    }

    const previousValues = {
      roleId: user.role?.id,
      roleName: user.role?.name,
    };

    user.role = newRole;
    const updatedUser = await this.userRepository.save(user);

    // Registrar auditoría
    const admin = await this.userRepository.findOne({ where: { id: adminId } });
    await this.auditService.logUpdate(
      'User',
      updatedUser.id,
      previousValues,
      { roleId: newRole.id, roleName: newRole.name },
      admin || undefined,
      undefined,
      undefined,
      'Cambio de rol por administrador',
    );

    return updatedUser;
  }
}
