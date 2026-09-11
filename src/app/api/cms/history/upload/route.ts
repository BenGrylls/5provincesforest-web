import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "ไม่พบไฟล์ที่ต้องการอัปโหลด" }, { status: 400 });
    }

    // ตรวจสอบนามสกุลไฟล์
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ success: false, message: "รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP, GIF)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // กำหนดโฟลเดอร์ปลายทางใน public/uploads/history
    const uploadDir = path.join(process.cwd(), "public", "uploads", "history");
    await mkdir(uploadDir, { recursive: true });

    // ตั้งชื่อไฟล์เพื่อป้องกันการซ้ำ
    const ext = path.extname(file.name) || ".jpg";
    const fileName = `history_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/history/${fileName}`;

    return NextResponse.json({
      success: true,
      message: "อัปโหลดรูปภาพสำเร็จ",
      url: publicUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, message: "เกิดข้อผิดพลาดขณะอัปโหลดไฟล์" }, { status: 500 });
  }
}
