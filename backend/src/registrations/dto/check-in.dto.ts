import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export enum CheckInMode {
  SIMPLE = 'simple', // Solo registra entrada
  ADVANCED = 'advanced', // Registra entrada y salida
}

export class CheckInDto {
  @IsNotEmpty({ message: 'El código del ticket es requerido' })
  @IsString()
  ticketCode: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de la sesión debe ser un UUID válido' })
  sessionId?: string;

  @IsOptional()
  @IsEnum(CheckInMode, {
    message: 'El modo debe ser "simple" o "advanced"',
  })
  mode?: CheckInMode = CheckInMode.SIMPLE;
}

export class CheckOutDto {
  @IsNotEmpty({ message: 'El código del ticket es requerido' })
  @IsString()
  ticketCode: string;

  @IsNotEmpty({ message: 'El ID de la sesión es requerido' })
  @IsUUID('4', { message: 'El ID de la sesión debe ser un UUID válido' })
  sessionId: string;
}

export class TicketValidationDto {
  @IsNotEmpty()
  @IsString()
  ticketCode: string;
}
