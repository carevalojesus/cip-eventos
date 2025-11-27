import { Test, TestingModule } from '@nestjs/testing';
import { QrService } from './qr.service';

describe('QrService', () => {
  let service: QrService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QrService],
    }).compile();

    service = module.get<QrService>(QrService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate a valid base64 QR code', async () => {
    const text = 'TEST-CODE-123';
    const result = await service.generateQrBase64(text);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^data:image\/png;base64,/);
  });
});
