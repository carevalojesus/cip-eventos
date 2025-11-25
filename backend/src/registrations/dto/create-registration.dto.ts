import {
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAttendeeDto } from '../../attendees/dto/create-attendee.dto';

export class CreateRegistrationDto {
  @IsUUID()
  @IsNotEmpty()
  eventId: string;

  @IsUUID()
  @IsOptional()
  attendeeId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAttendeeDto)
  attendee?: CreateAttendeeDto;
}
