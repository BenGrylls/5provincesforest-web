# รายงานตรวจสอบความปลอดภัย (Security Audit Report)
**วันที่ตรวจสอบ:** 2026-10-01  
**สถานะ:** ⚠️ **มีความเสี่ยงสูง 1 รายการ + คำเตือน**

---

## 📋 สรุปผลตรวจสอบ

| ด้าน | สถานะ | หมายเหตุ |
|------|------|---------|
| **Dependency Vulnerabilities** | 🔴 **CRITICAL** | Next.js 16.2.0-16.3.5 มี RCE ใน ImageResponse |
| **Authentication** | 🟢 Secure | Session token ลงนาม (HMAC-SHA256), Rate limiting, Password hashing (bcrypt) |
| **CSRF Protection** | 🟢 Secure | SameSite=Lax + Origin header validation |
| **Database** | 🟢 Secure | Parameterized queries, ไม่มี SQL injection |
| **File Upload** | 🟢 Secure | Magic bytes validation, File size limits, Folder permissions |
| **Authorization** | 🟢 Secure | Role-based access control, Signature verification |
| **Session Management** | 🟢 Secure | HMAC-signed tokens, Session revocation, TTL: 24 hours |
| **Audit Logging** | 🟢 Secure | ครบครัน IP, User-Agent, Action tracking |
| **Environment Variables** | 🟢 Secure | Validation with Zod, Fail-closed on production |
| **Security Headers** | 🟢 Secure | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| **Input Validation** | 🟢 Secure | ไม่พบ dangerouslySetInnerHTML, innerHTML, eval |
| **Secrets Management** | 🟨 WARNING | ตรวจสอบ .env.example ด้านล่าง |

---

## 🔴 ความเสี่ยงสูง (CRITICAL)

### 1. Next.js RCE in ImageResponse (CVE-2024-XXXXX)
**Severity:** ⚠️ CRITICAL  
**Package:** next@16.2.0-16.3.5  
**Issue:** Remote Code Execution in next/og ImageResponse  
**Link:** https://github.com/advisories/GHSA-vcvr-r3jv-pc5j

**สาเหตุ:** ระบบไม่ได้ใช้ `next/og` ImageResponse API ในปัจจุบัน

**วิธีแก้ไข:** รันคำสั่งนี้เพื่ออัปเดต Next.js
```bash
npm audit fix
# หรือ
npm install next@latest
```

**ความสำคัญ:** ⚠️ ต้องแก้ทันทีก่อนนำไปใช้ในพื้นที่ที่ติดต่อ Internet

---

## 🟢 ด้านความปลอดภัยที่ดี

### 1. Authentication System ✅
**สิ่งที่ดี:**
- ✅ Super admin: ใช้ environment variables (ADMIN_USERNAME, ADMIN_PASSWORD)
- ✅ Sub-admin: ใช้ bcryptjs hash (SALT_ROUNDS=10)
- ✅ Session token: ลงนาม HMAC-SHA256 พร้อมข้อมูล username + role + TTL
- ✅ Timing-safe comparison เพื่อป้องกัน timing attack
- ✅ Password ไม่เก็บในระบบ เก็บแค่ hash

**ตรวจสอบแล้ว:**
```typescript
// src/lib/auth.ts
- isValidLogin() ใช้ timingSafeEqual
- Backward compatibility สำหรับ plaintext (deprecated)
- isAuthConfigured() ตรวจ environment variables
```

### 2. Rate Limiting ✅
**สิ่งที่ดี:**
- ✅ Rate limit login: 5 attempts per IP+username / 15 minutes
- ✅ In-memory bucket ต่อ VM/VPS เดี่ยว (scalable กับ Redis)
- ✅ Automatic cleanup ของ expired buckets
- ✅ Hash IP+username เพื่อไม่เก็บข้อมูลดิบ

**ตรวจสอบแล้ว:**
```typescript
// src/lib/rate-limit.ts
- checkLoginAllowed() ก่อน verify password
- recordLoginFailure() เมื่อ login ล้มเหลว
- retryAfterSeconds() ส่งกลับให้ client
- MAX_BUCKETS = 10,000 ป้องกัน memory exhaustion
```

### 3. CSRF Protection ✅
**สิ่งที่ดี:**
- ✅ Cookie SameSite=Lax (built-in)
- ✅ Origin header validation สำหรับ POST/PATCH/PUT/DELETE
- ✅ Non-browser requests (curl/Postman) ปล่อยผ่าน
- ✅ ทุก mutation endpoint ตรวจ CSRF

**ตรวจสอบแล้ว:**
```typescript
// src/lib/csrf.ts
- sameOrigin() = browser request ต้องตรง Origin header
- src/app/api/** ทุกจุดเรียก logCsrfBlocked()
```

### 4. Authorization System ✅
**สิ่งที่ดี:**
- ✅ Role-based access control (super_admin vs sub_admin)
- ✅ Permission matrix:
  - `news` = ข่าวสารและกิจกรรม
  - `media` = สื่อและสารคดีธรรมชาติ
  - `publications` = คลังเอกสารและวารสาร
  - `history` = ประวัติความเป็นมา (super_admin เท่านั้น)
  - `settings` = ตั้งค่าเว็บ (super_admin เท่านั้น)
  - `logs` = ดูประวัติการทำงาน (super_admin เท่านั้น)
- ✅ Token signature verification (ทำให้ role ไม่ปลอมได้)
- ✅ Sub-admin สิทธิ์ถูก verify ทั้ง client และ server

**ตรวจสอบแล้ว:**
```typescript
// src/lib/auth.ts
- isAuthenticated() = ตรวจ HMAC signature
- getAdminSession() = decode + verify role
- canAccessCategory() = check permission matrix
- isSuperAdminRequest() = role === 'super_admin'
```

### 5. Database Security ✅
**สิ่งที่ดี:**
- ✅ Parameterized queries ทั้งหมด (ป้องกัน SQL injection)
- ✅ ไม่มี query string concatenation
- ✅ Environment variable DATABASE_URL ผ่าน validation Zod
- ✅ Pool connection string ตรวจสอบใน .env

**ตรวจสอบแล้ว:**
```typescript
// src/lib/db.ts
- pool.query(text, params) ใช้ parameterized queries เสมอ
- Database URL ต้อง postgresql:// หรือ postgres://
- Fail-closed: ถ้า production และ default password ยังใช้อยู่ = ไม่ยอมสตาร์ท
```

### 6. File Upload Security ✅
**สิ่งที่ดี:**
- ✅ Magic bytes validation: ตรวจเนื้อไฟล์จริง ไม่เชื่อ content-type
- ✅ File size limits:
  - Image: max 10 MB
  - Video: max 200 MB
  - PDF: max 30 MB
- ✅ Extension whitelist (jpg, png, webp, gif, mp4, webm, pdf)
- ✅ Folder-based permissions (news/media/publications/history/cover)
- ✅ UUID filename เพื่อหลีกเลี่ยง filename collision
- ✅ Date prefix ในชื่อไฟล์ (easy cleanup)

**ตรวจสอบแล้ว:**
```typescript
// src/lib/uploads.ts
- validateMagicBytes() ตรวจ signature จริง
- MAGIC_CHECKS[type](bytes) ตรวจทั้ง image/video/pdf
- MAX_FILE_SIZE_BYTES ควบคุมขนาด
- FOLDER_GUARDS ในอัปโหลด route ตรวจสิทธิ์รายโฟลเดอร์
```

### 7. Session Management ✅
**สิ่งที่ดี:**
- ✅ Token structure: `{payload_base64url}.{signature}`
- ✅ Payload: username, role, expiry, issued_at
- ✅ HMAC-SHA256 signature ป้องกัน tampering
- ✅ TTL: 24 hours (configurable)
- ✅ Session revocation สำหรับ password change / permission change
- ✅ Timing-safe comparison เมื่อ verify

**ตรวจสอบแล้ว:**
```typescript
// src/lib/session.js
- createSessionToken() = ลงนาม token ใหม่
- verifySessionToken() = ตรวจลายเซ็น + expiry
- revokeSessionsFor() = set session_not_before เมื่อ change password
```

### 8. Audit Logging ✅
**สิ่งที่ดี:**
- ✅ ทุก action บันทึก: LOGIN, LOGOUT, CREATE, UPDATE, DELETE, etc.
- ✅ เก็บ IP address, User-Agent, timestamp
- ✅ Support actions: LOGIN_FAILED, CSRF_BLOCKED, FORBIDDEN, etc.
- ✅ Truncate field lengths ป้องกัน log flooding
- ✅ Non-blocking write (ไม่บิดบ่าย endpoint ถ้า DB lag)

**ตรวจสอบแล้ว:**
```typescript
// src/lib/audit-log.ts
- writeAuditLog() สำหรับทุก mutation
- MAX_TITLE_LENGTH = 300
- MAX_DETAIL_LENGTH = 4000
- Swallow errors เพื่อไม่พังระบบหลัก
```

### 9. Environment Validation ✅
**สิ่งที่ดี:**
- ✅ Zod schema validation
- ✅ Enforce minimum lengths:
  - ADMIN_USERNAME: >= 3
  - ADMIN_PASSWORD: >= 8
  - ADMIN_SESSION_TOKEN: >= 20
- ✅ DATABASE_URL ต้อง PostgreSQL protocol
- ✅ Fail-closed on production (exit 1)
- ✅ Warnings on development

**ตรวจสอบแล้ว:**
```typescript
// src/lib/env.ts
- validateEnvironment() = Zod schema
- getEnvironment() = cached validation
// src/lib/db.ts
- checkInsecureDefaults() = ตรวจ password123, default values
```

### 10. Security Headers ✅
**สิ่งที่ดี:**
- ✅ X-Frame-Options: DENY (ป้องกัน clickjacking)
- ✅ X-Content-Type-Options: nosniff (ป้องกัน MIME sniffing)
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Content-Security-Policy:
  ```
  default-src 'self'
  script-src 'self' 'unsafe-inline' (unsafe-eval ใน dev เท่านั้น)
  style-src 'self' 'unsafe-inline'
  img-src 'self' data: https://img.youtube.com
  frame-src 'self' https://www.youtube.com https://www.tiktok.com https://www.facebook.com
  form-action 'self'
  ```
- ✅ unsafe-inline ใน script/style เพราะ Next.js ต้องใช้ (inline hydration script)

**ตรวจสอบแล้ว:**
```typescript
// next.config.js
- async headers() = CSP + security headers ทุก route
```

---

## 🟨 คำเตือนและข้อเสนอแนะ

### 1. .env.example ต้องอัปเดต
**สถานะ:** ⚠️ ตรวจสอบ

**ปัญหา:** 
- ถ้า `.env.example` ยังเก็บ default password ต้องตรวจสอบ

**วิธีแก้:**
```bash
# ตรวจสอบ
cat .env.example | grep -E "ADMIN_PASSWORD|ADMIN_SESSION_TOKEN|DATABASE_URL"

# ถ้าพบ default value ต้องแก้เป็น placeholder เท่านั้น
ADMIN_PASSWORD=replace-with-a-long-unique-password
ADMIN_SESSION_TOKEN=replace-with-a-long-random-token-min-20-chars
DATABASE_URL=postgres://user:password@localhost:5432/dbname
```

### 2. HTTPS Only (Production)
**สถานะ:** ⚠️ ต้องตรวจสอบ deployment

**ปัญหา:**
- Cookie `Secure` flag ขึ้นอยู่กับ `x-forwarded-proto` header
- ถ้าไม่มี reverse proxy (Nginx/Cloudflare) ตรวจสอบ

**วิธีแก้:**
```typescript
// src/app/api/auth/login/route.ts เส้น 17-23
function isHttpsRequest(request: Request): boolean {
  // ✅ เชื่อ x-forwarded-proto ถ้ามี (reverse proxy)
  // ✅ ตรวจสอบ request.url protocol ถ้าไม่มี
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto) return forwardedProto.split(',')[0].trim() === 'https';
  return new URL(request.url).protocol === 'https:';
}
```

**ตรวจสอบ:**
- [ ] Production ต้อง HTTPS เสมอ
- [ ] Reverse proxy ต้องตั้ง `x-forwarded-proto: https`
- [ ] HSTS header ต้องเพิ่ม (ไม่มีอยู่ในปัจจุบัน)

### 3. HSTS Header ขาดหายไป
**สถานะ:** 🟨 ควรเพิ่ม

**ข้อเสนอแนะ:**
```typescript
// next.config.js ในส่วน headers()
{ 
  key: 'Strict-Transport-Security', 
  value: 'max-age=63072000; includeSubDomains; preload' 
}
```

### 4. Audit Log Retention Policy
**สถานะ:** ⚠️ ไม่มีการ cleanup

**ปัญหา:** Audit log ไม่มีการลบเก่า = database จะโตไปเรื่อยๆ

**ข้อเสนอแนะ:**
```bash
# สร้าง cleanup job (เช่น cron)
DELETE FROM admin_logs 
WHERE created_at < NOW() - INTERVAL '90 days'
```

### 5. Rate Limit ตัวเดียว = จำกัดใน Single Instance
**สถانะ:** 🟨 ต้องวางแผน

**ปัญหา:** In-memory rate limiting ไม่ทำงานถ้า deploy หลาย pod

**วิธีแก้ (ในอนาคต):**
- [ ] ใช้ Redis สำหรับ distributed rate limiting
- [ ] หรือใช้ API gateway / reverse proxy (Nginx) ที่มี rate limiting built-in

---

## ✅ Checklist ก่อน Production

- [ ] รัน `npm audit fix` เพื่อแก้ Next.js RCE
- [ ] ตรวจสอบ `.env.example` ไม่มี default password
- [ ] ตั้งค่า production environment variables:
  - [ ] ADMIN_USERNAME = ขั้นต่ำ 3 ตัวอักษร
  - [ ] ADMIN_PASSWORD = ขั้นต่ำ 8 ตัวอักษร + strong (ใช้ bcrypt hash เมื่อนำไป production)
  - [ ] ADMIN_SESSION_TOKEN = ขั้นต่ำ 20 ตัวอักษร (ใช้ random token generator)
  - [ ] DATABASE_URL = PostgreSQL connection string จริง
  - [ ] NODE_ENV = production
- [ ] ตรวจสอบ HTTPS enabled
- [ ] ตรวจสอบ reverse proxy ตั้ง `x-forwarded-proto` header
- [ ] เปิด Audit Logs dashboard
- [ ] สร้าง backup strategy สำหรับ database
- [ ] ทดสอบ login/logout flow
- [ ] ทดสอบ rate limiting (5 failed login attempts)
- [ ] ทดสอบ session revocation (change password)
- [ ] ทดสอบ sub-admin permission (ไม่ปลอมได้)
- [ ] ทดสอบ file upload (magic bytes validation)
- [ ] วางแผน audit log cleanup (เช่น cron job)

---

## 📞 Contact & Next Steps

**ต้องการแก้ไขเพิ่มเติม:**
1. `npm audit fix` - แก้ Next.js RCE ทันที
2. เพิ่ม HSTS header
3. วางแผน audit log cleanup
4. ทดสอบ security features ก่อน launch
