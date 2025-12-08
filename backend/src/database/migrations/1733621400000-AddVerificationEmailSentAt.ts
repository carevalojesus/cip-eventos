import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVerificationEmailSentAt1733621400000
  implements MigrationInterface
{
  name = 'AddVerificationEmailSentAt1733621400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "verificationEmailSentAt" TIMESTAMP WITH TIME ZONE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "verificationEmailSentAt"
    `);
  }
}
