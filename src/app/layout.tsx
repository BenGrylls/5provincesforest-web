import type { Metadata } from 'next';
import { query } from '@/lib/db';
import './globals.css';

export const metadata: Metadata = {
  title: 'มูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด',
  description: 'โครงการอนุรักษ์ทรัพยากรป่าไม้และสัตว์ป่า ในพื้นที่รอยต่อ ๕ จังหวัดภาคตะวันออก',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let isGrayscale = false;
  try {
    const res = await query('SELECT is_grayscale FROM site_settings WHERE id = $1', ['global']);
    if (res.rows.length > 0) {
      isGrayscale = res.rows[0].is_grayscale;
    }
  } catch (e) {
    // ป้องกันกรณีฐานข้อมูลยังไม่พร้อม
  }

  return (
    <html lang="th" className="scroll-smooth">
      <body className={`font-sans bg-earth-100 text-earth-900 ${isGrayscale ? 'grayscale' : ''}`}>
        {children}
      </body>
    </html>
  );
}
