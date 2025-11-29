import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { WalletService } from './wallet.service';
import { RegistrationsModule } from '../registrations/registrations.module';
import { WalletController } from './wallet.controller';

@Module({
  imports: [
    RegistrationsModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' }, // Token válido por 1 día
      }),
    }),
  ],
  providers: [WalletService],
  controllers: [WalletController],
  exports: [WalletService] // Exportar para uso en otros módulos (ej: MailService)
})
export class WalletModule {}
