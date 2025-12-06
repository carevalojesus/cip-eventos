import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidatePersonDto {
  @ApiProperty({
    description: 'Número de DNI (8 dígitos)',
    example: '12345678',
    minLength: 8,
    maxLength: 8,
  })
  @IsString()
  @Length(8, 8, { message: 'El DNI debe tener exactamente 8 dígitos' })
  @Matches(/^[0-9]{8}$/, {
    message: 'El DNI debe contener solo números',
  })
  dni: string;

  @ApiProperty({
    description: 'Nombres de la persona',
    example: 'Juan Carlos',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Apellidos de la persona',
    example: 'Pérez García',
  })
  @IsString()
  lastName: string;
}
