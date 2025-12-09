import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJsonbGinIndexes1733600000003 implements MigrationInterface {
  name = 'AddJsonbGinIndexes1733600000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // AUDIT_LOGS TABLE - GIN indexes for JSONB fields
    // ============================================================
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_previous_values_gin" ON "audit_logs" USING GIN ("previousValues" jsonb_path_ops)`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_new_values_gin" ON "audit_logs" USING GIN ("newValues" jsonb_path_ops)`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_metadata_gin" ON "audit_logs" USING GIN ("metadata" jsonb_path_ops)`,
    );

    // ============================================================
    // PAYMENTS TABLE - GIN indexes for JSONB fields
    // ============================================================
    await queryRunner.query(
      `CREATE INDEX "idx_payments_metadata_gin" ON "payments" USING GIN ("metadata" jsonb_path_ops)`,
    );

    await queryRunner.query(
      `CREATE INDEX "idx_payments_billing_data_gin" ON "payments" USING GIN ("billingData" jsonb_path_ops)`,
    );

    // ============================================================
    // SESSION_ATTENDANCE TABLE - GIN index for JSONB field
    // ============================================================
    await queryRunner.query(
      `CREATE INDEX "idx_session_attendance_virtual_connections_gin" ON "session_attendances" USING GIN ("virtualConnections" jsonb_path_ops)`,
    );

    // ============================================================
    // CERTIFICATES TABLE - GIN indexes for JSONB fields
    // Note: certificates.metadata is simple-json (TEXT), NOT JSONB - skip it
    // ============================================================
    await queryRunner.query(
      `CREATE INDEX "idx_certificates_version_history_gin" ON "certificates" USING GIN ("versionHistory" jsonb_path_ops)`,
    );

    // ============================================================
    // EVENTS TABLE - GIN index for JSONB field
    // ============================================================
    await queryRunner.query(
      `CREATE INDEX "idx_events_metadata_snapshot_gin" ON "events" USING GIN ("metadataSnapshot" jsonb_path_ops)`,
    );

    // ============================================================
    // REFUNDS TABLE - GIN index for JSONB field
    // ============================================================
    await queryRunner.query(
      `CREATE INDEX "idx_refunds_bank_details_gin" ON "refunds" USING GIN ("bankDetails" jsonb_path_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ============================================================
    // Drop all GIN indexes in reverse order
    // ============================================================

    // REFUNDS TABLE
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_refunds_bank_details_gin"`,
    );

    // EVENTS TABLE
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_events_metadata_snapshot_gin"`,
    );

    // CERTIFICATES TABLE
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_certificates_version_history_gin"`,
    );

    // SESSION_ATTENDANCE TABLE
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_session_attendance_virtual_connections_gin"`,
    );

    // PAYMENTS TABLE
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_payments_billing_data_gin"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_payments_metadata_gin"`,
    );

    // AUDIT_LOGS TABLE
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_audit_logs_metadata_gin"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_audit_logs_new_values_gin"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_audit_logs_previous_values_gin"`,
    );
  }
}
