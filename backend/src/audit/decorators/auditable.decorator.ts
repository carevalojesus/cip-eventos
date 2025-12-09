import { SetMetadata } from '@nestjs/common';

export const AUDITABLE_KEY = 'auditable';

/**
 * Decorador para marcar métodos que deben auditarse automáticamente
 * @param entityType - El tipo de entidad que se está auditando
 * @param options - Opciones adicionales para la auditoría
 *
 * Uso:
 * @Auditable('Certificate', { captureReturn: true })
 * async updateCertificate(id: string, dto: UpdateDto) { ... }
 */
export interface AuditableOptions {
  /**
   * Capturar el valor de retorno del método como newValues
   */
  captureReturn?: boolean;

  /**
   * Capturar argumentos del método como previousValues
   * Índice del argumento a capturar (por defecto 0)
   */
  captureArgs?: number[];

  /**
   * Campos específicos a auditar (si no se especifica, se auditan todos)
   */
  fields?: string[];
}

export const Auditable = (
  entityType: string,
  options: AuditableOptions = {},
) => {
  return SetMetadata(AUDITABLE_KEY, { entityType, ...options });
};
