import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RequestDeletionDto } from './dto/request-deletion.dto';
import { User } from './entities/user.entity';

import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

// 👇 Importaciones de tu nueva estructura de Auth
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { EmailVerifiedGuard } from 'src/auth/guards/email-verified.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard, RolesGuard) // 🔒 Candado General: Todas las rutas requieren Token y email verificado
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  // 👇 Endpoint nuevo: Obtener mis propios datos (Perfil)
  // Recibe el userId del token y busca los datos frescos en la DB
  @Get('profile')
  getProfile(@CurrentUser() user: { userId: string }): Promise<User> {
    return this.usersService.findOne(user.userId);
  }

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string): Promise<User> {
    return this.usersService.remove(id);
  }

  @Post('request-deletion')
  async requestDeletion(
    @CurrentUser() user: { userId: string },
    @Body() dto: RequestDeletionDto,
  ): Promise<{ message: string }> {
    await this.usersService.requestDeletion(user.userId, dto.reason);
    return {
      message: 'Deletion request submitted successfully. An administrator will process your request.',
    };
  }
}
