import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getIsGrayscale } from '@/lib/settings-cache';
import PublicPageViewTracker from '@/components/PublicPageViewTracker';
import GrayscaleThemeSync from '@/components/GrayscaleThemeSync';
import './globals.css';

export const metadata: Metadata = {
  title: 'มูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด',
  description: 'โครงการอนุรักษ์ทรัพยากรป่าไม้และสัตว์ป่า ในพื้นที่รอยต่อ ๕ จังหวัดภาคตะวันออก',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();
  // เดิมยิง query ตรงทุกครั้งที่โหลดหน้า (ทุกหน้าทั่วเว็บ เพราะอยู่ใน root layout) ทำให้ช้าโดยไม่จำเป็น
  const isGrayscale = await getIsGrayscale();

  return (
    <html lang="th" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className="font-sans bg-earth-100 text-earth-900">
        <PublicPageViewTracker />
        <GrayscaleThemeSync initialIsGrayscale={isGrayscale} />
        {children}
      </body>
    </html>
  );
}