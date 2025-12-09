import { IsUUID, IsString, IsOptional, IsEnum } from 'class-validator';

export enum ChargebackAction {
  INITIATE = 'INITIATE', // Iniciar disputa
  CONFIRM = 'CONFIRM', // Confirmar contracargo (perdimos)
  REVERSE = 'REVERSE', // Revertir (ganamos disputa)
}

export class ProcessChargebackDto {
  @IsUUID()
  paymentId: string;

  @IsEnum(ChargebackAction)
  action: ChargebackAction;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  externalId?: string; // ID del caso en el banco/procesador
}
