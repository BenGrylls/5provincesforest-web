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
};

module.exports = nextConfig;
