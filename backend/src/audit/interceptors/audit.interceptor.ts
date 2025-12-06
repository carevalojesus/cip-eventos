import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { AUDITABLE_KEY, AuditableOptions } from '../decorators/auditable.decorator';
import { AuditAction } from '../enums/audit-action.enum';

/**
 * Interceptor que captura automáticamente información de auditoría
 * de los métodos marcados con @Auditable()
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();
    const auditableMetadata = this.reflector.get<
      { entityType: string } & AuditableOptions
    >(AUDITABLE_KEY, handler);

    // Si el método no está marcado como auditable, continuar sin auditoría
    if (!auditableMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Usuario autenticado (de JwtAuthGuard)
    const ipAddress = this.getIpAddress(request);
    const userAgent = request.headers['user-agent'] || null;

    // Capturar argumentos del método si está configurado
    const args = context.getArgs();
    let previousValues: Record<string, any> | null = null;

    if (auditableMetadata.captureArgs && auditableMetadata.captureArgs.length > 0) {
      const capturedArgs: Record<string, any> = {};
      auditableMetadata.captureArgs.forEach((index) => {
        if (args[index]) {
          capturedArgs[`arg${index}`] = args[index];
        }
      });
      previousValues = capturedArgs;
    }

    // Ejecutar el método y capturar el resultado
    return next.handle().pipe(
      tap((result) => {
        // Capturar el resultado si está configurado
        if (auditableMetadata.captureReturn && result) {
          // Determinar la acción basada en el método HTTP
          const action = this.determineAction(request.method);

          // Extraer entityId del resultado o de los parámetros
          const entityId = result.id || request.params.id;

          if (entityId) {
            this.auditService.log({
              entityType: auditableMetadata.entityType,
              entityId,
              action,
              previousValues,
              newValues: result,
              performedBy: user,
              performedByEmail: user?.email,
              ipAddress,
              userAgent,
            });
          }
        }
      }),
    );
  }

  /**
   * Extrae la dirección IP del request
   */
  private getIpAddress(request: any): string | null {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      null
    );
  }

  /**
   * Determina la acción de auditoría basada en el método HTTP
   */
  private determineAction(method: string): AuditAction {
    switch (method.toUpperCase()) {
      case 'POST':
        return AuditAction.CREATE;
      case 'PUT':
      case 'PATCH':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      default:
        return AuditAction.UPDATE;
    }
  }
}
