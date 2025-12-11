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
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly i18n: I18nService,
    private readonly auditService: AuditService,
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

    const savedProfile = await this.profileRepository.save(newProfile);

    // Audit log
    await this.auditService.logCreate(
      'Profile',
      savedProfile.id,
      {
        firstName: savedProfile.firstName,
        lastName: savedProfile.lastName,
        phoneNumber: savedProfile.phoneNumber,
        description: savedProfile.description,
        userId: user.id,
      },
      user,
    );

    return savedProfile;
  }

  async update(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!profile) {
      throw new BadRequestException(
        this.i18n.t('profiles.profile_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Capture previous values before update
    const previousValues = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phoneNumber: profile.phoneNumber,
      description: profile.description,
    };

    const updatedProfile = this.profileRepository.merge(
      profile,
      updateProfileDto,
    );

    const savedProfile = await this.profileRepository.save(updatedProfile);

    // Audit log
    await this.auditService.logUpdate(
      'Profile',
      savedProfile.id,
      previousValues,
      {
        firstName: savedProfile.firstName,
        lastName: savedProfile.lastName,
        phoneNumber: savedProfile.phoneNumber,
        description: savedProfile.description,
      },
      profile.user,
    );

    return savedProfile;
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
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException(
        this.i18n.t('profiles.profile_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Capture values before deletion
    const previousValues = {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phoneNumber: profile.phoneNumber,
      description: profile.description,
      userId: profile.user.id,
    };

    const removedProfile = await this.profileRepository.remove(profile);

    // Audit log
    await this.auditService.logDelete(
      'Profile',
      previousValues.id,
      previousValues,
      profile.user,
    );

    return removedProfile;
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
      relations: ['user'],
    });

    const isCreating = !profile;
    let previousValues: any = null;

    // If profile doesn't exist, create it with default values
    if (!profile) {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException(
          this.i18n.t('profiles.user_not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // Create profile with defaults for required fields if not provided
      profile = this.profileRepository.create({
        firstName: updateProfileDto.firstName || '',
        lastName: updateProfileDto.lastName || '',
        ...updateProfileDto,
        user: user,
      });
    } else {
      // Capture previous values before update
      previousValues = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
        description: profile.description,
      };

      profile = this.profileRepository.merge(profile, updateProfileDto);
    }

    const savedProfile = await this.profileRepository.save(profile);

    // Audit log
    if (isCreating) {
      await this.auditService.logCreate(
        'Profile',
        savedProfile.id,
        {
          firstName: savedProfile.firstName,
          lastName: savedProfile.lastName,
          phoneNumber: savedProfile.phoneNumber,
          description: savedProfile.description,
          userId: savedProfile.user.id,
        },
        savedProfile.user,
      );
    } else {
      await this.auditService.logUpdate(
        'Profile',
        savedProfile.id,
        previousValues,
        {
          firstName: savedProfile.firstName,
          lastName: savedProfile.lastName,
          phoneNumber: savedProfile.phoneNumber,
          description: savedProfile.description,
        },
        savedProfile.user,
      );
    }

    return savedProfile;
  }
}
