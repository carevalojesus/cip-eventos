import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateBlockDto } from './create-block.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { BlockStatus } from '../entities/evaluable-block.entity';

export class UpdateBlockDto extends PartialType(
  OmitType(CreateBlockDto, ['eventId'] as const),
) {
  @IsOptional()
  @IsEnum(BlockStatus)
  status?: BlockStatus;
}
