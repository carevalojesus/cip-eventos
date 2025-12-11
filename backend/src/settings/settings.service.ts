import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SystemSettings } from './entities/system-settings.entity';

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

export interface EmailConfig {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
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
  constructor(
    @InjectRepository(SystemSettings)
    private readonly settingsRepository: Repository<SystemSettings>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Inicializar configuraciones por defecto si no existen
    await this.initializeDefaultSettings();
  }

  private async initializeDefaultSettings() {
    const defaults = [
      // Organization
      {
        key: 'org.name',
        value: 'Colegio de Ingenieros del Perú',
        type: 'string' as const,
        category: 'organization' as const,
        description: 'Nombre de la organización',
      },
      {
        key: 'org.shortName',
        value: 'CIP',
        type: 'string' as const,
        category: 'organization' as const,
        description: 'Nombre corto',
      },
      {
        key: 'org.ruc',
        value: '20100039207',
        type: 'string' as const,
        category: 'organization' as const,
        description: 'RUC de la organización',
      },
      {
        key: 'org.address',
        value: 'Av. Arequipa 4947, Miraflores',
        type: 'string' as const,
        category: 'organization' as const,
        description: 'Dirección fiscal',
      },
      {
        key: 'org.phone',
        value: '(01) 445-5500',
        type: 'string' as const,
        category: 'organization' as const,
        description: 'Teléfono de contacto',
      },
      {
        key: 'org.email',
        value: 'info@cip.org.pe',
        type: 'string' as const,
        category: 'organization' as const,
        description: 'Email institucional',
      },
      {
        key: 'org.website',
        value: 'https://www.cip.org.pe',
        type: 'string' as const,
        category: 'organization' as const,
        description: 'Sitio web',
      },
      // Email config editables
      {
        key: 'email.fromName',
        value: 'CIP Eventos',
        type: 'string' as const,
        category: 'email' as const,
        description: 'Nombre del remitente',
      },
    ];

    for (const setting of defaults) {
      const existing = await this.settingsRepository.findOne({
        where: { key: setting.key },
      });
      if (!existing) {
        await this.settingsRepository.save(setting);
      }
    }
  }

  async getAllSettings(): Promise<AllSettingsResponse> {
    const dbSettings = await this.settingsRepository.find();
    const settingsMap = new Map(dbSettings.map((s) => [s.key, s.value]));

    return {
      organization: this.getOrganizationConfig(settingsMap),
      integrations: this.getIntegrationsStatus(),
      email: this.getEmailConfig(settingsMap),
      security: this.getSecurityConfig(),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
    };
  }

  async getOrganization(): Promise<OrganizationConfig> {
    const dbSettings = await this.settingsRepository.find({
      where: { category: 'organization' },
    });
    const settingsMap = new Map(dbSettings.map((s) => [s.key, s.value]));
    return this.getOrganizationConfig(settingsMap);
  }

  private getOrganizationConfig(
    settingsMap: Map<string, string | null>,
  ): OrganizationConfig {
    return {
      name: settingsMap.get('org.name') || 'Colegio de Ingenieros del Perú',
      shortName: settingsMap.get('org.shortName') || 'CIP',
      ruc: settingsMap.get('org.ruc') || '',
      address: settingsMap.get('org.address') || '',
      phone: settingsMap.get('org.phone') || '',
      email: settingsMap.get('org.email') || '',
      website: settingsMap.get('org.website') || '',
    };
  }

  getIntegrationsStatus(): IntegrationStatus[] {
    const reniecEnabled =
      this.configService.get<string>('RENIEC_VALIDATION_ENABLED') === 'true';
    const reniecConfigured =
      !!this.configService.get<string>('RENIEC_API_URL') &&
      !!this.configService.get<string>('RENIEC_API_TOKEN');

    const paypalEnabled =
      this.configService.get<string>('PAYPAL_MODE') !== undefined;
    const paypalConfigured =
      !!this.configService.get<string>('PAYPAL_CLIENT_ID') &&
      !!this.configService.get<string>('PAYPAL_CLIENT_SECRET');

    const cipEnabled =
      this.configService.get<string>('CIP_API_ENABLED') === 'true';
    const cipConfigured = !!this.configService.get<string>('CIP_API_URL');

    const sunatEnabled =
      this.configService.get<string>('SUNAT_ENABLED') === 'true';
    const sunatConfigured =
      !!this.configService.get<string>('SUNAT_CERTIFICATE_PATH');

    const twilioEnabled =
      this.configService.get<string>('TWILIO_ENABLED') === 'true';
    const twilioConfigured =
      !!this.configService.get<string>('TWILIO_ACCOUNT_SID') &&
      !!this.configService.get<string>('TWILIO_AUTH_TOKEN');

    return [
      {
        name: 'RENIEC / DeColecta',
        key: 'reniec',
        enabled: reniecEnabled,
        configured: reniecConfigured,
        description: 'Validación de identidad con DNI peruano',
      },
      {
        name: 'PayPal',
        key: 'paypal',
        enabled: paypalEnabled,
        configured: paypalConfigured,
        description: 'Procesamiento de pagos con tarjeta',
      },
      {
        name: 'Padrón CIP',
        key: 'cip',
        enabled: cipEnabled,
        configured: cipConfigured,
        description: 'Consulta de colegiados activos',
      },
      {
        name: 'SUNAT / Facturación',
        key: 'sunat',
        enabled: sunatEnabled,
        configured: sunatConfigured,
        description: 'Emisión de comprobantes electrónicos',
      },
      {
        name: 'Twilio SMS',
        key: 'twilio',
        enabled: twilioEnabled,
        configured: twilioConfigured,
        description: 'Notificaciones por SMS',
      },
    ];
  }

  private getEmailConfig(
    settingsMap: Map<string, string | null>,
  ): EmailConfig {
    const smtpHost = this.configService.get<string>('SMTP_HOST', '');
    const smtpPort = this.configService.get<string>('SMTP_PORT', '');
    const smtpUser = this.configService.get<string>('SMTP_USER', '');

    const isConfigured = !!(smtpHost && smtpPort && smtpUser);

    return {
      smtpHost: smtpHost || 'No configurado',
      smtpPort: smtpPort || '-',
      smtpUser: smtpUser ? this.maskEmail(smtpUser) : 'No configurado',
      fromName:
        settingsMap.get('email.fromName') ||
        this.configService.get<string>('MAIL_FROM_NAME', 'CIP Eventos'),
      fromEmail: this.configService.get<string>(
        'MAIL_FROM_ADDRESS',
        'eventos@cip.org.pe',
      ),
      isConfigured,
    };
  }

  private getSecurityConfig(): SecurityConfig {
    return {
      jwtExpiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
      passwordMinLength: 8,
      maxLoginAttempts: 5,
      sessionTimeout: '24h',
      twoFactorEnabled: false,
    };
  }

  private maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    if (!domain) return email;
    const maskedUser =
      user.length > 3 ? user.substring(0, 3) + '***' : user + '***';
    return `${maskedUser}@${domain}`;
  }

  async updateSetting(key: string, value: string): Promise<SystemSettings> {
    let setting = await this.settingsRepository.findOne({ where: { key } });

    if (!setting) {
      setting = this.settingsRepository.create({
        key,
        value,
        type: 'string',
        category: this.getCategoryFromKey(key),
      });
    } else {
      setting.value = value;
    }

    return this.settingsRepository.save(setting);
  }

  async updateOrganization(
    data: Partial<OrganizationConfig>,
  ): Promise<OrganizationConfig> {
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
        await this.updateSetting(
          dbKey,
          data[field as keyof OrganizationConfig] as string,
        );
      }
    }

    return this.getOrganization();
  }

  async updateEmailSettings(data: {
    fromName?: string;
  }): Promise<EmailConfig> {
    if (data.fromName) {
      await this.updateSetting('email.fromName', data.fromName);
    }

    const dbSettings = await this.settingsRepository.find({
      where: { category: 'email' },
    });
    const settingsMap = new Map(dbSettings.map((s) => [s.key, s.value]));
    return this.getEmailConfig(settingsMap);
  }

  private getCategoryFromKey(
    key: string,
  ): 'general' | 'organization' | 'email' | 'integrations' | 'security' {
    if (key.startsWith('org.')) return 'organization';
    if (key.startsWith('email.')) return 'email';
    if (key.startsWith('integration.')) return 'integrations';
    if (key.startsWith('security.')) return 'security';
    return 'general';
  }
}
