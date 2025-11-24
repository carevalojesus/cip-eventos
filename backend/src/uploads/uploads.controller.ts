import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { RequestAvatarUrlDto } from './dto/request-avatar-url.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from 'src/auth/guards/email-verified.guard';

@Controller('uploads')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('avatar-url')
  getAvatarUrl(@Body() body: RequestAvatarUrlDto) {
    return this.uploadsService.getAvatarUploadUrl(
      body.contentType,
      body.contentLength,
    );
  }
}
