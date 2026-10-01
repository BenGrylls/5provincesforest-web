import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AccessibilityBar from '@/components/AccessibilityBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
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
            <h1 className="text-2xl md:text-3xl font-bold text-forest-950 font-sans">นโยบายความเป็นส่วนตัว (Privacy Policy)</h1>
            <p className="text-sm text-earth-500 mt-2">ปรับปรุงล่าสุด: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </header>

          <p>
            มูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด (&quot;มูลนิธิฯ&quot;) ให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคลของผู้ใช้งานเว็บไซต์
            ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒ (PDPA) นโยบายฉบับนี้อธิบายว่ามูลนิธิฯ เก็บรวบรวม ใช้
            และเปิดเผยข้อมูลส่วนบุคคลอย่างไรเมื่อท่านใช้งานเว็บไซต์นี้
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-forest-900 font-sans">๑. ข้อมูลที่จัดเก็บ</h2>
            <p>เว็บไซต์จัดเก็บสถิติการเปิดหน้าเว็บเป็นยอดรวมรายวันแยกตามหน้า โดยหน้าเนื้อหาสาธารณะอาจบันทึกเส้นทางและชื่อเรื่อง เช่น รหัสหน้า media เพื่อสรุปว่าหน้าใดได้รับความสนใจ โดยไม่บันทึก IP address, user-agent, referrer, cookie หรือรหัสที่ใช้ระบุตัวผู้เข้าชมไว้ในสถิติดังกล่าว และไม่นับหน้าในระบบผู้ดูแล</p>
            <p>เพื่อรักษาความปลอดภัย ระบบอาจบันทึกข้อมูลทางเทคนิค เช่น IP address, user-agent และรายละเอียดเหตุการณ์ เมื่อพบการเข้าสู่ระบบล้มเหลว การเรียกใช้งานเกินกำหนด หรือความพยายามเข้าถึงที่ไม่ได้รับอนุญาต ข้อมูลนี้ใช้เพื่อป้องกันและตรวจสอบเหตุผิดปกติ ไม่ใช้สร้างประวัติการเข้าชมรายบุคคล</p>
            <p>หากท่านติดต่อมูลนิธิฯ ผ่านช่องทางภายนอก เช่น โทรศัพท์ หรือ Facebook ข้อมูลจะเป็นไปตามนโยบายของช่องทางนั้น</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-forest-900 font-sans">๒. วัตถุประสงค์ในการใช้ข้อมูล</h2>
            <p>มูลนิธิฯ ใช้สถิติแบบรวมเพื่อประเมินการใช้งานและปรับปรุงเว็บไซต์ และใช้ข้อมูลทางเทคนิคด้านความปลอดภัยเพื่อป้องกัน ตรวจสอบ และตอบสนองต่อเหตุผิดปกติ โดยไม่ใช้สถิติการเข้าชมเพื่อโฆษณาหรือระบุตัวบุคคล</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-forest-900 font-sans">๓. ระยะเวลาจัดเก็บ</h2>
            <p>สถิติการเปิดหน้าเว็บแบบรวมจัดเก็บไม่เกิน ๙๐ วัน ส่วนบันทึกเหตุการณ์ด้านความปลอดภัยจัดเก็บตามความจำเป็นต่อการตรวจสอบ โดยมีระยะเวลาสูงสุด ๑๘๐ วัน จากนั้นระบบจะลบข้อมูลตามรอบการบำรุงรักษา</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-forest-900 font-sans">๔. สิทธิของเจ้าของข้อมูล</h2>
            <p>ท่านมีสิทธิขอเข้าถึง แก้ไข หรือขอให้ลบข้อมูลส่วนบุคคลของท่านที่มูลนิธิฯ ถือครองอยู่ ได้โดยติดต่อผ่านช่องทางด้านล่าง</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-forest-900 font-sans">๕. การรักษาความปลอดภัยของข้อมูล</h2>
            <p>มูลนิธิฯ จัดให้มีมาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อป้องกันการเข้าถึง แก้ไข หรือเปิดเผยข้อมูลโดยไม่ได้รับอนุญาต โปรดดูรายละเอียดเพิ่มเติมใน<Link href="/security-policy" className="text-forest-700 underline underline-offset-2 hover:text-forest-900">นโยบายการรักษาความมั่นคงปลอดภัยเว็บไซต์</Link></p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-forest-900 font-sans">๖. ช่องทางติดต่อ</h2>
            <p>หากท่านมีข้อสงสัยเกี่ยวกับนโยบายฉบับนี้ หรือต้องการใช้สิทธิเกี่ยวกับข้อมูลส่วนบุคคลของท่าน สามารถติดต่อได้ที่:</p>
            <p>สำนักงานมูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด เลขที่ ๘๗๒ พหลโยธิน ซอย ๘ ถนนพหลโยธิน แขวงสามเสนใน เขตพญาไท กรุงเทพมหานคร ๑๐๔๐๐ โทรศัพท์ <a href="tel:0226169209" className="text-forest-700 underline underline-offset-2 hover:text-forest-900">๐-๒๖๑๖-๙๒๐๙</a></p>
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
