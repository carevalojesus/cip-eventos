import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  UseGuards,
  Logger,
  BadRequestException,
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
  private readonly logger = new Logger(CipController.name);

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
    this.logger.log(
      `Recibido archivo CSV: ${file.originalname} (${file.size} bytes)`,
    );

    // Validar que el archivo existe
    if (!file || !file.buffer) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    // Validar que el archivo no está vacío
    if (file.size === 0) {
      throw new BadRequestException('El archivo está vacío');
    }

    try {
      // 1. Subir a Minio (S3) para respaldo/histórico
      this.logger.log('Subiendo archivo a Minio...');
      const url = await this.uploadsService.uploadFile(
        file.buffer,
        `padron-${Date.now()}.csv`,
        file.mimetype,
      );
      this.logger.log(`Archivo subido a: ${url}`);

      // 2. Procesar desde memoria (Buffer)
      this.logger.log('Iniciando procesamiento del CSV...');
      await this.seederService.importCsv(file.buffer);
      this.logger.log('Procesamiento completado exitosamente');

      return {
        message: 'Padrón importado/actualizado correctamente',
        url,
      };
    } catch (error) {
      this.logger.error(
        `Error al procesar el archivo: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
