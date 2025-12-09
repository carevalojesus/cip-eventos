export enum NotificationStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
  SMS = 'SMS',
  PUSH = 'PUSH', // Push notifications (móvil/web)
  WHATSAPP = 'WHATSAPP', // WhatsApp via Twilio
}
