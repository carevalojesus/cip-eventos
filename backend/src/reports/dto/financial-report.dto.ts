import { IsOptional, IsUUID, IsEnum } from 'class-validator';
import { PaymentProvider } from '../../payments/entities/payment.entity';
import { FiscalDocumentType } from '../../fiscal-documents/entities/fiscal-document.entity';

export class FinancialReportFilterDto {
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;

  @IsOptional()
  dateFrom?: string;

  @IsOptional()
  dateTo?: string;
}

export interface RevenueReportData {
  totalRevenue: number;
  currency: string;
  byTicketType: {
    name: string;
    quantity: number;
    revenue: number;
    percentage: number;
  }[];
  byPaymentMethod: PaymentMethodReportData[];
  byDate: { date: string; amount: number; count: number }[];
  summary: {
    totalPayments: number;
    averageTicketPrice: number;
    completedPayments: number;
    pendingPayments: number;
    refundedAmount: number;
  };
}

export interface PaymentMethodReportData {
  provider: string;
  count: number;
  amount: number;
  percentage: number;
  avgAmount: number;
}

export interface FiscalDocumentsReportData {
  totalIssued: number;
  totalVoided: number;
  byType: {
    type: FiscalDocumentType;
    issued: number;
    voided: number;
    amount: number;
  }[];
  byStatus: { status: string; count: number }[];
  pendingSunat: number;
  rejectedBySunat: number;
}

export interface RefundsReportData {
  totalRefunds: number;
  totalAmount: number;
  byStatus: { status: string; count: number; amount: number }[];
  byReason: { reason: string; count: number; amount: number }[];
  byMethod: { method: string; count: number; amount: number }[];
  averageRefundAmount: number;
  averageProcessingTime: number; // in days
}

export interface ConciliationReportData {
  provider: string;
  totalTransactions: number;
  totalAmount: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  discrepancies: {
    transactionId: string;
    systemAmount: number;
    gatewayAmount?: number;
    status: string;
  }[];
}
