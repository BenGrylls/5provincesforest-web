'use client';
import React from 'react';

export default function AccessibilityBar() {
  const setRootSize = (size: string) => {
    document.documentElement.style.fontSize = size;
  };

  return (
    <div className="bg-emerald-950 text-emerald-100 text-xs border-b border-emerald-800/70 px-4 py-1.5 select-none">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <span className="text-[11px] text-emerald-300 hidden sm:inline">
          มูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด (ฉะเชิงเทรา ชลบุรี ระยอง จันทบุรี สระแก้ว)
        </span>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-slate-300">ขนาดอักษร:</span>
          <div className="inline-flex rounded border border-emerald-700 bg-emerald-900/60 p-0.5">
            <button
              onClick={() => setRootSize('14px')}
              className="px-2 py-0.5 hover:bg-emerald-800 rounded font-normal text-xs"
              title="ขนาดตัวอักษรเล็ก"
            >
              ก-
            </button>
            <button
              onClick={() => setRootSize('16px')}
              className="px-2 py-0.5 hover:bg-emerald-800 rounded font-semibold text-xs border-x border-emerald-700"
              title="ขนาดตัวอักษรปกติ"
            >
              ก
            </button>
            <button
              onClick={() => setRootSize('18px')}
              className="px-2 py-0.5 hover:bg-emerald-800 rounded font-bold text-xs"
              title="ขนาดตัวอักษรใหญ่"
            >
              ก+
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}