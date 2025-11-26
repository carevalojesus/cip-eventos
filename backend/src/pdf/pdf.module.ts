import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
