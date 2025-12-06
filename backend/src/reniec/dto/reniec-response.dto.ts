import { ApiProperty } from '@nestjs/swagger';
import type { ReniecPerson } from '../interfaces/reniec-person.interface';

export class ReniecResponseDto {
  @ApiProperty({
    description: 'Indica si se encontraron datos en RENIEC',
    example: true,
  })
  found: boolean;

  @ApiProperty({
    description: 'DNI consultado',
    example: '12345678',
  })
  dni: string;

  @ApiProperty({
    description: 'Datos de la persona según RENIEC',
    required: false,
  })
  data?: ReniecPerson;

  @ApiProperty({
    description: 'Mensaje de error o información adicional',
    required: false,
  })
  message?: string;

  @ApiProperty({
    description: 'Código de error',
    required: false,
  })
  errorCode?: string;
}

export class ReniecValidationResponseDto {
  @ApiProperty({
    description: 'Indica si los datos ingresados son válidos',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Puntuación de coincidencia (0-100)',
    example: 95,
  })
  matchScore: number;

  @ApiProperty({
    description: 'Datos de la persona según RENIEC',
    required: false,
  })
  person?: ReniecPerson;

  @ApiProperty({
    description: 'Mensaje descriptivo del resultado',
    required: false,
  })
  message?: string;

  @ApiProperty({
    description: 'Código de error',
    required: false,
  })
  errorCode?: string;

  @ApiProperty({
    description: 'Detalles de la comparación de nombres',
    required: false,
  })
  comparisonDetails?: {
    firstNameMatch: number;
    lastNameMatch: number;
    inputFirstName: string;
    inputLastName: string;
    reniecFirstName: string;
    reniecLastName: string;
  };
}
