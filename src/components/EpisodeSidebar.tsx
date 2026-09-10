'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

interface Episode {
  id: number;
  title: string;
  episode_number: number | null;
}

interface EpisodeSidebarProps {
  episodes: Episode[];
  currentEpisodeId: number;
  seriesTitle?: string;
}

export default function EpisodeSidebar({
  episodes,
  currentEpisodeId,
  seriesTitle = 'ตอนต่างๆ',
}: EpisodeSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentEpisode = episodes.find((ep) => ep.id === currentEpisodeId);

  return (
    <>
      {/* Mobile Dropdown */}
      <div className="md:hidden mb-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-forest-900 text-white rounded-xl transition"
        >
          <span className="text-sm font-semibold">
            {seriesTitle} {currentEpisode?.episode_number && `(ตอนที่ ${currentEpisode.episode_number})`}
          </span>
          <ChevronDown className={`w-4 h-4 transition ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="mt-2 bg-white border rounded-xl shadow-lg overflow-hidden">
            {episodes.map((episode) => (
              <Link
                key={episode.id}
                href={`/media/${episode.id}`}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 text-sm border-b last:border-b-0 transition ${
                  episode.id === currentEpisodeId
                    ? 'bg-forest-50 text-forest-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">ตอนที่ {episode.episode_number || '?'}</span>
                <span className="text-gray-600 ml-2">{episode.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block md:col-span-1">
        <div className="sticky top-20 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-forest-950 text-white border-b">
            <h3 className="font-bold text-sm">{seriesTitle}</h3>
            <p className="text-xs text-gray-300 mt-1">
              {episodes.length} ตอน
            </p>
          </div>
          
          <div className="divide-y divide-gray-100 max-h-[calc(100vh-200px)] overflow-y-auto">
            {episodes.map((episode) => (
              <Link
                key={episode.id}
                href={`/media/${episode.id}`}
                className={`block px-4 py-3 text-xs transition border-l-4 ${
                  episode.id === currentEpisodeId
                    ? 'bg-forest-50 text-forest-700 border-l-forest-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50 border-l-transparent'
                }`}
              >
                <div className="font-medium">ตอนที่ {episode.episode_number || '?'}</div>
                <div className="text-gray-600 line-clamp-2 mt-1">{episode.title}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
