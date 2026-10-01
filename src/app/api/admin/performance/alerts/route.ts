import { NextResponse } from 'next/server';
import { isAuthenticated, getAdminSession } from '@/lib/auth';
import { detectAnomalies } from '@/lib/trend-analysis';

/**
 * GET /api/admin/performance/alerts
 * Returns performance anomalies and alerts
 */
export async function GET(request: Request) {
  // Verify admin access
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getAdminSession(request);
  if (session?.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Only super admins can view alerts' },
      { status: 403 }
    );
  }

  try {
    // Get anomalies with custom thresholds
    const alerts = await detectAnomalies({
      slowResponseTime: 2000, // ms
      highErrorRate: 5,       // %
    });

    return NextResponse.json({
      success: true,
      alerts: alerts || [],
      alertCount: alerts.length,
      criticalCount: alerts.filter((a) => a.severity === 'critical').length,
      highCount: alerts.filter((a) => a.severity === 'high').length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Alerts API Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
