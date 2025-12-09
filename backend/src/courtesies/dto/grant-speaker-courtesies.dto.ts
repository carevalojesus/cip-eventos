import { IsEnum, IsNotEmpty } from 'class-validator';
import { CourtesyScope } from '../enums/courtesy-scope.enum';

export class GrantSpeakerCourtesiesDto {
  @IsEnum(CourtesyScope)
  @IsNotEmpty()
  scope: CourtesyScope;
}
