import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMetadataToPurchaseOrders1733480000000
  implements MigrationInterface
{
  name = 'AddMetadataToPurchaseOrders1733480000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna metadata de tipo JSONB a purchase_orders
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" ADD "metadata" jsonb`,
    );

    // Crear índice GIN para búsquedas eficientes en el campo JSONB
    await queryRunner.query(
      `CREATE INDEX "IDX_purchase_orders_metadata_clientIp" ON "purchase_orders" USING gin (metadata jsonb_path_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índice
    await queryRunner.query(
      `DROP INDEX "IDX_purchase_orders_metadata_clientIp"`,
    );

    // Eliminar columna metadata
    await queryRunner.query(
      `ALTER TABLE "purchase_orders" DROP COLUMN "metadata"`,
    );
  }
}
