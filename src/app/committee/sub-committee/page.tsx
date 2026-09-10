import React from 'react';
import Link from 'next/link';
import { Users, ChevronRight } from 'lucide-react';
import AccessibilityBar from '@/components/AccessibilityBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function SubCommitteePage() {
  const result = await query('SELECT id, title, sort_order FROM committee_units ORDER BY sort_order');
  const subCommittees = result.rows || [];

  return (
    <div className="min-h-screen flex flex-col bg-earth-100">
      <AccessibilityBar />
      <Navbar />
      <div className="bg-forest-950 py-16 text-center border-b-4 border-amber-500">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">คณะอนุกรรมการเฉพาะด้าน</h1>
        <p className="text-earth-100 font-serif max-w-2xl mx-auto px-4">โครงสร้างการบริหารงาน ๑๐ ฝ่าย</p>
      </div>
      <main className="max-w-5xl mx-auto px-4 py-16 flex-1 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subCommittees.map((dept) => (
            <Link key={dept.id} href={`/committee/sub-committee/${dept.id}`} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-forest-300 transition-all group flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-forest-50 flex items-center justify-center text-forest-600 font-bold text-xs shrink-0 group-hover:bg-forest-600 group-hover:text-white transition-colors">
                  {dept.sort_order}
                </div>
                <span className="font-semibold text-earth-800 group-hover:text-forest-800 text-sm">{dept.title}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-forest-500 transition-colors" />
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}