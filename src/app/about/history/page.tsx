import Link from "next/link";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

interface HistoryImageItem {
  id: string;
  url: string;
  caption?: string;
}

interface HistoryData {
  title?: string;
  subtitle?: string;
  coverImage?: string;
  content?: string;
  images?: HistoryImageItem[];
}

async function getHistoryData(): Promise<HistoryData> {
  const fallbackData: HistoryData = {
    title: "ประวัติความเป็นมา มูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด",
    subtitle: "",
    coverImage: "",
    content: "",
    images: [],
  };

  // เดิมอ่านจาก src/data/history.json ตรงๆ ตอนนี้ย้ายมาเก็บใน PostgreSQL แล้ว
  try {
    const result = await query(
      "SELECT title, subtitle, cover_image, content, images FROM history_page WHERE id = $1",
      ["global"],
    );
    const row = result.rows[0];
    if (!row) return fallbackData;
    return {
      title: row.title || "",
      subtitle: row.subtitle || "",
      coverImage: row.cover_image || "",
      content: row.content || "",
      images: Array.isArray(row.images) ? row.images : [],
    };
  } catch {
    return fallbackData;
  }
}

export default async function HistoryPage() {
  const data = await getHistoryData();

  const hasHeader = Boolean(data.title?.trim() || data.subtitle?.trim());
  const hasCover = Boolean(data.coverImage?.trim());
  const hasTextContent = Boolean(data.content?.trim());
  const hasImages = Boolean(data.images && data.images.length > 0);

  return (
    <main className="min-h-screen bg-slate-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center text-xs text-slate-500 gap-2">
          <Link href="/" className="hover:text-forest-700 transition">หน้าหลัก</Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">{data.title || "ประวัติความเป็นมา"}</span>
        </nav>

        {/* Header: ถ้าไม่มีทั้ง title และ subtitle จะไม่แสดงกล่องนี้ */}
        {hasHeader && (
          <div className="text-center space-y-2 pb-2">
            {data.title && (
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
                {data.title}
              </h1>
            )}
            {data.subtitle && (
              <p className="text-base sm:text-lg text-forest-800 font-medium">{data.subtitle}</p>
            )}
          </div>
        )}

        {/* รูปภาพหน้าปกหัวเรื่อง: แสดงเฉพาะเมื่อมีรูป */}
        {hasCover && (
          <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.coverImage}
              alt={data.title || "ประวัติความเป็นมา"}
              className="w-full max-h-[500px] object-contain mx-auto"
            />
          </div>
        )}

        {/* เนื้อหาข้อความ: แสดงเฉพาะเมื่อมีข้อความ */}
        {hasTextContent && (
          <article className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-sm text-slate-800 text-base sm:text-lg leading-relaxed whitespace-pre-line text-justify">
            {data.content}
          </article>
        )}

        {/* รูปภาพเนื้อหา: แสดงเรียงต่อกันลงมาในแนวตั้งแบบแนบเนียน */}
        {hasImages && (
          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden divide-y divide-slate-100">
            {data.images?.map((item, index) => (
              <figure key={item.id || index} className="p-2 sm:p-4 flex flex-col items-center">
                <div className="w-full flex justify-center bg-slate-50 rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.caption || `รูปภาพเนื้อหาที่ ${index + 1}`}
                    className="w-full h-auto max-w-full object-contain mx-auto block"
                    loading="lazy"
                  />
                </div>
                {item.caption && (
                  <figcaption className="text-center text-xs sm:text-sm text-slate-600 font-medium pt-2 pb-1 px-4">
                    {item.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </section>
        )}

      </div>
    </main>
  );
}
