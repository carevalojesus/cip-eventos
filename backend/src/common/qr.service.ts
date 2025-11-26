import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrService {
  async generateQrCode(text: string): Promise<string> {
    try {
      return await QRCode.toDataURL(text);
    } catch (err) {
      console.error('Error generating QR code', err);
      throw new Error('Failed to generate QR code');
    }
  }
}
