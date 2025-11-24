import { Body, Controller, Post, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { Public } from './decorators/public.decorator';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// 1. Interfaz para cuando usas JwtAuthGuard (Logout)
// La estrategia JWT mapeaba 'sub' a 'userId', recuerda?
interface RequestWithUserId {
  user: {
    userId: string;
  };
}

// 2. Interfaz para cuando usas RefreshTokenGuard (Refresh)
// La estrategia de Refresh devuelve 'sub' y 'refreshToken'
interface RequestWithRefreshToken {
  user: {
    sub: string;
    refreshToken: string;
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

  @UseGuards(JwtAuthGuard)
  @Get('logout')
  // 3. Usamos la interfaz en lugar de 'any' o 'Req' genérico
  logout(@Req() req: RequestWithUserId) {
    return this.authService.logout(req.user.userId);
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Get('refresh')
  // 4. Usamos la interfaz específica para refresh
  refreshTokens(@Req() req: RequestWithRefreshToken) {
    const userId = req.user.sub;
    const refreshToken = req.user.refreshToken;
    return this.authService.refreshTokens(userId, refreshToken);
  }
}
