import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
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

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "history.json");

const defaultData: HistoryData = {
  title: "ประวัติความเป็นมา มูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด",
  subtitle: "โครงการอนุรักษ์ทรัพยากรป่าไม้และสัตว์ป่า ในพื้นที่รอยต่อ ๕ จังหวัดภาคตะวันออก",
  coverImage: "",
  content: "",
  images: [],
  updatedAt: new Date().toISOString(),
};

async function getSavedHistory(): Promise<HistoryData> {
  try {
    const file = await readFile(DATA_FILE_PATH, "utf8");
    const parsed = JSON.parse(file);
    return {
      ...defaultData,
      ...parsed,
      images: Array.isArray(parsed.images) ? parsed.images : [],
    };
  } catch {
    return defaultData;
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
    const updatedData: HistoryData = {
      title: body.title?.trim() || "",
      subtitle: body.subtitle?.trim() || "",
      coverImage: body.coverImage?.trim() || "",
      content: body.content?.trim() || "",
      images: Array.isArray(body.images) ? body.images : [],
      updatedAt: new Date().toISOString(),
    };

    const dataDir = path.dirname(DATA_FILE_PATH);
    await mkdir(dataDir, { recursive: true });
    await writeFile(DATA_FILE_PATH, JSON.stringify(updatedData, null, 2), "utf8");

    return NextResponse.json({
      success: true,
      message: "บันทึกข้อมูลประวัติความเป็นมาเรียบร้อยแล้ว",
      data: updatedData,
    });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json({ success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
  }
}
