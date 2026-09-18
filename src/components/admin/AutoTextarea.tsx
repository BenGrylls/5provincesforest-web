'use client';

import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * textarea ที่ขยายความสูงเองอัตโนมัติตามจำนวนบรรทัดเนื้อหา
 * ใช้แทน <textarea rows={n}> ธรรมดาตรงๆ ได้เลย (รองรับ props เดิมทุกตัว)
 *
 * ทำงานโดยวัด scrollHeight จริงของเนื้อหาแล้วตั้ง height ให้พอดี ทุกครั้งที่ value เปลี่ยน
 * (ทั้งตอนผู้ใช้พิมพ์ และตอนโหลดข้อมูลมาใส่ครั้งแรกจาก API)
 */
export default function AutoTextarea({ value, className, style, ...rest }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto'; // รีเซ็ตก่อน ไม่งั้นถ้าเนื้อหาสั้นลงความสูงจะไม่ลดตาม
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      className={className}
      style={{ ...style, overflow: 'hidden', resize: 'none' }}
      {...rest}
    />
  );
}
