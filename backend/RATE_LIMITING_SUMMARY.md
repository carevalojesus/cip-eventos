# Rate Limiting Implementation - Summary

## Implementation Completed

This document provides a summary of the rate limiting implementation for the CIP Eventos backend.

## Files Created

### 1. Configuration
- **`/src/common/config/rate-limit.config.ts`**
  - Central configuration for rate limiting
  - Environment variable support
  - Default values for all limits

### 2. Guards
- **`/src/common/guards/pending-orders-limit.guard.ts`**
  - Custom guard for pending orders validation
  - IP-based and Person-based limiting
  - Client IP extraction with proxy support
  - Localized error messages

- **`/src/common/guards/index.ts`**
  - Barrel export for guards

### 3. Migrations
- **`/src/database/migrations/1733480000000-AddMetadataToPurchaseOrders.ts`**
  - Adds `metadata` JSONB column to `purchase_orders`
  - Creates GIN index for efficient JSONB queries
  - Stores client IP and user agent

### 4. Documentation
- **`/backend/RATE_LIMITING.md`**
  - Comprehensive documentation
  - Architecture explanation
  - Usage examples
  - Testing guide
  - Monitoring queries

- **`/backend/RATE_LIMITING_SUMMARY.md`** (this file)
  - Quick reference summary

## Files Modified

### 1. Entity Updates
- **`/src/purchase-orders/entities/purchase-order.entity.ts`**
  - Added `metadata` JSONB field
  - Type-safe metadata interface

### 2. Service Updates
- **`/src/purchase-orders/purchase-orders.service.ts`**
  - Updated `create()` method to accept metadata parameter
  - Stores client IP and user agent in purchase order

### 3. Controller Updates
- **`/src/purchase-orders/purchase-orders.controller.ts`**
  - Added `@Throttle()` decorator (10 req/min)
  - Applied `PendingOrdersLimitGuard`
  - IP extraction helper method
  - Passes metadata to service

- **`/src/payments/payments.controller.ts`**
  - Updated throttle config to use `RateLimitConfig`
  - Centralized configuration

### 4. Module Updates
- **`/src/common/common.module.ts`**
  - Imports `TypeOrmModule.forFeature([PurchaseOrder])`
  - Provides and exports `PendingOrdersLimitGuard`

- **`/src/purchase-orders/purchase-orders.module.ts`**
  - Imports `PendingOrdersLimitGuard`
  - Adds guard to providers

### 5. Configuration
- **`/backend/.env.example`**
  - Added rate limiting environment variables:
    - `MAX_PENDING_ORDERS_PER_PERSON=3`
    - `MAX_PENDING_ORDERS_PER_IP=5`
    - `THROTTLE_TTL=60000`
    - `THROTTLE_LIMIT=10`

### 6. Translations
- **`/src/i18n/en/purchase-orders.json`**
  - Added `ip_limit_exceeded` message
  - Added `person_limit_exceeded` message

- **`/src/i18n/es/purchase-orders.json`**
  - Added Spanish translations for rate limit errors

## Rate Limiting Layers

### Layer 1: @nestjs/throttler (Global)
- **Already configured** in `app.module.ts`
- Uses Redis for distributed rate limiting
- Three tiers: short (1s), medium (10s), long (60s)
- Applied globally via `ThrottlerGuard`

### Layer 2: Endpoint-Specific Throttling
- **POST /api/purchase-orders**: 10 requests/minute
- **POST /api/payments**: Configurable via env (default: 10/min)
- **POST /api/registrations**: 5/min (guests), 15/min (members)

### Layer 3: Business Logic Rate Limiting
- **Per Person**: Max 3 pending orders
- **Per IP**: Max 5 pending orders
- Applied via `PendingOrdersLimitGuard`

## Environment Variables

Add these to your `.env` file:

```env
# Rate Limiting Configuration
MAX_PENDING_ORDERS_PER_PERSON=3
MAX_PENDING_ORDERS_PER_IP=5
THROTTLE_TTL=60000
THROTTLE_LIMIT=10
```

## Database Migration

Run the migration to add the metadata field:

```bash
npm run migration:run
```

Or in production:

```bash
npm run migration:run --config ormconfig.production.json
```

## Testing the Implementation

### 1. Test Throttle Limit (10 req/min)
```bash
# Send 11 requests quickly
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/purchase-orders \
    -H "Content-Type: application/json" \
    -d '{"buyerEmail": "test@example.com", "items": []}'
done
# Request 11 should return 429 Too Many Requests
```

### 2. Test IP Limit (5 pending orders)
```bash
# Create 6 pending orders from same IP
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/purchase-orders \
    -H "Content-Type: application/json" \
    -d '{
      "buyerEmail": "test'$i'@example.com",
      "items": [{
        "ticketId": "ticket-uuid",
        "quantity": 1,
        "attendees": [{"email": "attendee'$i'@example.com", ...}]
      }]
    }'
done
# Request 6 should return 400 with "ip_limit_exceeded" message
```

### 3. Test Person Limit (3 pending orders)
```bash
# Create 4 pending orders for same person
PERSON_ID="person-uuid-here"
for i in {1..4}; do
  curl -X POST http://localhost:3000/api/purchase-orders \
    -H "Content-Type: application/json" \
    -d '{
      "buyerEmail": "buyer@example.com",
      "buyerPersonId": "'$PERSON_ID'",
      "items": [...]
    }'
done
# Request 4 should return 400 with "person_limit_exceeded" message
```

## Monitoring Queries

### Check pending orders by IP:
```sql
SELECT
  metadata->>'clientIp' as ip,
  COUNT(*) as pending_count
FROM purchase_orders
WHERE status = 'PENDING'
  AND metadata->>'clientIp' IS NOT NULL
GROUP BY metadata->>'clientIp'
ORDER BY pending_count DESC;
```

### Check pending orders by person:
```sql
SELECT
  "buyerPersonId",
  COUNT(*) as pending_count
FROM purchase_orders
WHERE status = 'PENDING'
  AND "buyerPersonId" IS NOT NULL
GROUP BY "buyerPersonId"
ORDER BY pending_count DESC;
```

### Find IPs close to limit:
```sql
SELECT
  metadata->>'clientIp' as ip,
  COUNT(*) as pending_count,
  5 - COUNT(*) as remaining_before_block
FROM purchase_orders
WHERE status = 'PENDING'
  AND metadata->>'clientIp' IS NOT NULL
GROUP BY metadata->>'clientIp'
HAVING COUNT(*) >= 3
ORDER BY pending_count DESC;
```

## Key Features

1. **Distributed Rate Limiting**: Uses Redis for multi-instance deployments
2. **IP-based Limiting**: Tracks anonymous users via IP address
3. **Person-based Limiting**: Tracks authenticated users via Person ID
4. **Proxy Support**: Correctly extracts client IP from X-Forwarded-For headers
5. **Metadata Storage**: Stores IP and user agent in JSONB for analytics
6. **Localized Errors**: Error messages in English and Spanish
7. **Configurable**: All limits configurable via environment variables
8. **JSONB Indexing**: GIN index for efficient metadata queries

## Security Considerations

1. **Reverse Proxy**: Ensure nginx/Apache properly sets X-Forwarded-For headers
2. **IP Spoofing**: Trust only the first IP in X-Forwarded-For from trusted proxies
3. **Redis Security**: Secure Redis with password and network isolation
4. **Rate Limit Headers**: Consider adding X-RateLimit-* headers in future

## Next Steps

1. ✅ Run migrations: `npm run migration:run`
2. ✅ Update `.env` with rate limit values
3. ✅ Test endpoints with rate limiting
4. ✅ Monitor Redis for throttle data
5. ✅ Check logs for rate limit violations
6. ✅ Adjust limits based on traffic patterns

## Support

For questions or issues:
- Read full documentation: `/backend/RATE_LIMITING.md`
- Check logs: `docker logs backend-container`
- Monitor Redis: `redis-cli KEYS "throttler:*"`
- Database queries: See monitoring section above

## Version

- Implementation Date: 2025-12-06
- NestJS Version: 11.x
- @nestjs/throttler: 6.4.0
- Redis Storage: @nest-lab/throttler-storage-redis 1.1.0
