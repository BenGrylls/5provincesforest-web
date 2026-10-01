'use client';

import React, { useEffect, useState } from 'react';
import { Download, Loader, RefreshCw, Filter } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { toast } from '@/components/admin/toast';

export interface AuditLog {
  id: number;
  username: string;
  action: string;
  category: string;
  result: string;
  ip_address: string;
  created_at: string;
  details?: string;
}

type ExportFormat = 'csv' | 'json';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  // Load logs on mount
  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (actionFilter) params.append('action', actionFilter);

      const res = await fetch(`/api/logs?${params.toString()}`);
      if (!res.ok) {
        toast.error('ไม่สามารถโหลดประวัติการทำงานได้');
        return;
      }
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: ExportFormat, exportAll: boolean = false) => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      
      if (exportAll) {
        // Export all 120-day retention logs
        params.append('exportAll', 'true');
      } else {
        // Export filtered results
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        if (actionFilter) params.append('action', actionFilter);
      }
      
      params.append('format', format);
      params.append('export', 'true');

      const res = await fetch(`/api/logs?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorMsg = errorData?.error || 'ไม่สามารถดาวน์โหลดประวัติได้';
        toast.error(errorMsg);
        return;
      }

      const blob = await res.blob();
      
      // Verify blob is not empty
      if (blob.size === 0) {
        toast.error('ไม่มีข้อมูลสำหรับดาวน์โหลด');
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      const suffix = exportAll ? '-full-120days' : '';
      link.download = `audit-logs${suffix}-${timestamp}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`ดาวน์โหลดประวัติการทำงาน ${format.toUpperCase()} สำเร็จ`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'ไม่สามารถดาวน์โหลดได้';
      toast.error(errorMsg);
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setActionFilter('');
  };

  const getStatusColor = (result: string) => {
    if (result === 'success') return 'bg-green-100 text-green-800';
    if (result === 'failed') return 'bg-red-100 text-red-800';
    if (result === 'forbidden') return 'bg-yellow-100 text-yellow-800';
    if (result === 'locked') return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <AdminShell title="ประวัติการทำงาน" description="Activity History & Audit Logs">
      <div className="space-y-6">

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-forest-700" />
            <h2 className="font-semibold text-earth-900">ตัวกรอง</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                จากวันที่
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                ถึงวันที่
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                ประเภทกิจกรรม
              </label>
              <input
                type="text"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                placeholder="เช่น LOGIN, CSRF_BLOCKED..."
                className="w-full px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={loadLogs}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              ค้นหา
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-earth-900 rounded-lg text-sm font-semibold"
            >
              ล้างตัวกรอง
            </button>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-earth-900 mb-2">ดาวน์โหลดประวัติ</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleExport('csv', false)}
                disabled={exporting || logs.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition"
              >
                <Download className="w-4 h-4" />
                ดาวน์โหลด CSV ที่ค้นหา ({logs.length})
              </button>
              <button
                onClick={() => handleExport('json', false)}
                disabled={exporting || logs.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition"
              >
                <Download className="w-4 h-4" />
                ดาวน์โหลด JSON ที่ค้นหา ({logs.length})
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <h3 className="text-sm font-semibold text-earth-900 mb-2">
              ✓ ดาวน์โหลดทั้งหมด (120 วัน)
            </h3>
            <p className="text-xs text-gray-500 mb-2">
              ดาวน์โหลดประวัติการทำงานทั้งหมดตามกฏหมาย (retention 120 วัน)
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleExport('csv', true)}
                disabled={exporting}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition"
              >
                <Download className="w-4 h-4" />
                ดาวน์โหลด CSV (ทั้งหมด)
              </button>
              <button
                onClick={() => handleExport('json', true)}
                disabled={exporting}
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition"
              >
                <Download className="w-4 h-4" />
                ดาวน์โหลด JSON (ทั้งหมด)
              </button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader className="w-6 h-6 text-forest-600 animate-spin" />
              <span className="ml-2 text-gray-600">กำลังโหลดประวัติ...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center p-12">
              <p className="text-gray-500">ไม่มีประวัติการทำงาน</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">เวลา</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">ผู้ใช้</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">กิจกรรม</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">หมวดหมู่</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">ผลลัพธ์</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        {log.username}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {log.action}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {log.category}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            log.result
                          )}`}
                        >
                          {log.result}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                        {log.ip_address}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="text-xs text-gray-500 border-t border-gray-200 pt-4">
          <p>
            💡 <strong>คำแนะนำ:</strong> ดาวน์โหลดประวัติการทำงานสำหรับการตรวจสอบ
            หรือในกรณีที่มีการโจมตีเข้ามายังระบบ
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
