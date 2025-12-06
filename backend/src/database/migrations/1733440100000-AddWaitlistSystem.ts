import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWaitlistSystem1733440100000 implements MigrationInterface {
  name = 'AddWaitlistSystem1733440100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar campo waitlistInvitationHours a event_tickets
    await queryRunner.query(
      `ALTER TABLE "event_tickets" ADD "waitlistInvitationHours" integer NOT NULL DEFAULT 24`,
    );

    // 2. Crear enum para estados de lista de espera
    await queryRunner.query(
      `CREATE TYPE "public"."waitlist_entries_status_enum" AS ENUM('WAITING', 'INVITED', 'CONVERTED', 'EXPIRED', 'CANCELLED')`,
    );

    // 3. Crear tabla waitlist_entries
    await queryRunner.query(`
      CREATE TABLE "waitlist_entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" text NOT NULL,
        "status" "public"."waitlist_entries_status_enum" NOT NULL DEFAULT 'WAITING',
        "priority" integer NOT NULL,
        "purchaseToken" text,
        "invitedAt" TIMESTAMP WITH TIME ZONE,
        "invitationExpiresAt" TIMESTAMP WITH TIME ZONE,
        "convertedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "eventTicketId" uuid NOT NULL,
        "personId" uuid NOT NULL,
        CONSTRAINT "PK_waitlist_entries_id" PRIMARY KEY ("id")
      )
    `);

    // 4. Crear índices para queries eficientes
    await queryRunner.query(
      `CREATE INDEX "IDX_waitlist_ticket_status" ON "waitlist_entries" ("eventTicketId", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_waitlist_ticket_status_priority" ON "waitlist_entries" ("eventTicketId", "status", "priority")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_waitlist_purchase_token" ON "waitlist_entries" ("purchaseToken") WHERE "purchaseToken" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_waitlist_person_ticket" ON "waitlist_entries" ("personId", "eventTicketId")`,
    );

    // 5. Agregar foreign keys
    await queryRunner.query(
      `ALTER TABLE "waitlist_entries" ADD CONSTRAINT "FK_waitlist_ticket" FOREIGN KEY ("eventTicketId") REFERENCES "event_tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "waitlist_entries" ADD CONSTRAINT "FK_waitlist_person" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys
    await queryRunner.query(
      `ALTER TABLE "waitlist_entries" DROP CONSTRAINT "FK_waitlist_person"`,
    );
    await queryRunner.query(
      `ALTER TABLE "waitlist_entries" DROP CONSTRAINT "FK_waitlist_ticket"`,
    );

    // Eliminar índices
    await queryRunner.query(
      `DROP INDEX "public"."IDX_waitlist_person_ticket"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_waitlist_purchase_token"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_waitlist_ticket_status_priority"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_waitlist_ticket_status"`,
    );

    // Eliminar tabla
    await queryRunner.query(`DROP TABLE "waitlist_entries"`);

    // Eliminar enum
    await queryRunner.query(
      `DROP TYPE "public"."waitlist_entries_status_enum"`,
    );

    // Eliminar campo de event_tickets
    await queryRunner.query(
      `ALTER TABLE "event_tickets" DROP COLUMN "waitlistInvitationHours"`,
    );
  }
}
