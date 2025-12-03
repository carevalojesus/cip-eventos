import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

export interface FileValidationOptions {
  allowedMimeTypes?: string[];
  maxSizeBytes?: number;
  required?: boolean;
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly defaultAllowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  private readonly defaultMaxSizeBytes = 5 * 1024 * 1024; // 5MB

  constructor(private readonly options?: FileValidationOptions) {}

  transform(file: Express.Multer.File): Express.Multer.File {
    const allowedMimeTypes =
      this.options?.allowedMimeTypes || this.defaultAllowedMimeTypes;
    const maxSizeBytes = this.options?.maxSizeBytes || this.defaultMaxSizeBytes;
    const required = this.options?.required ?? true;

    // Si el archivo no es requerido y no se proporciona, retornar undefined
    if (!required && !file) {
      return file;
    }

    // Si el archivo es requerido y no se proporciona
    if (required && !file) {
      throw new BadRequestException('El archivo es requerido');
    }

    // Validar MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      const allowedTypes = allowedMimeTypes
        .map((type) => type.split('/')[1].toUpperCase())
        .join(', ');
      throw new BadRequestException(
        `Tipo de archivo inválido. Formatos permitidos: ${allowedTypes}`,
      );
    }

    // Validar tamaño
    if (file.size > maxSizeBytes) {
      const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(
        `El tamaño del archivo excede el límite de ${maxSizeMB}MB`,
      );
    }

    // Validar que el archivo no esté vacío
    if (file.size === 0) {
      throw new BadRequestException('El archivo está vacío');
    }

    return file;
  }
}
