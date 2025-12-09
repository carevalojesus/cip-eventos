import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCheckConstraints1733600000001 implements MigrationInterface {
  name = 'AddCheckConstraints1733600000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Events table constraints
    await queryRunner.query(
      `ALTER TABLE "events" ADD CONSTRAINT "chk_events_dates" CHECK ("startAt" < "endAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ADD CONSTRAINT "chk_events_checkin_before_start" CHECK ("checkInStartAt" IS NULL OR "checkInStartAt" <= "startAt")`,
    );

    // Payments table constraints
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "chk_payments_amount_positive" CHECK (amount > 0)`,
    );

    // Registrations table constraints
    await queryRunner.query(
      `ALTER TABLE "registrations" ADD CONSTRAINT "chk_registrations_discount" CHECK ("discountAmount" >= 0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "registrations" ADD CONSTRAINT "chk_registrations_prices" CHECK ("finalPrice" >= 0)`,
    );

    // Refunds table constraints
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD CONSTRAINT "chk_refunds_percentage" CHECK ("refundPercentage" >= 0 AND "refundPercentage" <= 100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD CONSTRAINT "chk_refunds_amount" CHECK ("refundAmount" >= 0 AND "refundAmount" <= "originalAmount")`,
    );

    // Event tickets table constraints
    await queryRunner.query(
      `ALTER TABLE "event_tickets" ADD CONSTRAINT "chk_event_tickets_stock" CHECK (stock >= 0 OR stock IS NULL)`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" ADD CONSTRAINT "chk_event_tickets_price" CHECK (price >= 0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" ADD CONSTRAINT "chk_event_tickets_sales_dates" CHECK ("salesStartAt" IS NULL OR "salesEndAt" IS NULL OR "salesStartAt" < "salesEndAt")`,
    );

    // Evaluable blocks table constraints
    await queryRunner.query(
      `ALTER TABLE "evaluable_blocks" ADD CONSTRAINT "chk_blocks_dates" CHECK ("startAt" IS NULL OR "endAt" IS NULL OR "startAt" < "endAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluable_blocks" ADD CONSTRAINT "chk_blocks_enrollment_dates" CHECK ("enrollmentStartAt" IS NULL OR "enrollmentEndAt" IS NULL OR "enrollmentStartAt" < "enrollmentEndAt")`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluable_blocks" ADD CONSTRAINT "chk_blocks_grades" CHECK ("minPassingGrade" >= 0 AND "minPassingGrade" <= "maxGrade")`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluable_blocks" ADD CONSTRAINT "chk_blocks_attendance" CHECK ("minAttendancePercentage" >= 0 AND "minAttendancePercentage" <= 100)`,
    );

    // Participant grades table constraints
    await queryRunner.query(
      `ALTER TABLE "participant_grades" ADD CONSTRAINT "chk_grades_value" CHECK (grade >= 0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant_grades" ADD CONSTRAINT "chk_grades_normalized" CHECK ("normalizedGrade" >= 0)`,
    );

    // Session attendance table constraints
    await queryRunner.query(
      `ALTER TABLE "session_attendances" ADD CONSTRAINT "chk_attendance_minutes" CHECK ("minutesAttended" >= 0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "session_attendances" ADD CONSTRAINT "chk_attendance_percentage" CHECK ("attendancePercentage" >= 0 AND "attendancePercentage" <= 100)`,
    );

    // Coupons table constraints
    await queryRunner.query(
      `ALTER TABLE "coupons" ADD CONSTRAINT "chk_coupons_value" CHECK (value >= 0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupons" ADD CONSTRAINT "chk_coupons_dates" CHECK ("validFrom" IS NULL OR "validUntil" IS NULL OR "validFrom" < "validUntil")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop coupons table constraints
    await queryRunner.query(
      `ALTER TABLE "coupons" DROP CONSTRAINT "chk_coupons_dates"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupons" DROP CONSTRAINT "chk_coupons_value"`,
    );

    // Drop session attendance table constraints
    await queryRunner.query(
      `ALTER TABLE "session_attendances" DROP CONSTRAINT "chk_attendance_percentage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "session_attendances" DROP CONSTRAINT "chk_attendance_minutes"`,
    );

    // Drop participant grades table constraints
    await queryRunner.query(
      `ALTER TABLE "participant_grades" DROP CONSTRAINT "chk_grades_normalized"`,
    );
    await queryRunner.query(
      `ALTER TABLE "participant_grades" DROP CONSTRAINT "chk_grades_value"`,
    );

    // Drop evaluable blocks table constraints
    await queryRunner.query(
      `ALTER TABLE "evaluable_blocks" DROP CONSTRAINT "chk_blocks_attendance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluable_blocks" DROP CONSTRAINT "chk_blocks_grades"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluable_blocks" DROP CONSTRAINT "chk_blocks_enrollment_dates"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluable_blocks" DROP CONSTRAINT "chk_blocks_dates"`,
    );

    // Drop event tickets table constraints
    await queryRunner.query(
      `ALTER TABLE "event_tickets" DROP CONSTRAINT "chk_event_tickets_sales_dates"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" DROP CONSTRAINT "chk_event_tickets_price"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_tickets" DROP CONSTRAINT "chk_event_tickets_stock"`,
    );

    // Drop refunds table constraints
    await queryRunner.query(
      `ALTER TABLE "refunds" DROP CONSTRAINT "chk_refunds_amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" DROP CONSTRAINT "chk_refunds_percentage"`,
    );

    // Drop registrations table constraints
    await queryRunner.query(
      `ALTER TABLE "registrations" DROP CONSTRAINT "chk_registrations_prices"`,
    );
    await queryRunner.query(
      `ALTER TABLE "registrations" DROP CONSTRAINT "chk_registrations_discount"`,
    );

    // Drop payments table constraints
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "chk_payments_amount_positive"`,
    );

    // Drop events table constraints
    await queryRunner.query(
      `ALTER TABLE "events" DROP CONSTRAINT "chk_events_checkin_before_start"`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" DROP CONSTRAINT "chk_events_dates"`,
    );
  }
}
