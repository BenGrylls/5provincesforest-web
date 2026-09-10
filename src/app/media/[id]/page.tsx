import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, PlayCircle } from 'lucide-react';
import AccessibilityBar from '@/components/AccessibilityBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EpisodeSidebar from '@/components/EpisodeSidebar';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

type MediaArticle = {
  id: number;
  title: string;
  content?: string | null;
  video_file?: string | null;
  social_video_url?: string | null;
  series_key?: string | null;
  episode_number?: number | null;
};

function embedUrl(value: string) {
  try {
    const url = new URL(value);
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
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(value)}&show_text=false`;
    }
  } catch {
    return null;
  }
  return null;
}

export default async function MediaDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  let media: MediaArticle | undefined;
  try {
    const result = await query(
      'SELECT id, title, content, video_file, social_video_url, series_key, episode_number FROM articles WHERE id = $1 AND category = $2',
      [id, 'media'],
    );
    media = result.rows[0];
  } catch {
    notFound();
  }
  if (!media) notFound();

  const externalEmbedUrl = media.social_video_url ? embedUrl(media.social_video_url) : null;
  
  let allEpisodes: { id: number; title: string; episode_number: number | null }[] = [];
  let previousEpisode: number | null = null;
  let nextEpisode: number | null = null;
  let seriesTitle = 'ตอนต่างๆ';
  
  if (media.series_key && media.episode_number) {
    try {
      const episodes = await query(
        'SELECT id, title, episode_number FROM articles WHERE category = $1 AND series_key = $2 AND episode_number IS NOT NULL ORDER BY episode_number',
        ['media', media.series_key],
      );
      allEpisodes = episodes.rows || [];
      seriesTitle = media.series_key;
      
      const index = allEpisodes.findIndex((item) => item.id === id);
      previousEpisode = index > 0 ? allEpisodes[index - 1].id : null;
      nextEpisode = index >= 0 && index < allEpisodes.length - 1 ? allEpisodes[index + 1].id : null;
    } catch {
      allEpisodes = [];
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-earth-100">
      <AccessibilityBar />
      <Navbar />
      <main className="max-w-7xl mx-auto w-full px-4 py-10 md:py-16 flex-1">
        <Link href="/media" className="inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest-950 mb-8">
          <ArrowLeft className="w-4 h-4" /> กลับไปหน้าสื่อและสารคดีธรรมชาติ
        </Link>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2">
            <article className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <header className="p-6 md:p-10 bg-forest-950 text-white">
                <h1 className="text-3xl md:text-5xl font-bold leading-tight">{media.title}</h1>
                {media.episode_number && (
                  <p className="text-sm text-forest-300 mt-3">ตอนที่ {media.episode_number}</p>
                )}
              </header>
              <div className="p-6 md:p-10 space-y-8">
                <div className="aspect-video bg-black rounded-2xl overflow-hidden">
                  {media.video_file ? (
                    <video src={media.video_file} controls preload="metadata" className="w-full h-full" />
                  ) : externalEmbedUrl ? (
                    <iframe src={externalEmbedUrl} title={media.title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/70"><PlayCircle className="w-14 h-14" /></div>
                  )}
                </div>
                {media.content && <div className="whitespace-pre-wrap text-earth-700 font-serif leading-8">{media.content}</div>}
                {media.social_video_url && <a href={media.social_video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-forest-700 font-medium"><ExternalLink className="w-4 h-4" /> เปิดวิดีโอจากต้นทาง</a>}
                {(previousEpisode || nextEpisode) && <nav className="flex justify-between gap-3 border-t pt-6">
                  {previousEpisode ? <Link href={`/media/${previousEpisode}`} className="text-sm font-medium text-forest-700 hover:text-forest-950">← ตอนก่อนหน้า</Link> : <span />}
                  {nextEpisode ? <Link href={`/media/${nextEpisode}`} className="text-sm font-medium text-forest-700 hover:text-forest-950">ตอนถัดไป →</Link> : <span />}
                </nav>}
              </div>
            </article>
          </div>

          {/* Episode Sidebar */}
          {allEpisodes.length > 0 && (
            <EpisodeSidebar 
              episodes={allEpisodes} 
              currentEpisodeId={id}
              seriesTitle={seriesTitle}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
