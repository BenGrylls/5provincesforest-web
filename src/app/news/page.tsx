import React from 'react';
import NewsList from '@/components/NewsList';
import AccessibilityBar from '@/components/AccessibilityBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Article = {
  id: number;
  title: string;
  content?: string;
  event_date?: string | Date | null;
  image_paths?: string[] | null;
  video_file?: string | null;
  social_video_url?: string | null;
  published_at?: string | Date | null;
};

export default async function NewsPage() {
  let articles: Article[] = [];
  try {
    const res = await query('SELECT *, created_at as published_at FROM articles WHERE category = $1 ORDER BY event_date DESC', ['news']);
    articles = res.rows || [];
  } catch (e) {
    articles = [];
  }

  return (
    <div className="min-h-screen flex flex-col bg-earth-100">
      <AccessibilityBar />
      <Navbar />
      <div className="bg-forest-950 py-16 text-center border-b-4 border-amber-500">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">กิจกรรมและประชาสัมพันธ์</h1>
        <p className="text-earth-100 font-serif max-w-2xl mx-auto px-4">ติดตามข่าวสาร กิจกรรม ภาพถ่ายกิจกรรมหลายรูป และคลิปวิดีโอ</p>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-16 flex-1 w-full space-y-5">
        <NewsList articles={articles} />
      </main>
      <Footer />
    </div>
  );
}
