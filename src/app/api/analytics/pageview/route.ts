import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const PUBLIC_ROUTES = new Set([
  '/',
  '/news',
  '/media',
  '/publications',
  '/about/history',
  '/about/objectives',
  '/committee',
  '/committee/president',
  '/committee/president/bio',
  '/contact',
  '/privacy-policy',
  '/security-policy',
  '/sitemap',
]);

type NormalizedRoute =
  | { route: string; kind: 'article'; category: string; id: number }
  | { route: string; kind: 'committee'; id: number }
  | { route: string; kind: 'static' };

function normalizeRoute(path: unknown): NormalizedRoute | null {
  if (typeof path !== 'string' || !path.startsWith('/') || path.length > 500) return null;
  if (PUBLIC_ROUTES.has(path)) return { route: path, kind: 'static' };

  const articlePath = /^\/(news|media|publications)\/([1-9]\d{0,9})$/.exec(path);
  if (articlePath) {
    const id = Number(articlePath[2]);
    return Number.isSafeInteger(id) ? { route: path, kind: 'article', category: articlePath[1], id } : null;
  }
  const committeePath = /^\/committee\/sub-committee\/([1-9]\d{0,9})$/.exec(path);
  if (committeePath) {
    const id = Number(committeePath[1]);
    return Number.isSafeInteger(id) ? { route: path, kind: 'committee', id } : null;
  }

  return null;
}

export async function POST(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 });
  }
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return NextResponse.json({ error: 'Cross-site requests are not accepted' }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const page = payload && typeof payload === 'object' && 'path' in payload
    ? normalizeRoute(payload.path)
    : null;
  if (!page) return NextResponse.json({ error: 'Unsupported public page' }, { status: 400 });

  try {
    let pageTitle: string | null = null;
    if (page.kind === 'article') {
      const article = await query(
        'SELECT title FROM articles WHERE id = $1 AND category = $2',
        [page.id, page.category],
      );
      pageTitle = article.rows[0]?.title || null;
      if (!pageTitle) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    } else if (page.kind === 'committee') {
      const department = await query('SELECT title FROM committee_units WHERE id = $1', [page.id]);
      pageTitle = department.rows[0]?.title || null;
      if (!pageTitle) return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    await query(
      `INSERT INTO public_page_views (view_date, route, page_title, view_count)
       VALUES (CURRENT_DATE, $1, $2, 1)
       ON CONFLICT (view_date, route)
       DO UPDATE SET
         page_title = COALESCE(EXCLUDED.page_title, public_page_views.page_title),
         view_count = public_page_views.view_count + 1`,
      [page.route, pageTitle],
    );
    return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Unable to record page view' }, { status: 503 });
  }
}