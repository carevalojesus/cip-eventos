import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { FiscalDocumentsService } from './fiscal-documents.service';
import { CreateFiscalDocumentDto } from './dto/create-fiscal-document.dto';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../roles/entities/role.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import {
  FiscalDocumentStatus,
  FiscalDocumentType,
} from './entities/fiscal-document.entity';

@ApiTags('fiscal-documents')
@ApiBearerAuth()
@Controller('fiscal-documents')
export class FiscalDocumentsController {
  constructor(private readonly fiscalService: FiscalDocumentsService) {}

  // ========== COMPROBANTES ==========

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Emitir comprobante fiscal (Admin)' })
  create(@Body() dto: CreateFiscalDocumentDto, @CurrentUser() user: User) {
    return this.fiscalService.createDocument(dto, user);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar comprobantes fiscales (Admin)' })
  findAll(
    @Query('type') type?: FiscalDocumentType,
    @Query('status') status?: FiscalDocumentStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.fiscalService.findAll({
      type,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('report/:year/:month')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reporte mensual de comprobantes (Admin)' })
  getMonthlyReport(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.fiscalService.getMonthlyReport(year, month);
  }

  @Get('by-payment/:paymentId')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Obtener comprobante por ID de pago' })
  findByPayment(@Param('paymentId', ParseUUIDPipe) paymentId: string) {
    return this.fiscalService.findByPayment(paymentId);
  }

  @Get('by-number/:fullNumber')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Buscar comprobante por número' })
  findByNumber(@Param('fullNumber') fullNumber: string) {
    return this.fiscalService.findByNumber(fullNumber);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Obtener comprobante por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.fiscalService.findOne(id);
  }

  @Post(':id/void')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Anular comprobante fiscal (Admin)' })
  voidDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: User,
  ) {
    return this.fiscalService.voidDocument(id, reason, user);
  }

  // ========== NOTAS DE CRÉDITO ==========

  @Post('credit-notes')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Emitir nota de crédito (Admin)' })
  createCreditNote(
    @Body() dto: CreateCreditNoteDto,
    @CurrentUser() user: User,
  ) {
    return this.fiscalService.createCreditNote(dto, user);
  }

  @Get('credit-notes/list')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar notas de crédito (Admin)' })
  findCreditNotes(@Query('fiscalDocumentId') fiscalDocumentId?: string) {
    return this.fiscalService.findCreditNotes(fiscalDocumentId);
  }
}
