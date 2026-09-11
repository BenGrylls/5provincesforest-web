import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

/**
 * โครงสร้างโฟลเดอร์ไฟล์อัปโหลด
 *
 *   public/uploads/
 *   ├── news/          รูปภาพข่าวสารและกิจกรรม
 *   ├── media/         วิดีโอสารคดีและภาพปกที่สร้างจากวิดีโอ
 *   ├── publications/  ไฟล์ PDF วารสารและเอกสาร
 *   ├── history/       รูปภาพหน้าประวัติความเป็นมา
 *   └── cover/         รูปพื้นหลังและลวดลายของ Cover วันสำคัญ
 *
 * เดิมทุกอย่างยกเว้น history ถูกทิ้งรวมกันแบนๆ ใน public/uploads/ ชื่อเป็น UUID ล้วน
 * จึงดูไม่ออกว่าไฟล์ไหนของอะไร ลบไฟล์ที่ไม่ใช้แล้วก็ไม่ได้ และสำรองเฉพาะบางส่วนไม่ได้
 */
export type UploadFolder = 'news' | 'media' | 'publications' | 'history' | 'cover';

const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads');

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'application/pdf': '.pdf',
};

// เดิมไม่มีการจำกัดขนาดไฟล์เลย ใครก็อัปโหลดไฟล์ใหญ่แค่ไหนก็ได้ (เสี่ยงถม disk เต็ม)
const MAX_FILE_SIZE_BYTES: Record<string, number> = {
  'image/jpeg': 10 * 1024 * 1024, // 10 MB
  'image/png': 10 * 1024 * 1024,
  'image/webp': 10 * 1024 * 1024,
  'image/gif': 10 * 1024 * 1024,
  'video/mp4': 200 * 1024 * 1024, // 200 MB
  'video/webm': 200 * 1024 * 1024,
  'application/pdf': 30 * 1024 * 1024, // 30 MB
};

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const VIDEO_TYPES = ['video/mp4', 'video/webm'];

export function isImage(file: File) {
  return IMAGE_TYPES.includes(file.type);
}

export function isVideo(file: File) {
  return VIDEO_TYPES.includes(file.type);
}

export function isPdf(file: File) {
  return file.type === 'application/pdf';
}

type SaveOptions = {
  /** จำกัดชนิดไฟล์ให้แคบกว่าค่าเริ่มต้นของ endpoint นั้นๆ */
  accept?: string[];
};

/**
 * บันทึกไฟล์ลงโฟลเดอร์ตามหมวด แล้วคืน path สาธารณะ เช่น /uploads/news/2026-09-11-<uuid>.jpg
 * ชื่อไฟล์นำหน้าด้วยวันที่เพื่อให้เรียงตามเวลาและกวาดไฟล์เก่าได้ง่าย
 */
export async function saveUpload(file: File, folder: UploadFolder, options: SaveOptions = {}) {
  const extension = EXTENSIONS[file.type];
  if (!extension || file.size === 0) {
    throw new Error('รองรับเฉพาะไฟล์ JPG, PNG, WebP, GIF, MP4, WebM หรือ PDF และไฟล์ต้องไม่ว่างเปล่า');
  }
  if (options.accept && !options.accept.includes(file.type)) {
    throw new Error('ชนิดไฟล์ไม่ตรงกับที่ช่องอัปโหลดนี้รองรับ');
  }
  const maxSize = MAX_FILE_SIZE_BYTES[file.type];
  if (maxSize && file.size > maxSize) {
    throw new Error(`ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${Math.round(maxSize / 1024 / 1024)} MB)`);
  }

  const uploadDir = path.join(UPLOADS_ROOT, folder);
  await mkdir(uploadDir, { recursive: true });
  const datePrefix = new Date().toISOString().slice(0, 10);
  const filename = `${datePrefix}-${randomUUID()}${extension}`;
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${folder}/${filename}`;
}

/**
 * แปลง path สาธารณะ (/uploads/...) เป็น path จริงบนดิสก์ สำหรับ route ที่ต้องอ่านไฟล์เอง
 * คืน null ถ้าชี้ออกนอก public/uploads เพื่อกัน path traversal
 *
 * รองรับทั้งไฟล์เก่าที่อยู่แบนๆ (/uploads/x.pdf) และไฟล์ใหม่ที่อยู่ในโฟลเดอร์หมวด
 */
export function resolveUploadPath(publicPath: string): string | null {
  if (!publicPath.startsWith('/uploads/')) return null;
  const resolved = path.resolve(UPLOADS_ROOT, publicPath.slice('/uploads/'.length));
  if (resolved !== UPLOADS_ROOT && !resolved.startsWith(UPLOADS_ROOT + path.sep)) return null;
  return resolved;
}
