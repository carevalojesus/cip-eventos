import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly i18n: I18nService,
  ) {}

  async create(
    userId: string,
    createProfileDto: CreateProfileDto,
  ): Promise<Profile> {
    const existingProfile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });

    if (existingProfile) {
      throw new BadRequestException(
        this.i18n.t('profiles.profile_already_exists', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new BadRequestException(
        this.i18n.t('profiles.user_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const newProfile = this.profileRepository.create({
      ...createProfileDto,
      user: user,
    });

    return await this.profileRepository.save(newProfile);
  }

  async update(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!profile) {
      throw new BadRequestException(
        this.i18n.t('profiles.profile_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const updatedProfile = this.profileRepository.merge(
      profile,
      updateProfileDto,
    );

    return await this.profileRepository.save(updatedProfile);
  }

  async findByUserId(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException(
        this.i18n.t('profiles.profile_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    return profile;
  }

  async remove(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!profile) {
      throw new NotFoundException(
        this.i18n.t('profiles.profile_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    return await this.profileRepository.remove(profile);
  }

  // ============================================
  // Admin methods for managing other users' profiles
  // ============================================

  async findByUserIdOrNull(userId: string): Promise<Profile | null> {
    return this.profileRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async updateByUserId(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    let profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
    });

    // If profile doesn't exist, create it
    if (!profile) {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException(
          this.i18n.t('profiles.user_not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      profile = this.profileRepository.create({
        ...updateProfileDto,
        user: user,
      });
    } else {
      profile = this.profileRepository.merge(profile, updateProfileDto);
    }

    return this.profileRepository.save(profile);
  }
}
