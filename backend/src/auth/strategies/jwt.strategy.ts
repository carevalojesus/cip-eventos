import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisService } from '../../redis/redis.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  isVerified: boolean;
  jti?: string;
  sid?: string; // Session ID
  iat?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    // Verificar si el token está en la blacklist
    if (payload.jti) {
      const isBlacklisted = await this.redisService.isTokenBlacklisted(
        payload.jti,
      );
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    // Verificar si las sesiones del usuario fueron invalidadas después de la emisión del token
    if (payload.iat) {
      const invalidated = await this.redisService.wereSessionsInvalidatedAfter(
        payload.sub,
        payload.iat,
      );
      if (invalidated) {
        throw new UnauthorizedException('Session has been invalidated');
      }
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      isVerified: payload.isVerified,
      jti: payload.jti,
      sid: payload.sid,
      iat: payload.iat,
    };
  }
}
