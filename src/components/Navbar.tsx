import React from 'react';
import Link from 'next/link';
import { Trees, ChevronDown } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-20">
        
        <Link href="/" className="flex items-center gap-4">
          <div className="w-12 h-12 bg-forest-900 text-amber-400 rounded-full flex items-center justify-center shadow-sm shrink-0">
            <Trees className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-bold text-forest-950 text-lg md:text-xl leading-tight">มูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด</h1>
            <p className="text-[10px] md:text-xs text-forest-700 font-medium tracking-wide uppercase">The 5 Provinces Bordering Forest Preservation Foundation</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-earth-800">
          <Link href="/" className="hover:text-forest-700 transition">หน้าหลัก</Link>
          
          <div className="relative group cursor-pointer py-6">
            <span className="flex items-center gap-1 hover:text-forest-700 transition">
              เกี่ยวกับมูลนิธิฯ <ChevronDown className="w-4 h-4" />
            </span>
            <div className="absolute left-0 top-full hidden group-hover:block w-56 bg-white border border-gray-100 shadow-xl rounded-xl py-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              {/* ลิงก์ไปหน้าย่อยแต่ละหน้าโดยตรง */}
              <Link href="/about/history" className="block px-5 py-2.5 hover:bg-forest-50 hover:text-forest-700">ประวัติความเป็นมา</Link>
              <Link href="/about/objectives" className="block px-5 py-2.5 hover:bg-forest-50 hover:text-forest-700">วัตถุประสงค์และภารกิจ</Link>
            </div>
          </div>

          <div className="relative group cursor-pointer py-6">
            <span className="flex items-center gap-1 hover:text-forest-700 transition">
              โครงสร้างองค์กร <ChevronDown className="w-4 h-4" />
            </span>
            <div className="absolute left-0 top-full hidden group-hover:block w-64 bg-white border border-gray-100 shadow-xl rounded-xl py-3 text-sm">
              {/* ลิงก์ไปหน้าย่อยแต่ละหน้าโดยตรง */}
              <Link href="/committee/president" className="block px-5 py-2.5 hover:bg-forest-50 hover:text-forest-700">ประธานกรรมการ</Link>
              <Link href="/committee/sub-committee" className="block px-5 py-2.5 hover:bg-forest-50 hover:text-forest-700">คณะอนุกรรมการ ๑๐ ฝ่าย</Link>
            </div>
          </div>

          <Link href="/#news" className="hover:text-forest-700 transition">ข่าวสาร</Link>
          <Link href="/#publications" className="hover:text-forest-700 transition">คลังเอกสาร</Link>
        </nav>
      </div>
    </header>
  );
}