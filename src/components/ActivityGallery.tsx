'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';

type Props = {
  images: string[];
  title: string;
};

export default function ActivityGallery({ images, title }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isOpen = activeIndex !== null;
  const activeImage = isOpen ? images[activeIndex] : null;

  const close = () => setActiveIndex(null);
  const previous = () => setActiveIndex((index) => index === null ? null : (index - 1 + images.length) % images.length);
  const next = () => setActiveIndex((index) => index === null ? null : (index + 1) % images.length);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') previous();
      if (event.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, images.length]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {images.map((image, index) => (
          <button key={`${image}-${index}`} type="button" onClick={() => setActiveIndex(index)} className="group relative block overflow-hidden rounded-2xl bg-earth-200 text-left focus:outline-none focus:ring-2 focus:ring-forest-600">
            <img src={image} alt={`${title} ภาพที่ ${index + 1}`} className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-300" />
            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
              <Expand className="w-9 h-9 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
            </span>
          </button>
        ))}
      </div>

      {isOpen && activeImage && activeIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/90 p-4 md:p-10 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={`แกลเลอรีภาพ: ${title}`} onClick={close}>
          <button type="button" onClick={close} className="absolute top-4 right-4 p-3 rounded-full bg-white/15 text-white hover:bg-white/25" aria-label="ปิดแกลเลอรี"><X /></button>
          {images.length > 1 && <button type="button" onClick={(event) => { event.stopPropagation(); previous(); }} className="absolute left-3 md:left-6 p-3 rounded-full bg-white/15 text-white hover:bg-white/25" aria-label="ภาพก่อนหน้า"><ChevronLeft className="w-7 h-7" /></button>}
          <img src={activeImage} alt={`${title} ภาพที่ ${activeIndex + 1}`} className="max-w-full max-h-[82vh] object-contain" onClick={(event) => event.stopPropagation()} />
          {images.length > 1 && <button type="button" onClick={(event) => { event.stopPropagation(); next(); }} className="absolute right-3 md:right-6 p-3 rounded-full bg-white/15 text-white hover:bg-white/25" aria-label="ภาพถัดไป"><ChevronRight className="w-7 h-7" /></button>}
          <p className="absolute bottom-5 text-white text-sm bg-black/40 px-3 py-1.5 rounded-full">{activeIndex + 1} / {images.length}</p>
        </div>
      )}
    </>
  );
}
