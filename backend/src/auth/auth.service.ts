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

@Injectable()
export class AuthService {
  private readonly resendThrottle = new Map<string, number>();
  private readonly forgotThrottle = new Map<string, number>();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly i18n: I18nService,
  ) {}

  async login(loginDto: LoginAuthDto) {
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

    return {
      ...tokens,
      user: { email: user.email, role: user.role.name },
    };
  }

  async register(registerDto: RegisterAuthDto) {
    const role = await this.usersService.findRoleByName('USER');
    if (!role)
      throw new BadRequestException(
        this.i18n.t('auth.role_not_configured', {
          lang: I18nContext.current()?.lang,
        }),
      );

    const newUser = await this.usersService.create({
      ...registerDto,
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
    this.ensureNotThrottled(email, this.resendThrottle, 60_000);
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

    this.registerThrottleHit(email, this.resendThrottle);
    return {
      message: this.i18n.t('auth.new_verification_email_sent', {
        lang: I18nContext.current()?.lang,
      }),
    };
  }

  async logout(userId: string) {
    await this.updateRefreshToken(userId, null);
  }

  async refreshTokens(userId: string, refreshToken: string) {
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
    const payload = { sub: userId, email, role, isVerified };
    const accessSecret = this.configService.get<string>('JWT_SECRET');
    const accessExpires =
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '15m';

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpires =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpires as JwtSignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpires as JwtSignOptions['expiresIn'],
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  async forgotPassword(email: string) {
    this.ensureNotThrottled(email, this.forgotThrottle, 60_000);
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

    this.registerThrottleHit(email, this.forgotThrottle);
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

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedPassword);

    return {
      message: this.i18n.t('auth.password_updated_success', {
        lang: I18nContext.current()?.lang,
      }),
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private ensureNotThrottled(
    email: string,
    store: Map<string, number>,
    ttlMs: number,
  ) {
    const lastHit = store.get(email);
    if (!lastHit) return;

    const now = Date.now();
    if (now - lastHit < ttlMs) {
      throw new ForbiddenException(
        this.i18n.t('auth.too_many_requests', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }
  }

  private registerThrottleHit(email: string, store: Map<string, number>) {
    store.set(email, Date.now());
  }
}
