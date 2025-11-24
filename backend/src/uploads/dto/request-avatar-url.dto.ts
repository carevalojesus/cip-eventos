import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  IsInt,
  Min,
} from 'class-validator';

export class RequestAvatarUrlDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^image\//, {
    message: 'contentType debe ser un MIME de imagen (p. ej. image/png)',
  })
  contentType: string;

  @IsOptional()
  @IsInt({ message: 'contentLength debe ser un número en bytes' })
  @Min(1, { message: 'contentLength debe ser mayor a 0' })
  contentLength?: number;
}
