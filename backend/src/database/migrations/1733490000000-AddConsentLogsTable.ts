import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConsentLogsTable1733490000000 implements MigrationInterface {
  name = 'AddConsentLogsTable1733490000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // CONSENT LOGS - Sistema de registro de consentimientos
    // ============================================================

    // Crear enum para tipos de consentimiento
    await queryRunner.query(`
      CREATE TYPE "consent_type_enum" AS ENUM (
        'TERMS_AND_CONDITIONS',
        'PRIVACY_POLICY',
        'MARKETING',
        'DATA_PROCESSING'
      )
    `);

    // Crear tabla de logs de consentimiento
    await queryRunner.query(`
      CREATE TABLE "consent_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "personId" uuid,
        "userId" uuid,
        "consentType" "consent_type_enum" NOT NULL,
        "documentVersion" text NOT NULL,
        "ipAddress" text,
        "userAgent" text,
        "acceptedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revokedAt" TIMESTAMP WITH TIME ZONE,
        "revokeReason" text,
        "revokedById" uuid,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_consent_logs" PRIMARY KEY ("id")
      )
    `);

    // Foreign keys
    await queryRunner.query(`
      ALTER TABLE "consent_logs"
      ADD CONSTRAINT "FK_consent_logs_person"
      FOREIGN KEY ("personId") REFERENCES "persons"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "consent_logs"
      ADD CONSTRAINT "FK_consent_logs_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "consent_logs"
      ADD CONSTRAINT "FK_consent_logs_revokedBy"
      FOREIGN KEY ("revokedById") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Índices para optimizar consultas
    await queryRunner.query(`
      CREATE INDEX "IDX_consent_logs_person_consentType"
      ON "consent_logs" ("personId", "consentType")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_consent_logs_user_consentType"
      ON "consent_logs" ("userId", "consentType")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_consent_logs_consentType_revokedAt"
      ON "consent_logs" ("consentType", "revokedAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_consent_logs_acceptedAt"
      ON "consent_logs" ("acceptedAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_consent_logs_person"
      ON "consent_logs" ("personId")
      WHERE "personId" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_consent_logs_user"
      ON "consent_logs" ("userId")
      WHERE "userId" IS NOT NULL
    `);

    // Índice para búsquedas de consentimientos activos (no revocados)
    await queryRunner.query(`
      CREATE INDEX "IDX_consent_logs_active"
      ON "consent_logs" ("personId", "userId", "consentType", "revokedAt")
      WHERE "revokedAt" IS NULL
    `);

    // Constraint para asegurar que al menos uno de personId o userId esté presente
    await queryRunner.query(`
      ALTER TABLE "consent_logs"
      ADD CONSTRAINT "CHK_consent_logs_person_or_user"
      CHECK (
        ("personId" IS NOT NULL) OR ("userId" IS NOT NULL)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar constraint
    await queryRunner.query(`
      ALTER TABLE "consent_logs"
      DROP CONSTRAINT IF EXISTS "CHK_consent_logs_person_or_user"
    `);

    // Eliminar índices
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_consent_logs_active"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_consent_logs_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_consent_logs_person"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_consent_logs_acceptedAt"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_consent_logs_consentType_revokedAt"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_consent_logs_user_consentType"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_consent_logs_person_consentType"`,
    );

    // Eliminar foreign keys
    await queryRunner.query(`
      ALTER TABLE "consent_logs"
      DROP CONSTRAINT IF EXISTS "FK_consent_logs_revokedBy"
    `);

    await queryRunner.query(`
      ALTER TABLE "consent_logs"
      DROP CONSTRAINT IF EXISTS "FK_consent_logs_user"
    `);

    await queryRunner.query(`
      ALTER TABLE "consent_logs"
      DROP CONSTRAINT IF EXISTS "FK_consent_logs_person"
    `);

    // Eliminar tabla
    await queryRunner.query(`DROP TABLE IF EXISTS "consent_logs"`);

    // Eliminar enum
    await queryRunner.query(`DROP TYPE IF EXISTS "consent_type_enum"`);
  }
}
