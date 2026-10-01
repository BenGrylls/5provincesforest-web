import { query } from './db';

export type SecurityIncidentSeverity = 'info' | 'warning' | 'critical';

export interface SecurityIncidentInput {
  /** ประเภทเหตุการณ์ */
  incidentType: string;
  /** ระดับความรุนแรง */
  severity: SecurityIncidentSeverity;
  /** ชื่อผู้ใช้ (ถ้ามี) */
  userId?: string | null;
  /** รายละเอียดเหตุการณ์ */
  details: Record<string, unknown>;
  /** Request object สำหรับดึง IP และ user-agent */
  request: Request;
  /** ข้อมูลเพิ่มเติมที่จะจัดเก็บ */
  extra?: Record<string, unknown>;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * บันทึก security incident ให้ investigation/forensics
 * ใช้สำหรับบันทึกการโจมตี/ความพยายาม/หรือการละเมิด
 * 
 * ตัวอย่าง:
 * - Failed login attempts (after several failures)
 * - Rate limit exceeded
 * - CSRF attack detected
 * - Input validation failure (SQL injection, XSS attempt)
 * - Unauthorized access attempt
 */
export async function logSecurityIncident({
  incidentType,
  severity,
  userId,
  details,
  request,
  extra,
}: SecurityIncidentInput): Promise<void> {
  try {
    const detailsJson = details ? JSON.stringify(details) : null;
    const extraJson = extra ? JSON.stringify(extra) : null;

    await query(
      `INSERT INTO security_incidents
        (incident_type, severity, user_id, details, extra, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        incidentType,
        severity,
        userId || null,
        detailsJson,
        extraJson,
        clientIp(request),
        request.headers.get('user-agent') || 'unknown',
      ],
    );
  } catch (err) {
    // ไม่ throw เพื่อไม่ให้ security logging พา response ไป
    // แค่ swallow error เงียบๆ (อาจ log ไปที่ console.error ถ้า dev)
    if (process.env.NODE_ENV === 'development') {
      console.error('[security-logger] Failed to log incident:', err);
    }
  }
}

/**
 * Helper: Log failed login attempt
 */
export async function logFailedLoginAttempt(
  request: Request,
  username: string,
  reason: 'invalid_credentials' | 'account_locked' | 'rate_limited',
): Promise<void> {
  await logSecurityIncident({
    request,
    incidentType: 'login_failed',
    severity: 'warning',
    userId: username,
    details: {
      reason,
      username,
    },
  });
}

/**
 * Helper: Log rate limit exceeded
 */
export async function logRateLimitExceeded(
  request: Request,
  endpoint: string,
  limitType: 'mutation' | 'upload' | 'passwordChange' | 'passwordReset' | 'login',
): Promise<void> {
  await logSecurityIncident({
    request,
    incidentType: 'rate_limit_exceeded',
    severity: 'info',
    details: {
      endpoint,
      limitType,
    },
  });
}

/**
 * Helper: Log input validation failure (potential attack)
 */
export async function logInputValidationFailure(
  request: Request,
  endpoint: string,
  validationType: 'sql_injection' | 'xss' | 'invalid_type' | 'size_exceeded' | 'malformed_json',
  details: Record<string, unknown>,
): Promise<void> {
  await logSecurityIncident({
    request,
    incidentType: 'input_validation_failed',
    severity: validationType === 'sql_injection' || validationType === 'xss' ? 'critical' : 'warning',
    details: {
      endpoint,
      validationType,
      ...details,
    },
  });
}

/**
 * Helper: Log CSRF attack attempt
 */
export async function logCsrfAttackAttempt(
  request: Request,
  endpoint: string,
): Promise<void> {
  await logSecurityIncident({
    request,
    incidentType: 'csrf_attack_detected',
    severity: 'warning',
    details: {
      endpoint,
    },
  });
}

/**
 * Helper: Log unauthorized access attempt
 */
export async function logUnauthorizedAccess(
  request: Request,
  username: string | null,
  resource: string,
  reason: string,
): Promise<void> {
  await logSecurityIncident({
    request,
    incidentType: 'unauthorized_access',
    severity: 'warning',
    userId: username || 'unknown',
    details: {
      resource,
      reason,
      username: username || 'anonymous',
    },
  });
}
