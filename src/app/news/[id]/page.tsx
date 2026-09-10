import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, ExternalLink, Image as ImageIcon, PlayCircle } from 'lucide-react';
import AccessibilityBar from '@/components/AccessibilityBar';
import ActivityGallery from '@/components/ActivityGallery';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Article = {
  id: number;
  title: string;
  content: string | null;
  event_date: string | Date | null;
  image_paths: string[] | null;
  video_file: string | null;
  social_video_url: string | null;
  published_at: string | Date | null;
};

function formatDate(value: string | Date | null, withTime = false) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

function socialEmbedUrl(videoUrl: string) {
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = url.searchParams.get('v') || url.pathname.match(/^\/(?:shorts|embed)\/([^/?]+)/)?.[1];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
      const id = url.pathname.match(/\/video\/(\d+)/)?.[1];
      return id ? `https://www.tiktok.com/embed/v2/${id}` : null;
    }
    if (host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.watch') {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(videoUrl)}&show_text=false`;
    }
  } catch {
    return null;
  }
  return null;
}

export default async function NewsDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  let article: Article | undefined;
  try {
    const result = await query(
      'SELECT *, created_at AS published_at FROM articles WHERE id = $1 AND category = $2',
      [id, 'news'],
    );
    article = result.rows[0];
  } catch {
    notFound();
  }
  if (!article) notFound();

  const images = Array.isArray(article.image_paths) ? article.image_paths : [];
  const embeddedVideoUrl = article.social_video_url ? socialEmbedUrl(article.social_video_url) : null;

  return (
    <div className="min-h-screen flex flex-col bg-earth-100">
      <AccessibilityBar />
      <Navbar />
      <main className="max-w-5xl mx-auto w-full px-4 py-10 md:py-16 flex-1">
        <Link href="/news" className="inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest-950 mb-8">
          <ArrowLeft className="w-4 h-4" /> กลับไปหน้ากิจกรรมและประชาสัมพันธ์
        </Link>

        <article className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <header className="p-6 md:p-10 bg-forest-950 text-white">
            <div className="flex flex-wrap gap-3 text-sm text-emerald-100 mb-5">
              <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg"><Calendar className="w-4 h-4" /> วันจัดกิจกรรม: {formatDate(article.event_date)}</span>
              <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg"><Clock className="w-4 h-4" /> เผยแพร่: {formatDate(article.published_at, true)}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">{article.title}</h1>
          </header>

          <div className="p-6 md:p-10 space-y-10">
            {article.content && (
              <section>
                <h2 className="text-xl font-bold text-forest-950 mb-4">รายละเอียดกิจกรรม</h2>
                <div className="whitespace-pre-wrap text-earth-700 font-serif leading-8 text-base md:text-lg">{article.content}</div>
              </section>
            )}

            {images.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-forest-950 mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5" /> ภาพกิจกรรม ({images.length} ภาพ)</h2>
                <ActivityGallery images={images} title={article.title} />
              </section>
            )}

            {(article.video_file || article.social_video_url) && (
              <section>
                <h2 className="text-xl font-bold text-forest-950 mb-4 flex items-center gap-2"><PlayCircle className="w-5 h-5" /> วิดีโอ</h2>
                {article.video_file && <video src={article.video_file} controls preload="metadata" className="w-full rounded-2xl bg-black max-h-[70vh]" />}
                {article.social_video_url && embeddedVideoUrl && <iframe src={embeddedVideoUrl} title={`วิดีโอ: ${article.title}`} className="mt-4 w-full aspect-video rounded-2xl bg-black" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />}
                {article.social_video_url && (
                  <a href={article.social_video_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-forest-700 text-white font-medium hover:bg-forest-800">
                    <ExternalLink className="w-4 h-4" /> เปิดวิดีโอจากต้นทาง
                  </a>
                )}
              </section>
            )}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
