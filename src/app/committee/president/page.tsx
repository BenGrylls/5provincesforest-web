import React from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import AccessibilityBar from '@/components/AccessibilityBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function PresidentPage() {
  const result = await query("SELECT name, position, image_path, image_data IS NOT NULL AS has_image FROM committee_profiles WHERE id = $1", ['president']);
  const president = result.rows[0] || { name: 'ยังไม่มีข้อมูล', position: '', image_path: '', has_image: false };
  return (
    <div className="min-h-screen flex flex-col bg-earth-100">
      <AccessibilityBar />
      <Navbar />
      <div className="bg-forest-950 py-16 text-center border-b-4 border-amber-500">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">ประธานกรรมการมูลนิธิฯ</h1>
      </div>
      <main className="max-w-4xl mx-auto px-4 py-16 flex-1 w-full text-center">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
          <Star className="w-4 h-4" /> Executive Committee
        </div>
        
        {/* กล่องประธานกรรมการ (คลิกที่รูปหรือชื่อเพื่อไปหน้าประวัติ) */}
        <div className="max-w-sm mx-auto bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
          <Link href="/committee/president/bio" className="block cursor-pointer">
            <div className="w-48 h-64 mx-auto bg-earth-200 rounded-xl border-4 border-white shadow-lg mb-6 overflow-hidden group-hover:scale-105 transition-transform">{(president.has_image || president.image_path) ? <img src={president.has_image ? '/api/committee/president-image' : president.image_path} alt={president.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-earth-400 font-serif text-sm">[ รูปถ่ายประธานกรรมการ ]</span></div>}</div>
            <h2 className="text-2xl font-bold text-forest-950 mb-2 group-hover:text-forest-700 transition-colors underline-offset-4 group-hover:underline">
              {president.name}
            </h2>
          </Link>
          <p className="text-forest-700 font-medium text-sm mt-1">{president.position}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}