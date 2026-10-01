-- ===== Security Incidents Table =====
-- สำหรับเก็บเหตุการณ์ด้านความปลอดภัย เช่น failed login, rate limit, input validation failures
CREATE TABLE IF NOT EXISTS security_incidents (
  id SERIAL PRIMARY KEY,
  incident_type VARCHAR(100) NOT NULL,     -- 'login_failed', 'rate_limit_exceeded', 'input_validation_failed', 'csrf_attack_detected', 'unauthorized_access'
  severity VARCHAR(20) NOT NULL,           -- 'info', 'warning', 'critical'
  user_id VARCHAR(100),                    -- username หรือ identifier (null ถ้า anonymous)
  details JSONB,                           -- incident-specific data
  extra JSONB,                             -- flexible extra information
  ip_address VARCHAR(45),                  -- IPv4 หรือ IPv6
  user_agent TEXT,                         -- Browser/client info
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes สำหรับ query performance
CREATE INDEX IF NOT EXISTS idx_security_incidents_created_at ON security_incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_security_incidents_incident_type ON security_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_user_id ON security_incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_security_incidents_ip_address ON security_incidents(ip_address);

-- ===== Application Logs Table =====
-- สำหรับเก็บ errors/exceptions/warnings สำหรับ debugging
CREATE TABLE IF NOT EXISTS application_logs (
  id SERIAL PRIMARY KEY,
  log_level VARCHAR(20) NOT NULL,          -- 'ERROR', 'WARN', 'INFO'
  message TEXT NOT NULL,                   -- Error message (max 2000 chars)
  stack_trace TEXT,                        -- Stack trace (max 5000 chars, optional)
  endpoint VARCHAR(255),                   -- API endpoint ที่เกิด error
  user_id VARCHAR(100),                    -- username ถ้ามี
  context JSONB,                           -- Additional context data
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes สำหรับ query performance
CREATE INDEX IF NOT EXISTS idx_application_logs_created_at ON application_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_application_logs_log_level ON application_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_application_logs_endpoint ON application_logs(endpoint);

-- ===== Performance Logs Table (optional, สำหรับ Phase 2) =====
-- สำหรับเก็บ API response times (sampled)
CREATE TABLE IF NOT EXISTS performance_logs (
  id SERIAL PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,             -- 'GET', 'POST', 'PUT', 'DELETE'
  status_code SMALLINT,
  response_time_ms INTEGER NOT NULL,       -- milliseconds
  user_id VARCHAR(100),
  query_count SMALLINT,                    -- number of DB queries (optional)
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_performance_logs_created_at ON performance_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_logs_endpoint ON performance_logs(endpoint);

-- ===== Cleanup Policies =====
-- อันนี้จะรัน via cron job (ตั้งใน scripts/cleanup-logs.mjs)
-- DELETE FROM security_incidents WHERE created_at < NOW() - INTERVAL '180 days';
-- DELETE FROM application_logs WHERE created_at < NOW() - INTERVAL '30 days';
-- DELETE FROM performance_logs WHERE created_at < NOW() - INTERVAL '14 days';
