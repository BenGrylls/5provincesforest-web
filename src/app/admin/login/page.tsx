'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-forest-950 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-forest-800 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-forest-900 text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-forest-950">Admin Authentication</h1>
          <p className="text-xs text-gray-500 font-serif">มูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">ชื่อผู้ใช้งาน (Username)</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="กรอก Username..." 
                className="w-full pl-11 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" 
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">รหัสผ่าน (Password)</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="กรอก Password..." 
                className="w-full pl-11 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" 
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl font-semibold text-sm transition shadow-md disabled:opacity-50"
          >
            {loading ? 'กำลังตรวจสอบสิทธิ์...' : 'เข้าสู่ระบบผู้ดูแลระบบ'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100">
          <a href="/" className="text-xs text-gray-400 hover:text-forest-700 transition">← กลับสู่หน้าเว็บไซต์หลัก</a>
        </div>
      </div>
    </div>
  );
}