import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { I18nService, I18nContext } from 'nestjs-i18n';

import { v4 as uuidv4 } from 'uuid';
import { MailService } from 'src/mail/mail.service';
import { User } from 'src/users/entities/user.entity';
import { RedisService } from 'src/redis/redis.service';
import { ConsentService } from 'src/common/services/consent.service';
import { ConsentType } from 'src/common/enums/consent-type.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
    private readonly consentService: ConsentService,
  ) {}

  async login(
    loginDto: LoginAuthDto,
    metadata?: { userAgent?: string; ip?: string },
  ) {
    const { email, password } = loginDto;
    const user = await this.usersService.findOneByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException(
        this.i18n.t('auth.invalid_credentials', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }
    if (!user.isActive) {
      throw new ForbiddenException(
        this.i18n.t('auth.account_disabled', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }
    if (!user.isVerified) {
      throw new ForbiddenException(
        this.i18n.t('auth.verify_email_before_login', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const tokens = await this.getTokens(
      user.id,
      user.email,
      user.role.name,
      user.isVerified,
    );
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    // Actualizar último acceso
    await this.usersService.updateLastLogin(user.id);

    // Registrar sesión activa
    const refreshExpires =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const expiresMs = this.parseExpiresIn(refreshExpires);
    await this.redisService.registerActiveSession(user.id, tokens.sessionId, {
      userAgent: metadata?.userAgent,
      ip: metadata?.ip,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiresMs,
    });

    return {
      ...tokens,
      user: {
        email: user.email,
        role: user.role.name,
        firstName: user.profile?.firstName || null,
        lastName: user.profile?.lastName || null,
        avatar: user.profile?.avatar || null,
      },
    };
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 días

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }

  async register(
    registerDto: RegisterAuthDto,
    metadata?: { userAgent?: string; ip?: string },
  ) {
    // Validar que los consentimientos obligatorios estén aceptados
    if (!registerDto.acceptTerms || !registerDto.acceptPrivacy) {
      throw new BadRequestException(
        this.i18n.t('consent.required_for_registration', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const role = await this.usersService.findRoleByName('USER');
    if (!role)
      throw new BadRequestException(
        this.i18n.t('auth.role_not_configured', {
          lang: I18nContext.current()?.lang,
        }),
      );

    const newUser = await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
      roleId: role.id,
    });

    const verificationToken = uuidv4();
    const hashedVerificationToken = this.hashToken(verificationToken);

    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    await this.usersService.setVerificationData(
      newUser.id,
      hashedVerificationToken,
      expires,
    );

    // Registrar consentimientos
    const consents: Array<{
      consentType: ConsentType;
      documentVersion: string;
      metadata?: Record<string, any>;
    }> = [];

    // Términos y Condiciones (obligatorio)
    if (registerDto.acceptTerms) {
      consents.push({
        consentType: ConsentType.TERMS_AND_CONDITIONS,
        documentVersion:
          registerDto.termsVersion ||
          this.consentService.getCurrentDocumentVersion(
            ConsentType.TERMS_AND_CONDITIONS,
          ),
        metadata: { source: 'registration', userId: newUser.id },
      });
    }

    // Política de Privacidad (obligatorio)
    if (registerDto.acceptPrivacy) {
      consents.push({
        consentType: ConsentType.PRIVACY_POLICY,
        documentVersion:
          registerDto.privacyVersion ||
          this.consentService.getCurrentDocumentVersion(
            ConsentType.PRIVACY_POLICY,
          ),
        metadata: { source: 'registration', userId: newUser.id },
      });
    }

    // Marketing (opcional)
    if (registerDto.acceptMarketing) {
      consents.push({
        consentType: ConsentType.MARKETING,
        documentVersion:
          this.consentService.getCurrentDocumentVersion(ConsentType.MARKETING),
        metadata: { source: 'registration', userId: newUser.id },
      });
    }

    // Procesamiento de Datos (opcional)
    if (registerDto.acceptDataProcessing) {
      consents.push({
        consentType: ConsentType.DATA_PROCESSING,
        documentVersion: this.consentService.getCurrentDocumentVersion(
          ConsentType.DATA_PROCESSING,
        ),
        metadata: { source: 'registration', userId: newUser.id },
      });
    }

    // Registrar todos los consentimientos en bulk
    if (consents.length > 0) {
      try {
        await this.consentService.recordBulkConsents(
          undefined, // personId
          newUser.id, // userId
          consents,
          metadata?.ip,
          metadata?.userAgent,
        );
      } catch (error) {
        // Log error pero no fallar el registro
        console.error('Error recording consents during registration:', error);
      }
    }

    await this.mailService.sendUserWelcome(
      newUser.email,
      newUser.email,
      verificationToken,
    );

    const tokens = await this.getTokens(
      newUser.id,
      newUser.email,
      role.name,
      newUser.isVerified,
    );
    await this.updateRefreshToken(newUser.id, tokens.refresh_token);

    return tokens;
  }

  async verifyUser(token: string) {
    const hashedToken = this.hashToken(token);
    const user =
      await this.usersService.findOneByVerificationToken(hashedToken);

    if (!user) {
      throw new BadRequestException(
        this.i18n.t('auth.invalid_or_expired_verification_token', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (user.isVerified) {
      throw new BadRequestException(
        this.i18n.t('auth.user_already_verified', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (user.verificationExpires && new Date() > user.verificationExpires) {
      throw new BadRequestException(
        this.i18n.t('auth.token_expired_request_new', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    await this.usersService.markAsVerified(user.id);

    await this.mailService.sendAccountConfirmed(user.email, user.email);

    return {
      message: this.i18n.t('auth.email_verified_success', {
        lang: I18nContext.current()?.lang,
      }),
    };
  }

  async resendVerification(email: string) {
    await this.ensureNotThrottled(`resend:${email}`, 60_000);
    const user = await this.usersService.findOneByEmail(email);

    // Por seguridad, no decimos si no existe o si ya está verificado explícitamente
    // Pero para UX, si ya está verificado, podemos avisar.
    if (!user) {
      return {
        message: this.i18n.t('auth.if_email_exists_link_sent', {
          lang: I18nContext.current()?.lang,
        }),
      };
    }
    if (user.isVerified)
      throw new BadRequestException(
        this.i18n.t('auth.user_already_verified', {
          lang: I18nContext.current()?.lang,
        }),
      );

    const newToken = uuidv4();
    const newHashedToken = this.hashToken(newToken);
    const newExpires = new Date();
    newExpires.setHours(newExpires.getHours() + 24); // 24h más

    await this.usersService.setVerificationData(
      user.id,
      newHashedToken,
      newExpires,
    );
    await this.mailService.sendUserWelcome(user.email, user.email, newToken);

    await this.registerThrottleHit(`resend:${email}`, 60_000);
    return {
      message: this.i18n.t('auth.new_verification_email_sent', {
        lang: I18nContext.current()?.lang,
      }),
    };
  }

  async logout(userId: string, jti?: string, exp?: number) {
    // Invalidar refresh token en la base de datos
    await this.updateRefreshToken(userId, null);

    // Si tenemos el JTI del access token, añadirlo a la blacklist
    if (jti && exp) {
      const now = Math.floor(Date.now() / 1000);
      const ttlSeconds = exp - now;
      if (ttlSeconds > 0) {
        await this.redisService.blacklistToken(jti, ttlSeconds * 1000);
      }
    }
  }

  async logoutAllSessions(userId: string) {
    // Invalidar refresh token en la base de datos
    await this.updateRefreshToken(userId, null);
    // Invalidar todas las sesiones del usuario en Redis
    await this.redisService.invalidateUserSessions(userId);
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
    metadata?: { userAgent?: string; ip?: string },
  ) {
    let user: User | null = null;
    try {
      user = await this.usersService.findOne(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new ForbiddenException(
          this.i18n.t('auth.access_denied', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }
      throw error;
    }

    if (!user || !user.currentRefreshToken)
      throw new ForbiddenException(
        this.i18n.t('auth.access_denied', {
          lang: I18nContext.current()?.lang,
        }),
      );
    if (!user.isActive)
      throw new ForbiddenException(
        this.i18n.t('auth.access_denied', {
          lang: I18nContext.current()?.lang,
        }),
      );
    if (!user.isVerified)
      throw new ForbiddenException(
        this.i18n.t('auth.verify_email_before_renew', {
          lang: I18nContext.current()?.lang,
        }),
      );

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.currentRefreshToken,
    );

    if (!refreshTokenMatches)
      throw new ForbiddenException(
        this.i18n.t('auth.access_denied', {
          lang: I18nContext.current()?.lang,
        }),
      );

    const tokens = await this.getTokens(
      user.id,
      user.email,
      user.role.name,
      user.isVerified,
    );
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    // Registrar nueva sesión (refresh también emite sid nuevo)
    const refreshExpires =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const expiresMs = this.parseExpiresIn(refreshExpires);
    await this.redisService.registerActiveSession(user.id, tokens.sessionId, {
      userAgent: metadata?.userAgent,
      ip: metadata?.ip,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiresMs,
    });

    return tokens;
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    if (refreshToken) {
      const hash = await bcrypt.hash(refreshToken, 10);
      await this.usersService.updateRefreshToken(userId, hash);
    } else {
      await this.usersService.updateRefreshToken(userId, null);
    }
  }

  async getTokens(
    userId: string,
    email: string,
    role: string,
    isVerified: boolean,
  ) {
    const sessionId = uuidv4(); // ID único de sesión
    const accessJti = uuidv4();
    const refreshJti = uuidv4();

    const accessPayload = {
      sub: userId,
      email,
      role,
      isVerified,
      jti: accessJti,
      sid: sessionId,
    };
    const refreshPayload = {
      sub: userId,
      email,
      role,
      isVerified,
      jti: refreshJti,
      sid: sessionId,
    };

    const accessSecret = this.configService.get<string>('JWT_SECRET');
    const accessExpires =
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '15m';

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpires =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: accessSecret,
        expiresIn: accessExpires as JwtSignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: refreshExpires as JwtSignOptions['expiresIn'],
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
      sessionId,
    };
  }

  /**
   * Obtener sesiones activas de un usuario
   */
  async getActiveSessions(userId: string, currentSessionId?: string) {
    const sessions = await this.redisService.getActiveSessions(userId);
    return sessions.map((session) => ({
      ...session,
      isCurrent: session.sessionId === currentSessionId,
    }));
  }

  /**
   * Revocar una sesión específica
   */
  async revokeSession(userId: string, sessionId: string) {
    await this.redisService.removeSession(userId, sessionId);
  }

  /**
   * Revocar todas las demás sesiones
   */
  async revokeOtherSessions(userId: string, currentSessionId: string) {
    const removedCount = await this.redisService.removeOtherSessions(
      userId,
      currentSessionId,
    );
    return { removedCount };
  }

  async forgotPassword(email: string) {
    await this.ensureNotThrottled(`forgot:${email}`, 60_000);
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      return {
        message: this.i18n.t('auth.if_email_exists_link_sent', {
          lang: I18nContext.current()?.lang,
        }),
      };
    }

    const token = uuidv4();
    const hashedToken = this.hashToken(token);
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);
    await this.usersService.setResetPasswordData(user.id, hashedToken, expires);

    await this.mailService.sendPasswordReset(user.email, user.email, token);

    await this.registerThrottleHit(`forgot:${email}`, 60_000);
    return {
      message: this.i18n.t('auth.if_email_exists_link_sent', {
        lang: I18nContext.current()?.lang,
      }),
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = this.hashToken(token);
    const user = await this.usersService.findOneByResetToken(hashedToken);

    if (!user) {
      throw new BadRequestException(
        this.i18n.t('auth.invalid_or_expired_token', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (user.resetPasswordExpires && new Date() > user.resetPasswordExpires) {
      throw new BadRequestException(
        this.i18n.t('auth.token_expired', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Consumir el token inmediatamente para evitar reuso concurrente
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedPassword);
    // Garantizar que el token quede invalidado (en caso de que updatePassword se modifique a futuro)
    await this.usersService.consumeResetPasswordToken(user.id);

    return {
      message: this.i18n.t('auth.password_updated_success', {
        lang: I18nContext.current()?.lang,
      }),
    };
  }

  /**
   * Admin-initiated password reset - sends a reset email to the user
   */
  async adminInitiatedPasswordReset(email: string) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new NotFoundException(
        this.i18n.t('users.user_not_found_email', {
          lang: I18nContext.current()?.lang,
          args: { email },
        }),
      );
    }

    const token = uuidv4();
    const hashedToken = this.hashToken(token);
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hours for admin-initiated
    await this.usersService.setResetPasswordData(user.id, hashedToken, expires);

    await this.mailService.sendPasswordReset(user.email, user.email, token);

    return {
      message: this.i18n.t('auth.password_reset_email_sent', {
        lang: I18nContext.current()?.lang,
      }),
    };
  }

  /**
   * Admin sets a new password for a user directly
   */
  async adminSetPassword(email: string, newPassword: string) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new NotFoundException(
        this.i18n.t('users.user_not_found_email', {
          lang: I18nContext.current()?.lang,
          args: { email },
        }),
      );
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedPassword);

    // Clear any existing reset tokens
    await this.usersService.consumeResetPasswordToken(user.id);

    // Send email with new password
    const userName = user.profile?.firstName || user.email;
    await this.mailService.sendAdminResetPassword(user.email, userName, newPassword);

    return {
      message: this.i18n.t('auth.password_set_success', {
        lang: I18nContext.current()?.lang,
      }),
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async ensureNotThrottled(key: string, ttlMs: number): Promise<void> {
    const throttleKey = `throttle:${key}`;
    const lastHit = await this.redisService.get<number>(throttleKey);

    if (lastHit) {
      const now = Date.now();
      if (now - lastHit < ttlMs) {
        throw new ForbiddenException(
          this.i18n.t('auth.too_many_requests', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }
    }
  }

  private async registerThrottleHit(key: string, ttlMs: number): Promise<void> {
    const throttleKey = `throttle:${key}`;
    await this.redisService.set(throttleKey, Date.now(), ttlMs);
  }
}
