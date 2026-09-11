'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowLeft, ArrowUp, Loader, Plus, Save, Trash2 } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { toast } from '@/components/admin/toast';

type BiographySection = { title: string; content: string };
type President = { name: string; position: string; image_path: string; biography: string; responsibilities: string; biography_sections: BiographySection[] };

export default function PresidentBioManagementPage() {
  const [president, setPresident] = useState<President | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/committee').then(async (response) => {
      if (!response.ok) { setLoading(false); return; }
      const data = await response.json();
      setPresident(data.president);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    if (!president) return;
    setSaving(true);
    const response = await fetch('/api/committee', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'president', ...president, biographySections: president.biography_sections }),
    });
    setSaving(false);
    if (response.ok) toast.success('บันทึกประวัติส่วนบุคคลเรียบร้อยแล้ว');
    else toast.error('บันทึกข้อมูลไม่สำเร็จ');
  };

  const updateSection = (index: number, changes: Partial<BiographySection>) =>
    setPresident((current) => current
      ? { ...current, biography_sections: current.biography_sections.map((section, sectionIndex) => sectionIndex === index ? { ...section, ...changes } : section) }
      : null);

  const addSection = () =>
    setPresident((current) => current ? { ...current, biography_sections: [...current.biography_sections, { title: '', content: '' }] } : null);

  const removeSection = (index: number) =>
    setPresident((current) => current ? { ...current, biography_sections: current.biography_sections.filter((_, sectionIndex) => sectionIndex !== index) } : null);

  const moveSection = (index: number, direction: -1 | 1) => setPresident((current) => {
    if (!current) return null;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= current.biography_sections.length) return current;
    const sections = [...current.biography_sections];
    [sections[index], sections[targetIndex]] = [sections[targetIndex], sections[index]];
    return { ...current, biography_sections: sections };
  });

  const inputClass = 'w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500';

  return (
    <AdminShell
      activeKey="committee"
      title="ประวัติส่วนบุคคลประธานกรรมการ"
      description="เพิ่มหัวข้อและรายละเอียดเพื่อแสดงเป็นประวัติแบบเป็นหมวดหมู่"
      actions={
        <Link href="/admin/committee" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition">
          <ArrowLeft className="w-4 h-4" /> กลับหน้าโครงสร้าง
        </Link>
      }
    >
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex items-center justify-center gap-3 text-gray-500">
          <Loader className="w-5 h-5 animate-spin" /> กำลังโหลดข้อมูล...
        </div>
      ) : !president ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
          ไม่พบข้อมูลประธานกรรมการ
        </div>
      ) : (
        <div className="max-w-3xl space-y-6">
          <section className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 md:p-6 space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600">ประวัติย่อ</label>
            <textarea value={president.biography} onChange={(event) => setPresident({ ...president, biography: event.target.value })} rows={5} className={inputClass} />
          </section>

          <section className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h2 className="font-bold text-gray-900">หัวข้อประวัติ ({president.biography_sections.length})</h2>
              <button type="button" onClick={addSection} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-forest-700 hover:bg-forest-800 text-white rounded-xl transition">
                <Plus className="w-4 h-4" /> เพิ่มหัวข้อ
              </button>
            </div>

            {president.biography_sections.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center text-sm text-gray-500">
                ยังไม่มีหัวข้อประวัติ — กด “เพิ่มหัวข้อ” เพื่อเริ่มต้น
              </div>
            ) : president.biography_sections.map((section, index) => (
              <article key={index} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 md:p-5 space-y-3">
                <div className="flex gap-2 items-start">
                  <div className="flex flex-col gap-1 shrink-0">
                    <button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label="เลื่อนหัวข้อขึ้น" className="p-1.5 text-forest-700 hover:bg-forest-50 rounded-lg disabled:text-gray-300 disabled:hover:bg-transparent transition"><ArrowUp className="w-4 h-4" /></button>
                    <button type="button" onClick={() => moveSection(index, 1)} disabled={index === president.biography_sections.length - 1} aria-label="เลื่อนหัวข้อลง" className="p-1.5 text-forest-700 hover:bg-forest-50 rounded-lg disabled:text-gray-300 disabled:hover:bg-transparent transition"><ArrowDown className="w-4 h-4" /></button>
                  </div>
                  <input value={section.title} onChange={(event) => updateSection(index, { title: event.target.value })} placeholder="ชื่อหัวข้อ เช่น คุณวุฒิการศึกษา" className={`flex-1 ${inputClass} font-medium`} />
                  <button type="button" onClick={() => removeSection(index)} className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition shrink-0" aria-label="ลบหัวข้อ"><Trash2 className="w-4 h-4" /></button>
                </div>
                <textarea value={section.content} onChange={(event) => updateSection(index, { content: event.target.value })} placeholder="รายละเอียด (กด Enter เพื่อขึ้นบรรทัดใหม่)" rows={5} className={inputClass} />
              </article>
            ))}
          </section>

          <section className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 md:p-6 space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600">วิสัยทัศน์หรือภารกิจสำคัญ</label>
            <textarea value={president.responsibilities} onChange={(event) => setPresident({ ...president, responsibilities: event.target.value })} rows={5} className={inputClass} />
          </section>

          <div className="flex justify-end">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-5 py-3 bg-forest-700 hover:bg-forest-800 disabled:bg-gray-400 text-white rounded-xl text-sm font-medium transition">
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} บันทึกประวัติ
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
