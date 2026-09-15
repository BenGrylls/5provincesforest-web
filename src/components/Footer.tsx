import React from 'react';
import Link from 'next/link';
import { Facebook, Phone } from 'lucide-react';
import ScrollToTopButton from './ScrollToTopButton';

const QUICK_LINKS = [
  { href: '/', label: 'หน้าหลัก' },
  { href: '/about/history', label: 'ประวัติความเป็นมา' },
  { href: '/about/objectives', label: 'วัตถุประสงค์และภารกิจ' },
  { href: '/committee/president', label: 'โครงสร้างองค์กร' },
  { href: '/news', label: 'ข่าวสาร' },
  { href: '/publications', label: 'คลังเอกสาร' },
  { href: '/contact', label: 'ติดต่อหน่วยงานในพื้นที่' },
  { href: '/sitemap', label: 'แผนผังเว็บไซต์' },
];

export default function Footer() {
  return (
    <>
      <footer className="bg-slate-900 text-slate-300 text-xs border-t-4 border-emerald-700" id="contact">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h4 className="text-white font-bold text-sm mb-3">มูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด</h4>
            <p className="text-slate-400 leading-relaxed">
              สำนักงานมูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด เลขที่ ๘๗๒ พหลโยธิน ซอย ๘ ถนนพหลโยธิน แขวงสามเสนใน เขตพญาไท กรุงเทพมหานคร ๑๐๔๐๐
            </p>
            <div className="mt-3 flex flex-col items-start gap-2">
              <a href="tel:0226169209" className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-medium transition">
                <Phone className="w-4 h-4" /> โทรศัพท์: ๐-๒๖๑๖-๙๒๐๙
              </a>
              <Link href="/contact" className="inline-flex items-center text-slate-300 hover:text-white font-medium transition underline underline-offset-2">
                ดูเบอร์ติดต่อหน่วยงานในพื้นที่ทั้งหมด →
              </Link>
              <a
                href="https://www.facebook.com/fiveprovincesforest/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-slate-300 hover:text-white font-medium transition"
              >
                <Facebook className="w-4 h-4" /> เฟซบุ๊กมูลนิธิฯ
              </a>
              
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">ลิงก์ด่วน</h4>
            <ul className="space-y-1.5">
              {QUICK_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-slate-400 hover:text-white transition">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">ขอบเขตพื้นที่ป่ารอยต่อ</h4>
            <ul className="text-slate-400 space-y-1">
              <li>• จังหวัดฉะเชิงเทรา</li>
              <li>• จังหวัดชลบุรี</li>
              <li>• จังหวัดระยอง</li>
              <li>• จังหวัดจันทบุรี</li>
              <li>• จังหวัดสระแก้ว</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-sm mb-3">มาตรฐานเว็บไซต์ภาครัฐ</h4>
            <p className="text-slate-400 leading-relaxed mb-3">
              พัฒนาขึ้นเพื่อสืบสานการอนุรักษ์ทรัพยากรธรรมชาติ สัตว์ป่า ดิน น้ำ และการอยู่ร่วมกันอย่างยั่งยืนระหว่างชุมชนและป่า
            </p>
            <div className="text-slate-500 text-[11px]">
              {/* ปีอัปเดตอัตโนมัติทุกปี ไม่ต้องแก้เองแล้ว */}
              Copyright © {new Date().getFullYear()} มูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด. All Rights Reserved.
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 border-t border-slate-800 pt-5 text-[11px] text-slate-500">
          <Link href="/privacy-policy" className="hover:text-slate-300 transition">นโยบายความเป็นส่วนตัว</Link>
          <span className="hidden sm:inline text-slate-700">|</span>
          <Link href="/security-policy" className="hover:text-slate-300 transition">นโยบายการรักษาความมั่นคงปลอดภัยเว็บไซต์</Link>
          <span className="hidden sm:inline text-slate-700">|</span>
          <Link href="/sitemap" className="hover:text-slate-300 transition">แผนผังเว็บไซต์</Link>
        </div>
      </footer>
      <ScrollToTopButton />
    </>
  );
}