'use client';
import React, { useEffect, useState } from 'react';
import { UserPlus, Users, X } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/admin/States';
import { toast } from '@/components/admin/toast';
import { PERMISSIONS } from '@/lib/permissions';

type SubAdmin = {
  id: number;
  name: string;
  username: string;
  permissions: string[];
};

// เดิม hardcode ไว้ที่นี่และตกหล่น 'ประวัติความเป็นมา' ทำให้มอบสิทธิ์นั้นไม่ได้เลย
const ALL_PERMISSIONS = PERMISSIONS;

export default function SubAdminPage() {
  const [admins, setAdmins] = useState<SubAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [editingAdmin, setEditingAdmin] = useState<SubAdmin | null>(null);

  const fetchAdmins = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await fetch('/api/sub-admins');
      if (!response.ok) throw new Error('ไม่สามารถโหลดรายชื่อผู้ดูแลระบบได้');
      setAdmins(await response.json() as SubAdmin[]);
    } catch (err) {
      setAdmins([]);
      setLoadError(err instanceof Error ? err.message : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleCreate = async () => {
    setError('');
    setSaving(true);
    const response = await fetch('/api/sub-admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, username: newUsername, password: newPassword, permissions: selectedPerms }),
    });
    setSaving(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'ไม่สามารถสร้างบัญชีได้');
      return;
    }
    setIsOpenModal(false);
    toast.success(`เพิ่มบัญชี ${newName} เรียบร้อยแล้ว`);
    setNewName(''); setNewUsername(''); setNewPassword(''); setSelectedPerms([]);
    fetchAdmins();
  };

  const handleSavePermissions = async () => {
    if (!editingAdmin) return;
    setError('');
    setSaving(true);
    const response = await fetch('/api/sub-admins', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingAdmin.id, permissions: selectedPerms }),
    });
    setSaving(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'ไม่สามารถแก้ไขสิทธิ์ได้');
      return;
    }
    setIsOpenModal(false);
    toast.success(`บันทึกสิทธิ์ของ ${editingAdmin.name} เรียบร้อยแล้ว`);
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
    setSelectedPerms((current) => current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm]);
  };

  const permissionBadges = (permissions: string[]) => (
    permissions.length === 0
      ? <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md font-medium">ยังไม่ได้กำหนดสิทธิ์</span>
      : <>{permissions.map((perm, idx) => (
          <span key={idx} className="bg-forest-50 text-forest-800 text-xs px-2.5 py-1 rounded-md font-medium">{perm}</span>
        ))}</>
  );

  return (
    <AdminShell
      activeKey="sub-admins"
      title="จัดการสิทธิ์ผู้ใช้งานย่อย"
      description="กำหนดขอบเขตสิทธิ์การแก้ไขหน้าเว็บไซต์ของเจ้าหน้าที่แต่ละท่าน"
      actions={
        <button onClick={openCreateModal} className="flex items-center gap-2 bg-forest-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-forest-800 transition">
          <UserPlus className="w-4 h-4" /> เพิ่ม Sub-Admin
        </button>
      }
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={3} columns={4} />
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={fetchAdmins} />
        ) : admins.length === 0 ? (
          <EmptyState
            icon={Users}
            title="ยังไม่มีบัญชีผู้ดูแลระบบย่อย"
            description="สร้างบัญชีให้เจ้าหน้าที่ แล้วเลือกว่าให้แก้ไขหมวดใดได้บ้าง"
            action={
              <button onClick={openCreateModal} className="inline-flex items-center gap-2 bg-forest-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-forest-800 transition">
                <UserPlus className="w-4 h-4" /> เพิ่ม Sub-Admin
              </button>
            }
          />
        ) : (
          <>
            <table className="w-full text-left border-collapse text-sm hidden md:table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs">
                  <th className="p-4 font-semibold">ชื่อเจ้าหน้าที่</th>
                  <th className="p-4 font-semibold">Username</th>
                  <th className="p-4 font-semibold">สิทธิ์ที่ได้รับอนุญาต</th>
                  <th className="p-4 font-semibold text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {admins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-semibold text-gray-900">{adm.name}</td>
                    <td className="p-4 text-gray-500">{adm.username}</td>
                    <td className="p-4"><div className="flex flex-wrap gap-1">{permissionBadges(adm.permissions)}</div></td>
                    <td className="p-4 text-right">
                      <button onClick={() => openEditModal(adm)} className="text-forest-700 bg-forest-50 px-3 py-2 rounded-lg text-xs font-medium hover:bg-forest-100 transition">ปรับเปลี่ยนสิทธิ์</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="md:hidden divide-y divide-gray-50">
              {admins.map((adm) => (
                <li key={adm.id} className="p-4 space-y-2.5">
                  <div>
                    <p className="font-semibold text-gray-900">{adm.name}</p>
                    <p className="text-xs text-gray-500">{adm.username}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">{permissionBadges(adm.permissions)}</div>
                  <button onClick={() => openEditModal(adm)} className="w-full text-forest-700 bg-forest-50 px-3 py-2.5 rounded-lg text-sm font-medium">ปรับเปลี่ยนสิทธิ์</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {isOpenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white max-w-md w-full p-5 sm:p-6 rounded-3xl shadow-xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900">{editingAdmin ? `แก้ไขสิทธิ์: ${editingAdmin.name}` : 'เพิ่ม Sub-Admin ใหม่'}</h3>
              <button onClick={() => setIsOpenModal(false)} aria-label="ปิด"><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="space-y-4">
              {!editingAdmin && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">ชื่อเจ้าหน้าที่</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="ระบุชื่อเจ้าหน้าที่..." className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Username</label>
                    <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="ระบุ Username..." autoComplete="off" className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="อย่างน้อย 8 ตัวอักษร" autoComplete="new-password" className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">อนุญาตให้แก้ไขหมวดใดบ้าง</label>
                <div className="space-y-2">
                  {ALL_PERMISSIONS.map((p) => (
                    <label key={p} className={`flex items-center gap-3 text-sm p-3 rounded-xl cursor-pointer border transition ${selectedPerms.includes(p) ? 'bg-forest-50 border-forest-500 text-forest-900' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                      <input type="checkbox" checked={selectedPerms.includes(p)} onChange={() => togglePerm(p)} className="rounded text-forest-700 focus:ring-forest-500" />
                      {p}
                    </label>
                  ))}
                </div>
                {selectedPerms.length === 0 && (
                  <p className="text-xs text-amber-700 mt-2">ยังไม่ได้เลือกสิทธิ์ใดเลย — บัญชีนี้จะเข้าสู่ระบบได้แต่แก้ไขอะไรไม่ได้</p>
                )}
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setIsOpenModal(false)} disabled={saving} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition disabled:opacity-50">ยกเลิก</button>
                <button onClick={editingAdmin ? handleSavePermissions : handleCreate} disabled={saving} className="px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-sm font-medium transition disabled:bg-gray-400">
                  {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
