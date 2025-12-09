import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogsTable1733460000000 implements MigrationInterface {
  name = 'CreateAuditLogsTable1733460000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear enum para las acciones de auditoría
    await queryRunner.query(
      `CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'REVOKE', 'MERGE', 'TRANSFER', 'REISSUE')`,
    );

    // Crear tabla de audit_logs
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "entityType" character varying(100) NOT NULL,
        "entityId" uuid NOT NULL,
        "action" "public"."audit_logs_action_enum" NOT NULL,
        "previousValues" jsonb,
        "newValues" jsonb,
        "changedFields" text,
        "performedById" uuid,
        "performedByEmail" character varying(255),
        "ipAddress" character varying(45),
        "userAgent" text,
        "reason" text,
        "metadata" jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
      )
    `);

    // Crear índices para búsquedas eficientes
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_entity_type" ON "audit_logs" ("entityType")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_entity_id" ON "audit_logs" ("entityId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs" ("createdAt")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_performed_by" ON "audit_logs" ("performedById")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_entity_type_entity_id" ON "audit_logs" ("entityType", "entityId")`,
    );

    // Crear foreign key hacia users (con ON DELETE SET NULL para preservar logs)
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_performed_by" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign key
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_performed_by"`,
    );

    // Eliminar índices
    await queryRunner.query(
      `DROP INDEX "public"."IDX_audit_logs_entity_type_entity_id"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_audit_logs_performed_by"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_audit_logs_created_at"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_audit_logs_entity_id"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_audit_logs_entity_type"`,
    );

    // Eliminar tabla
    await queryRunner.query(`DROP TABLE "audit_logs"`);

    // Eliminar enum
    await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
  }
}
