import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPersonaOrganizerAndTicketScope1733420000000
  implements MigrationInterface
{
  name = 'AddPersonaOrganizerAndTicketScope1733420000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Personas
    await queryRunner.query(
      `CREATE TYPE "public"."persons_status_enum" AS ENUM('ACTIVE', 'MERGED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "persons" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "firstName" text NOT NULL,
        "lastName" text NOT NULL,
        "documentType" "public"."attendees_documenttype_enum" NOT NULL DEFAULT 'DNI',
        "documentNumber" text NOT NULL,
        "email" text NOT NULL,
        "phone" text,
        "country" text,
        "birthDate" date,
        "guardianName" text,
        "guardianDocument" text,
        "guardianPhone" text,
        "guardianAuthorizationUrl" text,
        "flagRisk" boolean NOT NULL DEFAULT false,
        "flagDataObserved" boolean NOT NULL DEFAULT false,
        "status" "public"."persons_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "mergedToPersonId" uuid,
        "userId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_persons_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_person_document" ON "persons" ("documentType", "documentNumber")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_person_email" ON "persons" ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "persons" ADD CONSTRAINT "FK_person_merged" FOREIGN KEY ("mergedToPersonId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "persons" ADD CONSTRAINT "FK_person_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Attendees -> Persona
    await queryRunner.query(`ALTER TABLE "attendees" ADD "personId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "attendees" ADD CONSTRAINT "FK_attendee_person" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Organizers fiscal fields
    await queryRunner.query(
      `ALTER TABLE "organizers" ADD "ruc" character varying(11)`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizers" ADD "businessName" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizers" ADD "fiscalAddress" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizers" ADD "baseCurrency" character varying(3) NOT NULL DEFAULT 'PEN'`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizers" ADD "emitsFiscalDocuments" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizers" ADD "termsText" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizers" ADD "privacyText" text`,
    );

    // Event sessions status
    await queryRunner.query(
      `CREATE TYPE "public"."event_sessions_status_enum" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_sessions" ADD "status" "public"."event_sessions_status_enum" NOT NULL DEFAULT 'SCHEDULED'`,
    );

    // Event tickets: alcance y políticas
    await queryRunner.query(
      `CREATE TYPE "public"."event_tickets_scope_enum" AS ENUM('EVENT', 'DAY', 'SESSION', 'BLOCK')`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" ADD "scope" "public"."event_tickets_scope_enum" NOT NULL DEFAULT 'EVENT'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" ADD "scopeReferenceId" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" ADD "allowsTransfer" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" ADD "transferDeadline" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" ADD "allowsWaitlist" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Event tickets
    await queryRunner.query(
      `ALTER TABLE "event_tickets" DROP COLUMN "allowsWaitlist"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" DROP COLUMN "transferDeadline"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" DROP COLUMN "allowsTransfer"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" DROP COLUMN "scopeReferenceId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" DROP COLUMN "scope"`,
    );
    await queryRunner.query(`DROP TYPE "public"."event_tickets_scope_enum"`);

    // Event sessions
    await queryRunner.query(
      `ALTER TABLE "event_sessions" DROP COLUMN "status"`,
    );
    await queryRunner.query(`DROP TYPE "public"."event_sessions_status_enum"`);

    // Organizers
    await queryRunner.query(
      `ALTER TABLE "organizers" DROP COLUMN "privacyText"`,
    );
    await queryRunner.query(`ALTER TABLE "organizers" DROP COLUMN "termsText"`);
    await queryRunner.query(
      `ALTER TABLE "organizers" DROP COLUMN "emitsFiscalDocuments"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizers" DROP COLUMN "baseCurrency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizers" DROP COLUMN "fiscalAddress"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizers" DROP COLUMN "businessName"`,
    );
    await queryRunner.query(`ALTER TABLE "organizers" DROP COLUMN "ruc"`);

    // Attendees
    await queryRunner.query(
      `ALTER TABLE "attendees" DROP CONSTRAINT "FK_attendee_person"`,
    );
    await queryRunner.query(`ALTER TABLE "attendees" DROP COLUMN "personId"`);

    // Personas
    await queryRunner.query(
      `ALTER TABLE "persons" DROP CONSTRAINT "FK_person_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "persons" DROP CONSTRAINT "FK_person_merged"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_person_email"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_person_document"`);
    await queryRunner.query(`DROP TABLE "persons"`);
    await queryRunner.query(`DROP TYPE "public"."persons_status_enum"`);
  }
}
