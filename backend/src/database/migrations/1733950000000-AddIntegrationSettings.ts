import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: AddIntegrationSettings
 *
 * Agrega configuraciones de integraciones a la tabla system_settings.
 * Las credenciales se almacenan encriptadas (isSecret=true).
 */
export class AddIntegrationSettings1733950000000 implements MigrationInterface {
  name = 'AddIntegrationSettings1733950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // RENIEC Integration
    await queryRunner.query(`
      INSERT INTO system_settings ("id", "key", "value", "type", "category", "description", "isSecret", "createdAt", "updatedAt")
      VALUES
        (uuid_generate_v4(), 'integration.reniec.enabled', 'false', 'boolean', 'integrations', 'Habilitar validación RENIEC', false, NOW(), NOW()),
        (uuid_generate_v4(), 'integration.reniec.apiUrl', '', 'string', 'integrations', 'URL del API de RENIEC/DeColecta', false, NOW(), NOW()),
        (uuid_generate_v4(), 'integration.reniec.apiToken', '', 'string', 'integrations', 'Token de autenticación RENIEC', true, NOW(), NOW())
      ON CONFLICT ("key") DO NOTHING
    `);

    // PayPal Integration
    await queryRunner.query(`
      INSERT INTO system_settings ("id", "key", "value", "type", "category", "description", "isSecret", "createdAt", "updatedAt")
      VALUES
        (uuid_generate_v4(), 'integration.paypal.enabled', 'false', 'boolean', 'integrations', 'Habilitar pagos con PayPal', false, NOW(), NOW()),
        (uuid_generate_v4(), 'integration.paypal.mode', 'sandbox', 'string', 'integrations', 'Modo de PayPal (sandbox/live)', false, NOW(), NOW()),
        (uuid_generate_v4(), 'integration.paypal.clientId', '', 'string', 'integrations', 'Client ID de PayPal', false, NOW(), NOW()),
        (uuid_generate_v4(), 'integration.paypal.clientSecret', '', 'string', 'integrations', 'Client Secret de PayPal', true, NOW(), NOW())
      ON CONFLICT ("key") DO NOTHING
    `);

    // CIP Padrón Integration
    await queryRunner.query(`
      INSERT INTO system_settings ("id", "key", "value", "type", "category", "description", "isSecret", "createdAt", "updatedAt")
      VALUES
        (uuid_generate_v4(), 'integration.cip.enabled', 'false', 'boolean', 'integrations', 'Habilitar consulta de padrón CIP', false, NOW(), NOW()),
        (uuid_generate_v4(), 'integration.cip.apiUrl', '', 'string', 'integrations', 'URL del API del Padrón CIP', false, NOW(), NOW()),
        (uuid_generate_v4(), 'integration.cip.apiKey', '', 'string', 'integrations', 'API Key del Padrón CIP', true, NOW(), NOW())
      ON CONFLICT ("key") DO NOTHING
    `);

    // SUNAT Integration
    await queryRunner.query(`
      INSERT INTO system_settings ("id", "key", "value", "type", "category", "description", "isSecret", "createdAt", "updatedAt")
      VALUES
        (uuid_generate_v4(), 'integration.sunat.enabled', 'false', 'boolean', 'integrations', 'Habilitar facturación electrónica', false, NOW(), NOW()),
        (uuid_generate_v4(), 'integration.sunat.ruc', '', 'string', 'integrations', 'RUC del emisor', false, NOW(), NOW()),
        (uuid_generate_v4(), 'integration.sunat.username', '', 'string', 'integrations', 'Usuario SOL', false, NOW(), NOW()),
        (uuid_generate_v4(), 'integration.sunat.password', '', 'string', 'integrations', 'Clave SOL', true, NOW(), NOW()),
        (uuid_generate_v4(), 'integration.sunat.certificatePath', '', 'string', 'integrations', 'Ruta del certificado digital', false, NOW(), NOW())
      ON CONFLICT ("key") DO NOTHING
    `);

    // Twilio Integration
    await queryRunner.query(`
      INSERT INTO system_settings ("id", "key", "value", "type", "category", "description", "isSecret", "createdAt", "updatedAt")
      VALUES
        (uuid_generate_v4(), 'integration.twilio.enabled', 'false', 'boolean', 'integrations', 'Habilitar notificaciones SMS', false, NOW(), NOW()),
        (uuid_generate_v4(), 'integration.twilio.accountSid', '', 'string', 'integrations', 'Account SID de Twilio', false, NOW(), NOW()),
        (uuid_generate_v4(), 'integration.twilio.authToken', '', 'string', 'integrations', 'Auth Token de Twilio', true, NOW(), NOW()),
        (uuid_generate_v4(), 'integration.twilio.phoneNumber', '', 'string', 'integrations', 'Número de teléfono Twilio', false, NOW(), NOW())
      ON CONFLICT ("key") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM system_settings
      WHERE "key" LIKE 'integration.%'
    `);
  }
}
