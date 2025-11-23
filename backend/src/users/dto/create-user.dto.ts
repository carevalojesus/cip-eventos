import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsInt,
  IsPositive,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsInt({ message: 'El roleId debe ser un número entero' })
  @IsPositive()
  roleId: number; // Enviamos el ID del rol (ej: 1), no el objeto entero
}
