'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { toast } from '@/components/admin/toast';

type VisitorStats = {
  days: number;
  totalViews: number;
  daily: { date: string; views: number }[];
  routes: { route: string; title: string | null; views: number }[];
};

export default function VisitorStatsPage() {
  const [days, setDays] = useState<7 | 30>(7);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/admin/analytics/visitors?days=${days}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load visitor statistics');
        return response.json() as Promise<VisitorStats>;
      })
      .then((data) => { if (active) setStats(data); })
      .catch(() => { if (active) toast.error('ไม่สามารถโหลดสถิติผู้เข้าชมได้'); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [days]);

  return (
    <AdminShell title="สถิติผู้เข้าชม" description="ยอดเปิดหน้าเว็บแบบรวม ไม่ระบุตัวผู้เข้าชม">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">เก็บยอดรายวันแยกตามหมวดหน้าเว็บ ไม่เก็บ IP, cookie หรือข้อมูลระบุตัวบุคคลในสถิตินี้</p>
          <div className="inline-flex rounded-md border border-gray-300 bg-white p-1" aria-label="ช่วงเวลา">
            {[7, 30].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDays(value as 7 | 30)}
                aria-pressed={days === value}
                className={`rounded px-3 py-1.5 text-sm ${days === value ? 'bg-forest-800 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {value} วัน
              </button>
            ))}
          </div>
        </div>

        <section className="border-y border-gray-200 py-5">
          <p className="text-sm text-gray-500">ยอดเปิดหน้าใน {days} วัน</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900" aria-live="polite">
            {loading ? 'กำลังโหลด…' : (stats?.totalViews ?? 0).toLocaleString('th-TH')}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">ยอดรายวัน</h2>
          {loading ? <p className="text-sm text-gray-500">กำลังโหลดข้อมูล…</p> : !stats?.daily.length ? (
            <p className="text-sm text-gray-500">ยังไม่มีข้อมูลในช่วงเวลานี้</p>
          ) : (
            <div className="overflow-x-auto border-y border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr><th className="px-4 py-3 font-medium">วันที่</th><th className="px-4 py-3 text-right font-medium">เปิดหน้า</th></tr>
                </thead>
                <tbody>
                  {stats.daily.map((row) => (
                    <tr key={row.date} className="border-t border-gray-100">
                      <td className="px-4 py-3">{new Date(`${row.date}T00:00:00`).toLocaleDateString('th-TH')}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.views.toLocaleString('th-TH')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">หมวดหน้าที่มีการเปิดดู</h2>
          {loading ? <p className="text-sm text-gray-500">กำลังโหลดข้อมูล…</p> : !stats?.routes.length ? (
            <p className="text-sm text-gray-500">ยังไม่มีข้อมูลในช่วงเวลานี้</p>
          ) : (
            <div className="overflow-x-auto border-y border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr><th className="px-4 py-3 font-medium">หน้า / ชื่อเรื่อง</th><th className="px-4 py-3 text-right font-medium">เปิดหน้า</th></tr>
                </thead>
                <tbody>
                  {stats.routes.map((row) => (
                    <tr key={row.route} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <span className="block">
                          {row.title || (row.route.endsWith('/:id') ? 'ข้อมูลย้อนหลัง (ไม่ทราบ ID)' : row.route)}
                        </span>
                        {(row.title || row.route.endsWith('/:id')) && (
                          <span className="mt-1 block font-mono text-xs text-gray-500">{row.route}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.views.toLocaleString('th-TH')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-xs text-gray-500">สถิตินี้นับจำนวนการเปิดหน้า ไม่ใช่จำนวนผู้เข้าชมที่ไม่ซ้ำกัน ข้อมูลจัดเก็บไม่เกิน 90 วัน</p>
      </div>
    </AdminShell>
  );
}