/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack (ค่าเริ่มต้นของ Next 16) ใช้ resolveAlias แทน resolve.fallback ของ webpack
  turbopack: {
    resolveAlias: {
      canvas: './empty-module.js',
    },
  },
  // เก็บไว้เผื่อรันด้วย `next dev --webpack` / `next build --webpack`
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    };
    return config;
  },
  // ตรวจแล้วว่า: หน้า /media/[id] ฝัง iframe จาก YouTube/TikTok/Facebook และดึง thumbnail จาก
  // img.youtube.com — CSP ด้านล่างเปิดเฉพาะโฮสต์เหล่านี้ตามจริง ไม่ได้เปิดกว้างเกินจำเป็น
  // 'unsafe-inline' ใน script-src/style-src จำเป็นจริงๆ เพราะ Next.js App Router แทรก
  // inline script (self.__next_f.push(...)) สำหรับ hydration ในทุกหน้าอยู่แล้ว (ยืนยันด้วยการ
  // build+curl ดู HTML จริง) และโปรเจกต์นี้มีการใช้ style={{...}} (inline style attribute) จริง
  // — ถ้าจะรัดกุมกว่านี้ต้องทำ nonce-based CSP ผ่าน proxy.ts ซึ่งเป็นงานแยกที่เสี่ยงพังง่ายกว่า
  async headers() {
    // React ใน dev mode ต้องใช้ eval() สำหรับ debug features (reconstructing stack trace, HMR)
    // แต่ "React จะไม่ใช้ eval() เลยตอน production mode" (คำเตือนของ React เอง) — เปิด
    // unsafe-eval เฉพาะตอน dev พอ ไม่เปิดตอน build จริงเพื่อไม่ให้ CSP หลวมโดยไม่จำเป็น
    const isDev = process.env.NODE_ENV !== 'production';
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://img.youtube.com",
      "font-src 'self' data:",
      "frame-src 'self' https://www.youtube.com https://www.tiktok.com https://www.facebook.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

module.exports = nextConfig;