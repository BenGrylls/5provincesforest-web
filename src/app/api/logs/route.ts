import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminSession, isAuthenticated, isSuperAdminRequest } from '@/lib/auth';
import { logForbidden } from '@/lib/audit-log';

interface AuditLog {
  id: number;
  username: string;
  action: string;
  category: string;
  result: string;
  ip_address: string;
  created_at: string;
  details?: string;
}

// Legal retention period for audit logs (120 days as per requirement)
const LOG_RETENTION_DAYS = 120;

// Convert JSON to CSV with UTF-8 BOM for Excel compatibility
function convertToCSV(data: AuditLog[]): string {
  if (data.length === 0) return 'No data';

  const headers = ['ID', 'Username', 'Action', 'Category', 'Result', 'IP Address', 'Created At', 'Details'];
  const csvHeaders = headers.map(h => `"${h}"`).join(',');

  const csvRows = data.map((log) => {
    return [
      log.id.toString(),
      `"${(log.username || '').replace(/"/g, '""')}"`,
      `"${(log.action || '').replace(/"/g, '""')}"`,
      `"${(log.category || '').replace(/"/g, '""')}"`,
      `"${(log.result || '').replace(/"/g, '""')}"`,
      `"${(log.ip_address || '').replace(/"/g, '""')}"`,
      `"${new Date(log.created_at).toISOString()}"`,
      `"${(log.details || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  // Add UTF-8 BOM for Excel to recognize Thai characters correctly
  const csvContent = [csvHeaders, ...csvRows].join('\r\n');
  return '\uFEFF' + csvContent;
}

export async function GET(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!await isSuperAdminRequest(request)) {
    const actor = await getAdminSession(request);
    await logForbidden(request, { username: actor?.username || 'unknown', category: 'admin', reason: 'ไม่ใช่ super admin' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const action = url.searchParams.get('action');
    const format = url.searchParams.get('format') as 'csv' | 'json' | null;
    const isExport = url.searchParams.get('export') === 'true';
    const exportAll = url.searchParams.get('exportAll') === 'true';

    let sql = 'SELECT * FROM admin_logs WHERE 1=1';
    const params: any[] = [];

    // When exporting ALL, apply 120-day retention automatically (no manual date filters)
    if (exportAll && isExport) {
      const retentionDate = new Date(Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
      params.push(retentionDate);
      sql += ` AND created_at >= $${params.length}`;
    } else {
      // Manual filters
      if (dateFrom) {
        params.push(new Date(dateFrom));
        sql += ` AND created_at >= $${params.length}`;
      }

      if (dateTo) {
        const nextDay = new Date(dateTo);
        nextDay.setDate(nextDay.getDate() + 1);
        params.push(nextDay);
        sql += ` AND created_at < $${params.length}`;
      }

      if (action) {
        params.push(`%${action}%`);
        sql += ` AND action ILIKE $${params.length}`;
      }
    }

    sql += ' ORDER BY created_at DESC';

    // If exporting, no limit. Otherwise limit to 50 for UI display
    if (!isExport) {
      sql += ' LIMIT 50';
    }

    const result = await query(sql, params);
    const logs = result.rows as AuditLog[];

    // Export as CSV
    if (isExport && format === 'csv') {
      try {
        const csv = convertToCSV(logs);
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = exportAll 
          ? `audit-logs-full-${LOG_RETENTION_DAYS}days-${timestamp}.csv`
          : `audit-logs-${timestamp}.csv`;
        
        return new NextResponse(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
          },
        });
      } catch (csvError) {
        return NextResponse.json({ error: 'Failed to generate CSV', details: csvError instanceof Error ? csvError.message : 'Unknown error' }, { status: 500 });
      }
    }

    // Export as JSON
    if (isExport && format === 'json') {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = exportAll
        ? `audit-logs-full-${LOG_RETENTION_DAYS}days-${timestamp}.json`
        : `audit-logs-${timestamp}.json`;

      return new NextResponse(JSON.stringify(logs, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        },
      });
    }

    // Return as JSON for UI display
    return NextResponse.json(logs);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch logs', details: errorMsg }, { status: 500 });
  }
}