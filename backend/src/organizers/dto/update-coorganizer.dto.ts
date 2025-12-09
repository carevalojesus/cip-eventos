import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCoorganizerDto } from './create-coorganizer.dto';

export class UpdateCoorganizerDto extends PartialType(
  OmitType(CreateCoorganizerDto, ['eventId', 'organizerId'] as const),
) {}
