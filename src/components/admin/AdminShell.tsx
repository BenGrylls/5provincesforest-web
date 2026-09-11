'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { ToastViewport } from '@/components/admin/toast';
import { useAdminSession } from '@/components/admin/useAdminSession';
import { visibleGroups, type NavItem } from '@/components/admin/adminNav';

type Props = {
  /** คีย์เมนูที่กำลังเปิดอยู่ — หน้าที่ใช้ query string (เช่น content) ต้องส่งมาเอง */
  activeKey?: string;
  title: string;
  description?: string;
  /** ปุ่มมุมขวาของหัวข้อ เช่น "เพิ่มข้อมูลใหม่" */
  actions?: React.ReactNode;
  children: React.ReactNode;
};

const PATH_TO_KEY: Record<string, string> = {
  '/admin': 'overview',
  '/admin/history': 'history',
  '/admin/committee': 'committee',
  '/admin/committee/president-bio': 'committee',
  '/admin/sub-admins': 'sub-admins',
  '/admin/settings': 'settings',
  '/admin/change-password': 'change-password',
};

export default function AdminShell({ activeKey, title, description, actions, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, loading, isSuperAdmin, permissions } = useAdminSession();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(true);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const currentKey = activeKey ?? PATH_TO_KEY[pathname] ?? '';
  const groups = visibleGroups(isSuperAdmin, permissions);

  // ปิดลิ้นชักเมื่อเปลี่ยนหน้า ไม่อย่างนั้นมันจะค้างทับเนื้อหาหน้าใหม่
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // ล็อกการเลื่อนพื้นหลังตอนลิ้นชักเปิด
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setDrawerOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const openGroup = (key: string) => (key === 'content' ? contentOpen : key === 'system' ? systemOpen : true);
  const toggleGroup = (key: string) => {
    if (key === 'content') setContentOpen((value) => !value);
    if (key === 'system') setSystemOpen((value) => !value);
  };

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = item.key === currentKey;
    const className = `w-full text-left px-3 py-2.5 rounded-lg transition flex items-center gap-2.5 text-sm ${
      isActive ? 'bg-forest-800 text-white font-semibold' : 'text-gray-300 hover:bg-forest-900/50 hover:text-white'
    }`;

    return (
      <Link key={item.key} href={item.href} className={className} aria-current={isActive ? 'page' : undefined}>
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-amber-400'}`} />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const navBody = (
    <>
      <div className="p-5 border-b border-forest-900 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold text-base text-white">Admin Control</h2>
          <p className="text-xs text-forest-300 truncate">ระบบจัดการมูลนิธิป่ารอยต่อฯ</p>
        </div>
        <button type="button" onClick={() => setDrawerOpen(false)} aria-label="ปิดเมนู" className="md:hidden p-1.5 text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-1" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-9 bg-forest-900/60 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.key} className="space-y-1">
              {group.label ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  aria-expanded={openGroup(group.key)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold tracking-wide text-forest-300 uppercase hover:text-white transition"
                >
                  <span>{group.label}</span>
                  {openGroup(group.key) ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              ) : null}
              {(!group.label || openGroup(group.key)) && <div className="space-y-1">{group.items.map(renderItem)}</div>}
            </div>
          ))
        )}
      </nav>

      <div className="p-3 border-t border-forest-900 space-y-2">
        {!loading && session && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-forest-900/50 rounded-xl">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSuperAdmin ? 'bg-amber-400/20 text-amber-300' : 'bg-blue-400/20 text-blue-300'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white font-medium truncate">{session.username || 'admin'}</p>
              <p className="text-[11px] text-forest-300">{isSuperAdmin ? 'Super Admin' : 'Sub-Admin'}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setConfirmLogout(true)}
          className="w-full flex items-center justify-center gap-2 text-sm text-red-300 hover:text-white hover:bg-red-900/60 px-4 py-2.5 bg-red-950/40 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" /> ออกจากระบบ
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* แถบบนสำหรับมือถือ — เดิมไม่มี sidebar จึงถูกซ่อนหายไปเฉยๆ และนำทางไม่ได้เลย */}
      <header className="md:hidden sticky top-0 z-30 bg-forest-950 text-white flex items-center gap-3 px-4 h-14">
        <button type="button" onClick={() => setDrawerOpen(true)} aria-label="เปิดเมนู" className="p-1.5 -ml-1.5 hover:bg-forest-900 rounded-lg transition">
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-semibold truncate">{title}</span>
      </header>

      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      )}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-[17rem] bg-forest-950 text-white flex flex-col transition-transform duration-200 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navBody}
      </aside>

      <div className="flex">
        <aside className="hidden md:flex w-72 bg-forest-950 text-white flex-col shrink-0 sticky top-0 h-screen">
          {navBody}
        </aside>

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6">
          <div className="bg-white px-5 py-5 md:px-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-gray-900">{title}</h1>
              {description && <p className="text-xs md:text-sm text-gray-500 mt-1">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
          </div>

          {children}
        </main>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="ออกจากระบบ?"
        description="คุณจะต้องเข้าสู่ระบบใหม่เพื่อกลับมาจัดการเนื้อหา"
        confirmLabel="ออกจากระบบ"
        destructive
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
      <ToastViewport />
    </div>
  );
}
