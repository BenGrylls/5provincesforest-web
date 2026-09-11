'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Film, Newspaper, Plus, Users, type LucideIcon } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { EmptyState, TableSkeleton } from '@/components/admin/States';
import { useAdminSession } from '@/components/admin/useAdminSession';

type Article = {
  id: number;
  title: string;
  category: string;
  published_at?: string;
};

const CATEGORIES = [
  { key: 'news', label: 'ข่าวและกิจกรรม', permission: 'ข่าวสารและกิจกรรม', icon: Newspaper, href: '/admin/content?tab=news', accent: 'text-forest-700 bg-forest-50' },
  { key: 'media', label: 'สื่อและสารคดี', permission: 'สื่อและสารคดีธรรมชาติ', icon: Film, href: '/admin/content?tab=media', accent: 'text-blue-700 bg-blue-50' },
  { key: 'publications', label: 'เอกสารและวารสาร', permission: 'คลังเอกสารและวารสาร', icon: BookOpen, href: '/admin/content?tab=publications', accent: 'text-amber-700 bg-amber-50' },
] as const;

const CATEGORY_LABEL: Record<string, string> = {
  news: 'ข่าวและกิจกรรม',
  media: 'สื่อและสารคดี',
  publications: 'เอกสารและวารสาร',
};

function relativeTime(value?: string) {
  if (!value) return '—';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '—';
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ชม. ที่แล้ว`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'เมื่อวาน';
  if (days < 31) return `${days} วันที่แล้ว`;
  return new Date(value).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatCard({ label, value, icon: Icon, accent, href, loading }: {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
  href: string;
  loading: boolean;
}) {
  return (
    <Link href={href} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-forest-500 hover:shadow transition block">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      {loading ? (
        <div className="h-8 w-12 bg-gray-100 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
      )}
      <p className="text-xs text-gray-500 mt-2">{label}</p>
    </Link>
  );
}

export default function AdminDashboard() {
  const { session, loading: sessionLoading, isSuperAdmin, canManage } = useAdminSession();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<Article[]>([]);
  const [subAdminCount, setSubAdminCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const allowed = CATEGORIES.filter((category) => canManage(category.permission));

  const load = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all(
      allowed.map(async (category) => {
        try {
          const response = await fetch(`/api/cms?category=${category.key}`);
          const data = response.ok ? await response.json() : [];
          return { key: category.key, items: (Array.isArray(data) ? data : []) as Article[] };
        } catch {
          return { key: category.key, items: [] as Article[] };
        }
      }),
    );

    setCounts(Object.fromEntries(results.map((result) => [result.key, result.items.length])));
    setRecent(
      results
        .flatMap((result) => result.items.map((item) => ({ ...item, category: result.key })))
        .sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime())
        .slice(0, 5),
    );
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed.map((category) => category.key).join(',')]);

  useEffect(() => {
    if (sessionLoading) return;
    load();
  }, [sessionLoading, load]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetch('/api/sub-admins')
      .then((response) => (response.ok ? response.json() : []))
      .catch(() => [])
      .then((data) => setSubAdminCount(Array.isArray(data) ? data.length : 0));
  }, [isSuperAdmin]);

  const busy = sessionLoading || loading;

  return (
    <AdminShell
      activeKey="overview"
      title={`สวัสดี ${session?.username || 'ผู้ดูแลระบบ'}`}
      description={isSuperAdmin ? 'จัดการเนื้อหา กำหนดสิทธิ์ และควบคุมการแสดงผลเว็บไซต์' : 'จัดการเนื้อหาตามสิทธิ์ที่ได้รับ'}
      actions={
        <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${isSuperAdmin ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
          {isSuperAdmin ? 'Super Admin' : 'Sub-Admin'}
        </span>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {allowed.map((category) => (
          <StatCard
            key={category.key}
            label={category.label}
            value={counts[category.key] ?? 0}
            icon={category.icon}
            accent={category.accent}
            href={category.href}
            loading={busy}
          />
        ))}
        {isSuperAdmin && (
          <StatCard
            label="ผู้ดูแลระบบย่อย"
            value={subAdminCount ?? 0}
            icon={Users}
            accent="text-purple-700 bg-purple-50"
            href="/admin/sub-admins"
            loading={subAdminCount === null}
          />
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">แก้ไขล่าสุด</h2>
          <p className="text-xs text-gray-500 mt-0.5">รายการที่เพิ่มหรือแก้ไขล่าสุดในหมวดที่คุณดูแล</p>
        </div>
        {busy ? (
          <TableSkeleton rows={4} columns={3} />
        ) : recent.length === 0 ? (
          <EmptyState
            title="ยังไม่มีเนื้อหาในระบบ"
            description="เริ่มต้นด้วยการเพิ่มข่าวหรืออัปโหลดเอกสารฉบับแรก"
          />
        ) : (
          <ul className="divide-y divide-gray-50">
            {recent.map((item) => (
              <li key={`${item.category}-${item.id}`}>
                <Link href={`/admin/content?tab=${item.category}`} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-gray-50/70 transition">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{CATEGORY_LABEL[item.category] ?? item.category}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{relativeTime(item.published_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {allowed.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          <h2 className="font-bold text-gray-900">ทางลัด</h2>
          <div className="flex flex-wrap gap-2">
            {allowed.map((category) => (
              <Link
                key={category.key}
                href={`${category.href}&new=1`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-sm font-medium transition"
              >
                <Plus className="w-4 h-4" /> เพิ่ม{category.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
