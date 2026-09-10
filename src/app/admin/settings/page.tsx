'use client';
import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Save, CheckCircle, Newspaper, Film, BookOpen, History, ChevronDown, ChevronUp, LogOut } from 'lucide-react';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [isContentOpen, setIsContentOpen] = useState(true);
  const [isGrayscale, setIsGrayscale] = useState(false);
  const [saved, setSaved] = useState(false);
  const [coverEnabled, setCoverEnabled] = useState(false);
  const [coverImage, setCoverImage] = useState('');
  const [coverTitle, setCoverTitle] = useState('');
  const [coverMessage, setCoverMessage] = useState('');
  const [coverLink, setCoverLink] = useState('');
  const [coverLinkText, setCoverLinkText] = useState('');
  const [coverSubtitle, setCoverSubtitle] = useState('');
  const [coverDate, setCoverDate] = useState('');
  const [coverFooter, setCoverFooter] = useState('');
  const [coverOrnament, setCoverOrnament] = useState('');
  const [coverOrnamentFile, setCoverOrnamentFile] = useState<File | null>(null);
  const [coverTitleSize, setCoverTitleSize] = useState(28);
  const [coverSubtitleSize, setCoverSubtitleSize] = useState(20);
  const [coverDateSize, setCoverDateSize] = useState(16);
  const [coverFooterSize, setCoverFooterSize] = useState(12);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverMessageStatus, setCoverMessageStatus] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);
  const coverOrnamentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) setIsGrayscale(data.isGrayscale);
      });
    fetch('/api/important-cover').then((response) => response.ok ? response.json() : null).then((data) => {
      if (!data) return;
      setCoverEnabled(Boolean(data.important_cover_enabled)); setCoverImage(data.important_cover_image || ''); setCoverTitle(data.important_cover_title || ''); setCoverMessage(data.important_cover_message || ''); setCoverLink(data.important_cover_link || ''); setCoverLinkText(data.important_cover_link_text || ''); setCoverSubtitle(data.important_cover_subtitle || ''); setCoverDate(data.important_cover_date || ''); setCoverFooter(data.important_cover_footer || ''); setCoverOrnament(data.important_cover_ornament || ''); setCoverTitleSize(data.important_cover_title_size || 28); setCoverSubtitleSize(data.important_cover_subtitle_size || 20); setCoverDateSize(data.important_cover_date_size || 16); setCoverFooterSize(data.important_cover_footer_size || 12);
    });
  }, []);

  const handleSave = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isGrayscale }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveCover = async () => {
    const form = new FormData();
    form.append('enabled', String(coverEnabled)); form.append('existingImage', coverImage); form.append('existingOrnament', coverOrnament); form.append('title', coverTitle); form.append('message', coverMessage); form.append('link', coverLink); form.append('linkText', coverLinkText); form.append('subtitle', coverSubtitle); form.append('date', coverDate); form.append('footer', coverFooter); form.append('titleSize', String(coverTitleSize)); form.append('subtitleSize', String(coverSubtitleSize)); form.append('dateSize', String(coverDateSize)); form.append('footerSize', String(coverFooterSize));
    if (coverFile) form.append('image', coverFile);
    if (coverOrnamentFile) form.append('ornament', coverOrnamentFile);
    const response = await fetch('/api/important-cover', { method: 'POST', body: form });
    const data = await response.json();
    if (response.ok) { setCoverImage(data.imagePath); setCoverOrnament(data.ornamentPath); setCoverFile(null); setCoverOrnamentFile(null); setCoverMessageStatus('บันทึก cover วันสำคัญเรียบร้อยแล้ว'); } else setCoverMessageStatus(data.error || 'บันทึกไม่สำเร็จ');
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

          <a href="/admin/sub-admins" className="block px-4 py-2.5 hover:bg-forest-900/50 rounded-xl text-gray-300">จัดการสิทธิ์ Sub-Admin</a>
          <a href="/admin/settings" className="block px-4 py-2.5 bg-forest-900 rounded-xl font-medium text-white">ตั้งค่าธีมสีและไว้อาลัย</a>
        </nav>
        <div className="p-4 border-t border-forest-900">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-xs text-red-400 hover:text-red-300 px-4 py-2 bg-red-950/30 rounded-xl transition">
            <LogOut className="w-4 h-4" /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-4xl mx-auto space-y-8 overflow-y-auto">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">ตั้งค่าระบบและการแสดงผลเว็บไซต์</h1>
          <p className="text-xs text-gray-500 mt-0.5">ควบคุมโหมดสีขาวดำ (Mourning/Grayscale Mode) สำหรับช่วงไว้อาลัย</p>
        </div>

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
            <CheckCircle className="w-5 h-5 text-green-600" /> บันทึกการตั้งค่าและอัปเดตหน้าเว็บจริงสำเร็จ!
          </div>
        )}

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-3 bg-red-50 rounded-xl text-red-600"><ShieldAlert className="w-6 h-6" /></div>
            <div>
              <h2 className="font-bold text-lg text-gray-900">เปิด-ปิด โหมดสีขาวดำ (Grayscale Mode)</h2>
              <p className="text-xs text-gray-500">เมื่อเปิดใช้งาน เว็บไซต์ทั้งหมดจะเปลี่ยนเป็นโทนสีเทา/ขาวดำทันทีโดยมีผลกับผู้ใช้งานทุกคน</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-200">
            <div>
              <div className="font-bold text-gray-900">สถานะโหมดไว้อาลัย</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {isGrayscale ? <span className="text-red-600 font-bold">🔴 เปิดใช้งานอยู่ (เว็บเป็นสีขาวดำ)</span> : <span className="text-green-600 font-bold">🟢 ปิดใช้งาน (เว็บแสดงสีสันปกติ)</span>}
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={isGrayscale} onChange={() => setIsGrayscale(!isGrayscale)} className="sr-only peer" />
              <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-forest-900"></div>
            </label>
          </div>

          <div className="pt-4 flex justify-end">
            <button onClick={handleSave} className="flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white px-6 py-3 rounded-xl font-medium text-sm transition shadow-sm">
              <Save className="w-4 h-4" /> บันทึกการเปลี่ยนแปลง
            </button>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-5">
          <div><h2 className="font-bold text-lg text-gray-900">Cover วันสำคัญ</h2><p className="text-xs text-gray-500 mt-1">แสดงเต็มหน้าจอก่อนหน้าแรก เมื่อเลื่อนลงจะเข้าสู่เว็บไซต์ตามปกติ</p></div>
          <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border"><span className="text-sm font-medium">เปิดใช้งาน Cover วันสำคัญ</span><input type="checkbox" checked={coverEnabled} onChange={(event) => setCoverEnabled(event.target.checked)} className="w-4 h-4" /></label>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">รูปภาพ Cover</label><div className="flex gap-2"><input value={coverFile?.name || coverImage} readOnly placeholder="เลือกรูปภาพ..." className="flex-1 px-4 py-2.5 border rounded-xl text-sm" /><input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setCoverFile(event.target.files?.[0] || null)} className="hidden" /><button type="button" onClick={() => coverInputRef.current?.click()} className="px-4 bg-forest-700 text-white rounded-xl text-xs">เลือกรูป</button></div></div>
          <div className="grid grid-cols-[1fr_7rem] gap-3"><input value={coverTitle} onChange={(event) => setCoverTitle(event.target.value)} placeholder="หัวข้อ เช่น น้อมศิระกรานพระผู้เสด็จสู่สวรรคาลัย" className="w-full px-4 py-2.5 border rounded-xl text-sm" /><input type="number" min="10" max="72" value={coverTitleSize} onChange={(event) => setCoverTitleSize(Number(event.target.value))} className="px-3 py-2.5 border rounded-xl text-sm" title="ขนาดหัวข้อ" /></div>
          <div className="grid grid-cols-[1fr_7rem] gap-3"><textarea value={coverSubtitle} onChange={(event) => setCoverSubtitle(event.target.value)} placeholder="ชื่อบุคคลหรือข้อความรอง (กด Enter เพื่อขึ้นบรรทัดใหม่)" rows={2} className="w-full px-4 py-2.5 border rounded-xl text-sm" /><input type="number" min="10" max="72" value={coverSubtitleSize} onChange={(event) => setCoverSubtitleSize(Number(event.target.value))} className="h-11 px-3 py-2.5 border rounded-xl text-sm" title="ขนาดข้อความรอง" /></div>
          <textarea value={coverMessage} onChange={(event) => setCoverMessage(event.target.value)} placeholder="ข้อความประกอบ" rows={2} className="w-full px-4 py-2.5 border rounded-xl text-sm" />
          <div className="grid grid-cols-[1fr_7rem] gap-3"><input value={coverDate} onChange={(event) => setCoverDate(event.target.value)} placeholder="วันที่ เช่น ๑๑ มิถุนายน ๒๕๖๙" className="w-full px-4 py-2.5 border rounded-xl text-sm" /><input type="number" min="10" max="72" value={coverDateSize} onChange={(event) => setCoverDateSize(Number(event.target.value))} className="px-3 py-2.5 border rounded-xl text-sm" title="ขนาดวันที่" /></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">ลวดลายเส้นประกอบ</label><div className="flex gap-2"><input value={coverOrnamentFile?.name || coverOrnament} readOnly placeholder="เลือกรูปลวดลาย (ไม่บังคับ)" className="flex-1 px-4 py-2.5 border rounded-xl text-sm" /><input ref={coverOrnamentInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setCoverOrnamentFile(event.target.files?.[0] || null)} className="hidden" /><button type="button" onClick={() => coverOrnamentInputRef.current?.click()} className="px-4 bg-forest-700 text-white rounded-xl text-xs">เลือกลวดลาย</button></div></div>
          <div className="grid grid-cols-[1fr_7rem] gap-3"><textarea value={coverFooter} onChange={(event) => setCoverFooter(event.target.value)} placeholder="ข้อความลงท้าย เช่น ข้าพระพุทธเจ้า ..." rows={3} className="w-full px-4 py-2.5 border rounded-xl text-sm" /><input type="number" min="10" max="72" value={coverFooterSize} onChange={(event) => setCoverFooterSize(Number(event.target.value))} className="h-11 px-3 py-2.5 border rounded-xl text-sm" title="ขนาดข้อความลงท้าย" /></div>
          <div className="grid md:grid-cols-2 gap-3"><input value={coverLink} onChange={(event) => setCoverLink(event.target.value)} placeholder="ลิงก์ เช่น /news หรือ https://..." className="w-full px-4 py-2.5 border rounded-xl text-sm" /><input value={coverLinkText} onChange={(event) => setCoverLinkText(event.target.value)} placeholder="ข้อความบนปุ่ม" className="w-full px-4 py-2.5 border rounded-xl text-sm" /></div>
          {coverMessageStatus && <p className="text-sm text-forest-700">{coverMessageStatus}</p>}
          <button onClick={handleSaveCover} className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white px-6 py-3 rounded-xl font-medium text-sm"><Save className="w-4 h-4" /> บันทึก Cover วันสำคัญ</button>
        </div>
      </main>
    </div>
  );
}