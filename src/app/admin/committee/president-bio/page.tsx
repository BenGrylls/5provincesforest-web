'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';

type BiographySection = { title: string; content: string };
type President = { name: string; position: string; image_path: string; biography: string; responsibilities: string; biography_sections: BiographySection[] };

export default function PresidentBioManagementPage() {
  const [president, setPresident] = useState<President | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/committee').then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      setPresident(data.president);
    });
  }, []);

  const save = async () => {
    if (!president) return;
    const response = await fetch('/api/committee', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'president', ...president, biographySections: president.biography_sections }),
    });
    setMessage(response.ok ? 'บันทึกประวัติส่วนบุคคลเรียบร้อยแล้ว' : 'บันทึกข้อมูลไม่สำเร็จ');
  };

  const updateSection = (index: number, changes: Partial<BiographySection>) => setPresident((current) => current ? { ...current, biography_sections: current.biography_sections.map((section, sectionIndex) => sectionIndex === index ? { ...section, ...changes } : section) } : null);
  const addSection = () => setPresident((current) => current ? { ...current, biography_sections: [...current.biography_sections, { title: '', content: '' }] } : null);
  const removeSection = (index: number) => setPresident((current) => current ? { ...current, biography_sections: current.biography_sections.filter((_, sectionIndex) => sectionIndex !== index) } : null);
  const moveSection = (index: number, direction: -1 | 1) => setPresident((current) => {
    if (!current) return null;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= current.biography_sections.length) return current;
    const sections = [...current.biography_sections];
    [sections[index], sections[targetIndex]] = [sections[targetIndex], sections[index]];
    return { ...current, biography_sections: sections };
  });

  return <main className="min-h-screen bg-gray-100 p-6 md:p-10"><div className="max-w-3xl mx-auto space-y-6"><Link href="/admin/committee" className="inline-flex items-center gap-2 text-sm font-medium text-forest-700"><ArrowLeft className="w-4 h-4" /> กลับหน้าจัดการโครงสร้างคณะกรรมการ</Link><section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5"><div><h1 className="text-2xl font-bold text-gray-900">แก้ไขประวัติส่วนบุคคลประธานกรรมการ</h1><p className="mt-1 text-sm text-gray-500">เพิ่มหัวข้อและรายละเอียดเพื่อแสดงเป็นประวัติแบบเป็นหมวดหมู่</p></div>{president && <><div><label className="block text-sm font-medium text-gray-700 mb-1">ประวัติย่อ</label><textarea value={president.biography} onChange={(event) => setPresident({ ...president, biography: event.target.value })} rows={5} className="w-full px-4 py-3 border rounded-lg" /></div><div className="space-y-4"><div className="flex justify-between items-center"><h2 className="font-bold text-forest-950">หัวข้อประวัติ</h2><button type="button" onClick={addSection} className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-forest-700 text-white rounded-lg"><Plus className="w-4 h-4" /> เพิ่มหัวข้อ</button></div>{president.biography_sections.map((section, index) => <article key={index} className="border border-gray-200 rounded-lg p-4 space-y-3"><div className="flex gap-2"><div className="flex flex-col gap-1"><button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label="เลื่อนหัวข้อขึ้น" className="p-1.5 text-forest-700 hover:bg-forest-50 rounded disabled:text-gray-300"><ArrowUp className="w-4 h-4" /></button><button type="button" onClick={() => moveSection(index, 1)} disabled={index === president.biography_sections.length - 1} aria-label="เลื่อนหัวข้อลง" className="p-1.5 text-forest-700 hover:bg-forest-50 rounded disabled:text-gray-300"><ArrowDown className="w-4 h-4" /></button></div><input value={section.title} onChange={(event) => updateSection(index, { title: event.target.value })} placeholder="ชื่อหัวข้อ เช่น คุณวุฒิการศึกษา" className="flex-1 px-3 py-2 border rounded-lg font-medium" /><button type="button" onClick={() => removeSection(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" aria-label="ลบหัวข้อ"><Trash2 className="w-4 h-4" /></button></div><textarea value={section.content} onChange={(event) => updateSection(index, { content: event.target.value })} placeholder="รายละเอียด (กด Enter เพื่อขึ้นบรรทัดใหม่)" rows={5} className="w-full px-3 py-2 border rounded-lg" /></article>)}</div><div><label className="block text-sm font-medium text-gray-700 mb-1">วิสัยทัศน์หรือภารกิจสำคัญ</label><textarea value={president.responsibilities} onChange={(event) => setPresident({ ...president, responsibilities: event.target.value })} rows={5} className="w-full px-4 py-3 border rounded-lg" /></div><button onClick={save} className="inline-flex items-center gap-2 px-5 py-3 bg-forest-700 text-white rounded-lg text-sm font-medium"><Save className="w-4 h-4" /> บันทึกประวัติ</button></>}{message && <p className="text-sm text-forest-700">{message}</p>}</section></div></main>;
}