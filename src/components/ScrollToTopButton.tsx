'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

// แสดงปุ่มก็ต่อเมื่อ scroll ลงมาเกินความสูงจอเดียว กันไม่ให้ปุ่มโผล่ตั้งแต่หน้ายังสั้น/ยังไม่ได้เลื่อน
const SHOW_AFTER_PX = 400;

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="เลื่อนกลับขึ้นด้านบนสุด"
      className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-forest-900 text-white shadow-lg flex items-center justify-center hover:bg-forest-800 transition"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
