# Ejemplos de Uso - Sistema de Versionado de Certificados

## Ejemplos de cURL

### 1. Reemitir un Certificado

```bash
curl -X POST http://localhost:3000/api/certificates/{certificate-id}/reissue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "reason": "Corrección de nombre: María → Maria"
  }'
```

### 2. Revocar un Certificado

```bash
curl -X POST http://localhost:3000/api/certificates/{certificate-id}/revoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "reason": "Contracargo - Pago revertido por el banco"
  }'
```

### 3. Validar un Certificado (Público - Sin Auth)

```bash
curl http://localhost:3000/api/certificates/validate/CIP-2025-ABC123
```

### 4. Obtener Historial de Versiones

```bash
curl http://localhost:3000/api/certificates/{certificate-id}/versions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Reemisión Masiva

```bash
curl -X POST http://localhost:3000/api/certificates/bulk-reissue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "certificateIds": [
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440002",
      "550e8400-e29b-41d4-a716-446655440003"
    ],
    "reason": "Actualización masiva después de fusión de personas"
  }'
```

## Ejemplos de Código TypeScript/NestJS

### Servicio Personalizado que Usa Reemisión

```typescript
// custom-corrections.service.ts

import { Injectable } from '@nestjs/common';
import { CertificatesService } from '../certificates/certificates.service';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from '../certificates/entities/certificate.entity';

@Injectable()
export class CorrectionsService {
  constructor(
    private readonly certificatesService: CertificatesService,
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
  ) {}

  /**
   * Corrige nombre de una persona y reemite todos sus certificados
   */
  async fixPersonNameAndReissueCertificates(
    personId: string,
    correctedName: { firstName: string; lastName: string },
    performedBy: User,
  ) {
    // 1. Actualizar nombre en la entidad Person
    // (esto depende de tu implementación de Person/Attendee)

    // 2. Encontrar todos los certificados relacionados
    const certificates = await this.certificateRepository.find({
      where: [
        { registration: { attendee: { id: personId } } },
        { blockEnrollment: { attendee: { id: personId } } },
      ],
    });

    // 3. Reemitir todos
    const reason = `Corrección de nombre a: ${correctedName.firstName} ${correctedName.lastName}`;
    const result = await this.certificatesService.bulkReissue(
      certificates.map(c => c.id),
      reason,
      performedBy,
    );

    return {
      message: `Se actualizaron ${result.successful} certificados`,
      details: result,
    };
  }
}
```

### Job/Cron para Detectar y Reemitir Certificados con Datos Obsoletos

```typescript
// certificate-sync.cron.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from '../certificates/entities/certificate.entity';
import { CertificatesService } from '../certificates/certificates.service';

@Injectable()
export class CertificateSyncCron {
  private readonly logger = new Logger(CertificateSyncCron.name);

  constructor(
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
    private readonly certificatesService: CertificatesService,
  ) {}

  /**
   * Ejecuta diariamente a las 3 AM
   * Busca certificados con datos desactualizados y los reemite automáticamente
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async syncOutdatedCertificates() {
    this.logger.log('🔄 Iniciando sincronización de certificados obsoletos...');

    // Ejemplo: Buscar certificados donde el nombre en metadata no coincide
    // con el nombre actual en la entidad relacionada
    const certificates = await this.certificateRepository.find({
      relations: ['registration', 'registration.attendee'],
    });

    const outdated = certificates.filter(cert => {
      if (!cert.registration?.attendee) return false;

      const currentName = `${cert.registration.attendee.firstName} ${cert.registration.attendee.lastName}`;
      const certName = cert.metadata?.recipientName;

      return currentName !== certName;
    });

    this.logger.log(`📋 Encontrados ${outdated.length} certificados obsoletos`);

    if (outdated.length === 0) return;

    // Obtener un usuario del sistema para firmar las reemisiones
    const systemUser = await this.getSystemUser();

    for (const cert of outdated) {
      try {
        await this.certificatesService.reissue(
          cert.id,
          'Sincronización automática de datos',
          systemUser,
        );
        this.logger.log(`✅ Certificado ${cert.validationCode} actualizado`);
      } catch (error) {
        this.logger.error(
          `❌ Error actualizando ${cert.validationCode}:`,
          error.message,
        );
      }
    }

    this.logger.log('🏁 Sincronización completada');
  }

  private async getSystemUser() {
    // Implementar lógica para obtener usuario del sistema
    // O crear un usuario especial para operaciones automáticas
    return null; // placeholder
  }
}
```

### Controlador Personalizado para Admins

```typescript
// admin-certificates.controller.ts

import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CertificatesService } from '../certificates/certificates.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from '../certificates/entities/certificate.entity';

@Controller('admin/certificates')
@UseGuards(/* tus guards */)
export class AdminCertificatesController {
  constructor(
    private readonly certificatesService: CertificatesService,
    @InjectRepository(Certificate)
    private readonly certificateRepository: Repository<Certificate>,
  ) {}

  /**
   * Obtener estadísticas de certificados
   */
  @Get('stats')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getStats() {
    const total = await this.certificateRepository.count();
    const active = await this.certificateRepository.count({
      where: { status: 'ACTIVE' }
    });
    const revoked = await this.certificateRepository.count({
      where: { status: 'REVOKED' }
    });
    const reissued = await this.certificateRepository.count({
      where: { version: MoreThan(1) },
    });

    return { total, active, revoked, reissued };
  }

  /**
   * Listar certificados que han sido reemitidos
   */
  @Get('reissued')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getReissuedCertificates(@Query('page') page = 1) {
    return this.certificateRepository.find({
      where: { version: MoreThan(1) },
      relations: ['lastReissuedBy'],
      order: { lastReissuedAt: 'DESC' },
      skip: (page - 1) * 20,
      take: 20,
    });
  }

  /**
   * Buscar certificados por código parcial
   */
  @Get('search/:partialCode')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async searchByCode(@Param('partialCode') code: string) {
    return this.certificateRepository
      .createQueryBuilder('cert')
      .where('cert.validationCode ILIKE :code', { code: `%${code}%` })
      .limit(10)
      .getMany();
  }
}
```

## Ejemplos de Frontend (React/TypeScript)

### Componente de Validación Pública

```tsx
// CertificateValidator.tsx

import React, { useState } from 'react';

interface ValidationResult {
  isValid: boolean;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  message: string;
  certificate?: {
    type: string;
    recipientName: string;
    eventName: string;
    eventDate: string;
    hours: number;
    version: number;
  };
  revocationInfo?: {
    revokedAt: Date;
    reason: string;
  };
}

export const CertificateValidator: React.FC = () => {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/certificates/validate/${code}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error validating certificate:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="certificate-validator">
      <h2>Validar Certificado</h2>

      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Ingrese el código (ej: CIP-2025-ABC123)"
        className="code-input"
      />

      <button onClick={validate} disabled={loading || !code}>
        {loading ? 'Validando...' : 'Validar'}
      </button>

      {result && (
        <div className={`result ${result.isValid ? 'valid' : 'invalid'}`}>
          {result.isValid ? (
            <div className="valid-certificate">
              <h3>✅ Certificado Válido</h3>
              <dl>
                <dt>Destinatario:</dt>
                <dd>{result.certificate.recipientName}</dd>

                <dt>Evento:</dt>
                <dd>{result.certificate.eventName}</dd>

                <dt>Fecha:</dt>
                <dd>{result.certificate.eventDate}</dd>

                <dt>Horas:</dt>
                <dd>{result.certificate.hours}</dd>

                <dt>Tipo:</dt>
                <dd>{result.certificate.type}</dd>

                {result.certificate.version > 1 && (
                  <>
                    <dt>Versión:</dt>
                    <dd>{result.certificate.version} (Reemitido)</dd>
                  </>
                )}
              </dl>
            </div>
          ) : (
            <div className="invalid-certificate">
              {result.status === 'REVOKED' ? (
                <>
                  <h3>❌ Certificado Revocado</h3>
                  <p><strong>Motivo:</strong> {result.revocationInfo.reason}</p>
                  <p><small>Revocado el: {new Date(result.revocationInfo.revokedAt).toLocaleDateString()}</small></p>
                </>
              ) : (
                <>
                  <h3>❌ Certificado No Válido</h3>
                  <p>{result.message}</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### Panel de Administración - Reemitir Certificado

```tsx
// CertificateActions.tsx

import React, { useState } from 'react';
import { api } from '../services/api';

interface Props {
  certificateId: string;
  onReissued: () => void;
}

export const CertificateActions: React.FC<Props> = ({ certificateId, onReissued }) => {
  const [showReissueModal, setShowReissueModal] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReissue = async () => {
    if (!reason.trim()) {
      alert('Debe ingresar un motivo');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/certificates/${certificateId}/reissue`, { reason });
      alert('Certificado reemitido exitosamente');
      setShowReissueModal(false);
      setReason('');
      onReissued();
    } catch (error) {
      alert('Error al reemitir certificado');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    const reason = prompt('Ingrese el motivo de revocación:');
    if (!reason) return;

    const confirmed = confirm(
      '¿Está seguro de revocar este certificado? Esta acción NO se puede deshacer.'
    );
    if (!confirmed) return;

    try {
      await api.post(`/certificates/${certificateId}/revoke`, { reason });
      alert('Certificado revocado');
      onReissued();
    } catch (error) {
      alert('Error al revocar certificado');
      console.error(error);
    }
  };

  return (
    <div className="certificate-actions">
      <button onClick={() => setShowReissueModal(true)}>
        🔄 Reemitir
      </button>

      <button onClick={handleRevoke} className="danger">
        🚫 Revocar
      </button>

      {showReissueModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Reemitir Certificado</h3>
            <p>Esta acción regenerará el PDF con los datos actuales de la persona/evento.</p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo de reemisión (ej: Corrección de nombre)"
              rows={4}
            />

            <div className="modal-actions">
              <button onClick={() => setShowReissueModal(false)}>
                Cancelar
              </button>
              <button onClick={handleReissue} disabled={loading}>
                {loading ? 'Reemitiendo...' : 'Confirmar Reemisión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

## Casos de Uso Avanzados

### Caso 1: Integración con QR Scanner

```typescript
// qr-scanner.service.ts

import { Injectable } from '@nestjs/common';
import { CertificatesService } from '../certificates/certificates.service';

@Injectable()
export class QrScannerService {
  constructor(private readonly certificatesService: CertificatesService) {}

  /**
   * Valida un certificado escaneado desde un QR
   * El QR contiene solo el código de validación
   */
  async validateFromQr(qrContent: string) {
    // El QR puede contener una URL completa o solo el código
    const code = this.extractCodeFromQr(qrContent);

    return this.certificatesService.validateByCode(code);
  }

  private extractCodeFromQr(qrContent: string): string {
    // Si es una URL completa: https://example.com/verify/CIP-2025-ABC123
    if (qrContent.includes('http')) {
      const parts = qrContent.split('/');
      return parts[parts.length - 1];
    }

    // Si es solo el código
    return qrContent;
  }
}
```

### Caso 2: Webhook para Notificaciones Externas

```typescript
// webhooks.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly httpService: HttpService) {}

  async notifyCertificateRevoked(certificate: Certificate) {
    const webhookUrls = [
      'https://external-system.com/api/webhook/certificate-revoked',
      // ... otras URLs
    ];

    for (const url of webhookUrls) {
      try {
        await this.httpService.post(url, {
          event: 'certificate.revoked',
          certificateId: certificate.id,
          validationCode: certificate.validationCode,
          revokedAt: certificate.revokedAt,
          reason: certificate.revokedReason,
        }).toPromise();

        this.logger.log(`✅ Webhook enviado a ${url}`);
      } catch (error) {
        this.logger.error(`❌ Error enviando webhook a ${url}:`, error.message);
      }
    }
  }
}
```

## Tests Unitarios

```typescript
// certificates.service.spec.ts

describe('CertificatesService - Reissue', () => {
  let service: CertificatesService;
  let repository: Repository<Certificate>;

  beforeEach(async () => {
    // Setup del módulo de testing
  });

  it('should increment version when reissuing', async () => {
    const certificate = { id: '1', version: 1, status: 'ACTIVE' } as Certificate;
    jest.spyOn(repository, 'findOne').mockResolvedValue(certificate);

    const performedBy = { id: 'user-1' } as User;
    const result = await service.reissue('1', 'Test reason', performedBy);

    expect(result.version).toBe(2);
  });

  it('should throw error when reissuing revoked certificate', async () => {
    const certificate = { id: '1', status: 'REVOKED' } as Certificate;
    jest.spyOn(repository, 'findOne').mockResolvedValue(certificate);

    await expect(
      service.reissue('1', 'Test', {} as User)
    ).rejects.toThrow('Cannot reissue a revoked certificate');
  });

  it('should save version history', async () => {
    const certificate = {
      id: '1',
      version: 1,
      pdfUrl: 'old.pdf',
      versionHistory: [],
    } as Certificate;

    jest.spyOn(repository, 'findOne').mockResolvedValue(certificate);

    await service.reissue('1', 'Test reason', {} as User);

    expect(certificate.versionHistory).toHaveLength(1);
    expect(certificate.versionHistory[0].version).toBe(1);
    expect(certificate.versionHistory[0].reason).toBe('Test reason');
  });
});
```
