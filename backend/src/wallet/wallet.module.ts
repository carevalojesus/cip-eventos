import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { RegistrationsModule } from '../registrations/registrations.module';
import { WalletController } from './wallet.controller';

@Module({
  imports: [RegistrationsModule],
  providers: [WalletService],
  controllers: [WalletController],
  exports: [WalletService] // Exportar para uso en otros módulos (ej: MailService)
})
export class WalletModule {}
