import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AccessibilityBar from '@/components/AccessibilityBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function SecurityPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-earth-100">
      <AccessibilityBar />
      <Navbar />
      <main className="max-w-3xl mx-auto w-full px-4 py-10 md:py-16 flex-1">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest-950 mb-8">
          <ArrowLeft className="w-4 h-4" /> กลับไปหน้าหลัก
        </Link>

        <article className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10 space-y-6 font-serif text-earth-800 leading-8">
          <header className="border-b border-gray-100 pb-6 not-prose">
            <h1 className="text-2xl md:text-3xl font-bold text-forest-950 font-sans">นโยบายการรักษาความมั่นคงปลอดภัยเว็บไซต์</h1>
            <p className="text-sm text-earth-500 mt-2">ปรับปรุงล่าสุด: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </header>

          <p>
            มูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด ตระหนักถึงความสำคัญของความมั่นคงปลอดภัยของระบบเว็บไซต์ และได้กำหนดมาตรการ
            เพื่อป้องกันความเสี่ยงด้านความปลอดภัยไซเบอร์ ดังนี้
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-forest-900 font-sans">๑. การเข้ารหัสการเชื่อมต่อ</h2>
            <p>เว็บไซต์นี้ให้บริการผ่านการเชื่อมต่อที่เข้ารหัส (HTTPS) เพื่อป้องกันการดักจับข้อมูลระหว่างการรับส่งข้อมูลระหว่างเบราว์เซอร์ของผู้ใช้งานกับเซิร์ฟเวอร์</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-forest-900 font-sans">๒. การควบคุมสิทธิ์การเข้าถึง</h2>
            <p>ระบบจัดการเนื้อหาหลังบ้านจำกัดการเข้าถึงเฉพาะผู้ดูแลระบบที่ได้รับอนุญาต โดยแบ่งระดับสิทธิ์การใช้งานตามความรับผิดชอบ และมีการบันทึกประวัติการใช้งาน (audit log) เพื่อการตรวจสอบย้อนหลัง</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-forest-900 font-sans">๓. การป้องกันข้อมูลรหัสผ่าน</h2>
            <p>รหัสผ่านของผู้ดูแลระบบจะถูกจัดเก็บในรูปแบบเข้ารหัส (hashed) ไม่มีการจัดเก็บรหัสผ่านในรูปแบบข้อความธรรมดา</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-forest-900 font-sans">๔. การอัปเดตระบบ</h2>
            <p>ระบบและซอฟต์แวร์ที่ใช้งานได้รับการตรวจสอบและปรับปรุงเป็นระยะ เพื่อลดความเสี่ยงจากช่องโหว่ด้านความปลอดภัยที่อาจเกิดขึ้น</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-forest-900 font-sans">๕. การแจ้งเหตุด้านความปลอดภัย</h2>
            <p>หากท่านพบช่องโหว่หรือความผิดปกติด้านความปลอดภัยของเว็บไซต์ กรุณาแจ้งมายังมูลนิธิฯ ผ่านช่องทางใน<Link href="/contact" className="text-forest-700 underline underline-offset-2 hover:text-forest-900">หน้าติดต่อหน่วยงาน</Link>เพื่อให้ทีมงานดำเนินการตรวจสอบและแก้ไขโดยเร็วที่สุด</p>
          </section>

          <p className="text-xs text-earth-400 border-t border-gray-100 pt-4">
            เอกสารฉบับนี้เป็นแม่แบบเบื้องต้นตามมาตรฐานทั่วไป ควรได้รับการตรวจทานจากผู้บริหารหรือที่ปรึกษากฎหมายของมูลนิธิฯ ก่อนถือเป็นนโยบายทางการ
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
