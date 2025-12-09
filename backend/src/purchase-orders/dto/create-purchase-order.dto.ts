import {
  IsArray,
  IsEmail,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderItemDto } from './purchase-order-item.dto';

export class CreatePurchaseOrderDto {
  @IsEmail()
  buyerEmail: string;

  @IsOptional()
  @IsUUID()
  buyerPersonId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}
