'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  CertificateConfig,
  CertificateTemplate,
  CERTIFICATE_TEMPLATES,
} from '@/lib/certificate-config';

/** ขนาดผืนผ้าใบเกียรติบัตร A4 แนวนอน (px ที่ 96dpi) — ใช้ทั้งหน้าจอ พิมพ์ และ PDF เหมือนกันทุกประการ */
export const CERT_W = 1123;
export const CERT_H = 794;

export interface CertificateStudentData {
  fullName: string;
  studentId: string;
  major: string;
  yearLevel: string;
  groupName?: string;
  rate: number;
  present: number;
  total: number;
  levelLabel: string;
}

export const SAMPLE_CERT_STUDENT: CertificateStudentData = {
  fullName: 'นายมูฮัมหมัด อับดุลลอฮ์',
  studentId: '681441001',
  major: 'อิสลามศึกษา',
  yearLevel: 'ปี 2',
  groupName: 'ชั้นปีที่ 2 กลุ่มที่ 1',
  rate: 95.8,
  present: 12,
  total: 12,
  levelLabel: 'ระดับ 01',
};

export function getTemplate(id: string): CertificateTemplate {
  return CERTIFICATE_TEMPLATES.find((t) => t.id === id) || CERTIFICATE_TEMPLATES[0];
}

const SERIF = "'Noto Serif Thai', 'Sarabun', serif";
const SANS = "'Sarabun', 'IBM Plex Sans Thai', sans-serif";
const HEAD = "'Prompt', 'Sarabun', sans-serif";

interface Geometry {
  left: number;
  right: number;
  top: number;
  bottom: number;
  align: 'center' | 'left';
  titleStyle: 'pill' | 'lines' | 'plain' | 'ribbon';
  /** เนื้อหาหัว (โลโก้+ชื่อสถาบัน) อยู่ในแถบสี ไม่ต้องวาดซ้ำในเนื้อหา */
  headerInBand?: 'top' | 'left';
  serif?: boolean;
}

const GEOMETRY: Record<string, Geometry> = {
  royal: { left: 92, right: 92, top: 62, bottom: 56, align: 'center', titleStyle: 'lines' },
  emerald: { left: 110, right: 110, top: 78, bottom: 74, align: 'center', titleStyle: 'pill' },
  minimal: { left: 120, right: 90, top: 66, bottom: 62, align: 'left', titleStyle: 'plain' },
  navy: { left: 90, right: 90, top: 196, bottom: 52, align: 'center', titleStyle: 'lines', headerInBand: 'top' },
  arch: { left: 218, right: 218, top: 78, bottom: 84, align: 'center', titleStyle: 'pill' },
  floral: { left: 112, right: 112, top: 64, bottom: 62, align: 'center', titleStyle: 'lines' },
  'purple-band': { left: 318, right: 68, top: 54, bottom: 54, align: 'center', titleStyle: 'pill', headerInBand: 'left' },
  parchment: { left: 108, right: 108, top: 74, bottom: 70, align: 'center', titleStyle: 'lines', serif: true },
  wave: { left: 96, right: 96, top: 112, bottom: 92, align: 'center', titleStyle: 'pill' },
  noir: { left: 96, right: 96, top: 68, bottom: 62, align: 'center', titleStyle: 'lines' },
  diagonal: { left: 130, right: 130, top: 60, bottom: 56, align: 'center', titleStyle: 'plain' },
  ribbon: { left: 96, right: 96, top: 54, bottom: 54, align: 'center', titleStyle: 'ribbon' },
};

/* ------------------------------------------------------------------ */
/* ลวดลายประกอบแต่ละแบบ (SVG ล้วน เพื่อให้ html2canvas วาดตรงกับหน้าจอ)     */
/* ------------------------------------------------------------------ */

const Corner: React.FC<{ color: string; accent: string }> = ({ color, accent }) => (
  <g>
    <path d="M0 0 H70 M0 0 V70" stroke={color} strokeWidth="5" fill="none" />
    <path d="M14 14 H52 M14 14 V52" stroke={accent} strokeWidth="2" fill="none" />
    <path d="M26 26 Q58 26 58 58" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="26" cy="26" r="5" fill={accent} />
    <circle cx="70" cy="0" r="3.5" fill={color} />
    <circle cx="0" cy="70" r="3.5" fill={color} />
  </g>
);

const Leaf: React.FC<{ x: number; y: number; r: number; c: string }> = ({ x, y, r, c }) => (
  <ellipse cx={x} cy={y} rx="15" ry="6" fill={c} transform={`rotate(${r} ${x} ${y})`} />
);

const VineCorner: React.FC<{ color: string; accent: string }> = ({ color, accent }) => (
  <g>
    <path d="M24 24 C120 30 150 80 150 170" stroke={color} strokeWidth="3" fill="none" />
    <path d="M24 24 C30 120 80 150 170 150" stroke={color} strokeWidth="3" fill="none" />
    <Leaf x={70} y={46} r={20} c={accent} />
    <Leaf x={100} y={70} r={45} c={color} />
    <Leaf x={126} y={110} r={70} c={accent} />
    <Leaf x={46} y={70} r={70} c={accent} />
    <Leaf x={70} y={100} r={45} c={color} />
    <Leaf x={110} y={126} r={20} c={accent} />
    <circle cx="24" cy="24" r="8" fill={color} />
    <circle cx="24" cy="24" r="3.5" fill="#fff" />
    <circle cx="150" cy="176" r="5" fill={accent} />
    <circle cx="176" cy="150" r="5" fill={accent} />
  </g>
);

const starPoints = (cx: number, cy: number, r: number) => {
  // ดาว 8 แฉก (สี่เหลี่ยมสองใบซ้อนหมุน 45°)
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const rad = (Math.PI / 8) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.62;
    pts.push(`${(cx + rr * Math.cos(rad)).toFixed(2)},${(cy + rr * Math.sin(rad)).toFixed(2)}`);
  }
  return pts.join(' ');
};

const Decor: React.FC<{ t: CertificateTemplate }> = ({ t }) => {
  const p = t.borderColor;
  const a = t.innerBorderColor;
  const W = CERT_W;
  const H = CERT_H;

  switch (t.layout) {
    case 'royal':
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
          <rect x="16" y="16" width={W - 32} height={H - 32} fill="none" stroke={p} strokeWidth="8" />
          <rect x="30" y="30" width={W - 60} height={H - 60} fill="none" stroke={a} strokeWidth="2.5" />
          <rect x="38" y="38" width={W - 76} height={H - 76} fill="none" stroke={p} strokeWidth="1" />
          <g transform="translate(30 30)"><Corner color={p} accent={a} /></g>
          <g transform={`translate(${W - 30} 30) scale(-1 1)`}><Corner color={p} accent={a} /></g>
          <g transform={`translate(30 ${H - 30}) scale(1 -1)`}><Corner color={p} accent={a} /></g>
          <g transform={`translate(${W - 30} ${H - 30}) scale(-1 -1)`}><Corner color={p} accent={a} /></g>
          {/* ลวดลายกึ่งกลางด้านบน/ล่าง */}
          {[30, H - 30].map((y) => (
            <g key={y}>
              <path d={`M${W / 2 - 90} ${y} H${W / 2 - 14} M${W / 2 + 14} ${y} H${W / 2 + 90}`} stroke={a} strokeWidth="2" />
              <polygon points={`${W / 2},${y - 9} ${W / 2 + 9},${y} ${W / 2},${y + 9} ${W / 2 - 9},${y}`} fill={p} />
            </g>
          ))}
        </svg>
      );

    case 'emerald': {
      const inner = 58;
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <pattern id="emStar" width="46" height="46" patternUnits="userSpaceOnUse">
              <rect width="46" height="46" fill={p} />
              <polygon points={starPoints(23, 23, 19)} fill="none" stroke={a} strokeWidth="1.6" />
              <polygon points={starPoints(23, 23, 8)} fill={a} opacity="0.55" />
            </pattern>
          </defs>
          <path
            fillRule="evenodd"
            fill="url(#emStar)"
            d={`M0 0 H${W} V${H} H0 Z M${inner} ${inner} V${H - inner} H${W - inner} V${inner} Z`}
          />
          <rect x={inner} y={inner} width={W - inner * 2} height={H - inner * 2} fill="none" stroke={a} strokeWidth="5" />
          <rect x={inner + 10} y={inner + 10} width={W - inner * 2 - 20} height={H - inner * 2 - 20} fill="none" stroke={p} strokeWidth="1.5" />
        </svg>
      );
    }

    case 'minimal':
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
          <rect x="0" y="0" width="26" height={H} fill={p} />
          <rect x="26" y="0" width="6" height={H} fill={a} />
          <circle cx={W - 40} cy="40" r="210" fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
          <circle cx={W - 40} cy="40" r="160" fill="none" stroke="#eef2f7" strokeWidth="1.5" />
          <rect x="120" y={H - 36} width={W - 210} height="1.5" fill="#cbd5e1" />
        </svg>
      );

    case 'navy':
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
          <rect x="0" y="0" width={W} height="176" fill={p} />
          <rect x="0" y="176" width={W} height="8" fill={a} />
          {/* ลายตารางโปร่งในแถบหัว */}
          {Array.from({ length: 10 }).map((_, i) => (
            <polygon
              key={i}
              points={starPoints(60 + i * 112, 88, 46)}
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.07"
              strokeWidth="2"
            />
          ))}
          <rect x="0" y={H - 22} width={W} height="22" fill={p} />
          <rect x="0" y={H - 28} width={W} height="6" fill={a} />
        </svg>
      );

    case 'arch': {
      const x0 = 124;
      const x1 = W - 124;
      const spring = 300;
      const arch = `M${x0} ${H - 52} V${spring} A${(x1 - x0) / 2} 236 0 0 1 ${x1} ${spring} V${H - 52} Z`;
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <pattern id="archDots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="11" cy="11" r="2.2" fill={a} />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#archDots)" opacity="0.7" />
          <path d={arch} fill="#fffaf2" stroke={p} strokeWidth="7" />
          <path
            d={`M${x0 + 14} ${H - 66} V${spring} A${(x1 - x0) / 2 - 14} 222 0 0 1 ${x1 - 14} ${spring} V${H - 66} Z`}
            fill="none"
            stroke={a}
            strokeWidth="2.5"
          />
          {[56, W - 56].map((x) => (
            <g key={x}>
              <polygon points={starPoints(x, 96, 26)} fill={p} />
              <polygon points={starPoints(x, 96, 11)} fill={a} />
              <polygon points={starPoints(x, H - 96, 26)} fill={p} />
              <polygon points={starPoints(x, H - 96, 11)} fill={a} />
            </g>
          ))}
        </svg>
      );
    }

    case 'floral':
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
          <rect x="22" y="22" width={W - 44} height={H - 44} fill="none" stroke={p} strokeWidth="3" />
          <rect x="30" y="30" width={W - 60} height={H - 60} fill="none" stroke={a} strokeWidth="1.5" />
          <g><VineCorner color={p} accent={a} /></g>
          <g transform={`translate(${W} 0) scale(-1 1)`}><VineCorner color={p} accent={a} /></g>
          <g transform={`translate(0 ${H}) scale(1 -1)`}><VineCorner color={p} accent={a} /></g>
          <g transform={`translate(${W} ${H}) scale(-1 -1)`}><VineCorner color={p} accent={a} /></g>
        </svg>
      );

    case 'purple-band': {
      const bw = 274;
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <linearGradient id="pbGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4c1d95" />
              <stop offset="55%" stopColor="#6b21a8" />
              <stop offset="100%" stopColor="#2e1065" />
            </linearGradient>
          </defs>
          <rect width={bw} height={H} fill="url(#pbGrad)" />
          <rect x={bw} width="8" height={H} fill={a} />
          <circle cx="40" cy={H - 90} r="170" fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="2" />
          <circle cx="40" cy={H - 90} r="120" fill="none" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="2" />
          <circle cx="40" cy={H - 90} r="70" fill="#ffffff" fillOpacity="0.05" />
          <polygon points={starPoints(bw - 56, 74, 38)} fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth="2" />
          <rect x={bw + 36} y="34" width={W - bw - 70} height={H - 68} fill="none" stroke={a} strokeWidth="2" />
          <rect x={bw + 44} y="42" width={W - bw - 86} height={H - 84} fill="none" stroke={p} strokeWidth="1" strokeOpacity="0.5" />
        </svg>
      );
    }

    case 'parchment':
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
          <rect x="22" y="22" width={W - 44} height={H - 44} rx="14" fill="none" stroke={p} strokeWidth="9" />
          <rect x="40" y="40" width={W - 80} height={H - 80} rx="8" fill="none" stroke={a} strokeWidth="2.5" />
          {[
            [40, 40, 1, 1],
            [W - 40, 40, -1, 1],
            [40, H - 40, 1, -1],
            [W - 40, H - 40, -1, -1],
          ].map(([x, y, sx, sy], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
              <path d="M0 0 C46 0 62 20 52 42 C44 58 24 54 26 38 C28 28 40 28 40 36" stroke={p} strokeWidth="3" fill="none" />
              <circle cx="40" cy="36" r="3.5" fill={p} />
            </g>
          ))}
        </svg>
      );

    case 'wave':
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <linearGradient id="wvA" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0f766e" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
          </defs>
          <path d={`M0 0 H${W} V70 C${W * 0.8} 130 ${W * 0.62} 20 ${W * 0.42} 74 C${W * 0.24} 120 ${W * 0.12} 80 0 112 Z`} fill={a} opacity="0.55" />
          <path d={`M0 0 H${W} V46 C${W * 0.82} 96 ${W * 0.6} 8 ${W * 0.4} 52 C${W * 0.22} 90 ${W * 0.1} 60 0 84 Z`} fill="url(#wvA)" />
          <path d={`M0 ${H} H${W} V${H - 70} C${W * 0.8} ${H - 28} ${W * 0.6} ${H - 100} ${W * 0.4} ${H - 56} C${W * 0.2} ${H - 18} ${W * 0.1} ${H - 62} 0 ${H - 40} Z`} fill={a} opacity="0.55" />
          <path d={`M0 ${H} H${W} V${H - 44} C${W * 0.82} ${H - 4} ${W * 0.62} ${H - 74} ${W * 0.42} ${H - 34} C${W * 0.22} ${H - 2} ${W * 0.1} ${H - 36} 0 ${H - 18} Z`} fill="url(#wvA)" />
        </svg>
      );

    case 'noir':
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <linearGradient id="noirGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f8e7ab" />
              <stop offset="50%" stopColor="#c9972b" />
              <stop offset="100%" stopColor="#f0cf75" />
            </linearGradient>
          </defs>
          <rect x="24" y="24" width={W - 48} height={H - 48} fill="none" stroke="url(#noirGold)" strokeWidth="4" />
          <rect x="38" y="38" width={W - 76} height={H - 76} fill="none" stroke="url(#noirGold)" strokeWidth="1.2" />
          {[
            [24, 24, 1, 1],
            [W - 24, 24, -1, 1],
            [24, H - 24, 1, -1],
            [W - 24, H - 24, -1, -1],
          ].map(([x, y, sx, sy], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
              <path d="M0 0 H90 M0 0 V90" stroke="url(#noirGold)" strokeWidth="9" />
              <polygon points="0,0 36,0 0,36" fill="url(#noirGold)" />
              <circle cx="66" cy="0" r="4" fill="#f8e7ab" />
              <circle cx="0" cy="66" r="4" fill="#f8e7ab" />
            </g>
          ))}
        </svg>
      );

    case 'diagonal':
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
          <polygon points={`0,0 300,0 0,300`} fill={p} />
          <polygon points={`0,0 214,0 0,214`} fill={a} />
          <polygon points={`0,0 140,0 0,140`} fill={p} />
          <polygon points={`${W},${H} ${W - 300},${H} ${W},${H - 300}`} fill={p} />
          <polygon points={`${W},${H} ${W - 214},${H} ${W},${H - 214}`} fill={a} />
          <polygon points={`${W},${H} ${W - 140},${H} ${W},${H - 140}`} fill={p} />
          <rect x="36" y="36" width={W - 72} height={H - 72} fill="none" stroke={p} strokeOpacity="0.25" strokeWidth="1.5" />
        </svg>
      );

    case 'ribbon':
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
          <rect x="20" y="20" width={W - 40} height={H - 40} fill="none" stroke={p} strokeWidth="2.5" />
          <rect x="30" y="30" width={W - 60} height={H - 60} fill="none" stroke={a} strokeWidth="1.5" />
          <polygon points={`20,20 70,20 20,70`} fill={p} />
          <polygon points={`${W - 20},20 ${W - 70},20 ${W - 20},70`} fill={p} />
          <polygon points={`20,${H - 20} 70,${H - 20} 20,${H - 70}`} fill={p} />
          <polygon points={`${W - 20},${H - 20} ${W - 70},${H - 20} ${W - 20},${H - 70}`} fill={p} />
        </svg>
      );

    default:
      return null;
  }
};

/* ------------------------------------------------------------------ */
/* ส่วนประกอบเนื้อหา                                                    */
/* ------------------------------------------------------------------ */

const SIG_HEIGHT: Record<string, number> = { medium: 58, large: 84, xlarge: 112 };
const FONT_SCALE: Record<string, number> = { compact: 0.92, normal: 1, large: 1.08 };

interface CanvasProps {
  config: CertificateConfig;
  student: CertificateStudentData;
  logo?: string;
  semesterLabel?: string;
  /** แสดงตราเกียรตินิยม A+ ตามเกณฑ์ ≥90% (ค่าเริ่มต้นคำนวณจาก student.rate) */
  isHonor?: boolean;
  id?: string;
}

export const CertificateCanvas: React.FC<CanvasProps> = ({
  config,
  student,
  logo,
  semesterLabel,
  isHonor,
  id,
}) => {
  const t = getTemplate(config.templateId);
  const g = GEOMETRY[t.layout] || GEOMETRY.royal;
  const custom = config.useCustomBackground && !!config.customBackgroundImage;
  const fs = FONT_SCALE[config.fontScale] || 1;
  const sigH = SIG_HEIGHT[config.signatureSize || 'large'] || 84;
  const honor = isHonor ?? student.rate >= 90;

  const onBand = !custom && g.headerInBand;
  const dark = !!t.dark && !custom;
  const ink = dark ? '#efe6c8' : '#1f2937';
  const soft = dark ? '#b9ad86' : '#64748b';
  const titleColor = custom ? '#1e1b4b' : t.titleColor;
  const bodyFont = g.serif ? SERIF : SANS;
  const headFont = g.serif ? SERIF : HEAD;
  const alignItems = g.align === 'left' ? 'flex-start' : 'center';
  const textAlign = g.align === 'left' ? 'left' : 'center';

  const activeLogo = config.customLogoUrl || logo;
  const logoEl =
    config.showLogo && activeLogo ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={activeLogo}
        alt=""
        crossOrigin="anonymous"
        style={{ height: onBand === 'left' ? 96 : 66, maxWidth: 220, objectFit: 'contain' }}
      />
    ) : null;

  const headerBlock = (color: string, sub: string, textAl: 'center' | 'left', ai: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: ai, textAlign: textAl, gap: 4 }}>
      {logoEl}
      <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 25 * fs, letterSpacing: 1, color, lineHeight: 1.4 }}>
        {config.institutionName}
      </div>
      {config.institutionSubName && (
        <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 12.5 * fs, letterSpacing: 2.2, color: sub, textTransform: 'uppercase', lineHeight: 1.4 }}>
          {config.institutionSubName}
        </div>
      )}
    </div>
  );

  const rawTitle = (config.awardTitle || 'เกียรติบัตร').trim();
  const awardTitle =
    rawTitle.includes('มอบให้ไว้') || rawTitle.includes('เพื่อแสดงว่า') ? 'เกียรติบัตร' : rawTitle;

  const titleEl = (() => {
    const base: React.CSSProperties = { fontFamily: headFont, lineHeight: 1.35 };
    switch (g.titleStyle) {
      case 'ribbon':
        return (
          <div style={{ position: 'relative', alignSelf: 'center', margin: '4px 0' }}>
            <svg width="640" height="78" viewBox="0 0 640 78" style={{ display: 'block' }}>
              <polygon points="0,16 56,16 56,78 0,78 24,47" fill={t.borderColor} opacity="0.78" />
              <polygon points="640,16 584,16 584,78 640,78 616,47" fill={t.borderColor} opacity="0.78" />
              <polygon points="40,0 600,0 600,62 40,62" fill={t.borderColor} />
              <polygon points="40,62 56,78 56,62" fill="#0b2a70" />
              <polygon points="600,62 584,78 584,62" fill="#0b2a70" />
              <rect x="48" y="7" width="544" height="48" fill="none" stroke={t.innerBorderColor} strokeWidth="1.5" />
            </svg>
            <div
              style={{
                ...base,
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: 62,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 36 * fs,
                letterSpacing: 6,
              }}
            >
              {awardTitle}
            </div>
          </div>
        );
      case 'pill':
        return (
          <div
            style={{
              ...base,
              alignSelf: alignItems,
              fontWeight: 700,
              fontSize: 31 * fs,
              letterSpacing: 5,
              padding: '4px 36px 6px',
              borderRadius: 999,
              background: t.accentBadgeBg,
              color: t.accentTextColor,
              border: `2px solid ${t.innerBorderColor}`,
            }}
          >
            {awardTitle}
          </div>
        );
      case 'plain':
        return (
          <div
            style={{
              ...base,
              fontWeight: 800,
              fontSize: 54 * fs,
              letterSpacing: g.align === 'left' ? 1 : 4,
              color: titleColor,
              borderBottom: g.align === 'left' ? `5px solid ${t.innerBorderColor}` : 'none',
              alignSelf: alignItems,
              paddingBottom: g.align === 'left' ? 6 : 0,
            }}
          >
            {awardTitle}
          </div>
        );
      default:
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, alignSelf: 'center' }}>
            <div style={{ width: 120, height: 2, background: `linear-gradient(to right, transparent, ${t.innerBorderColor})` }} />
            <div style={{ ...base, fontWeight: 700, fontSize: 40 * fs, letterSpacing: 6, color: titleColor }}>{awardTitle}</div>
            <div style={{ width: 120, height: 2, background: `linear-gradient(to left, transparent, ${t.innerBorderColor})` }} />
          </div>
        );
    }
  })();

  const sig = (
    n: 1 | 2
  ): { title: string; name: string; role: string; url?: string } =>
    n === 1
      ? { title: config.signatory1Title, name: config.signatory1Name, role: config.signatory1Role, url: config.signatory1SignatureUrl }
      : { title: config.signatory2Title, name: config.signatory2Name, role: config.signatory2Role, url: config.signatory2SignatureUrl };

  const sigBlock = (n: 1 | 2) => {
    const s = sig(n);
    return (
      <div style={{ width: 290, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div
          style={{
            height: sigH,
            width: 250,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            borderBottom: `1.5px solid ${dark ? '#8c7a45' : '#94a3b8'}`,
            paddingBottom: 3,
          }}
        >
          {s.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.url} alt="" style={{ maxHeight: sigH - 4, maxWidth: 246, objectFit: 'contain' }} />
          ) : (
            <span style={{ fontFamily: SERIF, fontStyle: 'italic', color: soft, fontSize: 15, opacity: 0.7, lineHeight: 1.4 }}>
              {s.title}
            </span>
          )}
        </div>
        <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 16.5 * fs, color: ink, marginTop: 6, lineHeight: 1.4 }}>{s.name}</div>
        <div style={{ fontFamily: bodyFont, fontSize: 13 * fs, color: soft, lineHeight: 1.4 }}>{s.role}</div>
      </div>
    );
  };

  const details: string[] = [];
  if (config.showStudentId) details.push(`รหัสนักศึกษา ${student.studentId}`);
  if (config.showMajor) details.push(`สาขาวิชา${student.major.replace(/^สาขา(วิชา)?/, '')}`);
  if (config.showYearLevel) details.push(`ชั้น${student.yearLevel}`);
  if (config.showGroupName && student.groupName) details.push(student.groupName);

  const accentChip: React.CSSProperties = {
    fontFamily: bodyFont,
    fontSize: 15.5 * fs,
    fontWeight: 600,
    padding: '3px 18px 5px',
    borderRadius: 12,
    background: t.accentBadgeBg,
    color: t.accentTextColor,
    border: `1.5px solid ${t.innerBorderColor}`,
    lineHeight: 1.4,
  };

  const paperStyle: React.CSSProperties = custom
    ? {
        backgroundColor: '#ffffff',
        backgroundImage: `url(${config.customBackgroundImage})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }
    : { background: t.bgGradient, backgroundColor: dark ? '#0d0d11' : '#ffffff' };

  return (
    <div
      id={id}
      style={{
        position: 'relative',
        width: CERT_W,
        height: CERT_H,
        overflow: 'hidden',
        boxSizing: 'border-box',
        color: ink,
        fontFamily: bodyFont,
        ...paperStyle,
      }}
    >
      {!custom && <Decor t={t} />}

      {/* หัวเกียรติบัตรที่อยู่ในแถบสี */}
      {onBand === 'top' && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 176, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {headerBlock('#ffffff', '#f3d487', 'center', 'center')}
        </div>
      )}
      {onBand === 'left' && (
        <div style={{ position: 'absolute', left: 0, top: 0, width: 274, height: CERT_H, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 22px' }}>
          {headerBlock('#ffffff', '#f6dc8f', 'center', 'center')}
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: g.left,
          right: g.right,
          top: g.top,
          bottom: g.bottom,
          display: 'flex',
          flexDirection: 'column',
          alignItems,
          textAlign,
          justifyContent: 'space-between',
        }}
      >
        {/* บน: หัวสถาบัน + ชื่อเกียรติบัตร */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems, gap: 8, width: '100%' }}>
          {!onBand && (
            <div style={{ alignSelf: config.logoPosition === 'top-left' && g.align === 'center' ? 'flex-start' : config.logoPosition === 'top-right' && g.align === 'center' ? 'flex-end' : alignItems }}>
              {headerBlock(titleColor, soft, g.align === 'left' ? 'left' : 'center', alignItems)}
            </div>
          )}
          {titleEl}
          <div style={{ fontFamily: bodyFont, fontSize: 16 * fs, color: soft, lineHeight: 1.5 }}>
            ขอมอบเกียรติบัตรฉบับนี้ให้ไว้เพื่อแสดงว่า
          </div>
        </div>

        {/* กลาง: ชื่อผู้รับ */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems, gap: 6, width: '100%' }}>
          <div
            style={{
              fontFamily: headFont,
              fontWeight: 700,
              fontSize: (student.fullName.length > 30 ? 40 : 52) * fs,
              color: titleColor,
              lineHeight: 1.35,
              borderBottom: `2px solid ${t.innerBorderColor}`,
              padding: '0 28px 2px',
              maxWidth: '100%',
            }}
          >
            {student.fullName}
          </div>
          {details.length > 0 && (
            <div style={{ fontFamily: bodyFont, fontSize: 17 * fs, color: ink, fontWeight: 500, lineHeight: 1.5 }}>
              {details.join('  •  ')}
            </div>
          )}
          <div style={{ fontFamily: bodyFont, fontSize: 17 * fs, color: ink, lineHeight: 1.6, maxWidth: 780 }}>
            {config.bodyText}{' '}
            <span style={{ fontWeight: 700, color: titleColor }}>{config.activityTitle}</span>
            {semesterLabel ? ` ${semesterLabel}` : ''}
          </div>

          {(config.showAttendanceStats || (config.showHonorBadgeA && honor)) && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: g.align === 'left' ? 'flex-start' : 'center', marginTop: 4 }}>
              {config.showAttendanceStats && (
                <div style={accentChip}>
                  เข้าร่วม {student.rate.toFixed(1)}% ({student.present}/{student.total} ครั้ง)
                  {config.showLevelLabel ? `  |  ${student.levelLabel}` : ''}
                </div>
              )}
              {config.showHonorBadgeA && honor && (
                <div
                  style={{
                    ...accentChip,
                    background: 'linear-gradient(90deg,#f59e0b,#fbbf24)',
                    color: '#ffffff',
                    border: '1.5px solid #fde68a',
                    fontWeight: 700,
                  }}
                >
                  ★ เกียรตินิยม A+ ผลการประเมินดีเยี่ยม
                </div>
              )}
            </div>
          )}

          {config.blessingText && (
            <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 14.5 * fs, color: soft, lineHeight: 1.6, maxWidth: 760 }}>
              “{config.blessingText}”
            </div>
          )}
        </div>

        {/* ล่าง: ลายเซ็น */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%' }}>
          {sigBlock(1)}
          <div style={{ textAlign: 'center', paddingBottom: 6 }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 999,
                margin: '0 auto 4px',
                border: `3px double ${t.borderColor}`,
                background: t.accentBadgeBg,
                color: t.borderColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
              }}
            >
              ✦
            </div>
            {config.showDocRef && (
              <div style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11.5, color: soft, lineHeight: 1.4 }}>
                EDU-HALAQAH-{student.studentId}
              </div>
            )}
            {config.showDate && (
              <div style={{ fontFamily: bodyFont, fontSize: 12.5, color: soft, lineHeight: 1.4 }}>
                ออก ณ วันที่{' '}
                {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            )}
          </div>
          {sigBlock(2)}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* ตัวห่อให้ย่อ/ขยายพอดีกับความกว้างของกรอบ (ใช้แสดงผลบนหน้าจอเท่านั้น)       */
/* ------------------------------------------------------------------ */

export const CertificatePreview: React.FC<
  CanvasProps & { className?: string; previewId?: string }
> = ({ className, previewId, ...rest }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.max(0.1, el.clientWidth / CERT_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ width: '100%', height: CERT_H * scale, position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ width: CERT_W, height: CERT_H, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', left: 0, top: 0 }}>
        <CertificateCanvas id={previewId} {...rest} />
      </div>
    </div>
  );
};
