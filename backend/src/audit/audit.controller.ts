import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLogFilterDto } from './dto/audit-log-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EmailVerifiedGuard } from '../auth/guards/email-verified.guard';

/**
 * Controlador de Auditoría
 * Solo accesible para administradores
 */
@Controller('audit')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /audit
   * Lista todos los logs de auditoría con filtros
   */
  @Get()
  async findAll(@Query() filterDto: AuditLogFilterDto) {
    return this.auditService.findAll(filterDto);
  }

  /**
   * GET /audit/user/:userId
   * Obtiene todas las acciones realizadas por un usuario
   */
  @Get('user/:userId')
  async findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.findByUser(
      userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  /**
   * GET /audit/entity/:type/:id
   * Obtiene el historial de auditoría de una entidad específica
   */
  @Get('entity/:type/:id')
  async findByEntity(
    @Param('type') entityType: string,
    @Param('id', ParseUUIDPipe) entityId: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.findByEntity(
      entityType,
      entityId,
      limit ? Number(limit) : 50,
    );
  }

  /**
   * GET /audit/:id
   * Obtiene un log específico por ID
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditService.findOne(id);
  }
}
