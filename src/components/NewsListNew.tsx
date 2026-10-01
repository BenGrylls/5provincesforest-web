'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Search, PlayCircle } from 'lucide-react';
import Pagination from './Pagination';

type Article = {
  id: number;
  title: string;
  content?: string;
  event_date?: string | Date | null;
  image_paths?: string[] | null;
  card_cover_image?: string | null;
  video_file?: string | null;
  social_video_url?: string | null;
  published_at?: string | Date | null;
};

function videoThumbnail(videoUrl?: string | null): string | null {
  if (!videoUrl) return null;
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, '');
    let id: string | null | undefined;
    if (host === 'youtu.be') {
      id = url.pathname.split('/').filter(Boolean)[0];
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      id =
        url.searchParams.get('v') ||
        url.pathname.match(/^\/(?:shorts|embed)\/([^/?]+)/)?.[1];
    }
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  } catch {
    return null;
  }
}

function UploadedVideoThumbnail({ source, title }: { source?: string | null; title: string }) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    if (!source) return;
    const video = document.createElement('video');
    video.src = source;
    video.muted = true;
    video.preload = 'metadata';
    video.onloadedmetadata = () => { video.currentTime = Math.min(1, Math.max(0, video.duration - 0.1)); };
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context && canvas.width && canvas.height) {
        context.drawImage(video, 0, 0);
        setThumbnail(canvas.toDataURL('image/jpeg', 0.82));
      }
    };
    return () => { video.removeAttribute('src'); video.load(); };
  }, [source]);

  return thumbnail ? (
    <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
  ) : (
    <div className="w-full h-full bg-forest-950 flex items-center justify-center" aria-label={`วิดีโอ: ${title}`}>
      <PlayCircle className="w-14 h-14 text-white/70" />
    </div>
  );
}

interface NewsListProps {
  articles: Article[];
  currentPage: number;
  totalPages: number;
}

function NewsCard({ item }: { item: Article }) {
  const cover = item.card_cover_image || item.image_paths?.[0] || videoThumbnail(item.social_video_url);
  const hasVideo = Boolean(item.social_video_url || item.video_file);

  return (
    <Link href={`/news/${item.id}`} className="group">
      <article className="h-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-gray-100">
        <div className="relative aspect-[4/3] bg-earth-200 overflow-hidden">
          {cover ? (
            <img src={cover} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          ) : item.video_file ? (
            <UploadedVideoThumbnail source={item.video_file} title={item.title} />
          ) : hasVideo ? (
            <div className="w-full h-full bg-forest-950 flex items-center justify-center">
              <PlayCircle className="w-14 h-14 text-white/70" />
            </div>
          ) : null}
          {(cover || item.video_file) && hasVideo && (
            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <PlayCircle className="w-12 h-12 text-white/90 drop-shadow-lg" />
            </span>
          )}
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
  );
}

export default function NewsList({ articles, currentPage, totalPages }: NewsListProps) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => articles.filter((article) => {
    const text = `${article.title} ${article.content || ''}`.toLocaleLowerCase();
    return text.includes(search.toLocaleLowerCase());
  }), [articles, search]);

  return (
    <>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3">
        <label className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            value={search} 
            onChange={(event) => setSearch(event.target.value)} 
            placeholder="ค้นหาข่าวหรือกิจกรรม..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" 
          />
        </label>
      </div>
      <p className="text-sm text-earth-600">พบ {filtered.length} รายการ</p>
      {filtered.length ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filtered.map((article) => (
            <NewsCard key={article.id} item={article} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-earth-500">
          ไม่พบข่าวหรือกิจกรรมที่ค้นหา
        </div>
      )}

      {/* Pagination */}
      {!search && totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/news" />
      )}
    </>
  );
}
