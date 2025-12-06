import { ApiProperty } from '@nestjs/swagger';
import { Person } from '../entities/person.entity';

export class DuplicatePersonDto {
  @ApiProperty({ description: 'The potential duplicate person' })
  person: Person;

  @ApiProperty({ description: 'Reasons why this is a potential duplicate' })
  duplicateReasons: string[];

  @ApiProperty({
    description: 'Similarity score (0-100)',
    example: 85,
  })
  similarityScore: number;
}

export class DuplicatePersonsResponseDto {
  @ApiProperty({
    description: 'List of potential duplicate persons',
    type: [DuplicatePersonDto],
  })
  duplicates: DuplicatePersonDto[];

  @ApiProperty({ description: 'Total number of duplicates found' })
  total: number;
}
