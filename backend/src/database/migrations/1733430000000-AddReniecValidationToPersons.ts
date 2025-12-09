import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddReniecValidationToPersons1733430000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna reniecValidationScore (puntuación de validación RENIEC 0-100)
    await queryRunner.addColumn(
      'persons',
      new TableColumn({
        name: 'reniecValidationScore',
        type: 'int',
        isNullable: true,
        comment: 'Puntuación de coincidencia con RENIEC (0-100)',
      }),
    );

    // Agregar columna reniecValidatedAt (fecha de última validación RENIEC)
    await queryRunner.addColumn(
      'persons',
      new TableColumn({
        name: 'reniecValidatedAt',
        type: 'timestamptz',
        isNullable: true,
        comment: 'Fecha y hora de la última validación con RENIEC',
      }),
    );

    // Crear índice para búsquedas de personas con datos observados
    await queryRunner.query(
      `CREATE INDEX "IDX_persons_flag_data_observed" ON "persons" ("flagDataObserved") WHERE "flagDataObserved" = true`,
    );

    // Crear índice para búsquedas de personas validadas con RENIEC
    await queryRunner.query(
      `CREATE INDEX "IDX_persons_reniec_validated" ON "persons" ("reniecValidatedAt") WHERE "reniecValidatedAt" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_persons_reniec_validated"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_persons_flag_data_observed"`,
    );

    // Eliminar columnas
    await queryRunner.dropColumn('persons', 'reniecValidatedAt');
    await queryRunner.dropColumn('persons', 'reniecValidationScore');
  }
}
