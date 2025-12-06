import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEnrollmentDto {
  @IsUUID()
  blockId: string;

  // Si ya está registrado en el evento, usar su registro
  @IsOptional()
  @IsUUID()
  registrationId?: string;

  // Código de cupón de descuento
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  couponCode?: string;
}
