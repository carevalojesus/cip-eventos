import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterAuthDto {
  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
