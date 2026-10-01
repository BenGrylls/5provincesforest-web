import { NextResponse } from 'next/server';
import { isAuthenticated, getAdminSession } from '@/lib/auth';
import { compareEndpoints } from '@/lib/trend-analysis';

/**
 * GET /api/admin/performance
 * Returns performance metrics for all endpoints
 */
export async function GET(request: Request) {
  // Verify admin access
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getAdminSession(request);
  if (session?.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Only super admins can view performance metrics' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Convert range to days
    let days = 7;
    switch (range) {
      case '24h':
        days = 1;
        break;
      case '7d':
        days = 7;
        break;
      case '30d':
        days = 30;
        break;
    }

    // Get endpoint comparison data
    const endpoints = await compareEndpoints(days);

    return NextResponse.json({
      success: true,
      range,
      endpoints: endpoints || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Performance API Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}
