'use client';

import React, { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'halaqah_pwa_install_dismissed_v1';

/** ลงทะเบียน Service Worker พร้อมระบบตรวจจับเวอร์ชันใหม่แบบเรียลไทม์ (ไม่ต้องลบแอปแล้วติดตั้งใหม่) */
export function usePwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        // เมื่อ Service Worker เวอร์ชันใหม่อัปเดต ให้รีเฟรชหน้าเว็บอัตโนมัติ เพื่อรับโค้ดล่าสุดทันที
        window.location.reload();
      }
    });

    const triggerUpdate = (reg: ServiceWorkerRegistration) => {
      reg.update().catch(() => null);
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      if (reg.installing) {
        reg.installing.addEventListener('statechange', (e: any) => {
          if (e.target.state === 'installed') {
            reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      }
    };

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((reg) => {
          triggerUpdate(reg);

          // ตรวจหาอัปเดตเมื่อผู้ใช้สลับกลับมาที่แอป
          window.addEventListener('focus', () => triggerUpdate(reg));
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') triggerUpdate(reg);
          });

          // ตรวจหาอัปเดตอัตโนมัติทุก 30 วินาที
          const interval = setInterval(() => triggerUpdate(reg), 30000);
          return () => clearInterval(interval);
        })
        .catch(() => null);
    };

    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });
  }, []);
}

/** แถบชวนติดตั้งแอป — Android/Chrome/Edge กดติดตั้งได้ทันที, iPhone แสดงวิธีเพิ่มลงหน้าจอโฮม */
export const PwaInstallPrompt: React.FC = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === 'true';
    } catch {}
    if (standalone || dismissed) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
    if (isIos) {
      setIos(true);
      setShow(true);
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    const onInstalled = () => setShow(false);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {}
  };

  const install = async () => {
    if (ios) {
      setIosHelp(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') setShow(false);
    setDeferred(null);
  };

  return (
    <div className="fixed left-3 right-3 bottom-24 md:bottom-6 md:left-auto md:right-6 md:w-[380px] z-50 print:hidden animate-fadeIn">
      <div className="rounded-3xl bg-white border border-purple-200 shadow-2xl shadow-purple-900/20 p-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-black text-purple-950 text-sm">ติดตั้งแอปลงเครื่อง</div>
            <div className="text-xs text-purple-600">เปิดเร็วจากหน้าจอโฮม ใช้งานเหมือนแอป</div>
          </div>
          <button type="button" onClick={dismiss} className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-50" aria-label="ปิด">
            <X className="w-4 h-4" />
          </button>
        </div>

        {iosHelp ? (
          <div className="mt-3 rounded-2xl bg-purple-50 p-3 text-xs text-purple-900 space-y-1.5">
            <div className="flex items-center gap-1.5">
              1. แตะปุ่มแชร์ <Share className="w-4 h-4 inline" /> ด้านล่างของ Safari
            </div>
            <div>2. เลือก &ldquo;เพิ่มไปยังหน้าจอโฮม&rdquo; (Add to Home Screen)</div>
            <div>3. แตะ &ldquo;เพิ่ม&rdquo;</div>
          </div>
        ) : (
          <button
            type="button"
            onClick={install}
            className="mt-3 w-full py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 to-purple-900 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <Download className="w-4 h-4" /> ติดตั้งแอป
          </button>
        )}
      </div>
    </div>
  );
};
