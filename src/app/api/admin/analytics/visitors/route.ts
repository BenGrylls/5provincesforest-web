import { NextResponse } from 'next/server';
import { getAdminSession, isAuthenticated } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getAdminSession(request);
  if (session?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super admins can view visitor statistics' }, { status: 403 });
  }

  const requestedDays = new URL(request.url).searchParams.get('days');
  const days = requestedDays === '7' ? 7 : 30;

  try {
    const [dailyResult, routeResult] = await Promise.all([
      query(
        `SELECT view_date::text AS date, SUM(view_count)::bigint AS views
         FROM public_page_views
         WHERE view_date >= CURRENT_DATE - ($1::int - 1)
         GROUP BY view_date
         ORDER BY view_date ASC`,
        [days],
      ),
      query(
        `SELECT route, MAX(page_title) AS title, SUM(view_count)::bigint AS views
         FROM public_page_views
         WHERE view_date >= CURRENT_DATE - ($1::int - 1)
         GROUP BY route
         ORDER BY SUM(view_count) DESC, route ASC`,
        [days],
      ),
    ]);

    const daily = dailyResult.rows.map((row) => ({ date: row.date, views: Number(row.views) }));
    const routes = routeResult.rows.map((row) => ({
      route: row.route as string,
      title: row.title as string | null,
      views: Number(row.views),
    }));

    return NextResponse.json({
      days,
      totalViews: daily.reduce((total, row) => total + row.views, 0),
      daily,
      routes,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Failed to load visitor statistics' }, { status: 500 });
  }
}