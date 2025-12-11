import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSystemSettingsTable1733900000000
  implements MigrationInterface
{
  name = 'CreateSystemSettingsTable1733900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'system_settings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'key',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'value',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            default: "'string'",
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            default: "'general'",
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isSecret',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Index por categoría para filtros rápidos
    await queryRunner.createIndex(
      'system_settings',
      new TableIndex({
        name: 'IDX_system_settings_category',
        columnNames: ['category'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'system_settings',
      'IDX_system_settings_category',
    );
    await queryRunner.dropTable('system_settings');
  }
}
