'use client';

export interface CertificateConfig {
  templateId: string; // 'template-1' to 'template-10' or 'custom'
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
  
  signatory2Title: string;
  signatory2Name: string;
  signatory2Role: string;
  
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

export const CERTIFICATE_TEMPLATES: {
  id: string;
  name: string;
  description: string;
  borderColor: string;
  innerBorderColor: string;
  bgGradient: string;
  accentBadgeBg: string;
  accentTextColor: string;
  titleColor: string;
  frameStyle: 'double-gold' | 'emerald' | 'minimal' | 'navy' | 'arch' | 'floral' | 'purple' | 'parchment' | 'teal' | 'noir';
}[] = [
  {
    id: 'template-1',
    name: '1. Islamic Royal Gold',
    description: 'ขอบทองหลวงคู่ วิจิตรศิลป์อิสลาม สง่างาม ทรงคุณค่าสูง',
    borderColor: '#d97706', // amber-600
    innerBorderColor: '#fcd34d', // amber-300
    bgGradient: 'radial-gradient(circle at center, #ffffff 65%, #fffbeb 100%)',
    accentBadgeBg: '#fef3c7',
    accentTextColor: '#92400e',
    titleColor: '#78350f',
    frameStyle: 'double-gold',
  },
  {
    id: 'template-2',
    name: '2. Emerald Classic',
    description: 'เขียวมรกตคลาสสิก อัตลักษณ์อิสลาม นุ่มนวล ทรงเกียรติ',
    borderColor: '#059669', // emerald-600
    innerBorderColor: '#6ee7b7', // emerald-300
    bgGradient: 'radial-gradient(circle at center, #ffffff 65%, #ecfdf5 100%)',
    accentBadgeBg: '#d1fae5',
    accentTextColor: '#065f46',
    titleColor: '#064e3b',
    frameStyle: 'emerald',
  },
  {
    id: 'template-3',
    name: '3. Modern Minimal Ivory',
    description: 'ไอวอรี่มินิมอลโมเดิร์น คมชัด เส้นบาง สะอาดตา ทางการสากล',
    borderColor: '#475569', // slate-600
    innerBorderColor: '#cbd5e1', // slate-300
    bgGradient: 'radial-gradient(circle at center, #ffffff 70%, #f8fafc 100%)',
    accentBadgeBg: '#f1f5f9',
    accentTextColor: '#334155',
    titleColor: '#0f172a',
    frameStyle: 'minimal',
  },
  {
    id: 'template-4',
    name: '4. Royal Navy & Gold',
    description: 'สีกรมท่าน้ำเงินลึกตัดทองคำ มหาวิทยาลัยสากล ทรงคุณวุฒิ',
    borderColor: '#1e3a8a', // blue-900
    innerBorderColor: '#f59e0b', // amber-500
    bgGradient: 'radial-gradient(circle at center, #ffffff 65%, #eff6ff 100%)',
    accentBadgeBg: '#dbeafe',
    accentTextColor: '#1e40af',
    titleColor: '#172554',
    frameStyle: 'navy',
  },
  {
    id: 'template-5',
    name: '5. Traditional Arabic Arch',
    description: 'ซุ้มโค้งสถาปัตยกรรมอิสลามอันดาลูเซีย โดดเด่นเป็นเอกลักษณ์',
    borderColor: '#b45309', // amber-700
    innerBorderColor: '#fde68a', // amber-200
    bgGradient: 'radial-gradient(circle at center, #ffffff 60%, #fff7ed 100%)',
    accentBadgeBg: '#ffedd5',
    accentTextColor: '#9a3412',
    titleColor: '#7c2d12',
    frameStyle: 'arch',
  },
  {
    id: 'template-6',
    name: '6. Golden Floral Ornament',
    description: 'กรอบลายพรรณพฤกษาทองคำ วิจิตรศิลป์ ละเอียดอ่อน อบอุ่น',
    borderColor: '#ca8a04', // yellow-600
    innerBorderColor: '#fef08a', // yellow-200
    bgGradient: 'radial-gradient(circle at center, #ffffff 65%, #fefce8 100%)',
    accentBadgeBg: '#fef9c3',
    accentTextColor: '#854d0e',
    titleColor: '#713f12',
    frameStyle: 'floral',
  },
  {
    id: 'template-7',
    name: '7. Deep Purple Academic',
    description: 'สีม่วงเข้มวิชาการ อัตลักษณ์คณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี',
    borderColor: '#6b21a8', // purple-700
    innerBorderColor: '#d8b4fe', // purple-300
    bgGradient: 'radial-gradient(circle at center, #ffffff 65%, #faf5ff 100%)',
    accentBadgeBg: '#f3e8ff',
    accentTextColor: '#581c87',
    titleColor: '#3b0764',
    frameStyle: 'purple',
  },
  {
    id: 'template-8',
    name: '8. Vintage Parchment Scroll',
    description: 'กระดาษสาโบราณ วินเทจ อบอุ่น ขลัง สไตล์กิตติคุณดั้งเดิม',
    borderColor: '#78350f', // amber-900
    innerBorderColor: '#d97706', // amber-600
    bgGradient: 'radial-gradient(circle at center, #fefce8 50%, #fef3c7 100%)',
    accentBadgeBg: '#fde68a',
    accentTextColor: '#78350f',
    titleColor: '#451a03',
    frameStyle: 'parchment',
  },
  {
    id: 'template-9',
    name: '9. Contemporary Cyan & Teal',
    description: 'สีฟ้าน้ำทะเลโมเดิร์น สดใส มินิมอลเทคโนโลยี ร่วมสมัย',
    borderColor: '#0f766e', // teal-700
    innerBorderColor: '#5eead4', // teal-300
    bgGradient: 'radial-gradient(circle at center, #ffffff 65%, #f0fdfa 100%)',
    accentBadgeBg: '#ccfbf1',
    accentTextColor: '#115e59',
    titleColor: '#134e4a',
    frameStyle: 'teal',
  },
  {
    id: 'template-10',
    name: '10. Imperial Noir Gold',
    description: 'สีดำนัวร์ทองคำ พรีเมียม อลังการ สำหรับรางวัลเกียรตินิยมสูงสุด',
    borderColor: '#18181b', // zinc-900
    innerBorderColor: '#eab308', // yellow-500
    bgGradient: 'radial-gradient(circle at center, #ffffff 65%, #f4f4f5 100%)',
    accentBadgeBg: '#fef08a',
    accentTextColor: '#713f12',
    titleColor: '#09090b',
    frameStyle: 'noir',
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
  blessingText: '"ขอให้อัลลอฮ์ (ซ.บ.) ทรงประทานความรู้ ความบะรอกัต และความเจริญก้าวหน้าแก่ท่านสืบไป"',
  signatory1Title: 'ผู้รับผิดชอบโครงการ',
  signatory1Name: '(อาจารย์มุสลิม หะยีสะมะแอ)',
  signatory1Role: 'ประธานโครงการฮะละเกาะฮ์อัลกุรอาน',
  signatory2Title: 'คณบดี',
  signatory2Name: '(ผศ.ดร. อับดุลฮาลิม สือแม)',
  signatory2Role: 'คณบดีคณะศึกษาศาสตร์ มหาวิทยาลัยฟาฏอนี',
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
    return parsed;
  } catch {
    return DEFAULT_CERTIFICATE_CONFIG;
  }
}

export function saveCertificateConfig(config: CertificateConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CERT_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save certificate config:', err);
  }
}
