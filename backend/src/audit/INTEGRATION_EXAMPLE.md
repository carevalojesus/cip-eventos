# Ejemplo de Integración: Auditoría en CertificatesService

Este documento muestra cómo integrar el sistema de auditoría en un servicio existente.

## 1. Inyectar el AuditService

```typescript
// certificates.service.ts
import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CertificatesService {
  constructor(
    // ... otros repositorios
    private readonly auditService: AuditService, // ✅ Agregar
  ) {}
}
```

## 2. Auditar Creación de Certificados

```typescript
async createCertificate(
  dto: CreateCertificateDto,
  user: User,
  request: any,
): Promise<Certificate> {
  // Crear certificado
  const certificate = await this.certificateRepository.save({
    type: dto.type,
    validationCode: this.generateValidationCode(),
    event: dto.event,
    // ... otros campos
  });

  // ✅ Auditar creación
  await this.auditService.logCreate(
    'Certificate',
    certificate.id,
    {
      type: certificate.type,
      validationCode: certificate.validationCode,
      eventId: certificate.event.id,
      status: certificate.status,
    },
    user,
    request.ip,
    request.headers['user-agent'],
    {
      certificateType: certificate.type,
      eventName: certificate.event.name,
    },
  );

  return certificate;
}
```

## 3. Auditar Revocación de Certificados

```typescript
async revokeCertificate(
  id: string,
  reason: string,
  user: User,
  request: any,
): Promise<Certificate> {
  const certificate = await this.findOne(id);

  // Guardar estado anterior
  const previousValues = {
    status: certificate.status,
    validationCode: certificate.validationCode,
  };

  // Revocar
  certificate.status = CertificateStatus.REVOKED;
  await this.certificateRepository.save(certificate);

  // ✅ Auditar revocación
  await this.auditService.logRevoke(
    'Certificate',
    id,
    previousValues,
    user,
    request.ip,
    request.headers['user-agent'],
    reason,
    {
      previousStatus: previousValues.status,
      newStatus: CertificateStatus.REVOKED,
      validationCode: certificate.validationCode,
    },
  );

  return certificate;
}
```

## 4. Auditar Reemisión de Certificados

```typescript
async reissueCertificate(
  id: string,
  user: User,
  request: any,
): Promise<Certificate> {
  const oldCertificate = await this.findOne(id);

  // Guardar valores anteriores
  const previousValues = {
    validationCode: oldCertificate.validationCode,
    pdfUrl: oldCertificate.pdfUrl,
    version: oldCertificate.version,
  };

  // Generar nuevo código de validación
  const newValidationCode = this.generateValidationCode();
  oldCertificate.validationCode = newValidationCode;
  oldCertificate.version = (oldCertificate.version || 0) + 1;

  // Regenerar PDF
  const newPdfUrl = await this.generateCertificatePdf(oldCertificate);
  oldCertificate.pdfUrl = newPdfUrl;

  // Guardar
  await this.certificateRepository.save(oldCertificate);

  // ✅ Auditar reemisión
  await this.auditService.logReissue(
    'Certificate',
    id,
    previousValues,
    {
      validationCode: newValidationCode,
      pdfUrl: newPdfUrl,
      version: oldCertificate.version,
    },
    user,
    request.ip,
    request.headers['user-agent'],
    'Reemisión de certificado',
    {
      oldValidationCode: previousValues.validationCode,
      newValidationCode: newValidationCode,
      oldVersion: previousValues.version,
      newVersion: oldCertificate.version,
    },
  );

  return oldCertificate;
}
```

## 5. Auditar Actualización de Certificados

```typescript
async updateCertificate(
  id: string,
  dto: UpdateCertificateDto,
  user: User,
  request: any,
): Promise<Certificate> {
  const certificate = await this.findOne(id);

  // Guardar valores anteriores
  const previousValues = {
    status: certificate.status,
    metadata: certificate.metadata,
    pdfUrl: certificate.pdfUrl,
  };

  // Aplicar cambios
  if (dto.status) certificate.status = dto.status;
  if (dto.metadata) certificate.metadata = { ...certificate.metadata, ...dto.metadata };

  // Guardar
  await this.certificateRepository.save(certificate);

  // Valores nuevos
  const newValues = {
    status: certificate.status,
    metadata: certificate.metadata,
    pdfUrl: certificate.pdfUrl,
  };

  // ✅ Auditar actualización
  await this.auditService.logUpdate(
    'Certificate',
    id,
    previousValues,
    newValues,
    user,
    request.ip,
    request.headers['user-agent'],
    dto.reason || 'Actualización de certificado',
    {
      updatedFields: Object.keys(dto),
    },
  );

  return certificate;
}
```

## 6. Consultar Historial de un Certificado

```typescript
async getCertificateHistory(certificateId: string): Promise<AuditLog[]> {
  return this.auditService.findByEntity('Certificate', certificateId, 50);
}
```

## 7. Endpoint en el Controlador con Auditoría

```typescript
// certificates.controller.ts
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post(':id/revoke')
  async revokeCertificate(
    @Param('id') id: string,
    @Body() dto: RevokeCertificateDto,
    @GetUser() user: User,
    @Req() request: any,
  ) {
    // El servicio se encarga de auditar
    return this.certificatesService.revokeCertificate(
      id,
      dto.reason,
      user,
      request,
    );
  }

  @Get(':id/history')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getCertificateHistory(@Param('id') id: string) {
    return this.certificatesService.getCertificateHistory(id);
  }
}
```

## 8. Ejemplo: GradesService (Cambio de Notas)

```typescript
// grades.service.ts
import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(ParticipantGrade)
    private readonly gradeRepository: Repository<ParticipantGrade>,
    private readonly auditService: AuditService,
  ) {}

  async updateGrade(
    id: string,
    dto: UpdateGradeDto,
    user: User,
    request: any,
  ): Promise<ParticipantGrade> {
    const grade = await this.gradeRepository.findOne({
      where: { id },
      relations: ['enrollment', 'evaluation'],
    });

    if (!grade) {
      throw new NotFoundException('Nota no encontrada');
    }

    // Valores anteriores
    const previousValues = {
      grade: grade.grade,
      normalizedGrade: grade.normalizedGrade,
      comments: grade.comments,
      status: grade.status,
    };

    // Aplicar cambios
    grade.grade = dto.grade;
    grade.normalizedGrade = this.calculateNormalizedGrade(dto.grade);
    grade.comments = dto.comments;
    grade.lastModifiedBy = user;

    const updatedGrade = await this.gradeRepository.save(grade);

    // Valores nuevos
    const newValues = {
      grade: updatedGrade.grade,
      normalizedGrade: updatedGrade.normalizedGrade,
      comments: updatedGrade.comments,
      status: updatedGrade.status,
    };

    // ✅ Auditar cambio de nota (CRÍTICO)
    await this.auditService.logUpdate(
      'ParticipantGrade',
      id,
      previousValues,
      newValues,
      user,
      request.ip,
      request.headers['user-agent'],
      dto.reason || 'Actualización de nota',
      {
        enrollmentId: grade.enrollment.id,
        evaluationId: grade.evaluation.id,
        gradeDifference: updatedGrade.grade - previousValues.grade,
      },
    );

    return updatedGrade;
  }
}
```

## 9. Ejemplo: PaymentsService (Cambio de Estado de Pago)

```typescript
// payments.service.ts
async updatePaymentStatus(
  id: string,
  newStatus: PaymentStatus,
  user: User,
  reason: string,
  request: any,
): Promise<Payment> {
  const payment = await this.paymentRepository.findOne({ where: { id } });

  const previousValues = {
    status: payment.status,
    amount: payment.amount,
  };

  payment.status = newStatus;
  await this.paymentRepository.save(payment);

  // ✅ Auditar cambio de estado
  await this.auditService.logUpdate(
    'Payment',
    id,
    previousValues,
    { status: newStatus, amount: payment.amount },
    user,
    request.ip,
    request.headers['user-agent'],
    reason,
    {
      previousStatus: previousValues.status,
      newStatus: newStatus,
      amount: payment.amount,
    },
  );

  return payment;
}
```

## 10. Ejemplo: PersonsService (Fusión de Personas)

```typescript
// persons.service.ts
async mergePersons(
  sourceId: string,
  targetId: string,
  user: User,
  request: any,
): Promise<Person> {
  const source = await this.personRepository.findOne({ where: { id: sourceId } });
  const target = await this.personRepository.findOne({ where: { id: targetId } });

  // Realizar fusión (actualizar referencias, etc.)
  // ...

  // ✅ Auditar fusión
  await this.auditService.logMerge(
    'Person',
    targetId,
    {
      mergedFromId: sourceId,
      mergedFromName: `${source.firstName} ${source.lastName}`,
      mergedFromDocument: source.documentNumber,
    },
    {
      targetId: targetId,
      targetName: `${target.firstName} ${target.lastName}`,
      targetDocument: target.documentNumber,
    },
    user,
    request.ip,
    request.headers['user-agent'],
    `Fusión de persona ${sourceId} en ${targetId}`,
    {
      sourcePersonId: sourceId,
      targetPersonId: targetId,
      mergedRegistrations: /* conteo */,
      mergedCertificates: /* conteo */,
    },
  );

  return target;
}
```

## Mejores Prácticas

### 1. Siempre captura el estado anterior
```typescript
// ❌ MAL
certificate.status = CertificateStatus.REVOKED;
await this.auditService.logRevoke(...);

// ✅ BIEN
const previousStatus = certificate.status;
certificate.status = CertificateStatus.REVOKED;
await this.auditService.logRevoke(
  'Certificate',
  id,
  { status: previousStatus },
  ...
);
```

### 2. Incluye contexto útil en metadata
```typescript
await this.auditService.logUpdate(
  'ParticipantGrade',
  id,
  previousValues,
  newValues,
  user,
  request.ip,
  request.headers['user-agent'],
  reason,
  {
    // ✅ Contexto útil para investigaciones futuras
    enrollmentId: grade.enrollment.id,
    evaluationId: grade.evaluation.id,
    previousGrade: previousValues.grade,
    newGrade: newValues.grade,
    gradeDifference: newValues.grade - previousValues.grade,
  },
);
```

### 3. Usa el helper apropiado
```typescript
// Para crear: logCreate()
// Para actualizar: logUpdate()
// Para eliminar: logDelete()
// Para revocar: logRevoke()
// Para reemitir: logReissue()
// Para fusionar: logMerge()
// Para transferir: logTransfer()
```

### 4. Captura request info cuando esté disponible
```typescript
// ✅ En controladores/endpoints
async someMethod(@GetUser() user: User, @Req() request: any) {
  await this.service.doSomething(user, request);
}

// En el servicio
async doSomething(user: User, request: any) {
  // ...
  await this.auditService.logUpdate(
    entityType,
    entityId,
    previousValues,
    newValues,
    user,
    request.ip,  // ✅ IP
    request.headers['user-agent'],  // ✅ User Agent
  );
}
```

### 5. Incluye razón para cambios administrativos
```typescript
// DTO para operaciones administrativas
export class RevokeCertificateDto {
  @IsString()
  @IsNotEmpty()
  reason: string;  // ✅ Obligatorio
}

// Uso
await this.auditService.logRevoke(
  'Certificate',
  id,
  previousValues,
  user,
  request.ip,
  request.headers['user-agent'],
  dto.reason,  // ✅ Razón del cambio
);
```

## Verificar Auditoría

### Ver historial de una entidad
```bash
GET /audit/entity/Certificate/123e4567-e89b-12d3-a456-426614174000
```

### Ver acciones de un usuario
```bash
GET /audit/user/123e4567-e89b-12d3-a456-426614174001?page=1&limit=20
```

### Buscar cambios en un rango de fechas
```bash
GET /audit?entityType=Certificate&action=REVOKE&dateFrom=2024-01-01&dateTo=2024-12-31
```
