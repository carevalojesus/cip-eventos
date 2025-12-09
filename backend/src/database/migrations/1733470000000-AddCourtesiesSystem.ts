import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourtesiesSystem1733470000000 implements MigrationInterface {
  name = 'AddCourtesiesSystem1733470000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear enum RegistrationOrigin si no existe
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "registration_origin_enum" AS ENUM ('PURCHASE', 'COURTESY', 'TRANSFER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Crear enum CourtesyType
    await queryRunner.query(`
      CREATE TYPE "courtesy_type_enum" AS ENUM (
        'SPEAKER',
        'VIP',
        'PRESS',
        'SPONSOR',
        'STAFF',
        'OTHER'
      );
    `);

    // Crear enum CourtesyScope
    await queryRunner.query(`
      CREATE TYPE "courtesy_scope_enum" AS ENUM (
        'FULL_EVENT',
        'ASSIGNED_SESSIONS_ONLY',
        'SPECIFIC_BLOCKS'
      );
    `);

    // Crear enum CourtesyStatus
    await queryRunner.query(`
      CREATE TYPE "courtesy_status_enum" AS ENUM (
        'ACTIVE',
        'USED',
        'CANCELLED',
        'EXPIRED'
      );
    `);

    // Crear tabla courtesies
    await queryRunner.query(`
      CREATE TABLE "courtesies" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "eventId" uuid NOT NULL,
        "personId" uuid NOT NULL,
        "attendeeId" uuid,
        "type" "courtesy_type_enum" NOT NULL DEFAULT 'OTHER',
        "scope" "courtesy_scope_enum" NOT NULL DEFAULT 'FULL_EVENT',
        "status" "courtesy_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "reason" text,
        "notes" text,
        "speakerId" uuid,
        "validUntil" timestamptz,
        "grantedById" uuid NOT NULL,
        "grantedAt" timestamptz NOT NULL DEFAULT NOW(),
        "cancelledById" uuid,
        "cancelledAt" timestamptz,
        "cancellationReason" text,
        "createdAt" timestamptz NOT NULL DEFAULT NOW(),
        "updatedAt" timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT "FK_courtesies_event" FOREIGN KEY ("eventId")
          REFERENCES "events"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_courtesies_person" FOREIGN KEY ("personId")
          REFERENCES "persons"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_courtesies_attendee" FOREIGN KEY ("attendeeId")
          REFERENCES "attendees"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_courtesies_speaker" FOREIGN KEY ("speakerId")
          REFERENCES "speakers"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_courtesies_grantedBy" FOREIGN KEY ("grantedById")
          REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_courtesies_cancelledBy" FOREIGN KEY ("cancelledById")
          REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    // Crear índices para courtesies
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_courtesies_event_person"
        ON "courtesies" ("eventId", "personId");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_courtesies_status" ON "courtesies" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_courtesies_event" ON "courtesies" ("eventId");
    `);

    // Crear tabla courtesy_blocks (many-to-many)
    await queryRunner.query(`
      CREATE TABLE "courtesy_blocks" (
        "courtesyId" uuid NOT NULL,
        "blockId" uuid NOT NULL,
        PRIMARY KEY ("courtesyId", "blockId"),
        CONSTRAINT "FK_courtesy_blocks_courtesy" FOREIGN KEY ("courtesyId")
          REFERENCES "courtesies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_courtesy_blocks_block" FOREIGN KEY ("blockId")
          REFERENCES "evaluable_blocks"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_courtesy_blocks_courtesy" ON "courtesy_blocks" ("courtesyId");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_courtesy_blocks_block" ON "courtesy_blocks" ("blockId");
    `);

    // Agregar columna origin a registrations
    await queryRunner.query(`
      ALTER TABLE "registrations"
        ADD COLUMN "origin" "registration_origin_enum" NOT NULL DEFAULT 'PURCHASE';
    `);

    // Agregar columna courtesyId a registrations
    await queryRunner.query(`
      ALTER TABLE "registrations"
        ADD COLUMN "courtesyId" uuid;
    `);

    await queryRunner.query(`
      ALTER TABLE "registrations"
        ADD CONSTRAINT "FK_registrations_courtesy" FOREIGN KEY ("courtesyId")
          REFERENCES "courtesies"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_registrations_courtesy" ON "registrations" ("courtesyId");
    `);

    // Agregar columna courtesyId a block_enrollments
    await queryRunner.query(`
      ALTER TABLE "block_enrollments"
        ADD COLUMN "courtesyId" uuid;
    `);

    await queryRunner.query(`
      ALTER TABLE "block_enrollments"
        ADD CONSTRAINT "FK_block_enrollments_courtesy" FOREIGN KEY ("courtesyId")
          REFERENCES "courtesies"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_block_enrollments_courtesy" ON "block_enrollments" ("courtesyId");
    `);

    // Agregar comentarios a las tablas
    await queryRunner.query(`
      COMMENT ON TABLE "courtesies" IS
        'Cortesías otorgadas a personas (ponentes, VIPs, prensa, etc.)';
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "courtesy_blocks" IS
        'Bloques específicos a los que da acceso una cortesía';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices y constraints de block_enrollments
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_block_enrollments_courtesy";
    `);

    await queryRunner.query(`
      ALTER TABLE "block_enrollments"
        DROP CONSTRAINT IF EXISTS "FK_block_enrollments_courtesy";
    `);

    await queryRunner.query(`
      ALTER TABLE "block_enrollments" DROP COLUMN IF EXISTS "courtesyId";
    `);

    // Eliminar índices y constraints de registrations
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_registrations_courtesy";
    `);

    await queryRunner.query(`
      ALTER TABLE "registrations"
        DROP CONSTRAINT IF EXISTS "FK_registrations_courtesy";
    `);

    await queryRunner.query(`
      ALTER TABLE "registrations" DROP COLUMN IF EXISTS "courtesyId";
    `);

    await queryRunner.query(`
      ALTER TABLE "registrations" DROP COLUMN IF EXISTS "origin";
    `);

    // Eliminar tabla courtesy_blocks
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_courtesy_blocks_block";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_courtesy_blocks_courtesy";
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "courtesy_blocks";`);

    // Eliminar índices de courtesies
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_courtesies_event";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_courtesies_status";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_courtesies_event_person";
    `);

    // Eliminar tabla courtesies
    await queryRunner.query(`DROP TABLE IF EXISTS "courtesies";`);

    // Eliminar enums
    await queryRunner.query(`DROP TYPE IF EXISTS "courtesy_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "courtesy_scope_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "courtesy_type_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "registration_origin_enum";`);
  }
}
