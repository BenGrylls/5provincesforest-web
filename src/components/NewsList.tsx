'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock, ExternalLink, Search } from 'lucide-react';

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

export default function NewsList({ articles }: { articles: Article[] }) {
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
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาข่าวหรือกิจกรรม..." className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" />
        </label>
      </div>
      <p className="text-sm text-earth-600">พบ {filtered.length} รายการ</p>
      {filtered.length ? <div className="grid grid-cols-1 md:grid-cols-3 gap-8">{filtered.map((article) => <NewsCard key={article.id} item={article} />)}</div> : <div className="py-16 text-center text-earth-500">ไม่พบข่าวหรือกิจกรรมที่ค้นหา</div>}
    </>
  );
}

function NewsCard({ item }: { item: Article }) {
  const images = Array.isArray(item.image_paths) ? item.image_paths : [];
  return <article className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group flex flex-col">
    <div className="aspect-video bg-earth-200 relative overflow-hidden flex items-center justify-center">
      {images.length ? <img src={images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" /> : item.video_file ? <video src={item.video_file} controls preload="metadata" className="w-full h-full object-cover" /> : item.social_video_url ? <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center p-4 text-center space-y-2"><ExternalLink className="w-8 h-8 text-amber-400" /><a href={item.social_video_url} target="_blank" rel="noreferrer" className="text-xs text-white underline">รับชมคลิปวิดีโอภายนอก</a></div> : <div className="text-earth-400 text-xs">ไม่มีไฟล์มีเดีย</div>}
    </div>
    <div className="p-6 space-y-3 flex-1 flex flex-col">
      <div className="flex justify-between gap-2 items-center text-xs text-earth-500"><span className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-lg font-medium text-forest-800"><Calendar className="w-3.5 h-3.5" /> {item.event_date ? new Date(item.event_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span>{images.length > 1 && <span>{images.length} รูป</span>}</div>
      <h2 className="font-bold text-lg text-forest-950 line-clamp-2">{item.title}</h2><p className="text-earth-500 text-sm font-serif line-clamp-3">{item.content || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
      <div className="text-[11px] text-gray-400 pt-3 border-t mt-auto flex items-center gap-1"><Clock className="w-3 h-3" /> ลงข้อมูลเมื่อ: {item.published_at ? new Date(item.published_at).toLocaleString('th-TH') : '-'}</div>
      <Link href={`/news/${item.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-forest-700">อ่านรายละเอียด <ArrowRight className="w-4 h-4" /></Link>
    </div>
  </article>;
}