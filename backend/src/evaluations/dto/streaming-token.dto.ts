import {
  IsUUID,
  IsString,
  IsIP,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateStreamingTokenDto {
  @ApiProperty({
    description: 'ID de la sesión del evento',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  sessionId: string;

  @ApiProperty({
    description: 'ID del asistente',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  attendeeId: string;
}

export class ValidateStreamingTokenDto {
  @ApiProperty({
    description: 'Token de streaming a validar',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  token: string;

  @ApiPropertyOptional({
    description: 'Dirección IP del cliente (opcional)',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsIP()
  ip?: string;
}

export class StreamingConnectionDto {
  @ApiProperty({
    description: 'Token de streaming',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Dirección IP del cliente',
    example: '192.168.1.100',
  })
  @IsIP()
  ip: string;
}

export class StreamingDisconnectDto {
  @ApiProperty({
    description: 'Token de streaming',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Dirección IP del cliente',
    example: '192.168.1.100',
  })
  @IsIP()
  ip: string;
}

export class StreamingTokenValidationResult {
  @ApiProperty({
    description: 'Si el token es válido',
    example: true,
  })
  valid: boolean;

  @ApiProperty({
    description: 'Mensaje de error o validación',
    example: 'Token válido y dentro de la ventana de tiempo permitida',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'ID de la sesión asociada al token',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'ID del asistente asociado al token',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  attendeeId?: string;

  @ApiPropertyOptional({
    description: 'Hora de inicio de la sesión',
    example: '2025-12-06T15:00:00Z',
  })
  sessionStartAt?: Date;

  @ApiPropertyOptional({
    description: 'Hora de fin de la sesión',
    example: '2025-12-06T17:00:00Z',
  })
  sessionEndAt?: Date;

  @ApiPropertyOptional({
    description: 'Número de conexiones activas',
    example: 1,
  })
  activeConnections?: number;
}

export class GenerateStreamingTokenResult {
  @ApiProperty({
    description: 'Token de streaming generado',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'Fecha de expiración del token',
    example: '2025-12-06T17:30:00Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'ID de la sesión',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  sessionId: string;

  @ApiProperty({
    description: 'ID del asistente',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  attendeeId: string;

  @ApiProperty({
    description: 'Título de la sesión',
    example: 'Keynote: El Futuro de la IA',
  })
  sessionTitle: string;

  @ApiProperty({
    description: 'Hora de inicio de la sesión',
    example: '2025-12-06T15:00:00Z',
  })
  sessionStartAt: Date;

  @ApiProperty({
    description: 'Hora de fin de la sesión',
    example: '2025-12-06T17:00:00Z',
  })
  sessionEndAt: Date;
}

export class ActiveConnectionDto {
  @ApiProperty({
    description: 'Dirección IP de la conexión',
    example: '192.168.1.100',
  })
  ip: string;

  @ApiProperty({
    description: 'Fecha y hora de conexión',
    example: '2025-12-06T15:05:00Z',
  })
  connectedAt: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora de desconexión (si aplica)',
    example: '2025-12-06T16:30:00Z',
  })
  disconnectedAt?: string;

  @ApiProperty({
    description: 'Duración de la conexión en minutos',
    example: 85,
  })
  duration: number;
}

export class GetActiveConnectionsResult {
  @ApiProperty({
    description: 'Número total de conexiones activas',
    example: 2,
  })
  totalActive: number;

  @ApiProperty({
    description: 'Límite máximo de conexiones simultáneas',
    example: 2,
  })
  maxAllowed: number;

  @ApiProperty({
    description: 'Lista de conexiones activas',
    type: [ActiveConnectionDto],
  })
  connections: ActiveConnectionDto[];

  @ApiProperty({
    description: 'Si se pueden crear nuevas conexiones',
    example: false,
  })
  canConnect: boolean;
}
