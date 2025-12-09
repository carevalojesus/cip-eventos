import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDataPseudonymizationFields1733490000000
  implements MigrationInterface
{
  name = 'AddDataPseudonymizationFields1733490000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // 1. Agregar campos de pseudonimización a la tabla persons
    // ============================================================

    await queryRunner.query(`
      ALTER TABLE "persons"
      ADD COLUMN IF NOT EXISTS "isPseudonymized" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "persons"
      ADD COLUMN IF NOT EXISTS "pseudonymizedAt" TIMESTAMP WITH TIME ZONE
    `);

    await queryRunner.query(`
      ALTER TABLE "persons"
      ADD COLUMN IF NOT EXISTS "pseudonymizedById" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "persons"
      ADD COLUMN IF NOT EXISTS "deletionRequestedAt" TIMESTAMP WITH TIME ZONE
    `);

    // Agregar foreign key para pseudonymizedBy
    await queryRunner.query(`
      ALTER TABLE "persons"
      ADD CONSTRAINT "FK_persons_pseudonymizedBy"
      FOREIGN KEY ("pseudonymizedById") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Agregar índices para búsquedas eficientes
    await queryRunner.query(`
      CREATE INDEX "IDX_persons_isPseudonymized" ON "persons" ("isPseudonymized")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_persons_deletionRequestedAt" ON "persons" ("deletionRequestedAt")
      WHERE "deletionRequestedAt" IS NOT NULL
    `);

    // ============================================================
    // 2. Agregar campos de eliminación a la tabla users
    // ============================================================

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "deletionReason" text
    `);

    // Agregar índice para deletedAt
    await queryRunner.query(`
      CREATE INDEX "IDX_users_deletedAt" ON "users" ("deletedAt")
      WHERE "deletedAt" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // 2. Revertir cambios en users
    // ============================================================

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_users_deletedAt"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "deletionReason"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "deletedAt"
    `);

    // ============================================================
    // 1. Revertir cambios en persons
    // ============================================================

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_persons_deletionRequestedAt"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_persons_isPseudonymized"
    `);

    await queryRunner.query(`
      ALTER TABLE "persons"
      DROP CONSTRAINT IF EXISTS "FK_persons_pseudonymizedBy"
    `);

    await queryRunner.query(`
      ALTER TABLE "persons"
      DROP COLUMN IF EXISTS "deletionRequestedAt"
    `);

    await queryRunner.query(`
      ALTER TABLE "persons"
      DROP COLUMN IF EXISTS "pseudonymizedById"
    `);

    await queryRunner.query(`
      ALTER TABLE "persons"
      DROP COLUMN IF EXISTS "pseudonymizedAt"
    `);

    await queryRunner.query(`
      ALTER TABLE "persons"
      DROP COLUMN IF EXISTS "isPseudonymized"
    `);
  }
}
