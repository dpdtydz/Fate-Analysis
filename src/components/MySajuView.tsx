import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import SajuVisual from "./SajuVisual";
import SajuForm from "./SajuForm";
import LoadingOverlay from "./LoadingOverlay";
import { 
  getUserPersonalProfile, 
  saveUserPersonalProfile, 
  PersonalSajuProfile, 
  auth, 
  getUserMembershipInfo,
  logAnalyticsEvent,
  checkProductUnlock,
  activatePremiumSimulation,
  getUserTicketAccount,
  consumeSingleUseTicket,
  redeemCoupon
} from "../lib/firebase";
import { UserTicketAccount } from "../types";
import { 
  Sparkles, 
  Sun, 
  Calendar, 
  Compass, 
  Edit3, 
  Users, 
  PlusCircle, 
  KeyRound, 
  Award,
  Check,
  Share2,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  FileText,
  TrendingUp,
  Coins,
  Ticket,
  Lightbulb,
  Crown
} from "lucide-react";
import GoogleAds from "./GoogleAds";
import UpgradeToSocialModal from "./UpgradeToSocialModal";
import AuthModal from "./AuthModal";
import ViralCardModal from "./ViralCardModal";
import { shareToKakaoOrClipboard } from "../utils/shareHelper";
import { calculateTodayFortune, calculateSaju, getDynamicCharacter } from "../utils/saju";

// Sample Profile Generator for Zero-Login 1-Second Instant Preview
export function createSampleProfile(): PersonalSajuProfile {
  const sampleCity = { name: "서울", lat: 37.5665, lon: 126.978 };
  const sajuResult = calculateSaju("1995-05-15", "14:30", sampleCity, "남성");
  const charMeta = getDynamicCharacter(sajuResult.daymaster.gan, sajuResult.pillars.day.ji);
  return {
    nickname: "예시 (김인연)",
    gender: "남성",
    birth_date: "1995-05-15",
    birth_time: "14:30",
    saju: sajuResult,
    character_emoji: charMeta.emoji,
    character_animal: charMeta.animalName,
    character_color: charMeta.color,
    mbti: "ENFP",
    birthplace_region: "서울특별시",
    birthplace_city: "서울",
  };
}

// 오행별 메타 및 플랫 라인 SVG 엠블럼 스펙
interface CardMatchSpec {
  elem: string;
  cardName: string;
  hanja: string;
  emoji: string;
  relationName: string;
  oneLiner: string;
  score: number;
  tip: string;
}

const ELEMENT_SPECS: Record<string, {
  hanja: string;
  en: string;
  colorName: string;
  serialPrefix: string;
  quote: string;
  tags: string[];
  stats: { label: string; val: number; color: string }[];
  desc: string;
  renderIcon: () => React.ReactNode;
  compatibility: {
    best: CardMatchSpec[];
    caution: CardMatchSpec[];
  };
}> = {
  "목": {
    hanja: "木",
    en: "WOOD",
    colorName: "곧게 뻗은 목(木)",
    serialPrefix: "WD",
    quote: '"겨울을 지나 기어이 싹을 틔우듯, 스스로 방향을 정하고 나아가요"',
    tags: ["추진력", "성장 마인드", "따뜻한 의리", "개척 정신"],
    stats: [
      { label: "추진력", val: 84, color: "#35B37E" },
      { label: "성장성", val: 78, color: "#C0392B" },
      { label: "신의", val: 70, color: "#E0A82E" },
      { label: "직관", val: 62, color: "#7C86A0" }
    ],
    desc: "어떤 환경에서도 스스로 길을 만들어내는 생명력을 지녔어요. 굽히지 않는 기개로 주변 사람들을 이끌지만, 때로는 휘어지는 유연함이 더 큰 성장을 만듭니다.",
    renderIcon: () => (
      <svg viewBox="0 0 48 48" fill="none" stroke="#C0392B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[64px] h-[64px]">
        <line x1="24" y1="44" x2="24" y2="12" />
        <path d="M24 24 L36 14" />
        <path d="M24 30 L12 20" />
        <path d="M24 16 L32 8" />
        <path d="M24 12 L18 6" />
        <circle cx="24" cy="6" r="2.5" />
      </svg>
    ),
    compatibility: {
      best: [
        {
          elem: "수",
          cardName: "깊은 지혜의 수(水)",
          hanja: "水",
          emoji: "💧",
          relationName: "수생목(水生木) 상생",
          oneLiner: "마르지 않는 영감과 통찰로 나의 성장을 묵묵히 돕는 최고의 영혼 멘토",
          score: 98,
          tip: "지치거나 방향이 고민될 때 수 카드의 조언을 들으면 막힌 길이 술술 풀립니다."
        },
        {
          elem: "화",
          cardName: "타오르는 화(火)",
          hanja: "火",
          emoji: "🔥",
          relationName: "목생화(木生火) 시너지",
          oneLiner: "나의 기획과 잠재력을 폭발적 에너지와 무대 감각으로 세상에 빛내주는 콤비",
          score: 95,
          tip: "함께 프로젝트를 시작하면 환상적인 속도감과 화제성을 만들어냅니다."
        }
      ],
      caution: [
        {
          elem: "금",
          cardName: "단단한 금(金)",
          hanja: "金",
          emoji: "⚔️",
          relationName: "금극목(金剋木) 긴장",
          oneLiner: "서로의 칼날 같은 원칙과 굽히지 않는 고집이 부딪힐 수 있어 솔직한 완충이 필요",
          score: 58,
          tip: "비판보다는 서로의 장점을 먼저 인정하고, 규칙과 역할 경계를 명확히 나누세요."
        },
        {
          elem: "목",
          cardName: "곧게 뻗은 목(木)",
          hanja: "木",
          emoji: "🌳",
          relationName: "동기 비견(比肩)",
          oneLiner: "둘 다 주도권과 자존심이 강해 영역이 겹치면 양보 없는 신경전이 될 수 있어요",
          score: 65,
          tip: "서로 간섭하기보다 각자 맡은 분야를 완전히 신임해줄 때 든든한 동지가 됩니다."
        }
      ]
    }
  },
  "화": {
    hanja: "火",
    en: "FIRE",
    colorName: "타오르는 화(火)",
    serialPrefix: "FR",
    quote: '"어둠 속에서도 길을 밝히듯, 솔직하고 분명한 에너지가 있어요"',
    tags: ["직관적 판단", "솔직담백", "순발력", "영감"],
    stats: [
      { label: "순발력", val: 88, color: "#F0632E" },
      { label: "추진력", val: 76, color: "#35B37E" },
      { label: "직관", val: 82, color: "#C0392B" },
      { label: "포용력", val: 56, color: "#E0A82E" }
    ],
    desc: "주변의 공기를 단숨에 바꾸는 온기를 지녔어요. 마음에 품은 것은 투명하게 드러나며 뒤끝이 없지만, 에너지를 한 번에 쏟고 지치지 않도록 조절이 필요해요.",
    renderIcon: () => (
      <svg viewBox="0 0 48 48" fill="none" stroke="#C0392B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[64px] h-[64px]">
        <path d="M24 4 C24 4 12 18 12 28 C12 36 17 42 24 42 C31 42 36 36 36 28 C36 18 24 4 24 4 Z" />
        <path d="M24 20 C24 20 18 26 18 31 C18 35 20.5 38 24 38 C27.5 38 30 35 30 31 C30 26 24 20 24 20 Z" opacity="0.5" />
      </svg>
    ),
    compatibility: {
      best: [
        {
          elem: "목",
          cardName: "곧게 뻗은 목(木)",
          hanja: "木",
          emoji: "🌲",
          relationName: "목생화(木生火) 상생",
          oneLiner: "나의 열정에 마르지 않는 연료를 대어주고 끝까지 깊이 믿어주는 든든한 조력자",
          score: 98,
          tip: "목 카드의 묵묵한 응원을 받을 때 화 카드의 잠재력이 두 배로 만개합니다."
        },
        {
          elem: "토",
          cardName: "너른 품의 토(土)",
          hanja: "土",
          emoji: "⛰️",
          relationName: "화생토(火生土) 결실",
          oneLiner: "급한 감정과 폭발적 에너지를 차분하게 받아내 실질적 결실로 굳혀주는 최고의 안식처",
          score: 94,
          tip: "화가 번아웃되거나 흥분했을 때 토 카드의 너른 품에서 마음의 안정을 찾을 수 있습니다."
        }
      ],
      caution: [
        {
          elem: "수",
          cardName: "깊은 지혜의 수(水)",
          hanja: "水",
          emoji: "💧",
          relationName: "수극화(水剋火) 충돌",
          oneLiner: "나의 솔직한 열정을 차가운 이성과 팩트로 급랭시킬 수 있어 감정 소모 주의",
          score: 54,
          tip: "상대의 직언을 공격으로 받아들이지 말고, 한 템포 식힌 뒤 논리적으로 소통하세요."
        },
        {
          elem: "화",
          cardName: "타오르는 화(火)",
          hanja: "火",
          emoji: "🔥",
          relationName: "동기 과열(比肩)",
          oneLiner: "둘 다 감정이 솔직하고 불같아 한번 붙으면 걷잡을 수 없이 타오르고 지칠 수 있어요",
          score: 62,
          tip: "갈등이 생겼을 땐 즉각 맞서지 말고 1시간 쿨다운 시간을 갖는 룰을 만드세요."
        }
      ]
    }
  },
  "토": {
    hanja: "土",
    en: "EARTH",
    colorName: "너른 품의 토(土)",
    serialPrefix: "ER",
    quote: '"모든 것을 품어내는 대지처럼, 묵묵하고 단단한 중심이 있어요"',
    tags: ["깊은 신의", "안정감", "경청", "중재력"],
    stats: [
      { label: "신의", val: 89, color: "#E0A82E" },
      { label: "포용력", val: 85, color: "#35B37E" },
      { label: "결단력", val: 62, color: "#7C86A0" },
      { label: "혜안", val: 68, color: "#3B5BFF" }
    ],
    desc: "어떤 이야기도 묵묵히 받아내어 결실로 만드는 안식처예요. 중심이 단단해 곁에 있는 사람에게 큰 안정감을 주지만, 너무 많은 무게를 혼자 짊어지지 마세요.",
    renderIcon: () => (
      <svg viewBox="0 0 48 48" fill="none" stroke="#C0392B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[64px] h-[64px]">
        <polygon points="24,6 42,38 6,38" />
        <polyline points="15,22 24,14 33,22" opacity="0.4" />
        <line x1="6" y1="42" x2="42" y2="42" />
      </svg>
    ),
    compatibility: {
      best: [
        {
          elem: "화",
          cardName: "타오르는 화(火)",
          hanja: "火",
          emoji: "🔥",
          relationName: "화생토(火生土) 상생",
          oneLiner: "신중하고 조용한 나의 마음에 기분 좋은 온기와 활력을 불어넣어주는 비타민",
          score: 97,
          tip: "화 카드의 밝은 에너지는 토 카드가 가진 무거운 생각의 짐을 가볍게 덜어줍니다."
        },
        {
          elem: "금",
          cardName: "단단한 금(金)",
          hanja: "金",
          emoji: "⚔️",
          relationName: "토생금(土生金) 발굴",
          oneLiner: "나의 묵직한 자원과 배려를 바탕으로 명쾌하고 깔끔한 결과물을 만들어내는 파트너",
          score: 95,
          tip: "토가 기반을 닦고 금이 마무리 결단을 내리면 어떤 일이든 빈틈없이 완성됩니다."
        }
      ],
      caution: [
        {
          elem: "목",
          cardName: "곧게 뻗은 목(木)",
          hanja: "木",
          emoji: "🌲",
          relationName: "목극토(木剋土) 침범",
          oneLiner: "나의 인내심과 배려를 당연하게 여기거나 휘두르려 할 때 깊은 피로와 서운함 발생",
          score: 56,
          tip: "참지만 말고 내가 감당할 수 있는 선을 분명히 밝혀야 건강한 관계가 유지됩니다."
        },
        {
          elem: "토",
          cardName: "너른 품의 토(土)",
          hanja: "土",
          emoji: "⛰️",
          relationName: "동기 정체(比肩)",
          oneLiner: "서로 속마음을 털어놓지 않고 속으로 삼키다 보면 답답하고 어색한 침묵이 생겨요",
          score: 66,
          tip: "먼저 솔직하게 감정을 표현해주는 작은 용기가 관계의 물꼬를 틉니다."
        }
      ]
    }
  },
  "금": {
    hanja: "金",
    en: "METAL",
    colorName: "단단한 금(金)",
    serialPrefix: "MT",
    quote: '"칼이 잘 벼려져 있듯, 결정할 때 흔들리지 않아요"',
    tags: ["결단력", "완벽주의", "의리파", "명쾌한 판단"],
    stats: [
      { label: "결단력", val: 82, color: "#7C86A0" },
      { label: "추진력", val: 64, color: "#F0632E" },
      { label: "신의", val: 71, color: "#E0A82E" },
      { label: "혜안", val: 58, color: "#3B5BFF" }
    ],
    desc: "군더더기 없는 명쾌함으로 상황을 정리하는 사람이에요. 한번 정한 원칙은 잘 굽히지 않고, 그 단단함이 주변에 신뢰를 줍니다. 다만 스스로에게도 그 잣대를 들이대니, 가끔은 조금 무뎌져도 괜찮아요.",
    renderIcon: () => (
      <svg viewBox="0 0 48 48" fill="none" stroke="#C0392B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[64px] h-[64px]">
        <path d="M24 4 L40 14 L40 34 L24 44 L8 34 L8 14 Z" />
        <path d="M24 12 L33 17.5 L33 30.5 L24 36 L15 30.5 L15 17.5 Z" opacity="0.55" />
        <path d="M24 4 L24 12 M40 14 L33 17.5 M40 34 L33 30.5 M24 44 L24 36 M8 34 L15 30.5 M8 14 L15 17.5" opacity="0.35" />
      </svg>
    ),
    compatibility: {
      best: [
        {
          elem: "토",
          cardName: "너른 품의 토(土)",
          hanja: "土",
          emoji: "⛰️",
          relationName: "토생금(土生金) 상생",
          oneLiner: "나의 날카로운 긴장과 예민한 완벽주의를 따스하게 품어주고 안식처를 주는 힐링 짝꿍",
          score: 98,
          tip: "세상과 싸우느라 지친 금 카드가 유일하게 마음 놓고 무장 해제할 수 있는 사람입니다."
        },
        {
          elem: "수",
          cardName: "깊은 지혜의 수(水)",
          hanja: "水",
          emoji: "💧",
          relationName: "금생수(金生水) 유통",
          oneLiner: "나의 예리한 원칙과 재능을 부드러운 통찰력으로 세상에 막힘없이 흘려보내 주는 콤비",
          score: 95,
          tip: "금의 단단한 아이디어를 수 카드가 유연하게 다듬어 대박 성과로 연결해 줍니다."
        }
      ],
      caution: [
        {
          elem: "화",
          cardName: "타오르는 화(火)",
          hanja: "火",
          emoji: "🔥",
          relationName: "화극금(火剋金) 제련",
          oneLiner: "나의 확고한 룰과 독립성을 직설적으로 흔들거나 통제하려 들면 극심한 마찰 발생",
          score: 55,
          tip: "서로의 통제 방식을 내려놓고, 논쟁 시 한 발 물러서서 서로의 룰을 존중해 주세요."
        },
        {
          elem: "금",
          cardName: "단단한 금(金)",
          hanja: "金",
          emoji: "⚔️",
          relationName: "동기 격돌(比肩)",
          oneLiner: "두 칼날이 맞부딪히듯 한 치의 양보 없는 자존심 대결로 치닫기 쉬워요",
          score: 60,
          tip: "옳고 그름을 따지기보다 서로의 완벽함을 칭찬하고 경청하는 태도가 핵심입니다."
        }
      ]
    }
  },
  "수": {
    hanja: "水",
    en: "WATER",
    colorName: "깊은 지혜의 수(水)",
    serialPrefix: "AQ",
    quote: '"모난 돌을 감싸며 흐르듯, 깊은 혜안으로 길을 찾아요"',
    tags: ["깊은 혜안", "유연한 처세", "통찰력", "공감"],
    stats: [
      { label: "혜안", val: 86, color: "#3B5BFF" },
      { label: "유연성", val: 82, color: "#35B37E" },
      { label: "결단력", val: 60, color: "#7C86A0" },
      { label: "신의", val: 72, color: "#E0A82E" }
    ],
    desc: "바위에 부딪혀도 막히지 않고 길을 내어가는 지혜를 지녔어요. 상황을 넓게 보고 본질을 짚어내지만, 생각이 깊어져 실행을 망설이지 않도록 한 걸음 내딛어보세요.",
    renderIcon: () => (
      <svg viewBox="0 0 48 48" fill="none" stroke="#C0392B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[64px] h-[64px]">
        <path d="M6 18 C12 12, 18 24, 24 18 C30 12, 36 24, 42 18" />
        <path d="M6 26 C12 20, 18 32, 24 26 C30 20, 36 32, 42 26" opacity="0.7" />
        <path d="M6 34 C12 28, 18 40, 24 34 C30 28, 36 40, 42 34" opacity="0.4" />
      </svg>
    ),
    compatibility: {
      best: [
        {
          elem: "금",
          cardName: "단단한 금(金)",
          hanja: "金",
          emoji: "⚔️",
          relationName: "금생수(金生水) 상생",
          oneLiner: "나의 방대한 생각과 깊은 통찰을 명쾌한 결단과 깔끔한 행동력으로 실체화해주는 조력자",
          score: 98,
          tip: "수가 큰 그림을 그리고 금이 신속하게 칼을 빼들 때 최고의 시너지가 터집니다."
        },
        {
          elem: "목",
          cardName: "곧게 뻗은 목(木)",
          hanja: "木",
          emoji: "🌲",
          relationName: "수생목(水生木) 양분",
          oneLiner: "나의 지혜와 지식을 거름 삼아 세상 밖으로 거침없이 뻗어나가는 훌륭한 러닝메이트",
          score: 96,
          tip: "목 카드의 성장과 도전을 지켜보는 것만으로도 수 카드에게 큰 보람과 영감이 됩니다."
        }
      ],
      caution: [
        {
          elem: "토",
          cardName: "너른 품의 토(土)",
          hanja: "土",
          emoji: "⛰️",
          relationName: "토극수(土剋水) 가둠",
          oneLiner: "나의 자유로운 사고와 유연한 흐름을 과도한 틀과 고집으로 옭아맬 때 답답함 폭발",
          score: 57,
          tip: "서로에게 일방적인 통제를 강요하지 말고, 각자의 공간과 자유를 인정해 주세요."
        },
        {
          elem: "수",
          cardName: "깊은 지혜의 수(水)",
          hanja: "水",
          emoji: "💧",
          relationName: "동기 고립(比肩)",
          oneLiner: "둘 다 생각이 너무 깊고 조심스러워 행동으로 옮기지 못하고 정체될 위험이 있어요",
          score: 63,
          tip: "생각은 짧게 하고 일단 작은 실행 하나를 정해 함께 도전하는 습관을 들이세요."
        }
      ]
    }
  }
};

// Module-level global memory cache for instant tab transitions
let cachedPersonalProfile: PersonalSajuProfile | null = null;
let cachedIsCouponUnlocked: boolean = false;
let personalProfileHasLoadedOnce = false;

export function resetMySajuMemoryCache(): void {
  cachedPersonalProfile = null;
  cachedIsCouponUnlocked = false;
  personalProfileHasLoadedOnce = false;
}

export default function MySajuView() {
  const [isSamplePreview, setIsSamplePreview] = useState(() => {
    return window.location.hash.includes("preview=sample");
  });
  const [profile, setProfile] = useState<PersonalSajuProfile | null>(() => {
    if (window.location.hash.includes("preview=sample")) {
      return createSampleProfile();
    }
    if (cachedPersonalProfile) return cachedPersonalProfile;
    try {
      const localStr = localStorage.getItem("saju_my_personal_profile");
      if (localStr) {
        const parsed = JSON.parse(localStr);
        // Only use if not belonging to a different user
        const currentUid = auth.currentUser && !auth.currentUser.isAnonymous ? auth.currentUser.uid : null;
        if (!parsed.ownerUid || parsed.ownerUid === currentUid) {
          cachedPersonalProfile = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.debug("Failed to parse initial personal profile from localStorage:", e);
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    return !personalProfileHasLoadedOnce && !cachedPersonalProfile;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editError] = useState("");
  const [analysisTab, setAnalysisTab] = useState<"fortune" | "elements" | "mix" | "saju" | "ziwei">("fortune");
  const [shareSuccessMsg, setShareSuccessMsg] = useState("");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isViralModalOpen, setIsViralModalOpen] = useState(false);
  const [isCouponUnlocked, setIsCouponUnlocked] = useState(() => {
    return cachedIsCouponUnlocked;
  });
  const [couponMsg, setCouponMsg] = useState("");
  const [ticketAccount, setTicketAccount] = useState<UserTicketAccount | null>(null);
  const [inlineCouponInput, setInlineCouponInput] = useState("");
  const [inlineCouponError, setInlineCouponError] = useState("");
  const [inlineCouponLoading, setInlineCouponLoading] = useState(false);
  const [activeTipCard, setActiveTipCard] = useState<string | null>(null);
  const [copiedCardMsg, setCopiedCardMsg] = useState("");

  const currentUser = auth.currentUser;
  const membership = getUserMembershipInfo(currentUser);

  // Real-time listener for global session / logout / account deletion events
  useEffect(() => {
    const handleSessionCleared = () => {
      resetMySajuMemoryCache();
      setProfile(null);
      setIsCouponUnlocked(false);
      setTicketAccount(null);
      setIsEditing(false);
      setAnalysisTab("fortune");
    };

    window.addEventListener("saju_session_cleared", handleSessionCleared);
    return () => {
      window.removeEventListener("saju_session_cleared", handleSessionCleared);
    };
  }, []);

  useEffect(() => {
    const handleHashCheck = () => {
      if (window.location.hash.includes("preview=sample")) {
        setIsSamplePreview(true);
        setProfile(createSampleProfile());
        setIsEditing(false);
      }
    };
    window.addEventListener("hashchange", handleHashCheck);
    return () => window.removeEventListener("hashchange", handleHashCheck);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (window.location.hash.includes("preview=sample") || isSamplePreview) {
        setIsSamplePreview(true);
        setProfile(createSampleProfile());
        setLoading(false);
        return;
      }

      const shouldShowLoader = !personalProfileHasLoadedOnce && !profile;
      if (shouldShowLoader) {
        setLoading(true);
      }
      try {
        if (!currentUser) {
          // If unauthenticated / logged out, check guest profile or reset
          const saved = await getUserPersonalProfile();
          if (saved) {
            setProfile(saved);
            cachedPersonalProfile = saved;
          }
          setIsCouponUnlocked(false);
          setTicketAccount(null);
        } else {
          // Authenticated: load strict profile from Firestore
          const saved = await getUserPersonalProfile();
          setProfile(saved);
          cachedPersonalProfile = saved;

          const unlocked = await checkProductUnlock("personal_report", currentUser.uid);
          setIsCouponUnlocked(unlocked);
          cachedIsCouponUnlocked = unlocked;

          try {
            const acc = await getUserTicketAccount(currentUser.uid);
            setTicketAccount(acc);
          } catch (e) {
            console.debug("Failed to load user ticket account in MySajuView:", e);
          }
        }

        personalProfileHasLoadedOnce = true;
      } catch (err) {
        console.error("Failed to load personal profile:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [currentUser]);

  const handleSaveProfile = (formData: {
    nickname: string;
    gender: string;
    birth_date: string;
    birth_time: string | null;
    saju: any;
    character_emoji: string;
    character_animal: string;
    character_color: string;
    mbti?: string | null;
    birthplace_region?: string;
    birthplace_city?: string;
  }) => {
    const newProfile: PersonalSajuProfile = {
      nickname: formData.nickname,
      gender: formData.gender as "남성" | "여성",
      birth_date: formData.birth_date,
      birth_time: formData.birth_time,
      saju: formData.saju,
      character_emoji: formData.character_emoji,
      character_animal: formData.character_animal,
      character_color: formData.character_color,
      mbti: formData.mbti,
      birthplace_region: formData.birthplace_region || null,
      birthplace_city: formData.birthplace_city || formData.saju?.birthplace?.name || null,
    };

    saveUserPersonalProfile(newProfile);
    setProfile(newProfile);
    cachedPersonalProfile = newProfile;
    setIsSamplePreview(false);
    setIsEditing(false);
    if (window.location.hash.includes("preview=sample")) {
      window.location.hash = "#/my-saju";
    }
  };

  const rawGan = profile?.saju?.daymaster?.gan || "무토";
  const daymasterGan = rawGan.length > 1 ? rawGan[0] : rawGan;
  const daymasterElement = profile?.saju?.daymaster?.element || "토";
  const rawJi = profile?.saju?.pillars?.day?.ji || "진";
  const ji = rawJi.length > 1 ? rawJi[0] : rawJi;

  const spec = ELEMENT_SPECS[daymasterElement] || ELEMENT_SPECS["토"];
  const todayFortune = calculateTodayFortune(daymasterGan, daymasterElement);

  // 시리얼 넘버
  const cardSerial = React.useMemo(() => {
    const ganCode = daymasterGan.charCodeAt(0) % 10;
    const jiCode = ji.charCodeAt(0) % 12;
    const num = String(ganCode * 6 + jiCode + 1).padStart(3, "0");
    return `${spec.serialPrefix}-${num} · ${daymasterGan}${ji}`;
  }, [daymasterGan, ji, spec.serialPrefix]);

  // 오행 카운트
  const ohaengCount = React.useMemo(() => {
    const counts: Record<string, number> = { "목": 0, "화": 0, "토": 0, "금": 0, "수": 0 };
    const saju = profile?.saju;

    if (saju?.ohaeng_count) {
      let found = false;
      for (const [k, v] of Object.entries(saju.ohaeng_count)) {
        if (counts[k] !== undefined && typeof v === "number" && v > 0) {
          counts[k] = v;
          found = true;
        }
      }
      if (found) return counts;
    }

    if (saju?.pillars) {
      const ganToElem: Record<string, string> = {
        "甲": "목", "乙": "목", "갑": "목", "을": "목",
        "丙": "화", "丁": "화", "병": "화", "정": "화",
        "戊": "토", "己": "토", "무": "토", "기": "토",
        "庚": "금", "辛": "금", "경": "금", "신": "금",
        "壬": "수", "癸": "수", "임": "수", "계": "수"
      };
      const jiToElem: Record<string, string> = {
        "寅": "목", "卯": "목", "인": "목", "묘": "목",
        "巳": "화", "午": "화", "사": "화", "오": "화",
        "辰": "토", "戌": "토", "丑": "토", "未": "토", "진": "토", "술": "토", "축": "토", "미": "토",
        "申": "금", "酉": "금", "신": "금", "유": "금",
        "亥": "수", "子": "수", "해": "수", "자": "수"
      };

      const parseVal = (val: any) => {
        if (!val || typeof val !== "string") return;
        const str = val.trim();
        if (ganToElem[str]) counts[ganToElem[str]]++;
        else if (jiToElem[str]) counts[jiToElem[str]]++;
        else {
          for (const ch of str) {
            if (ganToElem[ch]) { counts[ganToElem[ch]]++; break; }
            if (jiToElem[ch]) { counts[jiToElem[ch]]++; break; }
          }
        }
      };

      ['year', 'month', 'day', 'hour'].forEach((pKey) => {
        const pillar = saju.pillars[pKey];
        if (pillar) {
          if (pillar.gan) parseVal(pillar.gan);
          if (pillar.ji) parseVal(pillar.ji);
        }
      });

      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      if (total > 0) return counts;
    }

    return { "목": 1, "화": 2, "토": 2, "금": 2, "수": 1 };
  }, [profile?.saju]);

  const totalOhaeng: number = Math.max(1, Number(Object.values(ohaengCount).reduce((a: number, b: any) => a + Number(b || 0), 0)));

  const handleShareMySaju = async () => {
    if (!profile) return;
    const currentUrl = window.location.href;
    const bestMatches = spec.compatibility?.best?.map(b => `${b.emoji} ${b.cardName}(${b.score}점)`).join(", ") || "";
    const cautionMatches = spec.compatibility?.caution?.map(c => `${c.emoji} ${c.cardName}(${c.score}점)`).join(", ") || "";

    const fullDesc = `${spec.quote}\n\n💖 찰떡 소울카드: ${bestMatches}\n⚠️ 주의 소울카드: ${cautionMatches}`;

    const res = await shareToKakaoOrClipboard({
      title: `[소울 카드] ${profile.nickname}님은 ${spec.colorName}`,
      badge: `오늘의 일진 ${todayFortune.score}점`,
      description: fullDesc,
      url: currentUrl,
    });

    if (res.method === "web_share") {
      setShareSuccessMsg("공유 창이 열렸습니다!");
    } else {
      setShareSuccessMsg("📋 카톡 공유 문구와 링크가 복사되었습니다!");
    }
    setTimeout(() => setShareSuccessMsg(""), 3500);
  };

  const handleUnlockWithCoupon = async () => {
    const pdfTickets = (ticketAccount?.tickets?.pdf || 0) + (ticketAccount?.tickets?.all || 0);
    if (pdfTickets > 0) {
      setLoading(true);
      try {
        const res = await consumeSingleUseTicket("pdf", {
          label: "심층 종합 감정서 해금"
        });
        if (res.success) {
          setIsCouponUnlocked(true);
          cachedIsCouponUnlocked = true;
          await activatePremiumSimulation(undefined, "personal_report");
          setCouponMsg("🎫 보유하신 1회 확인권 1장을 사용하여 심층 감정서가 즉시 해금되었습니다!");
          const acc = await getUserTicketAccount();
          setTicketAccount(acc);
        } else {
          setCouponMsg(`❌ 해금 실패: ${res.message}`);
        }
      } catch (err: any) {
        setCouponMsg(`❌ 오류: ${err.message || err}`);
      } finally {
        setLoading(false);
        setTimeout(() => setCouponMsg(""), 4000);
      }
    } else {
      // Show warning or allow coupon input
      setInlineCouponError("사용 가능한 1회 확인권이 없습니다. 쿠폰 번호를 입력해 주세요.");
    }
  };

  const handleApplyInlineCoupon = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setInlineCouponError("쿠폰 번호를 입력해 주세요.");
      return;
    }

    if (!membership.canUseCoupon) {
      if (membership.isEmailOnly) {
        setIsUpgradeModalOpen(true);
      } else {
        setIsAuthModalOpen(true);
      }
      return;
    }

    setInlineCouponLoading(true);
    setInlineCouponError("");
    try {
      const res = await redeemCoupon(cleanCode);
      if (res.success) {
        // Reload ticket count
        const acc = await getUserTicketAccount();
        setTicketAccount(acc);

        // Consume the ticket immediately to unlock!
        const newAvailable = (acc?.tickets?.pdf || 0) + (acc?.tickets?.all || 0);
        if (newAvailable > 0) {
          const consumeRes = await consumeSingleUseTicket("pdf", {
            label: `심층 종합 감정서 해금 (쿠폰 ${cleanCode})`
          });
          if (consumeRes.success) {
            setIsCouponUnlocked(true);
            cachedIsCouponUnlocked = true;
            await activatePremiumSimulation(undefined, "personal_report");
            setCouponMsg(`🎟️ 쿠폰 [${cleanCode}] 등록 및 상세 분석 해금이 성공적으로 완료되었습니다!`);
            const finalAcc = await getUserTicketAccount();
            setTicketAccount(finalAcc);
          }
        } else {
          setCouponMsg(`🎉 쿠폰 [${cleanCode}]이 정상 등록되었습니다! 다른 혜택 상품이 해금되었습니다.`);
        }
      } else {
        setInlineCouponError(res.message);
      }
    } catch (err: any) {
      setInlineCouponError(err.message || "쿠폰 확인 중 오류가 발생했습니다.");
    } finally {
      setInlineCouponLoading(false);
      setTimeout(() => setCouponMsg(""), 4000);
    }
  };

  return (
    <Layout title="내 소울 카드 · 사주" showHomeButton>
      {loading && <LoadingOverlay message="사주 명식을 불러오는 중입니다..." />}

      <div className="space-y-4 py-1">
        
        {/* 상단 2단 대형 탭: [Tab1: 나만의 소울 사주 카드] vs [Tab2: 모임 그룹 궁합] */}
        <div className="grid grid-cols-2 gap-2 bg-[#EFE9DF] p-1.5 rounded-2xl text-xs sm:text-sm font-serif font-bold shadow-2xs">
          <button
            type="button"
            className="py-3 px-2.5 rounded-xl bg-white text-[#2C3E50] shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer text-center"
          >
            <Sparkles className="w-4 h-4 text-[#C0392B]" />
            <span className="truncate">나만의 소울 사주 카드</span>
          </button>

          <a
            href="#/group"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = "#/group";
            }}
            className="py-3 px-2.5 rounded-xl text-[#5C5046] hover:text-[#2C3E50] hover:bg-white/50 flex items-center justify-center gap-1.5 transition cursor-pointer text-center"
          >
            <Users className="w-4 h-4 text-[#7F8C8D]" />
            <span className="truncate">모임 그룹 궁합</span>
          </a>
        </div>

        {/* 사주 미등록 또는 수정 모드 -> 예시 카드 없이 곧바로 정밀 사주 명식 입력 폼 렌더링 */}
        {(!profile || isEditing) ? (
          <div className="space-y-4 animate-fade-in text-left">
            {editError && (
              <div className="text-xs text-rose-800 bg-rose-50 p-3.5 rounded-2xl border border-rose-200 font-bold text-center">
                ⚠️ {editError}
              </div>
            )}

            <SajuForm
              onSubmit={handleSaveProfile}
              submitButtonText={profile ? "수정된 사주로 다시 생성하기" : "내 소울 카드 생성하기"}
              initialNickname={profile?.nickname || currentUser?.displayName || ""}
              initialGender={profile?.gender || "남성"}
              initialBirthDate={profile?.birth_date || "1995-05-15"}
              initialBirthTime={profile?.birth_time || null}
              initialMbti={profile?.mbti || null}
              initialBirthplaceCity={profile?.birthplace_city || profile?.saju?.birthplace?.name || null}
              initialBirthplaceRegion={profile?.birthplace_region || null}
            />

            {profile && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="w-full py-3 bg-[#7F8C8D] hover:bg-[#6C7A89] text-white font-serif font-bold text-xs rounded-2xl transition text-center shadow-xs cursor-pointer"
              >
                수정 취소하고 기존 카드 보기
              </button>
            )}
          </div>
        ) : (
          /* =========================================================================
             [전면 핵심 UI] 1. 소울 카드 전면 배치 (피로감 제로, 쾌적한 정보 전달)
             ========================================================================= */
          <div className="space-y-4 animate-fade-in text-left">
            
            {/* 예시 체험 모드 배너 */}
            {isSamplePreview && (
              <div className="bg-gradient-to-r from-amber-50 via-[#FFFDF9] to-orange-50 border-2 border-amber-300/90 rounded-2xl p-4 sm:p-4.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg shrink-0">
                    ✨
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-serif font-bold text-[#1E293B]">예시 소울카드 체험 모드</span>
                      <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-bold">무로그인 1초 미리보기</span>
                    </div>
                    <p className="text-[11px] text-[#5C5046] mt-0.5">
                      실제 사주명식(1995.05.15 丙午일주) 데이터로 생성된 예시 카드입니다.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setIsSamplePreview(false);
                    if (window.location.hash.includes("preview=sample")) {
                      window.location.hash = "#/my-saju";
                    }
                  }}
                  className="w-full sm:w-auto px-4.5 py-2.5 bg-[#C0392B] hover:bg-[#A93226] text-white font-serif font-bold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>내 사주로 직접 만들기</span>
                </button>
              </div>
            )}

            {/* 상단 간편 바 */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-serif font-bold text-[#5A4D41]">
                {profile.nickname}님의 소울 카드
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-[#5C5046] hover:text-[#C0392B] flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>정보 수정</span>
              </button>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                규격 소울 카드 전면 배치 (#FFFFFF, 28px, Pretendard, 버건디 키컬러)
               ───────────────────────────────────────────────────────────── */}
            <div
              className="w-full bg-[#FFFFFF] rounded-[28px] p-6 sm:p-7 shadow-[0_15px_40px_-15px_rgba(192,57,43,0.12)] border border-[#EFE9DF]"
              style={{ fontFamily: '"Pretendard", system-ui, sans-serif' }}
            >
              {/* 1. 상단: 시리얼 & 오행 배지 */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-[11px] font-mono tracking-[0.14em] text-[#5C5046]">
                  {cardSerial}
                </span>
                <span className="text-[11px] font-bold tracking-[0.08em] text-[#C0392B] bg-[#FDEDEC] px-2.5 py-1 rounded-full">
                  {spec.hanja} {spec.en}
                </span>
              </div>

              {/* 2. 엠블럼: 지름 112px 원, 배경 #FDEDEC, 플랫 라인 SVG & 캐릭터 동물 */}
              <div className="relative w-[112px] h-[112px] mx-auto mb-3.5 rounded-full bg-gradient-to-b from-[#FDEDEC] to-[#FCE3E1] flex items-center justify-center border border-[#F5D5D3] shadow-inner">
                {spec.renderIcon()}
                {profile.character_emoji && (
                  <div
                    className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white flex items-center justify-center text-lg shadow-sm"
                    title={profile.character_animal || "소울 동물"}
                  >
                    {profile.character_emoji}
                  </div>
                )}
              </div>

              {/* 3. 이름 헤드라인 & 12간지 동물 배지 */}
              <div className="text-center space-y-1 mb-2.5">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF2EB] border border-[#EED7C5] text-[11px] font-serif font-bold text-[#8C4A38]">
                  <span>{profile.character_emoji}</span>
                  <span>{profile.character_animal || "소울 기질"} · {profile.saju?.daymaster?.gan || "일간"}</span>
                </div>
                <h1 className="text-[25px] font-[800] tracking-[-0.02em] leading-[1.25] text-[#2C3E50]">
                  {profile.nickname}님은 <span className="text-[#C0392B]">{spec.colorName}</span>
                </h1>
              </div>

              {/* 4. 한 줄 정의: 14px/500 */}
              <p className="text-center text-[14px] font-[500] leading-[1.55] text-[#5A4D41] max-w-[300px] mx-auto mb-5">
                {spec.quote}
              </p>

              {/* 5. 키워드 태그: 알약형 */}
              <div className="flex flex-wrap gap-1.5 justify-center mb-6">
                {spec.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[12px] font-[600] text-[#C0392B] bg-[#FDEDEC] px-3 py-1.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 6. 오행 스탯 4줄 */}
              <div className="space-y-2.5 mb-6">
                {spec.stats.map((st, idx) => (
                  <div key={idx} className="grid grid-cols-[48px_1fr_32px] items-center gap-2.5">
                    <span className="text-[12.5px] font-[700] text-[#2C3E50]">
                      {st.label}
                    </span>
                    <div className="h-[7px] bg-[#F5EFE6] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${st.val}%`, backgroundColor: st.color }}
                      />
                    </div>
                    <span className="text-[12px] font-[700] font-mono text-right text-[#5C5046]">
                      {st.val}
                    </span>
                  </div>
                ))}
              </div>

              {/* 7. 하단 설명 문단 */}
              <div className="pt-4 border-t border-[#EFE9DF] mb-5">
                <p className="text-[13.5px] leading-[1.65] text-[#5A4D41]">
                  {spec.desc}
                </p>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  [소울카드 인연 케미] 잘 맞는 카드 vs 주의해야 할 카드
                 ───────────────────────────────────────────────────────────── */}
              {spec.compatibility && (
                <div className="pt-5 border-t border-[#EFE9DF] mb-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-[#2C3E50] font-serif">
                        소울카드 인연 궁합
                      </span>
                      <span className="text-[10px] font-bold text-[#C0392B] bg-[#FDEDEC] px-1.5 py-0.5 rounded-full">
                        오행 상생상극
                      </span>
                    </div>
                    <span className="text-[10.5px] text-[#8C7E74]">
                      카드를 누르면 소통 팁 확인
                    </span>
                  </div>

                  {/* 1. 영혼의 찰떡 소울카드 (잘 맞는 인연) */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      <span>💖 영혼이 통하는 찰떡 소울카드</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {spec.compatibility.best.map((item, idx) => {
                        const isExpanded = activeTipCard === `best-${idx}`;
                        return (
                          <div
                            key={idx}
                            onClick={() => setActiveTipCard(isExpanded ? null : `best-${idx}`)}
                            className="bg-[#F4F9F5] hover:bg-[#EBF5EE] border border-[#D1E7D8] rounded-2xl p-3.5 transition-all cursor-pointer shadow-3xs"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-base">{item.emoji}</span>
                                <span className="font-bold text-[13px] text-[#1E4D2B]">
                                  {item.cardName}
                                </span>
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                                  {item.relationName}
                                </span>
                              </div>
                              <span className="text-xs font-black font-mono text-emerald-700 bg-white/90 px-2 py-0.5 rounded-full shrink-0">
                                {item.score}점
                              </span>
                            </div>
                            <p className="text-[12px] text-[#33533D] leading-relaxed mb-1">
                              {item.oneLiner}
                            </p>
                            {isExpanded && (
                              <div className="mt-2 pt-2 border-t border-emerald-200/60 bg-white/80 rounded-xl p-2.5 text-[11px] text-[#245330] leading-relaxed animate-fade-in flex items-start gap-1.5">
                                <span className="text-amber-500 shrink-0">💡</span>
                                <div>
                                  <strong className="text-emerald-900">실전 시너지 팁: </strong>
                                  {item.tip}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. 주의해야 할 소울카드 (조심할 조합) */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                      <span>⚠️ 조심스럽게 맞춰가야 할 주의 카드</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {spec.compatibility.caution.map((item, idx) => {
                        const isExpanded = activeTipCard === `caution-${idx}`;
                        return (
                          <div
                            key={idx}
                            onClick={() => setActiveTipCard(isExpanded ? null : `caution-${idx}`)}
                            className="bg-[#FDF6F5] hover:bg-[#FCEEEB] border border-[#F5D5D0] rounded-2xl p-3.5 transition-all cursor-pointer shadow-3xs"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-base">{item.emoji}</span>
                                <span className="font-bold text-[13px] text-[#78281F]">
                                  {item.cardName}
                                </span>
                                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-md">
                                  {item.relationName}
                                </span>
                              </div>
                              <span className="text-xs font-black font-mono text-rose-700 bg-white/90 px-2 py-0.5 rounded-full shrink-0">
                                {item.score}점
                              </span>
                            </div>
                            <p className="text-[12px] text-[#642821] leading-relaxed mb-1">
                              {item.oneLiner}
                            </p>
                            {isExpanded && (
                              <div className="mt-2 pt-2 border-t border-rose-200/60 bg-white/80 rounded-xl p-2.5 text-[11px] text-[#5C231C] leading-relaxed animate-fade-in flex items-start gap-1.5">
                                <span className="text-rose-500 shrink-0">🛡️</span>
                                <div>
                                  <strong className="text-rose-900">갈등 예방 팁: </strong>
                                  {item.tip}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 하단 인터랙션 액션 버튼들 */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsViralModalOpen(true)}
                  className="py-3 px-2 rounded-full bg-[#C0392B] hover:bg-[#A93226] text-white text-[11px] font-[700] transition active:scale-[0.99] flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>소울 포토 카드 공유/저장</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareMySaju}
                  className="py-3 px-2 rounded-full bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] text-[11px] font-[700] transition active:scale-[0.99] flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>텍스트 결과 복사</span>
                </button>
              </div>

              {/* 이미지 공유 안내 설명 추가 */}
              <p className="text-[10.5px] text-center text-[#8C7E74] leading-relaxed mt-2.5">
                ※ 실물 <strong>'소울 카드 이미지'</strong>를 카톡방에 사진으로 직접 올리시려면 <strong>[소울 포토 카드 공유/저장]</strong> 버튼을 이용해 주세요!
              </p>
            </div>

            {shareSuccessMsg && (
              <div className="bg-emerald-50 text-emerald-900 border border-emerald-300 p-2.5 rounded-xl text-xs font-bold text-center animate-fade-in flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{shareSuccessMsg}</span>
              </div>
            )}

            {/* =========================================================================
               [단일 계층 헤더 탭 메뉴: 내 사주 정밀 분석 & 리포트]
               - 중첩된 크리스마스트리형 다단 탭을 완전히 평탄화하여 1클릭으로 직관적 전환
               ========================================================================= */}
            <div className="bg-white border border-[#E7E1D6] rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
              {/* 상단 헤더 타이틀 */}
              <div className="flex items-center justify-between border-b border-[#EFE9DF] pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#C0392B]" />
                    <h3 className="font-serif text-base font-bold text-[#2C3E50]">
                      내 사주 정밀 분석 & 리포트
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#5C5046]">
                    원하는 탭을 클릭하여 운세, 오행 균형, 융합 총평, 정통 만세력 및 명반을 확인하세요.
                  </p>
                </div>
              </div>

              {/* 직관적인 1계층 플랫 헤더 탭 바 (모바일 가로 스크롤 완벽 대응) */}
              <div className="flex bg-[#FAF7F2] p-1.5 rounded-2xl gap-1 overflow-x-auto no-scrollbar text-xs font-bold select-none">
                <button
                  type="button"
                  onClick={() => setAnalysisTab("fortune")}
                  className={`flex-1 min-w-[92px] py-2 px-2.5 rounded-xl transition text-center flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    analysisTab === "fortune"
                      ? "bg-white text-[#2C3E50] shadow-xs"
                      : "text-[#5C5046] hover:text-[#2C3E50] hover:bg-white/60"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>오늘의 운세</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">무료</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAnalysisTab("elements")}
                  className={`flex-1 min-w-[92px] py-2 px-2.5 rounded-xl transition text-center flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    analysisTab === "elements"
                      ? "bg-white text-[#2C3E50] shadow-xs"
                      : "text-[#5C5046] hover:text-[#2C3E50] hover:bg-white/60"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>오행 밸런스</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">무료</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAnalysisTab("mix")}
                  className={`flex-1 min-w-[102px] py-2 px-2.5 rounded-xl transition text-center flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    analysisTab === "mix"
                      ? "bg-[#2C3E50] text-white shadow-xs font-bold"
                      : "text-[#C0392B] hover:text-[#2C3E50] hover:bg-white/60"
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 shrink-0 ${analysisTab === "mix" ? "text-amber-300" : "text-[#C0392B]"}`} />
                  <span>통합 조화 총평</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                    analysisTab === "mix" ? "bg-white/20 text-amber-200" : "bg-rose-100 text-rose-800"
                  }`}>
                    {isCouponUnlocked ? "열람" : "심층"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAnalysisTab("saju")}
                  className={`flex-1 min-w-[95px] py-2 px-2.5 rounded-xl transition text-center flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    analysisTab === "saju"
                      ? "bg-[#2C3E50] text-white shadow-xs font-bold"
                      : "text-[#C0392B] hover:text-[#2C3E50] hover:bg-white/60"
                  }`}
                >
                  <Calendar className={`w-3.5 h-3.5 shrink-0 ${analysisTab === "saju" ? "text-amber-300" : "text-[#C0392B]"}`} />
                  <span>사주 만세력</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                    analysisTab === "saju" ? "bg-white/20 text-amber-200" : "bg-rose-100 text-rose-800"
                  }`}>
                    {isCouponUnlocked ? "열람" : "심층"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAnalysisTab("ziwei")}
                  className={`flex-1 min-w-[98px] py-2 px-2.5 rounded-xl transition text-center flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    analysisTab === "ziwei"
                      ? "bg-[#2C3E50] text-white shadow-xs font-bold"
                      : "text-[#C0392B] hover:text-[#2C3E50] hover:bg-white/60"
                  }`}
                >
                  <Crown className={`w-3.5 h-3.5 shrink-0 ${analysisTab === "ziwei" ? "text-amber-300" : "text-[#C0392B]"}`} />
                  <span>자미두수 명반</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                    analysisTab === "ziwei" ? "bg-white/20 text-amber-200" : "bg-rose-100 text-rose-800"
                  }`}>
                    {isCouponUnlocked ? "열람" : "심층"}
                  </span>
                </button>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  [단일 뷰 렌더링 영역: 선택된 탭에 따라 직결 렌더링]
                 ───────────────────────────────────────────────────────────── */}
              
              {/* 1. 무료 공개: 오늘의 운세 */}
              {analysisTab === "fortune" && (
                <div className="bg-[#FAF8F5] rounded-2xl p-4.5 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-600" />
                      <span className="font-serif font-bold text-sm text-[#2C3E50]">오늘 하루의 행운 지수 (일진)</span>
                    </div>
                    <span className="text-xl font-black font-serif text-[#C0392B]">
                      {todayFortune.score}점
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#2C3E50]">"{todayFortune.title}"</h4>
                  <p className="text-xs text-[#5A4D41] leading-relaxed">{todayFortune.advice}</p>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                    <div className="bg-white p-2.5 rounded-xl text-center shadow-3xs">
                      <span className="text-[10px] text-[#5C5046] block mb-0.5 font-medium">행운 색상</span>
                      <span className="font-bold text-[#2C3E50]">{todayFortune.luckColor.split("·")[0]}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl text-center shadow-3xs">
                      <span className="text-[10px] text-[#5C5046] block mb-0.5 font-medium">행운 방위</span>
                      <span className="font-bold text-[#2C3E50]">{todayFortune.luckDirection}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl text-center shadow-3xs">
                      <span className="text-[10px] text-[#5C5046] block mb-0.5 font-medium">행운 소품</span>
                      <span className="font-bold text-[#2C3E50] truncate block">{todayFortune.luckItem}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. 무료 공개: 오행 밸런스 */}
              {analysisTab === "elements" && (
                <div className="bg-[#FAF8F5] rounded-2xl p-4.5 space-y-3.5 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-[#EFE9DF] pb-2">
                    <span className="font-serif font-bold text-sm text-[#2C3E50]">내 타고난 성향과 5가지 기운</span>
                    <span className="text-[11px] text-[#5C5046]">총 {totalOhaeng}개 기운</span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 text-center">
                    {[
                      { name: "목(木)", count: ohaengCount["목"] || 0, color: "#35B37E" },
                      { name: "화(火)", count: ohaengCount["화"] || 0, color: "#F0632E" },
                      { name: "토(土)", count: ohaengCount["토"] || 0, color: "#E0A82E" },
                      { name: "금(金)", count: ohaengCount["금"] || 0, color: "#7C86A0" },
                      { name: "수(水)", count: ohaengCount["수"] || 0, color: "#3B5BFF" },
                    ].map((item, idx) => {
                      const pct = Math.round((item.count / totalOhaeng) * 100);
                      return (
                        <div key={idx} className="bg-white p-2.5 rounded-xl space-y-1 shadow-3xs">
                          <span className="text-[11px] font-bold text-[#2C3E50] block">{item.name}</span>
                          <span className="text-base font-extrabold text-[#2C3E50] block font-mono leading-none">{item.count}</span>
                          <div className="w-full bg-[#F5EFE6] rounded-full h-1 overflow-hidden">
                            <div className="h-full" style={{ width: `${Math.min(100, Math.max(10, pct))}%`, backgroundColor: item.color }} />
                          </div>
                          <span className="text-[9px] text-[#5C5046] block font-mono leading-none">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3.5 bg-white border-l-2 border-[#C0392B] rounded-r-xl rounded-l-xs text-[11px] text-[#5A4D41] leading-relaxed flex items-start gap-2 shadow-3xs">
                    <Lightbulb className="w-3.5 h-3.5 text-[#C0392B] shrink-0 mt-0.5" />
                    <span>태어난 날의 일간({daymasterGan})을 중심으로 오행의 과다·과소 기운을 파악하여, 부족한 기운은 음식·색상·주변 환경을 통해 보완하고 넘치는 기운은 능동적으로 발산하는 것이 조화의 비결입니다.</span>
                  </div>
                </div>
              )}

              {/* 3, 4, 5. 심층 리포트 (통합 조화 총평 / 사주 만세력 / 자미두수 명반) */}
              {(analysisTab === "mix" || analysisTab === "saju" || analysisTab === "ziwei") && (
                <div className="space-y-4 animate-fade-in">
                  {couponMsg && (
                    <div className="bg-amber-50 text-amber-900 border border-amber-300 p-2.5 rounded-xl text-xs font-bold text-center animate-fade-in">
                      {couponMsg}
                    </div>
                  )}

                  {!isCouponUnlocked ? (
                    /* 잠금 상태 (쿠폰/열람권 등록 카드) */
                    <div className="relative border border-dashed border-[#C0392B]/40 bg-gradient-to-b from-[#FFFDF9] to-[#FAF7F2] rounded-2xl p-6 text-center space-y-4 overflow-hidden">
                      <div className="w-12 h-12 rounded-full bg-[#FDEDEC] text-[#C0392B] mx-auto flex items-center justify-center shadow-xs">
                        <Lock className="w-6 h-6" />
                      </div>

                      <div className="space-y-1.5 max-w-sm mx-auto">
                        <span className="inline-block text-[10px] font-extrabold tracking-wider text-[#C0392B] bg-[#FDEDEC] px-2.5 py-0.5 rounded-full uppercase">
                          PREMIUM INSIGHT
                        </span>
                        <h4 className="font-serif text-base font-black text-[#2C3E50]">
                          {analysisTab === "mix" && "사주 명리 & 자미두수 통합 조화 총평"}
                          {analysisTab === "saju" && "정통 4주 8자 만세력 & 평생 대운 심층 감정서"}
                          {analysisTab === "ziwei" && "동양 천문 자미두수 14정성 & 12궁 원명반"}
                        </h4>
                        <p className="text-xs text-[#4F443B] leading-relaxed">
                          {analysisTab === "mix" && "지상의 사주오행과 천상의 자미두수 성좌를 융합한 입체적 인생 설계도 및 개운 비책입니다."}
                          {analysisTab === "saju" && "천간·지지·지장간·10년 대운 주기 및 직업·재물·인연 숨은 비책이 포함된 원문 전체 감정서입니다."}
                          {analysisTab === "ziwei" && "천상 14대 주성과 은하수 길성/살성이 12개 인생 궁위에 배치된 정밀 천명도입니다."}
                        </p>
                      </div>

                      {/* 블러 미리보기 카드 */}
                      <div className="bg-white/80 p-4 rounded-xl text-left space-y-2 opacity-60 pointer-events-none select-none border border-[#E8E0D0]">
                        <div className="flex justify-between text-xs font-bold text-[#5C5046]">
                          <span>{analysisTab === "mix" ? "융합 총평 & 인생 로드맵" : analysisTab === "saju" ? "4주 8자 정밀 원국표" : "12궁 성좌 배치도"}</span>
                          <span>{analysisTab === "mix" ? "공명 지표" : analysisTab === "saju" ? "10년 대운 순환" : "삼방사정 분석"}</span>
                        </div>
                        <div className="h-4 bg-[#EFE9DF] rounded-md w-3/4" />
                        <div className="h-4 bg-[#EFE9DF] rounded-md w-1/2" />
                      </div>

                      {/* 쿠폰 적용 및 열람 버튼 */}
                      <div className="pt-2 space-y-3.5 max-w-sm mx-auto">
                        {((ticketAccount?.tickets?.pdf || 0) + (ticketAccount?.tickets?.all || 0)) > 0 ? (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={handleUnlockWithCoupon}
                              className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-[#C0392B] to-[#A93226] hover:from-[#A93226] hover:to-[#8E281D] text-white font-serif font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 animate-pulse"
                            >
                              <Ticket className="w-4 h-4 text-amber-300 animate-bounce" />
                              <span>🎫 보유 확인권 1장으로 즉시 전체 해금하기</span>
                            </button>
                            <p className="text-[10px] text-[#5C5046] font-bold text-center">
                              (현재 보유 중인 PDF/종합 감정서 열람권: <span className="text-[#C0392B] font-extrabold">{(ticketAccount?.tickets?.pdf || 0) + (ticketAccount?.tickets?.all || 0)}장</span>)
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2.5 text-left bg-white p-4 rounded-xl shadow-2xs border border-[#E8E0D0]">
                            <div className="text-[10.5px] text-[#5C4D41] leading-relaxed">
                              💡 <strong>사용 가능한 1회 확인권이 없습니다.</strong><br />
                              발급 받으신 무료 체험 쿠폰(예: <strong>PDF2026</strong> 등)을 아래에 등록하시면 즉시 평생 소장용 상세 만세력, 융합 총평, 자미두수 명반 전체가 해금됩니다!
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={inlineCouponInput}
                                onChange={(e) => setInlineCouponInput(e.target.value.toUpperCase())}
                                placeholder="쿠폰 번호를 입력하세요"
                                maxLength={20}
                                className="flex-1 px-3 py-2 text-xs border border-[#D6CCBC] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C0392B] bg-white text-[#2C3E50] font-mono font-bold uppercase text-center"
                              />
                              <button
                                type="button"
                                onClick={() => handleApplyInlineCoupon(inlineCouponInput)}
                                disabled={inlineCouponLoading}
                                className="px-4 py-2 bg-[#C0392B] hover:bg-[#A93226] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
                              >
                                {inlineCouponLoading ? "등록 중..." : "등록/사용"}
                              </button>
                            </div>
                            {inlineCouponError && (
                              <p className="text-[10px] text-[#C0392B] font-bold text-center mt-1">
                                ⚠️ {inlineCouponError}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* 해금 상태: SajuVisual의 해당 뷰를 단일 계층으로 직결 렌더링 */
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-xs font-bold text-emerald-900">
                        <div className="flex items-center gap-1.5">
                          <Unlock className="w-4 h-4 text-emerald-600" />
                          <span>심층 감정서가 평생 소장용으로 해금되었습니다.</span>
                        </div>
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-300">평생 보관</span>
                      </div>

                      <SajuVisual
                        saju={profile.saju}
                        isPremium={isCouponUnlocked}
                        selectedTab={analysisTab as "mix" | "saju" | "ziwei"}
                        hideTabNav={true}
                      />
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Google Ads */}
            <div className="pt-2">
              <GoogleAds slotId="9988776655" layout="banner" />
            </div>

          </div>
        )}

      </div>

      {/* Upgrade & Auth Modals */}
      <UpgradeToSocialModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        triggerReason="create_room"
        onSuccess={() => {
          window.location.hash = "#/create";
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          const currentMem = getUserMembershipInfo(auth.currentUser);
          if (currentMem.canCreateRoom) {
            window.location.hash = "#/create";
          }
        }}
      />

      {/* Personal Soul Photo Card Modal */}
      {profile && (
        <ViralCardModal
          isOpen={isViralModalOpen}
          onClose={() => setIsViralModalOpen(false)}
          member={profile as any}
          allMembers={[]}
          roomCode=""
          initialTab="identity"
        />
      )}
    </Layout>
  );
}
