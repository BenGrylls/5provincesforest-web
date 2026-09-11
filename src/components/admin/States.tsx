'use client';

import React from 'react';
import { AlertCircle, Inbox, type LucideIcon } from 'lucide-react';

/**
 * เดิมทุกตารางเรนเดอร์ tbody เปล่าทั้งตอนกำลังโหลด ตอนไม่มีข้อมูล และตอน fetch พัง
 * ผู้ใช้จึงแยกไม่ออกว่าเกิดอะไรขึ้น
 */

export function TableSkeleton({ rows = 4, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="p-4 space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <div
              key={columnIndex}
              className="h-4 bg-gray-100 rounded animate-pulse"
              style={{ width: columnIndex === 0 ? '40%' : `${Math.max(12, 60 / columns)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-14 text-center space-y-3">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center">
        <Icon className="w-7 h-7" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-gray-900">{title}</p>
        {description && <p className="text-sm text-gray-500 max-w-sm mx-auto">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="px-6 py-14 text-center space-y-3">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
        <AlertCircle className="w-7 h-7" />
      </div>
      <p className="font-semibold text-gray-900">โหลดข้อมูลไม่สำเร็จ</p>
      <p className="text-sm text-gray-500">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-sm font-medium transition">
          ลองอีกครั้ง
        </button>
      )}
    </div>
  );
}
