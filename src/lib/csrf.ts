// PATCH(8): SameSite=Lax ที่ cookie session ใช้อยู่แล้วกัน CSRF พื้นฐานได้ระดับหนึ่ง
// แต่ form POST ข้ามโดเมนบางกรณียังหลุดผ่านมาได้ (เช่น เบราว์เซอร์เก่า/ตั้งค่าพิเศษ)
// ฟังก์ชันนี้เช็ค Origin header เป็นเกราะสำรอง เรียกใน route ที่เปลี่ยนข้อมูล (POST/PATCH/PUT/DELETE)
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // request แบบ non-browser (curl/Postman/healthcheck) — ไม่มี Origin ให้เช็ค
  try {
    const host = request.headers.get('host');
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}