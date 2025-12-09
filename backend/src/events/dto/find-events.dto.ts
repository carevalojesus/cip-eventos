import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { EventStatus } from '../entities/event.entity';

export class FindEventsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(EventStatus, {
    message: `status must be one of ${Object.values(EventStatus).join(', ')}`,
  })
  status?: EventStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
