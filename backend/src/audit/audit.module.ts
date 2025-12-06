import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditSubscriber } from './subscribers/audit.subscriber';
import { AuditInterceptor } from './interceptors/audit.interceptor';

/**
 * Módulo de Auditoría
 * Marcado como Global para que AuditService esté disponible en toda la aplicación
 * sin necesidad de importar el módulo en cada feature module
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditController],
  providers: [AuditService, AuditSubscriber, AuditInterceptor],
  exports: [AuditService, AuditInterceptor], // Exportar para uso en otros módulos
})
export class AuditModule {}
