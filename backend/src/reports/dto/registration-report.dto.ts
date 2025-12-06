import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import {
  RegistrationStatus,
  RegistrationOrigin,
} from '../../registrations/entities/registration.entity';

export class RegistrationReportFilterDto {
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;

  @IsOptional()
  @IsEnum(RegistrationOrigin)
  origin?: RegistrationOrigin;

  @IsOptional()
  dateFrom?: string;

  @IsOptional()
  dateTo?: string;
}

export interface RegistrationReportData {
  totalRegistrations: number;
  byStatus: { status: string; count: number; percentage: number }[];
  byTicketType: {
    ticketName: string;
    count: number;
    revenue: number;
    percentage: number;
  }[];
  byOrigin: { origin: string; count: number; percentage: number }[];
  timeline: { date: string; count: number; cumulative: number }[];
  conversionRate?: {
    totalVisits?: number;
    registrations: number;
    payments: number;
    conversionToRegistration?: number;
    conversionToPayment?: number;
  };
}

export interface RegistrationDetailData {
  id: string;
  ticketCode: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeeDocument: string;
  ticketType: string;
  status: string;
  origin: string;
  finalPrice: number;
  discountAmount: number;
  originalPrice: number;
  attended: boolean;
  attendedAt: Date | null;
  registeredAt: Date;
  paymentStatus?: string;
  paymentProvider?: string;
}
