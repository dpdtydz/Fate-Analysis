import React, { useRef, useState, useMemo, useEffect } from "react";
import { X, Share2, CheckCircle2, Crown, Users, Award, Sun } from "lucide-react";
import html2canvas from "html2canvas-pro";
import { Member } from "../types";
import { calculateTodayFortune } from "../utils/saju";
import { shareToKakaoOrClipboard } from "../utils/shareHelper";
import { logAnalyticsEvent } from "../lib/analytics";

interface ViralCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: Member | null;
  allMembers?: Member[];
  roomTitle?: string;
  roomCode?: string;
  initialTab?: "identity" | "fortune" | "group" | "role";
}

// 오행별 1인 소울 스펙
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

interface ElementSpec {
  hanja: string;
  en: string;
  colorName: string;
  serialPrefix: string;
  quote: string;
  tags: string[];
  stats: { label: string; val: number; color: string }[];
  desc: string;
  renderIcon: (strokeColor?: string) => React.ReactNode;
  compatibility: {
    best: CardMatchSpec[];
    caution: CardMatchSpec[];
  };
}

const ELEMENT_SPECS: Record<string, ElementSpec> = {
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
    renderIcon: (strokeColor = "#C0392B") => (
      <svg width="72" height="72" viewBox="0 0 48 48" fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[72px] h-[72px]">
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
    renderIcon: (strokeColor = "#C0392B") => (
      <svg width="72" height="72" viewBox="0 0 48 48" fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[72px] h-[72px]">
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
    renderIcon: (strokeColor = "#C0392B") => (
      <svg width="72" height="72" viewBox="0 0 48 48" fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[72px] h-[72px]">
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
    renderIcon: (strokeColor = "#C0392B") => (
      <svg width="72" height="72" viewBox="0 0 48 48" fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[72px] h-[72px]">
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
    renderIcon: (strokeColor = "#C0392B") => (
      <svg width="72" height="72" viewBox="0 0 48 48" fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[72px] h-[72px]">
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

const getElementCardColors = (element: string) => {
  switch (element) {
    case "목":
      return {
        text: "text-[#1E4D2B]",
        bg: "bg-[#E8F5E9]",
        border: "border-[#C8E6C9]",
        stroke: "#2E7D32",
        chipBg: "bg-[#E8F5E9]",
        chipBorder: "border-[#A5D6A7]/40",
        diamondColor: "text-[#2E7D32]",
      };
    case "화":
      return {
        text: "text-[#C0392B]",
        bg: "bg-[#FDEDEC]",
        border: "border-[#FADBD8]",
        stroke: "#C0392B",
        chipBg: "bg-[#FDEDEC]",
        chipBorder: "border-[#F5B7B1]/40",
        diamondColor: "text-[#C0392B]",
      };
    case "토":
      return {
        text: "text-[#7D6608]",
        bg: "bg-[#FEF9E7]",
        border: "border-[#FCF3CF]",
        stroke: "#B7950B",
        chipBg: "bg-[#FEF9E7]",
        chipBorder: "border-[#F9E79F]/40",
        diamondColor: "text-[#B7950B]",
      };
    case "금":
      return {
        text: "text-[#2C3E50]",
        bg: "bg-[#F2F4F4]",
        border: "border-[#EAEDED]",
        stroke: "#566573",
        chipBg: "bg-[#F2F4F4]",
        chipBorder: "border-[#BDC3C7]/40",
        diamondColor: "text-[#566573]",
      };
    case "수":
      return {
        text: "text-[#1B4F72]",
        bg: "bg-[#EBF5FB]",
        border: "border-[#D6EAF8]",
        stroke: "#2980B9",
        chipBg: "bg-[#EBF5FB]",
        chipBorder: "border-[#85C1E9]/40",
        diamondColor: "text-[#2980B9]",
      };
    default:
      return {
        text: "text-[#C0392B]",
        bg: "bg-[#FDEDEC]",
        border: "border-[#FADBD8]",
        stroke: "#C0392B",
        chipBg: "bg-[#FDEDEC]",
        chipBorder: "border-[#F5B7B1]/40",
        diamondColor: "text-[#C0392B]",
      };
  }
};

export default function ViralCardModal({
  isOpen,
  onClose,
  member,
  allMembers = [],
  roomTitle = "우리들의 인연 모임",
  roomCode = "",
  initialTab = "identity"
}: ViralCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isGroupMode = Boolean(roomCode && allMembers && allMembers.length > 1);

  // Default tab based on context
  const defaultTab = useMemo(() => {
    if (!isGroupMode) {
      return initialTab === "group" || initialTab === "role" ? "identity" : initialTab;
    }
    return initialTab;
  }, [isGroupMode, initialTab]);

  const [activeTab, setActiveTab] = useState<"identity" | "fortune" | "group" | "role">(defaultTab);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState("");
  const [capturedImgUrl, setCapturedImgUrl] = useState<string | null>(null);
  const [showLongPressGuide, setShowLongPressGuide] = useState(false);

  // Synchronize activeTab when defaultTab changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  const mAny = (member || {}) as any;
  const nickname = mAny.nickname || "나";
  const mbti = mAny.mbti && mAny.mbti !== "미입력" ? String(mAny.mbti).toUpperCase() : "";

  const rawGan = mAny.saju?.daymaster?.gan || "갑";
  const gan = rawGan.length > 1 ? rawGan[0] : rawGan;
  const rawJi = mAny.saju?.pillars?.day?.ji || "자";
  const ji = rawJi.length > 1 ? rawJi[0] : rawJi;
  const elem = mAny.saju?.daymaster?.element || "금";

  const spec = ELEMENT_SPECS[elem] || ELEMENT_SPECS["금"];
  const todayFortune = calculateTodayFortune(gan, elem);
  const colors = useMemo(() => getElementCardColors(elem), [elem]);

  // 1. 내 소울 카드 시리얼
  const cardSerial = useMemo(() => {
    const ganCode = gan.charCodeAt(0) % 10;
    const jiCode = ji.charCodeAt(0) % 12;
    const num = String(ganCode * 6 + jiCode + 1).padStart(3, "0");
    return `${spec.serialPrefix}-${num} · ${gan}${ji}`;
  }, [gan, ji, spec.serialPrefix]);

  // 2. 모임 케미 분석 데이터
  const groupStats = useMemo(() => {
    if (!isGroupMode) return null;
    const counts: Record<string, number> = { "목": 0, "화": 0, "토": 0, "금": 0, "수": 0 };
    allMembers.forEach((m: any) => {
      const e = m.saju?.daymaster?.element || "목";
      if (counts[e] !== undefined) counts[e] += 1;
    });

    const uniqueElements = Object.values(counts).filter(c => c > 0).length;
    const baseScore = 78 + (uniqueElements * 3) + Math.min(8, allMembers.length * 2);
    const score = Math.min(99, Math.max(82, baseScore));

    return {
      score,
      uniqueElements,
      counts,
      memberCount: allMembers.length
    };
  }, [allMembers, isGroupMode]);

  // 3. 모임 속 시그니처 역할 분석 데이터
  const roleAnalysis = useMemo(() => {
    if (!isGroupMode) return null;

    if (elem === "화" || (mbti.includes("E") && mbti.includes("P"))) {
      return {
        role: "스파크 메이커",
        hanja: "和氣 (화기)",
        tagline: '"모임의 분위기를 띄우며 어색함을 단숨에 녹여요"',
        tags: ["분위기 메이커", "도파민 충전", "유쾌한 에너지", "대화 촉발"],
        stats: [
          { label: "텐션 촉발", val: 92, color: "#F0632E" },
          { label: "순발력", val: 86, color: "#35B37E" },
          { label: "도파민", val: 94, color: "#C0392B" },
          { label: "약속 추진", val: 78, color: "#7C86A0" }
        ],
        desc: `${roomTitle}의 공기를 유쾌하게 이끄는 분위기 기둥이에요. 사람들의 기분을 빠르게 감지해 자연스럽게 웃음을 만들어냅니다.`
      };
    }
    if (elem === "토" || (mbti.includes("F") && mbti.includes("J"))) {
      return {
        role: "멘탈 케어 힐러",
        hanja: "德厚 (덕후)",
        tagline: '"누구 하나 소외되지 않도록 묵묵히 챙겨주는 안식처"',
        tags: ["깊은 공감", "멘탈 수호", "갈등 중재", "편안한 대화"],
        stats: [
          { label: "경청·공감", val: 95, color: "#E0A82E" },
          { label: "멘탈 수호", val: 90, color: "#35B37E" },
          { label: "갈등 중재", val: 85, color: "#3B5BFF" },
          { label: "신뢰감", val: 92, color: "#C0392B" }
        ],
        desc: `${roomTitle}에서 모두가 마음 놓고 기댈 수 있는 따뜻한 쉼터예요. 세심한 배려로 모임의 지속력을 단단하게 지탱합니다.`
      };
    }
    if (elem === "금" || (mbti.includes("T") && mbti.includes("J"))) {
      return {
        role: "실속 총무 & 밸런서",
        hanja: "信實 (신실)",
        tagline: '"일정과 정산을 똑 부러지게 챙기며 빈틈을 막아요"',
        tags: ["정산의 달인", "현실주의 기둥", "리스크 방어", "명쾌한 정리"],
        stats: [
          { label: "정산·실속", val: 96, color: "#7C86A0" },
          { label: "실행력", val: 88, color: "#C0392B" },
          { label: "리스크 방어", val: 91, color: "#E0A82E" },
          { label: "팩트 체크", val: 85, color: "#3B5BFF" }
        ],
        desc: `${roomTitle}의 현실적인 기반을 지켜주는 든든한 조율자예요. 흐트러지기 쉬운 일정과 회비를 빈틈없이 정리해 모임의 신뢰를 만듭니다.`
      };
    }
    if (elem === "목" || (mbti.includes("E") && mbti.includes("J"))) {
      return {
        role: "카리스마 캡틴",
        hanja: "統率 (통솔)",
        tagline: '"목표가 생기면 거침없이 전진하며 모두를 이끌어요"',
        tags: ["추진 대장", "행동력", "결단력", "모임의 리더"],
        stats: [
          { label: "추진력", val: 94, color: "#35B37E" },
          { label: "결단력", val: 89, color: "#C0392B" },
          { label: "리더십", val: 91, color: "#E0A82E" },
          { label: "의리 지수", val: 87, color: "#7C86A0" }
        ],
        desc: `${roomTitle}의 다음 단계를 열어가는 추진력의 원천이에요. 망설임 없는 행동으로 약속을 성사시키고 결속력을 끌어올립니다.`
      };
    }
    return {
      role: "히든 책사 & 전략가",
      hanja: "睿智 (예지)",
      tagline: '"조용히 판을 보다가 결정적인 꿀팁과 혜안을 전해요"',
      tags: ["정보 탐색", "통찰력", "숨은 브레인", "위기 탈출"],
      stats: [
        { label: "정보 탐색", val: 94, color: "#3B5BFF" },
        { label: "통찰력", val: 91, color: "#35B37E" },
        { label: "전략 기획", val: 87, color: "#7C86A0" },
        { label: "위기 대처", val: 84, color: "#C0392B" }
      ],
      desc: `${roomTitle}의 숨은 조언자이자 길잡이예요. 과묵하게 듣다가도 핵심을 짚어내어 최선의 선택지를 제시합니다.`
    };
  }, [elem, mbti, roomTitle, isGroupMode]);

  if (!isOpen) return null;

  const handleCaptureAndShare = async () => {
    if (!cardRef.current || isGenerating) return;

    setIsGenerating(true);
    logAnalyticsEvent({
      eventName: "share_soul_card_clean",
      category: "engagement",
      metadata: { nickname, roomCode, activeTab }
    });

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#FFFFFF",
        logging: false,
        onclone: (clonedDoc, clonedElement) => {
          // 1. Copy all dynamic style tags from original head to cloned head
          try {
            const originalStyles = document.querySelectorAll("style");
            originalStyles.forEach((styleTag) => {
              clonedDoc.head.appendChild(styleTag.cloneNode(true));
            });
          } catch (e) {
            console.warn("Failed to clone style tags:", e);
          }

          // 2. Explicitly serialize rules from linked stylesheets safely (try-catch wrapped per stylesheet)
          let compiledCss = "";
          try {
            for (let i = 0; i < document.styleSheets.length; i++) {
              try {
                const sheet = document.styleSheets[i];
                const rules = sheet.cssRules || sheet.rules;
                if (rules) {
                  for (let j = 0; j < rules.length; j++) {
                    compiledCss += rules[j].cssText + "\n";
                  }
                }
              } catch (sheetErr) {
                // Ignore SecurityError for cross-origin link tags
              }
            }
          } catch (e) {
            console.warn("Failed to extract stylesheet rules:", e);
          }

          if (compiledCss) {
            try {
              const styleTag = clonedDoc.createElement("style");
              styleTag.innerHTML = compiledCss;
              clonedDoc.head.appendChild(styleTag);

              // Also append inside the cloned element directly to be absolutely sure html2canvas parses it
              const innerStyleTag = clonedDoc.createElement("style");
              innerStyleTag.innerHTML = compiledCss;
              clonedElement.appendChild(innerStyleTag);
            } catch (e) {
              console.warn("Failed to inject serialized style blocks:", e);
            }
          }

          // 3. Disable all animations and transitions on cloned elements so they render at 100% final state immediately
          try {
            const disableAnimStyle = clonedDoc.createElement("style");
            disableAnimStyle.innerHTML = `
              *, *::before, *::after {
                transition: none !important;
                transition-duration: 0s !important;
                animation: none !important;
                animation-duration: 0s !important;
              }
            `;
            clonedDoc.head.appendChild(disableAnimStyle);
            clonedElement.appendChild(disableAnimStyle.cloneNode(true));
          } catch (e) {
            console.warn("Failed to inject animation disabling styles:", e);
          }
        }
      });

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.98));
      if (!blob) throw new Error("Canvas export failed");

      const tabName = activeTab === "identity" ? "내소울" : activeTab === "group" ? "모임케미" : activeTab === "role" ? "역할" : "오늘운세";
      const filename = `소울카드_${nickname}_${tabName}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      const dataUrl = canvas.toDataURL("image/png");
      setCapturedImgUrl(dataUrl);

      const isInstagramOrKakao = /instagram|kakaotalk/i.test(navigator.userAgent);

      if (
        !isInstagramOrKakao &&
        navigator.canShare &&
        navigator.canShare({ files: [file] }) &&
        /mobile|android|iphone|ipad/i.test(navigator.userAgent)
      ) {
        try {
          await navigator.share({
            files: [file],
            title: `[소울 카드] ${nickname}님의 ${tabName}`,
            text: `인연사주 소울 카드를 확인해보세요.\n${window.location.href}`
          });
          setCopiedMsg("포토 카드가 성공적으로 공유되었습니다.");
          setTimeout(() => setCopiedMsg(""), 3500);
        } catch (shareErr) {
          console.log("Web Share files failed, fallback to long-press guide");
          setShowLongPressGuide(true);
        }
      } else {
        // Fallback: Trigger download on desktop AND show beautiful long-press guide on mobile
        if (!/mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
          // Desktop: download file
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          await shareToKakaoOrClipboard({
            title: `[소울 카드] ${nickname}님의 ${tabName}`,
            description: "사주 오행 본질로 분석한 소울 카드",
            url: window.location.href
          });
          setCopiedMsg("포토 카드가 다운로드되었으며 링크가 복사되었습니다!");
          setTimeout(() => setCopiedMsg(""), 3500);
        } else {
          // Mobile: show the interactive long press guide!
          setShowLongPressGuide(true);

          await shareToKakaoOrClipboard({
            title: `[소울 카드] ${nickname}님의 ${tabName}`,
            description: "사주 오행 본질로 분석한 소울 카드",
            url: window.location.href
          });
          setCopiedMsg("클립보드에 결과 텍스트가 복사되었습니다!");
          setTimeout(() => setCopiedMsg(""), 3500);
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Capture failed:", err);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] overflow-y-auto bg-[#FAF7F2]"
    >
      <div className="min-h-full w-full px-4 py-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-[360px] sm:max-w-[380px] flex flex-col items-center">
          {/* 상단 헤더 바 */}
          <div className="w-full flex items-center justify-between mb-3.5 px-1">
            <span className="text-xs font-bold text-[#C0392B] font-serif tracking-wider flex items-center gap-1.5 select-none">
              <span>✨</span>
              <span>인연사주 소울 포토카드</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white text-[#5C5046] hover:text-[#2C3E50] shadow-sm flex items-center justify-center transition cursor-pointer border border-[#E8E0D0] active:scale-90"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        {/* 탭 네비게이션 (선택 시 각 카드 타입으로 즉시 전환) */}
        <div className="w-full mb-3.5 bg-white/90 p-1 rounded-full border border-[#E8E0D0] flex items-center gap-1 shadow-3xs">
          <button
            type="button"
            onClick={() => setActiveTab("identity")}
            className={`flex-1 py-1.5 px-2 rounded-full text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === "identity"
                ? "bg-[#C0392B] text-white shadow-xs font-bold"
                : "text-[#5A4D41] hover:text-[#2C3E50]"
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>내 소울</span>
          </button>

          {!isGroupMode ? (
            <button
              type="button"
              onClick={() => setActiveTab("fortune")}
              className={`flex-1 py-1.5 px-2 rounded-full text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === "fortune"
                  ? "bg-[#C0392B] text-white shadow-xs font-bold"
                  : "text-[#5A4D41] hover:text-[#2C3E50]"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>오늘 운세</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("group")}
                className={`flex-1 py-1.5 px-2 rounded-full text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === "group"
                    ? "bg-[#C0392B] text-white shadow-xs font-bold"
                    : "text-[#5A4D41] hover:text-[#2C3E50]"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>모임 케미</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("role")}
                className={`flex-1 py-1.5 px-2 rounded-full text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === "role"
                    ? "bg-[#C0392B] text-white shadow-xs font-bold"
                    : "text-[#5A4D41] hover:text-[#2C3E50]"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>시그니처 역할</span>
              </button>
            </>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            규격 카드: 380px, #FFFFFF, radius 28px, Pretendard
            서비스 고유 키컬러: 옻칠 버건디 #C0392B + 버건디 소프트 #FDEDEC + 잉크 #2C3E50
           ───────────────────────────────────────────────────────────── */}
        <div
          ref={cardRef}
          className="w-full bg-[#FFFFFF] rounded-[28px] p-7 sm:px-7 sm:py-8 shadow-[0_20px_50px_-20px_rgba(192,57,43,0.15)] select-none text-left border border-[#EFE9DF]"
          style={{ fontFamily: '"Pretendard", system-ui, sans-serif' }}
        >
          {/* ================= 1. TAB: 내 소울 카드 ================= */}
          {activeTab === "identity" && (
            <>
              {/* 상단: 시리얼 & 오행 배지 */}
              <div className="flex items-center justify-between mb-6 gap-2">
                <span className="text-[11px] font-mono tracking-[0.14em] text-[#5C5046] flex items-center gap-1 whitespace-nowrap">
                  <span className={`${colors.diamondColor} text-[10px]`}>✦</span>
                  <span>{cardSerial}</span>
                </span>
                <span className={`text-[11px] font-bold tracking-[0.08em] whitespace-nowrap px-2.5 py-1 rounded-full border flex items-center gap-1 ${colors.text} ${colors.chipBg} ${colors.chipBorder}`}>
                  <span className="text-[8px]">✦</span>
                  <span>{spec.hanja} {spec.en}</span>
                </span>
              </div>

              {/* 엠블럼: 지름 128px 원, 커스텀 오행 컬러 적용 */}
              <div className={`w-[128px] h-[128px] mx-auto mb-5 rounded-full flex items-center justify-center border transition-all duration-300 ${colors.bg} ${colors.border}`}>
                {spec.renderIcon(colors.stroke)}
              </div>

              {/* 이름: 27px/800 */}
              <h1 className="text-center text-[27px] font-[800] tracking-[-0.02em] leading-[1.25] text-[#2C3E50] mb-3">
                {nickname}님은 <span className={colors.text}>{spec.colorName}</span>
              </h1>

              {/* 한 줄 정의: 14.5px/500 */}
              <p className="text-center text-[14.5px] font-[500] leading-[1.55] text-[#5A4D41] max-w-[300px] mx-auto mb-6">
                {spec.quote}
              </p>

              {/* 키워드 태그 */}
              <div className="flex flex-wrap gap-2 justify-center mb-7">
                {spec.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className={`text-[12.5px] font-[600] whitespace-nowrap px-3.5 py-1.5 rounded-full border ${colors.text} ${colors.chipBg} ${colors.chipBorder}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 오행 스탯 4줄 */}
              <div className="space-y-3 mb-6">
                {spec.stats.map((st, idx) => (
                  <div key={idx} className="flex items-center gap-3 w-full">
                    <span className="text-[13px] font-[700] text-[#2C3E50] w-[52px] shrink-0 text-left">
                      {st.label}
                    </span>
                    <div className="h-[8px] bg-[#F5EFE6] rounded-full overflow-hidden flex-1">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${st.val}%`, backgroundColor: st.color }}
                      />
                    </div>
                    <span className="text-[13px] font-[700] font-mono text-right text-[#5C5046] w-[36px] shrink-0">
                      {st.val}
                    </span>
                  </div>
                ))}
              </div>

              {/* 설명 문단 */}
              <div className="pt-5 border-t border-[#EFE9DF]">
                <p className="text-[14px] leading-[1.7] text-[#5A4D41] text-left">
                  {spec.desc}
                </p>
              </div>

              {/* 소울 인연 카드 요약 (포토 카드용) */}
              {spec.compatibility && (
                <div className="mt-4 pt-4 border-t border-[#EFE9DF] space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#2C3E50] tracking-wide">
                      ✦ 소울카드 인연 매칭
                    </span>
                    <span className="text-[9.5px] font-bold text-[#C0392B] bg-[#FDEDEC] px-2 py-0.5 rounded-full">
                      오행 케미
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* 찰떡 */}
                    <div className="bg-[#F4F9F5] border border-[#D1E7D8] rounded-xl p-2.5">
                      <div className="flex items-center gap-1 text-[10.5px] font-bold text-emerald-800 mb-1">
                        <span>💖 찰떡 카드</span>
                      </div>
                      <div className="space-y-0.5">
                        {spec.compatibility.best.map((b, bi) => (
                          <div key={bi} className="text-[10px] text-[#245330] font-medium truncate flex items-center justify-between">
                            <span>{b.emoji} {b.cardName}</span>
                            <span className="font-mono font-bold text-emerald-700">{b.score}점</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* 주의 */}
                    <div className="bg-[#FDF6F5] border border-[#F5D5D0] rounded-xl p-2.5">
                      <div className="flex items-center gap-1 text-[10.5px] font-bold text-rose-800 mb-1">
                        <span>⚠️ 주의 카드</span>
                      </div>
                      <div className="space-y-0.5">
                        {spec.compatibility.caution.map((c, ci) => (
                          <div key={ci} className="text-[10px] text-[#5C231C] font-medium truncate flex items-center justify-between">
                            <span>{c.emoji} {c.cardName}</span>
                            <span className="font-mono font-bold text-rose-700">{c.score}점</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================= 2. TAB: 모임 케미 카드 ================= */}
          {activeTab === "group" && groupStats && (
            <>
              {/* 상단: 모임 정보 & 상생 배지 */}
              <div className="flex items-center justify-between mb-6 gap-2">
                <span className="text-[11px] font-mono tracking-[0.14em] text-[#5C5046] flex items-center gap-1 whitespace-nowrap">
                  <span className={`${colors.diamondColor} text-[10px]`}>✦</span>
                  <span>GROUP · {groupStats.memberCount}인 결속</span>
                </span>
                <span className={`text-[11px] font-bold tracking-[0.08em] whitespace-nowrap px-2.5 py-1 rounded-full border flex items-center gap-1 ${colors.text} ${colors.chipBg} ${colors.chipBorder}`}>
                  <span className="text-[8px]">✦</span>
                  <span>相生 SYNERGY</span>
                </span>
              </div>

              {/* 엠블럼: 상생 기하 라인 SVG */}
              <div className={`w-[128px] h-[128px] mx-auto mb-5 rounded-full flex items-center justify-center border transition-all duration-300 ${colors.bg} ${colors.border}`}>
                <svg width="72" height="72" viewBox="0 0 48 48" fill="none" stroke={colors.stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[72px] h-[72px]">
                  <circle cx="24" cy="24" r="16" />
                  <circle cx="24" cy="14" r="6" />
                  <circle cx="15" cy="29" r="6" />
                  <circle cx="33" cy="29" r="6" />
                  <line x1="24" y1="14" x2="15" y2="29" opacity="0.4" />
                  <line x1="24" y1="14" x2="33" y2="29" opacity="0.4" />
                  <line x1="15" y1="29" x2="33" y2="29" opacity="0.4" />
                </svg>
              </div>

              {/* 이름/헤드라인 */}
              <h1 className="text-center text-[27px] font-[800] tracking-[-0.02em] leading-[1.25] text-[#2C3E50] mb-3">
                모임 케미는 <span className={colors.text}>{groupStats.score}점</span>
              </h1>

              {/* 한 줄 정의 */}
              <p className="text-center text-[14.5px] font-[500] leading-[1.55] text-[#5A4D41] max-w-[300px] mx-auto mb-6">
                "{groupStats.uniqueElements}대 오행이 서로를 생(生)하며 완벽한 균형을 이뤄요"
              </p>

              {/* 키워드 태그 */}
              <div className="flex flex-wrap gap-2 justify-center mb-7">
                <span className={`text-[12.5px] font-[600] whitespace-nowrap px-3.5 py-1.5 rounded-full border ${colors.text} ${colors.chipBg} ${colors.chipBorder}`}>
                  오행 상생 순환
                </span>
                <span className={`text-[12.5px] font-[600] whitespace-nowrap px-3.5 py-1.5 rounded-full border ${colors.text} ${colors.chipBg} ${colors.chipBorder}`}>
                  {groupStats.memberCount}인 결속
                </span>
                <span className={`text-[12.5px] font-[600] whitespace-nowrap px-3.5 py-1.5 rounded-full border ${colors.text} ${colors.chipBg} ${colors.chipBorder}`}>
                  시너지 증폭
                </span>
              </div>

              {/* 4줄 스탯 바 */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 w-full">
                  <span className="text-[13px] font-[700] text-[#2C3E50] w-[52px] shrink-0 text-left">다양성</span>
                  <div className="h-[8px] bg-[#F5EFE6] rounded-full overflow-hidden flex-1">
                    <div className="h-full rounded-full bg-[#35B37E]" style={{ width: `${Math.min(98, groupStats.uniqueElements * 22)}%` }} />
                  </div>
                  <span className="text-[13px] font-[700] font-mono text-right text-[#5C5046] w-[36px] shrink-0">
                    {Math.min(98, groupStats.uniqueElements * 22)}
                  </span>
                </div>
                <div className="flex items-center gap-3 w-full">
                  <span className="text-[13px] font-[700] text-[#2C3E50] w-[52px] shrink-0 text-left">순환력</span>
                  <div className="h-[8px] bg-[#F5EFE6] rounded-full overflow-hidden flex-1">
                    <div className="h-full rounded-full bg-[#C0392B]" style={{ width: `${groupStats.score}%` }} />
                  </div>
                  <span className="text-[13px] font-[700] font-mono text-right text-[#5C5046] w-[36px] shrink-0">{groupStats.score}</span>
                </div>
                <div className="flex items-center gap-3 w-full">
                  <span className="text-[13px] font-[700] text-[#2C3E50] w-[52px] shrink-0 text-left">안정감</span>
                  <div className="h-[8px] bg-[#F5EFE6] rounded-full overflow-hidden flex-1">
                    <div className="h-full rounded-full bg-[#E0A82E]" style={{ width: "88%" }} />
                  </div>
                  <span className="text-[13px] font-[700] font-mono text-right text-[#5C5046] w-[36px] shrink-0">88</span>
                </div>
                <div className="flex items-center gap-3 w-full">
                  <span className="text-[13px] font-[700] text-[#2C3E50] w-[52px] shrink-0 text-left">소통력</span>
                  <div className="h-[8px] bg-[#F5EFE6] rounded-full overflow-hidden flex-1">
                    <div className="h-full rounded-full bg-[#3B5BFF]" style={{ width: "92%" }} />
                  </div>
                  <span className="text-[13px] font-[700] font-mono text-right text-[#5C5046] w-[36px] shrink-0">92</span>
                </div>
              </div>

              {/* 설명 문단 */}
              <div className="pt-5 border-t border-[#EFE9DF]">
                <p className="text-[14px] leading-[1.7] text-[#5A4D41] text-left">
                  {roomTitle} 멤버들의 기운이 고르게 섞여 서로의 부족한 오행을 채워주는 최상의 조합이에요. 한 사람이 지치면 다른 사람이 든든하게 받쳐주어 모임의 결속이 오래 유지됩니다.
                </p>
              </div>
            </>
          )}

          {/* ================= 3. TAB: 시그니처 역할 카드 ================= */}
          {activeTab === "role" && roleAnalysis && (
            <>
              {/* 상단: 포지션 & 한자 칭호 배지 */}
              <div className="flex items-center justify-between mb-6 gap-2">
                <span className="text-[11px] font-mono tracking-[0.14em] text-[#5C5046] flex items-center gap-1 whitespace-nowrap">
                  <span className={`${colors.diamondColor} text-[10px]`}>✦</span>
                  <span>POSITION · {spec.hanja}氣</span>
                </span>
                <span className={`text-[11px] font-bold tracking-[0.08em] whitespace-nowrap px-2.5 py-1 rounded-full border flex items-center gap-1 ${colors.text} ${colors.chipBg} ${colors.chipBorder}`}>
                  <span className="text-[8px]">✦</span>
                  <span>{roleAnalysis.hanja} 칭호</span>
                </span>
              </div>

              {/* 엠블럼: 역할 플랫 라인 SVG */}
              <div className={`w-[128px] h-[128px] mx-auto mb-5 rounded-full flex items-center justify-center border transition-all duration-300 ${colors.bg} ${colors.border}`}>
                <svg width="72" height="72" viewBox="0 0 48 48" fill="none" stroke={colors.stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[72px] h-[72px]">
                  <path d="M8 36 L12 16 L20 26 L24 12 L28 26 L36 16 L40 36 Z" />
                  <line x1="8" y1="36" x2="40" y2="36" />
                  <circle cx="24" cy="12" r="1.5" />
                  <circle cx="12" cy="16" r="1.5" />
                  <circle cx="36" cy="16" r="1.5" />
                </svg>
              </div>

              {/* 이름/헤드라인 */}
              <h1 className="text-center text-[27px] font-[800] tracking-[-0.02em] leading-[1.25] text-[#2C3E50] mb-3">
                {nickname}님은 <span className={colors.text}>{roleAnalysis.role}</span>
              </h1>

              {/* 한 줄 정의 */}
              <p className="text-center text-[14.5px] font-[500] leading-[1.55] text-[#5A4D41] max-w-[300px] mx-auto mb-6">
                {roleAnalysis.tagline}
              </p>

              {/* 키워드 태그 */}
              <div className="flex flex-wrap gap-2 justify-center mb-7">
                {roleAnalysis.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className={`text-[12.5px] font-[600] whitespace-nowrap px-3.5 py-1.5 rounded-full border ${colors.text} ${colors.chipBg} ${colors.chipBorder}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 4줄 스탯 바 */}
              <div className="space-y-3 mb-6">
                {roleAnalysis.stats.map((st, idx) => (
                  <div key={idx} className="flex items-center gap-3 w-full">
                    <span className="text-[13px] font-[700] text-[#2C3E50] w-[52px] shrink-0 text-left">
                      {st.label}
                    </span>
                    <div className="h-[8px] bg-[#F5EFE6] rounded-full overflow-hidden flex-1">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${st.val}%`, backgroundColor: st.color }}
                      />
                    </div>
                    <span className="text-[13px] font-[700] font-mono text-right text-[#5C5046] w-[36px] shrink-0">
                      {st.val}
                    </span>
                  </div>
                ))}
              </div>

              {/* 설명 문단 */}
              <div className="pt-5 border-t border-[#EFE9DF]">
                <p className="text-[14px] leading-[1.7] text-[#5A4D41] text-left">
                  {roleAnalysis.desc}
                </p>
              </div>
            </>
          )}

          {/* ================= 4. TAB: 오늘 운세 카드 ================= */}
          {activeTab === "fortune" && (
            <>
              {/* 상단: 오늘 일진 & 운세 배지 */}
              <div className="flex items-center justify-between mb-6 gap-2">
                <span className="text-[11px] font-mono tracking-[0.14em] text-[#5C5046] flex items-center gap-1 whitespace-nowrap">
                  <span className={`${colors.diamondColor} text-[10px]`}>✦</span>
                  <span>TODAY · {spec.hanja}氣</span>
                </span>
                <span className={`text-[11px] font-bold tracking-[0.08em] whitespace-nowrap px-2.5 py-1 rounded-full border flex items-center gap-1 ${colors.text} ${colors.chipBg} ${colors.chipBorder}`}>
                  <span className="text-[8px]">✦</span>
                  <span>日辰 FORTUNE</span>
                </span>
              </div>

              {/* 엠블럼: 태양/나침반 플랫 라인 SVG */}
              <div className={`w-[128px] h-[128px] mx-auto mb-5 rounded-full flex items-center justify-center border transition-all duration-300 ${colors.bg} ${colors.border}`}>
                <svg width="72" height="72" viewBox="0 0 48 48" fill="none" stroke={colors.stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[72px] h-[72px]">
                  <circle cx="24" cy="24" r="10" />
                  <line x1="24" y1="4" x2="24" y2="10" />
                  <line x1="24" y1="38" x2="24" y2="44" />
                  <line x1="4" y1="24" x2="10" y2="24" />
                  <line x1="38" y1="24" x2="44" y2="24" />
                  <line x1="9.8" y1="9.8" x2="14" y2="14" />
                  <line x1="34" y1="34" x2="38.2" y2="38.2" />
                  <line x1="9.8" y1="38.2" x2="14" y2="34" />
                  <line x1="34" y1="14" x2="38.2" y2="9.8" />
                </svg>
              </div>

              {/* 이름/헤드라인 */}
              <h1 className="text-center text-[27px] font-[800] tracking-[-0.02em] leading-[1.25] text-[#2C3E50] mb-3">
                오늘의 일진은 <span className={colors.text}>{todayFortune.score}점</span>
              </h1>

              {/* 한 줄 정의 */}
              <p className="text-center text-[14.5px] font-[500] leading-[1.55] text-[#5A4D41] max-w-[300px] mx-auto mb-6">
                "{todayFortune.title}"
              </p>

              {/* 키워드 태그 */}
              <div className="flex flex-wrap gap-2 justify-center mb-7">
                <span className={`text-[12.5px] font-[600] whitespace-nowrap px-3.5 py-1.5 rounded-full border ${colors.text} ${colors.chipBg} ${colors.chipBorder}`}>
                  행운 컬러: {todayFortune.luckColor.split("·")[0]}
                </span>
                <span className={`text-[12.5px] font-[600] whitespace-nowrap px-3.5 py-1.5 rounded-full border ${colors.text} ${colors.chipBg} ${colors.chipBorder}`}>
                  행운 방위: {todayFortune.luckDirection}
                </span>
                <span className={`text-[12.5px] font-[600] whitespace-nowrap px-3.5 py-1.5 rounded-full border ${colors.text} ${colors.chipBg} ${colors.chipBorder}`}>
                  {todayFortune.level.split(" ")[0]}
                </span>
              </div>

              {/* 4줄 스탯 바 */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 w-full">
                  <span className="text-[13px] font-[700] text-[#2C3E50] w-[52px] shrink-0 text-left">운세 흐름</span>
                  <div className="h-[8px] bg-[#F5EFE6] rounded-full overflow-hidden flex-1">
                    <div className="h-full rounded-full bg-[#C0392B]" style={{ width: `${todayFortune.score}%` }} />
                  </div>
                  <span className="text-[13px] font-[700] font-mono text-right text-[#5C5046] w-[36px] shrink-0">{todayFortune.score}</span>
                </div>
                <div className="flex items-center gap-3 w-full">
                  <span className="text-[13px] font-[700] text-[#2C3E50] w-[52px] shrink-0 text-left">집중력</span>
                  <div className="h-[8px] bg-[#F5EFE6] rounded-full overflow-hidden flex-1">
                    <div className="h-full rounded-full bg-[#35B37E]" style={{ width: "82%" }} />
                  </div>
                  <span className="text-[13px] font-[700] font-mono text-right text-[#5C5046] w-[36px] shrink-0">82</span>
                </div>
                <div className="flex items-center gap-3 w-full">
                  <span className="text-[13px] font-[700] text-[#2C3E50] w-[52px] shrink-0 text-left">대인운</span>
                  <div className="h-[8px] bg-[#F5EFE6] rounded-full overflow-hidden flex-1">
                    <div className="h-full rounded-full bg-[#E0A82E]" style={{ width: "86%" }} />
                  </div>
                  <span className="text-[13px] font-[700] font-mono text-right text-[#5C5046] w-[36px] shrink-0">86</span>
                </div>
                <div className="flex items-center gap-3 w-full">
                  <span className="text-[13px] font-[700] text-[#2C3E50] w-[52px] shrink-0 text-left">결단력</span>
                  <div className="h-[8px] bg-[#F5EFE6] rounded-full overflow-hidden flex-1">
                    <div className="h-full rounded-full bg-[#7C86A0]" style={{ width: "78%" }} />
                  </div>
                  <span className="text-[13px] font-[700] font-mono text-right text-[#5C5046] w-[36px] shrink-0">78</span>
                </div>
              </div>

              {/* 설명 문단 */}
              <div className="pt-5 border-t border-[#EFE9DF]">
                <p className="text-[14px] leading-[1.7] text-[#5A4D41] text-left">
                  {todayFortune.advice}
                </p>
              </div>
            </>
          )}
        </div>

        {/* 토스트 메시지 */}
        {copiedMsg && (
          <div className="mt-3 px-4 py-2 bg-[#2C3E50] text-white text-xs font-medium rounded-full flex items-center gap-1.5 shadow-lg animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#35B37E]" />
            <span>{copiedMsg}</span>
          </div>
        )}

        {/* 하단 저장 & 공유 버튼 */}
        <div className="w-full mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleCaptureAndShare}
            disabled={isGenerating}
            className="w-full py-3.5 px-4 rounded-full bg-[#C0392B] hover:bg-[#A93226] text-white text-[15px] font-[700] transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-md"
          >
            {isGenerating ? (
              <span>저장 중...</span>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>카드 이미지 저장 & 공유</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-slate-50 text-[#5C5046] text-xs font-semibold transition border border-[#E8E0D0] flex items-center justify-center gap-1 cursor-pointer active:scale-[0.99]"
          >
            <span>돌아가기</span>
          </button>
        </div>
      </div>
    </div>

      {/* Kakaotalk/In-App Browser Long Press Image Sharing Overlay */}
      {showLongPressGuide && capturedImgUrl && (
        <div className="fixed inset-0 z-[1100] bg-[#1E293B]/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-[360px] w-full text-center shadow-2xl border border-[#EFE9DF] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#C0392B] flex items-center gap-1.5">
                💬 카톡 이미지 공유 도우미
              </h3>
              <button
                type="button"
                onClick={() => setShowLongPressGuide(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
              >
                닫기
              </button>
            </div>
            
            <p className="text-xs text-[#5C5046] leading-relaxed">
              카카오톡 및 인앱 브라우저 보안 제약으로 이미지를 직접 다운로드할 수 없습니다. 
              <strong> 아래 이미지를 길게 누르시면 (롱탭)</strong> 바로 <strong>[사진 앱에 저장]</strong> 또는 <strong>[카카오톡 친구에게 전달]</strong> 하실 수 있습니다!
              <span className="block mt-1 text-[10px] text-[#C0392B] font-medium bg-[#FDEDEC] py-1 px-2 rounded-lg">
                💡 iPhone/iPad 사용자: 2초간 꾹 눌러 나타나는 메뉴에서 <strong>[사진 앱에 저장]</strong>을 터치해 주세요.
              </span>
            </p>

            <div className="bg-[#FAF8F5] p-2 rounded-2xl border border-[#EFE9DF] flex items-center justify-center">
              <img
                src={capturedImgUrl}
                alt="Captured Soul Card"
                referrerPolicy="no-referrer"
                className="max-h-[320px] rounded-xl shadow-md border border-[#EFE9DF] object-contain cursor-pointer active:scale-95 transition"
              />
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLongPressGuide(false)}
                className="w-full py-2.5 rounded-full bg-[#C0392B] hover:bg-[#A93226] text-white text-xs font-bold shadow-sm transition"
              >
                닫고 돌아가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
