'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, X, Newspaper, Film, BookOpen, History, ChevronDown, ChevronUp, LogOut } from 'lucide-react';

type SubAdmin = {
  id: number;
  name: string;
  username: string;
  permissions: string[];
};

export default function SubAdminPage() {
  const router = useRouter();
  const [isContentOpen, setIsContentOpen] = useState(true);
  const [admins, setAdmins] = useState<SubAdmin[]>([]);

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [editingAdmin, setEditingAdmin] = useState<SubAdmin | null>(null);

  const fetchAdmins = async () => {
    const response = await fetch('/api/sub-admins');
    setAdmins(response.ok ? await response.json() as SubAdmin[] : []);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleCreate = async () => {
    setError('');
    const response = await fetch('/api/sub-admins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName, username: newUsername, password: newPassword, permissions: selectedPerms }) });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || 'ไม่สามารถสร้างบัญชีได้');
      return;
    }
    setIsOpenModal(false);
    setNewName(''); setNewUsername(''); setNewPassword(''); setSelectedPerms([]);
    fetchAdmins();
  };

  const handleSavePermissions = async () => {
    if (!editingAdmin) return;
    setError('');
    const response = await fetch('/api/sub-admins', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingAdmin.id, permissions: selectedPerms }) });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || 'ไม่สามารถแก้ไขสิทธิ์ได้');
      return;
    }
    setIsOpenModal(false);
    setEditingAdmin(null);
    setSelectedPerms([]);
    fetchAdmins();
  };

  const openCreateModal = () => {
    setEditingAdmin(null);
    setNewName(''); setNewUsername(''); setNewPassword(''); setSelectedPerms([]); setError('');
    setIsOpenModal(true);
  };

  const openEditModal = (admin: SubAdmin) => {
    setEditingAdmin(admin);
    setSelectedPerms(admin.permissions);
    setError('');
    setIsOpenModal(true);
  };

  const togglePerm = (perm: string) => {
    if (selectedPerms.includes(perm)) {
      setSelectedPerms(selectedPerms.filter(p => p !== perm));
    } else {
      setSelectedPerms([...selectedPerms, perm]);
    }
  };

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
          <a href="/admin" className="block px-4 py-2.5 hover:bg-forest-900/50 rounded-xl text-gray-300 transition">ภาพรวมระบบ</a>
          
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
                <a href="/admin/content?tab=news" className="block px-3 py-2 hover:bg-forest-900/40 text-gray-300 hover:text-white rounded-lg transition flex items-center gap-2">
                  <Newspaper className="w-3.5 h-3.5 text-amber-400" /> กิจกรรมและประชาสัมพันธ์
                </a>
                <a href="/admin/content?tab=media" className="block px-3 py-2 hover:bg-forest-900/40 text-gray-300 hover:text-white rounded-lg transition flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-amber-400" /> สื่อและสารคดีธรรมชาติ
                </a>
                <a href="/admin/content?tab=publications" className="block px-3 py-2 hover:bg-forest-900/40 text-gray-300 hover:text-white rounded-lg transition flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" /> คลังเอกสารและวารสาร
                </a>
                <a href="/admin/content?tab=logs" className="block px-3 py-2 hover:bg-forest-900/40 text-gray-300 hover:text-white rounded-lg transition flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-amber-400" /> ประวัติการทำงาน (Logs)
                </a>
              </div>
            )}
          </div>

          <a href="/admin/sub-admins" className="block px-4 py-2.5 bg-forest-900 rounded-xl font-medium text-white">จัดการสิทธิ์ Sub-Admin</a>
          <a href="/admin/settings" className="block px-4 py-2.5 hover:bg-forest-900/50 rounded-xl text-gray-300">ตั้งค่าธีมสีและไว้อาลัย</a>
        </nav>
        <div className="p-4 border-t border-forest-900">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-xs text-red-400 hover:text-red-300 px-4 py-2 bg-red-950/30 rounded-xl transition">
            <LogOut className="w-4 h-4" /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-5xl mx-auto space-y-8 overflow-y-auto">
        <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">จัดการสิทธิ์ผู้ใช้งานย่อย (Sub-Admins)</h1>
            <p className="text-xs text-gray-500 mt-0.5">กำหนดขอบเขตสิทธิ์การแก้ไขหน้าเว็บไซต์ของเจ้าหน้าที่แต่ละท่าน</p>
          </div>
          <button onClick={openCreateModal} className="flex items-center gap-2 bg-forest-700 text-white px-4 py-2.5 rounded-xl text-xs font-medium hover:bg-forest-800 transition">
            <UserPlus className="w-4 h-4" /> เพิ่ม Sub-Admin
          </button>
        </div>

        {isOpenModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-gray-900">{editingAdmin ? `แก้ไขสิทธิ์: ${editingAdmin.name}` : 'กำหนดสิทธิ์ Sub-Admin รายบุคคล'}</h3>
                <button onClick={() => setIsOpenModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-4">
                {!editingAdmin && <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">ชื่อเจ้าหน้าที่</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="ระบุชื่อเจ้าหน้าที่..." className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500" />
                </div>}
                {!editingAdmin && <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Username</label>
                  <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="ระบุ Username..." className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500" />
                </div>}
                {!editingAdmin && <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="อย่างน้อย 8 ตัวอักษร" className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500" />
                </div>}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">อนุญาตให้แก้ไขหน้า / หมวดหมู่ใดบ้าง:</label>
                  <div className="grid grid-cols-1 gap-2">
                    {['ข่าวสารและกิจกรรม', 'สื่อและสารคดีธรรมชาติ', 'คลังเอกสารและวารสาร', 'โครงสร้างคณะกรรมการ'].map((p, idx) => (
                      <label key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-xl cursor-pointer border">
                        <input type="checkbox" checked={selectedPerms.includes(p)} onChange={() => togglePerm(p)} className="rounded text-forest-700 focus:ring-forest-500" />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setIsOpenModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-xs font-medium">ยกเลิก</button>
                  <button onClick={editingAdmin ? handleSavePermissions : handleCreate} className="px-4 py-2 bg-forest-700 text-white rounded-xl text-xs font-medium">บันทึกข้อมูล</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <th className="p-4">ชื่อเจ้าหน้าที่</th>
                <th className="p-4">Username</th>
                <th className="p-4">สิทธิ์การเข้าถึงหน้าที่ได้รับอนุญาต</th>
                <th className="p-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {admins.map((adm) => (
                <tr key={adm.id} className="hover:bg-gray-50/50">
                  <td className="p-4 font-semibold text-gray-900">{adm.name}</td>
                  <td className="p-4 text-gray-500">{adm.username}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {adm.permissions.map((perm, idx) => (
                        <span key={idx} className="bg-forest-50 text-forest-800 text-[10px] px-2.5 py-1 rounded-md font-medium">{perm}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => openEditModal(adm)} className="text-forest-700 bg-forest-50 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-forest-100 transition">ปรับเปลี่ยนสิทธิ์</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}