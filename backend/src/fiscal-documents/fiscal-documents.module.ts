import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FiscalDocumentsService } from './fiscal-documents.service';
import { FiscalDocumentsController } from './fiscal-documents.controller';
import { FiscalDocument } from './entities/fiscal-document.entity';
import { FiscalSeries } from './entities/fiscal-series.entity';
import { CreditNote } from './entities/credit-note.entity';
import { Payment } from '../payments/entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FiscalDocument,
      FiscalSeries,
      CreditNote,
      Payment,
    ]),
  ],
  controllers: [FiscalDocumentsController],
  providers: [FiscalDocumentsService],
  exports: [FiscalDocumentsService],
})
export class FiscalDocumentsModule {}
