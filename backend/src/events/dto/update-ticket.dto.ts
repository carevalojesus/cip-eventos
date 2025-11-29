import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDto } from './create-ticket.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
