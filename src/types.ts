export interface PillarUnit {
  gan: string;  // e.g. "甲"
  ji: string;   // e.g. "寅"
}

export interface Pillars {
  year: PillarUnit;
  month: PillarUnit;
  day: PillarUnit;
  hour: PillarUnit | null;
}

export interface Daymaster {
  gan: string;       // e.g. "甲"
  element: string;   // e.g. "木"
}

export interface OhaengCount {
  "목": number;
  "화": number;
  "토": number;
  "금": number;
  "수": number;
}

export interface DaewoonItem {
  age: number;
  ganzi: string;
  stemSipsin: string;
  branchSipsin: string;
  unseong: string;
}

export interface PillarDetailItem {
  type: "시주" | "일주" | "월주" | "연주";
  ganzi: string;
  stem: string;
  branch: string;
  stemSipsin: string;
  branchSipsin: string;
  unseong: string;
  sinsal: string;
  jigang: string;
}

export interface SajuData {
  pillars: Pillars;
  daymaster: Daymaster;
  ohaeng_count: OhaengCount;
  // New rich fields
  birthplace?: { name: string; lat: number; lon: number } | null;
  solar_birth_time?: string | null;
  solar_correction_minutes?: number;
  daewoon?: DaewoonItem[];
  sipseong_strength?: {
    "비겁": number;
    "식상": number;
    "재성": number;
    "관성": number;
    "인성": number;
  };
  pillars_detail?: PillarDetailItem[];
  special_sals_list?: string[];
  ziwei?: ZiweiChart | null;
}

export interface ZiweiStar {
  name: string;
  nameKr: string;
  type: "main" | "lucky" | "sha" | "other";
  brightness: string;
  brightnessKr: string;
  siHua: string;
  siHuaKr: string;
}

export interface ZiweiPalace {
  name: string;
  nameKr: string;
  zhi: string;
  gan: string;
  ganZhi: string;
  stars: ZiweiStar[];
  isShenGong: boolean;
}

export interface ZiweiDaxianItem {
  ageStart: number;
  ageEnd: number;
  palaceName: string;
  ganZhi: string;
  mainStars: string[];
}

export interface ZiweiLiunian {
  year: number;
  gan: string;
  zhi: string;
  mingGongZhi: string;
  natalPalaceAtMing: string;
  siHua: Record<string, string>;
  siHuaPalaces: Record<string, string>;
}

export interface ZiweiChart {
  solarYear: number;
  solarMonth: number;
  solarDay: number;
  hour: number;
  minute: number;
  isMale: boolean;
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  yearGan: string;
  yearZhi: string;
  mingGongZhi: string;
  shenGongZhi: string;
  wuXingJu: { name: string; number: number };
  palaces: Record<string, ZiweiPalace>;
  daXianStartAge: number;
  daXianList?: ZiweiDaxianItem[];
  liunian?: ZiweiLiunian | null;
}

export interface Member {
  id: string; // member_id
  nickname: string;
  gender: "남성" | "여성" | string;
  birth_date: string; // YYYY-MM-DD
  birth_time: string | null; // HH:MM or null
  saju: SajuData;
  character_emoji: string;
  character_animal: string;
  character_color: string;
  joined_at: any;
  mbti?: string;
  personal_analysis?: PersonalAnalysis;
}

export interface Room {
  code: string;
  title: string;
  owner_uid: string;
  created_at: any;
  expire_at: any;
  is_locked: boolean;
}

export interface PersonalAnalysis {
  character_desc: string;
  headline?: string;
  duality?: {
    outer: string;
    inner: string;
    contrast: string;
  };
  wealth?: {
    earning: string;
    leak: string;
  };
  career?: {
    strength: string;
    recommended_fields: string;
  };
  love?: {
    meeting_scene: string;
    friction_point: string;
  };
  health?: {
    signal: string;
    recovery: string;
  };
  one_action?: string;
  four_areas: {
    essence: string;  // 本質 (본질)
    talent: string;   // 才能 (재능)
    flow: string;     // 흐름 (운세흐름)
    fortune: string;  // 財·緣·業·健
  };
  keywords: string[];
  punchy_quote?: string;
  tags?: string[];
  season_quote?: string;
}

export interface SubCompatibility {
  score_1_to_2: number;
  score_2_to_1: number;
  description: string;
}

export interface PairAnalysis {
  member_id_1: string;
  member_id_2: string;
  score: number;
  label: string; // 4-character label, e.g. "환상호흡"
  description: string;
  saju?: SubCompatibility;
  ziwei?: SubCompatibility;
  mbti?: SubCompatibility;
  zodiac?: SubCompatibility;
}

export interface GroupAnalysis {
  overall_score: number;
  title: string;
  description: string;
  atmosphere: string;
  synergy_tips: string;
}

export interface CachedAnalysisResult {
  personal: Record<string, PersonalAnalysis>;
  pairs: PairAnalysis[];
  group: GroupAnalysis;
  created_at: any;
}

export interface AppConfig {
  shop_enabled: boolean;
  beta_free_mode: boolean;
  real_payment_enabled?: boolean;
  payment_notice?: string;
  announcement?: string;
  updatedAt: string;
  updatedBy?: string;
}

export type TicketProductType = "pdf" | "secret" | "group" | "all";
export type UserTierType = "free" | "coupon" | "paid";

export interface TicketConsumptionRecord {
  timestamp: string;
  productType: TicketProductType;
  roomCode?: string;
  pairKey?: string;
  label?: string;
}

export interface TicketGrantRecord {
  id: string;
  timestamp: string;
  sourceType: "coupon" | "referral" | "manual_admin" | "promotion" | "system";
  couponCode?: string;
  productType: TicketProductType;
  amount: number;
  reason: string;
  adminUid?: string;
}

export interface CouponRecord {
  code: string;
  maxUses: number;
  usedCount: number;
  usedUsers: string[];
  usedDetails?: Array<{
    uid: string;
    redeemedAt: string;
    productType?: string;
    userEmail?: string;
  }>;
  productType: TicketProductType;
  description?: string;
  campaignSource?: string; // e.g. "인스타그램 이벤트", "카카오톡 채널", "오픈 프로모션", "관리자 직접발급"
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export interface UserTicketAccount {
  userUid: string;
  userEmail?: string | null;
  referralCode: string;
  invitedCount: number;
  invitedBy?: string;
  tickets: {
    pdf: number;
    secret: number;
    group: number;
    all: number;
  };
  grantHistory?: TicketGrantRecord[];
  consumedHistory: TicketConsumptionRecord[];
  userTier: UserTierType;
  updatedAt: string;
}

export type MembershipTier = "social_verified" | "regular_email" | "guest";

export interface UserMembershipInfo {
  tier: MembershipTier;
  isSocialVerified: boolean; // Google SNS 연동 완료 (정회원)
  isEmailOnly: boolean;      // 이메일/비밀번호 일반회원 (준회원)
  isGuest: boolean;          // 미로그인 게스트
  canCreateRoom: boolean;    // 방 개설 가능 여부 (오직 정회원만 true)
  canUseCoupon: boolean;     // 쿠폰 사용 가능 여부 (오직 정회원만 true)
  canAccessShop: boolean;    // 유료 상점 이용 가능 여부 (오직 정회원만 true)
  label: string;             // 한글 등급명
  email?: string | null;
  displayName?: string | null;
}

