# Rate Limiting Implementation

## Overview

This document describes the rate limiting implementation in the CIP Eventos backend. The system uses two layers of protection:

1. **Throttle-based Rate Limiting**: Limits the number of requests per time window using `@nestjs/throttler`
2. **Business Logic Rate Limiting**: Limits pending orders per person and per IP using a custom guard

## Architecture

### 1. Throttle Rate Limiting (@nestjs/throttler)

The application uses distributed rate limiting with Redis storage to ensure limits work across multiple server instances.

**Configuration** (`src/app.module.ts`):
```typescript
ThrottlerModule.forRootAsync({
  throttlers: [
    {
      name: 'short',
      ttl: seconds(1),
      limit: 3, // 3 requests per second (burst protection)
    },
    {
      name: 'medium',
      ttl: seconds(10),
      limit: 20, // 20 requests per 10 seconds
    },
    {
      name: 'long',
      ttl: seconds(60),
      limit: 100, // 100 requests per minute
    },
  ],
  storage: new ThrottlerStorageRedisService(redisInstance),
})
```

**Global Guard**: `ThrottlerGuard` is registered as a global guard in `app.module.ts`

### 2. Pending Orders Rate Limiting

Custom guard that prevents users from creating too many pending orders.

**Configuration** (`src/common/config/rate-limit.config.ts`):
```typescript
export const RateLimitConfig = {
  MAX_PENDING_ORDERS_PER_PERSON: 3,  // Max pending orders per person
  MAX_PENDING_ORDERS_PER_IP: 5,      // Max pending orders per IP
  THROTTLE_TTL: 60000,               // Throttle window (ms)
  THROTTLE_LIMIT: 10,                // Max requests in throttle window
}
```

**Environment Variables**:
```bash
# Maximum pending orders per Person
MAX_PENDING_ORDERS_PER_PERSON=3

# Maximum pending orders per IP
MAX_PENDING_ORDERS_PER_IP=5

# Throttle TTL in milliseconds
THROTTLE_TTL=60000

# Throttle Limit (requests per TTL)
THROTTLE_LIMIT=10
```

## Implementation Details

### PendingOrdersLimitGuard

**Location**: `/src/common/guards/pending-orders-limit.guard.ts`

**Features**:
- Checks pending orders count by Person ID
- Checks pending orders count by Client IP
- Extracts client IP from headers (supports proxies)
- Stores IP in purchase order metadata
- Provides localized error messages

**How it works**:

1. **IP Extraction**: The guard extracts the client IP from:
   - `x-forwarded-for` header (for proxied requests)
   - `x-real-ip` header
   - Direct connection IP

2. **IP Tracking**: Client IP is stored in the `metadata` JSONB field of `purchase_orders`:
   ```typescript
   {
     clientIp: "192.168.1.1",
     userAgent: "Mozilla/5.0..."
   }
   ```

3. **Limit Checking**:
   - Queries `purchase_orders` table for PENDING orders
   - Counts orders by `buyerPersonId` (if authenticated)
   - Counts orders by `metadata.clientIp` (always)
   - Throws `BadRequestException` if limits exceeded

### Database Schema

**Migration**: `/src/database/migrations/1733480000000-AddMetadataToPurchaseOrders.ts`

```sql
-- Add metadata column
ALTER TABLE "purchase_orders" ADD "metadata" jsonb;

-- Create GIN index for efficient JSONB queries
CREATE INDEX "IDX_purchase_orders_metadata_clientIp"
  ON "purchase_orders" USING gin (metadata jsonb_path_ops);
```

**PurchaseOrder Entity**:
```typescript
@Column({ type: 'jsonb', nullable: true })
metadata: {
  clientIp?: string;
  userAgent?: string;
  [key: string]: any;
} | null;
```

## Protected Endpoints

### 1. POST /api/purchase-orders

**Throttle**: 10 requests per minute
**Guard**: `PendingOrdersLimitGuard`
**Limits**:
- Max 3 pending orders per Person
- Max 5 pending orders per IP

```typescript
@Post()
@Throttle({ default: { limit: 10, ttl: 60000 } })
@UseGuards(PendingOrdersLimitGuard)
async create(@Body() createDto: CreatePurchaseOrderDto, @Req() req: Request) {
  // ...
}
```

### 2. POST /api/payments

**Throttle**: Configurable via env (default: 10 per minute)

```typescript
@Controller('payments')
@Throttle({
  default: {
    limit: RateLimitConfig.THROTTLE_LIMIT,
    ttl: RateLimitConfig.THROTTLE_TTL
  }
})
export class PaymentsController {
  // ...
}
```

### 3. POST /api/registrations

**Throttle**: 5 requests per minute (guests), 15 per minute (members)

```typescript
// Guest endpoint
@Public()
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post()
createGuest(@Body() dto: CreateRegistrationDto) {
  // ...
}

// Member endpoint
@Throttle({ default: { limit: 15, ttl: 60000 } })
@Post('member')
createMember(@Body() dto: CreateRegistrationDto, @CurrentUser() user: User) {
  // ...
}
```

## Error Messages

The system provides localized error messages in English and Spanish:

**English** (`src/i18n/en/purchase-orders.json`):
```json
{
  "ip_limit_exceeded": "You have exceeded the limit of {limit} pending orders per IP. Please complete or cancel your existing orders before creating a new one.",
  "person_limit_exceeded": "You have exceeded the limit of {limit} pending orders. Please complete or cancel your existing orders before creating a new one."
}
```

**Spanish** (`src/i18n/es/purchase-orders.json`):
```json
{
  "ip_limit_exceeded": "Has excedido el límite de {limit} pedidos pendientes por IP. Por favor, completa o cancela tus pedidos existentes antes de crear uno nuevo.",
  "person_limit_exceeded": "Has excedido el límite de {limit} pedidos pendientes. Por favor, completa o cancela tus pedidos existentes antes de crear uno nuevo."
}
```

## Usage Examples

### Example 1: Creating a Purchase Order

```bash
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "buyerEmail": "buyer@example.com",
    "buyerPersonId": "uuid-here",
    "items": [...]
  }'
```

**Success Response**:
```json
{
  "message": "Purchase order created successfully",
  "purchaseOrderId": "uuid-here",
  "status": "PENDING",
  "totalAmount": 100.00,
  "itemCount": 2,
  "expiresAt": "2025-12-06T15:30:00Z"
}
```

**Rate Limit Exceeded (Person)**:
```json
{
  "statusCode": 400,
  "message": "You have exceeded the limit of 3 pending orders. Please complete or cancel your existing orders before creating a new one.",
  "error": "Bad Request"
}
```

**Rate Limit Exceeded (IP)**:
```json
{
  "statusCode": 400,
  "message": "You have exceeded the limit of 5 pending orders per IP. Please complete or cancel your existing orders before creating a new one.",
  "error": "Bad Request"
}
```

**Throttle Limit Exceeded**:
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

### Example 2: Checking Pending Orders

Query pending orders for a person:
```sql
SELECT * FROM purchase_orders
WHERE "buyerPersonId" = 'uuid-here'
  AND status = 'PENDING';
```

Query pending orders for an IP:
```sql
SELECT * FROM purchase_orders
WHERE metadata @> '{"clientIp": "192.168.1.1"}'
  AND status = 'PENDING';
```

## Testing

### Test Rate Limits

1. **Test IP Limit**:
   ```bash
   # Create 6 pending orders from the same IP without personId
   for i in {1..6}; do
     curl -X POST http://localhost:3000/api/purchase-orders \
       -H "Content-Type: application/json" \
       -d '{
         "buyerEmail": "test'$i'@example.com",
         "items": [...]
       }'
   done
   # 6th request should fail with IP limit error
   ```

2. **Test Person Limit**:
   ```bash
   # Create 4 pending orders for the same person
   for i in {1..4}; do
     curl -X POST http://localhost:3000/api/purchase-orders \
       -H "Content-Type: application/json" \
       -d '{
         "buyerEmail": "buyer@example.com",
         "buyerPersonId": "same-uuid-here",
         "items": [...]
       }'
   done
   # 4th request should fail with person limit error
   ```

3. **Test Throttle Limit**:
   ```bash
   # Send 11 requests within 1 minute
   for i in {1..11}; do
     curl -X POST http://localhost:3000/api/purchase-orders \
       -H "Content-Type: application/json" \
       -d '{"buyerEmail": "test@example.com", "items": []}'
   done
   # 11th request should fail with 429 Too Many Requests
   ```

## Configuration Tuning

Adjust limits based on your needs:

### Development Environment
```env
MAX_PENDING_ORDERS_PER_PERSON=10
MAX_PENDING_ORDERS_PER_IP=20
THROTTLE_LIMIT=100
```

### Production Environment
```env
MAX_PENDING_ORDERS_PER_PERSON=3
MAX_PENDING_ORDERS_PER_IP=5
THROTTLE_LIMIT=10
```

### High Traffic Events
```env
MAX_PENDING_ORDERS_PER_PERSON=5
MAX_PENDING_ORDERS_PER_IP=10
THROTTLE_LIMIT=20
```

## Monitoring

Monitor rate limiting effectiveness:

```sql
-- Count pending orders by IP
SELECT
  metadata->>'clientIp' as ip,
  COUNT(*) as pending_count
FROM purchase_orders
WHERE status = 'PENDING'
  AND metadata->>'clientIp' IS NOT NULL
GROUP BY metadata->>'clientIp'
ORDER BY pending_count DESC;

-- Count pending orders by person
SELECT
  "buyerPersonId",
  COUNT(*) as pending_count
FROM purchase_orders
WHERE status = 'PENDING'
  AND "buyerPersonId" IS NOT NULL
GROUP BY "buyerPersonId"
ORDER BY pending_count DESC;

-- Find IPs close to limit
SELECT
  metadata->>'clientIp' as ip,
  COUNT(*) as pending_count,
  5 - COUNT(*) as remaining
FROM purchase_orders
WHERE status = 'PENDING'
  AND metadata->>'clientIp' IS NOT NULL
GROUP BY metadata->>'clientIp'
HAVING COUNT(*) >= 3
ORDER BY pending_count DESC;
```

## Security Considerations

1. **IP Spoofing**: The system trusts `x-forwarded-for` headers. Ensure your reverse proxy (nginx, Apache) is properly configured to set these headers.

2. **Distributed Attacks**: IP-based limiting can be bypassed using multiple IPs. Monitor for patterns of distributed attacks.

3. **Person-based Limiting**: More reliable for authenticated users, but requires login.

4. **Redis Availability**: Throttle limiting depends on Redis. If Redis is down, rate limiting will fail open (allow all requests).

## Future Enhancements

1. **Fingerprinting**: Add browser fingerprinting for better anonymous user tracking
2. **Geographic Limits**: Add per-country or per-region limits
3. **Dynamic Limits**: Adjust limits based on event popularity or time to event
4. **Allowlisting**: Allow certain IPs or users to bypass limits
5. **Rate Limit Headers**: Add `X-RateLimit-*` headers to responses
6. **Metrics Dashboard**: Real-time monitoring of rate limit hits
