import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateOrganizerDto } from './create-organizer.dto';

export class UpdateOrganizerDto extends PartialType(CreateOrganizerDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
