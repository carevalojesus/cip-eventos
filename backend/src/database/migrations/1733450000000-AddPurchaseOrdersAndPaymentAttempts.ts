import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPurchaseOrdersAndPaymentAttempts1733450000000
  implements MigrationInterface
{
  name = 'AddPurchaseOrdersAndPaymentAttempts1733450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tabla purchase_orders
    await queryRunner.query(`
      CREATE TABLE "purchase_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "status" character varying NOT NULL DEFAULT 'PENDING',
        "buyerPersonId" uuid,
        "buyerEmail" text NOT NULL,
        "totalAmount" numeric(10,2) NOT NULL,
        "currency" text NOT NULL DEFAULT 'PEN',
        "expiresAt" TIMESTAMP WITH TIME ZONE,
        "paidAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_purchase_orders" PRIMARY KEY ("id")
      )
    `);

    // 2. Crear tabla payment_attempts
    await queryRunner.query(`
      CREATE TABLE "payment_attempts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "purchaseOrderId" uuid NOT NULL,
        "status" character varying NOT NULL DEFAULT 'INITIATED',
        "provider" character varying NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "transactionId" text,
        "errorMessage" text,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_attempts" PRIMARY KEY ("id")
      )
    `);

    // 3. Agregar columna purchaseOrderId a registrations (nullable para compatibilidad)
    await queryRunner.query(`
      ALTER TABLE "registrations"
      ADD COLUMN "purchaseOrderId" uuid
    `);

    // 4. Agregar columna purchaseOrderId a payments (nullable)
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD COLUMN "purchaseOrderId" uuid
    `);

    // 5. Crear indices para purchase_orders
    await queryRunner.query(
      `CREATE INDEX "IDX_purchase_orders_status" ON "purchase_orders" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_purchase_orders_buyerEmail" ON "purchase_orders" ("buyerEmail")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_purchase_orders_status_expiresAt" ON "purchase_orders" ("status", "expiresAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_purchase_orders_createdAt" ON "purchase_orders" ("createdAt")`,
    );

    // 6. Crear indices para payment_attempts
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_attempts_purchaseOrderId" ON "payment_attempts" ("purchaseOrderId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_attempts_status" ON "payment_attempts" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_attempts_provider" ON "payment_attempts" ("provider")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_attempts_transactionId" ON "payment_attempts" ("transactionId")`,
    );

    // 7. Crear foreign keys
    await queryRunner.query(`
      ALTER TABLE "purchase_orders"
      ADD CONSTRAINT "FK_purchase_orders_buyerPersonId"
      FOREIGN KEY ("buyerPersonId") REFERENCES "persons"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "payment_attempts"
      ADD CONSTRAINT "FK_payment_attempts_purchaseOrderId"
      FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "registrations"
      ADD CONSTRAINT "FK_registrations_purchaseOrderId"
      FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_payments_purchaseOrderId"
      FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir en orden inverso

    // 1. Eliminar foreign keys
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_purchaseOrderId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "registrations" DROP CONSTRAINT "FK_registrations_purchaseOrderId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_attempts" DROP CONSTRAINT "FK_payment_attempts_purchaseOrderId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP CONSTRAINT "FK_purchase_orders_buyerPersonId"`,
    );

    // 2. Eliminar indices de payment_attempts
    await queryRunner.query(
      `DROP INDEX "IDX_payment_attempts_transactionId"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_payment_attempts_provider"`);
    await queryRunner.query(`DROP INDEX "IDX_payment_attempts_status"`);
    await queryRunner.query(
      `DROP INDEX "IDX_payment_attempts_purchaseOrderId"`,
    );

    // 3. Eliminar indices de purchase_orders
    await queryRunner.query(`DROP INDEX "IDX_purchase_orders_createdAt"`);
    await queryRunner.query(
      `DROP INDEX "IDX_purchase_orders_status_expiresAt"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_purchase_orders_buyerEmail"`);
    await queryRunner.query(`DROP INDEX "IDX_purchase_orders_status"`);

    // 4. Eliminar columnas agregadas
    await queryRunner.query(
      `ALTER TABLE "payments" DROP COLUMN "purchaseOrderId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "registrations" DROP COLUMN "purchaseOrderId"`,
    );

    // 5. Eliminar tablas
    await queryRunner.query(`DROP TABLE "payment_attempts"`);
    await queryRunner.query(`DROP TABLE "purchase_orders"`);
  }
}
