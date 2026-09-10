import React from 'react';
import { Target, Leaf, Shield } from 'lucide-react';
import AccessibilityBar from '@/components/AccessibilityBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ObjectivesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-earth-100">
      <AccessibilityBar />
      <Navbar />
      <div className="bg-forest-950 py-16 text-center border-b-4 border-amber-500">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">วัตถุประสงค์และภารกิจ</h1>
        <p className="text-earth-100 font-serif max-w-2xl mx-auto px-4">เป้าหมายเพื่อความยั่งยืนของระบบนิเวศและชุมชน</p>
      </div>
      <main className="max-w-5xl mx-auto px-4 py-16 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="p-3 bg-forest-50 text-forest-600 rounded-xl w-fit mb-4"><Leaf className="w-6 h-6" /></div>
            <h3 className="font-bold text-forest-900 mb-2">๑. ฟื้นฟูและอนุรักษ์ผืนป่า</h3>
            <p className="text-sm text-earth-600 font-serif leading-relaxed">ส่งเสริมการปลูกป่า สร้างฝายชะลอน้ำ และปกป้องพื้นที่ป่าไม้จากการถูกทำลาย</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl w-fit mb-4"><Shield className="w-6 h-6" /></div>
            <h3 className="font-bold text-forest-900 mb-2">๒. อนุรักษ์สัตว์ป่า</h3>
            <p className="text-sm text-earth-600 font-serif leading-relaxed">จัดทำโป่งเทียม แหล่งน้ำ และแก้ปัญหาความขัดแย้งระหว่างคนกับช้างป่าอย่างสันติวิธี</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit mb-4"><Target className="w-6 h-6" /></div>
            <h3 className="font-bold text-forest-900 mb-2">๓. พัฒนาคุณภาพชีวิตราษฎร</h3>
            <p className="text-sm text-earth-600 font-serif leading-relaxed">สนับสนุนอาชีพ ให้ทุนการศึกษา และสร้างแนวกันชนเพื่อให้ชุมชนพึ่งพาตนเองได้โดยไม่บุกรุกป่า</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}