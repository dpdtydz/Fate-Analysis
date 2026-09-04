import React, { useState } from "react";
import { Sparkles, Info, Flame, Compass, Heart, Award, ShieldAlert, BookOpen, Crown, ChevronRight, X } from "lucide-react";

export interface ShinsalItem {
  id: string;
  name: string;
  category: "길신" | "흉살" | "신살" | "12운성";
  hanja: string;
  emoji: string;
  modernTitle: string;
  tagline: string;
  summary: string;
  positive: string;
  caution: string;
  rarity: "전설 (1%)" | "상위 (5%)" | "희귀 (15%)" | "핵심 기운";
  colorHex: string;
}

// 현대적 해석 사전
export const MODERN_SHINSAL_REGISTRY: Record<string, ShinsalItem> = {
  "천을귀인": {
    id: "cheon-eul",
    name: "천을귀인",
    category: "길신",
    hanja: "天乙貴人",
    emoji: "👑",
    modernTitle: "위기 탈출 치트키 · 절대적 수호자",
    tagline: '"인생의 결정적 순간마다 나를 건져 올리는 든든한 귀인"',
    summary: "사주 최고의 길신으로 불리며, 벼랑 끝에 몰려도 뜻밖의 조력자나 찬스가 나타나 상황을 전화위복으로 역전시키는 영험한 수호 에너지입니다.",
    positive: "주변 윗사람과 멘토들의 전폭적인 신뢰와 호감을 끌어모으며, 법적·금전적 위기를 비껴갑니다.",
    caution: "귀인의 도움을 당연시하지 않고 감사를 표현할 때 수호운이 평생 지속됩니다.",
    rarity: "상위 (5%)",
    colorHex: "#D97706"
  },
  "도화살": {
    id: "dohwa",
    name: "도화살",
    category: "신살",
    hanja: "桃花煞",
    emoji: "🌸",
    modernTitle: "시선 강탈 아우라 · 마성의 셀럽력",
    tagline: '"가만히 있어도 사람들의 눈길을 사로잡는 독보적 매력"',
    summary: "과거엔 주색으로 오해받았으나 현대에는 팬덤을 거느리는 유튜버, 연예인, 스타 세일즈맨의 필수 기운입니다. 사람의 마음을 훔치는 은근하고 강력한 흡인력입니다.",
    positive: "대인관계와 미디어 무대에서 압도적인 호감도와 비주얼적 매력을 발산합니다.",
    caution: "원치 않는 관심이나 구설이 따를 수 있으니 공과 사의 경계를 분명히 하세요.",
    rarity: "희귀 (15%)",
    colorHex: "#EC4899"
  },
  "역마살": {
    id: "yeokma",
    name: "역마살",
    category: "신살",
    hanja: "驛馬煞",
    emoji: "🐎",
    modernTitle: "글로벌 개척자 · 초고속 기동력",
    tagline: '"한곳에 머물지 않고 국경과 영역을 넓히는 자유로운 영혼"',
    summary: "안주하지 않고 새로운 영역으로 끊임없이 이동하며 기회를 쟁취하는 에너지입니다. 해외 비즈니스, 잦은 출장, 디지털 노마드로서 최고의 시너지를 냅니다.",
    positive: "활동 반경이 넓어질수록 인맥과 재물운이 기하급수적으로 팽창합니다.",
    caution: "체력 고갈과 잦은 환경 변화에 따른 루틴 붕괴를 주의하세요.",
    rarity: "핵심 기운",
    colorHex: "#2563EB"
  },
  "화개살": {
    id: "hwagae",
    name: "화개살",
    category: "신살",
    hanja: "華蓋煞",
    emoji: "🎨",
    modernTitle: "고독한 천재성 · 독보적 예술 영감",
    tagline: '"혼자만의 깊은 사색 속에서 피어나는 명작의 씨앗"',
    summary: "빛나는 보물을 보자기에 덮어둔 형상으로, 깊은 통찰력과 예술성, 인문학적 깊이를 자랑합니다. 혼자만의 시간을 지혜롭게 쓰면 한 분야의 장인으로 거듭납니다.",
    positive: "창작, 연구, 기획, 브랜딩 분야에서 타의 추종을 불허하는 독창적 결과물을 냅니다.",
    caution: "외로움에 침잠하기보다 내면의 아이디어를 세상 밖으로 적극 표현해 보세요.",
    rarity: "희귀 (15%)",
    colorHex: "#8B5CF6"
  },
  "문창귀인": {
    id: "munchang",
    name: "문창귀인",
    category: "길신",
    hanja: "文昌貴人",
    emoji: "📜",
    modernTitle: "지적 지능 치트키 · 명쾌한 언어술사",
    tagline: '"복잡한 개념도 단숨에 꿰뚫고 말과 글로 풀어내는 브레인"',
    summary: "학문과 창작의 수호신으로, 시험 합격운과 문서운, 저작권 자산을 풍요롭게 만듭니다. 논리적이면서도 듣는 이의 마음을 설득하는 세련된 화술을 갖추었습니다.",
    positive: "자격증 취득, 논문, 기획서 작성, 전문직 진출에서 압도적 두각을 보입니다.",
    caution: "지적 우월감에 빠지지 않고 타인의 감정을 경청할 때 진정한 명망을 얻습니다.",
    rarity: "상위 (5%)",
    colorHex: "#059669"
  },
  "백호대살": {
    id: "baekho",
    name: "백호대살",
    category: "흉살",
    hanja: "白虎大煞",
    emoji: "🐅",
    modernTitle: "승부사적 폭발력 · 무한 집중력",
    tagline: '"결정적 승부처에서 판세를 한 방에 뒤집는 야수성"',
    summary: "호랑이의 용맹한 기상처럼 거침없는 결단력과 불꽃같은 집념을 상징합니다. 고난도 프로젝트나 전문직(외과의사, 법조인, 전문 경영인)에서 초인적인 힘을 발휘합니다.",
    positive: "위기 상황에서도 굴하지 않고 목표를 향해 정면 돌파해내는 압도적 카리스마.",
    caution: "순간적인 욱하는 감정이나 과속, 돌발 사고를 유의하며 차분함을 다스리세요.",
    rarity: "희귀 (15%)",
    colorHex: "#DC2626"
  },
  "괴강살": {
    id: "goegang",
    name: "괴강살",
    category: "신살",
    hanja: "魁罡煞",
    emoji: "⚡",
    modernTitle: "북두칠성 카리스마 · 불패의 리더십",
    tagline: '"타협하지 않는 강직함으로 정상을 정복하는 우두머리"',
    summary: "우두머리 별인 괴강의 기운으로 총명함과 배짱이 남다릅니다. 남 밑에 안주하기보다 조직의 수장이나 독자적 비즈니스를 이끌 때 세상을 호령합니다.",
    positive: "남들이 두려워하는 큰 책임을 당당히 짊어지고 비범한 대업을 성취합니다.",
    caution: "독단적인 결정을 지양하고 부하직원들의 마음을 품는 덕성을 기르세요.",
    rarity: "상위 (5%)",
    colorHex: "#475569"
  }
};

// 12운성 현대적 해석
export const MODERN_12UNSEONG_REGISTRY: Record<string, {
  name: string;
  stage: string;
  power: number; // 0~100
  tagline: string;
  desc: string;
}> = {
  "장생": { name: "장생(長生)", stage: "새싹의 탄생", power: 85, tagline: "무한한 가능성과 순수한 생명력", desc: "주변의 따뜻한 후원과 사랑을 한몸에 받으며 밝고 쾌활하게 뻗어나가는 길운입니다." },
  "목욕": { name: "목욕(沐浴)", stage: "첫 세상 나들이", power: 75, tagline: "호기심과 매력의 발산", desc: "순수한 호기심과 트렌디한 감각이 돋보이며 매력 어필이 탁월한 시기입니다." },
  "관대": { name: "관대(冠帶)", stage: "성인식과 등용", power: 88, tagline: "당당한 패기와 도전 정신", desc: "자신감이 넘치고 세상에 내 실력을 증명하려는 강력한 에너지가 솟구칩니다." },
  "건록": { name: "건록(建祿)", stage: "든든한 녹봉과 관직", power: 95, tagline: "안정적인 자립과 탄탄한 자산", desc: "실력으로 자수성가하여 명예와 실질적인 경제적 부를 굳건히 완성합니다." },
  "제왕": { name: "제왕(帝旺)", stage: "인생 최고의 전성기", power: 100, tagline: "정상의 카리스마와 통솔력", desc: "에너지가 정점에 달해 누구의 간섭도 받지 않고 정상을 호령하는 군주의 기상입니다." },
  "쇠": { name: "쇠(衰)", stage: "원숙한 원로의 쉼", power: 70, tagline: "노련한 지혜와 위기 관리", desc: "전면의 칼바람을 피해 뒤에서 실속과 안전을 노련하게 챙기는 지혜로운 안식입니다." },
  "병": { name: "병(病)", stage: "섬세한 감수성", power: 60, tagline: "공감 능력과 예술적 영감", desc: "타인의 고통을 깊이 헤아리는 다정함과 세심한 예술성이 빛을 발합니다." },
  "사": { name: "사(死)", stage: "정밀한 집중과 몰입", power: 65, tagline: "학술 연구와 결벽적 완벽주의", desc: "잡념을 비우고 한 가지 연구나 전문 기술에 극도로 파고드는 고요한 내공입니다." },
  "묘": { name: "묘(墓)", stage: "보물창고의 저장", power: 80, tagline: "알짜 자산 저축과 곳간 수호", desc: "실속 없이 흩어지지 않고 모든 자원과 재물을 안전하게 비축하는 은밀한 부자 운입니다." },
  "절": { name: "절(絶)", stage: "완전한 리셋과 전환", power: 50, tagline: "새로운 패러다임의 혁신", desc: "과거의 구습을 단칼에 끊어내고 백지에서 완전히 새로운 판을 짜는 혁신적 전환입니다." },
  "태": { name: "태(胎)", stage: "생명의 잉태와 희망", power: 68, tagline: "무한한 호기심과 기획력", desc: "새로운 아이디어와 비전이 어머니 품처럼 따뜻하게 싹트는 평화로운 기운입니다." },
  "양": { name: "양(養)", stage: "보호와 순조로운 양육", power: 78, tagline: "상속운과 든든한 보살핌", desc: "윗사람의 후계자로서 사랑받으며 순조롭게 유산과 지위를 이어받는 온화한 기운입니다." }
};

interface ShinsalBadgesProps {
  sals?: string[];
  unseong?: string;
  dayJi?: string;
}

export default function ShinsalBadges({ sals = [], unseong, dayJi }: ShinsalBadgesProps) {
  const [selectedShinsal, setSelectedShinsal] = useState<ShinsalItem | null>(null);
  const [selectedUnseong, setSelectedUnseong] = useState<{ key: string; data: any } | null>(null);

  // 기본 노출될 신살 목록 필터링 (없으면 대표적인 도화살/천을귀인/역마살 기본 구성 매핑)
  const displaySals: ShinsalItem[] = React.useMemo(() => {
    const list: ShinsalItem[] = [];
    const seen = new Set<string>();

    sals.forEach(s => {
      Object.entries(MODERN_SHINSAL_REGISTRY).forEach(([key, item]) => {
        if (s.includes(key) && !seen.has(key)) {
          seen.add(key);
          list.push(item);
        }
      });
    });

    // 만약 전달된 살이 없다면 일지 기준으로 재미있는 현대적 신살 기본 매핑
    if (list.length === 0) {
      if (dayJi && ["자", "오", "묘", "유"].includes(dayJi)) {
        list.push(MODERN_SHINSAL_REGISTRY["도화살"]);
      } else if (dayJi && ["인", "신", "사", "해"].includes(dayJi)) {
        list.push(MODERN_SHINSAL_REGISTRY["역마살"]);
      } else {
        list.push(MODERN_SHINSAL_REGISTRY["화개살"]);
      }
      list.push(MODERN_SHINSAL_REGISTRY["천을귀인"]);
    }

    return list;
  }, [sals, dayJi]);

  const unseongData = unseong ? MODERN_12UNSEONG_REGISTRY[unseong] : null;

  return (
    <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-seal/10 text-seal flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-ink">현대적 신살(神煞) & 12운성 뱃지</h4>
            <p className="text-xs text-ink-faint">클릭하면 숨겨진 현대적 능력치와 해설을 확인할 수 있어요</p>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="flex flex-wrap gap-2 pt-1">
        {displaySals.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedShinsal(item)}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line hover:border-ink-soft bg-sunken hover:bg-surface text-xs font-medium text-ink transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
            style={{ borderLeftColor: item.colorHex, borderLeftWidth: "3px" }}
          >
            <span className="font-semibold">{item.name}</span>
            <span className="text-xs text-ink-faint group-hover:text-ink-soft transition-colors">
              {item.modernTitle.split("·")[0].trim()}
            </span>
          </button>
        ))}

        {/* 12운성 뱃지 */}
        {unseongData && (
          <button
            type="button"
            onClick={() => setSelectedUnseong({ key: unseong!, data: unseongData })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-seal/30 bg-seal/5 hover:bg-seal/10 text-xs font-medium text-seal transition-all duration-200 cursor-pointer shadow-xs active:scale-95"
          >
            <Crown className="w-3.5 h-3.5 text-seal" />
            <span className="font-semibold">{unseongData.name}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-xl bg-seal text-white font-bold">
              활력 {unseongData.power}%
            </span>
          </button>
        )}
      </div>

      {/* Shinsal Detail Modal */}
      {selectedShinsal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-5 shadow-xl border border-line space-y-4 text-left relative">
            <button
              onClick={() => setSelectedShinsal(null)}
              className="absolute top-4 right-4 p-1.5 text-ink-faint hover:text-ink rounded-lg bg-sunken transition-colors cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-xs"
                style={{ backgroundColor: `${selectedShinsal.colorHex}15`, color: selectedShinsal.colorHex }}
              >
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-serif text-lg font-bold text-ink">{selectedShinsal.name}</h3>
                  <span className="text-xs text-ink-faint font-mono">({selectedShinsal.hanja})</span>
                </div>
                <span className="text-xs font-semibold" style={{ color: selectedShinsal.colorHex }}>
                  {selectedShinsal.rarity}
                </span>
              </div>
            </div>

            <div className="p-3 bg-sunken rounded-xl space-y-1">
              <p className="text-xs font-bold text-ink">{selectedShinsal.modernTitle}</p>
              <p className="text-xs text-ink-soft italic">{selectedShinsal.tagline}</p>
            </div>

            <div className="space-y-2 text-xs leading-relaxed text-ink-soft">
              <p>{selectedShinsal.summary}</p>
              <div className="pt-2 border-t border-line space-y-1.5">
                <div className="flex items-start gap-1.5">
                  <span className="text-xs font-bold text-wood shrink-0">강점</span>
                  <p className="text-xs text-ink">{selectedShinsal.positive}</p>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-xs font-bold text-fire shrink-0">조언</span>
                  <p className="text-xs text-ink">{selectedShinsal.caution}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedShinsal(null)}
              className="w-full py-2.5 bg-ink text-white rounded-xl text-xs font-semibold hover:bg-seal transition-colors cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 12Unseong Detail Modal */}
      {selectedUnseong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-5 shadow-xl border border-line space-y-4 text-left relative">
            <button
              onClick={() => setSelectedUnseong(null)}
              className="absolute top-4 right-4 p-1.5 text-ink-faint hover:text-ink rounded-lg bg-sunken transition-colors cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-seal/10 text-seal flex items-center justify-center text-xl font-bold">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-ink">{selectedUnseong.data.name}</h3>
                <span className="text-xs text-seal font-semibold">12운성 · {selectedUnseong.data.stage}</span>
              </div>
            </div>

            {/* Power meter */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-ink">운명 에너지 레벨</span>
                <span className="text-seal">{selectedUnseong.data.power}%</span>
              </div>
              <div className="h-2 w-full bg-sunken rounded-xl overflow-hidden">
                <div
                  className="h-full bg-seal rounded-xl transition-all duration-500"
                  style={{ width: `${selectedUnseong.data.power}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-sunken rounded-xl space-y-1 text-xs">
              <p className="font-bold text-ink">{selectedUnseong.data.tagline}</p>
              <p className="text-ink-soft leading-relaxed">{selectedUnseong.data.desc}</p>
            </div>

            <button
              onClick={() => setSelectedUnseong(null)}
              className="w-full py-2.5 bg-ink text-white rounded-xl text-xs font-semibold hover:bg-seal transition-colors cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
