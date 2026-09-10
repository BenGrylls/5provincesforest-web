import React from 'react';
import { History } from 'lucide-react';
import AccessibilityBar from '@/components/AccessibilityBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function HistoryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-earth-100">
      <AccessibilityBar />
      <Navbar />
      <div className="bg-forest-950 py-16 text-center border-b-4 border-amber-500">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">ประวัติความเป็นมา</h1>
        <p className="text-earth-100 font-serif max-w-2xl mx-auto px-4">จุดเริ่มต้นของการพิทักษ์ผืนป่ารอยต่อ ๕ จังหวัด</p>
      </div>
      <main className="max-w-4xl mx-auto px-4 py-16 flex-1 w-full">
        <section className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
            <div className="p-3 bg-forest-50 rounded-xl"><History className="w-6 h-6 text-forest-700" /></div>
            <h2 className="text-2xl font-bold text-forest-950">กำเนิดมูลนิธิฯ</h2>
          </div>
          <div className="prose prose-earth font-serif leading-relaxed text-earth-800 space-y-4">
            <p>ป่ารอยต่อ ๕ จังหวัด (ฉะเชิงเทรา ชลบุรี ระยอง จันทบุรี สระแก้ว) เป็นผืนป่าที่ราบต่ำที่อุดมสมบูรณ์ที่สุดแห่งสุดท้ายในภาคตะวันออก แต่ในอดีตประสบปัญหาการบุกรุกพื้นที่ป่าและการลักลอบล่าสัตว์อย่างหนัก</p>
            <p>ด้วยสำนึกในพระมหากรุณาธิคุณของสมเด็จพระนางเจ้าสิริกิติ์ พระบรมราชินีนาถ พระบรมราชชนนีพันปีหลวง ที่ทรงห่วงใยทรัพยากรธรรมชาติ หน่วยงานภาครัฐ กองทัพบก และภาคประชาชน จึงได้ร่วมกันจัดตั้ง <strong>"มูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด"</strong> ขึ้น เพื่อเป็นองค์กรกลางในการระดมทุน บูรณาการการทำงาน และช่วยเหลือฟื้นฟูสภาพป่า</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}