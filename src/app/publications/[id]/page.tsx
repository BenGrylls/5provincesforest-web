import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import AccessibilityBar from '@/components/AccessibilityBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PdfEbookReaderClient from '@/components/PdfEbookReaderClient';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Publication = {
  id: number;
  title: string;
  content?: string | null;
  pdf_file?: string | null;
  event_date?: string | Date | null;
};

export default async function PublicationReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  let publication: Publication | undefined;
  try {
    const result = await query('SELECT id, title, content, pdf_file, event_date FROM articles WHERE id = $1 AND category = $2', [id, 'publications']);
    publication = result.rows[0];
  } catch {
    notFound();
  }
  if (!publication?.pdf_file) notFound();
  const pdfViewerUrl = `/api/publications/${publication.id}/pdf`;

  return (
    <div className="min-h-screen flex flex-col bg-earth-100">
      <AccessibilityBar />
      <Navbar />
      <main className="max-w-7xl mx-auto w-full px-4 py-10 md:py-14 flex-1">
        <Link href="/publications" className="inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:text-forest-950 mb-8"><ArrowLeft className="w-4 h-4" /> กลับไปคลังเอกสารและวารสาร</Link>
        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <header className="p-6 md:p-8 border-b border-gray-100">
            <div className="flex items-start gap-3"><FileText className="w-7 h-7 text-forest-700 shrink-0 mt-1" /><div><h1 className="text-2xl md:text-3xl font-bold text-forest-950">{publication.title}</h1>{publication.event_date && <p className="text-sm text-earth-600 mt-2">เผยแพร่เมื่อ {new Date(publication.event_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}</div></div>
          </header>
          {publication.content && <p className="px-6 md:px-8 pt-6 text-earth-700 font-serif whitespace-pre-wrap">{publication.content}</p>}
          <div className="p-4 md:p-6"><PdfEbookReaderClient url={pdfViewerUrl} title={publication.title} /></div>
        </article>
      </main>
      <Footer />
    </div>
  );
}