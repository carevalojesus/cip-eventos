import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
} from 'class-validator';
import { EventStatus } from '../entities/event.entity';
import { IsAfter } from '../../common/validators/is-after.validator';
import { IsFutureDate } from '../../common/validators/is-future-date.validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  @IsNotEmpty()
  @IsFutureDate({ message: 'Start date must be in the future' })
  startAt: Date;

  @IsDateString()
  @IsNotEmpty()
  @IsAfter('startAt', { message: 'End date must be after start date' })
  endAt: Date;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsUrl({}, { message: 'Image URL must be a valid URL' })
  @IsOptional()
  imageUrl?: string;

  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @IsInt()
  @IsPositive()
  typeId: number;

  @IsInt()
  @IsPositive()
  categoryId: number;

  @IsInt()
  @IsPositive()
  modalityId: number;
}
