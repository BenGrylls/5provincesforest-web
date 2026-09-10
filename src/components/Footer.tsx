import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 text-xs border-t-4 border-emerald-700" id="contact">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h4 className="text-white font-bold text-sm mb-3">มูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด</h4>
          <p className="text-slate-400 leading-relaxed">
            สำนักงานมูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด เลขที่ ๘๗๒ พหลโยธิน ซอย ๘ ถนนพหลโยธิน แขวงสามเสนใน เขตพญาไท กรุงเทพมหานคร ๑๐๔๐๐
          </p>
          <div className="mt-3 text-slate-300 font-medium">โทรศัพท์: ๐-๒๖๑๖-๙๒๐๙</div>
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
            Copyright © 2026 มูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด. All Rights Reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}