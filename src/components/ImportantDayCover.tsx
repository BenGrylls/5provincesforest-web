 'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

type Cover = { image: string; title: string; message: string; link: string; linkText: string; subtitle: string; date: string; footer: string; ornament: string; titleSize: number; subtitleSize: number; dateSize: number; footerSize: number };

export default function ImportantDayCover({ cover }: { cover: Cover }) {
  const [visible, setVisible] = useState(false);
  const storageKey = `important-cover-seen:${cover.image}:${cover.title}`;

  useEffect(() => {
    setVisible(localStorage.getItem(storageKey) !== 'true');
  }, [storageKey]);

  const dismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setVisible(false);
    requestAnimationFrame(() => document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' }));
  };

  if (!visible) return null;

  const action = cover.link ? (cover.link.startsWith('/') ? <Link href={cover.link} onClick={dismiss} className="inline-flex px-5 py-2.5 bg-white text-forest-950 font-semibold rounded-lg hover:bg-earth-100">{cover.linkText || 'อ่านรายละเอียด'}</Link> : <a href={cover.link} className="inline-flex px-5 py-2.5 bg-white text-forest-950 font-semibold rounded-lg hover:bg-earth-100">{cover.linkText || 'อ่านรายละเอียด'}</a>) : null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={cover.title}>
    <section className="relative w-full max-w-[34rem] overflow-visible rounded-[24px] bg-black shadow-2xl">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-black text-white">
        <img src={cover.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-75" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />
        <div className="relative z-10 flex h-full flex-col items-center justify-end p-7 text-center md:p-10">
          <h1 className="font-bold leading-tight text-white" style={{ fontSize: `${cover.titleSize}px` }}>{cover.title}</h1>
          {cover.subtitle && <p className="mt-2 font-semibold leading-tight text-white whitespace-pre-line" style={{ fontSize: `${cover.subtitleSize}px` }}>{cover.subtitle}</p>}
          {cover.message && <p className="mt-3 leading-relaxed text-white/90 whitespace-pre-line" style={{ fontSize: `${Math.max(12, cover.subtitleSize - 3)}px` }}>{cover.message}</p>}
          {cover.date && <p className="mt-3 font-medium text-white/90" style={{ fontSize: `${cover.dateSize}px` }}>{cover.date}</p>}
          {cover.ornament ? <img src={cover.ornament} alt="ลวดลายประกอบ" className="mt-3 max-h-10 max-w-[12rem] object-contain" /> : <div className="mt-4 h-px w-32 bg-white/70" />}
          {cover.footer && <p className="mt-4 max-w-md leading-relaxed text-white/85 whitespace-pre-line" style={{ fontSize: `${cover.footerSize}px` }}>{cover.footer}</p>}
          {action && <div className="mt-5">{action}</div>}
        </div>
      </div>
      <button type="button" onClick={dismiss} aria-label="ปิดหน้าวันสำคัญ" className="absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-full bg-white/95 p-2 text-gray-600 shadow-md hover:bg-white hover:text-forest-800"><X className="w-6 h-6" /></button>
    </section>
  </div>;
}