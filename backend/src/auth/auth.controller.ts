import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { Public } from './decorators/public.decorator';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailVerifiedGuard } from './guards/email-verified.guard';

// 1. Interfaz para cuando usas JwtAuthGuard (Logout)
// La estrategia JWT mapeaba 'sub' a 'userId', recuerda?
interface RequestWithUserId {
  user: {
    userId: string;
  };
}

interface RequestWithRefreshToken {
  user: {
    sub: string;
    refreshToken: string;
    isVerified: boolean;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @Public()
  @Post('register')
  register(@Body() registerDto: RegisterAuthDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @Post('logout')
  // 3. Usamos la interfaz en lugar de 'any' o 'Req' genérico
  logout(@Req() req: RequestWithUserId) {
    return this.authService.logout(req.user.userId);
  }

  @Public()
  @UseGuards(RefreshTokenGuard, EmailVerifiedGuard)
  @Post('refresh')
  // 4. Usamos la interfaz específica para refresh
  refreshTokens(@Req() req: RequestWithRefreshToken) {
    const userId = req.user.sub;
    const refreshToken = req.user.refreshToken;
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Public()
  @Get('confirm')
  async confirm(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token requerido');
    }
    return this.authService.verifyUser(token);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(
    @Query('token') token: string,
    @Body() resetDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(token, resetDto.newPassword);
  }

  @Public()
  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }
}
