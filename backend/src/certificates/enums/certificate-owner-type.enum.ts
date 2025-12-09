/**
 * Discriminator enum for Certificate polymorphic relationships.
 * Each value corresponds to exactly one foreign key relationship in the Certificate entity.
 *
 * This enum helps enforce data integrity by making explicit which type of owner
 * a certificate belongs to, preventing ambiguous states where multiple FKs could be set.
 */
export enum CertificateOwnerType {
  /** Certificate for event attendee (linked via registrationId) */
  ATTENDEE = 'ATTENDEE',

  /** Certificate for event speaker (linked via speakerId) */
  SPEAKER = 'SPEAKER',

  /** Certificate for event organizer (linked via userId) */
  ORGANIZER = 'ORGANIZER',

  /** Certificate for approved block enrollment (linked via blockEnrollmentId) */
  BLOCK_ENROLLMENT = 'BLOCK_ENROLLMENT',

  /** Certificate for specific session attendance (linked via sessionId) */
  SESSION = 'SESSION',
}
