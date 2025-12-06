import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCertificateVersioningFields1733430000000
  implements MigrationInterface
{
  name = 'AddCertificateVersioningFields1733430000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar campos de versionado
    await queryRunner.addColumn(
      'certificates',
      new TableColumn({
        name: 'version',
        type: 'int',
        default: 1,
      }),
    );

    await queryRunner.addColumn(
      'certificates',
      new TableColumn({
        name: 'versionHistory',
        type: 'jsonb',
        isNullable: true,
      }),
    );

    // Agregar campos de revocación
    await queryRunner.addColumn(
      'certificates',
      new TableColumn({
        name: 'revokedAt',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'certificates',
      new TableColumn({
        name: 'revokedReason',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'certificates',
      new TableColumn({
        name: 'revokedById',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Agregar campos de reemisión
    await queryRunner.addColumn(
      'certificates',
      new TableColumn({
        name: 'lastReissuedAt',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'certificates',
      new TableColumn({
        name: 'lastReissuedById',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Crear foreign keys para las relaciones con User
    await queryRunner.query(`
      ALTER TABLE "certificates"
      ADD CONSTRAINT "FK_certificates_revokedById"
      FOREIGN KEY ("revokedById")
      REFERENCES "users"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "certificates"
      ADD CONSTRAINT "FK_certificates_lastReissuedById"
      FOREIGN KEY ("lastReissuedById")
      REFERENCES "users"("id")
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys
    await queryRunner.query(`
      ALTER TABLE "certificates"
      DROP CONSTRAINT "FK_certificates_lastReissuedById"
    `);

    await queryRunner.query(`
      ALTER TABLE "certificates"
      DROP CONSTRAINT "FK_certificates_revokedById"
    `);

    // Eliminar columnas
    await queryRunner.dropColumn('certificates', 'lastReissuedById');
    await queryRunner.dropColumn('certificates', 'lastReissuedAt');
    await queryRunner.dropColumn('certificates', 'revokedById');
    await queryRunner.dropColumn('certificates', 'revokedReason');
    await queryRunner.dropColumn('certificates', 'revokedAt');
    await queryRunner.dropColumn('certificates', 'versionHistory');
    await queryRunner.dropColumn('certificates', 'version');
  }
}
