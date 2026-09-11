"use client";

import React, { useEffect, useState, useRef } from "react";
import { X, Save, ExternalLink, Upload, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Plus } from "lucide-react";

export interface HistoryImageItem {
  id: string;
  url: string;
  caption?: string;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const multiImagesInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    coverImage: "",
    content: "",
    images: [] as HistoryImageItem[],
  });

  useEffect(() => {
    if (!isOpen) return;
    async function loadData() {
      setLoading(true);
      setStatusMsg(null);
      try {
        const res = await fetch("/api/cms/history");
        const json = await res.json();
        if (json.success && json.data) {
          setForm({
            title: json.data.title || "",
            subtitle: json.data.subtitle || "",
            coverImage: json.data.coverImage || "",
            content: json.data.content || "",
            images: Array.isArray(json.data.images) ? json.data.images : [],
          });
        }
      } catch {
        setStatusMsg({ type: "error", text: "ไม่สามารถโหลดข้อมูลได้" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUploadSingle = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/cms/history/upload", {
      method: "POST",
      body: formData,
    });
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
      setStatusMsg({ type: "success", text: "อัปโหลดภาพหน้าปกสำเร็จ" });
    } else {
      setStatusMsg({ type: "error", text: "อัปโหลดรูปภาพไม่สำเร็จ" });
    }
    setUploadingCover(false);
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
          caption: "",
        });
      }
    }

    if (newItems.length > 0) {
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...newItems],
      }));
      setStatusMsg({ type: "success", text: `อัปโหลดเพิ่ม ${newItems.length} รูปเรียบร้อย` });
    }

    setUploadingImages(false);
    if (multiImagesInputRef.current) multiImagesInputRef.current.value = "";
  };

  const updateCaption = (index: number, caption: string) => {
    setForm((prev) => {
      const updated = [...prev.images];
      updated[index] = { ...updated[index], caption };
      return { ...prev, images: updated };
    });
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    setForm((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.images.length) return prev;
      const updated = [...prev.images];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return { ...prev, images: updated };
    });
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/cms/history", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMsg({ type: "success", text: "บันทึกการแก้ไขเรียบร้อยแล้ว!" });
      } else {
        setStatusMsg({ type: "error", text: data.message || "เกิดข้อผิดพลาด" });
      }
    } catch {
      setStatusMsg({ type: "error", text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-4 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50 shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">แก้ไขประวัติความเป็นมา</h3>
            <p className="text-xs text-gray-500">ใส่ได้ทั้งข้อความ รูปภาพ หรือเลือกใส่เฉพาะรูปภาพได้ตามต้องการ</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/about/history"
              target="_blank"
              rel="noreferrer"
              className="text-xs flex items-center gap-1 text-forest-700 hover:text-forest-800 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition font-medium"
            >
              ดูหน้าเว็บจริง <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-xs font-medium shrink-0 ${
            statusMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}>
            {statusMsg.text}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">กำลังโหลดข้อมูล...</div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto text-sm">
            {/* หัวข้อและคำโปรย (ไม่บังคับ) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">หัวข้อหลัก (Title)</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="ถ้าไม่ต้องการแสดงหัวข้อ ให้เว้นว่างไว้"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">คำบรรยายสั้น (Subtitle)</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="ถ้าไม่ต้องการแสดงคำบรรยาย ให้เว้นว่างไว้"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600 text-sm"
                />
              </div>
            </div>

            {/* รูปภาพหน้าปกหัวเรื่อง */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
              <label className="block text-xs font-semibold text-gray-800 mb-2">รูปภาพหน้าปกหัวเรื่อง (Top Banner Image)</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {form.coverImage ? (
                  <div className="relative w-36 h-20 rounded-lg overflow-hidden border border-gray-300 shadow-sm bg-white shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-36 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-white shrink-0 text-xs">
                    ไม่มีรูปหน้าปก
                  </div>
                )}

                <div className="space-y-2 flex-1 w-full">
                  <input
                    type="file"
                    ref={coverInputRef}
                    onChange={handleCoverChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingCover}
                      onClick={() => coverInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-700 flex items-center gap-1.5 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingCover ? "กำลังอัปโหลด..." : "อัปโหลดภาพหน้าปก"}
                    </button>
                    {form.coverImage && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, coverImage: "" })}
                        className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        ลบรูป
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={form.coverImage}
                    onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                    placeholder="URL ภาพหน้าปก (ถ้ามี)..."
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-forest-600"
                  />
                </div>
              </div>
            </div>

            {/* เนื้อหาข้อความ (ถ้าเป็นรูปภาพล้วน สามารถเว้นว่างส่วนนี้ได้) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700">เนื้อหาข้อความ (ถ้าต้องการแสดงเป็นรูปภาพล้วน ให้เว้นว่างไว้)</label>
                {form.content && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, content: "" })}
                    className="text-[11px] text-rose-500 hover:underline"
                  >
                    ล้างข้อความ
                  </button>
                )}
              </div>
              <textarea
                rows={6}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="กรอกเนื้อหาประวัติความเป็นมา (หากเนื้อหาทั้งหมดเป็นรูปภาพเอกสารอยู่แล้ว สามารถเว้นว่างส่วนนี้ได้)"
                className="w-full p-3.5 border border-gray-200 rounded-xl font-sans text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            {/* ส่วนอัปโหลดและจัดเรียงรูปภาพเนื้อหา */}
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                <div>
                  <label className="block text-sm font-bold text-gray-800">
                    รูปภาพเนื้อหา / เอกสารเรียงต่อกัน ({form.images.length} รูป)
                  </label>
                  <p className="text-xs text-gray-500">
                    รูปภาพจะแสดงเรียงต่อกันลงมาในหน้าเว็บ สามารถเลื่อนลำดับขึ้น-ลงได้ตามต้องการ
                  </p>
                </div>

                <input
                  type="file"
                  ref={multiImagesInputRef}
                  onChange={handleMultipleImagesUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                <button
                  type="button"
                  disabled={uploadingImages}
                  onClick={() => multiImagesInputRef.current?.click()}
                  className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  {uploadingImages ? "กำลังอัปโหลด..." : "เพิ่มรูปภาพ (เลือกหลายไฟล์ได้)"}
                </button>
              </div>

              {form.images.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl bg-white">
                  <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-medium">ยังไม่มีรูปภาพเนื้อหา</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {form.images.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 transition"
                    >
                      <span className="w-6 text-center font-bold text-xs text-gray-400 shrink-0">
                        #{idx + 1}
                      </span>

                      <div className="relative w-28 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.url} alt={item.caption || "Preview"} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 w-full space-y-1">
                        <label className="text-[11px] font-medium text-gray-600">คำบรรยายใต้ภาพ (เว้นว่างได้):</label>
                        <input
                          type="text"
                          value={item.caption || ""}
                          onChange={(e) => updateCaption(idx, e.target.value)}
                          placeholder="คำบรรยายหรือระบุข้อมูลเอกสาร (ไม่จำเป็นต้องใส่)..."
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-forest-600 bg-gray-50/50 focus:bg-white"
                        />
                      </div>

                      <div className="flex sm:flex-col items-center gap-1.5 self-end sm:self-center shrink-0">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveImage(idx, "up")}
                            title="เลื่อนขึ้น"
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 rounded text-gray-700 transition"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === form.images.length - 1}
                            onClick={() => moveImage(idx, "down")}
                            title="เลื่อนลง"
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 rounded text-gray-700 transition"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          title="ลบรูปนี้"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer ปุ่มบันทึก */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-semibold text-white bg-forest-700 hover:bg-forest-800 rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
