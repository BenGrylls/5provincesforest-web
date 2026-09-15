import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AccessibilityBar from '@/components/AccessibilityBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const SECTIONS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'หน้าหลัก',
    links: [{ href: '/', label: 'หน้าหลัก' }],
  },
  {
    title: 'เกี่ยวกับมูลนิธิฯ',
    links: [
      { href: '/about/history', label: 'ประวัติความเป็นมา' },
      { href: '/about/objectives', label: 'วัตถุประสงค์และภารกิจ' },
    ],
  },
  {
    title: 'โครงสร้างองค์กร',
    links: [
      { href: '/committee/president', label: 'ประธานกรรมการ' },
      { href: '/committee/president/bio', label: 'ประวัติประธานกรรมการ' },
      { href: '/committee/sub-committee', label: 'คณะอนุกรรมการ' },
    ],
  },
  {
    title: 'ข่าวสารและสื่อ',
    links: [
      { href: '/news', label: 'ข่าวสารและกิจกรรม' },
      { href: '/media', label: 'สื่อและสารคดีธรรมชาติ' },
      { href: '/publications', label: 'คลังเอกสารและวารสาร' },
    ],
  },
  {
    title: 'ติดต่อและนโยบาย',
    links: [
      { href: '/contact', label: 'ติดต่อหน่วยงานในพื้นที่' },
      { href: '/privacy-policy', label: 'นโยบายความเป็นส่วนตัว' },
      { href: '/security-policy', label: 'นโยบายการรักษาความมั่นคงปลอดภัยเว็บไซต์' },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="min-h-screen flex flex-col bg-earth-100">
      <AccessibilityBar />
      <Navbar />
      <main className="max-w-4xl mx-auto w-full px-4 py-10 md:py-16 flex-1">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest-950 mb-8">
          <ArrowLeft className="w-4 h-4" /> กลับไปหน้าหลัก
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-forest-950 mb-8">แผนผังเว็บไซต์</h1>

        <div className="grid sm:grid-cols-2 gap-6">
          {SECTIONS.map((section) => (
            <div key={section.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-forest-900 mb-3">{section.title}</h2>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-earth-700 hover:text-forest-700 transition">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
