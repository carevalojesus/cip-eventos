import { BadRequestException } from '@nestjs/common';
import { FileValidationPipe } from './file-validation.pipe';

describe('FileValidationPipe', () => {
  let pipe: FileValidationPipe;

  const createMockFile = (
    mimetype: string,
    size: number,
  ): Express.Multer.File => ({
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype,
    size,
    buffer: Buffer.from('test'),
    stream: null,
    destination: '',
    filename: '',
    path: '',
  });

  describe('with default options', () => {
    beforeEach(() => {
      pipe = new FileValidationPipe();
    });

    it('should accept valid JPEG file', () => {
      const file = createMockFile('image/jpeg', 1024 * 1024); // 1MB
      expect(() => pipe.transform(file)).not.toThrow();
    });

    it('should accept valid PNG file', () => {
      const file = createMockFile('image/png', 1024 * 1024); // 1MB
      expect(() => pipe.transform(file)).not.toThrow();
    });

    it('should accept valid WebP file', () => {
      const file = createMockFile('image/webp', 1024 * 1024); // 1MB
      expect(() => pipe.transform(file)).not.toThrow();
    });

    it('should accept valid GIF file', () => {
      const file = createMockFile('image/gif', 1024 * 1024); // 1MB
      expect(() => pipe.transform(file)).not.toThrow();
    });

    it('should reject invalid MIME type', () => {
      const file = createMockFile('application/pdf', 1024 * 1024);
      expect(() => pipe.transform(file)).toThrow(BadRequestException);
      expect(() => pipe.transform(file)).toThrow(
        'Tipo de archivo inválido. Formatos permitidos: JPEG, PNG, WEBP, GIF',
      );
    });

    it('should reject file exceeding size limit', () => {
      const file = createMockFile('image/jpeg', 6 * 1024 * 1024); // 6MB
      expect(() => pipe.transform(file)).toThrow(BadRequestException);
      expect(() => pipe.transform(file)).toThrow(
        'El tamaño del archivo excede el límite de 5.00MB',
      );
    });

    it('should reject empty file', () => {
      const file = createMockFile('image/jpeg', 0);
      expect(() => pipe.transform(file)).toThrow(BadRequestException);
      expect(() => pipe.transform(file)).toThrow('El archivo está vacío');
    });

    it('should reject missing file when required', () => {
      expect(() => pipe.transform(null)).toThrow(BadRequestException);
      expect(() => pipe.transform(null)).toThrow('El archivo es requerido');
    });
  });

  describe('with custom options', () => {
    it('should accept custom MIME types', () => {
      pipe = new FileValidationPipe({
        allowedMimeTypes: ['application/pdf'],
      });
      const file = createMockFile('application/pdf', 1024 * 1024);
      expect(() => pipe.transform(file)).not.toThrow();
    });

    it('should accept custom size limit', () => {
      pipe = new FileValidationPipe({
        maxSizeBytes: 10 * 1024 * 1024, // 10MB
      });
      const file = createMockFile('image/jpeg', 8 * 1024 * 1024); // 8MB
      expect(() => pipe.transform(file)).not.toThrow();
    });

    it('should allow optional files', () => {
      pipe = new FileValidationPipe({ required: false });
      expect(() => pipe.transform(null)).not.toThrow();
      expect(pipe.transform(null)).toBeNull();
    });

    it('should validate optional file when provided', () => {
      pipe = new FileValidationPipe({ required: false });
      const invalidFile = createMockFile('application/pdf', 1024 * 1024);
      expect(() => pipe.transform(invalidFile)).toThrow(BadRequestException);
    });
  });

  describe('error messages', () => {
    beforeEach(() => {
      pipe = new FileValidationPipe();
    });

    it('should provide clear error message for invalid MIME type', () => {
      const file = createMockFile('text/plain', 1024);
      try {
        pipe.transform(file);
        fail('Should have thrown an exception');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('Tipo de archivo inválido');
        expect(error.message).toContain('JPEG, PNG, WEBP, GIF');
      }
    });

    it('should provide clear error message for size exceeded', () => {
      const file = createMockFile('image/jpeg', 10 * 1024 * 1024); // 10MB
      try {
        pipe.transform(file);
        fail('Should have thrown an exception');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('excede el límite');
        expect(error.message).toContain('5.00MB');
      }
    });
  });
});
