import { Body, Controller, Post, UseGuards, Get, Param, Res, NotFoundException, BadRequestException } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { RequestAvatarUrlDto } from './dto/request-avatar-url.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from 'src/auth/guards/email-verified.guard';
import { Public } from 'src/auth/decorators/public.decorator';
import type { Response } from 'express';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @Post('avatar-url')
  getAvatarUrl(@Body() body: RequestAvatarUrlDto) {
    return this.uploadsService.getAvatarUploadUrl(
      body.contentType,
      body.contentLength,
    );
  }

  @Public()
  @Get('public/:folder/:file')
  async getPublicFile(
    @Param('folder') folder: string,
    @Param('file') file: string,
    @Res() res: Response,
  ) {
    // Solo permitir acceso a carpetas públicas explícitas
    const allowedPublicFolders = ['events', 'uploads']; // 'uploads' for avatars
    if (!allowedPublicFolders.includes(folder)) {
      throw new NotFoundException('File not found or not public');
    }

    const key = `${folder}/${file}`;
    const url = await this.uploadsService.getSignedUrl(key);
    return res.redirect(url);
  }

  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @Get('private/:folder/:file')
  async getPrivateFile(
    @Param('folder') folder: string,
    @Param('file') file: string,
    @Res() res: Response,
  ) {
    const key = `${folder}/${file}`;
    const url = await this.uploadsService.getSignedUrl(key);
    return res.redirect(url);
  }
}
