import React from 'react';
import { jsPDF } from 'jspdf';
import { renderElementToCanvas } from './offscreen-render';
import { CERT_W, CERT_H } from '@/components/CertificateCanvas';

/**
 * ทั้งการพิมพ์และการบันทึก PDF เรนเดอร์จาก "ผืนผ้าใบเดียวกัน" ขนาด 1123×794 px (A4 แนวนอน)
 * นอกหน้าจอ จึงได้ผลตรงกับที่เห็นในตัวอย่างเสมอ และเป็นแนวนอนเสมอ
 */
async function captureCertificate(element: React.ReactElement, scale = 2.5) {
  return renderElementToCanvas(element, CERT_W, { scale, height: CERT_H, background: '#ffffff' });
}

/** บันทึกเป็นไฟล์ PDF A4 แนวนอน (297×210 มม.) เต็มหน้า */
export async function saveCertificatePdf(element: React.ReactElement, filename: string): Promise<void> {
  const canvas = await captureCertificate(element);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/** สั่งพิมพ์ทางเครื่องพิมพ์ — ตั้งกระดาษ A4 แนวนอนไม่มีขอบ ภาพเต็มหน้า */
export async function printCertificate(element: React.ReactElement, title = 'เกียรติบัตร'): Promise<void> {
  const canvas = await captureCertificate(element, 2.2);
  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  const html = `<!DOCTYPE html>
<html lang="th"><head><meta charset="UTF-8"><title>${title.replace(/</g, '&lt;')}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  img { display: block; width: 297mm; height: 210mm; }
  @media print { html, body { width: 297mm; height: 210mm; overflow: hidden; } }
</style></head>
<body><img id="cert" alt="" src="${imgData}"></body></html>`;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    throw new Error('ไม่สามารถเตรียมหน้าพิมพ์ได้');
  }
  doc.open();
  doc.write(html);
  doc.close();

  await new Promise<void>((resolve) => {
    const img = doc.getElementById('cert') as HTMLImageElement | null;
    const go = () => {
      win.focus();
      win.print();
      resolve();
    };
    if (!img || img.complete) setTimeout(go, 150);
    else img.onload = () => setTimeout(go, 150);
  });
  setTimeout(() => iframe.remove(), 60000);
}
