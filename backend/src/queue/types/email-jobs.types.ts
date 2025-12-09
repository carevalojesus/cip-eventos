export enum EmailJobType {
  WELCOME = 'WELCOME',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ACCOUNT_CONFIRMED = 'ACCOUNT_CONFIRMED',
  TICKET = 'TICKET',
  REGISTRATION_PENDING = 'REGISTRATION_PENDING',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  RESERVATION_EXPIRING = 'RESERVATION_EXPIRING',
  RESERVATION_EXPIRED = 'RESERVATION_EXPIRED',
  SESSION_CHANGED = 'SESSION_CHANGED',
  CERTIFICATE_READY = 'CERTIFICATE_READY',
  REFUND_APPROVED = 'REFUND_APPROVED',
  COURTESY_GRANTED = 'COURTESY_GRANTED',
  WAITLIST_INVITED = 'WAITLIST_INVITED',
  TICKET_TRANSFERRED = 'TICKET_TRANSFERRED',
  SCHEDULED_REPORT = 'SCHEDULED_REPORT',
}

export interface WelcomeEmailJob {
  type: EmailJobType.WELCOME;
  data: {
    email: string;
    name: string;
    token: string;
  };
}

export interface PasswordResetEmailJob {
  type: EmailJobType.PASSWORD_RESET;
  data: {
    email: string;
    name: string;
    token: string;
  };
}

export interface AccountConfirmedEmailJob {
  type: EmailJobType.ACCOUNT_CONFIRMED;
  data: {
    email: string;
    name: string;
  };
}

export interface TicketEmailJob {
  type: EmailJobType.TICKET;
  data: {
    registrationId: string;
  };
}

export interface RegistrationPendingEmailJob {
  type: EmailJobType.REGISTRATION_PENDING;
  data: {
    registrationId: string;
  };
}

export interface PaymentConfirmedEmailJob {
  type: EmailJobType.PAYMENT_CONFIRMED;
  data: {
    paymentId: string;
  };
}

export interface ReservationExpiringEmailJob {
  type: EmailJobType.RESERVATION_EXPIRING;
  data: {
    registrationId: string;
    minutesLeft: number;
  };
}

export interface ReservationExpiredEmailJob {
  type: EmailJobType.RESERVATION_EXPIRED;
  data: {
    registrationId: string;
  };
}

export interface SessionChangedEmailJob {
  type: EmailJobType.SESSION_CHANGED;
  data: {
    sessionId: string;
    changeType: 'cancelled' | 'rescheduled';
    oldData?: any;
  };
}

export interface CertificateReadyEmailJob {
  type: EmailJobType.CERTIFICATE_READY;
  data: {
    certificateId: string;
  };
}

export interface RefundApprovedEmailJob {
  type: EmailJobType.REFUND_APPROVED;
  data: {
    refundId: string;
  };
}

export interface CourtesyGrantedEmailJob {
  type: EmailJobType.COURTESY_GRANTED;
  data: {
    courtesyId: string;
  };
}

export interface WaitlistInvitedEmailJob {
  type: EmailJobType.WAITLIST_INVITED;
  data: {
    waitlistEntryId: string;
  };
}

export interface TicketTransferredEmailJob {
  type: EmailJobType.TICKET_TRANSFERRED;
  data: {
    transferId: string;
  };
}

export interface ScheduledReportEmailJob {
  type: EmailJobType.SCHEDULED_REPORT;
  data: {
    scheduledReportId: string;
    recipients: string[];
    reportName: string;
    fileBuffer: Buffer;
    fileExtension: string;
  };
}

export type EmailJob =
  | WelcomeEmailJob
  | PasswordResetEmailJob
  | AccountConfirmedEmailJob
  | TicketEmailJob
  | RegistrationPendingEmailJob
  | PaymentConfirmedEmailJob
  | ReservationExpiringEmailJob
  | ReservationExpiredEmailJob
  | SessionChangedEmailJob
  | CertificateReadyEmailJob
  | RefundApprovedEmailJob
  | CourtesyGrantedEmailJob
  | WaitlistInvitedEmailJob
  | TicketTransferredEmailJob
  | ScheduledReportEmailJob;
