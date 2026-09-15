import Link from 'next/link';
import { ArrowLeft, Phone } from 'lucide-react';
import AccessibilityBar from '@/components/AccessibilityBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// เบอร์โทรหน่วยงานในพื้นที่ป่ารอยต่อ ๕ จังหวัด (ภาคตะวันออก)
// แก้ไข/เพิ่ม-ลดรายชื่อหน่วยงานได้ตรงนี้ตรงๆ เป็นข้อมูลคงที่ ไม่ได้ดึงจาก database
const AGENCIES: { name: string; numbers: string[] }[] = [
  { name: 'สำนักงานเลขานุการมูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด', numbers: ['0-2615-4525'] },
  { name: 'กองกำลังบูรพา', numbers: ['0-3726-1511'] },
  { name: 'กองบัญชาการป้องกันชายแดนจันทบุรีและตราด', numbers: ['0-3931-2172', '0-3932-5350'] },
  { name: 'กรมทหารพรานที่ ๑๓', numbers: ['0-3744-5004'] },
  { name: 'สำนักบริหารพื้นที่อนุรักษ์ที่ ๒ (ศรีราชา)', numbers: ['0-3831-1234', '0-3832-2481'] },
  { name: 'สำนักบริหารพื้นที่อนุรักษ์ที่ ๑ (ปราจีนบุรี)', numbers: ['0-3722-1140 ต่อ 208'] },
  { name: 'เขตรักษาพันธุ์สัตว์ป่า เขาอ่างฤๅไน', numbers: ['0-3850-2001'] },
  { name: 'เขตรักษาพันธุ์สัตว์ป่า เขาสอยดาว', numbers: ['0-3948-6337'] },
  { name: 'อุทยานแห่งชาติ เขาสิบห้าชั้น', numbers: ['0-3930-8187'] },
  { name: 'อุทยานแห่งชาติ เขาชะเมา – เขาวง', numbers: ['0-3889-4378', '0-3851-1053'] },
  { name: 'อุทยานแห่งชาติ เขาคิชฌกูฎ', numbers: ['0-3945-2074'] },
  { name: 'สำนักจัดการทรัพยากรป่าไม้ที่ ๙ (ชลบุรี)', numbers: ['0-3821-4994', '0-3821-4700'] },
  { name: 'สำนักจัดการทรัพยากรป่าไม้ที่ ๙ สาขาปราจีนบุรี', numbers: ['0-3745-2104'] },
];

// ตัดช่องว่าง/ขีด/ข้อความต่อ ออก เหลือแต่ตัวเลข ให้ใช้กับ tel: ได้ (ส่วน "ต่อ xxx" ตัดทิ้งเพราะ tel: ต่อเบอร์ภายในไม่ได้เสมอไป)
function toTelHref(number: string) {
  const digitsOnly = number.split('ต่อ')[0].replace(/[^0-9]/g, '');
  return `tel:${digitsOnly}`;
}

export default function ContactAgenciesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-earth-100">
      <AccessibilityBar />
      <Navbar />
      <main className="max-w-4xl mx-auto w-full px-4 py-10 md:py-16 flex-1">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest-950 mb-8">
          <ArrowLeft className="w-4 h-4" /> กลับไปหน้าหลัก
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-forest-950 mb-2">ติดต่อหน่วยงานในพื้นที่ป่ารอยต่อ</h1>
        <p className="text-earth-700 font-serif mb-8">
          รายชื่อและเบอร์โทรศัพท์หน่วยงานที่เกี่ยวข้องในพื้นที่ป่ารอยต่อ ๕ จังหวัด (ภาคตะวันออก)
        </p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
          {AGENCIES.map((agency) => (
            <div key={agency.name} className="p-5 flex flex-wrap items-center justify-between gap-3">
              <span className="font-medium text-earth-800">{agency.name}</span>
              <div className="flex flex-wrap gap-2">
                {agency.numbers.map((number) => (
                  <a
                    key={number}
                    href={toTelHref(number)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-700 hover:text-forest-950 hover:bg-forest-50 px-3 py-1.5 rounded-lg transition whitespace-nowrap"
                  >
                    <Phone className="w-3.5 h-3.5" /> {number}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
