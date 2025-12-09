import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateScheduledReportsTable1733480000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "report_type_enum" AS ENUM (
        'DAILY_REGISTRATIONS',
        'DAILY_ATTENDANCE',
        'DAILY_REVENUE',
        'WEEKLY_SUMMARY',
        'MONTHLY_SUMMARY',
        'FINANCIAL_SUMMARY',
        'CERTIFICATE_SUMMARY',
        'EVENT_FINAL_REPORT'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE "report_frequency_enum" AS ENUM (
        'DAILY',
        'WEEKLY',
        'MONTHLY',
        'ON_EVENT_END'
      );
    `);

    await queryRunner.query(`
      CREATE TYPE "report_format_enum" AS ENUM (
        'CSV',
        'EXCEL',
        'PDF'
      );
    `);

    // Create scheduled_reports table
    await queryRunner.createTable(
      new Table({
        name: 'scheduled_reports',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'eventId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'reportType',
            type: 'report_type_enum',
            isNullable: false,
          },
          {
            name: 'frequency',
            type: 'report_frequency_enum',
            isNullable: false,
          },
          {
            name: 'format',
            type: 'report_format_enum',
            isNullable: false,
          },
          {
            name: 'recipients',
            type: 'text[]',
            isNullable: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'lastSentAt',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'nextScheduledAt',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'executionCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'failureCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'lastError',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'config',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdById',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create foreign key to events table
    await queryRunner.createForeignKey(
      'scheduled_reports',
      new TableForeignKey({
        columnNames: ['eventId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'events',
        onDelete: 'CASCADE',
      }),
    );

    // Create foreign key to users table
    await queryRunner.createForeignKey(
      'scheduled_reports',
      new TableForeignKey({
        columnNames: ['createdById'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'scheduled_reports',
      new TableIndex({
        name: 'IDX_scheduled_reports_is_active',
        columnNames: ['isActive'],
      }),
    );

    await queryRunner.createIndex(
      'scheduled_reports',
      new TableIndex({
        name: 'IDX_scheduled_reports_next_scheduled_at',
        columnNames: ['nextScheduledAt'],
      }),
    );

    await queryRunner.createIndex(
      'scheduled_reports',
      new TableIndex({
        name: 'IDX_scheduled_reports_event_is_active',
        columnNames: ['eventId', 'isActive'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('scheduled_reports', 'IDX_scheduled_reports_event_is_active');
    await queryRunner.dropIndex('scheduled_reports', 'IDX_scheduled_reports_next_scheduled_at');
    await queryRunner.dropIndex('scheduled_reports', 'IDX_scheduled_reports_is_active');

    // Drop table (this will also drop foreign keys)
    await queryRunner.dropTable('scheduled_reports', true);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "report_format_enum";`);
    await queryRunner.query(`DROP TYPE "report_frequency_enum";`);
    await queryRunner.query(`DROP TYPE "report_type_enum";`);
  }
}
