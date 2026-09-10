'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Download, FileText, Search } from 'lucide-react';

type Publication = {
  id: number;
  title: string;
  content?: string | null;
  pdf_file?: string | null;
  event_date?: string | Date | null;
  created_at?: string | Date | null;
};

function displayDate(publication: Publication) {
  const value = publication.event_date || publication.created_at;
  return value
    ? new Date(value).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
    : '-';
}

export default function PublicationList({ publications }: { publications: Publication[] }) {
  const [search, setSearch] = useState('');
  const filteredPublications = useMemo(() => {
    const searchTerm = search.trim().toLocaleLowerCase();
    return searchTerm
      ? publications.filter((publication) => publication.title.toLocaleLowerCase().includes(searchTerm))
      : publications;
  }, [publications, search]);

  return (
    <div className="space-y-4">
      <label className="relative block">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ค้นหาชื่อเอกสาร..."
          className="w-full py-3 pl-12 pr-4 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-forest-500"
        />
      </label>
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {filteredPublications.length > 0 ? filteredPublications.map((publication) => (
          <div key={publication.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-gray-50 last:border-b-0 hover:bg-forest-50/50 transition">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1"><FileText className="w-3 h-3" /> PDF</span>
                {publication.pdf_file ? <Link href={`/publications/${publication.id}`} className="font-semibold text-forest-950 hover:text-forest-700 hover:underline">{publication.title}</Link> : <h2 className="font-semibold text-forest-950">{publication.title}</h2>}
              </div>
              {publication.content && <p className="text-sm text-earth-500 font-serif line-clamp-2">{publication.content}</p>}
              <p className="text-xs text-earth-500">เผยแพร่เมื่อ: {displayDate(publication)}</p>
            </div>
            {publication.pdf_file && (
              <a
                href={publication.pdf_file}
                download
                className="inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-forest-700 bg-white border border-forest-200 rounded-lg hover:bg-forest-50 hover:border-forest-500 transition"
                aria-label={`ดาวน์โหลด ${publication.title}`}
              >
                <Download className="w-4 h-4" /> ดาวน์โหลด
              </a>
            )}
          </div>
        )) : <div className="py-16 text-center text-earth-500">ไม่พบเอกสารที่ค้นหา</div>}
      </div>
    </div>
  );
}