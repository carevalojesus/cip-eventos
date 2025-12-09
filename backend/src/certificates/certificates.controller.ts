import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { ReissueCertificateDto } from './dto/reissue-certificate.dto';
import { RevokeCertificateDto } from './dto/revoke-certificate.dto';
import { BulkReissueCertificateDto } from './dto/bulk-reissue-certificate.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from 'src/auth/guards/email-verified.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/users/entities/user.entity';

@Controller('certificates')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard, RolesGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  create(@Body() createCertificateDto: CreateCertificateDto) {
    return this.certificatesService.create(createCertificateDto);
  }

  @Post('issue-batch/:eventId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  issueBatch(@Param('eventId') eventId: string) {
    return this.certificatesService.issueBatchCertificates(eventId);
  }

  // ========== CERTIFICADOS DE APROBACIÓN (Bloques Evaluables) ==========

  @Post('approval/:enrollmentId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  issueApproval(@Param('enrollmentId') enrollmentId: string) {
    return this.certificatesService.issueApprovalCertificate(enrollmentId);
  }

  @Post('approval-batch/:blockId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  issueBatchApproval(@Param('blockId') blockId: string) {
    return this.certificatesService.issueBatchApprovalCertificates(blockId);
  }

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  findAll() {
    return this.certificatesService.findAll();
  }

  @Get('verify/:code')
  @Public()
  @Throttle({ short: { limit: 10, ttl: 60000 } }) // 10 requests por minuto para prevenir enumeration attacks
  verify(@Param('code') code: string) {
    return this.certificatesService.findByValidationCode(code);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.certificatesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateCertificateDto: UpdateCertificateDto,
  ) {
    return this.certificatesService.update(id, updateCertificateDto);
  }

  // ========== VERSIONADO Y REEMISIÓN ==========

  @Post(':id/reissue')
  @Roles('ADMIN', 'SUPER_ADMIN')
  reissue(
    @Param('id') id: string,
    @Body() dto: ReissueCertificateDto,
    @CurrentUser() user: User,
  ) {
    return this.certificatesService.reissue(id, dto.reason, user);
  }

  @Post(':id/revoke')
  @Roles('ADMIN', 'SUPER_ADMIN')
  revoke(
    @Param('id') id: string,
    @Body() dto: RevokeCertificateDto,
    @CurrentUser() user: User,
  ) {
    return this.certificatesService.revoke(id, dto.reason, user);
  }

  @Get('validate/:code')
  @Public()
  @Throttle({ short: { limit: 20, ttl: 60000 } }) // 20 requests por minuto
  validate(@Param('code') code: string) {
    return this.certificatesService.validateByCode(code);
  }

  @Get(':id/versions')
  @Roles('ADMIN', 'SUPER_ADMIN')
  getVersions(@Param('id') id: string) {
    return this.certificatesService.getVersionHistory(id);
  }

  @Post('bulk-reissue')
  @Roles('ADMIN', 'SUPER_ADMIN')
  bulkReissue(
    @Body() dto: BulkReissueCertificateDto,
    @CurrentUser() user: User,
  ) {
    return this.certificatesService.bulkReissue(
      dto.certificateIds,
      dto.reason,
      user,
    );
  }

  // ========== ADMINISTRACIÓN ==========

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.certificatesService.remove(id);
  }
}
