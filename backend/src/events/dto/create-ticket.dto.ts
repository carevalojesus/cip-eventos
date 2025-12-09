import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsBoolean()
  @IsOptional()
  requiresCipValidation?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  salesStartAt?: Date;

  @IsDateString()
  @IsOptional()
  salesEndAt?: Date;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxPerOrder?: number;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;
}
