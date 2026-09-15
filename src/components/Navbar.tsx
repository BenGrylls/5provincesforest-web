'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';

const ABOUT_LINKS = [
  { href: '/about/history', label: 'ประวัติความเป็นมา' },
  { href: '/about/objectives', label: 'วัตถุประสงค์และภารกิจ' },
];

const STRUCTURE_LINKS = [
  { href: '/committee/president', label: 'ประธานกรรมการ' },
  { href: '/committee/sub-committee', label: 'คณะอนุกรรมการ' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [structureOpen, setStructureOpen] = useState(false);

  const closeAll = () => {
    setMobileOpen(false);
    setAboutOpen(false);
    setStructureOpen(false);
  };

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-20">

        <Link href="/" className="flex items-center gap-4" onClick={closeAll}>
          <img src="/images/logo.png" alt="โลโก้มูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด" className="w-12 h-12 rounded-full object-cover shadow-sm shrink-0" />
          <div>
            <h1 className="font-bold text-forest-950 text-lg md:text-xl leading-tight">มูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด</h1>
            <p className="text-[10px] md:text-xs text-forest-700 font-medium tracking-wide uppercase">The 5 Provinces Bordering Forest Preservation Foundation</p>
          </div>
        </Link>

        {/* เมนูเดสก์ท็อป — แสดงตั้งแต่ lg (1024px) ขึ้นไป */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-earth-800">
          <Link href="/" className="hover:text-forest-700 transition">หน้าหลัก</Link>

          <div className="relative group cursor-pointer py-6">
            <span className="flex items-center gap-1 hover:text-forest-700 transition">
              เกี่ยวกับมูลนิธิฯ <ChevronDown className="w-4 h-4" />
            </span>
            <div className="absolute left-0 top-full hidden group-hover:block w-56 bg-white border border-gray-100 shadow-xl rounded-xl py-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              {ABOUT_LINKS.map((item) => (
                <Link key={item.href} href={item.href} className="block px-5 py-2.5 hover:bg-forest-50 hover:text-forest-700">{item.label}</Link>
              ))}
            </div>
          </div>

          <div className="relative group cursor-pointer py-6">
            <span className="flex items-center gap-1 hover:text-forest-700 transition">
              โครงสร้างองค์กร <ChevronDown className="w-4 h-4" />
            </span>
            <div className="absolute left-0 top-full hidden group-hover:block w-64 bg-white border border-gray-100 shadow-xl rounded-xl py-3 text-sm">
              {STRUCTURE_LINKS.map((item) => (
                <Link key={item.href} href={item.href} className="block px-5 py-2.5 hover:bg-forest-50 hover:text-forest-700">{item.label}</Link>
              ))}
            </div>
          </div>

          <Link href="/news" className="hover:text-forest-700 transition">ข่าวสาร</Link>
          <Link href="/publications" className="hover:text-forest-700 transition">คลังเอกสาร</Link>
        </nav>

        {/* ปุ่ม hamburger — แสดงเฉพาะต่ำกว่า lg (มือถือ/แท็บเล็ต/ย่อหน้าต่าง) */}
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
          className="lg:hidden p-2 -mr-2 text-forest-900 hover:bg-forest-50 rounded-lg transition"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* แผงเมนูมือถือ — พับ/กางแบบ accordion สำหรับสองเมนูที่มีเมนูย่อย */}
      {mobileOpen && (
        <nav className="lg:hidden border-t border-gray-100 bg-white px-4 pb-3 text-sm font-medium text-earth-800">
          <Link href="/" onClick={closeAll} className="block py-3 hover:text-forest-700">หน้าหลัก</Link>

          <div className="border-t border-gray-50">
            <button
              type="button"
              onClick={() => setAboutOpen((open) => !open)}
              aria-expanded={aboutOpen}
              className="w-full flex items-center justify-between py-3 hover:text-forest-700"
            >
              เกี่ยวกับมูลนิธิฯ
              <ChevronDown className={`w-4 h-4 transition-transform ${aboutOpen ? 'rotate-180' : ''}`} />
            </button>
            {aboutOpen && (
              <div className="pb-2 pl-4">
                {ABOUT_LINKS.map((item) => (
                  <Link key={item.href} href={item.href} onClick={closeAll} className="block py-2 text-earth-800/90 hover:text-forest-700">
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-50">
            <button
              type="button"
              onClick={() => setStructureOpen((open) => !open)}
              aria-expanded={structureOpen}
              className="w-full flex items-center justify-between py-3 hover:text-forest-700"
            >
              โครงสร้างองค์กร
              <ChevronDown className={`w-4 h-4 transition-transform ${structureOpen ? 'rotate-180' : ''}`} />
            </button>
            {structureOpen && (
              <div className="pb-2 pl-4">
                {STRUCTURE_LINKS.map((item) => (
                  <Link key={item.href} href={item.href} onClick={closeAll} className="block py-2 text-earth-800/90 hover:text-forest-700">
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/news" onClick={closeAll} className="block py-3 border-t border-gray-50 hover:text-forest-700">ข่าวสาร</Link>
          <Link href="/publications" onClick={closeAll} className="block py-3 border-t border-gray-50 hover:text-forest-700">คลังเอกสาร</Link>
        </nav>
      )}
    </header>
  );
}