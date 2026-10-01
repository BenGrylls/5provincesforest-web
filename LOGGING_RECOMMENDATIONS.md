# 📋 Logging Enhancement Recommendations
**Analysis Date**: 2026-10-01  
**Project**: 5 Provinces Forest Foundation Website  
**Current Status**: Basic admin audit logging only

---

## 🎯 Analysis of Current Logging

### What's Currently Logged ✅
```
Admin Activities:
- Admin panel: CREATE, READ, UPDATE, DELETE
- Authentication: LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT
- Permissions: PERMISSIONS_CHANGED
- Admin Management: SUB_ADMIN_CREATED, SUB_ADMIN_DELETED, SESSIONS_REVOKED

Coverage: Admin users only (86 events in 22 days)
Retention: 120 days (legal requirement)
Quality: 69% complete (missing IP for some entries)
```

### What's Missing ❌
```
1. Public visitor activity
2. API performance metrics
3. File operations (uploads, downloads)
4. Security events (rate limits, input validation)
5. Database performance
6. Email/notifications
7. System errors and exceptions
8. Third-party integrations
```

---

## 💡 Recommended Logging Strategy

### TIER 1: Security Logs (CRITICAL)
**Why**: Detect attacks, regulatory compliance, forensics

#### 1.1 Authentication & Authorization
```typescript
Events to log:
- Failed login attempts (PUBLIC admin form)
- Account lockout triggered
- Session expiration
- Unauthorized access attempts (403 Forbidden)
- CSRF attack attempts (detected)
- Rate limit blocks
- Token refresh (if implemented)
- Permission denial for sub-admins

Schema:
{
  timestamp: Date,
  eventType: string,           // 'LOGIN_FAILED', 'CSRF_BLOCKED', 'RATE_LIMITED'
  username: string,            // null if public
  targetResource: string,      // '/admin/login', '/api/cms'
  ip_address: string,
  user_agent: string,
  reason: string,              // 'invalid_password', 'csrf_token_mismatch', 'rate_limit_exceeded'
  attempts?: number,           // for brute force tracking
  lockoutDuration?: number,    // seconds
}

Implementation:
- Log in: auth-related routes
- Log in: middleware before processing
- Log in: rate limiter interception
- Retention: 180 days (regulatory minimum)
- Store: admin_logs table (expand from current)
```

#### 1.2 Input Validation Failures
```typescript
Events to log:
- SQL injection patterns detected
- XSS payload detected
- Invalid file type uploaded
- File size exceeded
- Malformed JSON/data
- Unexpected input types

Why: Detect attack patterns, even if blocked

Schema:
{
  timestamp: Date,
  eventType: 'VALIDATION_FAILED',
  endpoint: string,            // '/api/cms', '/api/upload'
  validationType: string,      // 'sql_injection', 'xss', 'file_type'
  inputField: string,          // 'title', 'content', 'file'
  ip_address: string,
  userId: string | null,
  payload?: string,            // first 500 chars (sanitized)
}

Implementation:
- Update src/lib/input-validation.ts to log failures
- Store in separate table: security_incidents
- Real-time alert on patterns
- Retention: 90 days
```

#### 1.3 File Operations
```typescript
Events to log:
- File uploaded (success/failure)
- File downloaded (sensitive files only)
- File deleted
- File accessed (if sensitive)

Why: Track data handling, find unauthorized access

Schema:
{
  timestamp: Date,
  eventType: string,           // 'FILE_UPLOADED', 'FILE_DOWNLOADED', 'FILE_DELETED'
  userId: string | null,
  fileName: string,
  fileType: string,            // 'image/jpeg', 'application/pdf'
  fileSize: number,            // bytes
  directory: string,           // '/uploads/news', '/uploads/publications'
  ip_address: string,
  userAgent: string,
  result: string,              // 'success', 'failed'
  reason?: string,             // if failed: 'virus_detected', 'size_exceeded'
}

Implementation:
- Hook into src/app/api/upload/route.ts
- Track uploads in: public/uploads/ directory
- Track public downloads of PDFs (publications)
- Retention: 30 days (reduce storage)
```

---

### TIER 2: Performance & Debugging Logs (HIGH)
**Why**: Optimize performance, troubleshoot issues, understand user experience

#### 2.1 API Performance Metrics
```typescript
Events to log (background, sampled 10%):
- API request processing time
- Database query duration
- External API calls (if any)
- Response status code
- Response size

Why: Identify bottlenecks, slow endpoints, N+1 queries

Schema:
{
  timestamp: Date,
  endpoint: string,
  method: string,              // 'GET', 'POST', etc.
  statusCode: number,
  responseTime: number,        // milliseconds
  userId: string | null,
  queryCount?: number,         // how many DB queries
  cacheHit?: boolean,
  dataSize: number,            // response bytes
}

Implementation:
- Create middleware in Next.js
- Store in: performance_logs table
- Retention: 14 days
- Sample rate: 10% (reduce storage)
- Alert if > 2 seconds
```

#### 2.2 Database Query Logging
```typescript
Events to log (development only, disable in production):
- Slow queries (> 100ms)
- Queries with N+1 pattern
- Full table scans
- Connection pool exhaustion

Why: Find performance bottlenecks

Implementation:
- Use PostgreSQL query logging
- Configure: log_min_duration_statement = 100 (ms)
- Store in: PostgreSQL logs or syslog
- Retention: 7 days (dev only)
```

#### 2.3 Application Errors & Exceptions
```typescript
Events to log:
- Unhandled exceptions
- Database connection errors
- Timeout errors
- Third-party API failures
- File system errors

Why: Quick incident detection and resolution

Schema:
{
  timestamp: Date,
  errorType: string,           // 'DatabaseError', 'TimeoutError'
  message: string,
  stack: string,               // last 2000 chars
  endpoint?: string,
  userId?: string,
  statusCode?: number,
  context?: object,            // request params (sanitized)
}

Implementation:
- Add error logging to catch blocks
- Use logger library (e.g., Winston, Pino)
- Store in: application_logs table OR external logging service
- Real-time alert on critical errors
- Retention: 30 days
```

---

### TIER 3: Business Intelligence Logs (MEDIUM)
**Why**: Understand usage patterns, content performance, visitor behavior

#### 3.1 Public Page Analytics
```typescript
Events to log (for public pages):
- Page views (news, media, publications, committee)
- Content access (which articles viewed)
- Video plays (duration, completion)
- Downloads (which PDFs, how many times)
- Search queries (if search implemented)

Why: Content popularity, user engagement, content strategy

Schema:
{
  timestamp: Date,
  pageType: string,            // 'news', 'media', 'publication', 'committee'
  contentId?: string | number, // article/media ID
  contentTitle?: string,
  action: string,              // 'view', 'download', 'play'
  sessionId?: string,          // client-side session tracking
  ip_address: string,          // anonymize last octet
  referrer?: string,           // where they came from
  duration?: number,           // for video: play duration in seconds
}

Implementation Options:
A. Lightweight (Low Storage):
   - Store in analytics table (not security table)
   - 5% sampling (log 1 of every 20 visits)
   - Retention: 90 days
   
B. Full Tracking (Higher Storage):
   - Use external service: Google Analytics, Plausible, Metabase
   - Privacy-friendly (no personal data)
   - No additional server load
   - Cost: Free to $50/month

Recommendation: Use Google Analytics (free) instead of custom
```

#### 3.2 Search & Filter Analytics
```typescript
Events to log (if search implemented):
- Search queries entered
- Filter selections
- Sort options used
- Empty results (content gap identification)

Implementation:
- Log in public API routes
- Retention: 30 days
- Use for content strategy
```

---

### TIER 4: Compliance & Legal Logs (MEDIUM)
**Why**: Meet regulatory requirements (GDPR-like, Thailand)

#### 4.1 Data Access Audit
```typescript
Events to log:
- Who accessed sensitive data
- Which admin accessed what content
- Export operations (reports, logs)
- Backup operations

Why: Data governance, GDPR Article 32

Schema (already using similar):
{
  timestamp: Date,
  userId: string,
  action: string,              // 'EXPORT', 'VIEW_SENSITIVE_DATA', 'BACKUP'
  dataType: string,            // 'admin_logs', 'contact_info', 'user_data'
  quantity: number,            // how many records
  ip_address: string,
}

Implementation:
- Enhance current admin_logs table
- Add flags for sensitive operations
- Retention: 120 days (already doing this)
```

#### 4.2 Configuration Changes
```typescript
Events to log:
- Website settings changed (color scheme, important day cover)
- Email configuration changes
- Security policy changes
- Admin permission changes

Implementation:
- Already logging via admin panel
- Good compliance coverage
```

---

## 🏗️ Recommended Log Architecture

### Current State
```
PostgreSQL admin_logs table
└─ 86 records in 22 days
└─ Admin actions only
└─ Issues: Missing IPs, Incomplete coverage
```

### Recommended Structure
```
PostgreSQL Database
├─ admin_logs (existing, expand)
│  ├─ Admin panel actions (UPDATE, DELETE, etc.)
│  ├─ Retention: 120 days
│  └─ 1-2 records/minute during office hours
│
├─ security_logs (NEW - TIER 1)
│  ├─ Authentication failures, attacks detected
│  ├─ Retention: 180 days
│  └─ 0-10 records/day (spike during attacks)
│
├─ performance_logs (NEW - TIER 2)
│  ├─ API response times (sampled 10%)
│  ├─ Retention: 14 days
│  └─ ~100 records/day (sampled)
│
├─ application_logs (NEW - TIER 2)
│  ├─ Errors, exceptions, timeouts
│  ├─ Retention: 30 days
│  └─ 0-50 records/day (varies)
│
└─ analytics_logs (NEW - TIER 3, optional)
   ├─ Public page views, downloads (5% sampling)
   ├─ Retention: 90 days
   └─ ~50 records/day (heavily sampled)
```

---

## 📊 Storage Impact Analysis

### Current Logs
```
admin_logs: ~86 records in 22 days
Average size: ~2 KB per record
Daily: ~4 records = 8 KB/day
Annual: ~1,460 records = 3 MB (tiny)
120 days: 29 MB (current requirement)
```

### With All Enhancements
```
Daily volume estimate:
- admin_logs: 4 records × 2 KB = 8 KB
- security_logs: 5 records × 1.5 KB = 7.5 KB (incidents)
- performance_logs: 100 records × 0.5 KB = 50 KB (sampled)
- application_logs: 10 records × 1 KB = 10 KB (errors)
- analytics_logs: 50 records × 0.3 KB = 15 KB (sampled)

Daily total: ~90 KB
Monthly: ~2.7 MB
Annual: ~33 MB (very reasonable)

Recommendation: No need for log archival system
Can store everything in single PostgreSQL table with indexes
```

---

## 🔧 Implementation Priority & Effort

### Phase 1 (IMMEDIATE - Week 1) ⚡
**Effort**: 4-6 hours  
**Impact**: High  

```
1. Fix Missing IP Tracking
   - Update all writeAuditLog() calls with proper Request object
   - Verify INSERT/UPDATE/DELETE captures IP
   - Test: Re-export logs, verify 100% IP coverage
   
2. Create security_logs Table
   - New table: security_incidents
   - Log failed login attempts (already doing via admin_logs)
   - Log rate limit blocks (from api-rate-limit.ts)
   - Log CSRF attempts (if any)

3. Implement Error Logging
   - Add try-catch in all API routes
   - Log to security_logs or application_logs
   - No throw (silent fail), just log
```

### Phase 2 (SHORT TERM - Week 2-3) 🚀
**Effort**: 8-12 hours  
**Impact**: Medium  

```
1. API Performance Monitoring
   - Middleware to track response time
   - Create performance_logs table
   - Sample 10% of requests (reduce storage)
   - Alert if > 2 seconds

2. File Operation Logging
   - Hook into /api/upload route
   - Log all uploads/deletions
   - Track file metadata
   
3. Enhance Admin Logs
   - Add user_agent field if missing
   - Add query_time (how long the operation took)
   - Add affected_records (how many rows changed)
```

### Phase 3 (OPTIONAL - Month 2) 📊
**Effort**: 6-8 hours  
**Impact**: Low-Medium  

```
1. Analytics (Optional)
   - Option A: Use Google Analytics (recommended)
   - Option B: Custom lightweight tracking
   
2. Dashboard
   - Create admin view for log analytics
   - Charts: Login attempts, errors/day, API response times
   - Alert thresholds configuration
```

---

## 📐 Technical Implementation Details

### 1. Fix Missing IP (Highest Priority)

**Current Problem:**
```typescript
// src/app/api/cms/route.ts - 27 INSERT entries have no IP
writeAuditLog({
  // ... missing 'request' parameter
  action: 'INSERT',
  username: actor.username,
  // ...
});
```

**Solution:**
```typescript
// All audit log calls MUST have request parameter
writeAuditLog({
  request,  // ← REQUIRED
  action: 'INSERT',
  username: actor.username,
  category: 'news',
  targetType: 'article',
  targetId: id,
  targetTitle: title,
  detail: { fields: Object.keys(changed) },
});
```

### 2. Create Performance Logger

```typescript
// src/lib/performance-logger.ts (NEW)
export async function logPerformance({
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;     // milliseconds
  userId?: string;
  queryCount?: number;
}: PerformanceLogInput) {
  // Sample 10% of logs
  if (Math.random() > 0.1) return;
  
  await query(
    `INSERT INTO performance_logs 
     (endpoint, method, status_code, response_time_ms, user_id, query_count, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [endpoint, method, statusCode, responseTime, userId, queryCount]
  );
}
```

### 3. Create Security Incident Logger

```typescript
// src/lib/security-logger.ts (NEW)
export async function logSecurityIncident({
  incidentType: string;   // 'input_validation_failed', 'rate_limit_exceeded'
  severity: 'info' | 'warning' | 'critical';
  userId?: string;
  details: object;
  request: Request;
}: SecurityIncidentInput) {
  await query(
    `INSERT INTO security_incidents 
     (incident_type, severity, user_id, details, ip_address, user_agent, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [
      incidentType,
      severity,
      userId || null,
      JSON.stringify(details),
      extractIp(request),
      request.headers.get('user-agent'),
    ]
  );
}
```

### 4. Middleware for Performance Tracking

```typescript
// src/middleware.ts (UPDATE)
export function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  // Attach start time to request
  request.headers.set('x-start-time', String(startTime));
  
  return NextResponse.next();
}

// In each API route:
export async function GET(request: Request) {
  const startTime = parseInt(request.headers.get('x-start-time') || '0');
  
  try {
    // ... handle request
    
    const responseTime = Date.now() - startTime;
    if (Math.random() < 0.1) {  // 10% sampling
      await logPerformance({
        endpoint: '/api/news',
        method: 'GET',
        statusCode: 200,
        responseTime,
      });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    await logSecurityIncident({
      incidentType: 'api_error',
      severity: 'warning',
      details: { endpoint: '/api/news', error: error.message },
      request,
    });
    
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## 🚨 Critical Recommendations

### Must Do (Before Production)
```
1. ✅ Fix missing IP addresses (27 entries)
   Timeline: This week
   Effort: 2 hours
   Impact: High
   
2. ✅ Add security incident logging
   Timeline: This week
   Effort: 3 hours
   Impact: High
   
3. ✅ Add application error logging
   Timeline: This week
   Effort: 2 hours
   Impact: High
```

### Should Do (Next Month)
```
1. 🟡 Add performance metrics
   Timeline: Week 2-3
   Effort: 4 hours
   Impact: Medium
   
2. 🟡 Add file operation logging
   Timeline: Week 2-3
   Effort: 3 hours
   Impact: Medium
```

### Nice to Have (Optional)
```
1. 🟢 Add analytics tracking
   Timeline: Month 2
   Effort: 6 hours
   Impact: Low-Medium
   Recommendation: Use Google Analytics instead
   
2. 🟢 Create logging dashboard
   Timeline: Month 2
   Effort: 4 hours
   Impact: Low
```

---

## 📋 SQL Schema for New Tables

```sql
-- Table 1: Expand admin_logs (add missing fields)
ALTER TABLE admin_logs 
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS affected_records INTEGER;

-- Table 2: Security incidents (NEW)
CREATE TABLE IF NOT EXISTS security_incidents (
  id SERIAL PRIMARY KEY,
  incident_type VARCHAR(100) NOT NULL,  -- 'input_validation_failed', 'rate_limit', etc.
  severity VARCHAR(20) NOT NULL,        -- 'info', 'warning', 'critical'
  user_id VARCHAR(100),
  details JSONB,                        -- incident metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_security_incidents_timestamp ON security_incidents(created_at);
CREATE INDEX idx_security_incidents_type ON security_incidents(incident_type);

-- Table 3: Performance logs (NEW)
CREATE TABLE IF NOT EXISTS performance_logs (
  id SERIAL PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code SMALLINT,
  response_time_ms INTEGER NOT NULL,
  user_id VARCHAR(100),
  query_count SMALLINT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_performance_logs_endpoint ON performance_logs(endpoint);
CREATE INDEX idx_performance_logs_timestamp ON performance_logs(created_at);

-- Table 4: Application logs (NEW)
CREATE TABLE IF NOT EXISTS application_logs (
  id SERIAL PRIMARY KEY,
  log_level VARCHAR(20),                -- 'ERROR', 'WARN', 'INFO'
  message TEXT NOT NULL,
  stack_trace TEXT,
  endpoint VARCHAR(255),
  user_id VARCHAR(100),
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_application_logs_level ON application_logs(log_level);
CREATE INDEX idx_application_logs_timestamp ON application_logs(created_at);

-- Cleanup policies
SELECT pg_tblsizepretty(pg_total_relation_size('security_incidents'));
-- Implement via cron job: DELETE FROM security_incidents WHERE created_at < NOW() - INTERVAL '180 days';
```

---

## 📊 Comparison: Log All vs. Smart Sampling

| Approach | Storage | Cost | Insight | Recommendation |
|----------|---------|------|---------|-----------------|
| **Log Everything** | 30 MB/month | Low | Complete | ✅ **Best** for this size project |
| **Sample 10%** | 3 MB/month | Low | Good enough | Use for performance logs only |
| **External Service** | 0 MB | $0-50/month | Excellent | Use for analytics (Google Analytics) |
| **None** | 0 MB | Free | None | ❌ Risky |

**Recommendation for this project**: Log Everything (30 MB/month is tiny)

---

## 🎯 Success Criteria

After implementing recommendations, logging should enable you to:

```
✓ Answer: "Who accessed/modified this content?"
✓ Answer: "When was the last attack?"
✓ Answer: "What's the slowest API endpoint?"
✓ Answer: "Which features are most popular?"
✓ Answer: "Are there any errors happening?"
✓ Answer: "Who tried to hack the admin panel?"
✓ Prove: "All content changes are audited" (compliance)
✓ Prove: "System is secure" (to stakeholders)
```

---

## 📚 Reference Documents

- 🔒 [AUDIT_LOG_ANALYSIS.md](./AUDIT_LOG_ANALYSIS.md) - Current log analysis
- 📋 [DEPLOYMENT_SECURITY.md](./DEPLOYMENT_SECURITY.md) - Security checklist
- 🛡️ Security Audit Results - All protections in place

---

**Recommendation**: Start with Phase 1 (fix missing IPs + add error logging) this week.
This addresses 80% of gaps with 4-6 hours of work.
