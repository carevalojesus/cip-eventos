import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCertificateOwnerType1733600000002 implements MigrationInterface {
  name = 'AddCertificateOwnerType1733600000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create the enum type
    await queryRunner.query(`
      CREATE TYPE "certificate_owner_type_enum" AS ENUM (
        'ATTENDEE',
        'SPEAKER',
        'ORGANIZER',
        'BLOCK_ENROLLMENT',
        'SESSION'
      )
    `);

    // 2. Add the ownerType column as nullable first (for existing data)
    await queryRunner.query(`
      ALTER TABLE "certificates"
      ADD COLUMN "ownerType" "certificate_owner_type_enum"
    `);

    // 3. Migrate existing data based on which FK is not null
    // Priority order matters: most specific first
    await queryRunner.query(`
      UPDATE "certificates"
      SET "ownerType" = CASE
        WHEN "blockEnrollmentId" IS NOT NULL THEN 'BLOCK_ENROLLMENT'::"certificate_owner_type_enum"
        WHEN "sessionId" IS NOT NULL THEN 'SESSION'::"certificate_owner_type_enum"
        WHEN "speakerId" IS NOT NULL THEN 'SPEAKER'::"certificate_owner_type_enum"
        WHEN "registrationId" IS NOT NULL THEN 'ATTENDEE'::"certificate_owner_type_enum"
        WHEN "userId" IS NOT NULL THEN 'ORGANIZER'::"certificate_owner_type_enum"
        ELSE 'ATTENDEE'::"certificate_owner_type_enum"
      END
      WHERE "ownerType" IS NULL
    `);

    // 4. Make the column NOT NULL
    await queryRunner.query(`
      ALTER TABLE "certificates"
      ALTER COLUMN "ownerType" SET NOT NULL
    `);

    // 5. Add CHECK constraint to ensure exactly one FK is set based on ownerType
    await queryRunner.query(`
      ALTER TABLE "certificates"
      ADD CONSTRAINT "chk_certificate_owner_type_fk" CHECK (
        (
          "ownerType" = 'ATTENDEE' AND
          "registrationId" IS NOT NULL AND
          "speakerId" IS NULL AND
          "userId" IS NULL AND
          "blockEnrollmentId" IS NULL AND
          "sessionId" IS NULL
        ) OR (
          "ownerType" = 'SPEAKER' AND
          "speakerId" IS NOT NULL AND
          "registrationId" IS NULL AND
          "userId" IS NULL AND
          "blockEnrollmentId" IS NULL AND
          "sessionId" IS NULL
        ) OR (
          "ownerType" = 'ORGANIZER' AND
          "userId" IS NOT NULL AND
          "registrationId" IS NULL AND
          "speakerId" IS NULL AND
          "blockEnrollmentId" IS NULL AND
          "sessionId" IS NULL
        ) OR (
          "ownerType" = 'BLOCK_ENROLLMENT' AND
          "blockEnrollmentId" IS NOT NULL AND
          "registrationId" IS NULL AND
          "speakerId" IS NULL AND
          "userId" IS NULL AND
          "sessionId" IS NULL
        ) OR (
          "ownerType" = 'SESSION' AND
          "sessionId" IS NOT NULL AND
          "registrationId" IS NULL AND
          "speakerId" IS NULL AND
          "userId" IS NULL AND
          "blockEnrollmentId" IS NULL
        )
      )
    `);

    // 6. Add index on ownerType for faster filtering
    await queryRunner.query(`
      CREATE INDEX "idx_certificates_owner_type" ON "certificates" ("ownerType")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop the index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_certificates_owner_type"
    `);

    // 2. Drop the CHECK constraint
    await queryRunner.query(`
      ALTER TABLE "certificates"
      DROP CONSTRAINT IF EXISTS "chk_certificate_owner_type_fk"
    `);

    // 3. Drop the column
    await queryRunner.query(`
      ALTER TABLE "certificates"
      DROP COLUMN IF EXISTS "ownerType"
    `);

    // 4. Drop the enum type
    await queryRunner.query(`
      DROP TYPE IF EXISTS "certificate_owner_type_enum"
    `);
  }
}
