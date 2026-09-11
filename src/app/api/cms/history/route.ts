import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { canManageHistory, isAuthenticated } from "@/lib/auth";

export interface HistoryImageItem {
  id: string;
  url: string;
  caption?: string;
}

export interface HistoryData {
  title?: string;
  subtitle?: string;
  coverImage?: string;
  content?: string;
  images?: HistoryImageItem[];
  updatedAt?: string;
}

const FALLBACK: HistoryData = {
  title: "",
  subtitle: "",
  coverImage: "",
  content: "",
  images: [],
};

/** เก็บเฉพาะฟิลด์ที่รู้จัก ไม่ปล่อยให้ payload แปลกปลอมหลุดลง JSONB */
function cleanImages(value: unknown): HistoryImageItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : "",
      url: typeof item.url === "string" ? item.url : "",
      caption: typeof item.caption === "string" ? item.caption : "",
    }))
    .filter((item) => item.url);
}

export async function getSavedHistory(): Promise<HistoryData> {
  try {
    const result = await query(
      "SELECT title, subtitle, cover_image, content, images, updated_at FROM history_page WHERE id = $1",
      ["global"],
    );
    const row = result.rows[0];
    if (!row) return FALLBACK;
    return {
      title: row.title || "",
      subtitle: row.subtitle || "",
      coverImage: row.cover_image || "",
      content: row.content || "",
      images: Array.isArray(row.images) ? row.images : [],
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    };
  } catch {
    return FALLBACK;
  }
}

// GET เปิดสาธารณะโดยตั้งใจ — หน้า /about/history ของผู้เข้าชมทั่วไปอ่านผ่าน endpoint นี้
export async function GET() {
  const data = await getSavedHistory();
  return NextResponse.json({ success: true, data });
}

export async function PUT(req: NextRequest) {
  // เดิมไม่มีการตรวจสิทธิ์เลย ใครก็เขียนทับเนื้อหาหน้าประวัติได้โดยไม่ต้องเข้าสู่ระบบ
  // และสิทธิ์ 'ประวัติความเป็นมา' ที่กำหนดให้ sub-admin ก็ไม่มีผลจริง
  if (!isAuthenticated(req)) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  if (!await canManageHistory(req)) {
    return NextResponse.json({ success: false, message: "ไม่มีสิทธิ์แก้ไขประวัติความเป็นมา" }, { status: 403 });
  }

  try {
    const body: HistoryData = await req.json();

    // บันทึกข้อมูลตามที่ส่งมา (ฟิลด์ไหนเว้นว่างไว้ก็บันทึกเป็นค่าว่างได้)
    const images = cleanImages(body.images);
    const result = await query(
      `INSERT INTO history_page (id, title, subtitle, cover_image, content, images, updated_at)
       VALUES ('global', $1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         subtitle = EXCLUDED.subtitle,
         cover_image = EXCLUDED.cover_image,
         content = EXCLUDED.content,
         images = EXCLUDED.images,
         updated_at = CURRENT_TIMESTAMP
       RETURNING title, subtitle, cover_image, content, images, updated_at`,
      [
        body.title?.trim() || "",
        body.subtitle?.trim() || "",
        body.coverImage?.trim() || "",
        body.content?.trim() || "",
        JSON.stringify(images),
      ],
    );

    const row = result.rows[0];
    return NextResponse.json({
      success: true,
      message: "บันทึกข้อมูลประวัติความเป็นมาเรียบร้อยแล้ว",
      data: {
        title: row.title,
        subtitle: row.subtitle,
        coverImage: row.cover_image,
        content: row.content,
        images: row.images,
        updatedAt: new Date(row.updated_at).toISOString(),
      },
    });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json({ success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
  }
}
