import { Injectable, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

// 1. Definimos qué esperamos recibir del JWT
interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  isVerified: boolean;
}

// 2. Definimos qué vamos a devolver (lo anterior + el string del token)
interface RefreshTokenPayload extends JwtPayload {
  refreshToken: string;
}

// Función para extraer el token de la cookie o del header
const extractRefreshToken = (req: Request): string | null => {
  // Primero intentar obtener de la cookie httpOnly
  if (req.cookies && req.cookies.refresh_token) {
    return req.cookies.refresh_token;
  }
  // Fallback: obtener del header Authorization (para retrocompatibilidad)
  const authHeader = req.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim();
  }
  return null;
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractRefreshToken]),
      secretOrKey:
        configService.get<string>('JWT_REFRESH_SECRET') || 'refresh_secret',
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): RefreshTokenPayload {
    const refreshToken = extractRefreshToken(req);

    if (!refreshToken) {
      throw new ForbiddenException('Token de refresco no encontrado');
    }

    return {
      ...payload,
      refreshToken,
    };
  }
}
