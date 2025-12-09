# Person Merge System Implementation

## Overview
This document describes the implementation of the Person merge system for the CIP Eventos backend.

## Features Implemented

### 1. Enhanced Person Entity
- Added `mergedAt` field (timestamp when person was merged)
- Added `mergedBy` field (user who performed the merge)
- Already had `status` enum (ACTIVE, MERGED)
- Already had `mergedToPerson` reference

### 2. PersonMergeService
Location: `src/persons/services/person-merge.service.ts`

Methods:
- `merge(primaryPersonId, secondaryPersonId, performedBy, options)`: Merges two persons with transaction support
- `findPotentialDuplicates(personId)`: Finds potential duplicate persons by email or document
- `getMergeHistory(personId)`: Returns all persons merged into a specific person
- `canBeMerged(personId)`: Validates if a person can be merged

### 3. DTOs
Created the following DTOs in `src/persons/dto/`:
- `MergePersonsDto`: Options for merge operation (reissueCertificates)
- `MergeResultDto`: Response structure with affected records count
- `DuplicatePersonDto`: Structure for duplicate person information
- `DuplicatePersonsResponseDto`: Response for duplicate search
- `CreatePersonDto`: Person creation data
- `UpdatePersonDto`: Person update data

### 4. PersonsController Endpoints
Updated `src/persons/persons.controller.ts` with:

#### POST `/persons/:primaryId/merge/:secondaryId`
- Merges secondary person into primary person
- Only accessible by ORG_ADMIN and SUPER_ADMIN roles
- All references from secondary person are reassigned to primary person
- Secondary person is marked as MERGED

**Request Body:**
```json
{
  "reissueCertificates": false
}
```

**Response:**
```json
{
  "primaryPerson": { ... },
  "secondaryPerson": { ... },
  "affectedRecords": {
    "attendees": 2,
    "blockEnrollments": 1,
    "sessionAttendances": 5,
    "total": 2
  },
  "reissuedCertificates": 0
}
```

#### GET `/persons/:id/duplicates`
- Finds potential duplicate persons
- Searches by email or document number
- Returns similarity score and duplicate reasons

**Response:**
```json
{
  "duplicates": [
    {
      "person": { ... },
      "duplicateReasons": ["Same email address"],
      "similarityScore": 50
    }
  ],
  "total": 1
}
```

#### GET `/persons/:id/merge-history`
- Returns all persons that were merged into the specified person
- Shows merge metadata (mergedAt, mergedBy)

### 5. Merge Logic Details

The merge operation reassigns the following references from secondary to primary person:

#### Direct Updates:
- **Attendees**: Person reference is updated directly

#### Indirect Updates (via Attendee):
- **Registrations**: Updated through attendee relationship
- **Block Enrollments**: Updated through attendee relationship
- **Session Attendances**: Updated through attendee relationship
- **Coupon Usages**: Updated through attendee relationship
- **Certificates**: Updated through registration/enrollment relationships

#### NOT Modified:
- **Fiscal Documents**: Legally issued documents are never modified

### 6. Validations

The merge service validates:
1. Both persons exist and are in ACTIVE status
2. Persons are different (cannot merge a person with itself)
3. At least one duplicate reason exists (same email OR same document)
4. Only ORG_ADMIN and SUPER_ADMIN can perform merges

### 7. Transaction Safety

All merge operations are executed within a database transaction to ensure:
- Atomicity: All changes succeed or none do
- Consistency: References remain valid
- Isolation: Concurrent operations don't interfere

### 8. Database Migration
Created migration: `1733440000000-AddPersonMergeFields.ts`

Adds:
- `mergedAt` column (timestamp with time zone)
- `mergedById` column (foreign key to users table)
- Foreign key constraint with ON DELETE SET NULL

## Usage Example

### Finding Duplicates
```typescript
GET /persons/{personId}/duplicates
```

### Merging Persons
```typescript
POST /persons/{primaryId}/merge/{secondaryId}
Content-Type: application/json

{
  "reissueCertificates": false
}
```

### Checking Merge History
```typescript
GET /persons/{personId}/merge-history
```

## Future Enhancements

1. **Certificate Reissuance**: Implement automatic certificate reissuance after merge
2. **Audit Logging**: Integrate with audit service for detailed merge tracking
3. **Fuzzy Matching**: Add fuzzy name matching for better duplicate detection
4. **Undo Merge**: Implement ability to undo a merge operation
5. **Batch Merge**: Support merging multiple persons at once
6. **Notifications**: Send notifications to affected users after merge

## Security Considerations

- Only ORG_ADMIN and SUPER_ADMIN roles can perform merges
- All merge operations are logged
- Merged persons retain historical data
- Fiscal documents are never modified

## Testing Recommendations

1. Test merge with persons having:
   - Registrations
   - Certificates
   - Block enrollments
   - Session attendances

2. Test edge cases:
   - Merging person with itself (should fail)
   - Merging already merged person (should fail)
   - Merging persons with no duplicate reason (should fail)

3. Test transaction rollback on failure

4. Verify all references are correctly reassigned

## Module Structure

```
src/persons/
├── dto/
│   ├── create-person.dto.ts
│   ├── update-person.dto.ts
│   ├── merge-persons.dto.ts
│   ├── merge-result.dto.ts
│   └── duplicate-person.dto.ts
├── entities/
│   └── person.entity.ts
├── services/
│   └── person-merge.service.ts
├── persons.controller.ts
├── persons.service.ts
└── persons.module.ts
```
