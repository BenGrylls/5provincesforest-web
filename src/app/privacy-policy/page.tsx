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
            <p>เว็บไซต์นี้เป็นเว็บไซต์เผยแพร่ข้อมูลข่าวสารสาธารณะ โดยทั่วไปจะไม่มีการเก็บข้อมูลส่วนบุคคลจากผู้เข้าชม เว้นแต่ท่านจะติดต่อมูลนิธิฯ ผ่านช่องทางที่ระบุไว้ในเว็บไซต์ (เช่น โทรศัพท์ หรือ Facebook) ซึ่งข้อมูลดังกล่าวจะถูกเก็บและประมวลผลตามนโยบายของแพลตฟอร์มนั้นๆ</p>
            <p>ระบบเว็บไซต์อาจเก็บข้อมูลทางเทคนิคพื้นฐานโดยอัตโนมัติ เช่น ประเภทเบราว์เซอร์ เพื่อวัตถุประสงค์ด้านความปลอดภัยและการปรับปรุงประสิทธิภาพเว็บไซต์เท่านั้น</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-forest-900 font-sans">๒. วัตถุประสงค์ในการใช้ข้อมูล</h2>
            <p>มูลนิธิฯ จะใช้ข้อมูลที่ได้รับเพื่อตอบข้อซักถาม ประสานงาน หรือให้บริการข้อมูลตามที่ท่านร้องขอเท่านั้น จะไม่นำข้อมูลไปใช้เพื่อวัตถุประสงค์ทางการค้าหรือเปิดเผยแก่บุคคลภายนอกโดยไม่ได้รับความยินยอม เว้นแต่กรณีที่กฎหมายกำหนด</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-forest-900 font-sans">๓. สิทธิของเจ้าของข้อมูล</h2>
            <p>ท่านมีสิทธิขอเข้าถึง แก้ไข หรือขอให้ลบข้อมูลส่วนบุคคลของท่านที่มูลนิธิฯ ถือครองอยู่ ได้โดยติดต่อผ่านช่องทางด้านล่าง</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-forest-900 font-sans">๔. การรักษาความปลอดภัยของข้อมูล</h2>
            <p>มูลนิธิฯ จัดให้มีมาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อป้องกันการเข้าถึง แก้ไข หรือเปิดเผยข้อมูลโดยไม่ได้รับอนุญาต โปรดดูรายละเอียดเพิ่มเติมใน<Link href="/security-policy" className="text-forest-700 underline underline-offset-2 hover:text-forest-900">นโยบายการรักษาความมั่นคงปลอดภัยเว็บไซต์</Link></p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-forest-900 font-sans">๕. ช่องทางติดต่อ</h2>
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
