'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Image as ImageIcon, Loader, Save, ShieldAlert, Sparkles } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { toast } from '@/components/admin/toast';

/** ช่องกรอกพร้อมช่องปรับขนาดตัวอักษรที่อยู่คู่กัน */
function SizedField({ label, hint, children, size, onSizeChange }: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  size: number;
  onSizeChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-600">{label}</label>
      <div className="grid grid-cols-[1fr_6rem] gap-2 items-start">
        {children}
        <div className="relative">
          <input
            type="number"
            min="10"
            max="72"
            value={size}
            onChange={(event) => onSizeChange(Number(event.target.value))}
            aria-label={`ขนาดตัวอักษรของ${label}`}
            className="w-full h-11 pl-3 pr-8 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">px</span>
        </div>
      </div>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [isGrayscale, setIsGrayscale] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [savingCover, setSavingCover] = useState(false);

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
  const coverInputRef = useRef<HTMLInputElement>(null);
  const coverOrnamentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => { if (data) setIsGrayscale(data.isGrayscale); })
      .catch(() => toast.error('โหลดการตั้งค่าธีมไม่สำเร็จ'));

    fetch('/api/important-cover')
      .then((response) => response.ok ? response.json() : null)
      .catch(() => null)
      .then((data) => {
        if (!data) return;
        setCoverEnabled(Boolean(data.important_cover_enabled));
        setCoverImage(data.important_cover_image || '');
        setCoverTitle(data.important_cover_title || '');
        setCoverMessage(data.important_cover_message || '');
        setCoverLink(data.important_cover_link || '');
        setCoverLinkText(data.important_cover_link_text || '');
        setCoverSubtitle(data.important_cover_subtitle || '');
        setCoverDate(data.important_cover_date || '');
        setCoverFooter(data.important_cover_footer || '');
        setCoverOrnament(data.important_cover_ornament || '');
        setCoverTitleSize(data.important_cover_title_size || 28);
        setCoverSubtitleSize(data.important_cover_subtitle_size || 20);
        setCoverDateSize(data.important_cover_date_size || 16);
        setCoverFooterSize(data.important_cover_footer_size || 12);
      });
  }, []);

  const handleSave = async () => {
    setSavingTheme(true);
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isGrayscale }),
    }).catch(() => null);
    setSavingTheme(false);
    if (response?.ok) toast.success('บันทึกการตั้งค่าและอัปเดตหน้าเว็บจริงแล้ว');
    else toast.error('บันทึกการตั้งค่าไม่สำเร็จ');
  };

  const handleSaveCover = async () => {
    setSavingCover(true);
    const form = new FormData();
    form.append('enabled', String(coverEnabled));
    form.append('existingImage', coverImage);
    form.append('existingOrnament', coverOrnament);
    form.append('title', coverTitle);
    form.append('message', coverMessage);
    form.append('link', coverLink);
    form.append('linkText', coverLinkText);
    form.append('subtitle', coverSubtitle);
    form.append('date', coverDate);
    form.append('footer', coverFooter);
    form.append('titleSize', String(coverTitleSize));
    form.append('subtitleSize', String(coverSubtitleSize));
    form.append('dateSize', String(coverDateSize));
    form.append('footerSize', String(coverFooterSize));
    if (coverFile) form.append('image', coverFile);
    if (coverOrnamentFile) form.append('ornament', coverOrnamentFile);

    const response = await fetch('/api/important-cover', { method: 'POST', body: form });
    const data = await response.json().catch(() => ({}));
    setSavingCover(false);

    if (response.ok) {
      setCoverImage(data.imagePath);
      setCoverOrnament(data.ornamentPath);
      setCoverFile(null);
      setCoverOrnamentFile(null);
      toast.success('บันทึก Cover วันสำคัญเรียบร้อยแล้ว');
    } else {
      toast.error(data.error || 'บันทึก Cover ไม่สำเร็จ');
    }
  };

  const inputClass = 'w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500';

  return (
    <AdminShell
      activeKey="settings"
      title="ธีมสีและ Cover วันสำคัญ"
      description="ควบคุมโหมดสีขาวดำสำหรับช่วงไว้อาลัย และหน้า Cover ที่แสดงก่อนเข้าเว็บไซต์"
    >
      <section className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-5">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="p-3 bg-red-50 rounded-xl text-red-600 shrink-0"><ShieldAlert className="w-6 h-6" /></div>
          <div>
            <h2 className="font-bold text-base md:text-lg text-gray-900">โหมดสีขาวดำ (Grayscale)</h2>
            <p className="text-xs text-gray-500 mt-0.5">เมื่อเปิด เว็บไซต์ทั้งหมดจะเป็นโทนขาวดำทันที มีผลกับผู้เข้าชมทุกคน</p>
          </div>
        </div>

        <label className="flex items-center justify-between gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-200 cursor-pointer">
          <div>
            <div className="font-bold text-gray-900">สถานะโหมดไว้อาลัย</div>
            <div className="text-xs mt-0.5">
              {isGrayscale
                ? <span className="text-red-600 font-bold">🔴 เปิดใช้งานอยู่ (เว็บเป็นสีขาวดำ)</span>
                : <span className="text-green-600 font-bold">🟢 ปิดใช้งาน (เว็บแสดงสีสันปกติ)</span>}
            </div>
          </div>
          <div className="relative inline-flex items-center shrink-0">
            <input type="checkbox" checked={isGrayscale} onChange={() => setIsGrayscale(!isGrayscale)} className="sr-only peer" />
            <div className="w-14 h-7 bg-gray-300 rounded-full peer peer-focus:ring-2 peer-focus:ring-forest-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-forest-900"></div>
          </div>
        </label>

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={savingTheme} className="flex items-center gap-2 bg-forest-700 hover:bg-forest-800 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-medium text-sm transition">
            {savingTheme ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            บันทึกการเปลี่ยนแปลง
          </button>
        </div>
      </section>

      <section className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-5">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 shrink-0"><Sparkles className="w-6 h-6" /></div>
          <div>
            <h2 className="font-bold text-base md:text-lg text-gray-900">Cover วันสำคัญ</h2>
            <p className="text-xs text-gray-500 mt-0.5">แสดงเต็มหน้าจอก่อนหน้าแรก เมื่อเลื่อนลงจะเข้าสู่เว็บไซต์ตามปกติ</p>
          </div>
        </div>

        <label className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
          <span className="text-sm font-medium text-gray-900">เปิดใช้งาน Cover วันสำคัญ</span>
          <input type="checkbox" checked={coverEnabled} onChange={(event) => setCoverEnabled(event.target.checked)} className="w-5 h-5 rounded text-forest-700 focus:ring-forest-500" />
        </label>

        <div className={`space-y-5 transition ${coverEnabled ? '' : 'opacity-60'}`}>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600">รูปภาพพื้นหลัง</label>
            <div className="flex gap-2">
              <input value={coverFile?.name || coverImage} readOnly placeholder="ยังไม่ได้เลือกรูปภาพ" className={`${inputClass} bg-gray-50`} />
              <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setCoverFile(event.target.files?.[0] || null)} className="hidden" />
              <button type="button" onClick={() => coverInputRef.current?.click()} className="px-4 h-11 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-medium shrink-0 flex items-center gap-1.5 transition">
                <ImageIcon className="w-4 h-4" /> เลือกรูป
              </button>
            </div>
          </div>

          <SizedField label="หัวข้อหลัก" size={coverTitleSize} onSizeChange={setCoverTitleSize}>
            <input value={coverTitle} onChange={(event) => setCoverTitle(event.target.value)} placeholder="เช่น น้อมศิระกรานพระผู้เสด็จสู่สวรรคาลัย" className={inputClass} />
          </SizedField>

          <SizedField label="ข้อความรอง" hint="กด Enter เพื่อขึ้นบรรทัดใหม่" size={coverSubtitleSize} onSizeChange={setCoverSubtitleSize}>
            <textarea value={coverSubtitle} onChange={(event) => setCoverSubtitle(event.target.value)} placeholder="ชื่อบุคคลหรือข้อความรอง" rows={2} className={inputClass} />
          </SizedField>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600">ข้อความประกอบ</label>
            <textarea value={coverMessage} onChange={(event) => setCoverMessage(event.target.value)} placeholder="ข้อความประกอบเพิ่มเติม" rows={2} className={inputClass} />
          </div>

          <SizedField label="วันที่" size={coverDateSize} onSizeChange={setCoverDateSize}>
            <input value={coverDate} onChange={(event) => setCoverDate(event.target.value)} placeholder="เช่น ๑๑ มิถุนายน ๒๕๖๙" className={inputClass} />
          </SizedField>

          <SizedField label="ข้อความลงท้าย" size={coverFooterSize} onSizeChange={setCoverFooterSize}>
            <textarea value={coverFooter} onChange={(event) => setCoverFooter(event.target.value)} placeholder="เช่น ข้าพระพุทธเจ้า ..." rows={3} className={inputClass} />
          </SizedField>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600">ลวดลายเส้นประกอบ (ไม่บังคับ)</label>
            <div className="flex gap-2">
              <input value={coverOrnamentFile?.name || coverOrnament} readOnly placeholder="ยังไม่ได้เลือกลวดลาย" className={`${inputClass} bg-gray-50`} />
              <input ref={coverOrnamentInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setCoverOrnamentFile(event.target.files?.[0] || null)} className="hidden" />
              <button type="button" onClick={() => coverOrnamentInputRef.current?.click()} className="px-4 h-11 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-medium shrink-0 flex items-center gap-1.5 transition">
                <ImageIcon className="w-4 h-4" /> เลือกลวดลาย
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600">ลิงก์ปุ่ม</label>
              <input value={coverLink} onChange={(event) => setCoverLink(event.target.value)} placeholder="/news หรือ https://..." className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-600">ข้อความบนปุ่ม</label>
              <input value={coverLinkText} onChange={(event) => setCoverLinkText(event.target.value)} placeholder="เช่น อ่านเพิ่มเติม" className={inputClass} />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button onClick={handleSaveCover} disabled={savingCover} className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-medium text-sm transition">
            {savingCover ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            บันทึก Cover วันสำคัญ
          </button>
        </div>
      </section>
    </AdminShell>
  );
}
