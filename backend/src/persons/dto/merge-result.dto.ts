import { ApiProperty } from '@nestjs/swagger';
import { Person } from '../entities/person.entity';

export class ReassignmentCountsDto {
  @ApiProperty({ description: 'Number of attendees reassigned' })
  attendees: number;

  @ApiProperty({ description: 'Number of block enrollments affected' })
  blockEnrollments: number;

  @ApiProperty({ description: 'Number of session attendances affected' })
  sessionAttendances: number;

  @ApiProperty({ description: 'Total number of records affected' })
  total: number;
}

export class MergeResultDto {
  @ApiProperty({ description: 'Primary person that received all references' })
  primaryPerson: Person;

  @ApiProperty({ description: 'Secondary person that was merged' })
  secondaryPerson: Person;

  @ApiProperty({ description: 'Count of affected records by type' })
  affectedRecords: ReassignmentCountsDto;

  @ApiProperty({
    description: 'Number of certificates reissued (if requested)',
    required: false,
  })
  reissuedCertificates?: number;
}
