import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'application/pdf': '.pdf',
};

export function isImage(file: File) {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
}

export function isVideo(file: File) {
  return ['video/mp4', 'video/webm'].includes(file.type);
}

export function isPdf(file: File) {
  return file.type === 'application/pdf';
}

export async function saveUpload(file: File) {
  const extension = EXTENSIONS[file.type];
  if (!extension || file.size === 0) {
    throw new Error('รองรับเฉพาะไฟล์ JPG, PNG, WebP, MP4, WebM หรือ PDF และไฟล์ต้องไม่ว่างเปล่า');
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });
  const filename = `${randomUUID()}${extension}`;
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${filename}`;
}
