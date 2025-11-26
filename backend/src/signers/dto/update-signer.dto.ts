import { PartialType } from '@nestjs/mapped-types';
import { CreateSignerDto } from './create-signer.dto';

export class UpdateSignerDto extends PartialType(CreateSignerDto) {}
