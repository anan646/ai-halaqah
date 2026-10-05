/**
 * อ่านไฟล์รูปแล้วย่อให้ไม่เกินขนาดที่กำหนด เพื่อไม่ให้เกินโควตา localStorage
 * - ลายเซ็น/โลโก้: ใช้ PNG เพื่อรักษาความโปร่งใส
 * - พื้นหลังเกียรติบัตร: ใช้ JPEG
 */
export function fileToResizedDataUrl(
  file: File,
  maxW: number,
  maxH: number,
  type: 'image/png' | 'image/jpeg' = 'image/png',
  quality = 0.9
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('ไฟล์ไม่ใช่รูปภาพที่รองรับ'));
      img.onload = () => {
        const ratio = Math.min(1, maxW / img.width, maxH / img.height);
        const w = Math.max(1, Math.round(img.width * ratio));
        const h = Math.max(1, Math.round(img.height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('ไม่รองรับการประมวลผลรูป'));
        if (type === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL(type, quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
