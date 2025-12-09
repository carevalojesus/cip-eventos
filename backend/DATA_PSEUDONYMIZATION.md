# Data Pseudonymization Implementation

This document describes the GDPR-compliant data pseudonymization system implemented in the CIP Eventos backend.

## Overview

The pseudonymization system allows users to request account deletion while maintaining audit trails and historical records. Personal identifiable information (PII) is anonymized while preserving relationships with registrations, certificates, payments, and other audit-critical data.

## Features

1. **User-initiated deletion requests**: Users can request their account deletion
2. **Admin-controlled pseudonymization**: Only administrators can execute the actual pseudonymization
3. **Data preservation**: All audit records (registrations, certificates, payments) are preserved
4. **PII anonymization**: Personal identifiable information is replaced with anonymous values
5. **Audit trail**: Full tracking of who performed pseudonymization and when

## Database Schema Changes

### Person Entity

New fields added to `persons` table:

- `isPseudonymized` (boolean, default: false) - Indicates if data has been pseudonymized
- `pseudonymizedAt` (timestamptz, nullable) - Timestamp of pseudonymization
- `pseudonymizedById` (uuid, nullable) - User who performed the pseudonymization
- `deletionRequestedAt` (timestamptz, nullable) - Timestamp when deletion was requested

### User Entity

New fields added to `users` table:

- `deletedAt` (timestamptz, nullable) - Timestamp when account was deleted
- `deletionReason` (text, nullable) - Reason for account deletion

## API Endpoints

### User Endpoints

#### POST /users/request-deletion
User requests account deletion.

**Authentication**: Required (JWT)
**Authorization**: Any authenticated user

**Request Body**:
```json
{
  "reason": "I no longer need this account" // Optional
}
```

**Response**:
```json
{
  "message": "Deletion request submitted successfully. An administrator will process your request."
}
```

### Person Endpoints

#### POST /persons/:id/pseudonymize
Execute pseudonymization of a person's data.

**Authentication**: Required (JWT)
**Authorization**: ORG_ADMIN, SUPER_ADMIN

**Request Body**:
```json
{
  "reason": "GDPR deletion request" // Optional
}
```

**Response**: Returns the pseudonymized Person object

#### GET /persons/:id/deletion-status
Get deletion and pseudonymization status.

**Authentication**: Required (JWT)

**Response**:
```json
{
  "personId": "550e8400-e29b-41d4-a716-446655440000",
  "deletionRequested": true,
  "deletionRequestedAt": "2024-12-06T10:30:00Z",
  "isPseudonymized": false,
  "pseudonymizedAt": null,
  "pseudonymizedBy": null,
  "userDeleted": false,
  "userDeletedAt": null,
  "deletionReason": null
}
```

#### GET /persons/pending-deletions
Get all persons with pending deletion requests.

**Authentication**: Required (JWT)
**Authorization**: ORG_ADMIN, SUPER_ADMIN

**Response**: Array of Person objects with pending deletions

## Pseudonymization Process

When pseudonymization is executed, the following data transformations occur:

### Data Anonymized
- `firstName` → "Usuario"
- `lastName` → "Eliminado"
- `email` → "deleted_[uuid]@removed.local"
- `phone` → null
- `documentNumber` → "XXXXXXXX"
- `guardianName` → null
- `guardianDocument` → null
- `guardianPhone` → null
- `guardianAuthorizationUrl` → null
- `birthDate` → null
- `country` → null

### Data Preserved
- `id` (primary key)
- `documentType` (for classification)
- `flagRisk` (audit flag)
- All relationships:
  - Registrations
  - Certificates
  - Payments
  - Attendances
  - Evaluations

### User Account Changes
- `isActive` → false
- `deletedAt` → current timestamp
- `deletionReason` → provided reason or "GDPR deletion request"

## Workflow

1. **User requests deletion**
   - User calls `POST /users/request-deletion`
   - System marks `deletionRequestedAt` on associated Person
   - System continues to function normally for the user

2. **Admin reviews request**
   - Admin calls `GET /persons/pending-deletions` to see all pending requests
   - Admin reviews each case

3. **Admin executes pseudonymization**
   - Admin calls `POST /persons/:id/pseudonymize`
   - System anonymizes PII
   - System marks user account as deleted
   - System preserves all audit records

4. **Verification**
   - Admin can call `GET /persons/:id/deletion-status` to verify completion

## Code Structure

### Services
- `/src/persons/services/data-deletion.service.ts` - Core pseudonymization logic

### DTOs
- `/src/users/dto/request-deletion.dto.ts` - Request deletion DTO
- `/src/persons/dto/pseudonymize-person.dto.ts` - Pseudonymization DTO
- `/src/persons/dto/deletion-status.dto.ts` - Status response DTO

### Controllers
- `/src/users/users.controller.ts` - User deletion request endpoint
- `/src/persons/persons.controller.ts` - Pseudonymization endpoints

### Entities
- `/src/persons/entities/person.entity.ts` - Updated with pseudonymization fields
- `/src/users/entities/user.entity.ts` - Updated with deletion fields

### Migrations
- `/src/database/migrations/1733490000000-AddDataPseudonymizationFields.ts`

## GDPR Compliance Notes

This implementation follows GDPR requirements:

- **Right to be forgotten**: Users can request deletion
- **Data minimization**: Only necessary data is retained
- **Purpose limitation**: Retained data is for audit purposes only
- **Audit trail**: Complete tracking of all pseudonymization actions
- **Irreversibility**: Pseudonymization cannot be reversed

## Running the Migration

To apply the database changes:

```bash
npm run migration:run
```

To revert the migration:

```bash
npm run migration:revert
```

## Testing

Example test scenarios:

1. User requests deletion
2. Admin retrieves pending deletions
3. Admin pseudonymizes person data
4. Verify that:
   - PII is anonymized
   - Audit records are preserved
   - User account is deactivated
   - Relationships remain intact

## Security Considerations

- Only ORG_ADMIN and SUPER_ADMIN can execute pseudonymization
- User accounts are deactivated after pseudonymization
- Email addresses are replaced with unique values to prevent reuse
- All actions are logged with timestamp and performing user

## Future Enhancements

Potential improvements:

1. Automated pseudonymization after X days of pending request
2. Email notifications to admins when deletion is requested
3. Bulk pseudonymization endpoint for multiple persons
4. Data export before pseudonymization (for user download)
5. Schedule-based automatic anonymization
