import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTicketTransfersTable1733440200000
  implements MigrationInterface
{
  name = 'CreateTicketTransfersTable1733440200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear enum para el estado de la transferencia
    await queryRunner.query(
      `CREATE TYPE "public"."ticket_transfers_status_enum" AS ENUM('PENDING', 'COMPLETED', 'CANCELLED', 'REJECTED')`,
    );

    // Crear tabla ticket_transfers
    await queryRunner.query(`
      CREATE TABLE "ticket_transfers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "status" "public"."ticket_transfers_status_enum" NOT NULL DEFAULT 'PENDING',
        "reason" text,
        "rejectionReason" text,
        "transferToken" text,
        "tokenExpiresAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "completedAt" TIMESTAMP WITH TIME ZONE,
        "registrationId" uuid NOT NULL,
        "fromAttendeeId" uuid NOT NULL,
        "toAttendeeId" uuid NOT NULL,
        "fromPersonId" uuid,
        "toPersonId" uuid,
        "initiatedById" uuid,
        "approvedById" uuid,
        CONSTRAINT "PK_ticket_transfers_id" PRIMARY KEY ("id")
      )
    `);

    // Crear índices
    await queryRunner.query(
      `CREATE INDEX "IDX_ticket_transfers_registration" ON "ticket_transfers" ("registrationId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ticket_transfers_status" ON "ticket_transfers" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ticket_transfers_token" ON "ticket_transfers" ("transferToken")`,
    );

    // Crear foreign keys
    await queryRunner.query(`
      ALTER TABLE "ticket_transfers"
      ADD CONSTRAINT "FK_ticket_transfers_registration"
      FOREIGN KEY ("registrationId")
      REFERENCES "registrations"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "ticket_transfers"
      ADD CONSTRAINT "FK_ticket_transfers_fromAttendee"
      FOREIGN KEY ("fromAttendeeId")
      REFERENCES "attendees"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "ticket_transfers"
      ADD CONSTRAINT "FK_ticket_transfers_toAttendee"
      FOREIGN KEY ("toAttendeeId")
      REFERENCES "attendees"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "ticket_transfers"
      ADD CONSTRAINT "FK_ticket_transfers_fromPerson"
      FOREIGN KEY ("fromPersonId")
      REFERENCES "persons"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "ticket_transfers"
      ADD CONSTRAINT "FK_ticket_transfers_toPerson"
      FOREIGN KEY ("toPersonId")
      REFERENCES "persons"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "ticket_transfers"
      ADD CONSTRAINT "FK_ticket_transfers_initiatedBy"
      FOREIGN KEY ("initiatedById")
      REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "ticket_transfers"
      ADD CONSTRAINT "FK_ticket_transfers_approvedBy"
      FOREIGN KEY ("approvedById")
      REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys
    await queryRunner.query(
      `ALTER TABLE "ticket_transfers" DROP CONSTRAINT "FK_ticket_transfers_approvedBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_transfers" DROP CONSTRAINT "FK_ticket_transfers_initiatedBy"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_transfers" DROP CONSTRAINT "FK_ticket_transfers_toPerson"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_transfers" DROP CONSTRAINT "FK_ticket_transfers_fromPerson"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_transfers" DROP CONSTRAINT "FK_ticket_transfers_toAttendee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_transfers" DROP CONSTRAINT "FK_ticket_transfers_fromAttendee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ticket_transfers" DROP CONSTRAINT "FK_ticket_transfers_registration"`,
    );

    // Eliminar índices
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ticket_transfers_token"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ticket_transfers_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ticket_transfers_registration"`,
    );

    // Eliminar tabla
    await queryRunner.query(`DROP TABLE "ticket_transfers"`);

    // Eliminar enum
    await queryRunner.query(
      `DROP TYPE "public"."ticket_transfers_status_enum"`,
    );
  }
}
