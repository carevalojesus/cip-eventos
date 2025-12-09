import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddNameToEventLocation1732762800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'event_locations',
      new TableColumn({
        name: 'name',
        type: 'text',
        isNullable: true,
        comment: 'Nombre del lugar (ej: "Facultad de Sistemas")',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('event_locations', 'name');
  }
}
