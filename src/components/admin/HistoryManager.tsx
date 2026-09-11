"use client";

import React, { useEffect, useState } from "react";

export default function HistoryManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    coverImage: "",
    content: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/cms/history");
        const json = await res.json();
        if (json.success && json.data) {
          setForm({
            title: json.data.title || "",
            subtitle: json.data.subtitle || "",
            coverImage: json.data.coverImage || "",
            content: json.data.content || "",
          });
        }
      } catch {
        setStatusMsg({ type: "error", text: "ไม่สามารถโหลดข้อมูลได้" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

  if (loading) {
    return <div className="p-6 text-slate-500">กำลังโหลดข้อมูลประวัติความเป็นมา...</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">จัดการเนื้อหา: ประวัติความเป็นมา (/about/history)</h2>
          <p className="text-xs text-slate-500 mt-0.5">แก้ไขหัวข้อ ภาพหน้าปก และเนื้อหาที่จะแสดงบนหน้าเว็บไซต์</p>
        </div>
        <a
          href="/about/history"
          target="_blank"
          rel="noreferrer"
          className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition font-medium"
        >
          ดูหน้าเว็บจริง ↗
        </a>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 mb-5 rounded-lg text-sm ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">หัวข้อหลัก (Title)</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">คำบรรยายสั้น (Subtitle)</label>
          <input
            type="text"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            className="w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">URL รูปภาพหน้าปก (Cover Image)</label>
          <input
            type="text"
            value={form.coverImage}
            onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
            placeholder="/images/history.jpg หรือ https://..."
            className="w-full px-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">เนื้อหาประวัติความเป็นมา (Content)</label>
          <textarea
            rows={10}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="พิมพ์รายละเอียดเนื้อหาที่นี่..."
            className="w-full p-3.5 border rounded-lg text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow transition disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
        </div>
      </form>
    </div>
  );
}
