import { NextRequest, NextResponse } from "next/server";
import { canManageHistory, getAdminSession, isAuthenticated } from "@/lib/auth";
import { logCsrfBlocked, logForbidden, writeAuditLog } from "@/lib/audit-log";
import { sameOrigin } from "@/lib/csrf";
import { saveUpload } from "@/lib/uploads";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) {
    await logCsrfBlocked(req);
    return NextResponse.json({ success: false, message: "CSRF check failed" }, { status: 403 });
  }
  // เดิมไม่มีการตรวจสิทธิ์เลย ใครก็อัปโหลดไฟล์ขึ้นเซิร์ฟเวอร์ได้โดยไม่ต้องเข้าสู่ระบบ
  if (!isAuthenticated(req)) {
    return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  if (!await canManageHistory(req)) {
    const actor = await getAdminSession(req);
    await logForbidden(req, {
      username: actor?.username || 'unknown',
      category: 'history',
      targetType: 'upload_folder',
      targetTitle: 'history',
      reason: 'ไม่มีสิทธิ์อัปโหลดรูปภาพประวัติความเป็นมา',
    });
    return NextResponse.json({ success: false, message: "ไม่มีสิทธิ์อัปโหลดรูปภาพประวัติความเป็นมา" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, message: "ไม่พบไฟล์ที่ต้องการอัปโหลด" }, { status: 400 });
    }
    if (!ACCEPTED.includes(file.type)) {
      return NextResponse.json({ success: false, message: "รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP, GIF)" }, { status: 400 });
    }

    // เดิม route นี้เขียนไฟล์เองและตั้งนามสกุลจากชื่อไฟล์ที่ผู้ใช้ส่งมา (ปลอมได้)
    // อีกทั้งไม่จำกัดขนาดไฟล์ ต่างจาก saveUpload ที่ใช้ร่วมกับ endpoint อื่น
    const url = await saveUpload(file, "history", { accept: ACCEPTED });

    const actor = await getAdminSession(req);
    await writeAuditLog({
      request: req,
      username: actor?.username || 'unknown',
      action: 'UPLOAD',
      category: 'history',
      targetType: 'upload_folder',
      targetTitle: file.name,
      detail: { folder: 'history', path: url, size: file.size, type: file.type },
    });

    return NextResponse.json({ success: true, message: "อัปโหลดรูปภาพสำเร็จ", url });
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดขณะอัปโหลดไฟล์";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}