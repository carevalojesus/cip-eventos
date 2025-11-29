import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Req,
  Res,
  Query,
  Param,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { Public } from './decorators/public.decorator';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailVerifiedGuard } from './guards/email-verified.guard';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

// 1. Interfaz para cuando usas JwtAuthGuard (Logout)
// La estrategia JWT mapeaba 'sub' a 'userId', recuerda?
interface RequestWithUserId {
  user: {
    userId: string;
    jti?: string;
    sid?: string;
    iat?: number;
    exp?: number;
  };
  headers: {
    'user-agent'?: string;
  };
  ip?: string;
}

interface RequestWithRefreshToken {
  user: {
    sub: string;
    refreshToken: string;
    isVerified: boolean;
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      path: '/api/auth',
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      path: '/api/auth',
    });
  }

  @Public()
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto para prevenir brute force
  @Post('login')
  @ApiOperation({ summary: 'Login user', description: 'Authenticate user with email and password, returns JWT tokens and user profile' })
  @ApiResponse({ status: 200, description: 'Login successful, returns access_token, refresh_token, and user data' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account disabled or email not verified' })
  async login(
    @Body() loginAuthDto: LoginAuthDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: RequestWithUserId,
  ) {
    const metadata = {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    };
    const result = await this.authService.login(loginAuthDto, metadata);
    this.setRefreshTokenCookie(res, result.refresh_token);
    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Public()
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 registros por minuto
  @Post('register')
  @ApiOperation({ summary: 'Register new user', description: 'Create a new user account and send verification email' })
  @ApiResponse({ status: 201, description: 'User registered successfully, verification email sent' })
  @ApiResponse({ status: 400, description: 'Invalid input or email already exists' })
  async register(
    @Body() registerDto: RegisterAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);
    this.setRefreshTokenCookie(res, result.refresh_token);
    return {
      access_token: result.access_token,
    };
  }

  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout user', description: 'Invalidate refresh token and logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @Req() req: RequestWithUserId,
    @Res({ passthrough: true }) res: Response,
    @Headers('authorization') authHeader: string,
  ) {
    // Extraer jti y exp del token para blacklist
    let jti: string | undefined;
    let exp: number | undefined;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = this.jwtService.decode(token) as { jti?: string; exp?: number } | null;
      jti = decoded?.jti;
      exp = decoded?.exp;
    }

    await this.authService.logout(req.user.userId, jti, exp);
    this.clearRefreshTokenCookie(res);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @Post('logout-all')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout all sessions', description: 'Invalidate all tokens for the user' })
  @ApiResponse({ status: 200, description: 'All sessions logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logoutAll(
    @Req() req: RequestWithUserId,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAllSessions(req.user.userId);
    this.clearRefreshTokenCookie(res);
    return { message: 'All sessions logged out successfully' };
  }

  @Public()
  @UseGuards(RefreshTokenGuard, EmailVerifiedGuard)
  @Post('refresh')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Refresh access token', description: 'Get new access and refresh tokens using valid refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 403, description: 'Invalid or expired refresh token' })
  async refreshTokens(
    @Req() req: RequestWithRefreshToken,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.sub;
    const refreshToken = req.user.refreshToken;
    const result = await this.authService.refreshTokens(userId, refreshToken);
    this.setRefreshTokenCookie(res, result.refresh_token);
    return {
      access_token: result.access_token,
    };
  }

  @Public()
  @Get('confirm')
  @ApiOperation({ summary: 'Confirm email', description: 'Verify user email using confirmation token' })
  @ApiQuery({ name: 'token', type: String, description: 'Email verification token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async confirm(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException(
        this.i18n.t('auth.token_required', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }
    return this.authService.verifyUser(token);
  }

  @Public()
  @Throttle({ short: { limit: 3, ttl: 300000 } }) // 3 solicitudes cada 5 minutos
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset', description: 'Send password reset email to user' })
  @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } } } })
  @ApiResponse({ status: 200, description: 'Password reset email sent if account exists' })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password', description: 'Set new password using reset token' })
  @ApiQuery({ name: 'token', type: String, description: 'Password reset token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(
    @Query('token') token: string,
    @Body() resetDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(token, resetDto.newPassword);
  }

  @Public()
  @Throttle({ short: { limit: 2, ttl: 120000 } }) // 2 solicitudes cada 2 minutos
  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  // ==================== SESIONES ACTIVAS ====================

  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @Get('sessions')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get active sessions', description: 'Get all active sessions for the current user' })
  @ApiResponse({ status: 200, description: 'List of active sessions' })
  async getSessions(@Req() req: RequestWithUserId) {
    return this.authService.getActiveSessions(req.user.userId, req.user.sid);
  }

  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @Post('sessions/:sessionId/revoke')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Revoke a session', description: 'Revoke a specific session by ID' })
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  async revokeSession(
    @Req() req: RequestWithUserId,
    @Param('sessionId') sessionId: string,
  ) {
    await this.authService.revokeSession(req.user.userId, sessionId);
    return { message: 'Session revoked successfully' };
  }

  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @Post('sessions/revoke-others')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Revoke other sessions', description: 'Revoke all sessions except the current one' })
  @ApiResponse({ status: 200, description: 'Other sessions revoked successfully' })
  async revokeOtherSessions(@Req() req: RequestWithUserId) {
    if (!req.user.sid) {
      return { message: 'No session ID found', removedCount: 0 };
    }
    const result = await this.authService.revokeOtherSessions(req.user.userId, req.user.sid);
    return {
      message: `${result.removedCount} sessions revoked successfully`,
      removedCount: result.removedCount,
    };
  }
}
