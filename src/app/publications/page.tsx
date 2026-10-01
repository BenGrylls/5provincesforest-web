import React from 'react';
import PublicationList from '@/components/PublicationListNew';
import AccessibilityBar from '@/components/AccessibilityBar';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ITEMS_PER_PAGE = 10;

type Publication = {
  id: number;
  title: string;
  content?: string | null;
  pdf_file?: string | null;
  html_url?: string | null;
  event_date?: string | Date | null;
  created_at?: string | Date | null;
};

export default async function PublicationsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const pageParam = searchParams.page;
  const currentPage = typeof pageParam === 'string' ? Math.max(1, parseInt(pageParam, 10)) : 1;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  let publications: Publication[] = [];
  let totalCount = 0;

  try {
    const countResult = await query('SELECT COUNT(*) as count FROM articles WHERE category = $1', [
      'publications',
    ]);
    totalCount = parseInt(countResult.rows[0]?.count || '0', 10);

    const result = await query(
      'SELECT id, title, content, pdf_file, html_url, event_date, created_at FROM articles WHERE category = $1 ORDER BY event_date DESC NULLS LAST, created_at DESC LIMIT $2 OFFSET $3',
      ['publications', ITEMS_PER_PAGE, offset],
    );
    publications = result.rows || [];
  } catch (error) {
    console.error('Unable to load publications:', error);
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen flex flex-col bg-earth-100">
      <AccessibilityBar />
      <Navbar />
      <div className="bg-forest-950 py-16 text-center border-b-4 border-amber-500">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">คลังเอกสารและวารสาร</h1>
        <p className="text-earth-100 font-serif max-w-2xl mx-auto px-4">สืบค้นเอกสารวิชาการ วารสารมณีบูรพา</p>
      </div>
      <main className="max-w-5xl mx-auto px-4 py-16 flex-1 w-full space-y-8">
        <PublicationList publications={publications} currentPage={currentPage} totalPages={totalPages} />
      </main>
      <Footer />
    </div>
  );
}