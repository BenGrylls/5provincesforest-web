'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Droplet, ExternalLink, Heart, Leaf, Loader, Plus, Save, Shield, Target, Trash2, Users, type LucideIcon } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { EmptyState, ErrorState } from '@/components/admin/States';
import { toast } from '@/components/admin/toast';

type Objective = {
  id: number;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
};

/** ต้องตรงกับ OBJECTIVE_ICONS ใน src/app/api/objectives/route.ts */
const ICONS: { key: string; label: string; icon: LucideIcon; accent: string }[] = [
  { key: 'leaf', label: 'ใบไม้', icon: Leaf, accent: 'bg-forest-50 text-forest-600' },
  { key: 'shield', label: 'โล่', icon: Shield, accent: 'bg-amber-50 text-amber-600' },
  { key: 'target', label: 'เป้าหมาย', icon: Target, accent: 'bg-blue-50 text-blue-600' },
  { key: 'droplet', label: 'หยดน้ำ', icon: Droplet, accent: 'bg-cyan-50 text-cyan-600' },
  { key: 'users', label: 'ผู้คน', icon: Users, accent: 'bg-purple-50 text-purple-600' },
  { key: 'heart', label: 'หัวใจ', icon: Heart, accent: 'bg-rose-50 text-rose-600' },
];

const iconOf = (key: string) => ICONS.find((item) => item.key === key) ?? ICONS[0];

export default function ObjectivesManagementPage() {
  const [items, setItems] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Objective | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch('/api/objectives');
      if (!response.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
      setItems(await response.json());
    } catch (error) {
      setItems([]);
      setLoadError(error instanceof Error ? error.message : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const update = (id: number, changes: Partial<Objective>) =>
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));

  const save = async (item: Objective) => {
    setSavingId(item.id);
    const response = await fetch('/api/objectives', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, title: item.title, description: item.description, icon: item.icon }),
    });
    setSavingId(null);
    if (response.ok) toast.success(`บันทึก "${item.title}" เรียบร้อยแล้ว`);
    else toast.error((await response.json().catch(() => ({}))).error || 'บันทึกไม่สำเร็จ');
  };

  const add = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    const response = await fetch('/api/objectives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    });
    setAdding(false);
    if (response.ok) {
      const created = await response.json();
      setItems((current) => [...current, created]);
      setNewTitle('');
      toast.success('เพิ่มหัวข้อใหม่เรียบร้อยแล้ว');
    } else {
      toast.error('เพิ่มหัวข้อไม่สำเร็จ');
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    const response = await fetch(`/api/objectives?id=${target.id}`, { method: 'DELETE' });
    if (response.ok) {
      setItems((current) => current.filter((item) => item.id !== target.id));
      toast.success(`ลบ "${target.title}" เรียบร้อยแล้ว`);
    } else {
      toast.error('ลบไม่สำเร็จ');
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setItems(reordered);
    const response = await fetch('/api/objectives', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'order', ids: reordered.map((item) => item.id) }),
    });
    if (!response.ok) {
      toast.error('บันทึกลำดับไม่สำเร็จ');
      load();
    }
  };

  const inputClass = 'w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500';

  return (
    <AdminShell
      activeKey="objectives"
      title="วัตถุประสงค์และภารกิจ"
      description="หัวข้อที่แสดงบนหน้า /about/objectives เรียงตามลำดับที่จัดไว้"
      actions={
        <a href="/about/objectives" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition">
          ดูหน้าเว็บจริง <ExternalLink className="w-3.5 h-3.5" />
        </a>
      }
    >
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4">
        <label className="block text-xs font-semibold text-gray-600 mb-2">เพิ่มหัวข้อใหม่</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && add()}
            placeholder="เช่น ๔. ส่งเสริมการศึกษาด้านสิ่งแวดล้อม"
            className={`flex-1 ${inputClass}`}
          />
          <button onClick={add} disabled={!newTitle.trim() || adding} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 disabled:bg-gray-300 text-white rounded-xl text-sm font-medium transition shrink-0">
            {adding ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} เพิ่มหัวข้อ
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex items-center justify-center gap-3 text-gray-500">
          <Loader className="w-5 h-5 animate-spin" /> กำลังโหลดข้อมูล...
        </div>
      ) : loadError ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <ErrorState message={loadError} onRetry={load} />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <EmptyState icon={Target} title="ยังไม่มีหัวข้อ" description="เพิ่มหัวข้อแรกจากช่องด้านบน" />
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
            const selected = iconOf(item.icon);
            const SelectedIcon = selected.icon;
            return (
              <article key={item.id} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 md:p-6 space-y-3">
                <div className="flex justify-between items-center gap-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${selected.accent}`}><SelectedIcon className="w-4 h-4" /></div>
                    <span className="text-xs font-semibold text-gray-500">ลำดับที่ {index + 1}</span>
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="เลื่อนขึ้น" className="p-1.5 text-forest-700 hover:bg-forest-50 rounded-lg disabled:text-gray-300 disabled:hover:bg-transparent transition"><ArrowUp className="w-4 h-4" /></button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="เลื่อนลง" className="p-1.5 text-forest-700 hover:bg-forest-50 rounded-lg disabled:text-gray-300 disabled:hover:bg-transparent transition"><ArrowDown className="w-4 h-4" /></button>
                  </div>
                  <button onClick={() => setPendingDelete(item)} className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition">
                    <Trash2 className="w-4 h-4" /> ลบ
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600">หัวข้อ</label>
                  <input value={item.title} onChange={(event) => update(item.id, { title: event.target.value })} className={`${inputClass} font-medium`} />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600">รายละเอียด</label>
                  <textarea value={item.description} onChange={(event) => update(item.id, { description: event.target.value })} placeholder="อธิบายภารกิจข้อนี้" rows={3} className={inputClass} />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600">ไอคอน</label>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map((option) => {
                      const OptionIcon = option.icon;
                      const active = option.key === item.icon;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => update(item.id, { icon: option.key })}
                          aria-pressed={active}
                          title={option.label}
                          className={`p-3 rounded-xl border-2 transition ${active ? 'border-forest-600 ' + option.accent : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                        >
                          <OptionIcon className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={() => save(item)} disabled={savingId === item.id || !item.title.trim()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 disabled:bg-gray-400 text-white rounded-xl text-sm font-medium transition">
                    {savingId === item.id ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} บันทึกหัวข้อนี้
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="ลบหัวข้อนี้?"
        description={pendingDelete ? `"${pendingDelete.title}" จะถูกลบออกจากหน้าเว็บไซต์ถาวร` : undefined}
        confirmLabel="ลบถาวร"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminShell>
  );
}
