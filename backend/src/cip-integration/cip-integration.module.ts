import { Module } from '@nestjs/common';
import { CipIntegrationService } from './cip-integration.service';
import { CipController } from './cip.controller';
import { CipSeederService } from './cip-seeder.service';
import { CipCronService } from './cip-cron.service';
import { UploadsModule } from '../uploads/uploads.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CipMember } from './entities/cip-member.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([CipMember]), AuthModule, UploadsModule],
  controllers: [CipController],
  providers: [CipIntegrationService, CipSeederService, CipCronService],
  exports: [CipIntegrationService],
})
export class CipIntegrationModule {}
