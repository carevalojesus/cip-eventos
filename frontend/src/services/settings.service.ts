import api from "@/lib/api";

// ============================================
// Types
// ============================================

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
  enabled: string;
  [key: string]: string;
}

export interface EmailConfig {
  provider: 'resend' | 'smtp';
  resendConfigured: boolean;
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

export interface UpdateOrganizationDto {
  name?: string;
  shortName?: string;
  ruc?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface UpdateEmailSettingsDto {
  provider?: 'resend' | 'smtp';
  resendApiKey?: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
  fromName?: string;
  fromEmail?: string;
}

// ============================================
// Settings Service
// ============================================

export const settingsService = {
  /**
   * Obtiene todas las configuraciones del sistema
   */
  async getAllSettings(): Promise<AllSettingsResponse> {
    const response = await api.get<AllSettingsResponse>("/settings");
    return response.data;
  },

  /**
   * Obtiene solo la configuración de la organización
   */
  async getOrganization(): Promise<OrganizationConfig> {
    const response = await api.get<OrganizationConfig>("/settings/organization");
    return response.data;
  },

  /**
   * Obtiene el estado de las integraciones
   */
  async getIntegrations(): Promise<IntegrationStatus[]> {
    const response = await api.get<IntegrationStatus[]>("/settings/integrations");
    return response.data;
  },

  /**
   * Obtiene la configuración de una integración específica
   */
  async getIntegrationConfig(key: string): Promise<IntegrationConfig> {
    const response = await api.get<IntegrationConfig>(`/settings/integrations/${key}`);
    return response.data;
  },

  /**
   * Actualiza la configuración de una integración
   */
  async updateIntegration(key: string, data: Record<string, string>): Promise<IntegrationStatus[]> {
    const response = await api.patch<IntegrationStatus[]>(`/settings/integrations/${key}`, data);
    return response.data;
  },

  /**
   * Actualiza la configuración de la organización
   */
  async updateOrganization(data: UpdateOrganizationDto): Promise<OrganizationConfig> {
    const response = await api.patch<OrganizationConfig>("/settings/organization", data);
    return response.data;
  },

  /**
   * Obtiene la configuración de email para edición
   */
  async getEmailConfig(): Promise<Record<string, string>> {
    const response = await api.get<Record<string, string>>("/settings/email/config");
    return response.data;
  },

  /**
   * Actualiza configuraciones de email
   */
  async updateEmailSettings(data: UpdateEmailSettingsDto): Promise<EmailConfig> {
    const response = await api.patch<EmailConfig>("/settings/email", data);
    return response.data;
  },
};

export default settingsService;
