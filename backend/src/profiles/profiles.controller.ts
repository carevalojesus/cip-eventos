import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Profile } from './entities/profile.entity';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
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
}
