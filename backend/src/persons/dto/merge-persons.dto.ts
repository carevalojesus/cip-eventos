import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MergePersonsDto {
  @ApiProperty({
    description: 'Whether to reissue certificates after merge',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  reissueCertificates?: boolean;
}
