'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
type Toast = { id: number; kind: ToastKind; text: string };

/**
 * store เล็กๆ ระดับโมดูล เพื่อให้หน้าไหนก็เรียก toast.success(...) ได้
 * โดยไม่ต้องมี provider ครอบหรือส่ง prop ลงไปทีละชั้น
 */
let counter = 0;
let items: Toast[] = [];
const listeners = new Set<(next: Toast[]) => void>();

function emit() {
  listeners.forEach((listener) => listener(items));
}

function push(kind: ToastKind, text: string) {
  const id = ++counter;
  items = [...items, { id, kind, text }];
  emit();
  setTimeout(() => dismiss(id), 4000);
}

function dismiss(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

export const toast = {
  success: (text: string) => push('success', text),
  error: (text: string) => push('error', text),
  info: (text: string) => push('info', text),
};

const STYLES: Record<ToastKind, { wrap: string; icon: React.ComponentType<{ className?: string }> }> = {
  success: { wrap: 'bg-white border-green-200 text-green-900', icon: CheckCircle },
  error: { wrap: 'bg-white border-red-200 text-red-900', icon: AlertCircle },
  info: { wrap: 'bg-white border-gray-200 text-gray-900', icon: Info },
};

const ICON_COLOR: Record<ToastKind, string> = {
  success: 'text-green-600',
  error: 'text-red-600',
  info: 'text-forest-700',
};

export function ToastViewport() {
  const [list, setList] = useState<Toast[]>(items);

  useEffect(() => {
    listeners.add(setList);
    return () => { listeners.delete(setList); };
  }, []);

  if (list.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 sm:max-w-sm" role="status" aria-live="polite">
      {list.map((item) => {
        const style = STYLES[item.kind];
        const Icon = style.icon;
        return (
          <div key={item.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm ${style.wrap}`}>
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${ICON_COLOR[item.kind]}`} />
            <span className="flex-1">{item.text}</span>
            <button type="button" onClick={() => dismiss(item.id)} aria-label="ปิดข้อความ" className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
