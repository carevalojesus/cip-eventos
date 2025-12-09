import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCriticalIndexes1733600000000 implements MigrationInterface {
  name = 'AddCriticalIndexes1733600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. session_attendances table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_session_attendance_attendee_id"
      ON "session_attendances" ("attendeeId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_session_attendance_status"
      ON "session_attendances" ("status")
    `);

    // 2. block_enrollments table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_block_enrollments_attendee_id"
      ON "block_enrollments" ("attendeeId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_block_enrollments_passed"
      ON "block_enrollments" ("passed")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_block_enrollments_enrolled_at"
      ON "block_enrollments" ("enrolledAt")
    `);

    // 3. certificates table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_certificates_issued_at"
      ON "certificates" ("issuedAt")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_certificates_type_status"
      ON "certificates" ("type", "status")
    `);

    // 4. event_tickets table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_event_tickets_event_active"
      ON "event_tickets" ("eventId", "isActive")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_event_tickets_sales_dates"
      ON "event_tickets" ("salesStartAt", "salesEndAt")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_event_tickets_is_visible"
      ON "event_tickets" ("isVisible")
    `);

    // 5. payment_attempts table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_payment_attempts_created_at"
      ON "payment_attempts" ("createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_payment_attempts_status_created"
      ON "payment_attempts" ("status", "createdAt")
    `);

    // 6. coupon_usages table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_coupon_usages_used_at"
      ON "coupon_usages" ("usedAt")
    `);

    // 7. evaluations table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_evaluations_block_type"
      ON "evaluations" ("blockId", "type")
    `);

    // 8. refunds table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_refunds_status_requested"
      ON "refunds" ("status", "requestedAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes in reverse order

    // 8. refunds table indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_refunds_status_requested"`,
    );

    // 7. evaluations table indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_evaluations_block_type"`,
    );

    // 6. coupon_usages table indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_coupon_usages_used_at"`,
    );

    // 5. payment_attempts table indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_payment_attempts_status_created"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_payment_attempts_created_at"`,
    );

    // 4. event_tickets table indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_event_tickets_is_visible"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_event_tickets_sales_dates"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_event_tickets_event_active"`,
    );

    // 3. certificates table indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_certificates_type_status"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_certificates_issued_at"`,
    );

    // 2. block_enrollments table indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_block_enrollments_enrolled_at"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_block_enrollments_passed"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_block_enrollments_attendee_id"`,
    );

    // 1. session_attendances table indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_session_attendance_status"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_session_attendance_attendee_id"`,
    );
  }
}
