'use client';

export type SignatureSize = 'medium' | 'large' | 'xlarge';

export interface CertificateConfig {
  templateId: string; // 'template-1' to 'template-12'
  customBackgroundImage?: string; // Base64 or Image URL
  useCustomBackground: boolean;

  // Institution details
  institutionName: string;
  institutionSubName: string;
  activityTitle: string;
  awardTitle: string;
  bodyText: string;
  blessingText: string;

  // Signatories
  signatory1Title: string;
  signatory1Name: string;
  signatory1Role: string;
  signatory1SignatureUrl?: string; // Base64 or Image URL for signature 1

  signatory2Title: string;
  signatory2Name: string;
  signatory2Role: string;
  signatory2SignatureUrl?: string; // Base64 or Image URL for signature 2
  signatureSize?: SignatureSize; // ขนาดรูปลายเซ็นบนเกียรติบัตร

  // Logo settings
  showLogo: boolean;
  logoPosition: 'top-center' | 'top-left' | 'top-right';
  customLogoUrl?: string;

  // Elements layout toggles
  showStudentId: boolean;
  showMajor: boolean;
  showYearLevel: boolean;
  showGroupName: boolean;
  showAttendanceStats: boolean;
  showHonorBadgeA: boolean; // ตราประทับเกียรตินิยม A+
  showLevelLabel: boolean;
  showDate: boolean;
  showDocRef: boolean;

  // Styling
  fontScale: 'normal' | 'large' | 'compact';
  primaryColor?: string;
}

export type CertificateLayout =
  | 'royal'
  | 'emerald'
  | 'minimal'
  | 'navy'
  | 'arch'
  | 'floral'
  | 'purple-band'
  | 'parchment'
  | 'wave'
  | 'noir'
  | 'diagonal'
  | 'ribbon';

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  layout: CertificateLayout;
  /** สีหลักของกรอบ/แถบ */
  borderColor: string;
  /** สีรอง/สีเน้น (ทอง ฯลฯ) */
  innerBorderColor: string;
  /** สีพื้นกระดาษ (CSS background) */
  bgGradient: string;
  accentBadgeBg: string;
  accentTextColor: string;
  titleColor: string;
  /** พื้นหลังเข้ม (ตัวอักษรต้องเป็นสีสว่าง) */
  dark?: boolean;
}

export const CERTIFICATE_TEMPLATES: CertificateTemplate[] = [
  {
    id: 'template-1',
    name: 'Royal Gold',
    description: 'ขอบทองสามชั้น มุมลายพรรณ ทางการสง่างาม',
    layout: 'royal',
    borderColor: '#b45309',
    innerBorderColor: '#e8b84a',
    bgGradient: 'radial-gradient(circle at center, #ffffff 55%, #fff7e0 100%)',
    accentBadgeBg: '#fef3c7',
    accentTextColor: '#92400e',
    titleColor: '#78350f',
  },
  {
    id: 'template-2',
    name: 'Emerald Geometry',
    description: 'แถบลายดาวเรขาคณิตอิสลามรอบกรอบ สีเขียวมรกต',
    layout: 'emerald',
    borderColor: '#047857',
    innerBorderColor: '#d4a73a',
    bgGradient: 'linear-gradient(180deg, #ffffff 0%, #f0fdf8 100%)',
    accentBadgeBg: '#d1fae5',
    accentTextColor: '#065f46',
    titleColor: '#064e3b',
  },
  {
    id: 'template-3',
    name: 'Modern Minimal',
    description: 'จัดชิดซ้าย ตัวอักษรใหญ่ เส้นบาง สะอาด ร่วมสมัย',
    layout: 'minimal',
    borderColor: '#1e293b',
    innerBorderColor: '#7c3aed',
    bgGradient: '#ffffff',
    accentBadgeBg: '#f1f5f9',
    accentTextColor: '#334155',
    titleColor: '#0f172a',
  },
  {
    id: 'template-4',
    name: 'Navy Header Band',
    description: 'แถบหัวสีกรมท่าตัดทอง เหมือนเกียรติบัตรมหาวิทยาลัยสากล',
    layout: 'navy',
    borderColor: '#14306b',
    innerBorderColor: '#e0a526',
    bgGradient: 'linear-gradient(180deg, #ffffff 0%, #f1f5fd 100%)',
    accentBadgeBg: '#dbeafe',
    accentTextColor: '#1e40af',
    titleColor: '#0f2557',
  },
  {
    id: 'template-5',
    name: 'Andalusian Arch',
    description: 'ซุ้มโค้งสถาปัตยกรรมอิสลาม พื้นหลังลายจุดอบอุ่น',
    layout: 'arch',
    borderColor: '#9a3412',
    innerBorderColor: '#e9b872',
    bgGradient: 'linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%)',
    accentBadgeBg: '#ffedd5',
    accentTextColor: '#9a3412',
    titleColor: '#7c2d12',
  },
  {
    id: 'template-6',
    name: 'Golden Vine',
    description: 'เถาวัลย์และใบไม้ทองที่มุมทั้งสี่ นุ่มนวล ละเอียดอ่อน',
    layout: 'floral',
    borderColor: '#a16207',
    innerBorderColor: '#eab308',
    bgGradient: 'radial-gradient(circle at center, #ffffff 60%, #fefce8 100%)',
    accentBadgeBg: '#fef9c3',
    accentTextColor: '#854d0e',
    titleColor: '#713f12',
  },
  {
    id: 'template-7',
    name: 'Purple Side Banner',
    description: 'แถบม่วงด้านข้างมีโลโก้ อัตลักษณ์คณะ ม.ฟาฏอนี',
    layout: 'purple-band',
    borderColor: '#581c87',
    innerBorderColor: '#f1b000',
    bgGradient: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
    accentBadgeBg: '#f3e8ff',
    accentTextColor: '#581c87',
    titleColor: '#3b0764',
  },
  {
    id: 'template-8',
    name: 'Vintage Parchment',
    description: 'กระดาษสาโบราณขอบเข้ม ตัวอักษรเซอริฟ ขลังสไตล์ดั้งเดิม',
    layout: 'parchment',
    borderColor: '#78350f',
    innerBorderColor: '#b9852d',
    bgGradient: 'radial-gradient(circle at center, #fdf6e3 45%, #f0dfb4 100%)',
    accentBadgeBg: '#f3e2b3',
    accentTextColor: '#5b2a07',
    titleColor: '#451a03',
  },
  {
    id: 'template-9',
    name: 'Teal Waves',
    description: 'คลื่นสีฟ้าเขียวด้านบนและล่าง สดใสร่วมสมัย',
    layout: 'wave',
    borderColor: '#0f766e',
    innerBorderColor: '#2dd4bf',
    bgGradient: '#ffffff',
    accentBadgeBg: '#ccfbf1',
    accentTextColor: '#115e59',
    titleColor: '#134e4a',
  },
  {
    id: 'template-10',
    name: 'Imperial Noir',
    description: 'พื้นดำนัวร์ตัวอักษรทอง พรีเมียมสำหรับรางวัลสูงสุด',
    layout: 'noir',
    borderColor: '#d4a73a',
    innerBorderColor: '#f5d77a',
    bgGradient: 'radial-gradient(circle at center, #1b1b22 40%, #09090c 100%)',
    accentBadgeBg: '#2a2418',
    accentTextColor: '#f5d77a',
    titleColor: '#f8e7ab',
    dark: true,
  },
  {
    id: 'template-11',
    name: 'Crimson Diagonal',
    description: 'สามเหลี่ยมเฉียงสีแดงเลือดหมู-ทองที่มุม โมเดิร์นโดดเด่น',
    layout: 'diagonal',
    borderColor: '#9f1239',
    innerBorderColor: '#f0b429',
    bgGradient: 'linear-gradient(180deg, #ffffff 0%, #fff5f6 100%)',
    accentBadgeBg: '#ffe4e8',
    accentTextColor: '#9f1239',
    titleColor: '#4c0519',
  },
  {
    id: 'template-12',
    name: 'Sapphire Ribbon',
    description: 'หัวข้อบนริบบิ้นพับมุม กรอบบางสีน้ำเงินแซฟไฟร์',
    layout: 'ribbon',
    borderColor: '#1d4ed8',
    innerBorderColor: '#f59e0b',
    bgGradient: 'linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)',
    accentBadgeBg: '#dbeafe',
    accentTextColor: '#1e3a8a',
    titleColor: '#172554',
  },
];

export const DEFAULT_CERTIFICATE_CONFIG: CertificateConfig = {
  templateId: 'template-1',
  useCustomBackground: false,
  institutionName: 'คณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี',
  institutionSubName: 'FACULTY OF EDUCATION, FATONI UNIVERSITY',
  activityTitle: 'โครงการฮะละเกาะฮ์อัลกุรอาน',
  awardTitle: 'เกียรติบัตร',
  bodyText: 'ได้เข้าร่วมและผ่านเกณฑ์การประเมินในโครงการฮะละเกาะฮ์อัลกุรอาน',
  blessingText: 'ขอให้อัลลอฮ์ (ซ.บ.) ทรงประทานความรู้ ความบะรอกัต และความเจริญก้าวหน้าแก่ท่านสืบไป',
  signatory1Title: 'ผู้รับผิดชอบโครงการ',
  signatory1Name: '(อาจารย์มุสลิม หะยีสะมะแอ)',
  signatory1Role: 'ประธานโครงการฮะละเกาะฮ์อัลกุรอาน',
  signatory1SignatureUrl: '',
  signatory2Title: 'คณบดี',
  signatory2Name: '(ผศ.ดร. อับดุลฮาลิม สือแม)',
  signatory2Role: 'คณบดีคณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี',
  signatory2SignatureUrl: '',
  signatureSize: 'large',
  showLogo: true,
  logoPosition: 'top-center',
  showStudentId: true,
  showMajor: true,
  showYearLevel: true,
  showGroupName: false,
  showAttendanceStats: true,
  showHonorBadgeA: true,
  showLevelLabel: true,
  showDate: true,
  showDocRef: true,
  fontScale: 'normal',
};

const CERT_STORAGE_KEY = 'halaqah_certificate_config_v2';

export function getCertificateConfig(): CertificateConfig {
  if (typeof window === 'undefined') return DEFAULT_CERTIFICATE_CONFIG;
  try {
    const raw = localStorage.getItem(CERT_STORAGE_KEY);
    if (!raw) return DEFAULT_CERTIFICATE_CONFIG;
    const parsed = { ...DEFAULT_CERTIFICATE_CONFIG, ...JSON.parse(raw) };
    if (parsed.awardTitle === 'เกียรติบัตรฉบับนี้มอบให้ไว้เพื่อแสดงว่า') {
      parsed.awardTitle = 'เกียรติบัตร';
    }
    // เวอร์ชันเก่าเก็บคำอวยพรพร้อมเครื่องหมายคำพูด ซึ่งจะถูกครอบซ้ำตอนแสดงผล
    if (typeof parsed.blessingText === 'string') {
      parsed.blessingText = parsed.blessingText.replace(/^["“”]+|["“”]+$/g, '');
    }
    return parsed;
  } catch {
    return DEFAULT_CERTIFICATE_CONFIG;
  }
}

export const CERT_CONFIG_UPDATED_EVENT = 'halaqah_certificate_config_updated';

/** บันทึกการตั้งค่า คืนค่า false หากพื้นที่จัดเก็บเต็ม (เช่น รูปใหญ่เกินไป) */
export function saveCertificateConfig(config: CertificateConfig): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(CERT_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(CERT_CONFIG_UPDATED_EVENT, { detail: config }));
    window.dispatchEvent(new Event('storage'));
    return true;
  } catch (err) {
    console.error('Failed to save certificate config:', err);
    return false;
  }
}
