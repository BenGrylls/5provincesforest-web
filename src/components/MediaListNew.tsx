'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PlayCircle, Search } from 'lucide-react';
import Pagination from './Pagination';

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
    const id = host === 'youtu.be'
      ? url.pathname.split('/').filter(Boolean)[0]
      : url.searchParams.get('v') || url.pathname.match(/^\/(?:shorts|embed)\/([^/?]+)/)?.[1];
    return host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be'
      ? id
        ? `https://img.youtube.com/vi/${id}/hqdefault.jpg`
        : null
      : null;
  } catch {
    return null;
  }
}

function VideoThumbnail({ source, alt }: { source?: string | null; alt: string }) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  useEffect(() => {
    if (!source) return;
    const video = document.createElement('video');
    video.src = source;
    video.muted = true;
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';
    const capture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context && canvas.width) {
        context.drawImage(video, 0, 0);
        setThumbnail(canvas.toDataURL('image/jpeg', 0.82));
      }
    };
    video.addEventListener('seeked', capture, { once: true });
    video.addEventListener(
      'loadedmetadata',
      () => {
        video.currentTime = Math.min(1, Math.max(0, video.duration - 0.1));
      },
      { once: true },
    );
    return () => {
      video.removeAttribute('src');
      video.load();
    };
  }, [source]);
  return thumbnail ? (
    <img
      src={thumbnail}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-500"
    />
  ) : null;
}

interface MediaListProps {
  videos: MediaArticle[];
  currentPage: number;
  totalPages: number;
}

export default function MediaList({ videos, currentPage, totalPages }: MediaListProps) {
  const [search, setSearch] = useState('');
  const [series, setSeries] = useState('all');
  
  // Count episodes per series
  const seriesEpisodeCounts = useMemo(() => {
    const counts = new Map<string | null, number>();
    videos.forEach((video) => {
      const key = video.series_key || null;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [videos]);

  const seriesKeys = useMemo(
    () =>
      Array.from(
        new Set(
          videos
            .map((video) => video.series_key)
            .filter((key): key is string => Boolean(key)),
        ),
      ).sort(),
    [videos],
  );

  const filtered = useMemo(
    () => {
      let result = videos.filter(
        (video) =>
          `${video.title} ${video.content || ''}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
          (series === 'all' || video.series_key === series),
      );

      // Sort: series with episodes first (by episode_number ASC), then non-series videos
      result.sort((a, b) => {
        const aHasSeries = Boolean(a.series_key);
        const bHasSeries = Boolean(b.series_key);

        if (aHasSeries && bHasSeries) {
          // Both have series: sort by series_key, then episode_number
          if (a.series_key !== b.series_key) {
            return (a.series_key || '').localeCompare(b.series_key || '');
          }
          return (a.episode_number || 0) - (b.episode_number || 0);
        }

        if (aHasSeries) return -1;
        if (bHasSeries) return 1;
        return 0;
      });

      return result;
    },
    [videos, search, series],
  );
  return (
    <>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 mb-4">
        <label className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ค้นหาสื่อหรือสารคดี..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </label>
        <select
          value={series}
          onChange={(event) => setSeries(event.target.value)}
          className="px-4 py-3 bg-gray-50 rounded-xl text-sm text-earth-800 focus:outline-none focus:ring-2 focus:ring-forest-500"
        >
          <option value="all">ทุกกลุ่มสื่อ</option>
          {seriesKeys.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm text-earth-600 mb-6">พบ {filtered.length} รายการ</p>
      {filtered.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((video) => {
            const externalThumbnail = youtubeThumbnail(video.social_video_url);
            const storedThumbnail = video.image_paths?.[0];
            return (
              <Link
                key={video.id}
                href={`/media/${video.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl transition-shadow"
              >
                <div className="aspect-video bg-gradient-to-br from-forest-950 to-forest-700 relative overflow-hidden">
                  {storedThumbnail ? (
                    <img
                      src={storedThumbnail}
                      alt={video.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-500"
                    />
                  ) : externalThumbnail ? (
                    <img
                      src={externalThumbnail}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <VideoThumbnail source={video.video_file} alt={video.title} />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <PlayCircle className="w-16 h-16 text-white drop-shadow-lg group-hover:text-amber-300 group-hover:scale-110 transition" />
                  </div>
                  {video.episode_number && video.series_key && (seriesEpisodeCounts.get(video.series_key) ?? 0) > 1 && (
                    <span className="absolute top-3 left-3 bg-amber-500 text-forest-950 px-2 py-1 rounded text-xs font-bold">
                      EP {video.episode_number}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="font-bold text-lg text-forest-950 group-hover:text-forest-700 transition line-clamp-2">
                    {video.title}
                  </h2>
                  {video.content && (
                    <p className="mt-2 text-sm text-earth-600 line-clamp-2">{video.content}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-earth-500">ไม่พบสื่อที่ค้นหา</div>
      )}

      {/* Pagination - only show when not searching or filtering by series */}
      {!search && series === 'all' && totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/media" />
      )}
    </>
  );
}
