'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Image as ImageIcon, Plus, Save, Trash2, Users } from 'lucide-react';

type President = { name: string; position: string; image_path: string; has_image?: boolean; biography: string; responsibilities: string };
type Unit = { id: number; title: string; description: string; responsibilities: string[]; sort_order: number };

export default function CommitteeManagementPage() {
  const router = useRouter();
  const [president, setPresident] = useState<President | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [message, setMessage] = useState('');
  const [presidentImage, setPresidentImage] = useState<File | null>(null);
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/committee').then(async (response) => {
      if (!response.ok) { router.replace('/admin'); return; }
      const data = await response.json();
      setPresident(data.president); setUnits(data.units);
    });
  }, [router]);

  const savePresident = async () => {
    if (!president) return;
    const form = new FormData();
    form.append('type', 'president'); form.append('name', president.name); form.append('position', president.position); form.append('biography', president.biography); form.append('responsibilities', president.responsibilities); form.append('existingImage', president.image_path || '');
    if (presidentImage) form.append('image', presidentImage);
    const response = await fetch('/api/committee', { method: 'PATCH', body: form });
    if (response.ok) { setPresident((current) => current ? { ...current, image_path: '/api/committee/president-image', has_image: Boolean(presidentImage) || current.has_image } : null); setMessage('บันทึกข้อมูลประธานเรียบร้อยแล้ว'); setPresidentImage(null); } else setMessage('บันทึกข้อมูลไม่สำเร็จ');
  };

  const saveUnit = async (unit: Unit) => {
    const response = await fetch('/api/committee', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'unit', ...unit }) });
    setMessage(response.ok ? `บันทึก ${unit.title} เรียบร้อยแล้ว` : 'บันทึกข้อมูลไม่สำเร็จ');
  };

  const updateUnit = (id: number, changes: Partial<Unit>) => setUnits((current) => current.map((unit) => unit.id === id ? { ...unit, ...changes } : unit));
  const addUnit = async () => {
    if (!newUnitTitle.trim()) return;
    const response = await fetch('/api/committee', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newUnitTitle }) });
    if (response.ok) {
      const unit = await response.json() as Unit;
      setUnits((current) => [...current, unit]);
      setNewUnitTitle('');
      setMessage('เพิ่มฝ่ายใหม่เรียบร้อยแล้ว');
    } else setMessage('เพิ่มฝ่ายไม่สำเร็จ');
  };
  const deleteUnit = async (unit: Unit) => {
    if (!confirm(`ยืนยันการลบ ${unit.title} ใช่หรือไม่?`)) return;
    const response = await fetch(`/api/committee?id=${unit.id}`, { method: 'DELETE' });
    if (response.ok) { setUnits((current) => current.filter((item) => item.id !== unit.id)); setMessage('ลบฝ่ายเรียบร้อยแล้ว'); } else setMessage('ลบฝ่ายไม่สำเร็จ');
  };
  const moveUnit = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= units.length) return;
    const reordered = [...units];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setUnits(reordered);
    const response = await fetch('/api/committee', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'unit-order', ids: reordered.map((unit) => unit.id) }) });
    setMessage(response.ok ? 'บันทึกลำดับฝ่ายเรียบร้อยแล้ว' : 'บันทึกลำดับฝ่ายไม่สำเร็จ');
  };

  return <main className="min-h-screen bg-gray-100 p-6 md:p-10"><div className="max-w-5xl mx-auto space-y-6"><header className="flex items-center gap-3"><Users className="w-7 h-7 text-forest-700" /><div><h1 className="text-2xl font-bold text-gray-900">จัดการโครงสร้างคณะกรรมการ</h1><p className="text-sm text-gray-500">แก้ไขข้อมูลที่จะปรากฏบนหน้าเว็บไซต์</p></div></header>{message && <p className="bg-green-50 text-green-800 px-4 py-3 rounded-lg text-sm">{message}</p>}
    {president && <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4"><div className="flex items-center justify-between gap-4"><h2 className="font-bold text-forest-950">ประธานกรรมการ</h2><Link href="/admin/committee/president-bio" className="text-sm font-medium text-forest-700 hover:text-forest-900">แก้ไขประวัติส่วนบุคคล</Link></div><div className="flex gap-4 items-center"><div className="w-20 h-24 bg-gray-100 overflow-hidden rounded-lg">{presidentImage ? <img src={URL.createObjectURL(presidentImage)} alt="ตัวอย่างรูปประธาน" className="w-full h-full object-cover" /> : (president.has_image || president.image_path) ? <img src={president.has_image ? '/api/committee/president-image' : president.image_path} alt="รูปประธาน" className="w-full h-full object-cover" /> : null}</div><input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPresidentImage(event.target.files?.[0] || null)} className="hidden" /><button type="button" onClick={() => imageInputRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 border border-forest-200 text-forest-700 rounded-lg text-sm"><ImageIcon className="w-4 h-4" /> เลือกรูปประธาน</button></div><input value={president.name} onChange={(event) => setPresident({ ...president, name: event.target.value })} placeholder="ชื่อ-นามสกุล" className="w-full px-4 py-3 border rounded-lg" /><input value={president.position} onChange={(event) => setPresident({ ...president, position: event.target.value })} placeholder="ตำแหน่ง" className="w-full px-4 py-3 border rounded-lg" /><button onClick={savePresident} className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest-700 text-white rounded-lg text-sm"><Save className="w-4 h-4" /> บันทึกข้อมูลประธาน</button></section>}
    <section className="space-y-4"><h2 className="font-bold text-forest-950">คณะอนุกรรมการ</h2><div className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-3"><input value={newUnitTitle} onChange={(event) => setNewUnitTitle(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addUnit()} placeholder="ชื่อฝ่ายใหม่" className="flex-1 px-4 py-2.5 border rounded-lg text-sm" /><button onClick={addUnit} className="inline-flex items-center gap-2 px-4 py-2 bg-forest-700 text-white rounded-lg text-sm"><Plus className="w-4 h-4" /> เพิ่มฝ่าย</button></div>{units.map((unit, index) => <article key={unit.id} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-3"><div className="flex justify-between gap-3"><div className="flex items-center gap-2"><p className="text-xs text-earth-500">ฝ่ายที่ {index + 1}</p><button type="button" onClick={() => moveUnit(index, -1)} disabled={index === 0} aria-label="เลื่อนฝ่ายขึ้น" className="p-1 text-forest-700 hover:bg-forest-50 rounded disabled:text-gray-300"><ArrowUp className="w-4 h-4" /></button><button type="button" onClick={() => moveUnit(index, 1)} disabled={index === units.length - 1} aria-label="เลื่อนฝ่ายลง" className="p-1 text-forest-700 hover:bg-forest-50 rounded disabled:text-gray-300"><ArrowDown className="w-4 h-4" /></button></div><button onClick={() => deleteUnit(unit)} className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /> ลบฝ่าย</button></div><input value={unit.title} onChange={(event) => updateUnit(unit.id, { title: event.target.value })} className="w-full px-4 py-3 border rounded-lg font-medium" /><textarea value={unit.description} onChange={(event) => updateUnit(unit.id, { description: event.target.value })} placeholder="รายละเอียดฝ่าย" rows={2} className="w-full px-4 py-3 border rounded-lg" /><textarea value={unit.responsibilities.join('\n')} onChange={(event) => updateUnit(unit.id, { responsibilities: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })} placeholder="ภารกิจแต่ละข้อ (หนึ่งบรรทัดต่อหนึ่งข้อ)" rows={4} className="w-full px-4 py-3 border rounded-lg" /><button onClick={() => saveUnit(unit)} className="inline-flex items-center gap-2 px-4 py-2 bg-forest-700 text-white rounded-lg text-sm"><Save className="w-4 h-4" /> บันทึกฝ่ายนี้</button></article>)}</section>
  </div></main>;
}