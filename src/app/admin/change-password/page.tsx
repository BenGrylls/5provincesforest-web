'use client';

import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Loader, Save } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { toast } from '@/components/admin/toast';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const tooShort = newPassword.length > 0 && newPassword.length < 8;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) { setError('รหัสผ่านใหม่และช่องยืนยันไม่ตรงกัน'); return; }
    if (newPassword.length < 8) { setError('รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร'); return; }

    setSaving(true);
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (response.ok) {
      toast.success('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } else {
      setError(data.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    }
  };

  const inputClass = 'w-full px-4 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500';

  return (
    <AdminShell
      activeKey="change-password"
      title="เปลี่ยนรหัสผ่าน"
      description="เปลี่ยนรหัสผ่านของบัญชีที่กำลังเข้าสู่ระบบอยู่"
    >
      <div className="max-w-md">
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 md:p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-3 bg-forest-50 rounded-xl text-forest-700 shrink-0"><KeyRound className="w-6 h-6" /></div>
            <p className="text-sm text-gray-500">ตั้งรหัสผ่านที่ยาวอย่างน้อย 8 ตัวอักษร และไม่ซ้ำกับรหัสที่ใช้ที่อื่น</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600">รหัสผ่านปัจจุบัน</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600">รหัสผ่านใหม่</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className={`${inputClass} ${tooShort ? 'border-amber-400' : ''}`}
              />
              {tooShort && <p className="text-xs text-amber-700">ยังสั้นเกินไป ({newPassword.length}/8 ตัวอักษร)</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600">ยืนยันรหัสผ่านใหม่</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className={`${inputClass} ${mismatch ? 'border-red-400' : ''}`}
              />
              {mismatch && <p className="text-xs text-red-600">รหัสผ่านทั้งสองช่องยังไม่ตรงกัน</p>}
            </div>

            <button
              type="button"
              onClick={() => setShowPasswords((value) => !value)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition"
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPasswords ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            </button>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={saving || mismatch || tooShort}
              className="w-full flex justify-center items-center gap-2 py-3 bg-forest-700 hover:bg-forest-800 disabled:bg-gray-300 text-white rounded-xl text-sm font-medium transition"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} บันทึกรหัสผ่านใหม่
            </button>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
