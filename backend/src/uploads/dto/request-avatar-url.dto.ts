import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestAvatarUrlDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^image\//, {
    message: 'contentType debe ser un MIME de imagen (p. ej. image/png)',
  })
  contentType: string;
}
