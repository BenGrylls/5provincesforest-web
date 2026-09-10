import MediaList from '@/components/MediaList';
import AccessibilityBar from '@/components/AccessibilityBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

type MediaArticle = {
  id: number;
  title: string;
  content?: string | null;
  social_video_url?: string | null;
  video_file?: string | null;
  image_paths?: string[] | null;
  episode_number?: number | null;
  series_key?: string | null;
};

function youtubeThumbnail(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '');
    const id = host === 'youtu.be' ? url.pathname.split('/').filter(Boolean)[0] : url.searchParams.get('v') || url.pathname.match(/^\/(?:shorts|embed)\/([^/?]+)/)?.[1];
    return (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') && id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  } catch { return null; }
}

export default async function MediaPage() {
  let videos: MediaArticle[] = [];
  try {
    const result = await query(
      'SELECT id, title, content, social_video_url, video_file, image_paths, episode_number, series_key FROM articles WHERE category = $1 ORDER BY event_date DESC, created_at DESC',
      ['media'],
    );
    videos = result.rows || [];
  } catch (error) { console.error('Unable to load media:', error); }

  return (
    <div className="min-h-screen flex flex-col bg-earth-100">
      <AccessibilityBar /><Navbar />
      <div className="bg-forest-950 py-16 text-center border-b-4 border-amber-500">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">สื่อและสารคดีธรรมชาติ</h1>
        <p className="text-earth-100 font-serif max-w-2xl mx-auto px-4">คลังวิดีโอเพื่อการศึกษาและเรียนรู้วิถีชีวิตสัตว์ป่า</p>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-16 flex-1 w-full">
        <MediaList videos={videos} />
      </main><Footer />
    </div>
  );
}
