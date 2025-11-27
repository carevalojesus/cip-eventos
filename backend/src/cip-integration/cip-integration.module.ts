import { Module } from '@nestjs/common';
import { CipIntegrationService } from './cip-integration.service';
import { CipController } from './cip.controller';
import { CipSeederService } from './cip-seeder.service';
import { UploadsModule } from '../uploads/uploads.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CipMember } from './entities/cip-member.entity';

@Module({
  imports: [UploadsModule, TypeOrmModule.forFeature([CipMember])],
  controllers: [CipController],
  providers: [CipIntegrationService, CipSeederService],
  exports: [CipIntegrationService],
})
export class CipIntegrationModule {}
