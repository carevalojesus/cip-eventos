import { Module } from '@nestjs/common';
import { CipIntegrationService } from './cip-integration.service';

@Module({
  providers: [CipIntegrationService],
  exports: [CipIntegrationService],
})
export class CipIntegrationModule {}
