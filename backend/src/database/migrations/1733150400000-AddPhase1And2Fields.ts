import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhase1And2Fields1733150400000 implements MigrationInterface {
  name = 'AddPhase1And2Fields1733150400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Phase 1: EventTicket - Control de ventas
    await queryRunner.query(
      `ALTER TABLE "event_tickets" ADD "description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" ADD "salesStartAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" ADD "salesEndAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" ADD "maxPerOrder" integer NOT NULL DEFAULT '10'`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" ADD "isVisible" boolean NOT NULL DEFAULT true`,
    );

    // Phase 1: Event - Check-in control
    await queryRunner.query(
      `ALTER TABLE "events" ADD "checkInStartAt" TIMESTAMP WITH TIME ZONE`,
    );

    // Phase 1: Payment - Facturación peruana
    await queryRunner.query(`ALTER TABLE "payments" ADD "billingData" jsonb`);
    await queryRunner.query(`ALTER TABLE "payments" ADD "invoiceUrl" text`);
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "source" text NOT NULL DEFAULT 'ONLINE'`,
    );

    // Phase 2: Organizer - Email de contacto
    await queryRunner.query(`ALTER TABLE "organizers" ADD "email" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert Phase 2
    await queryRunner.query(`ALTER TABLE "organizers" DROP COLUMN "email"`);

    // Revert Phase 1: Payment
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "source"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "invoiceUrl"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "billingData"`);

    // Revert Phase 1: Event
    await queryRunner.query(
      `ALTER TABLE "events" DROP COLUMN "checkInStartAt"`,
    );

    // Revert Phase 1: EventTicket
    await queryRunner.query(
      `ALTER TABLE "event_tickets" DROP COLUMN "isVisible"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" DROP COLUMN "maxPerOrder"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" DROP COLUMN "salesEndAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" DROP COLUMN "salesStartAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" DROP COLUMN "description"`,
    );
  }
}
