'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';

// pdfjs-dist v5 ขึ้นไปเปลี่ยนไฟล์ worker เป็น .mjs แล้ว (.min.js ไม่มีอยู่จริง ทำให้ build ไม่ผ่าน)
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

export default function PdfEbookReader({ url, title }: { url: string; title: string }) {
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const pdfFile = useMemo(() => pdfData ? { data: pdfData } : null, [pdfData]);

  useEffect(() => {
    const controller = new AbortController();
    setPdfData(null);
    setPageCount(null);
    setHasError(false);

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to fetch PDF');
        return new Uint8Array(await response.arrayBuffer());
      })
      .then(setPdfData)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setHasError(true);
      });

    return () => controller.abort();
  }, [url]);

  return (
    <div className="border border-gray-200 rounded-lg bg-gray-100 overflow-hidden">
      {pdfFile ? <Document
        file={pdfFile}
        loading={<div className="h-[70vh] flex items-center justify-center gap-2 text-earth-600"><Loader className="w-5 h-5 animate-spin" /> กำลังเปิดเอกสาร...</div>}
        error={<div className="h-[70vh] flex items-center justify-center p-6 text-center text-red-700">ไม่สามารถเปิดเอกสาร PDF ได้ กรุณาตรวจสอบไฟล์อีกครั้ง</div>}
        onLoadSuccess={({ numPages }) => { setPageCount(numPages); setHasError(false); }}
        onLoadError={() => setHasError(true)}
      >
        <div className="h-[75vh] overflow-y-auto overscroll-contain p-3 md:p-6 space-y-4">
          {!hasError && pageCount && Array.from({ length: pageCount }, (_, index) => (
            <div key={index + 1} className="flex justify-center">
              <Page pageNumber={index + 1} width={900} renderAnnotationLayer={false} renderTextLayer={false} className="max-w-full shadow-md" />
            </div>
          ))}
        </div>
      </Document> : <div className={`h-[70vh] flex items-center justify-center gap-2 ${hasError ? 'p-6 text-center text-red-700' : 'text-earth-600'}`}>{hasError ? 'ไม่สามารถเปิดเอกสาร PDF ได้ กรุณาตรวจสอบไฟล์อีกครั้ง' : <><Loader className="w-5 h-5 animate-spin" /> กำลังเปิดเอกสาร...</>}</div>}
    </div>
  );
}