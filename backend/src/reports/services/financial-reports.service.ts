import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  Payment,
  PaymentStatus,
  PaymentProvider,
} from '../../payments/entities/payment.entity';
import {
  FiscalDocument,
  FiscalDocumentStatus,
  FiscalDocumentType,
} from '../../fiscal-documents/entities/fiscal-document.entity';
import {
  Refund,
  RefundStatus,
} from '../../refunds/entities/refund.entity';
import {
  RevenueReportData,
  PaymentMethodReportData,
  FiscalDocumentsReportData,
  RefundsReportData,
  FinancialReportFilterDto,
} from '../dto/financial-report.dto';
import { Registration } from '../../registrations/entities/registration.entity';

@Injectable()
export class FinancialReportsService {
  private readonly logger = new Logger(FinancialReportsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(FiscalDocument)
    private readonly fiscalDocRepo: Repository<FiscalDocument>,
    @InjectRepository(Refund)
    private readonly refundRepo: Repository<Refund>,
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
  ) {}

  /**
   * Reporte de recaudación general
   */
  async getRevenueReport(
    eventId: string,
    filters?: FinancialReportFilterDto,
  ): Promise<RevenueReportData> {
    this.logger.log(`Generating revenue report for event ${eventId}`);

    const queryBuilder = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.registration', 'reg')
      .leftJoinAndSelect('reg.eventTicket', 'ticket')
      .where('reg.eventId = :eventId', { eventId })
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED });

    if (filters?.provider) {
      queryBuilder.andWhere('payment.provider = :provider', {
        provider: filters.provider,
      });
    }

    if (filters?.dateFrom && filters?.dateTo) {
      queryBuilder.andWhere('payment.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: new Date(filters.dateFrom),
        dateTo: new Date(filters.dateTo),
      });
    }

    const payments = await queryBuilder.getMany();

    const totalRevenue = payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    // Por tipo de entrada
    const byTicketType = this.groupByTicketType(payments);

    // Por método de pago
    const byPaymentMethod = this.groupByPaymentMethod(payments);

    // Por fecha
    const byDate = this.groupByDate(payments);

    // Resumen
    const summary = await this.generateSummary(eventId, payments);

    return {
      totalRevenue,
      currency: 'PEN',
      byTicketType,
      byPaymentMethod,
      byDate,
      summary,
    };
  }

  /**
   * Reporte de pagos por método de pago
   */
  async getPaymentsByMethod(
    eventId: string,
    filters?: FinancialReportFilterDto,
  ): Promise<PaymentMethodReportData[]> {
    const queryBuilder = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoin('payment.registration', 'reg')
      .where('reg.eventId = :eventId', { eventId })
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED });

    if (filters?.dateFrom && filters?.dateTo) {
      queryBuilder.andWhere('payment.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: new Date(filters.dateFrom),
        dateTo: new Date(filters.dateTo),
      });
    }

    const payments = await queryBuilder.getMany();

    return this.groupByPaymentMethod(payments);
  }

  /**
   * Reporte de comprobantes fiscales
   */
  async getFiscalDocumentsReport(
    eventId: string,
    filters?: FinancialReportFilterDto,
  ): Promise<FiscalDocumentsReportData> {
    this.logger.log(`Generating fiscal documents report for event ${eventId}`);

    const queryBuilder = this.fiscalDocRepo
      .createQueryBuilder('fiscal')
      .leftJoin('fiscal.payment', 'payment')
      .leftJoin('payment.registration', 'reg')
      .where('reg.eventId = :eventId', { eventId });

    if (filters?.dateFrom && filters?.dateTo) {
      queryBuilder.andWhere('fiscal.issuedAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: new Date(filters.dateFrom),
        dateTo: new Date(filters.dateTo),
      });
    }

    const documents = await queryBuilder.getMany();

    const totalIssued = documents.filter(
      (d) => d.status !== FiscalDocumentStatus.VOIDED,
    ).length;
    const totalVoided = documents.filter(
      (d) => d.status === FiscalDocumentStatus.VOIDED,
    ).length;

    // Por tipo
    const byType = this.groupFiscalByType(documents);

    // Por estado
    const byStatus = this.groupFiscalByStatus(documents);

    const pendingSunat = documents.filter(
      (d) => d.status === FiscalDocumentStatus.PENDING ||
        d.status === FiscalDocumentStatus.SENT_TO_SUNAT,
    ).length;

    const rejectedBySunat = documents.filter(
      (d) => d.status === FiscalDocumentStatus.REJECTED,
    ).length;

    return {
      totalIssued,
      totalVoided,
      byType,
      byStatus,
      pendingSunat,
      rejectedBySunat,
    };
  }

  /**
   * Reporte de reembolsos
   */
  async getRefundsReport(
    eventId: string,
    filters?: FinancialReportFilterDto,
  ): Promise<RefundsReportData> {
    this.logger.log(`Generating refunds report for event ${eventId}`);

    const queryBuilder = this.refundRepo
      .createQueryBuilder('refund')
      .leftJoin('refund.registration', 'reg')
      .where('reg.eventId = :eventId', { eventId });

    if (filters?.dateFrom && filters?.dateTo) {
      queryBuilder.andWhere('refund.requestedAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: new Date(filters.dateFrom),
        dateTo: new Date(filters.dateTo),
      });
    }

    const refunds = await queryBuilder.getMany();

    const totalRefunds = refunds.length;
    const totalAmount = refunds.reduce(
      (sum, r) => sum + Number(r.refundAmount),
      0,
    );

    // Por estado
    const byStatus = this.groupRefundsByStatus(refunds);

    // Por razón
    const byReason = this.groupRefundsByReason(refunds);

    // Por método
    const byMethod = this.groupRefundsByMethod(refunds);

    const averageRefundAmount =
      totalRefunds > 0 ? totalAmount / totalRefunds : 0;

    // Tiempo promedio de procesamiento (en días)
    const averageProcessingTime = this.calculateAverageProcessingTime(refunds);

    return {
      totalRefunds,
      totalAmount,
      byStatus,
      byReason,
      byMethod,
      averageRefundAmount,
      averageProcessingTime,
    };
  }

  /**
   * Reporte de conciliación con pasarela
   * (Placeholder - requiere integración con APIs de pasarelas)
   */
  async getConciliationReport(eventId: string, provider: PaymentProvider) {
    this.logger.log(
      `Generating conciliation report for event ${eventId}, provider ${provider}`,
    );

    const payments = await this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoin('payment.registration', 'reg')
      .where('reg.eventId = :eventId', { eventId })
      .andWhere('payment.provider = :provider', { provider })
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .getMany();

    const totalTransactions = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // TODO: Integrar con API de la pasarela para obtener transacciones reales
    // y comparar con los pagos registrados en el sistema

    return {
      provider,
      totalTransactions,
      totalAmount,
      matchedTransactions: totalTransactions, // Placeholder
      unmatchedTransactions: 0, // Placeholder
      discrepancies: [], // Placeholder
    };
  }

  // ===== HELPERS =====

  private groupByTicketType(payments: Payment[]) {
    const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    const ticketGroups = payments.reduce(
      (acc, payment) => {
        const ticketName =
          payment.registration?.eventTicket?.name || 'Sin ticket';
        if (!acc[ticketName]) {
          acc[ticketName] = { quantity: 0, revenue: 0 };
        }
        acc[ticketName].quantity++;
        acc[ticketName].revenue += Number(payment.amount);
        return acc;
      },
      {} as Record<string, { quantity: number; revenue: number }>,
    );

    return Object.entries(ticketGroups).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      revenue: data.revenue,
      percentage: total > 0 ? (data.revenue / total) * 100 : 0,
    }));
  }

  private groupByPaymentMethod(payments: Payment[]): PaymentMethodReportData[] {
    const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    const providerGroups = payments.reduce(
      (acc, payment) => {
        const provider = payment.provider;
        if (!acc[provider]) {
          acc[provider] = { count: 0, amount: 0 };
        }
        acc[provider].count++;
        acc[provider].amount += Number(payment.amount);
        return acc;
      },
      {} as Record<string, { count: number; amount: number }>,
    );

    return Object.entries(providerGroups).map(([provider, data]) => ({
      provider,
      count: data.count,
      amount: data.amount,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
      avgAmount: data.count > 0 ? data.amount / data.count : 0,
    }));
  }

  private groupByDate(payments: Payment[]) {
    const dateGroups = payments.reduce(
      (acc, payment) => {
        const date = payment.createdAt.toISOString().slice(0, 10);
        if (!acc[date]) {
          acc[date] = { amount: 0, count: 0 };
        }
        acc[date].amount += Number(payment.amount);
        acc[date].count++;
        return acc;
      },
      {} as Record<string, { amount: number; count: number }>,
    );

    return Object.entries(dateGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        amount: data.amount,
        count: data.count,
      }));
  }

  private async generateSummary(eventId: string, completedPayments: Payment[]) {
    const allPayments = await this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoin('payment.registration', 'reg')
      .where('reg.eventId = :eventId', { eventId })
      .getMany();

    const totalPayments = allPayments.length;
    const completedPaymentsCount = completedPayments.length;
    const pendingPayments = allPayments.filter(
      (p) => p.status === PaymentStatus.PENDING ||
        p.status === PaymentStatus.WAITING_APPROVAL,
    ).length;

    const totalRevenue = completedPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    const refundedPayments = await this.refundRepo
      .createQueryBuilder('refund')
      .leftJoin('refund.registration', 'reg')
      .where('reg.eventId = :eventId', { eventId })
      .andWhere('refund.status = :status', { status: RefundStatus.COMPLETED })
      .getMany();

    const refundedAmount = refundedPayments.reduce(
      (sum, r) => sum + Number(r.refundAmount),
      0,
    );

    const averageTicketPrice =
      completedPaymentsCount > 0 ? totalRevenue / completedPaymentsCount : 0;

    return {
      totalPayments,
      averageTicketPrice,
      completedPayments: completedPaymentsCount,
      pendingPayments,
      refundedAmount,
    };
  }

  private groupFiscalByType(documents: FiscalDocument[]) {
    const typeGroups = documents.reduce(
      (acc, doc) => {
        const type = doc.type;
        if (!acc[type]) {
          acc[type] = { issued: 0, voided: 0, amount: 0 };
        }

        if (doc.status === FiscalDocumentStatus.VOIDED) {
          acc[type].voided++;
        } else {
          acc[type].issued++;
          acc[type].amount += Number(doc.total);
        }

        return acc;
      },
      {} as Record<
        FiscalDocumentType,
        { issued: number; voided: number; amount: number }
      >,
    );

    return Object.entries(typeGroups).map(([type, data]) => ({
      type: type as FiscalDocumentType,
      issued: data.issued,
      voided: data.voided,
      amount: data.amount,
    }));
  }

  private groupFiscalByStatus(documents: FiscalDocument[]) {
    const statusGroups = documents.reduce(
      (acc, doc) => {
        acc[doc.status] = (acc[doc.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(statusGroups).map(([status, count]) => ({
      status,
      count,
    }));
  }

  private groupRefundsByStatus(refunds: Refund[]) {
    const statusGroups = refunds.reduce(
      (acc, refund) => {
        if (!acc[refund.status]) {
          acc[refund.status] = { count: 0, amount: 0 };
        }
        acc[refund.status].count++;
        acc[refund.status].amount += Number(refund.refundAmount);
        return acc;
      },
      {} as Record<string, { count: number; amount: number }>,
    );

    return Object.entries(statusGroups).map(([status, data]) => ({
      status,
      count: data.count,
      amount: data.amount,
    }));
  }

  private groupRefundsByReason(refunds: Refund[]) {
    const reasonGroups = refunds.reduce(
      (acc, refund) => {
        if (!acc[refund.reason]) {
          acc[refund.reason] = { count: 0, amount: 0 };
        }
        acc[refund.reason].count++;
        acc[refund.reason].amount += Number(refund.refundAmount);
        return acc;
      },
      {} as Record<string, { count: number; amount: number }>,
    );

    return Object.entries(reasonGroups).map(([reason, data]) => ({
      reason,
      count: data.count,
      amount: data.amount,
    }));
  }

  private groupRefundsByMethod(refunds: Refund[]) {
    const methodGroups = refunds.reduce(
      (acc, refund) => {
        if (!acc[refund.refundMethod]) {
          acc[refund.refundMethod] = { count: 0, amount: 0 };
        }
        acc[refund.refundMethod].count++;
        acc[refund.refundMethod].amount += Number(refund.refundAmount);
        return acc;
      },
      {} as Record<string, { count: number; amount: number }>,
    );

    return Object.entries(methodGroups).map(([method, data]) => ({
      method,
      count: data.count,
      amount: data.amount,
    }));
  }

  private calculateAverageProcessingTime(refunds: Refund[]): number {
    const completedRefunds = refunds.filter(
      (r) => r.status === RefundStatus.COMPLETED && r.requestedAt && r.completedAt,
    );

    if (completedRefunds.length === 0) return 0;

    const totalDays = completedRefunds.reduce((sum, refund) => {
      const requestedAt = new Date(refund.requestedAt);
      const completedAt = new Date(refund.completedAt!);
      const diffMs = completedAt.getTime() - requestedAt.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return sum + diffDays;
    }, 0);

    return totalDays / completedRefunds.length;
  }
}
