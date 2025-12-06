import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddNotificationLogs1733440000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla notification_logs
    await queryRunner.createTable(
      new Table({
        name: 'notification_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '100',
            comment: 'Tipo de notificación (REGISTRATION_PENDING, PAYMENT_CONFIRMED, etc)',
          },
          {
            name: 'channel',
            type: 'enum',
            enum: ['EMAIL', 'IN_APP', 'SMS'],
            default: "'EMAIL'",
          },
          {
            name: 'recipientEmail',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'recipientUserId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'entityType',
            type: 'varchar',
            length: '100',
            comment: 'Tipo de entidad (Registration, Payment, Certificate, etc)',
          },
          {
            name: 'entityId',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['QUEUED', 'SENT', 'FAILED'],
            default: "'QUEUED'",
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'sentAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Crear índices para optimizar búsquedas
    await queryRunner.createIndex(
      'notification_logs',
      new TableIndex({
        name: 'IDX_notification_logs_entity',
        columnNames: ['entityType', 'entityId'],
      }),
    );

    await queryRunner.createIndex(
      'notification_logs',
      new TableIndex({
        name: 'IDX_notification_logs_recipient_email',
        columnNames: ['recipientEmail'],
      }),
    );

    await queryRunner.createIndex(
      'notification_logs',
      new TableIndex({
        name: 'IDX_notification_logs_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'notification_logs',
      new TableIndex({
        name: 'IDX_notification_logs_created_at',
        columnNames: ['createdAt'],
      }),
    );

    // Crear foreign key para recipientUserId
    await queryRunner.createForeignKey(
      'notification_logs',
      new TableForeignKey({
        name: 'FK_notification_logs_recipient_user',
        columnNames: ['recipientUserId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign key
    await queryRunner.dropForeignKey(
      'notification_logs',
      'FK_notification_logs_recipient_user',
    );

    // Eliminar índices
    await queryRunner.dropIndex(
      'notification_logs',
      'IDX_notification_logs_created_at',
    );
    await queryRunner.dropIndex('notification_logs', 'IDX_notification_logs_status');
    await queryRunner.dropIndex(
      'notification_logs',
      'IDX_notification_logs_recipient_email',
    );
    await queryRunner.dropIndex('notification_logs', 'IDX_notification_logs_entity');

    // Eliminar tabla
    await queryRunner.dropTable('notification_logs');
  }
}
