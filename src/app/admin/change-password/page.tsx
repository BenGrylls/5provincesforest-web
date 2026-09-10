'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Save } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) { setMessage('รหัสผ่านใหม่ไม่ตรงกัน'); return; }
    const response = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) });
    const data = await response.json();
    setMessage(response.ok ? 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' : data.error || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    if (response.ok) { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }
  };

  return <main className="min-h-screen bg-gray-100 p-6 md:p-12"><div className="max-w-md mx-auto bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-6"><div className="flex items-center gap-3"><KeyRound className="w-7 h-7 text-forest-700" /><div><h1 className="text-xl font-bold text-gray-900">เปลี่ยนรหัสผ่าน</h1><p className="text-xs text-gray-500">สำหรับบัญชี Sub-Admin</p></div></div><form onSubmit={submit} className="space-y-4"><input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="รหัสผ่านปัจจุบัน" required className="w-full px-4 py-3 border rounded-xl text-sm" /><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)" minLength={8} required className="w-full px-4 py-3 border rounded-xl text-sm" /><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="ยืนยันรหัสผ่านใหม่" minLength={8} required className="w-full px-4 py-3 border rounded-xl text-sm" />{message && <p className="text-sm text-forest-700">{message}</p>}<button className="w-full flex justify-center items-center gap-2 py-3 bg-forest-700 text-white rounded-xl text-sm font-medium"><Save className="w-4 h-4" /> บันทึกรหัสผ่านใหม่</button></form><button onClick={() => router.push('/admin')} className="text-sm text-forest-700">กลับหน้าจัดการ</button></div></main>;
}