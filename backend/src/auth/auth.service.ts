import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginAuthDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        email: user.email,
        role: user.role.name,
      },
    };
  }

  async register(registerDto: RegisterAuthDto) {
    // 1. Buscamos el rol 'USER'
    const role = await this.usersService.findRoleByName('USER');

    if (!role) {
      // Si el rol no existe, lanzamos error controlado
      throw new BadRequestException(
        'El rol por defecto no existe en el sistema',
      );
    }

    // 2. Creamos el usuario
    // El linter ya no se quejará porque sabe que 'role.id' es un número seguro
    return await this.usersService.create({
      email: registerDto.email,
      password: registerDto.password,
      roleId: role.id,
    });
  }
}
