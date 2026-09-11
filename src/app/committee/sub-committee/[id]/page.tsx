import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, CheckCircle2 } from 'lucide-react';
import AccessibilityBar from '@/components/AccessibilityBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id)) notFound();
  const result = await query('SELECT title, description, responsibilities, sort_order FROM committee_units WHERE id = $1', [id]);
  const department = result.rows[0];
  if (!department) notFound();
  const responsibilities = Array.isArray(department.responsibilities) && department.responsibilities.length ? department.responsibilities : [
    `กำหนดนโยบายและแผนงานปฏิบัติการประจำปีของ ${department.title}`,
    'ลงพื้นที่ ติดตาม ประเมินผล และรายงานผลสัมฤทธิ์ต่อคณะกรรมการบริหารมูลนิธิฯ',
    'บูรณาการความร่วมมือกับหน่วยงานภาครัฐ ท้องถิ่น และประชาชนในพื้นที่รอยต่อ ๕ จังหวัด',
  ];

  return (
    <div className="min-h-screen flex flex-col bg-earth-100">
      <AccessibilityBar />
      <Navbar />
      <div className="bg-forest-950 py-16 text-center border-b-4 border-amber-500">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{department.title}</h1>
        <p className="text-earth-100 font-serif max-w-2xl mx-auto px-4">คณะอนุกรรมการเฉพาะด้าน ลำดับที่ {department.sort_order}</p>
      </div>
      
      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
        <Link href="/committee/sub-committee" className="inline-flex items-center gap-2 text-forest-700 font-medium hover:text-forest-900 transition">
          <ArrowLeft className="w-4 h-4" /> กลับหน้ารวมคณะอนุกรรมการ
        </Link>
        
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 space-y-8">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-3 bg-forest-50 rounded-xl"><Users className="w-6 h-6 text-forest-700" /></div>
            <h2 className="text-2xl font-bold text-forest-950">ขอบเขตอำนาจหน้าที่</h2>
          </div>
          {department.description && <p className="font-serif text-earth-700 leading-relaxed">{department.description}</p>}
          <ul className="space-y-4 font-serif text-earth-800">
            {responsibilities.map((responsibility: string) => <li key={responsibility} className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-forest-500 shrink-0 mt-1" /><p>{responsibility}</p></li>)}
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}