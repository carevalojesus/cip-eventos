import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrService {
  private readonly logger = new Logger(QrService.name);

  async generateQrBase64(text: string): Promise<string> {
    try {
      return await QRCode.toDataURL(text);
    } catch (err) {
      this.logger.error(
        'Error generating QR code',
        err instanceof Error ? err.stack : err,
      );
      throw new Error('Failed to generate QR code');
    }
  }
}
