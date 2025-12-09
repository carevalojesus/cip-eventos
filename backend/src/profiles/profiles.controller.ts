import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  Param,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Profile } from './entities/profile.entity';
import { EmailVerifiedGuard } from 'src/auth/guards/email-verified.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('profiles')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body() createProfileDto: CreateProfileDto,
  ): Promise<Profile> {
    return this.profilesService.create(user.userId, createProfileDto);
  }

  @Get('me')
  findMyProfile(@CurrentUser() user: { userId: string }): Promise<Profile> {
    return this.profilesService.findByUserId(user.userId);
  }

  @Patch('me')
  update(
    @CurrentUser() user: { userId: string },
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    return this.profilesService.update(user.userId, updateProfileDto);
  }

  @Delete('me')
  remove(@CurrentUser() user: { userId: string }): Promise<Profile> {
    return this.profilesService.remove(user.userId);
  }

  // ============================================
  // Admin endpoints for managing other users' profiles
  // ============================================

  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  findByUserId(@Param('userId') userId: string): Promise<Profile | null> {
    return this.profilesService.findByUserIdOrNull(userId);
  }

  @Patch('user/:userId')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  updateByUserId(
    @Param('userId') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    return this.profilesService.updateByUserId(userId, updateProfileDto);
  }

  @Post('user/:userId')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  createForUser(
    @Param('userId') userId: string,
    @Body() createProfileDto: CreateProfileDto,
  ): Promise<Profile> {
    return this.profilesService.create(userId, createProfileDto);
  }
}
