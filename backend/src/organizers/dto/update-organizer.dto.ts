import { PartialType } from '@nestjs/mapped-types';
import { CreateOrganizerDto } from './create-organizer.dto';

export class UpdateOrganizerDto extends PartialType(CreateOrganizerDto) {}
