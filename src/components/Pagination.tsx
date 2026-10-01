'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  queryParams?: Record<string, string>;
}

export default function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  queryParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildUrl = (page: number) => {
    const params = new URLSearchParams(queryParams);
    params.set('page', String(page));
    return `${baseUrl}?${params.toString()}`;
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push('...');

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-12 pb-12">
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link
          href={buildUrl(currentPage - 1)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-forest-700 bg-white border border-forest-200 rounded-lg hover:bg-forest-50 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          ก่อนหน้า
        </Link>
      ) : (
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          ก่อนหน้า
        </button>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-3 py-2 text-gray-400">
              ...
            </span>
          ) : (
            <Link
              key={page}
              href={buildUrl(Number(page))}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                page === currentPage
                  ? 'bg-forest-600 text-white'
                  : 'text-forest-700 bg-white border border-forest-200 hover:bg-forest-50'
              }`}
            >
              {page}
            </Link>
          ),
        )}
      </div>

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link
          href={buildUrl(currentPage + 1)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-forest-700 bg-white border border-forest-200 rounded-lg hover:bg-forest-50 transition"
        >
          ต่อไป
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
        >
          ต่อไป
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
