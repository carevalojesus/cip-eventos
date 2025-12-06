import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingFeaturesFromSpec1733480000000
  implements MigrationInterface
{
  name = 'AddMissingFeaturesFromSpec1733480000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // 1. COORGANIZADORES - Nueva tabla con roles
    // ============================================================

    // Crear enum para roles de coorganizador
    await queryRunner.query(`
      CREATE TYPE "coorganizer_role_enum" AS ENUM (
        'PRIMARY',
        'ACADEMIC',
        'SPONSOR',
        'INSTITUTIONAL',
        'MEDIA',
        'TECHNICAL',
        'OTHER'
      )
    `);

    // Crear tabla de coorganizadores
    await queryRunner.query(`
      CREATE TABLE "event_coorganizers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "eventId" uuid NOT NULL,
        "organizerId" uuid NOT NULL,
        "role" "coorganizer_role_enum" NOT NULL DEFAULT 'OTHER',
        "isPrimary" boolean NOT NULL DEFAULT false,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "showInCertificate" boolean NOT NULL DEFAULT true,
        "showInPublicPage" boolean NOT NULL DEFAULT true,
        "customRole" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_coorganizers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_event_coorganizers_event_organizer" UNIQUE ("eventId", "organizerId")
      )
    `);

    // Foreign keys para coorganizadores
    await queryRunner.query(`
      ALTER TABLE "event_coorganizers"
      ADD CONSTRAINT "FK_event_coorganizers_event"
      FOREIGN KEY ("eventId") REFERENCES "events"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "event_coorganizers"
      ADD CONSTRAINT "FK_event_coorganizers_organizer"
      FOREIGN KEY ("organizerId") REFERENCES "organizers"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Índices para coorganizadores
    await queryRunner.query(`
      CREATE INDEX "IDX_event_coorganizers_event" ON "event_coorganizers" ("eventId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_event_coorganizers_organizer" ON "event_coorganizers" ("organizerId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_event_coorganizers_role" ON "event_coorganizers" ("role")
    `);

    // ============================================================
    // 2. CONTRACARGOS (CHARGEBACKS) - Nuevos estados y campos
    // ============================================================

    // Agregar nuevos valores al enum de PaymentStatus (nombre real en DB: payments_status_enum)
    await queryRunner.query(`
      ALTER TYPE "payments_status_enum" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED'
    `);

    await queryRunner.query(`
      ALTER TYPE "payments_status_enum" ADD VALUE IF NOT EXISTS 'CHARGEBACK'
    `);

    await queryRunner.query(`
      ALTER TYPE "payments_status_enum" ADD VALUE IF NOT EXISTS 'CHARGEBACK_REVERSED'
    `);

    // Agregar nuevos valores al enum de RegistrationStatus (nombre real en DB: registrations_status_enum)
    await queryRunner.query(`
      ALTER TYPE "registrations_status_enum" ADD VALUE IF NOT EXISTS 'REFUNDED'
    `);

    await queryRunner.query(`
      ALTER TYPE "registrations_status_enum" ADD VALUE IF NOT EXISTS 'IN_DISPUTE'
    `);

    await queryRunner.query(`
      ALTER TYPE "registrations_status_enum" ADD VALUE IF NOT EXISTS 'CANCELLED_BY_CHARGEBACK'
    `);

    // Agregar campos de chargeback a payments
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD COLUMN IF NOT EXISTS "chargebackAt" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "chargebackReason" text,
      ADD COLUMN IF NOT EXISTS "chargebackExternalId" text,
      ADD COLUMN IF NOT EXISTS "chargebackProcessedById" uuid,
      ADD COLUMN IF NOT EXISTS "chargebackReversedAt" TIMESTAMP WITH TIME ZONE
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_payments_chargebackProcessedBy"
      FOREIGN KEY ("chargebackProcessedById") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // ============================================================
    // 3. CERTIFICADOS POR SESIÓN - Nuevos campos y tipo
    // ============================================================

    // Agregar SESSION_ATTENDANCE al enum de CertificateType (nombre real en DB: certificates_type_enum)
    await queryRunner.query(`
      ALTER TYPE "certificates_type_enum" ADD VALUE IF NOT EXISTS 'SESSION_ATTENDANCE'
    `);

    // Agregar columna sessionId a certificates
    await queryRunner.query(`
      ALTER TABLE "certificates"
      ADD COLUMN IF NOT EXISTS "sessionId" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "certificates"
      ADD CONSTRAINT "FK_certificates_session"
      FOREIGN KEY ("sessionId") REFERENCES "event_sessions"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Agregar campos de certificado a events
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "allowsSessionCertificates" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "minAttendancePercentage" integer NOT NULL DEFAULT 70
    `);

    // Agregar campos de certificado a event_sessions
    await queryRunner.query(`
      ALTER TABLE "event_sessions"
      ADD COLUMN IF NOT EXISTS "hasCertificate" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "certificateHours" decimal(4,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "minAttendancePercentage" integer NOT NULL DEFAULT 70
    `);

    // ============================================================
    // 4. PUSH NOTIFICATIONS - Device tokens
    // ============================================================

    // Crear enums para device tokens
    await queryRunner.query(`
      CREATE TYPE "device_platform_enum" AS ENUM ('IOS', 'ANDROID', 'WEB')
    `);

    await queryRunner.query(`
      CREATE TYPE "token_provider_enum" AS ENUM ('FCM', 'APNS', 'WEB_PUSH')
    `);

    // Agregar PUSH y WHATSAPP al enum de NotificationChannel (nombre real en DB: notification_logs_channel_enum)
    await queryRunner.query(`
      ALTER TYPE "notification_logs_channel_enum" ADD VALUE IF NOT EXISTS 'PUSH'
    `);

    await queryRunner.query(`
      ALTER TYPE "notification_logs_channel_enum" ADD VALUE IF NOT EXISTS 'WHATSAPP'
    `);

    // Crear tabla de device tokens
    await queryRunner.query(`
      CREATE TABLE "device_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "token" text NOT NULL,
        "platform" "device_platform_enum" NOT NULL DEFAULT 'WEB',
        "provider" "token_provider_enum" NOT NULL DEFAULT 'FCM',
        "deviceName" text,
        "deviceModel" text,
        "osVersion" text,
        "appVersion" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "lastUsedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_device_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_device_tokens_token" UNIQUE ("token")
      )
    `);

    // Foreign key para device tokens
    await queryRunner.query(`
      ALTER TABLE "device_tokens"
      ADD CONSTRAINT "FK_device_tokens_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Índices para device tokens
    await queryRunner.query(`
      CREATE INDEX "IDX_device_tokens_user" ON "device_tokens" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_device_tokens_platform" ON "device_tokens" ("platform")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_device_tokens_isActive" ON "device_tokens" ("isActive")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // 4. PUSH NOTIFICATIONS - Rollback
    // ============================================================
    await queryRunner.query(`DROP TABLE IF EXISTS "device_tokens"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "token_provider_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "device_platform_enum"`);

    // ============================================================
    // 3. CERTIFICADOS POR SESIÓN - Rollback
    // ============================================================
    await queryRunner.query(`
      ALTER TABLE "event_sessions"
      DROP COLUMN IF EXISTS "hasCertificate",
      DROP COLUMN IF EXISTS "certificateHours",
      DROP COLUMN IF EXISTS "minAttendancePercentage"
    `);

    await queryRunner.query(`
      ALTER TABLE "events"
      DROP COLUMN IF EXISTS "allowsSessionCertificates",
      DROP COLUMN IF EXISTS "minAttendancePercentage"
    `);

    await queryRunner.query(`
      ALTER TABLE "certificates"
      DROP CONSTRAINT IF EXISTS "FK_certificates_session"
    `);

    await queryRunner.query(`
      ALTER TABLE "certificates"
      DROP COLUMN IF EXISTS "sessionId"
    `);

    // ============================================================
    // 2. CONTRACARGOS - Rollback
    // ============================================================
    await queryRunner.query(`
      ALTER TABLE "payments"
      DROP CONSTRAINT IF EXISTS "FK_payments_chargebackProcessedBy"
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      DROP COLUMN IF EXISTS "chargebackAt",
      DROP COLUMN IF EXISTS "chargebackReason",
      DROP COLUMN IF EXISTS "chargebackExternalId",
      DROP COLUMN IF EXISTS "chargebackProcessedById",
      DROP COLUMN IF EXISTS "chargebackReversedAt"
    `);

    // Nota: No se pueden eliminar valores de enums fácilmente en PostgreSQL
    // Se dejan los valores agregados

    // ============================================================
    // 1. COORGANIZADORES - Rollback
    // ============================================================
    await queryRunner.query(`DROP TABLE IF EXISTS "event_coorganizers"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "coorganizer_role_enum"`);
  }
}
