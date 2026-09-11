import React from 'react';
import { Droplet, Heart, Leaf, Shield, Target, Users, type LucideIcon } from 'lucide-react';
import AccessibilityBar from '@/components/AccessibilityBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Objective = {
  id: number;
  title: string;
  description: string;
  icon: string;
};

/** ต้องตรงกับ OBJECTIVE_ICONS ใน src/app/api/objectives/route.ts */
const ICONS: Record<string, { icon: LucideIcon; accent: string }> = {
  leaf: { icon: Leaf, accent: 'bg-forest-50 text-forest-600' },
  shield: { icon: Shield, accent: 'bg-amber-50 text-amber-600' },
  target: { icon: Target, accent: 'bg-blue-50 text-blue-600' },
  droplet: { icon: Droplet, accent: 'bg-cyan-50 text-cyan-600' },
  users: { icon: Users, accent: 'bg-purple-50 text-purple-600' },
  heart: { icon: Heart, accent: 'bg-rose-50 text-rose-600' },
};

export default async function ObjectivesPage() {
  let objectives: Objective[] = [];
  try {
    const result = await query('SELECT id, title, description, icon FROM objectives ORDER BY sort_order ASC');
    objectives = result.rows || [];
  } catch {
    objectives = [];
  }

  return (
    <div className="min-h-screen flex flex-col bg-earth-100">
      <AccessibilityBar />
      <Navbar />
      <div className="bg-forest-950 py-16 text-center border-b-4 border-amber-500">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">วัตถุประสงค์และภารกิจ</h1>
        <p className="text-earth-100 font-serif max-w-2xl mx-auto px-4">เป้าหมายเพื่อความยั่งยืนของระบบนิเวศและชุมชน</p>
      </div>
      <main className="max-w-5xl mx-auto px-4 py-16 flex-1 w-full">
        {objectives.length === 0 ? (
          <p className="text-center text-earth-600 font-serif">ยังไม่มีข้อมูลวัตถุประสงค์และภารกิจ</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {objectives.map((objective) => {
              const { icon: Icon, accent } = ICONS[objective.icon] ?? ICONS.leaf;
              return (
                <div key={objective.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className={`p-3 rounded-xl w-fit mb-4 ${accent}`}><Icon className="w-6 h-6" /></div>
                  <h3 className="font-bold text-forest-900 mb-2">{objective.title}</h3>
                  <p className="text-sm text-earth-600 font-serif leading-relaxed whitespace-pre-line">{objective.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
