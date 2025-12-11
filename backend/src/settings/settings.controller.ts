import {
  Controller,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SettingsService, AllSettingsResponse, OrganizationConfig, EmailConfig } from './settings.service';
import { OrganizationSettingsDto, EmailSettingsDto } from './dto/update-settings.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../roles/entities/role.entity';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * GET /settings
   * Obtiene todas las configuraciones del sistema
   * Requiere rol SUPER_ADMIN u ORG_ADMIN
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  async getAllSettings(): Promise<AllSettingsResponse> {
    return this.settingsService.getAllSettings();
  }

  /**
   * GET /settings/organization
   * Obtiene solo la configuración de la organización
   */
  @Get('organization')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  async getOrganization(): Promise<OrganizationConfig> {
    return this.settingsService.getOrganization();
  }

  /**
   * GET /settings/integrations
   * Obtiene el estado de las integraciones
   */
  @Get('integrations')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  async getIntegrations() {
    return this.settingsService.getIntegrationsStatus();
  }

  /**
   * PATCH /settings/organization
   * Actualiza la configuración de la organización
   */
  @Patch('organization')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateOrganization(
    @Body() dto: OrganizationSettingsDto,
  ): Promise<OrganizationConfig> {
    return this.settingsService.updateOrganization(dto);
  }

  /**
   * PATCH /settings/email
   * Actualiza configuraciones de email editables
   */
  @Patch('email')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateEmailSettings(
    @Body() dto: EmailSettingsDto,
  ): Promise<EmailConfig> {
    return this.settingsService.updateEmailSettings(dto);
  }
}
