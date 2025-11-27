import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CipSeederService } from './cip-seeder.service';
import { memoryStorage } from 'multer';
import { UploadsService } from '../uploads/uploads.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('cip-integration')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN') // Solo el super admin puede actualizar el padrón
export class CipController {
  constructor(
    private readonly seederService: CipSeederService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post('upload-padron')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async uploadPadron(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // Validar que sea CSV (text/csv o application/vnd.ms-excel dependiendo del sistema)
          // new FileTypeValidator({ fileType: 'csv' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    // 1. Subir a Minio (S3) para respaldo/histórico
    const url = await this.uploadsService.uploadFile(
      file.buffer,
      `padron-${Date.now()}.csv`,
      file.mimetype,
    );

    // 2. Procesar desde memoria (Buffer)
    await this.seederService.importCsv(file.buffer);

    return {
      message: 'Padrón importado/actualizado correctamente',
      url,
    };
  }
}
