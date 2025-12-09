import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ReniecService } from './reniec.service';
import { ReniecController } from './reniec.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // 10 segundos de timeout
      maxRedirects: 3,
    }),
    CacheModule.register({
      ttl: 86400000, // 24 horas en milisegundos
      max: 1000, // Máximo 1000 entradas en caché
    }),
    forwardRef(() => AuthModule), // Para los guards de autenticación
  ],
  controllers: [ReniecController],
  providers: [ReniecService],
  exports: [ReniecService], // Exportar para usar en otros módulos
})
export class ReniecModule {}
