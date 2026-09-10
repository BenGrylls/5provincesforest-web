'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Users, Settings, KeyRound, LogOut, ChevronDown, ChevronUp, Newspaper, Film, BookOpen, History } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [isContentOpen, setIsContentOpen] = useState(true);
  const [role, setRole] = useState<'super_admin' | 'sub_admin'>('super_admin');
  const [username, setUsername] = useState('');
  const [permissions, setPermissions] = useState<string[] | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((response) => response.ok ? response.json() : null)
      .then((session) => {
        if (session?.role === 'sub_admin') setRole('sub_admin');
        if (typeof session?.username === 'string') setUsername(session.username);
          if (Array.isArray(session?.permissions)) setPermissions(session.permissions);
      });
  }, []);

  const isSuperAdmin = role === 'super_admin';
        const canManage = (permission: string) => isSuperAdmin || permissions?.includes(permission);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      {/* Sidebar ด้านซ้าย */}
      <aside className="w-72 bg-forest-950 text-white flex flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-forest-900">
          <h2 className="font-bold text-lg">Admin Control</h2>
          <p className="text-xs text-forest-300">ระบบจัดการมูลนิธิป่ารอยต่อฯ</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 text-sm overflow-y-auto">
          <a href="/admin" className="block px-4 py-2.5 bg-forest-900 rounded-xl font-medium">ภาพรวมระบบ</a>
          
          {/* เมนูจัดการเนื้อหาแบบ Dropdown */}
          <div>
            <button 
              onClick={() => setIsContentOpen(!isContentOpen)} 
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-forest-900/50 rounded-xl text-gray-300 transition"
            >
              <span>จัดการเนื้อหาเว็บไซต์</span>
              {isContentOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {isContentOpen && (
              <div className="ml-4 mt-1 pl-3 border-l border-forest-800 space-y-1 text-xs">
                {canManage('ข่าวสารและกิจกรรม') && <a href="/admin/content?tab=news" className="block px-3 py-2 hover:bg-forest-900/40 text-gray-300 hover:text-white rounded-lg transition flex items-center gap-2">
                  <Newspaper className="w-3.5 h-3.5 text-amber-400" /> กิจกรรมและประชาสัมพันธ์
                </a>}
                {canManage('สื่อและสารคดีธรรมชาติ') && <a href="/admin/content?tab=media" className="block px-3 py-2 hover:bg-forest-900/40 text-gray-300 hover:text-white rounded-lg transition flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-amber-400" /> สื่อและสารคดีธรรมชาติ
                </a>}
                {canManage('คลังเอกสารและวารสาร') && <a href="/admin/content?tab=publications" className="block px-3 py-2 hover:bg-forest-900/40 text-gray-300 hover:text-white rounded-lg transition flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" /> คลังเอกสารและวารสาร
                </a>}
                {canManage('โครงสร้างคณะกรรมการ') && <a href="/admin/committee" className="block px-3 py-2 hover:bg-forest-900/40 text-gray-300 hover:text-white rounded-lg transition flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-amber-400" /> จัดการโครงสร้างคณะกรรมการ
                </a>}
                {isSuperAdmin && <a href="/admin/content?tab=logs" className="block px-3 py-2 hover:bg-forest-900/40 text-gray-300 hover:text-white rounded-lg transition flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-amber-400" /> ประวัติการทำงาน (Logs)
                </a>}
              </div>
            )}
          </div>

          {isSuperAdmin && <a href="/admin/sub-admins" className="block px-4 py-2.5 hover:bg-forest-900/50 rounded-xl text-gray-300">จัดการสิทธิ์ Sub-Admin</a>}
          <a href="/admin/change-password" className="block px-4 py-2.5 hover:bg-forest-900/50 rounded-xl text-gray-300">เปลี่ยนรหัสผ่าน</a>
          {isSuperAdmin && <a href="/admin/settings" className="block px-4 py-2.5 hover:bg-forest-900/50 rounded-xl text-gray-300">ตั้งค่าธีมสีและไว้อาลัย</a>}
        </nav>
        <div className="p-4 border-t border-forest-900">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-xs text-red-400 hover:text-red-300 px-4 py-2 bg-red-950/30 rounded-xl transition">
            <LogOut className="w-4 h-4" /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ยินดีต้อนรับ {isSuperAdmin ? 'Super Admin' : 'Sub-Admin'}</h1>
            <p className="text-sm text-gray-500">{isSuperAdmin ? 'จัดการเนื้อหา กำหนดสิทธิ์ และควบคุมการแสดงผลเว็บไซต์' : 'จัดการเนื้อหาตามสิทธิ์ที่ได้รับ และเปลี่ยนรหัสผ่านบัญชีของคุณ'}</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-bold ${isSuperAdmin ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>{username || (isSuperAdmin ? 'Super Admin' : 'Sub-Admin')} ({isSuperAdmin ? 'Super Admin' : 'Sub-Admin'})</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {canManage('ข่าวสารและกิจกรรม') && <a href="/admin/content?tab=news" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-forest-500 transition block space-y-2">
            <FileText className="w-8 h-8 text-forest-700" />
            <h3 className="font-bold text-gray-900">จัดการเนื้อหาและข่าวสาร</h3>
            <p className="text-xs text-gray-500">เพิ่ม ลบ หรือแก้ไขบทความและคลังเอกสาร</p>
          </a>}
          {isSuperAdmin && <a href="/admin/sub-admins" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-forest-500 transition block space-y-2">
            <Users className="w-8 h-8 text-blue-700" />
            <h3 className="font-bold text-gray-900">จัดการสิทธิ์ Sub-Admin</h3>
            <p className="text-xs text-gray-500">ควบคุมสิทธิ์การเข้าถึงรายบุคคล</p>
          </a>}
          {isSuperAdmin && <a href="/admin/settings" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-forest-500 transition block space-y-2">
            <Settings className="w-8 h-8 text-amber-700" />
            <h3 className="font-bold text-gray-900">ตั้งค่าธีมสีและโหมดไว้อาลัย</h3>
            <p className="text-xs text-gray-500">เปิด-ปิด โหมดสีขาวดำ (Grayscale)</p>
          </a>}
          <a href="/admin/change-password" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-forest-500 transition block space-y-2"><KeyRound className="w-8 h-8 text-forest-700" /><h3 className="font-bold text-gray-900">เปลี่ยนรหัสผ่าน</h3><p className="text-xs text-gray-500">เปลี่ยนรหัสผ่านของบัญชีที่กำลังใช้งาน</p></a>
        </div>
      </main>
    </div>
  );
}