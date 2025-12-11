import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddForcePasswordReset1733865600000 implements MigrationInterface {
  name = 'AddForcePasswordReset1733865600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "forcePasswordReset" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "forcePasswordReset"
    `);
  }
}
