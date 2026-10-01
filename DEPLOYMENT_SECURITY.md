# Security Deployment Checklist

## 📋 ก่อนทำการ Deploy ไปที่ Production

### 1. Environment Variables ✅
```bash
# ✅ ต้องตั้งค่าทั้งหมด ไม่ใช่ default value
ADMIN_USERNAME=<ชื่อผู้ใช้ขั้นต่ำ 3 ตัวอักษร>
ADMIN_PASSWORD=<รหัสผ่านขั้นต่ำ 8 ตัวอักษร>
ADMIN_SESSION_TOKEN=<random token ขั้นต่ำ 20 ตัวอักษร>
DATABASE_URL=postgresql://user:password@host:5432/dbname
NODE_ENV=production
```

### 2. Database Security
- [ ] Backup database ก่อน deploy
- [ ] สร้าง admin_logs table (สำหรับ audit logging)
- [ ] ตั้ง database password ที่ strong
- [ ] ไม่ใช้ default database port (5432)
- [ ] ปิด public access ถ้า database อยู่บนโฮสต์แยก

```bash
# ตรวจสอบ database tables
psql $DATABASE_URL -c "\dt"
```

### 3. HTTPS & TLS
- [ ] ติดตั้ง SSL certificate (ใช้ Let's Encrypt)
- [ ] ตั้ง reverse proxy (Nginx/Cloudflare) เพื่อ HTTPS
- [ ] ตั้งให้เปลี่ยนเส้นทาง HTTP → HTTPS
- [ ] ตั้ง `x-forwarded-proto: https` header ที่ reverse proxy

**Nginx Config Example:**
```nginx
server {
  listen 443 ssl;
  server_name yourdomain.com;
  
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
  
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  
  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header x-forwarded-proto https;
    proxy_set_header x-forwarded-for $remote_addr;
    proxy_set_header host $host;
  }
}
```

### 4. Node.js & Next.js
- [ ] ตรวจสอบ Node.js version >= 20.9.0
- [ ] รัน `npm ci` ไม่ใช่ `npm install` (production)
- [ ] รัน `npm run build` ก่อน
- [ ] ทำให้ Next.js รันเป็น non-root user
- [ ] ตั้ง process manager (PM2/systemd/Docker)

```bash
# ตรวจสอบ dependencies
npm audit --audit-level=moderate

# Build & Start
npm run build
npm start
```

### 5. Security Headers
- [x] X-Frame-Options: DENY (ป้องกัน clickjacking)
- [x] X-Content-Type-Options: nosniff (ป้องกัน MIME sniffing)
- [x] Strict-Transport-Security: max-age=63072000 (HSTS - 2 ปี)
- [x] Content-Security-Policy (ป้องกัน XSS/injection)
- [x] Referrer-Policy: strict-origin-when-cross-origin

**ตรวจสอบ:**
```bash
curl -I https://yourdomain.com | grep -E "X-Frame|X-Content|Strict-Transport|Content-Security"
```

### 6. Rate Limiting & DOS Protection
- [ ] ตั้ง rate limiting ที่ reverse proxy level (Nginx/Cloudflare)
- [ ] ใช้ Cloudflare/DDoS mitigation service
- [ ] ตั้งจำกัดขนาด upload (already done: 10-200 MB)

**Nginx rate limiting:**
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
location /api/ {
  limit_req zone=api burst=20;
}
```

### 7. Audit Logging & Monitoring
- [ ] เปิด Audit Logs dashboard (/admin/content?tab=logs)
- [ ] ตั้ง log rotation (systemd journal หรือ logrotate)
- [ ] ตั้ง cleanup job สำหรับ old logs

```bash
# Setup cleanup job (Linux crontab)
0 2 * * 0 cd /path/to/project && node scripts/cleanup-audit-logs.mjs

# หรือใช้ systemd timer
# ไฟล์: /etc/systemd/system/cleanup-audit-logs.timer
# ไฟล์: /etc/systemd/system/cleanup-audit-logs.service
```

### 8. Sub-Admin Management
- [ ] ติดตั้ง sub-admin accounts สำหรับทีมงาน
- [ ] แต่ละ sub-admin มีสิทธิ์เฉพาะหมวด
- [ ] ตั้ง password เก่า (ไม่ใช้ default)
- [ ] ทดสอบว่า sub-admin ไม่สามารถยกระดับเป็น super_admin ได้

### 9. File Upload Security
- [ ] ตรวจสอบ magic bytes validation ทำงาน
- [ ] ตั้ง disk space monitoring
- [ ] สำรองไฟล์ upload เป็นระยะ
- [ ] ตั้ง file deletion policy (เช่น 1 ปี)

```bash
# ตรวจสอบ folder permissions
ls -la public/uploads/
# ควร: drwxr-xr-x (755)
chmod -R 755 public/uploads/
```

### 10. Secrets Management
- [ ] ไม่ commit `.env` ไปยัง Git
- [ ] ใช้ secrets management service (AWS Secrets, HashiCorp Vault)
- [ ] หรือตั้ง environment variables จากระบบ deploy
- [ ] ไม่เคยพิมพ์ secrets ไปยัง logs

### 11. Backup & Recovery
- [ ] ตั้ง database backup (daily)
- [ ] สำรอง public/uploads ไฟล์
- [ ] ทดสอบ restore process
- [ ] เก็บ backup ในสถานที่แยก (off-site)

```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-YYYYMMDD.sql
```

### 12. Monitoring & Alerting
- [ ] ตั้ง error monitoring (Sentry, LogRocket)
- [ ] ตั้ง uptime monitoring (Pingdom, UptimeRobot)
- [ ] ตั้ง alert สำหรับ failed login attempts
- [ ] ตั้ง alert สำหรับ database errors
- [ ] ตั้ง alert สำหรับ disk space

### 13. Testing
- [ ] ทดสอบ login flow
- [ ] ทดสอบ rate limiting (5 failed attempts)
- [ ] ทดสอบ session revocation (change password)
- [ ] ทดสอบ permission enforcement (sub-admin)
- [ ] ทดสอบ file upload (magic bytes, size limit)
- [ ] ทดสอบ CSRF protection
- [ ] ทดสอบ security headers

```bash
# Test rate limiting
for i in {1..6}; do
  curl -X POST https://yourdomain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}' -v
done
# ควรได้ 429 Too Many Requests ในครั้งที่ 6
```

---

## 🚨 Security Incident Response

### ถ้าพบการ breach หรือ suspicious activity

1. **Immediate Actions**
   - [ ] เปิดใช้งาน WAF (Web Application Firewall)
   - [ ] ดูประวัติ audit logs: `/admin/content?tab=logs`
   - [ ] ตรวจสอบ IP address ที่ suspected
   - [ ] บล็อก IP address ถ้า suspicious

2. **Investigation**
   - [ ] ทำการ dump audit logs
   - [ ] ตรวจสอบ database access logs
   - [ ] ตรวจสอบ server access logs
   - [ ] ตรวจสอบ network traffic

3. **Response**
   - [ ] เปลี่ยน passwords ของ admin/sub-admin
   - [ ] เปลี่ยน ADMIN_SESSION_TOKEN
   - [ ] logout ทั้งหมด active sessions
   - [ ] ทำการ backup before cleanup

4. **Post-Incident**
   - [ ] ทำการ cleanup malicious files
   - [ ] อัปเดต security patches
   - [ ] ทำการ code review
   - [ ] ขึ้นระดับ monitoring

---

## 📞 Security Contacts

- **Security Team Lead:** ติดต่อ administrator
- **Incident Report:** security@yourdomain.com
- **Vulnerability Disclosure:** ดู SECURITY.md

---

## ✅ Post-Deployment Validation

หลังจาก deploy ตรวจสอบดังนี้:

```bash
# 1. ตรวจสอบ security headers
curl -I https://yourdomain.com | grep -i "x-frame\|x-content\|strict-transport"

# 2. ตรวจสอบ SSL/TLS
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | grep "SSL"

# 3. ทดสอบ login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"test"}'

# 4. ตรวจสอบ database connection
node -e "require('dotenv').config(); const {Pool} = require('pg'); const p = new Pool({connectionString: process.env.DATABASE_URL}); p.query('SELECT NOW()', (err, res) => { console.log(err || res.rows); process.exit(); });"

# 5. ตรวจสอบ environment variables
echo "DATABASE_URL=${DATABASE_URL:0:20}***"
echo "NODE_ENV=$NODE_ENV"
```

---

**Last Updated:** 2026-10-01  
**Version:** 1.0
