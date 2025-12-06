import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePersonAndAttendeeRelations1733430100000
  implements MigrationInterface
{
  name = 'UpdatePersonAndAttendeeRelations1733430100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar campos de seguimiento de fusión en persons
    await queryRunner.query(
      `ALTER TABLE "persons" ADD "mergedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(`ALTER TABLE "persons" ADD "mergedById" uuid`);
    await queryRunner.query(
      `ALTER TABLE "persons" ADD CONSTRAINT "FK_person_merged_by" FOREIGN KEY ("mergedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Antes de hacer personId NOT NULL en attendees, necesitamos:
    // 1. Crear personas para todos los attendees que no tienen una
    // 2. Vincular esos attendees a sus personas

    // Esta query crea personas para attendees que aún no tienen personId
    await queryRunner.query(`
      INSERT INTO "persons" (
        "id",
        "firstName",
        "lastName",
        "documentType",
        "documentNumber",
        "email",
        "phone",
        "status",
        "flagRisk",
        "flagDataObserved",
        "createdAt",
        "updatedAt"
      )
      SELECT
        uuid_generate_v4(),
        a."firstName",
        a."lastName",
        a."documentType",
        a."documentNumber",
        a."email",
        a."phone",
        'ACTIVE',
        false,
        false,
        a."createdAt",
        NOW()
      FROM "attendees" a
      WHERE a."personId" IS NULL
      ON CONFLICT ("documentType", "documentNumber") DO NOTHING
    `);

    // Actualizar los attendees para vincularlos con sus personas correspondientes
    await queryRunner.query(`
      UPDATE "attendees" a
      SET "personId" = p.id
      FROM "persons" p
      WHERE a."personId" IS NULL
        AND a."documentType" = p."documentType"
        AND a."documentNumber" = p."documentNumber"
    `);

    // Para cualquier attendee que aún no tenga personId (duplicados con diferente email),
    // vincularlo con la persona que coincida en email
    await queryRunner.query(`
      UPDATE "attendees" a
      SET "personId" = p.id
      FROM "persons" p
      WHERE a."personId" IS NULL
        AND a."email" = p."email"
    `);

    // Si todavía quedan attendees sin personId, crear personas para ellos
    // usando email como identificador único
    await queryRunner.query(`
      INSERT INTO "persons" (
        "id",
        "firstName",
        "lastName",
        "documentType",
        "documentNumber",
        "email",
        "phone",
        "status",
        "flagRisk",
        "flagDataObserved",
        "createdAt",
        "updatedAt"
      )
      SELECT DISTINCT ON (a."email")
        uuid_generate_v4(),
        a."firstName",
        a."lastName",
        a."documentType",
        CONCAT(a."documentNumber", '-', a."id"),
        a."email",
        a."phone",
        'ACTIVE',
        false,
        true,
        a."createdAt",
        NOW()
      FROM "attendees" a
      WHERE a."personId" IS NULL
    `);

    // Vincular estos attendees restantes
    await queryRunner.query(`
      UPDATE "attendees" a
      SET "personId" = p.id
      FROM "persons" p
      WHERE a."personId" IS NULL
        AND a."email" = p."email"
    `);

    // Ahora sí, hacer personId NOT NULL
    await queryRunner.query(
      `ALTER TABLE "attendees" ALTER COLUMN "personId" SET NOT NULL`,
    );

    // Actualizar la constraint de FK
    await queryRunner.query(
      `ALTER TABLE "attendees" DROP CONSTRAINT IF EXISTS "FK_attendee_person"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendees" ADD CONSTRAINT "FK_attendee_person" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir personId a nullable
    await queryRunner.query(
      `ALTER TABLE "attendees" DROP CONSTRAINT "FK_attendee_person"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendees" ALTER COLUMN "personId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendees" ADD CONSTRAINT "FK_attendee_person" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Eliminar campos de seguimiento de fusión
    await queryRunner.query(
      `ALTER TABLE "persons" DROP CONSTRAINT "FK_person_merged_by"`,
    );
    await queryRunner.query(`ALTER TABLE "persons" DROP COLUMN "mergedById"`);
    await queryRunner.query(`ALTER TABLE "persons" DROP COLUMN "mergedAt"`);
  }
}
