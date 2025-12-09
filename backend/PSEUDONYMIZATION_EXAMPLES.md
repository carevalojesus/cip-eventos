# Data Pseudonymization - Usage Examples

This document provides practical examples for using the data pseudonymization system.

## Prerequisites

1. Backend server running
2. Database migration applied (`npm run migration:run`)
3. Valid JWT token for authentication
4. Admin account for pseudonymization actions

## Example 1: User Requests Account Deletion

### Scenario
A user wants to delete their account and all personal data.

### Request
```bash
curl -X POST http://localhost:3000/api/users/request-deletion \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "I no longer use the platform"
  }'
```

### Response
```json
{
  "message": "Deletion request submitted successfully. An administrator will process your request."
}
```

### What Happens
1. System finds the Person associated with the user
2. Sets `deletionRequestedAt` to current timestamp
3. User can continue using the system normally
4. Request goes into pending queue for admin review

## Example 2: Admin Views Pending Deletion Requests

### Scenario
An administrator wants to see all pending deletion requests.

### Request
```bash
curl -X GET http://localhost:3000/api/persons/pending-deletions \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Response
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@example.com",
    "documentNumber": "12345678",
    "deletionRequestedAt": "2024-12-06T10:30:00Z",
    "isPseudonymized": false,
    "user": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "email": "juan.perez@example.com",
      "isActive": true
    }
  }
]
```

## Example 3: Admin Checks Deletion Status

### Scenario
Admin wants to check the deletion status of a specific person before pseudonymizing.

### Request
```bash
curl -X GET http://localhost:3000/api/persons/550e8400-e29b-41d4-a716-446655440000/deletion-status \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Response
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

## Example 4: Admin Executes Pseudonymization

### Scenario
After reviewing a deletion request, admin executes the pseudonymization.

### Request
```bash
curl -X POST http://localhost:3000/api/persons/550e8400-e29b-41d4-a716-446655440000/pseudonymize \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "GDPR Article 17 - Right to be forgotten request"
  }'
```

### Response
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "Usuario",
  "lastName": "Eliminado",
  "email": "deleted_7a3d2e5f-9b1c-4e8a-a6d3-2f7b9c8e1a5d@removed.local",
  "documentNumber": "XXXXXXXX",
  "phone": null,
  "country": null,
  "birthDate": null,
  "guardianName": null,
  "guardianDocument": null,
  "guardianPhone": null,
  "guardianAuthorizationUrl": null,
  "isPseudonymized": true,
  "pseudonymizedAt": "2024-12-06T15:45:00Z",
  "pseudonymizedBy": {
    "id": "admin-user-id",
    "email": "admin@example.com"
  },
  "deletionRequestedAt": "2024-12-06T10:30:00Z"
}
```

### What Happens
1. All PII fields are anonymized
2. `isPseudonymized` is set to true
3. `pseudonymizedAt` is set to current timestamp
4. `pseudonymizedBy` references the admin user
5. Associated user account is deactivated (`isActive = false`, `deletedAt` set)
6. All relationships (registrations, certificates, payments) are PRESERVED

## Example 5: Verify Pseudonymization

### Scenario
Admin verifies the pseudonymization was successful.

### Request
```bash
curl -X GET http://localhost:3000/api/persons/550e8400-e29b-41d4-a716-446655440000/deletion-status \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Response
```json
{
  "personId": "550e8400-e29b-41d4-a716-446655440000",
  "deletionRequested": true,
  "deletionRequestedAt": "2024-12-06T10:30:00Z",
  "isPseudonymized": true,
  "pseudonymizedAt": "2024-12-06T15:45:00Z",
  "pseudonymizedBy": {
    "id": "admin-user-id",
    "email": "admin@example.com"
  },
  "userDeleted": true,
  "userDeletedAt": "2024-12-06T15:45:00Z",
  "deletionReason": "GDPR Article 17 - Right to be forgotten request"
}
```

## Example 6: Query Person with Preserved Relationships

### Scenario
Verify that audit records are preserved after pseudonymization.

### Request
```bash
curl -X GET http://localhost:3000/api/persons/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Response
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "Usuario",
  "lastName": "Eliminado",
  "email": "deleted_7a3d2e5f-9b1c-4e8a-a6d3-2f7b9c8e1a5d@removed.local",
  "documentType": "DNI",
  "documentNumber": "XXXXXXXX",
  "isPseudonymized": true,
  "registrations": [
    {
      "id": "registration-1",
      "eventId": "event-123",
      "status": "CONFIRMED",
      "createdAt": "2024-11-01T10:00:00Z"
    }
  ],
  "certificates": [
    {
      "id": "cert-1",
      "eventId": "event-123",
      "issueDate": "2024-11-10T14:30:00Z"
    }
  ],
  "payments": [
    {
      "id": "payment-1",
      "amount": 50.00,
      "status": "PAID",
      "createdAt": "2024-11-01T09:45:00Z"
    }
  ]
}
```

**Note**: All relationships and audit data remain intact!

## Error Scenarios

### Error 1: User Not Found
```bash
curl -X POST http://localhost:3000/api/users/request-deletion \
  -H "Authorization: Bearer INVALID_TOKEN"
```

Response:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Error 2: Already Pseudonymized
```bash
curl -X POST http://localhost:3000/api/persons/550e8400-e29b-41d4-a716-446655440000/pseudonymize \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response:
```json
{
  "statusCode": 400,
  "message": "Person data is already pseudonymized"
}
```

### Error 3: Unauthorized (Non-Admin)
```bash
curl -X POST http://localhost:3000/api/persons/550e8400-e29b-41d4-a716-446655440000/pseudonymize \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response:
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

## Database Queries

### Find All Pseudonymized Persons
```sql
SELECT
  id,
  "firstName",
  "lastName",
  email,
  "isPseudonymized",
  "pseudonymizedAt"
FROM persons
WHERE "isPseudonymized" = true
ORDER BY "pseudonymizedAt" DESC;
```

### Find Pending Deletion Requests
```sql
SELECT
  p.id,
  p."firstName",
  p."lastName",
  p.email,
  p."deletionRequestedAt",
  u.email as user_email
FROM persons p
LEFT JOIN users u ON p."userId" = u.id
WHERE p."deletionRequestedAt" IS NOT NULL
  AND p."isPseudonymized" = false
ORDER BY p."deletionRequestedAt" ASC;
```

### Count Pseudonymized Persons
```sql
SELECT COUNT(*) as total_pseudonymized
FROM persons
WHERE "isPseudonymized" = true;
```

## Integration with Frontend

### React/TypeScript Example

```typescript
// Service
export class DataDeletionService {
  async requestDeletion(reason?: string) {
    const response = await fetch('/api/users/request-deletion', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    return response.json();
  }

  async getPendingDeletions() {
    const response = await fetch('/api/persons/pending-deletions', {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    return response.json();
  }

  async pseudonymizePerson(personId: string, reason?: string) {
    const response = await fetch(`/api/persons/${personId}/pseudonymize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    return response.json();
  }

  async getDeletionStatus(personId: string) {
    const response = await fetch(`/api/persons/${personId}/deletion-status`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    return response.json();
  }
}

// Component
function AccountSettings() {
  const [loading, setLoading] = useState(false);

  const handleRequestDeletion = async () => {
    const reason = prompt('Please provide a reason for deletion (optional):');

    if (!confirm('Are you sure you want to request account deletion?')) {
      return;
    }

    setLoading(true);
    try {
      const result = await deletionService.requestDeletion(reason);
      alert(result.message);
    } catch (error) {
      alert('Failed to submit deletion request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRequestDeletion}
      disabled={loading}
    >
      Request Account Deletion
    </button>
  );
}
```

## Testing Script

```bash
#!/bin/bash

# Variables
API_URL="http://localhost:3000/api"
USER_TOKEN="your_user_jwt_token"
ADMIN_TOKEN="your_admin_jwt_token"

echo "1. User requests deletion..."
curl -X POST $API_URL/users/request-deletion \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Testing deletion flow"}'

echo -e "\n\n2. Admin views pending deletions..."
curl -X GET $API_URL/persons/pending-deletions \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo -e "\n\n3. Admin checks deletion status..."
PERSON_ID="get-from-step-2"
curl -X GET $API_URL/persons/$PERSON_ID/deletion-status \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo -e "\n\n4. Admin executes pseudonymization..."
curl -X POST $API_URL/persons/$PERSON_ID/pseudonymize \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "GDPR compliance test"}'

echo -e "\n\n5. Verify pseudonymization..."
curl -X GET $API_URL/persons/$PERSON_ID/deletion-status \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Best Practices

1. **Always verify before pseudonymizing**
   - Check deletion status
   - Review associated records
   - Confirm with user if needed

2. **Document reasons**
   - Always provide a reason for pseudonymization
   - Reference GDPR articles when applicable
   - Keep audit trail clear

3. **Handle errors gracefully**
   - Check for already pseudonymized persons
   - Validate user permissions
   - Handle network errors

4. **Communicate with users**
   - Send confirmation emails
   - Provide status updates
   - Explain data retention policies

5. **Monitor pending requests**
   - Regular review of pending deletions
   - Set SLA for processing requests
   - Track metrics and compliance
