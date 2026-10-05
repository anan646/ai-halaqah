import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'กลุ่มศึกษาอัลกุรอาน • ระบบเช็คชื่อ',
    short_name: 'หะละเกาะห์',
    description: 'ระบบบันทึกและติดตามการเข้าร่วมกลุ่มศึกษาอัลกุรอาน คณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#faf8fc',
    theme_color: '#6b21a8',
    lang: 'th',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
