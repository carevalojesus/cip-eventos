# File Validation Pipe

Pipe centralizado para validación de archivos subidos mediante Multer en NestJS.

## Características

- Validación de tipos MIME permitidos
- Validación de tamaño máximo de archivo
- Mensajes de error descriptivos en español
- Configuración flexible mediante opciones
- Soporte para archivos opcionales

## Uso Básico

```typescript
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';

@Post('upload')
@UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
async uploadFile(
  @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
) {
  // El archivo ya está validado aquí
  return { url: await this.uploadService.upload(file) };
}
```

## Opciones de Configuración

### allowedMimeTypes

Array de tipos MIME permitidos. Por defecto acepta imágenes: `['image/jpeg', 'image/png', 'image/webp', 'image/gif']`

```typescript
@UploadedFile(
  new FileValidationPipe({
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml'],
  })
)
```

### maxSizeBytes

Tamaño máximo en bytes. Por defecto es 5MB (5 \* 1024 \* 1024).

```typescript
@UploadedFile(
  new FileValidationPipe({
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
  })
)
```

### required

Si el archivo es requerido. Por defecto es `true`.

```typescript
@UploadedFile(
  new FileValidationPipe({
    required: false, // El archivo es opcional
  })
)
```

## Ejemplos Completos

### Archivo de Imagen Requerido

```typescript
@Post('upload-image')
@UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
async uploadImage(
  @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
) {
  // Validaciones por defecto:
  // - MIME: image/jpeg, image/png, image/webp, image/gif
  // - Tamaño máximo: 5MB
  // - Requerido: sí
  return { url: await this.uploadService.uploadImage(file) };
}
```

### Archivo PDF Opcional con Límite de 10MB

```typescript
@Post('upload-document')
@UseInterceptors(FileInterceptor('document', { storage: memoryStorage() }))
async uploadDocument(
  @UploadedFile(
    new FileValidationPipe({
      allowedMimeTypes: ['application/pdf'],
      maxSizeBytes: 10 * 1024 * 1024, // 10MB
      required: false,
    })
  ) file: Express.Multer.File,
) {
  if (file) {
    return { url: await this.uploadService.uploadDocument(file) };
  }
  return { message: 'No se proporcionó documento' };
}
```

### Múltiples Tipos de Archivo

```typescript
@Post('upload-media')
@UseInterceptors(FileInterceptor('media', { storage: memoryStorage() }))
async uploadMedia(
  @UploadedFile(
    new FileValidationPipe({
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'video/webm',
      ],
      maxSizeBytes: 50 * 1024 * 1024, // 50MB para videos
    })
  ) file: Express.Multer.File,
) {
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');

  if (isImage) {
    return { url: await this.uploadService.uploadImage(file) };
  } else if (isVideo) {
    return { url: await this.uploadService.uploadVideo(file) };
  }
}
```

## Mensajes de Error

El pipe lanza `BadRequestException` con mensajes descriptivos:

- **Archivo requerido no proporcionado**: `"El archivo es requerido"`
- **Tipo MIME inválido**: `"Tipo de archivo inválido. Formatos permitidos: JPEG, PNG, WEBP, GIF"`
- **Tamaño excedido**: `"El tamaño del archivo excede el límite de 5.00MB"`
- **Archivo vacío**: `"El archivo está vacío"`

## Migración desde Validación Manual

### Antes

```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
async upload(@UploadedFile() file: Express.Multer.File) {
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new BadRequestException('Invalid image type. Allowed: PNG, JPG, WebP');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new BadRequestException('Image size exceeds 5MB limit');
  }

  // ... resto del código
}
```

### Después

```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
async upload(
  @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
) {
  // El archivo ya está validado
  // ... resto del código
}
```

## Tests

El pipe incluye tests completos que puedes ejecutar con:

```bash
npm test -- file-validation.pipe.spec.ts
```

## Notas

- El pipe valida el archivo antes de que llegue al controlador
- Los errores son lanzados automáticamente como `BadRequestException`
- Compatible con cualquier controlador que use `@UploadedFile()` de NestJS
- Funciona con cualquier storage de Multer (memory, disk, etc.)
