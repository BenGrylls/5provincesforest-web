import MediaList from '@/components/MediaListNew';
import AccessibilityBar from '@/components/AccessibilityBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ITEMS_PER_PAGE = 10;

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

export default async function MediaPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const pageParam = searchParams.page;
  const currentPage = typeof pageParam === 'string' ? Math.max(1, parseInt(pageParam, 10)) : 1;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  let videos: MediaArticle[] = [];
  let totalCount = 0;

  try {
    const countResult = await query('SELECT COUNT(*) as count FROM articles WHERE category = $1', [
      'media',
    ]);
    totalCount = parseInt(countResult.rows[0]?.count || '0', 10);

    const result = await query(
      'SELECT id, title, content, social_video_url, video_file, image_paths, episode_number, series_key FROM articles WHERE category = $1 ORDER BY CASE WHEN series_key IS NOT NULL THEN 0 ELSE 1 END, series_key, episode_number ASC, event_date DESC NULLS LAST, created_at DESC LIMIT $2 OFFSET $3',
      ['media', ITEMS_PER_PAGE, offset],
    );
    videos = result.rows || [];
  } catch (error) {
    console.error('Unable to load media:', error);
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen flex flex-col bg-earth-100">
      <AccessibilityBar />
      <Navbar />
      <div className="bg-forest-950 py-16 text-center border-b-4 border-amber-500">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">สื่อและสารคดี</h1>
        <p className="text-earth-100 font-serif max-w-2xl mx-auto px-4">คลังวิดีโอเพื่อการศึกษาและเรียนรู้</p>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-16 flex-1 w-full">
        <MediaList videos={videos} currentPage={currentPage} totalPages={totalPages} />
      </main>
      <Footer />
    </div>
  );
}
