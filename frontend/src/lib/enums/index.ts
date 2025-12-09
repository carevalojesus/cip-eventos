/**
 * Shared Enums - CIP Eventos
 *
 * Centralized enums that mirror backend definitions.
 * Keep in sync with backend entity files.
 */

// ==================== EVENT ====================

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ARCHIVED = 'ARCHIVED',
}

// ==================== REGISTRATION ====================

export enum RegistrationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  ATTENDED = 'ATTENDED',
}

// ==================== PAYMENT ====================

export enum PaymentStatus {
  PENDING = 'PENDING',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
}

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  NIUBIZ = 'NIUBIZ',
  PAYPAL = 'PAYPAL',
  YAPE = 'YAPE',
  PLIN = 'PLIN',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  SIMULATED = 'SIMULATED',
}

export enum BillingDocumentType {
  DNI = 'DNI',
  RUC = 'RUC',
}

export enum PaymentSource {
  ONLINE = 'ONLINE',
  BOX_OFFICE = 'BOX_OFFICE',
  ADMIN = 'ADMIN',
}

// ==================== CERTIFICATE ====================

export enum CertificateType {
  ATTENDANCE = 'ATTENDANCE',
  SPEAKER = 'SPEAKER',
  ORGANIZER = 'ORGANIZER',
}

export enum CertificateStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

// ==================== ATTENDEE ====================

export enum DocumentType {
  DNI = 'DNI',
  CE = 'CE',
  PASSPORT = 'PASSPORT',
}

// ==================== NOTIFICATION ====================

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

// ==================== USER / ROLES ====================

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ORGANIZER = 'ORGANIZER',
}

// ==================== TYPE GUARDS ====================

export const isEventStatus = (value: string): value is EventStatus =>
  Object.values(EventStatus).includes(value as EventStatus);

export const isPaymentStatus = (value: string): value is PaymentStatus =>
  Object.values(PaymentStatus).includes(value as PaymentStatus);

export const isRegistrationStatus = (value: string): value is RegistrationStatus =>
  Object.values(RegistrationStatus).includes(value as RegistrationStatus);
