'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlayCircle } from 'lucide-react';

type MediaArticle = {
  id: number;
  title: string;
  content?: string | null;
  image_paths?: string[] | null;
  video_file?: string | null;
  social_video_url?: string | null;
};

function youtubeThumbnail(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '');
    const id = host === 'youtu.be' ? url.pathname.split('/').filter(Boolean)[0] : url.searchParams.get('v') || url.pathname.match(/^\/(?:shorts|embed)\/([^/?]+)/)?.[1];
    return (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') && id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
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

  return thumbnail ? <img src={thumbnail} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition" /> : null;
}

export default function HomeMediaCards({ items }: { items: MediaArticle[] }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {items.map((item) => {
      const image = item.image_paths?.[0] || youtubeThumbnail(item.social_video_url);
      return <Link key={item.id} href={`/media/${item.id}`} className="group relative aspect-video bg-forest-900 rounded-xl overflow-hidden border border-forest-800">
        {image ? <img src={image} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition" /> : <UploadedVideoThumbnail source={item.video_file} title={item.title} />}
        <div className="absolute inset-0 bg-black/35 flex flex-col justify-end p-4">
          <PlayCircle className="w-9 h-9 text-amber-400 mb-auto" />
          <h4 className="font-bold line-clamp-2">{item.title}</h4>
          {item.content && <p className="text-xs text-white/75 mt-1 line-clamp-1">{item.content}</p>}
        </div>
      </Link>;
    })}
    {items.length === 0 && <div className="col-span-full py-8 text-center text-forest-200">ยังไม่มีสื่อและสารคดีธรรมชาติในขณะนี้</div>}
  </div>;
}