import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SystemSettings } from './entities/system-settings.entity';
import * as crypto from 'crypto';

export interface OrganizationConfig {
  name: string;
  shortName: string;
  ruc: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

export interface IntegrationStatus {
  name: string;
  key: string;
  enabled: boolean;
  configured: boolean;
  description: string;
}

export interface IntegrationConfig {
  reniec: ReniecConfig;
  paypal: PaypalConfig;
  cip: CipConfig;
  sunat: SunatConfig;
  twilio: TwilioConfig;
}

export interface ReniecConfig {
  enabled: boolean;
  apiUrl: string;
  apiToken: string;
}

export interface PaypalConfig {
  enabled: boolean;
  mode: 'sandbox' | 'live';
  clientId: string;
  clientSecret: string;
}

export interface CipConfig {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
}

export interface SunatConfig {
  enabled: boolean;
  ruc: string;
  username: string;
  password: string;
  certificatePath: string;
}

export interface TwilioConfig {
  enabled: boolean;
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export interface EmailConfig {
  provider: 'resend' | 'smtp';
  // Resend config
  resendConfigured: boolean;
  // SMTP config (legacy/fallback)
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  // Common
  fromName: string;
  fromEmail: string;
  isConfigured: boolean;
}

export interface SecurityConfig {
  jwtExpiresIn: string;
  passwordMinLength: number;
  maxLoginAttempts: number;
  sessionTimeout: string;
  twoFactorEnabled: boolean;
}

export interface AllSettingsResponse {
  organization: OrganizationConfig;
  integrations: IntegrationStatus[];
  email: EmailConfig;
  security: SecurityConfig;
  environment: string;
}

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  constructor(
    @InjectRepository(SystemSettings)
    private readonly settingsRepository: Repository<SystemSettings>,
    private readonly configService: ConfigService,
  ) {
    // Use a 32-byte key for AES-256
    const secret = this.configService.get<string>('ENCRYPTION_SECRET', 'default-encryption-secret-key-32!');
    this.encryptionKey = crypto.scryptSync(secret, 'salt', 32);
  }

  async onModuleInit() {
    await this.initializeDefaultSettings();
  }

  // ============================================
  // Encryption helpers
  // ============================================

  private encrypt(text: string): string {
    if (!text) return '';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) return '';
    try {
      const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return '';
    }
  }

  private maskSecret(value: string): string {
    if (!value || value.length < 8) return '••••••••';
    return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
  }

  // ============================================
  // Default Settings Initialization
  // ============================================

  private async initializeDefaultSettings() {
    const defaults = [
      // Organization
      { key: 'org.name', value: 'Colegio de Ingenieros del Perú', type: 'string' as const, category: 'organization' as const, description: 'Nombre de la organización' },
      { key: 'org.shortName', value: 'CIP', type: 'string' as const, category: 'organization' as const, description: 'Nombre corto' },
      { key: 'org.ruc', value: '20100039207', type: 'string' as const, category: 'organization' as const, description: 'RUC de la organización' },
      { key: 'org.address', value: 'Av. Arequipa 4947, Miraflores', type: 'string' as const, category: 'organization' as const, description: 'Dirección fiscal' },
      { key: 'org.phone', value: '(01) 445-5500', type: 'string' as const, category: 'organization' as const, description: 'Teléfono de contacto' },
      { key: 'org.email', value: 'info@cip.org.pe', type: 'string' as const, category: 'organization' as const, description: 'Email institucional' },
      { key: 'org.website', value: 'https://www.cip.org.pe', type: 'string' as const, category: 'organization' as const, description: 'Sitio web' },
      // Email config editables
      { key: 'email.fromName', value: 'CIP Eventos', type: 'string' as const, category: 'email' as const, description: 'Nombre del remitente' },
    ];

    for (const setting of defaults) {
      const existing = await this.settingsRepository.findOne({ where: { key: setting.key } });
      if (!existing) {
        await this.settingsRepository.save(setting);
      }
    }
  }

  // ============================================
  // Get All Settings
  // ============================================

  async getAllSettings(): Promise<AllSettingsResponse> {
    const dbSettings = await this.settingsRepository.find();
    const settingsMap = new Map(dbSettings.map((s) => [s.key, s]));

    return {
      organization: this.getOrganizationConfig(settingsMap),
      integrations: await this.getIntegrationsStatus(settingsMap),
      email: this.getEmailConfig(settingsMap),
      security: this.getSecurityConfig(),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
    };
  }

  // ============================================
  // Organization Config
  // ============================================

  async getOrganization(): Promise<OrganizationConfig> {
    const dbSettings = await this.settingsRepository.find({ where: { category: 'organization' } });
    const settingsMap = new Map(dbSettings.map((s) => [s.key, s]));
    return this.getOrganizationConfig(settingsMap);
  }

  private getOrganizationConfig(settingsMap: Map<string, SystemSettings>): OrganizationConfig {
    return {
      name: settingsMap.get('org.name')?.value || 'Colegio de Ingenieros del Perú',
      shortName: settingsMap.get('org.shortName')?.value || 'CIP',
      ruc: settingsMap.get('org.ruc')?.value || '',
      address: settingsMap.get('org.address')?.value || '',
      phone: settingsMap.get('org.phone')?.value || '',
      email: settingsMap.get('org.email')?.value || '',
      website: settingsMap.get('org.website')?.value || '',
    };
  }

  async updateOrganization(data: Partial<OrganizationConfig>): Promise<OrganizationConfig> {
    const keyMap: Record<string, string> = {
      name: 'org.name',
      shortName: 'org.shortName',
      ruc: 'org.ruc',
      address: 'org.address',
      phone: 'org.phone',
      email: 'org.email',
      website: 'org.website',
    };

    for (const [field, dbKey] of Object.entries(keyMap)) {
      if (data[field as keyof OrganizationConfig] !== undefined) {
        await this.updateSetting(dbKey, data[field as keyof OrganizationConfig] as string, false);
      }
    }

    return this.getOrganization();
  }

  // ============================================
  // Integrations Config
  // ============================================

  async getIntegrationsStatus(settingsMap?: Map<string, SystemSettings>): Promise<IntegrationStatus[]> {
    if (!settingsMap) {
      const dbSettings = await this.settingsRepository.find({ where: { category: 'integrations' } });
      settingsMap = new Map(dbSettings.map((s) => [s.key, s]));
    }

    const getValue = (key: string): string => {
      const setting = settingsMap!.get(key);
      if (!setting) return '';
      if (setting.isSecret && setting.value) {
        return this.decrypt(setting.value);
      }
      return setting.value || '';
    };

    const isEnabled = (key: string): boolean => getValue(key) === 'true';
    const isConfigured = (requiredFields: string[]): boolean => {
      return requiredFields.every(field => {
        const value = getValue(field);
        return value && value.length > 0;
      });
    };

    return [
      {
        name: 'RENIEC / DeColecta',
        key: 'reniec',
        enabled: isEnabled('integration.reniec.enabled'),
        configured: isConfigured(['integration.reniec.apiUrl', 'integration.reniec.apiToken']),
        description: 'Validación de identidad con DNI peruano',
      },
      {
        name: 'PayPal',
        key: 'paypal',
        enabled: isEnabled('integration.paypal.enabled'),
        configured: isConfigured(['integration.paypal.clientId', 'integration.paypal.clientSecret']),
        description: 'Procesamiento de pagos con tarjeta',
      },
      {
        name: 'Padrón CIP',
        key: 'cip',
        enabled: isEnabled('integration.cip.enabled'),
        configured: isConfigured(['integration.cip.apiUrl', 'integration.cip.apiKey']),
        description: 'Consulta de colegiados activos',
      },
      {
        name: 'SUNAT / Facturación',
        key: 'sunat',
        enabled: isEnabled('integration.sunat.enabled'),
        configured: isConfigured(['integration.sunat.ruc', 'integration.sunat.username', 'integration.sunat.password']),
        description: 'Emisión de comprobantes electrónicos',
      },
      {
        name: 'Twilio SMS',
        key: 'twilio',
        enabled: isEnabled('integration.twilio.enabled'),
        configured: isConfigured(['integration.twilio.accountSid', 'integration.twilio.authToken', 'integration.twilio.phoneNumber']),
        description: 'Notificaciones por SMS',
      },
    ];
  }

  async getIntegrationConfig(integrationKey: string): Promise<Record<string, string>> {
    const prefix = `integration.${integrationKey}.`;
    const dbSettings = await this.settingsRepository.find();
    const integrationSettings = dbSettings.filter(s => s.key.startsWith(prefix));

    const config: Record<string, string> = {};
    for (const setting of integrationSettings) {
      const fieldName = setting.key.replace(prefix, '');
      if (setting.isSecret && setting.value) {
        // Don't return actual secret values, return masked version
        const decrypted = this.decrypt(setting.value);
        config[fieldName] = decrypted ? this.maskSecret(decrypted) : '';
        config[`${fieldName}_hasValue`] = decrypted ? 'true' : 'false';
      } else {
        config[fieldName] = setting.value || '';
      }
    }
    return config;
  }

  async updateIntegration(integrationKey: string, data: Record<string, string>): Promise<IntegrationStatus[]> {
    const prefix = `integration.${integrationKey}.`;

    // Define which fields are secrets for each integration
    const secretFields: Record<string, string[]> = {
      reniec: ['apiToken'],
      paypal: ['clientSecret'],
      cip: ['apiKey'],
      sunat: ['password'],
      twilio: ['authToken'],
    };

    const secrets = secretFields[integrationKey] || [];

    for (const [field, value] of Object.entries(data)) {
      if (value === undefined) continue;

      // Skip masked values (user didn't change the secret)
      if (secrets.includes(field) && value.includes('••••')) {
        continue;
      }

      const isSecret = secrets.includes(field);
      await this.updateSetting(`${prefix}${field}`, value, isSecret);
    }

    return this.getIntegrationsStatus();
  }

  // ============================================
  // Email Config
  // ============================================

  private getEmailConfig(settingsMap: Map<string, SystemSettings>): EmailConfig {
    const provider = this.configService.get<string>('MAIL_PROVIDER', 'smtp') as 'resend' | 'smtp';

    // Resend config
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY', '');
    const resendConfigured = !!resendApiKey;

    // SMTP config (fallback)
    const smtpHost = this.configService.get<string>('MAIL_HOST', '');
    const smtpPort = this.configService.get<string>('MAIL_PORT', '');
    const smtpUser = this.configService.get<string>('MAIL_USER', '');
    const smtpConfigured = !!(smtpHost && smtpPort && smtpUser);

    // Determine if configured based on active provider
    const isConfigured = provider === 'resend' ? resendConfigured : smtpConfigured;

    // Parse MAIL_FROM to extract name and email
    const mailFrom = this.configService.get<string>('MAIL_FROM', 'CIP Eventos <eventos@cip.org.pe>');
    const fromMatch = mailFrom.match(/^(.+?)\s*<(.+?)>$/);
    const fromName = settingsMap.get('email.fromName')?.value || (fromMatch ? fromMatch[1].trim() : 'CIP Eventos');
    const fromEmail = fromMatch ? fromMatch[2] : mailFrom;

    return {
      provider,
      resendConfigured,
      smtpHost: smtpHost || 'No configurado',
      smtpPort: smtpPort || '-',
      smtpUser: smtpUser ? this.maskEmail(smtpUser) : 'No configurado',
      fromName,
      fromEmail,
      isConfigured,
    };
  }

  async updateEmailSettings(data: {
    provider?: string;
    resendApiKey?: string;
    smtpHost?: string;
    smtpPort?: string;
    smtpUser?: string;
    smtpPass?: string;
    fromName?: string;
    fromEmail?: string;
  }): Promise<EmailConfig> {
    // Save email settings to database
    if (data.provider !== undefined) {
      await this.updateSetting('email.provider', data.provider, false);
    }
    if (data.resendApiKey !== undefined && !data.resendApiKey.includes('••••')) {
      await this.updateSetting('email.resendApiKey', data.resendApiKey, true);
    }
    if (data.smtpHost !== undefined) {
      await this.updateSetting('email.smtpHost', data.smtpHost, false);
    }
    if (data.smtpPort !== undefined) {
      await this.updateSetting('email.smtpPort', data.smtpPort, false);
    }
    if (data.smtpUser !== undefined) {
      await this.updateSetting('email.smtpUser', data.smtpUser, false);
    }
    if (data.smtpPass !== undefined && !data.smtpPass.includes('••••')) {
      await this.updateSetting('email.smtpPass', data.smtpPass, true);
    }
    if (data.fromName !== undefined) {
      await this.updateSetting('email.fromName', data.fromName, false);
    }
    if (data.fromEmail !== undefined) {
      await this.updateSetting('email.fromEmail', data.fromEmail, false);
    }

    const dbSettings = await this.settingsRepository.find({ where: { category: 'email' } });
    const settingsMap = new Map(dbSettings.map((s) => [s.key, s]));
    return this.getEmailConfig(settingsMap);
  }

  async getEmailSettings(): Promise<Record<string, string>> {
    const dbSettings = await this.settingsRepository.find({ where: { category: 'email' } });
    const config: Record<string, string> = {};

    for (const setting of dbSettings) {
      const fieldName = setting.key.replace('email.', '');
      if (setting.isSecret && setting.value) {
        const decrypted = this.decrypt(setting.value);
        config[fieldName] = decrypted ? this.maskSecret(decrypted) : '';
        config[`${fieldName}_hasValue`] = decrypted ? 'true' : 'false';
      } else {
        config[fieldName] = setting.value || '';
      }
    }

    // Add env defaults if not in DB
    if (!config.provider) {
      config.provider = this.configService.get<string>('MAIL_PROVIDER', 'smtp');
    }

    return config;
  }

  private maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    if (!domain) return email;
    const maskedUser = user.length > 3 ? user.substring(0, 3) + '***' : user + '***';
    return `${maskedUser}@${domain}`;
  }

  // ============================================
  // Security Config
  // ============================================

  private getSecurityConfig(): SecurityConfig {
    return {
      jwtExpiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
      passwordMinLength: 8,
      maxLoginAttempts: 5,
      sessionTimeout: '24h',
      twoFactorEnabled: false,
    };
  }

  // ============================================
  // Generic Setting Update
  // ============================================

  async updateSetting(key: string, value: string, isSecret: boolean): Promise<SystemSettings> {
    let setting = await this.settingsRepository.findOne({ where: { key } });

    const finalValue = isSecret && value ? this.encrypt(value) : value;

    if (!setting) {
      setting = this.settingsRepository.create({
        key,
        value: finalValue,
        type: 'string',
        category: this.getCategoryFromKey(key),
        isSecret,
      });
    } else {
      setting.value = finalValue;
      setting.isSecret = isSecret;
    }

    return this.settingsRepository.save(setting);
  }

  private getCategoryFromKey(key: string): 'general' | 'organization' | 'email' | 'integrations' | 'security' {
    if (key.startsWith('org.')) return 'organization';
    if (key.startsWith('email.')) return 'email';
    if (key.startsWith('integration.')) return 'integrations';
    if (key.startsWith('security.')) return 'security';
    return 'general';
  }
}
