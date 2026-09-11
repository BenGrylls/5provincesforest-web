'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, ExternalLink, Image as ImageIcon, Loader, Plus, Save, Trash2 } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { toast } from '@/components/admin/toast';

type President = { name: string; position: string; image_path: string; has_image?: boolean; biography: string; responsibilities: string };
type Unit = { id: number; title: string; description: string; responsibilities: string[]; sort_order: number };

export default function CommitteeManagementPage() {
  const router = useRouter();
  const [president, setPresident] = useState<President | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPresident, setSavingPresident] = useState(false);
  const [savingUnitId, setSavingUnitId] = useState<number | null>(null);
  const [presidentImage, setPresidentImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Unit | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/committee').then(async (response) => {
      if (!response.ok) { router.replace('/admin'); return; }
      const data = await response.json();
      setPresident(data.president);
      setUnits(data.units);
      setLoading(false);
    });
  }, [router]);

  // เดิมเรียก URL.createObjectURL() ตรงใน JSX ทำให้สร้าง blob ใหม่ทุกครั้งที่ re-render โดยไม่เคยคืนหน่วยความจำ
  useEffect(() => {
    if (!presidentImage) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(presidentImage);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [presidentImage]);

  const savePresident = async () => {
    if (!president) return;
    setSavingPresident(true);
    const form = new FormData();
    form.append('type', 'president');
    form.append('name', president.name);
    form.append('position', president.position);
    form.append('biography', president.biography);
    form.append('responsibilities', president.responsibilities);
    form.append('existingImage', president.image_path || '');
    if (presidentImage) form.append('image', presidentImage);

    const response = await fetch('/api/committee', { method: 'PATCH', body: form });
    setSavingPresident(false);
    if (response.ok) {
      setPresident((current) => current ? { ...current, image_path: '/api/committee/president-image', has_image: Boolean(presidentImage) || current.has_image } : null);
      setPresidentImage(null);
      toast.success('บันทึกข้อมูลประธานเรียบร้อยแล้ว');
    } else {
      toast.error('บันทึกข้อมูลประธานไม่สำเร็จ');
    }
  };

  const saveUnit = async (unit: Unit) => {
    setSavingUnitId(unit.id);
    const response = await fetch('/api/committee', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'unit', ...unit }),
    });
    setSavingUnitId(null);
    if (response.ok) toast.success(`บันทึก ${unit.title} เรียบร้อยแล้ว`);
    else toast.error('บันทึกข้อมูลไม่สำเร็จ');
  };

  const updateUnit = (id: number, changes: Partial<Unit>) =>
    setUnits((current) => current.map((unit) => unit.id === id ? { ...unit, ...changes } : unit));

  const addUnit = async () => {
    if (!newUnitTitle.trim()) return;
    const response = await fetch('/api/committee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newUnitTitle }),
    });
    if (response.ok) {
      const unit = await response.json() as Unit;
      setUnits((current) => [...current, unit]);
      setNewUnitTitle('');
      toast.success('เพิ่มฝ่ายใหม่เรียบร้อยแล้ว');
    } else {
      toast.error('เพิ่มฝ่ายไม่สำเร็จ');
    }
  };

  const confirmDeleteUnit = async () => {
    if (!pendingDelete) return;
    const unit = pendingDelete;
    setPendingDelete(null);
    const response = await fetch(`/api/committee?id=${unit.id}`, { method: 'DELETE' });
    if (response.ok) {
      setUnits((current) => current.filter((item) => item.id !== unit.id));
      toast.success(`ลบ ${unit.title} เรียบร้อยแล้ว`);
    } else {
      toast.error('ลบฝ่ายไม่สำเร็จ');
    }
  };

  const moveUnit = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= units.length) return;
    const reordered = [...units];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setUnits(reordered);
    const response = await fetch('/api/committee', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'unit-order', ids: reordered.map((unit) => unit.id) }),
    });
    if (!response.ok) toast.error('บันทึกลำดับฝ่ายไม่สำเร็จ');
  };

  const inputClass = 'w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500';

  return (
    <AdminShell
      activeKey="committee"
      title="โครงสร้างคณะกรรมการ"
      description="แก้ไขข้อมูลประธานและฝ่ายต่างๆ ที่จะปรากฏบนหน้าเว็บไซต์"
    >
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex items-center justify-center gap-3 text-gray-500">
          <Loader className="w-5 h-5 animate-spin" /> กำลังโหลดข้อมูล...
        </div>
      ) : (
        <>
          {president && (
            <section className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 md:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <h2 className="font-bold text-gray-900">ประธานกรรมการ</h2>
                <Link href="/admin/committee/president-bio" className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-700 hover:text-forest-900">
                  แก้ไขประวัติส่วนบุคคล <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <div className="w-20 h-24 bg-gray-100 overflow-hidden rounded-xl shrink-0">
                  {previewUrl ? (
                    <img src={previewUrl} alt="ตัวอย่างรูปประธาน" className="w-full h-full object-cover" />
                  ) : (president.has_image || president.image_path) ? (
                    <img src={president.has_image ? '/api/committee/president-image' : president.image_path} alt="รูปประธาน" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon className="w-6 h-6" /></div>
                  )}
                </div>
                <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPresidentImage(event.target.files?.[0] || null)} className="hidden" />
                <button type="button" onClick={() => imageInputRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2.5 border border-forest-200 hover:bg-forest-50 text-forest-700 rounded-xl text-sm font-medium transition">
                  <ImageIcon className="w-4 h-4" /> เลือกรูปประธาน
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600">ชื่อ-นามสกุล</label>
                  <input value={president.name} onChange={(event) => setPresident({ ...president, name: event.target.value })} placeholder="ชื่อ-นามสกุล" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600">ตำแหน่ง</label>
                  <input value={president.position} onChange={(event) => setPresident({ ...president, position: event.target.value })} placeholder="ตำแหน่ง" className={inputClass} />
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={savePresident} disabled={savingPresident} className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest-700 hover:bg-forest-800 disabled:bg-gray-400 text-white rounded-xl text-sm font-medium transition">
                  {savingPresident ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} บันทึกข้อมูลประธาน
                </button>
              </div>
            </section>
          )}

          <section className="space-y-4">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2">เพิ่มฝ่ายใหม่</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newUnitTitle}
                  onChange={(event) => setNewUnitTitle(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && addUnit()}
                  placeholder="ชื่อฝ่ายใหม่ เช่น ฝ่ายกิจการพิเศษ"
                  className={`flex-1 ${inputClass}`}
                />
                <button onClick={addUnit} disabled={!newUnitTitle.trim()} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 disabled:bg-gray-300 text-white rounded-xl text-sm font-medium transition shrink-0">
                  <Plus className="w-4 h-4" /> เพิ่มฝ่าย
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <h2 className="font-bold text-gray-900">คณะอนุกรรมการ ({units.length} ฝ่าย)</h2>
            </div>

            {units.map((unit, index) => (
              <article key={unit.id} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 md:p-6 space-y-3">
                <div className="flex justify-between items-center gap-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-gray-500 mr-1.5">ฝ่ายที่ {index + 1}</span>
                    <button type="button" onClick={() => moveUnit(index, -1)} disabled={index === 0} aria-label="เลื่อนฝ่ายขึ้น" className="p-1.5 text-forest-700 hover:bg-forest-50 rounded-lg disabled:text-gray-300 disabled:hover:bg-transparent transition"><ArrowUp className="w-4 h-4" /></button>
                    <button type="button" onClick={() => moveUnit(index, 1)} disabled={index === units.length - 1} aria-label="เลื่อนฝ่ายลง" className="p-1.5 text-forest-700 hover:bg-forest-50 rounded-lg disabled:text-gray-300 disabled:hover:bg-transparent transition"><ArrowDown className="w-4 h-4" /></button>
                  </div>
                  <button onClick={() => setPendingDelete(unit)} className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition">
                    <Trash2 className="w-4 h-4" /> ลบฝ่าย
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600">ชื่อฝ่าย</label>
                  <input value={unit.title} onChange={(event) => updateUnit(unit.id, { title: event.target.value })} className={`${inputClass} font-medium`} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600">รายละเอียดฝ่าย</label>
                  <textarea value={unit.description} onChange={(event) => updateUnit(unit.id, { description: event.target.value })} placeholder="อธิบายภาพรวมของฝ่ายนี้" rows={2} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600">ภารกิจ</label>
                  <textarea
                    value={unit.responsibilities.join('\n')}
                    onChange={(event) => updateUnit(unit.id, { responsibilities: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })}
                    placeholder="หนึ่งบรรทัดต่อหนึ่งภารกิจ"
                    rows={4}
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-400">พิมพ์หนึ่งบรรทัดต่อหนึ่งภารกิจ — บรรทัดว่างจะถูกตัดออกอัตโนมัติ</p>
                </div>

                <div className="flex justify-end">
                  <button onClick={() => saveUnit(unit)} disabled={savingUnitId === unit.id} className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 disabled:bg-gray-400 text-white rounded-xl text-sm font-medium transition">
                    {savingUnitId === unit.id ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} บันทึกฝ่ายนี้
                  </button>
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="ลบฝ่ายนี้?"
        description={pendingDelete ? `"${pendingDelete.title}" จะถูกลบออกจากหน้าเว็บไซต์ถาวร` : undefined}
        confirmLabel="ลบถาวร"
        destructive
        onConfirm={confirmDeleteUnit}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminShell>
  );
}
