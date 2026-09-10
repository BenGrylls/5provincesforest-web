'use client';

import dynamic from 'next/dynamic';
import { Loader } from 'lucide-react';

const PdfEbookReader = dynamic(() => import('./PdfEbookReader'), {
  ssr: false,
  loading: () => <div className="h-[70vh] flex items-center justify-center gap-2 text-earth-600"><Loader className="w-5 h-5 animate-spin" /> กำลังเปิดเอกสาร...</div>,
});

export default function PdfEbookReaderClient({ url, title }: { url: string; title: string }) {
  return <PdfEbookReader url={url} title={title} />;
}