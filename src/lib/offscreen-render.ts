import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import html2canvas from 'html2canvas';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitForAssets(root: HTMLElement) {
  try {
    await (document as any).fonts?.ready;
  } catch {}
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((res) => {
              img.onload = () => res();
              img.onerror = () => res();
            })
    )
  );
  // ให้เบราว์เซอร์จัดวางตัวอักษรไทยให้เสร็จก่อนแคปเจอร์
  await wait(120);
}

/**
 * เรนเดอร์ React element นอกหน้าจอ ที่ขนาดจริง (ไม่ผ่าน transform/scale ใด ๆ)
 * แล้วแคปเป็น canvas — ผลลัพธ์จึงตรงกับสิ่งที่ออกแบบไว้เสมอ ไม่ขึ้นกับขนาดหน้าต่าง
 */
export async function renderElementToCanvas(
  element: React.ReactElement,
  width: number,
  opts: { scale?: number; height?: number; background?: string } = {}
): Promise<HTMLCanvasElement> {
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-20000px;top:0;width:${width}px;pointer-events:none;z-index:-1;`;
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    flushSync(() => root.render(element));
    await waitForAssets(host);
    const target = (host.firstElementChild as HTMLElement) || host;
    return await html2canvas(target, {
      scale: opts.scale ?? 2,
      width,
      height: opts.height ?? target.scrollHeight,
      windowWidth: width,
      useCORS: true,
      allowTaint: false,
      backgroundColor: opts.background ?? '#ffffff',
      logging: false,
      imageTimeout: 15000,
    });
  } finally {
    root.unmount();
    host.remove();
  }
}
