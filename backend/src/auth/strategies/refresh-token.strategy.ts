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
}

// 2. Definimos qué vamos a devolver (lo anterior + el string del token)
interface RefreshTokenPayload extends JwtPayload {
  refreshToken: string;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:
        configService.get<string>('JWT_REFRESH_SECRET') || 'refresh_secret',
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): RefreshTokenPayload {
    const authHeader = req.get('Authorization');

    if (!authHeader) {
      throw new ForbiddenException('Token de refresco no encontrado');
    }

    // Limpiamos el string "Bearer " para quedarnos solo con el token
    const refreshToken = authHeader.replace('Bearer', '').trim();

    return {
      ...payload,
      refreshToken,
    };
  }
}
