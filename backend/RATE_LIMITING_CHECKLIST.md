# Rate Limiting Implementation - Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Copy rate limiting variables from `.env.example` to `.env`
- [ ] Adjust `MAX_PENDING_ORDERS_PER_PERSON` based on business requirements
- [ ] Adjust `MAX_PENDING_ORDERS_PER_IP` based on expected traffic
- [ ] Set appropriate `THROTTLE_TTL` and `THROTTLE_LIMIT` values
- [ ] Verify Redis connection settings (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`)

### 2. Database Migration
- [ ] Review migration file: `1733480000000-AddMetadataToPurchaseOrders.ts`
- [ ] Run migration in development: `npm run migration:run`
- [ ] Verify `metadata` column exists in `purchase_orders` table
- [ ] Verify GIN index created: `IDX_purchase_orders_metadata_clientIp`
- [ ] Test rollback (optional): `npm run migration:revert`

### 3. Code Verification
- [ ] Verify `PendingOrdersLimitGuard` is in `/src/common/guards/`
- [ ] Verify `rate-limit.config.ts` is in `/src/common/config/`
- [ ] Check `CommonModule` exports `PendingOrdersLimitGuard`
- [ ] Check `PurchaseOrdersModule` imports guard
- [ ] Verify `PurchaseOrder` entity has `metadata` field
- [ ] Verify `PurchaseOrdersController` uses guard
- [ ] Check i18n translations (en/es) for error messages

### 4. Dependencies
- [ ] Verify `@nestjs/throttler` is installed (v6.4.0+)
- [ ] Verify `@nest-lab/throttler-storage-redis` is installed (v1.1.0+)
- [ ] Verify `ioredis` is installed and configured
- [ ] Run `npm install` to ensure all dependencies are present

### 5. Testing (Development)
- [ ] Test endpoint throttling: Send 11+ requests to `/api/purchase-orders`
- [ ] Test IP limit: Create 6 pending orders without `buyerPersonId`
- [ ] Test Person limit: Create 4 pending orders with same `buyerPersonId`
- [ ] Verify error messages are localized (test with `?lang=en` and `?lang=es`)
- [ ] Check logs for guard execution and IP extraction
- [ ] Verify metadata is stored in database

### 6. Redis Configuration
- [ ] Verify Redis is running: `redis-cli ping`
- [ ] Check throttle keys: `redis-cli KEYS "throttler:*"`
- [ ] Monitor Redis memory usage
- [ ] Set up Redis persistence (optional)
- [ ] Configure Redis password (production)
- [ ] Set up Redis replication (production)

### 7. Monitoring Setup
- [ ] Add alerts for rate limit violations
- [ ] Set up dashboard for pending orders by IP
- [ ] Monitor Redis connection health
- [ ] Track throttle limit hits in logs
- [ ] Set up Grafana/Prometheus metrics (optional)

## Deployment Steps

### Development Environment
```bash
# 1. Install dependencies
npm install

# 2. Run migrations
npm run migration:run

# 3. Start Redis
docker-compose up -d redis

# 4. Update .env
cp .env.example .env
# Edit .env and set rate limit values

# 5. Start application
npm run start:dev

# 6. Test endpoints
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{"buyerEmail": "test@example.com", "items": []}'
```

### Production Environment
```bash
# 1. Backup database
pg_dump -U postgres cip_eventos > backup_before_migration.sql

# 2. Run migrations
npm run migration:run

# 3. Verify migration
npm run migration:show

# 4. Update environment variables
# Add to production .env or secrets manager

# 5. Build application
npm run build

# 6. Restart services
pm2 restart cip-eventos-backend
# or
docker-compose restart backend

# 7. Monitor logs
pm2 logs cip-eventos-backend
# or
docker logs -f backend-container

# 8. Verify functionality
curl -X POST https://api.cipeventos.com/api/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{"buyerEmail": "test@example.com", "items": []}'
```

## Post-Deployment Verification

### 1. Functional Tests
- [ ] Create a purchase order successfully
- [ ] Verify metadata is stored with client IP
- [ ] Trigger IP limit and verify error message
- [ ] Trigger Person limit and verify error message
- [ ] Trigger throttle limit and verify 429 response
- [ ] Test with different `Accept-Language` headers

### 2. Performance Tests
- [ ] Measure response time for guarded endpoints
- [ ] Check Redis latency: `redis-cli --latency`
- [ ] Monitor database query performance
- [ ] Verify GIN index is being used: `EXPLAIN ANALYZE ...`

### 3. Security Tests
- [ ] Test with different X-Forwarded-For values
- [ ] Verify IP extraction works behind proxy
- [ ] Test with spoofed headers (should use trusted proxy only)
- [ ] Verify Redis is not publicly accessible

### 4. Monitoring Queries
Run these queries to verify data:

```sql
-- Check metadata column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'purchase_orders'
  AND column_name = 'metadata';

-- Check if IPs are being stored
SELECT
  metadata->>'clientIp' as ip,
  COUNT(*) as count
FROM purchase_orders
WHERE metadata IS NOT NULL
GROUP BY metadata->>'clientIp'
ORDER BY count DESC
LIMIT 10;

-- Check pending orders by status
SELECT
  status,
  COUNT(*) as count
FROM purchase_orders
GROUP BY status;

-- Verify index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'purchase_orders'
  AND indexname LIKE '%metadata%';
```

## Rollback Plan

If issues occur, follow these steps:

### 1. Disable Rate Limiting (Quick Fix)
```env
# Set very high limits to effectively disable
MAX_PENDING_ORDERS_PER_PERSON=999999
MAX_PENDING_ORDERS_PER_IP=999999
THROTTLE_LIMIT=999999
```

### 2. Remove Guard (Code Change)
```typescript
// In purchase-orders.controller.ts
// Comment out the @UseGuards decorator
@Post()
@HttpCode(HttpStatus.CREATED)
@Throttle({ default: { limit: 10, ttl: 60000 } })
// @UseGuards(PendingOrdersLimitGuard)  // DISABLED
async create(@Body() createDto: CreatePurchaseOrderDto) {
  // ...
}
```

### 3. Revert Migration (Database)
```bash
npm run migration:revert
```

### 4. Full Rollback
```bash
# 1. Restore database backup
psql -U postgres cip_eventos < backup_before_migration.sql

# 2. Deploy previous version
git checkout <previous-commit>
npm run build
pm2 restart cip-eventos-backend
```

## Troubleshooting

### Issue: Rate limit errors even with low traffic
**Solution**: Check Redis connection and verify TTL values

```bash
# Check Redis
redis-cli ping

# Check throttle keys
redis-cli KEYS "throttler:*"

# Clear throttle data (CAUTION: Development only)
redis-cli FLUSHDB
```

### Issue: IP always shows as "unknown"
**Solution**: Verify reverse proxy headers

```bash
# Check nginx config
cat /etc/nginx/sites-available/cipeventos

# Should have:
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Real-IP $remote_addr;
```

### Issue: Guard not executing
**Solution**: Verify guard is registered

```typescript
// Check PurchaseOrdersModule providers
providers: [PurchaseOrdersService, PendingOrdersLimitGuard],

// Check CommonModule exports
exports: [QrService, PendingOrdersLimitGuard],
```

### Issue: Migration fails
**Solution**: Check for existing metadata column

```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'purchase_orders' AND column_name = 'metadata';

-- If exists, drop it manually
ALTER TABLE purchase_orders DROP COLUMN metadata;

-- Then run migration again
npm run migration:run
```

## Performance Optimization

### Redis Optimization
```bash
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save ""  # Disable RDB for pure cache usage
```

### Database Optimization
```sql
-- Analyze table for better query planning
ANALYZE purchase_orders;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'purchase_orders'
ORDER BY idx_scan DESC;

-- Vacuum if needed
VACUUM ANALYZE purchase_orders;
```

## Success Criteria

- [ ] All migrations run successfully
- [ ] Rate limiting works for all three endpoints
- [ ] Error messages are clear and localized
- [ ] Redis stores throttle data correctly
- [ ] Metadata is stored in purchase orders
- [ ] Performance impact is minimal (<10ms per request)
- [ ] No false positives in rate limiting
- [ ] Logs show guard execution
- [ ] Monitoring queries return expected data

## Support Contacts

- **Backend Team Lead**: carevalojesus@gmail.com
- **DevOps**: [Contact]
- **Database Admin**: [Contact]

## Documentation Links

- [Full Documentation](/backend/RATE_LIMITING.md)
- [Summary](/backend/RATE_LIMITING_SUMMARY.md)
- [Migration Guide](/backend/src/database/migrations/README.md)
- [NestJS Throttler Docs](https://docs.nestjs.com/security/rate-limiting)
