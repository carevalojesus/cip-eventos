import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
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
  findAll(
    @CurrentUser() user: { userId: string; role: string },
    @Query('includeInactive') includeInactive?: string,
  ): Promise<User[]> {
    // Solo SUPER_ADMIN puede ver usuarios inactivos
    const canSeeInactive = user.role === 'SUPER_ADMIN' && includeInactive === 'true';
    return this.usersService.findAll(canSeeInactive);
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: string },
    @Query('includeInactive') includeInactive?: string,
  ): Promise<User> {
    const canSeeInactive = user.role === 'SUPER_ADMIN' && includeInactive === 'true';
    return this.usersService.findOne(id, canSeeInactive);
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

  @Patch(':id/verify-email')
  @Roles('SUPER_ADMIN')
  async verifyEmailManually(
    @Param('id') id: string,
    @CurrentUser() admin: { userId: string },
  ): Promise<User> {
    return this.usersService.verifyEmailManually(id, admin.userId);
  }

  @Patch(':id/change-role')
  @Roles('SUPER_ADMIN')
  async changeRole(
    @Param('id') id: string,
    @Body('roleId') roleId: number,
    @CurrentUser() admin: { userId: string },
  ): Promise<User> {
    return this.usersService.changeRole(id, roleId, admin.userId);
  }
}
