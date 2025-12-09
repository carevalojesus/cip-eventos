import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { I18nService, I18nContext } from 'nestjs-i18n';

import {
  FiscalDocument,
  FiscalDocumentStatus,
  FiscalDocumentType,
} from './entities/fiscal-document.entity';
import { FiscalSeries } from './entities/fiscal-series.entity';
import {
  CreditNote,
  CreditNoteReason,
} from './entities/credit-note.entity';
import { CreateFiscalDocumentDto } from './dto/create-fiscal-document.dto';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';

import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { User } from '../users/entities/user.entity';

const IGV_RATE = 0.18; // 18% IGV Perú

@Injectable()
export class FiscalDocumentsService {
  private readonly logger = new Logger(FiscalDocumentsService.name);

  // Datos del emisor (CIP) - desde configuración
  private readonly emitterRuc: string;
  private readonly emitterName: string;
  private readonly emitterAddress: string;

  constructor(
    @InjectRepository(FiscalDocument)
    private readonly documentRepo: Repository<FiscalDocument>,
    @InjectRepository(FiscalSeries)
    private readonly seriesRepo: Repository<FiscalSeries>,
    @InjectRepository(CreditNote)
    private readonly creditNoteRepo: Repository<CreditNote>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {
    this.emitterRuc = this.configService.get<string>(
      'FISCAL_EMITTER_RUC',
      '20123456789',
    );
    this.emitterName = this.configService.get<string>(
      'FISCAL_EMITTER_NAME',
      'COLEGIO DE INGENIEROS DEL PERU',
    );
    this.emitterAddress = this.configService.get<string>(
      'FISCAL_EMITTER_ADDRESS',
      'Av. Arequipa 4947, Miraflores, Lima',
    );
  }

  // ========== EMISIÓN DE COMPROBANTES ==========

  async createDocument(
    dto: CreateFiscalDocumentDto,
    user: User,
  ): Promise<FiscalDocument> {
    // Validar pago
    const payment = await this.paymentRepo.findOne({
      where: { id: dto.paymentId },
      relations: ['registration', 'registration.event'],
    });

    if (!payment) {
      throw new NotFoundException(
        this.i18n.t('fiscal.payment_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException(
        this.i18n.t('fiscal.payment_not_completed', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Verificar que no exista comprobante para este pago
    const existing = await this.documentRepo.findOne({
      where: { payment: { id: dto.paymentId } },
    });

    if (existing) {
      throw new BadRequestException(
        this.i18n.t('fiscal.document_already_exists', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Validar datos según tipo
    if (dto.type === FiscalDocumentType.FACTURA) {
      if (!dto.rucReceiver) {
        throw new BadRequestException(
          this.i18n.t('fiscal.ruc_required', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }
      if (!dto.addressReceiver) {
        throw new BadRequestException(
          this.i18n.t('fiscal.address_required', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }
    } else {
      if (!dto.dniReceiver) {
        throw new BadRequestException(
          this.i18n.t('fiscal.dni_required', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }
    }

    // Usar transacción para garantizar correlativo único
    return await this.dataSource.transaction(async (manager) => {
      // Obtener siguiente correlativo con bloqueo
      const { series, correlative } = await this.getNextCorrelative(
        dto.type,
        manager,
      );

      // Calcular montos
      const total = Number(payment.amount);
      const subtotal = Number((total / (1 + IGV_RATE)).toFixed(2));
      const igv = Number((total - subtotal).toFixed(2));

      // Descripción por defecto
      const description =
        dto.description ||
        `Inscripción al evento: ${payment.registration?.event?.title || 'Evento'}`;

      // Crear documento
      const document = manager.create(FiscalDocument, {
        type: dto.type,
        series,
        correlative,
        fullNumber: `${series}-${correlative.toString().padStart(8, '0')}`,
        status: FiscalDocumentStatus.ISSUED,
        rucEmitter: this.emitterRuc,
        businessNameEmitter: this.emitterName,
        addressEmitter: this.emitterAddress,
        dniReceiver: dto.dniReceiver || null,
        rucReceiver: dto.rucReceiver || null,
        nameReceiver: dto.nameReceiver,
        addressReceiver: dto.addressReceiver || null,
        emailReceiver: dto.emailReceiver || null,
        currency: payment.currency,
        subtotal,
        igv,
        total,
        description,
        payment,
        issuedBy: user,
        issuedAt: new Date(),
      });

      const saved = await manager.save(document);

      this.logger.log(
        `✅ Comprobante emitido: ${saved.fullNumber} por S/ ${total}`,
      );

      // TODO: Aquí se integraría con el proveedor de facturación electrónica (Nubefact, etc.)
      // await this.sendToSunat(saved);

      return saved;
    });
  }

  private async getNextCorrelative(
    type: FiscalDocumentType,
    manager: any,
  ): Promise<{ series: string; correlative: number }> {
    // Serie por defecto según tipo
    const defaultSeries = type === FiscalDocumentType.BOLETA ? 'B001' : 'F001';

    // Buscar o crear serie con bloqueo
    let fiscalSeries = await manager.findOne(FiscalSeries, {
      where: { type, series: defaultSeries, isActive: true },
      lock: { mode: 'pessimistic_write' },
    });

    if (!fiscalSeries) {
      fiscalSeries = manager.create(FiscalSeries, {
        type,
        series: defaultSeries,
        lastCorrelative: 0,
      });
    }

    // Incrementar correlativo
    fiscalSeries.lastCorrelative += 1;
    await manager.save(fiscalSeries);

    return {
      series: fiscalSeries.series,
      correlative: fiscalSeries.lastCorrelative,
    };
  }

  // ========== CONSULTAS ==========

  async findAll(filters?: {
    type?: FiscalDocumentType;
    status?: FiscalDocumentStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<FiscalDocument[]> {
    const query = this.documentRepo
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.payment', 'payment')
      .leftJoinAndSelect('doc.issuedBy', 'issuedBy')
      .orderBy('doc.issuedAt', 'DESC');

    if (filters?.type) {
      query.andWhere('doc.type = :type', { type: filters.type });
    }

    if (filters?.status) {
      query.andWhere('doc.status = :status', { status: filters.status });
    }

    if (filters?.startDate) {
      query.andWhere('doc.issuedAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      query.andWhere('doc.issuedAt <= :endDate', { endDate: filters.endDate });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<FiscalDocument> {
    const document = await this.documentRepo.findOne({
      where: { id },
      relations: ['payment', 'payment.registration', 'issuedBy', 'voidedBy'],
    });

    if (!document) {
      throw new NotFoundException(
        this.i18n.t('fiscal.document_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    return document;
  }

  async findByPayment(paymentId: string): Promise<FiscalDocument | null> {
    return this.documentRepo.findOne({
      where: { payment: { id: paymentId } },
    });
  }

  async findByNumber(fullNumber: string): Promise<FiscalDocument | null> {
    return this.documentRepo.findOne({
      where: { fullNumber },
      relations: ['payment'],
    });
  }

  // ========== ANULACIÓN ==========

  async voidDocument(
    id: string,
    reason: string,
    user: User,
  ): Promise<FiscalDocument> {
    const document = await this.findOne(id);

    if (document.status === FiscalDocumentStatus.VOIDED) {
      throw new BadRequestException(
        this.i18n.t('fiscal.already_voided', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Validar que se pueda anular (dentro del plazo permitido por SUNAT)
    const issuedAt = document.issuedAt;
    if (!issuedAt) {
      throw new BadRequestException(
        this.i18n.t('fiscal.document_not_issued', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }
    const now = new Date();
    const daysSinceIssued = Math.floor(
      (now.getTime() - issuedAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceIssued > 7) {
      throw new BadRequestException(
        this.i18n.t('fiscal.void_period_exceeded', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    document.status = FiscalDocumentStatus.VOIDED;
    document.voidReason = reason;
    document.voidedBy = user;
    document.voidedAt = new Date();

    const saved = await this.documentRepo.save(document);

    this.logger.log(`❌ Comprobante anulado: ${document.fullNumber}`);

    return saved;
  }

  // ========== NOTAS DE CRÉDITO ==========

  async createCreditNote(
    dto: CreateCreditNoteDto,
    user: User,
  ): Promise<CreditNote> {
    const originalDocument = await this.findOne(dto.fiscalDocumentId);

    if (originalDocument.status !== FiscalDocumentStatus.ISSUED &&
        originalDocument.status !== FiscalDocumentStatus.ACCEPTED) {
      throw new BadRequestException(
        this.i18n.t('fiscal.invalid_document_for_credit_note', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      // Obtener siguiente correlativo para nota de crédito
      const seriesPrefix =
        originalDocument.type === FiscalDocumentType.BOLETA ? 'BC' : 'FC';
      const series = `${seriesPrefix}01`;

      let creditNoteSeries = await manager.findOne(FiscalSeries, {
        where: { series, isActive: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!creditNoteSeries) {
        creditNoteSeries = manager.create(FiscalSeries, {
          type: originalDocument.type,
          series,
          lastCorrelative: 0,
        });
      }

      creditNoteSeries.lastCorrelative += 1;
      await manager.save(creditNoteSeries);

      // Calcular montos según porcentaje
      const percentage = dto.percentage / 100;
      const total = Number(
        (Number(originalDocument.total) * percentage).toFixed(2),
      );
      const subtotal = Number((total / (1 + IGV_RATE)).toFixed(2));
      const igv = Number((total - subtotal).toFixed(2));

      const creditNote = manager.create(CreditNote, {
        series,
        correlative: creditNoteSeries.lastCorrelative,
        fullNumber: `${series}-${creditNoteSeries.lastCorrelative.toString().padStart(8, '0')}`,
        status: FiscalDocumentStatus.ISSUED,
        originalDocument,
        reason: dto.reason,
        description: dto.description,
        currency: originalDocument.currency,
        subtotal,
        igv,
        total,
        issuedBy: user,
        issuedAt: new Date(),
      });

      const saved = await manager.save(creditNote);

      this.logger.log(
        `📝 Nota de crédito emitida: ${saved.fullNumber} por S/ ${total}`,
      );

      return saved;
    });
  }

  async findCreditNotes(fiscalDocumentId?: string): Promise<CreditNote[]> {
    const query = this.creditNoteRepo
      .createQueryBuilder('cn')
      .leftJoinAndSelect('cn.originalDocument', 'original')
      .leftJoinAndSelect('cn.issuedBy', 'issuedBy')
      .orderBy('cn.issuedAt', 'DESC');

    if (fiscalDocumentId) {
      query.where('cn.originalDocument.id = :id', { id: fiscalDocumentId });
    }

    return query.getMany();
  }

  // ========== REPORTES ==========

  async getMonthlyReport(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const documents = await this.documentRepo.find({
      where: {
        status: FiscalDocumentStatus.ISSUED,
      },
    });

    const filtered = documents.filter(
      (d) => d.issuedAt && d.issuedAt >= startDate && d.issuedAt <= endDate,
    );

    const boletas = filtered.filter(
      (d) => d.type === FiscalDocumentType.BOLETA,
    );
    const facturas = filtered.filter(
      (d) => d.type === FiscalDocumentType.FACTURA,
    );

    return {
      period: `${year}-${month.toString().padStart(2, '0')}`,
      boletas: {
        count: boletas.length,
        subtotal: boletas.reduce((sum, d) => sum + Number(d.subtotal), 0),
        igv: boletas.reduce((sum, d) => sum + Number(d.igv), 0),
        total: boletas.reduce((sum, d) => sum + Number(d.total), 0),
      },
      facturas: {
        count: facturas.length,
        subtotal: facturas.reduce((sum, d) => sum + Number(d.subtotal), 0),
        igv: facturas.reduce((sum, d) => sum + Number(d.igv), 0),
        total: facturas.reduce((sum, d) => sum + Number(d.total), 0),
      },
      totals: {
        count: filtered.length,
        subtotal: filtered.reduce((sum, d) => sum + Number(d.subtotal), 0),
        igv: filtered.reduce((sum, d) => sum + Number(d.igv), 0),
        total: filtered.reduce((sum, d) => sum + Number(d.total), 0),
      },
    };
  }
}
