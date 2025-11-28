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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { I18nService, I18nContext } from 'nestjs-i18n';
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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly i18n: I18nService,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user', description: 'Authenticate user with email and password, returns JWT tokens and user profile' })
  @ApiResponse({ status: 200, description: 'Login successful, returns access_token, refresh_token, and user data' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account disabled or email not verified' })
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new user', description: 'Create a new user account and send verification email' })
  @ApiResponse({ status: 201, description: 'User registered successfully, verification email sent' })
  @ApiResponse({ status: 400, description: 'Invalid input or email already exists' })
  register(@Body() registerDto: RegisterAuthDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout user', description: 'Invalidate refresh token and logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logout(@Req() req: RequestWithUserId) {
    return this.authService.logout(req.user.userId);
  }

  @Public()
  @UseGuards(RefreshTokenGuard, EmailVerifiedGuard)
  @Post('refresh')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Refresh access token', description: 'Get new access and refresh tokens using valid refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 403, description: 'Invalid or expired refresh token' })
  refreshTokens(@Req() req: RequestWithRefreshToken) {
    const userId = req.user.sub;
    const refreshToken = req.user.refreshToken;
    return this.authService.refreshTokens(userId, refreshToken);
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
  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }
}
