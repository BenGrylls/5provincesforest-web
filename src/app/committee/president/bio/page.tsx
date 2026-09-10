import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AccessibilityBar from '@/components/AccessibilityBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ChairmanProfile from '@/components/ChairmanProfile';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function PresidentBioPage() {
  const result = await query("SELECT name, position, image_path, image_data IS NOT NULL AS has_image, biography, responsibilities, biography_sections FROM committee_profiles WHERE id = $1", ['president']);
  const president = result.rows[0] || { name: 'ยังไม่มีข้อมูล', position: '', image_path: '', has_image: false, biography: '', responsibilities: '', biography_sections: [] };
  if (president.has_image) president.image_path = '/api/committee/president-image';
  const sections = Array.isArray(president.biography_sections) ? president.biography_sections : [];
  return <div className="min-h-screen flex flex-col bg-earth-100"><AccessibilityBar /><Navbar /><div className="bg-forest-950 py-12 text-center border-b-4 border-amber-500"><p className="text-earth-100 font-serif">มูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด</p></div><main className="flex-1 w-full"><div className="max-w-6xl mx-auto px-4 pt-8"><Link href="/committee/president" className="inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest-950"><ArrowLeft className="w-4 h-4" /> กลับสู่หน้าทำเนียบประธานกรรมการ</Link></div><ChairmanProfile president={president} /></main><Footer /></div>;
}