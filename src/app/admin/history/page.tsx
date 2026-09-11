'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, Image as ImageIcon, Loader, Plus, Save, Trash2, Upload } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import { toast } from '@/components/admin/toast';

export interface HistoryImageItem {
  id: string;
  url: string;
  caption?: string;
}

export default function HistoryManagementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const multiImagesInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    coverImage: '',
    content: '',
    images: [] as HistoryImageItem[],
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch('/api/cms/history');
        const json = await res.json();
        if (json.success && json.data) {
          setForm({
            title: json.data.title || '',
            subtitle: json.data.subtitle || '',
            coverImage: json.data.coverImage || '',
            content: json.data.content || '',
            images: Array.isArray(json.data.images) ? json.data.images : [],
          });
        }
      } catch {
        toast.error('ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUploadSingle = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/cms/history/upload', { method: 'POST', body: formData });
    const data = await res.json();
    return data.success ? data.url : null;
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const url = await handleUploadSingle(file);
    if (url) {
      setForm((prev) => ({ ...prev, coverImage: url }));
      toast.success('อัปโหลดภาพหน้าปกสำเร็จ');
    } else {
      toast.error('อัปโหลดรูปภาพไม่สำเร็จ');
    }
    setUploadingCover(false);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleMultipleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const newItems: HistoryImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const url = await handleUploadSingle(files[i]);
      if (url) {
        newItems.push({
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          url,
          caption: '',
        });
      }
    }

    if (newItems.length > 0) {
      setForm((prev) => ({ ...prev, images: [...prev.images, ...newItems] }));
      toast.success(`อัปโหลดเพิ่ม ${newItems.length} รูปเรียบร้อย`);
    } else {
      toast.error('อัปโหลดรูปภาพไม่สำเร็จ');
    }

    setUploadingImages(false);
    if (multiImagesInputRef.current) multiImagesInputRef.current.value = '';
  };

  const updateCaption = (index: number, caption: string) => {
    setForm((prev) => {
      const updated = [...prev.images];
      updated[index] = { ...updated[index], caption };
      return { ...prev, images: updated };
    });
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    setForm((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.images.length) return prev;
      const updated = [...prev.images];
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
      return { ...prev, images: updated };
    });
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/cms/history', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) toast.success('บันทึกการแก้ไขเรียบร้อยแล้ว');
      else toast.error(data.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500';

  return (
    <AdminShell
      activeKey="history"
      title="ประวัติความเป็นมา"
      description="ใส่ได้ทั้งข้อความ รูปภาพ หรือเลือกใส่เฉพาะรูปภาพได้ตามต้องการ"
      actions={
        <a
          href="/about/history"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition"
        >
          ดูหน้าเว็บจริง <ExternalLink className="w-3.5 h-3.5" />
        </a>
      }
    >
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex items-center justify-center gap-3 text-gray-500">
          <Loader className="w-5 h-5 animate-spin" /> กำลังโหลดข้อมูล...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 space-y-4">
            <h2 className="font-bold text-gray-900 border-b border-gray-100 pb-3">หัวเรื่อง</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600">หัวข้อหลัก</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="เว้นว่างไว้ถ้าไม่ต้องการแสดงหัวข้อ"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600">คำบรรยายสั้น</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="เว้นว่างไว้ถ้าไม่ต้องการแสดงคำบรรยาย"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-600">รูปภาพหน้าปก (Top Banner)</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {form.coverImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={form.coverImage} alt="ตัวอย่างภาพหน้าปก" className="w-36 h-20 rounded-lg object-cover border border-gray-200 shrink-0" />
                ) : (
                  <div className="w-36 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs shrink-0">
                    ไม่มีรูปหน้าปก
                  </div>
                )}

                <div className="space-y-2 flex-1 w-full">
                  <input type="file" ref={coverInputRef} onChange={handleCoverChange} accept="image/*" className="hidden" />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingCover}
                      onClick={() => coverInputRef.current?.click()}
                      className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 rounded-xl text-sm font-medium text-gray-700 flex items-center gap-2 transition"
                    >
                      {uploadingCover ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploadingCover ? 'กำลังอัปโหลด...' : 'อัปโหลดภาพหน้าปก'}
                    </button>
                    {form.coverImage && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, coverImage: '' })}
                        className="px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition"
                      >
                        ลบรูป
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={form.coverImage}
                    onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                    placeholder="หรือวาง URL ภาพหน้าปกที่นี่"
                    className="w-full px-3 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 space-y-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="font-bold text-gray-900">เนื้อหาข้อความ</h2>
              {form.content && (
                <button type="button" onClick={() => setForm({ ...form, content: '' })} className="text-xs text-red-500 hover:underline">
                  ล้างข้อความ
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500">ถ้าต้องการแสดงเป็นรูปภาพล้วน ให้เว้นว่างส่วนนี้ไว้</p>
            <textarea
              rows={8}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="กรอกเนื้อหาประวัติความเป็นมา"
              className={`${inputClass} leading-relaxed`}
            />
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">รูปภาพเนื้อหา ({form.images.length} รูป)</h2>
                <p className="text-xs text-gray-500 mt-0.5">แสดงเรียงต่อกันลงมาในหน้าเว็บ เลื่อนลำดับขึ้น-ลงได้</p>
              </div>
              <input type="file" ref={multiImagesInputRef} onChange={handleMultipleImagesUpload} accept="image/*" multiple className="hidden" />
              <button
                type="button"
                disabled={uploadingImages}
                onClick={() => multiImagesInputRef.current?.click()}
                className="px-4 py-2.5 bg-forest-700 hover:bg-forest-800 disabled:bg-gray-400 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition shrink-0"
              >
                {uploadingImages ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {uploadingImages ? 'กำลังอัปโหลด...' : 'เพิ่มรูปภาพ'}
              </button>
            </div>

            {form.images.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">ยังไม่มีรูปภาพเนื้อหา</p>
                <p className="text-xs text-gray-400 mt-1">เลือกได้หลายไฟล์พร้อมกัน</p>
              </div>
            ) : (
              <div className="space-y-3">
                {form.images.map((item, idx) => (
                  <div key={item.id || idx} className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <span className="w-6 text-center font-bold text-xs text-gray-400 shrink-0">#{idx + 1}</span>

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.caption || 'ตัวอย่างรูปภาพ'} className="w-28 h-20 rounded-lg object-cover bg-gray-100 border border-gray-200 shrink-0" />

                    <div className="flex-1 w-full space-y-1.5">
                      <label className="block text-xs font-medium text-gray-600">คำบรรยายใต้ภาพ (เว้นว่างได้)</label>
                      <input
                        type="text"
                        value={item.caption || ''}
                        onChange={(e) => updateCaption(idx, e.target.value)}
                        placeholder="คำบรรยายหรือข้อมูลเอกสาร"
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-forest-500"
                      />
                    </div>

                    <div className="flex sm:flex-col items-center gap-1.5 self-end sm:self-center shrink-0">
                      <div className="flex items-center gap-1">
                        <button type="button" disabled={idx === 0} onClick={() => moveImage(idx, 'up')} aria-label="เลื่อนขึ้น" className="p-2 bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-30 rounded-lg text-gray-700 transition">
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" disabled={idx === form.images.length - 1} onClick={() => moveImage(idx, 'down')} aria-label="เลื่อนลง" className="p-2 bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-30 rounded-lg text-gray-700 transition">
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button type="button" onClick={() => removeImage(idx)} aria-label="ลบรูปนี้" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-forest-700 hover:bg-forest-800 disabled:bg-gray-400 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </form>
      )}
    </AdminShell>
  );
}
