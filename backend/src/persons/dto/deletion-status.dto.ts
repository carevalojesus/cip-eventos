import { ApiProperty } from '@nestjs/swagger';

export class DeletionStatusDto {
  @ApiProperty({
    description: 'Person ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  personId: string;

  @ApiProperty({
    description: 'Whether deletion has been requested',
    example: true,
  })
  deletionRequested: boolean;

  @ApiProperty({
    description: 'When deletion was requested',
    example: '2024-12-06T10:30:00Z',
    nullable: true,
  })
  deletionRequestedAt: Date | null;

  @ApiProperty({
    description: 'Whether the person data has been pseudonymized',
    example: false,
  })
  isPseudonymized: boolean;

  @ApiProperty({
    description: 'When pseudonymization was performed',
    example: null,
    nullable: true,
  })
  pseudonymizedAt: Date | null;

  @ApiProperty({
    description: 'User who performed pseudonymization',
    nullable: true,
  })
  pseudonymizedBy: {
    id: string;
    email: string;
  } | null;

  @ApiProperty({
    description: 'Whether the associated user account has been deleted',
    example: false,
  })
  userDeleted: boolean;

  @ApiProperty({
    description: 'When the user account was deleted',
    example: null,
    nullable: true,
  })
  userDeletedAt: Date | null;

  @ApiProperty({
    description: 'Reason for deletion',
    example: null,
    nullable: true,
  })
  deletionReason: string | null;
}
