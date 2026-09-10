import React from 'react';
import Link from 'next/link';
import { Calendar, FileText, PlayCircle, ArrowRight, Leaf } from 'lucide-react';
import AccessibilityBar from '@/components/AccessibilityBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomeMediaCards from '@/components/HomeMediaCards';
import ImportantDayCover from '@/components/ImportantDayCover';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

type NewsArticle = {
  id: number;
  title: string;
  content?: string | null;
  event_date?: string | Date | null;
  image_paths?: string[] | null;
};

type MediaArticle = {
  id: number;
  title: string;
  content?: string | null;
  image_paths?: string[] | null;
  episode_number?: number | null;
  video_file?: string | null;
  social_video_url?: string | null;
};

type Publication = {
  id: number;
  title: string;
  content?: string | null;
  event_date?: string | Date | null;
  pdf_file?: string | null;
};

export default async function HomePage() {
  let latestNews: NewsArticle[] = [];
  let latestMedia: MediaArticle[] = [];
  let latestPublications: Publication[] = [];
  let importantCover: { image: string; title: string; message: string; link: string; linkText: string; subtitle: string; date: string; footer: string; ornament: string; titleSize: number; subtitleSize: number; dateSize: number; footerSize: number } | null = null;

  try {
    const [newsResult, mediaResult, publicationResult, settingsResult] = await Promise.all([
      query(
      `SELECT id, title, content, event_date, image_paths
       FROM articles
       WHERE category = $1
       ORDER BY event_date DESC NULLS LAST, created_at DESC
       LIMIT 3`,
      ['news']
      ),
      query('SELECT id, title, content, image_paths, video_file, social_video_url FROM articles WHERE category = $1 ORDER BY event_date DESC NULLS LAST, created_at DESC LIMIT 4', ['media']),
      query('SELECT id, title, content, event_date, pdf_file FROM articles WHERE category = $1 ORDER BY event_date DESC NULLS LAST, created_at DESC LIMIT 3', ['publications']),
      query('SELECT important_cover_enabled, important_cover_image, important_cover_title, important_cover_message, important_cover_link, important_cover_link_text, important_cover_subtitle, important_cover_date, important_cover_footer, important_cover_ornament, important_cover_title_size, important_cover_subtitle_size, important_cover_date_size, important_cover_footer_size FROM site_settings WHERE id = $1', ['global']),
    ]);
    latestNews = newsResult.rows || [];
    latestMedia = mediaResult.rows || [];
    latestPublications = publicationResult.rows || [];
    const settings = settingsResult.rows[0];
    if (settings?.important_cover_enabled && settings.important_cover_image && settings.important_cover_title) importantCover = { image: settings.important_cover_image, title: settings.important_cover_title, message: settings.important_cover_message || '', link: settings.important_cover_link || '', linkText: settings.important_cover_link_text || '', subtitle: settings.important_cover_subtitle || '', date: settings.important_cover_date || '', footer: settings.important_cover_footer || '', ornament: settings.important_cover_ornament || '', titleSize: settings.important_cover_title_size || 28, subtitleSize: settings.important_cover_subtitle_size || 20, dateSize: settings.important_cover_date_size || 16, footerSize: settings.important_cover_footer_size || 12 };
  } catch (error) {
    console.error('Unable to load home page content:', error);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AccessibilityBar />
      <Navbar />

      {importantCover && <ImportantDayCover cover={importantCover} />}

      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-forest-950 text-white">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2000" alt="Forest Background" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-950/90 via-forest-900/60 to-transparent mix-blend-multiply"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 w-full">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 bg-black/30 border border-white/20 px-4 py-1.5 rounded-full text-amber-400 text-xs font-medium backdrop-blur-md">
              <Leaf className="w-3.5 h-3.5" /> โครงการอันเนื่องมาจากพระราชดำริ
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight tracking-tight drop-shadow-lg">
              อนุรักษ์ผืนป่ารอยต่อ <br />
              <span className="text-emerald-400">๕ จังหวัด ภาคตะวันออก</span>
            </h1>
            <div className="pt-6 flex flex-wrap gap-4">
              <Link href="/news" className="bg-amber-500 hover:bg-amber-600 text-forest-950 font-bold px-8 py-3.5 rounded-lg shadow-lg transition-all">ติดตามข่าวสารล่าสุด</Link>
              <Link href="/media" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-3.5 rounded-lg backdrop-blur-md transition-all border border-white/20"><PlayCircle className="w-5 h-5" /> ชมสารคดี</Link>
            </div>
          </div>
        </div>
      </section>

      <main id="main-content" className="max-w-7xl mx-auto px-4 md:px-8 py-16 space-y-24 flex-1">
        
        {/* หัวข้อ: กิจกรรมและประชาสัมพันธ์ (คลิกไปหน้า /news) */}
        <section id="news" className="space-y-8">
          <div className="flex items-end justify-between border-b border-gray-200 pb-4">
            <div>
              <Link href="/news" className="group">
                <h3 className="text-2xl font-bold text-forest-950 group-hover:text-forest-700 transition-colors inline-flex items-center gap-2">
                  กิจกรรมและประชาสัมพันธ์ <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
              </Link>
            </div>
            <Link href="/news" className="flex items-center gap-1 text-forest-700 font-medium hover:text-forest-900 transition">
              ดูทั้งหมด <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {latestNews.map((item) => (
              <Link key={item.id} href={`/news/${item.id}`} className="group">
              <article className="h-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-gray-100">
                <div className="aspect-[4/3] bg-earth-200 overflow-hidden">
                  {Array.isArray(item.image_paths) && item.image_paths[0] && (
                    <img src={item.image_paths[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  )}
                </div>
                <div className="hidden">
                  <div className="text-sm text-earth-500"><Calendar className="w-4 h-4 inline mr-1" /> 9 ก.ย. 2569</div>
                  <h4 className="font-bold text-lg text-forest-950">คณะอนุกรรมการฝ่ายอนุรักษ์ทรัพยากรดินและน้ำ ตรวจความคืบหน้าฝายชะลอน้ำ</h4>
                </div>
                <div className="p-6 space-y-4">
                  <div className="text-sm text-earth-500">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {item.event_date ? new Date(item.event_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                  </div>
                  <h4 className="font-bold text-lg text-forest-950 group-hover:text-forest-700 transition line-clamp-2">{item.title}</h4>
                  {item.content && <p className="text-sm text-earth-600 line-clamp-2">{item.content}</p>}
                </div>
              </article>
              </Link>
            ))}
            {latestNews.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-gray-300 py-10 text-center text-earth-500">
                ไม่มีข้อมูลกิจกรรมและประชาสัมพันธ์ในขณะนี้
              </div>
            )}
          </div>
        </section>

        {/* หัวข้อ: สื่อและสารคดีธรรมชาติ (คลิกไปหน้า /media) */}
        <section id="media" className="bg-forest-950 rounded-3xl p-8 md:p-12 text-white">
          <div className="flex items-end justify-between border-b border-forest-800 pb-4 mb-8">
            <div>
              <Link href="/media" className="group">
                <h3 className="text-2xl font-bold text-white group-hover:text-amber-300 transition-colors inline-flex items-center gap-2">
                  สื่อและสารคดีธรรมชาติ <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
              </Link>
            </div>
            <Link href="/media" className="flex items-center gap-1 text-amber-400 font-medium hover:text-amber-300 transition">
              ดูทั้งหมด <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <HomeMediaCards items={latestMedia} />
        </section>

        {/* หัวข้อ: คลังเอกสารและวารสาร (คลิกไปหน้า /publications) */}
        <section id="publications" className="space-y-8">
          <div className="flex items-end justify-between border-b border-gray-200 pb-4">
            <div>
              <Link href="/publications" className="group">
                <h3 className="text-2xl font-bold text-forest-950 group-hover:text-forest-700 transition-colors inline-flex items-center gap-2">
                  คลังเอกสารและวารสาร <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
              </Link>
            </div>
            <Link href="/publications" className="flex items-center gap-1 text-forest-700 font-medium hover:text-forest-900 transition">
              ดูทั้งหมด <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {latestPublications.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-6 border-b border-gray-50 last:border-b-0 hover:bg-forest-50/50">
                <FileText className="w-5 h-5 text-forest-700 shrink-0" />
                <div className="min-w-0">
                  {item.pdf_file ? <Link href={`/publications/${item.id}`} className="font-semibold text-forest-950 hover:text-forest-700 hover:underline">{item.title}</Link> : <h4 className="font-semibold text-forest-950">{item.title}</h4>}
                  {item.content && <p className="mt-1 text-sm text-earth-600 line-clamp-1">{item.content}</p>}
                  {item.event_date && <p className="mt-1 text-xs text-earth-500">{new Date(item.event_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</p>}
                </div>
              </div>
            ))}
            {latestPublications.length === 0 && <div className="py-10 text-center text-earth-500">ไม่มีเอกสารและวารสารในขณะนี้</div>}
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
