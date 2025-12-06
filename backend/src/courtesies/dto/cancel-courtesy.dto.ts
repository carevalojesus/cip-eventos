import { IsNotEmpty, IsString } from 'class-validator';

export class CancelCourtesyDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
