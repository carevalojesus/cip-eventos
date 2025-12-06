import { IsEnum, IsUUID, IsString, IsNumber, Min, Max } from 'class-validator';
import { CreditNoteReason } from '../entities/credit-note.entity';

export class CreateCreditNoteDto {
  @IsUUID()
  fiscalDocumentId: string;

  @IsEnum(CreditNoteReason)
  reason: CreditNoteReason;

  @IsString()
  description: string;

  // Para devoluciones parciales, especificar el porcentaje (0-100)
  // 100 = devolución total
  @IsNumber()
  @Min(1)
  @Max(100)
  percentage: number;
}
