import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { ConfigService } from '@nestjs/config';

import { v4 as uuidv4 } from 'uuid';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async login(loginDto: LoginAuthDto) {
    const { email, password } = loginDto;
    const user = await this.usersService.findOneByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role.name);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return {
      ...tokens,
      user: { email: user.email, role: user.role.name },
    };
  }

  async register(registerDto: RegisterAuthDto) {
    const role = await this.usersService.findRoleByName('USER');
    if (!role) throw new BadRequestException('Rol no configurado');

    const newUser = await this.usersService.create({
      ...registerDto,
      roleId: role.id,
    });

    const verificationToken = uuidv4();

    // Guardamos el token en la DB
    await this.usersService.setVerificationToken(newUser.id, verificationToken);

    // 2. Enviar correo
    await this.mailService.sendUserWelcome(
      newUser.email,
      newUser.email,
      verificationToken,
    );

    const tokens = await this.getTokens(newUser.id, newUser.email, role.name);
    await this.updateRefreshToken(newUser.id, tokens.refresh_token);

    return tokens;
  }

  async verifyUser(token: string) {
    const user = await this.usersService.findOneByVerificationToken(token);

    if (!user) {
      throw new BadRequestException(
        'Token de verificación inválido o expirado',
      );
    }

    if (user.isVerified) {
      throw new BadRequestException('El usuario ya está verificado');
    }

    await this.usersService.markAsVerified(user.id);

    return { message: 'Email verificado exitosamente' };
  }

  async logout(userId: string) {
    await this.updateRefreshToken(userId, null);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findOne(userId);

    if (!user || !user.currentRefreshToken)
      throw new ForbiddenException('Acceso Denegado');

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.currentRefreshToken,
    );

    if (!refreshTokenMatches) throw new ForbiddenException('Acceso Denegado');

    const tokens = await this.getTokens(user.id, user.email, user.role.name);
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

  async getTokens(userId: string, email: string, role: string) {
    const accessSecret = this.configService.get<string>('JWT_SECRET');
    const accessExpires =
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '15m';

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpires =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: accessSecret,
          // 👇 SOLUCIÓN MAESTRA (Sin 'any'):
          // Usamos el tipo exacto que la librería espera.
          expiresIn: accessExpires as JwtSignOptions['expiresIn'],
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, role },
        {
          secret: refreshSecret,
          // 👇 Aquí también
          expiresIn: refreshExpires as JwtSignOptions['expiresIn'],
        },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      return { message: 'Si el correo existe, se ha enviado un enlace.' };
    }

    const token = uuidv4();
    await this.usersService.setResetPasswordToken(user.id, token);

    await this.mailService.sendPasswordReset(user.email, user.email, token);

    return { message: 'Si el correo existe, se ha enviado un enlace.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findOneByResetToken(token);

    if (!user) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersService.updatePassword(user.id, hashedPassword);

    return { message: 'Contraseña actualizada exitosamente' };
  }
}
