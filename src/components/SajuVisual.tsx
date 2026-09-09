import React, { useState, useEffect } from "react";
import { SajuData, PersonalAnalysis } from "../types";
import { daymasterMap } from "../utils/saju";
import { 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  Sparkles, 
  DollarSign, 
  Briefcase, 
  UserCheck, 
  UserX, 
  Flame, 
  ArrowRight, 
  Ban, 
  Zap,
  Target,
  Sun,
  Moon,
  Calendar,
  Lightbulb,
  Crown,
  Unlock,
  BookOpen,
  Award,
  ShieldCheck,
  Clock,
  Compass,
  HelpCircle,
  ChevronDown,
  RefreshCw,
  Heart,
  Coins,
  Activity,
  Users
} from "lucide-react";
import { generatePersonalCoreNarrative } from "../utils/sajuSynthesis";

interface SajuVisualProps {
  saju: SajuData;
  hideMix?: boolean;
  showOnlyMix?: boolean;
  isPremium?: boolean;
  showOnlyDaewoon?: boolean;
  selectedTab?: "mix" | "saju" | "ziwei";
  hideTabNav?: boolean;
  onTabChange?: (tab: "mix" | "saju" | "ziwei") => void;
  userName?: string;
  birthDate?: string;
  mbti?: string;
  hasTicket?: boolean;
  ticketCount?: number;
  onUnlockWithTicket?: () => void;
  onApplyCoupon?: (code: string) => void;
  couponLoading?: boolean;
  couponError?: string | null;
  personalAnalysis?: PersonalAnalysis;
  isAiLoading?: boolean;
  onRefreshAi?: () => void;
  isAiGenerated?: boolean;
}

import {
  starMeanings,
  getStarMeaningInPalace,
  friendlyPalaceNames,
  friendlyPalaceExplanations,
  friendlySihuaExplanations,
  shinsalExplanations,
  getSihuaDetailedDescription,
  daymasterDetails,
  ziweiStarDetails,
  SajuActionGuide,
  DAYMASTER_ACTION_GUIDES,
  SIPSIN_DAEWOON_ACTION,
  elementColors,
  elementNames,
  ganElements,
  jiElements,
  getGanElementStyle,
  getJiElementStyle,
  getSipseongExplanation,
  palaceDescriptions
} from "../utils/sajuInterpretations";

export default function SajuVisual({
  saju,
  hideMix = false,
  showOnlyMix = false,
  isPremium = false,
  showOnlyDaewoon = false,
  selectedTab,
  hideTabNav = false,
  onTabChange,
  userName = "당신",
  birthDate,
  mbti,
  hasTicket = false,
  ticketCount = 0,
  onUnlockWithTicket,
  onApplyCoupon,
  couponLoading = false,
  couponError = null,
  personalAnalysis,
  isAiLoading = false,
  onRefreshAi,
  isAiGenerated = false
}: SajuVisualProps) {
  const [activeTab, setActiveTab] = useState<"mix" | "saju" | "ziwei">(showOnlyMix ? "mix" : "mix");
  const currentTab = selectedTab !== undefined ? selectedTab : activeTab;
  const handleTabSelect = (tab: "mix" | "saju" | "ziwei") => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };
  const [selectedDaewoonIdx, setSelectedDaewoonIdx] = useState<number | null>(null);
  const [selectedPalace, setSelectedPalace] = useState<string>("명궁");
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [localCouponInput, setLocalCouponInput] = useState("");

  const fallbackNarrative = generatePersonalCoreNarrative(
    saju,
    birthDate,
    userName,
    mbti
  );

  // Gemini 3.5 AI 실시간 분석 결과와 룰베이스 뼈대 정밀 병합
  const narrative = {
    ...fallbackNarrative,
    identity: {
      ...fallbackNarrative.identity,
      headline: personalAnalysis?.headline || fallbackNarrative.identity.headline,
      punchyQuote: personalAnalysis?.punchy_quote || fallbackNarrative.identity.punchyQuote,
      tags: personalAnalysis?.tags && personalAnalysis.tags.length > 0 ? personalAnalysis.tags : fallbackNarrative.identity.tags,
      outer: personalAnalysis?.duality?.outer || fallbackNarrative.identity.outer,
      inner: personalAnalysis?.duality?.inner || fallbackNarrative.identity.inner,
      contrast: personalAnalysis?.duality?.contrast || fallbackNarrative.identity.contrast,
      coreEssence: personalAnalysis?.four_areas?.essence || fallbackNarrative.identity.coreEssence,
      thinkingPattern: personalAnalysis?.character_desc || fallbackNarrative.identity.thinkingPattern,
    },
    season: {
      ...fallbackNarrative.season,
      punchySeasonQuote: personalAnalysis?.season_quote || fallbackNarrative.season.punchySeasonQuote,
    },
    wealthEngine: {
      ...fallbackNarrative.wealthEngine,
      coreWeapon: personalAnalysis?.career?.strength || fallbackNarrative.wealthEngine.coreWeapon,
      moneyPipeline: personalAnalysis?.wealth?.earning || fallbackNarrative.wealthEngine.moneyPipeline,
      workStyle: personalAnalysis?.career?.recommended_fields || fallbackNarrative.wealthEngine.workStyle,
    },
    prescription: {
      ...fallbackNarrative.prescription,
      coreSummary: personalAnalysis?.one_action || fallbackNarrative.prescription.coreSummary,
    },
    lifeThemes: {
      love: {
        title: fallbackNarrative.lifeThemes.love.title,
        story: personalAnalysis?.love?.meeting_scene
          ? `${personalAnalysis.love.meeting_scene} ${personalAnalysis.love.friction_point ? personalAnalysis.love.friction_point : ""}`.trim()
          : fallbackNarrative.lifeThemes.love.story,
        tip: fallbackNarrative.lifeThemes.love.tip,
      },
      wealth: {
        title: fallbackNarrative.lifeThemes.wealth.title,
        story: personalAnalysis?.wealth?.earning
          ? `${personalAnalysis.wealth.earning} ${personalAnalysis.wealth.leak ? personalAnalysis.wealth.leak : ""}`.trim()
          : fallbackNarrative.lifeThemes.wealth.story,
        tip: fallbackNarrative.lifeThemes.wealth.tip,
      },
      lifeRelation: {
        title: fallbackNarrative.lifeThemes.lifeRelation.title,
        story: personalAnalysis?.closing || fallbackNarrative.lifeThemes.lifeRelation.story,
        tip: fallbackNarrative.lifeThemes.lifeRelation.tip,
      },
      health: {
        title: fallbackNarrative.lifeThemes.health.title,
        story: personalAnalysis?.health?.signal || fallbackNarrative.lifeThemes.health.story,
        tip: personalAnalysis?.health?.recovery || fallbackNarrative.lifeThemes.health.tip,
      },
      career: {
        title: "잠재력이 폭발할 수 있는 가장 잘 어울리는 직업군",
        story: personalAnalysis?.career?.strength
          ? `${personalAnalysis.career.strength} ${personalAnalysis.career.recommended_fields ? personalAnalysis.career.recommended_fields : ""}`.trim()
          : fallbackNarrative.lifeThemes.career.story,
        tip: fallbackNarrative.lifeThemes.career.tip,
      },
    }
  };

  const toggleBlock = (key: string) => {
    setExpandedBlocks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const { pillars, daymaster, ohaeng_count, special_sals_list, daewoon, ziwei, birthplace, solar_birth_time, solar_correction_minutes, pillars_detail, sipseong_strength } = saju;
  const currentAge = 35;
  const daymasterMeta = daymasterMap[daymaster?.gan || "甲"];

  const findMatchingDaxian = (sajuAge: number) => {
    if (!ziwei || !ziwei.daXianList) return null;
    return ziwei.daXianList.find(dx => sajuAge >= dx.ageStart && sajuAge <= dx.ageEnd) || null;
  };

  const renderZiweiGridCells = () => {
    if (!ziwei || !ziwei.palaces) return null;
    
    const zhiOrder = ["巳", "午", "未", "申", "辰", "", "", "酉", "卯", "", "", "戌", "寅", "丑", "子", "亥"];
    const palaceByZhi: Record<string, any> = {};
    Object.values(ziwei.palaces).forEach(p => {
      palaceByZhi[p.zhi] = p;
    });

    return zhiOrder.map((zhi, idx) => {
      if (zhi === "") {
        if (idx === 5) {
          return (
            <div key="center" className="col-span-2 row-span-2 bg-sunken rounded-xl p-3 flex flex-col items-center justify-center text-center">
              <span className="font-serif font-semibold text-xs text-ink mb-0.5">자미두수 원명반</span>
              <span className="text-xs text-ink-faint leading-relaxed">
                14정성과 보조 성요가<br/>12궁에 배치된 명반입니다
              </span>
            </div>
          );
        }
        if (idx === 6 || idx === 9 || idx === 10) return null;
      }

      const pal = palaceByZhi[zhi];
      if (!pal) {
        return <div key={idx} className="bg-sunken rounded-xl p-2 min-h-[70px]" />;
      }

      const isSelected = selectedPalace === pal.name || selectedPalace === pal.nameKr;
      const mainStars = pal.stars?.filter((s: any) => s.type === "main") || [];
      const luckyStars = pal.stars?.filter((s: any) => s.type === "lucky") || [];

      return (
        <button
          key={zhi}
          type="button"
          onClick={() => setSelectedPalace(pal.nameKr || pal.name)}
          className={`p-2 rounded-xl text-left flex flex-col justify-between min-h-[84px] transition-colors cursor-pointer ${
            isSelected
              ? "bg-surface ring-1 ring-seal"
              : "bg-sunken hover:bg-line/60"
          }`}
        >
          <div className="flex items-center justify-between w-full gap-1">
            <span className={`text-xs font-semibold ${isSelected ? "text-seal" : "text-ink"}`}>
              {pal.nameKr || pal.name}
            </span>
            <span className="text-xs font-serif text-ink-faint">
              {pal.zhi}
            </span>
          </div>

          <div className="my-1 space-y-0.5">
            {mainStars.map((s: any) => (
              <div key={s.nameKr} className="text-xs font-medium text-ink leading-tight">
                {s.nameKr}
              </div>
            ))}
            {luckyStars.slice(0, 2).map((s: any) => (
              <div key={s.nameKr} className="text-xs text-ink-faint leading-tight">
                {s.nameKr}
              </div>
            ))}
          </div>

          <div className="text-xs font-serif text-ink-faint">
            {pal.ganZhi}
          </div>
        </button>
      );
    });
  };

  if (showOnlyDaewoon) {
    return (
      <div className="space-y-4 text-left">
        <div className="bg-surface border border-line p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">
              10년 주기 대운大運 순환표
            </span>
            <span className="text-xs text-ink-faint">
              현재 만 {currentAge}세
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 items-stretch">
            {daewoon && daewoon.map((item, idx) => {
              const isSelected = selectedDaewoonIdx === idx;
              const isCurrent = currentAge >= item.age && currentAge <= (daewoon[idx + 1] ? daewoon[idx + 1].age - 1 : item.age + 9);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDaewoonIdx(isSelected ? null : idx)}
                  className={`p-2 rounded-xl text-center flex flex-col justify-between transition-colors cursor-pointer relative ${
                    isSelected
                      ? "bg-seal text-white shadow-xs"
                      : isCurrent
                      ? "bg-sunken text-ink ring-1.5 ring-seal/50 hover:bg-line/60"
                      : "bg-sunken text-ink hover:bg-line/60"
                  }`}
                >
                  <div className="h-4 flex items-center justify-center mb-0.5">
                    {isCurrent ? (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap ${
                        isSelected ? "bg-white text-seal" : "bg-seal text-white"
                      }`}>
                        현재
                      </span>
                    ) : (
                      <span className="text-[10px] opacity-0 select-none pointer-events-none leading-none">
                        대운
                      </span>
                    )}
                  </div>

                  <div className={`text-xs font-medium ${isSelected ? "text-white/80" : "text-ink-faint"}`}>
                    {item.age}세
                  </div>

                  <div className="font-serif text-base font-semibold my-0.5">{item.ganzi}</div>

                  <div className={`text-xs leading-none ${isSelected ? "text-white/80" : "text-ink-soft"}`}>
                    {item.stemSipsin}/{item.branchSipsin}
                  </div>

                  <div className={`text-xs rounded-md py-0.5 font-medium mt-1 ${
                    isSelected ? "bg-white/20 text-white" : "bg-surface text-ink-soft"
                  }`}>
                    {item.unseong}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Saju Decadal Luck Detailed Guide */}
        {selectedDaewoonIdx !== null && daewoon[selectedDaewoonIdx] && (() => {
          const item = daewoon[selectedDaewoonIdx];
          const isCurrent = currentAge >= item.age && currentAge <= (daewoon[selectedDaewoonIdx + 1] ? daewoon[selectedDaewoonIdx + 1].age - 1 : item.age + 9);
          
          if (!isPremium) {
            return (
              <div className="bg-surface border border-line p-6 rounded-xl text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-sunken text-ink-soft mx-auto flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-ink">
                  {item.age}세 {item.ganzi} 대운 ({item.stemSipsin}/{item.branchSipsin}) 상세 풀이
                </h4>
                <p className="text-sm text-ink-soft leading-relaxed max-w-sm mx-auto">
                  이 10년 구간의 십성 흐름과 12운성 풀이는 평생 감정서에서 열람할 수 있어요.
                </p>
              </div>
            );
          }

          // Detailed interpretation generation based on Sipsin and 12unseong
          const activeSipsinTheme = item.stemSipsin === "비견" || item.stemSipsin === "겁재" || item.branchSipsin === "비견" || item.branchSipsin === "겁재" ? "비겁" :
                                    item.stemSipsin === "식신" || item.stemSipsin === "상관" || item.branchSipsin === "식신" || item.branchSipsin === "상관" ? "식상" :
                                    item.stemSipsin === "정재" || item.stemSipsin === "편재" || item.branchSipsin === "정재" || item.branchSipsin === "편재" ? "재성" :
                                    item.stemSipsin === "정관" || item.stemSipsin === "편관" || item.branchSipsin === "정관" || item.branchSipsin === "편관" ? "관성" : "인성";

          const sipsinText = 
            activeSipsinTheme === "비겁" ? "나 자신의 독립심과 주체성이 극대화되어 스스로 무언가를 창조하고 뚝심 있게 관철시키는 리더십의 10년입니다. 동업이나 경쟁 등 인간관계의 조율을 잘 다스리면 엄청난 자립 성과를 얻게 됩니다." :
            activeSipsinTheme === "식상" ? "나의 천재성과 창의력, 기획 능력이 날개를 달아 거침없이 세상에 표현되는 아주 역동적인 10년입니다. 배움과 연구, 새로운 일을 벌이거나 사업을 확장해나가기에 가장 매끄러운 에너지입니다." :
            activeSipsinTheme === "재성" ? "풍성한 재물과 가시적인 결과물이 실속 있게 영그는 일생일대의 황금기입니다. 비즈니스적 통찰이 늘고 노련한 현금 흐름 창출을 이뤄내며, 성실하게 부의 도약을 축적하기에 안성맞춤입니다." :
            activeSipsinTheme === "관성" ? "사회적인 명예와 책임 있는 높은 지위, 탄탄한 조직 내의 인정을 거머쥐는 최고의 커리어 성공 흐름입니다. 중요한 라이선스를 따내거나 승진, 임용 등 정당하고 공적인 명예를 굳세게 지켜냅니다." :
            "내적인 공부와 지혜를 듬뿍 쌓고, 귀인의 무조건적인 원조와 도움을 받아 탄탄하게 문서를 확보하는 실속 내실기입니다. 조급하게 행동하기보다 실력을 성숙하게 가다듬어 한 단계 인생 품격을 끌어올립니다.";

          const unseongText = 
            item.unseong === "장생" || item.unseong === "목욕" ? "마치 주변의 따뜻한 관심과 큰 인덕 속에 화려하게 주목받으며, 기분 좋고 트렌디하게 나 자신을 발산하는 쾌활하고 발랄한 생명 주기입니다." :
            item.unseong === "관대" || item.unseong === "건록" || item.unseong === "제왕" ? "사주 기운 중 기세가 가장 단단하고 위세 높은 전성기로, 강력한 주관과 굳건한 추진력을 통하여 높은 사회적 빌딩을 일구는 당찬 추진 시기입니다." :
            item.unseong === "쇠" || item.unseong === "양" || item.unseong === "태" ? "무리한 대외적 충돌을 피하고 주변과 부드럽게 상생하며, 지혜롭고 영민한 지혜와 통찰력으로 내실을 조화롭게 확보하는 안정 지향적 시기입니다." :
            item.unseong === "병" || item.unseong === "사" || item.unseong === "묘" ? "생각과 깊이가 아주 깊어져서 학문적/예술적 창조성을 드높이고, 불필요한 지출 대신 철저한 실속 저축을 통하여 비공개적 자산 가치를 완벽히 다져놓는 알짜배기 시기입니다." :
            "기존의 어수선한 껍질을 말끔히 허물어내고, 백지 위에서 완전히 신선한 새출발의 큰 꿈과 장기 기획을 안전하게 설계하기에 제격인 소중한 기획 시기입니다.";

          return (
            <div className="bg-surface border border-line p-5 rounded-xl space-y-3 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5">
                <div>
                  <span className="text-xs text-ink-faint">
                    {item.age}세 ~ {item.age + 9}세 10년 대운
                  </span>
                  <h4 className="text-sm font-semibold text-ink mt-1">
                    <span className="font-serif">{item.ganzi}</span> 대운 · {item.stemSipsin}/{item.branchSipsin} ({item.unseong})
                  </h4>
                </div>
                <div className="text-left sm:text-right">
                  {isCurrent && (
                    <span className="inline-block text-xs font-semibold text-seal">
                      현재 지나고 있는 구간
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-ink-soft">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <span className="font-medium text-ink text-xs block">십성 에너지 흐름 ({item.stemSipsin}/{item.branchSipsin})</span>
                    <div className="bg-sunken p-3.5 rounded-xl text-ink-soft min-h-[110px]">
                      <p>{sipsinText}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-medium text-ink text-xs block">12운성 활력 지표 ({item.unseong})</span>
                    <div className="bg-sunken p-3.5 rounded-xl text-ink-soft min-h-[110px]">
                      <p>{unseongText}</p>
                    </div>
                  </div>
                </div>

                {/* Synchronized Ziwei Daxian Section - UPGRADE STRATEGY */}
                {(() => {
                  const matchedDx = findMatchingDaxian(item.age);
                  if (!matchedDx) return null;
                  const rawPalName = matchedDx.palaceName;
                  const cleanPalName = rawPalName.endsWith("궁") ? rawPalName : (rawPalName + "궁");
                  const friendlyTheme = friendlyPalaceNames[cleanPalName] || cleanPalName;
                  const friendlyExplanation = friendlyPalaceExplanations[cleanPalName] || "일생의 다방면적인 기운과 인연의 매듭을 매끄럽게 가다듬고 정립해 나가는 귀중한 10년입니다.";
                  
                  const getResonanceInfo = (unseong: string, stars: string[]) => {
                    const hasHighUnseong = ["제왕", "건록", "관대"].includes(unseong);
                    const hasGentleUnseong = ["장생", "목욕", "쇠"].includes(unseong);
                    const hasIntellectualStars = stars.some(s => ["천기", "태음", "천상", "천동", "거문"].includes(s));
                    const hasHighEnergyStars = stars.some(s => ["무곡", "칠살", "파군", "태양", "염정"].includes(s));
                    const hasLeadershipStars = stars.some(s => ["자미", "천부", "천량"].includes(s));

                    if (hasHighUnseong && hasHighEnergyStars) {
                      return {
                        title: "개척하는 무관의 기세가 겹치는 흐름",
                        score: 98,
                        desc: "명리학의 강인한 실천 활력과 자미두수의 개척 장군 성좌가 뜨겁게 결합한 최상급 번영 운세입니다. 망설임 없는 과감한 도전과 주도적 실행력이 성공의 가도를 엽니다."
                      };
                    }
                    if (hasGentleUnseong && hasIntellectualStars) {
                      return {
                        title: "지혜와 예술적 영감이 만나는 흐름",
                        score: 96,
                        desc: "명리학의 유연한 활력과 자미두수의 섬세한 지략/문창 성좌가 온화하게 어우러져 기획, 공부, 예술적 창출, 정서적 힐링에서 뛰어난 성과와 명예를 약속합니다."
                      };
                    }
                    if (hasHighUnseong && hasLeadershipStars) {
                      return {
                        title: "통솔하는 제왕성의 묵직한 조화",
                        score: 97,
                        desc: "명리학의 최고조에 달한 전성기적 기운과 자미두수의 황제/지도자 별자리가 만나 든든한 커리어의 기품을 세우고, 견고한 사회적 명예와 탄탄한 신용을 확보합니다."
                      };
                    }
                    return {
                      title: "음양의 조화를 채워가는 상생 흐름",
                      score: 93,
                      desc: "명리학의 10년 대운과 자미두수 대한의 음양 및 오행이 상호보완적으로 상생 작용하여, 흔들림 없이 편안하고 실속 있게 나만의 탄탄한 터전과 내실을 다져나가는 풍요의 해입니다."
                    };
                  };

                  const resonance = getResonanceInfo(item.unseong, matchedDx.mainStars || []);

                  return (
                    <div className="mt-4 pt-4 border-t border-line space-y-2.5 animate-fade-in text-left">
                      <span className="font-medium text-ink text-xs block">
                        자미두수 10년 대한大限 조화 풀이
                      </span>
                      <div className="bg-sunken rounded-xl p-4 space-y-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                          <div>
                            <span className="text-xs text-ink-faint">
                              {matchedDx.ageStart}세 ~ {matchedDx.ageEnd}세 {cleanPalName}
                            </span>
                            <h5 className="text-xs font-semibold text-ink mt-1">
                              핵심 테마 · {friendlyTheme}
                            </h5>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="text-xs text-ink-faint">
                              대한 간지 <strong className="font-serif text-ink">{matchedDx.ganZhi}</strong>
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-ink-soft leading-relaxed">
                          {friendlyExplanation}
                        </p>

                        {/* Resonance Box */}
                        <div className="bg-surface rounded-xl p-3.5 space-y-1.5">
                          <span className="text-xs font-semibold text-ink block">
                            {resonance.title}
                          </span>
                          <p className="text-sm text-ink-soft leading-relaxed">
                            {resonance.desc}
                          </p>
                        </div>

                        {/* Active Celestial Stars in this Daxian */}
                        {matchedDx.mainStars && matchedDx.mainStars.length > 0 && (
                          <div className="space-y-2 pt-3 border-t border-line">
                            <span className="text-xs font-medium text-ink-soft block">이 10년을 주관하는 성좌</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {matchedDx.mainStars.map((star, sIdx) => {
                                const sInfo = ziweiStarDetails[star] || { title: `${star}의 기운`, emoji: "", desc: "나만의 고유한 기운과 복록을 수호해 줍니다." };
                                return (
                                  <div key={sIdx} className="bg-surface p-3 rounded-xl text-xs text-ink-soft">
                                    <strong className="text-ink block font-medium">{sInfo.title}</strong>
                                    <span className="text-ink-faint leading-normal">{sInfo.desc}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <p className="text-xs text-ink-faint pt-1">
                  대운大運은 10년마다 주어지는 인생의 큰 환경이에요. 타고난 사주원국이 이 흐름을 순조롭게 지나도록 중심을 지키는 것이 중요합니다.
                </p>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      {!showOnlyMix && !hideTabNav && (
        <div className="flex bg-sunken p-1 rounded-xl max-w-sm sm:max-w-md mx-auto">
          {!hideMix && (
            <button
              type="button"
              onClick={() => handleTabSelect("mix")}
              className={`flex-1 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                currentTab === "mix"
                  ? "bg-surface text-ink font-semibold"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              심층 리포트
            </button>
          )}
          <button
            type="button"
            onClick={() => handleTabSelect("saju")}
            className={`flex-1 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
              currentTab === "saju"
                ? "bg-surface text-ink font-semibold"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            사주 만세력
          </button>
          <button
            type="button"
            onClick={() => handleTabSelect("ziwei")}
            className={`flex-1 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
              currentTab === "ziwei"
                ? "bg-surface text-ink font-semibold"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            자미두수 명반
          </button>
        </div>
      )}

      {currentTab === "mix" ? (
        /* design.md §4 — 섹션 간 space-y-10 이상. 카드를 다닥다닥 붙이지 않는다 */
        <div className="space-y-10">
          {/* Section A: 리포트 도입 — 카드 없이 종이 위에 바로. 여기가 리포트의 얼굴이다 */}
          <div className="text-left space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-ink-faint">
                  {userName}님의 본질과 인생 계절
                </p>
                {(isAiGenerated || isAiLoading || isPremium) && (
                  <p className="text-xs text-ink-faint mt-1 flex items-center gap-1.5 flex-wrap">
                    <span>
                      {isAiLoading
                        ? "AI 심층 분석을 생성하고 있습니다..."
                        : isAiGenerated
                          ? "사주·자미두수·MBTI 교차 분석"
                          : "정밀 명리학 분석"}
                    </span>
                    {isPremium && (
                      <>
                        <span className="text-ink-faint/60">·</span>
                        <span className="text-seal font-medium">평생 보관</span>
                      </>
                    )}
                  </p>
                )}
              </div>
              {onRefreshAi && (
                <button
                  type="button"
                  onClick={onRefreshAi}
                  disabled={isAiLoading}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-sunken hover:bg-line text-ink transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAiLoading ? "animate-spin" : ""}`} />
                  <span>{isAiLoading ? "분석 중" : "다시 분석"}</span>
                </button>
              )}
            </div>

            {/* 리포트의 얼굴 — 이 한 문장이 가장 크다. 인주는 세로선 한 점뿐 */}
            <blockquote className="border-l-2 border-seal pl-5 space-y-3">
              <p className="font-serif text-2xl sm:text-3xl font-semibold text-ink leading-[1.45] tracking-tight">
                {narrative.identity.punchyQuote}
              </p>
              <p className="text-base text-ink-soft leading-relaxed">
                {narrative.identity.headline}
              </p>
            </blockquote>

            {narrative.identity.tags && narrative.identity.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {narrative.identity.tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="px-2.5 py-1 rounded-xl bg-sunken text-ink-soft text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>


          {/* Section B: 1. 넌 진짜 어떤 사람인가 */}
          <div className="space-y-6 text-left">
            {/* 🌊 [구간 1] 소설처럼 물 흐르는 서사 구간 (마주 앉아 조용히 풀어주는 이야기) */}
            <div className="space-y-5">
              <div className="pt-2">
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-ink">
                  당신은 어떤 사람인가
                </h3>
                <p className="text-xs text-ink-faint mt-1">겉과 속의 인격 독해</p>
              </div>

              {/* 겉과 속 2분할 카드 - 시각적 대비 극대화 (글자 짤림 방지) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 겉 (세상이 보는 나) */}
                <div className="bg-surface p-4 sm:p-4.5 rounded-xl space-y-2.5 border border-line text-left">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-ink min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-sunken flex items-center justify-center shrink-0">
                        <Sun className="w-3.5 h-3.5 text-ink" />
                      </span>
                      <span className="font-bold text-ink break-keep-all">
                        [겉] 세상이 보는 첫인상
                      </span>
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-sunken text-ink-soft shrink-0 whitespace-nowrap">
                      사회적 페르소나
                    </span>
                  </div>
                  <p className="text-sm text-ink font-medium leading-relaxed break-keep-all">
                    {narrative.identity.outer}
                  </p>
                </div>

                {/* 속 (혼자 있을 때의 나) */}
                <div className="bg-surface p-4 sm:p-4.5 rounded-xl space-y-2.5 border border-line text-left">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-ink min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-sunken flex items-center justify-center shrink-0">
                        <Moon className="w-3.5 h-3.5 text-ink" />
                      </span>
                      <span className="font-bold text-ink break-keep-all">
                        [속] 혼자 있을 때의 내면
                      </span>
                    </div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-sunken text-ink-soft shrink-0 whitespace-nowrap">
                      진짜 속마음
                    </span>
                  </div>
                  <p className="text-sm text-ink font-medium leading-relaxed break-keep-all">
                    {narrative.identity.inner}
                  </p>
                </div>
              </div>

              {/* 교차 통찰 (공감 극대화 - 족집게 간극) */}
              <div className="text-left space-y-2.5 bg-surface/60 p-5 rounded-xl border border-line/60">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-seal rounded-full" />
                  <h4 className="font-serif text-base sm:text-lg font-semibold text-ink">
                    남들이 보는 나, 내가 아는 나
                  </h4>
                </div>
                <p className="text-sm text-ink leading-relaxed font-medium whitespace-pre-wrap pl-3.5 border-l border-line">
                  {narrative.identity.contrast}
                </p>
              </div>

              {/* 📖 삶의 다섯 가지 테마 (연애 | 재물 | 인생(관계) | 건강 | 직장) */}
              <div className="pt-3 space-y-4 text-left">
                <div className="pb-1">
                  <span className="text-[11px] font-mono tracking-widest uppercase text-seal font-bold block">
                    인생의 다섯 가지 결
                  </span>
                  <h4 className="font-serif text-lg sm:text-xl font-semibold text-ink mt-0.5">
                    삶을 채우는 다섯 가지 이야기
                  </h4>
                  <p className="text-xs text-ink-faint mt-1 leading-relaxed">
                    연애, 재물, 관계, 건강, 직업까지 타고난 기운의 흐름을 조용히 짚어드립니다.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {/* 제1장 · 연애 */}
                  <div className="bg-surface p-5 sm:p-5.5 rounded-2xl border border-line shadow-2xs space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <span className="w-6 h-6 rounded-lg bg-sunken flex items-center justify-center shrink-0">
                          <Heart className="w-3.5 h-3.5 text-seal" />
                        </span>
                        <span className="font-bold text-ink">제1장 · 연애와 인연의 결</span>
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-sunken text-ink-soft shrink-0">
                        연애운
                      </span>
                    </div>
                    <h5 className="font-serif text-base sm:text-lg font-semibold text-ink leading-snug break-keep-all">
                      {narrative.lifeThemes.love.title}
                    </h5>
                    <p className="text-sm text-ink/90 font-medium leading-relaxed break-keep-all whitespace-pre-wrap pl-3 border-l-2 border-seal/30">
                      {narrative.lifeThemes.love.story}
                    </p>
                    {narrative.lifeThemes.love.tip && (
                      <div className="bg-sunken/60 rounded-xl p-3 sm:p-3.5 border border-line/60 flex flex-col items-start gap-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-seal/10 text-seal">
                          연애를 잘 풀어나가기 위한 조언
                        </span>
                        <p className="text-xs text-ink-soft leading-relaxed break-keep-all font-medium w-full">
                          {narrative.lifeThemes.love.tip}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 제2장 · 재물 */}
                  <div className="bg-surface p-5 sm:p-5.5 rounded-2xl border border-line shadow-2xs space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <span className="w-6 h-6 rounded-lg bg-sunken flex items-center justify-center shrink-0">
                          <Coins className="w-3.5 h-3.5 text-seal" />
                        </span>
                        <span className="font-bold text-ink">제2장 · 재물과 부의 그릇</span>
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-sunken text-ink-soft shrink-0">
                        재물운
                      </span>
                    </div>
                    <h5 className="font-serif text-base sm:text-lg font-semibold text-ink leading-snug break-keep-all">
                      {narrative.lifeThemes.wealth.title}
                    </h5>
                    <p className="text-sm text-ink/90 font-medium leading-relaxed break-keep-all whitespace-pre-wrap pl-3 border-l-2 border-seal/30">
                      {narrative.lifeThemes.wealth.story}
                    </p>
                    {narrative.lifeThemes.wealth.tip && (
                      <div className="bg-sunken/60 rounded-xl p-3 sm:p-3.5 border border-line/60 flex flex-col items-start gap-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-seal/10 text-seal">
                          재물이 새는 것을 막는 실천 팁
                        </span>
                        <p className="text-xs text-ink-soft leading-relaxed break-keep-all font-medium w-full">
                          {narrative.lifeThemes.wealth.tip}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 제3장 · 인생(관계) */}
                  <div className="bg-surface p-5 sm:p-5.5 rounded-2xl border border-line shadow-2xs space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <span className="w-6 h-6 rounded-lg bg-sunken flex items-center justify-center shrink-0">
                          <Users className="w-3.5 h-3.5 text-seal" />
                        </span>
                        <span className="font-bold text-ink">제3장 · 인생과 인간관계의 선</span>
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-sunken text-ink-soft shrink-0">
                        인생·관계운
                      </span>
                    </div>
                    <h5 className="font-serif text-base sm:text-lg font-semibold text-ink leading-snug break-keep-all">
                      {narrative.lifeThemes.lifeRelation.title}
                    </h5>
                    <p className="text-sm text-ink/90 font-medium leading-relaxed break-keep-all whitespace-pre-wrap pl-3 border-l-2 border-seal/30">
                      {narrative.lifeThemes.lifeRelation.story}
                    </p>
                    {narrative.lifeThemes.lifeRelation.tip && (
                      <div className="bg-sunken/60 rounded-xl p-3 sm:p-3.5 border border-line/60 flex flex-col items-start gap-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-seal/10 text-seal">
                          건강한 인간관계를 위한 기준
                        </span>
                        <p className="text-xs text-ink-soft leading-relaxed break-keep-all font-medium w-full">
                          {narrative.lifeThemes.lifeRelation.tip}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 제4장 · 건강 */}
                  <div className="bg-surface p-5 sm:p-5.5 rounded-2xl border border-line shadow-2xs space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <span className="w-6 h-6 rounded-lg bg-sunken flex items-center justify-center shrink-0">
                          <Activity className="w-3.5 h-3.5 text-seal" />
                        </span>
                        <span className="font-bold text-ink">제4장 · 몸과 마음의 신호와 쉼</span>
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-sunken text-ink-soft shrink-0">
                        건강운
                      </span>
                    </div>
                    <h5 className="font-serif text-base sm:text-lg font-semibold text-ink leading-snug break-keep-all">
                      {narrative.lifeThemes.health.title}
                    </h5>
                    <p className="text-sm text-ink/90 font-medium leading-relaxed break-keep-all whitespace-pre-wrap pl-3 border-l-2 border-seal/30">
                      {narrative.lifeThemes.health.story}
                    </p>
                    {narrative.lifeThemes.health.tip && (
                      <div className="bg-sunken/60 rounded-xl p-3 sm:p-3.5 border border-line/60 flex flex-col items-start gap-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-seal/10 text-seal">
                          몸과 마음의 에너지를 회복하는 팁
                        </span>
                        <p className="text-xs text-ink-soft leading-relaxed break-keep-all font-medium w-full">
                          {narrative.lifeThemes.health.tip}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 제5장 · 직장 */}
                  <div className="bg-surface p-5 sm:p-5.5 rounded-2xl border border-line shadow-2xs space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <span className="w-6 h-6 rounded-lg bg-sunken flex items-center justify-center shrink-0">
                          <Briefcase className="w-3.5 h-3.5 text-seal" />
                        </span>
                        <span className="font-bold text-ink">제5장 · 잠재력이 폭발할 수 있는 가장 잘 어울리는 직업군</span>
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-sunken text-ink-soft shrink-0">
                        직장·사업운
                      </span>
                    </div>
                    <h5 className="font-serif text-base sm:text-lg font-semibold text-ink leading-snug break-keep-all">
                      {narrative.lifeThemes.career.title}
                    </h5>
                    <p className="text-sm text-ink/90 font-medium leading-relaxed break-keep-all whitespace-pre-wrap pl-3 border-l-2 border-seal/30">
                      {narrative.lifeThemes.career.story}
                    </p>
                    {narrative.lifeThemes.career.tip && (
                      <div className="bg-sunken/60 rounded-xl p-3 sm:p-3.5 border border-line/60 flex flex-col items-start gap-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-seal/10 text-seal">
                          직업적 잠재력을 극대화하는 조언
                        </span>
                        <p className="text-xs text-ink-soft leading-relaxed break-keep-all font-medium w-full">
                          {narrative.lifeThemes.career.tip}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 📜 [전환 구분자] 이야기에서 명리학적 근거로 넘어가는 챕터 브레이크 */}
            <div className="pt-6 pb-2 text-left">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-seal rounded-full" />
                <div>
                  <span className="text-[11px] font-mono tracking-widest uppercase text-seal font-bold block">
                    심층 해설편 · THE ROOTS & EVIDENCE
                  </span>
                  <h4 className="font-serif text-lg sm:text-xl font-bold text-ink tracking-tight">
                    왜 이런 기운이 흐르는가 · 명리학적 심층 근거
                  </h4>
                </div>
              </div>
              <p className="text-xs text-ink-faint mt-1.5 pl-4.5 leading-relaxed">
                "왜 내가 연애할 때 이런 감정을 겪고, 돈과 사람을 어떻게 대해야 할까?" — 앞서 풀어드린 다섯 갈래 이야기의 뿌리가 되는 사주 원국과 별의 배치를 조목조목 짚어드립니다.
              </p>
            </div>

            {/* 🏛️ [구간 2] 자세한 내용이 궁금하다면 서술식으로 알려주는 명리학적 근거 구간 (명암과 배경의 확실한 전환) */}
            <div className="bg-sunken/45 rounded-2xl p-4.5 sm:p-6 border border-line space-y-5">
              {/* 사주 일간(나) + 자미두수 명궁 2열 카드 (근거의 시발점) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Saju Daymaster card */}
                {daymaster && (
                  <div className="bg-surface p-4.5 rounded-xl flex flex-col justify-between border border-line shadow-2xs">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <span className={`w-11 h-11 shrink-0 rounded-xl bg-sunken font-serif text-xl font-semibold flex items-center justify-center shadow-xs ${getGanElementStyle(daymaster.gan).text}`}>
                          {daymaster.gan}
                        </span>
                        <div className="text-left">
                          <span className="text-xs font-medium text-ink-faint">사주 일간 (나의 뼈대)</span>
                          <h4 className="text-[15px] font-semibold text-ink mt-0.5">
                            {daymasterDetails[daymaster.gan]?.title || `${daymaster.gan} 기운`}
                          </h4>
                        </div>
                      </div>
                      <p className="text-xs text-ink font-semibold text-left">
                        핵심 키워드 · {daymasterDetails[daymaster.gan]?.keyword || "남다른 주체성과 미적 안목"}
                      </p>
                      <p className="text-sm text-ink-soft leading-relaxed text-left break-keep-all">
                        {daymasterDetails[daymaster.gan]?.desc || "나 자신을 상징하는 고귀한 기틀로, 섬세하고 창의적인 지혜와 예리한 비즈니스 통찰이 깃들어 있습니다."}
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-line text-xs text-ink-faint text-left">
                      일간 {daymaster.gan}은 사주 여덟 글자 중 나 자신의 본질을 다스리는 가장 중요한 뼈대입니다.
                    </div>
                  </div>
                )}

                {/* Ziwei Ming Gong Star card */}
                <div className="bg-surface p-4.5 rounded-xl flex flex-col justify-between border border-line shadow-2xs">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <span className="w-11 h-11 shrink-0 rounded-xl bg-sunken font-serif text-xl font-semibold text-ink flex items-center justify-center">
                        命
                      </span>
                      <div className="text-left">
                        <span className="text-xs font-medium text-ink-faint">자미두수 명궁命宮 (하늘의 별)</span>
                        <h4 className="text-[15px] font-semibold text-ink mt-0.5">
                          {(() => {
                            if (!ziwei || !ziwei.palaces) return "명성 가득한 성좌";
                            const mingGong = Object.values(ziwei.palaces).find(p => p.name === "命宮");
                            if (!mingGong) return "명성 가득한 성좌";
                            const mainStars = mingGong.stars.filter(s => s.type === "main");
                            if (mainStars.length === 0) return "안정적 독창성 (독좌 명반)";
                            return mainStars.map(s => s.nameKr).join("·") + " 성좌";
                          })()}
                        </h4>
                      </div>
                    </div>
                    
                    {(() => {
                      if (!ziwei || !ziwei.palaces) return null;
                      const mingGong = Object.values(ziwei.palaces).find(p => p.name === "命宮");
                      if (!mingGong) return null;
                      const mainStars = mingGong.stars.filter(s => s.type === "main");
                      
                      if (mainStars.length === 0) {
                        return (
                          <div className="space-y-1 text-left">
                            <p className="text-xs text-ink font-semibold">
                              핵심 키워드 · 온화한 환경 적응과 자급자족력
                            </p>
                            <p className="text-sm text-ink-soft leading-relaxed break-keep-all">
                              명궁에 주성이 없는 명반(무정지격)은 대자연의 에너지를 유연하게 받아안는 특별한 사교성과 흡수력을 가집니다. 상대방의 매력을 거울처럼 흡수해 내 것으로 다듬는 능력이 일품입니다.
                            </p>
                          </div>
                        );
                      }

                      const firstStar = mainStars[0].nameKr;
                      const info = ziweiStarDetails[firstStar];
                      return (
                        <div className="space-y-1 text-left">
                          <p className="text-xs text-ink font-semibold">
                            핵심 키워드 · {info ? info.title : `${firstStar}의 카리스마와 리더십`}
                          </p>
                          <p className="text-sm text-ink-soft leading-relaxed break-keep-all">
                            {info ? info.desc : "나의 인생 전체를 관장하는 하늘의 별빛으로, 높은 시선과 기품을 유지하여 사람들의 이목을 사로잡고 큰 뜻을 도모하기에 훌륭한 자질을 제공합니다."}
                          </p>
                        </div>
                      );
                    })()}

                    <div className="mt-3 pt-2.5 border-t border-line text-xs text-ink-faint text-left">
                      명궁命宮은 나에게 부여된 천명과 평생의 외적 페르소나를 규정합니다.
                    </div>
                  </div>
                </div>
              </div>

              {/* 서술식 심층 근거 3대 세부 카드 */}
              <div className="space-y-3 pt-1">
                {narrative.identity.coreEssence && (
                  <div className="bg-surface p-4.5 sm:p-5 rounded-xl border border-line shadow-2xs text-left space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="font-serif text-base font-bold text-ink">
                        타고난 성품 그릇과 본질적 지향점
                      </h5>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-sunken text-ink-faint shrink-0">
                        원국의 본질
                      </span>
                    </div>
                    <p className="text-sm text-ink-soft leading-relaxed break-keep-all">
                      {narrative.identity.coreEssence}
                    </p>
                  </div>
                )}

                {narrative.identity.thinkingPattern && (
                  <div className="bg-surface p-4.5 sm:p-5 rounded-xl border border-line shadow-2xs text-left space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="font-serif text-base font-bold text-ink">
                        내면의 사고방식 및 의사결정 패턴
                      </h5>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-sunken text-ink-faint shrink-0">
                        심리 메커니즘
                      </span>
                    </div>
                    <p className="text-sm text-ink-soft leading-relaxed break-keep-all">
                      {narrative.identity.thinkingPattern}
                    </p>
                  </div>
                )}

                {narrative.identity.ohaengBalance && (
                  <div className="bg-surface p-4.5 sm:p-5 rounded-xl border border-line shadow-2xs text-left space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="font-serif text-base font-bold text-ink">
                        오행 원국의 에너지 흐름 및 멘탈 완충 진단
                      </h5>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-sunken text-ink-faint shrink-0">
                        에너지 완충
                      </span>
                    </div>
                    <p className="text-sm text-ink-soft leading-relaxed break-keep-all">
                      {narrative.identity.ohaengBalance}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section C: 2. 지금 당신은 어떤 시기인가 (현재 대운과 삶의 파도) */}
          <div className="space-y-4 pt-5 border-t border-line text-left">
            <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-line">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-ink">
                  지금 당신은 어떤 시기인가
                </h3>
              </div>
              <span className="text-xs font-medium text-ink-faint">현재 대운과 삶의 파도</span>
            </div>

            {/* 대운 요약 배너 + 족집게 멘트 */}
            <div className="p-4 sm:p-5 rounded-xl bg-surface border border-line space-y-3">
              <div>
                <h4 className="font-serif text-base font-semibold text-ink leading-snug">
                  {narrative.season.seasonName}
                </h4>
                <p className="text-xs text-ink-faint mt-1">
                  현재 만 {narrative.season.age}세 기준 · {narrative.season.daewoonAge}세 시작 {narrative.season.daewoonGanzi} 대운 ({narrative.season.daewoonSipsin} · {narrative.season.daewoonUnseong})
                </p>
              </div>

              {narrative.season.punchySeasonQuote && (
                <p className="bg-sunken rounded-xl p-3.5 text-sm font-semibold text-ink leading-relaxed">
                  {narrative.season.punchySeasonQuote}
                </p>
              )}
            </div>

            {/* 시기적 상세 파도 해설 */}
            <div className="p-4 sm:p-4.5 rounded-xl bg-surface border border-line space-y-2">
              <p className="text-xs font-semibold text-ink flex items-center gap-1.5">
                지금 당신의 마음 밑바닥에서 요동치는 변화의 이유
              </p>
              <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">
                {narrative.season.seasonDetail}
              </p>
            </div>

            {/* 지금 시기의 행동 지침 (DO) & 경계 수칙 (DON'T) 2분할 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4.5 rounded-xl bg-sunken flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-sunken text-ink flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4 text-ink" />
                </span>
                <div>
                  <span className="text-xs font-semibold text-ink block mb-1">
                    지금 계절을 건너는 실전 행동 지침 (DO)
                  </span>
                  <p className="text-sm text-ink leading-relaxed font-medium">
                    {narrative.season.seasonAction}
                  </p>
                </div>
              </div>

              {narrative.season.seasonCaution && (
                <div className="p-4.5 rounded-xl bg-sunken flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-sunken text-ink flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="w-4 h-4 text-ink" />
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-ink block mb-1">
                      반드시 주의해야 할 마음의 함정 (DON'T)
                    </span>
                    <p className="text-sm text-ink leading-relaxed font-medium">
                      {narrative.season.seasonCaution}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
              [유료 심층 챕터 3 ~ 6: 무료분의 서사를 완벽히 계승한 5/6 심층 처방전]
              - 미해금 시: 부드러운 블러 + 글래스모피즘 해금 카드
              - 해금 시: 동일 세션에서 블러만 스르륵 해제되어 전체 에세이 완결
             ========================================================================= */}
          <div className="space-y-6 pt-4 border-t border-line text-left">
            <div className="relative">
              {/* 블러 래퍼 (미해금 시 높이 제한 + 블러 + 클릭 비활성화하여 거대 여백 방지) */}
              <div className={isPremium ? "space-y-6" : "space-y-6 max-h-[460px] overflow-hidden filter blur-[4px] opacity-40 select-none pointer-events-none transition-all duration-700"}>
            {/* 인생의 계단 — 대운 10년 주기 파노라마.
                지나온 단계는 옅게, 지금 단계는 진하게. 수묵의 원근을 농도로 표현한다
                (design.md §1 "원근은 농도로"). AI v2 스키마에만 존재하므로 optional. */}
            {personalAnalysis?.life_stages && personalAnalysis.life_stages.length > 0 && (
              <div className="text-left border-t border-line pt-8 space-y-6">
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-semibold text-ink">
                    인생의 계단
                  </h3>
                  <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                    10년마다 바뀌는 운의 결을 따라, 지나온 자리와 지금 서 있는 자리를 짚습니다.
                  </p>
                </div>

                <ol className="space-y-0">
                  {personalAnalysis.life_stages.map((stage, sIdx) => {
                    const isPast = !stage.is_current && stage.age_to < (narrative.season.age ?? 0);
                    return (
                      <li key={sIdx} className="relative pl-7 pb-7 last:pb-0">
                        {/* 계단을 잇는 세로선 — 마지막 단계에는 그리지 않는다 */}
                        {sIdx < personalAnalysis.life_stages!.length - 1 && (
                          <span
                            aria-hidden="true"
                            className="absolute left-[5px] top-3 bottom-0 w-px bg-line"
                          />
                        )}
                        {/* 지금 단계만 인주, 나머지는 먹 농담 */}
                        <span
                          aria-hidden="true"
                          className={`absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full ${
                            stage.is_current ? "bg-seal" : isPast ? "bg-line" : "bg-ink-faint"
                          }`}
                        />
                        <div className={isPast ? "opacity-90" : ""}>
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-xs font-mono font-medium text-ink-soft">
                              {stage.age_from}~{stage.age_to}세
                            </span>
                            {stage.is_current && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-seal/10 text-seal">
                                지금
                              </span>
                            )}
                          </div>
                          <h4
                            className={`font-serif font-semibold text-ink mt-1 ${
                              stage.is_current ? "text-lg sm:text-xl text-ink font-bold" : "text-base text-ink"
                            }`}
                          >
                            {stage.title}
                          </h4>
                          <p className="text-sm text-ink/90 leading-relaxed mt-2 font-normal break-keep-all">
                            {stage.narrative}
                          </p>
                          {stage.link_to_next && (
                            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed mt-2.5 pl-3 border-l-2 border-line break-keep-all">
                              {stage.link_to_next}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
                
                {/* Chapter 3. 나를 부자로 만드는 핵심 무기와 돈 버는 구조 */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-line">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-ink">
                        나를 부자로 만드는 핵심 무기와 돈 버는 구조
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-ink-faint">재물 본능 & 머니 파이프라인</span>
                  </div>

                  {/* bridge — 앞 이야기를 이어받아 이 주제로 넘어오는 문장 (AI v2) */}
                  {personalAnalysis?.wealth?.bridge && (
                    <p className="text-sm text-ink-soft leading-relaxed">
                      {personalAnalysis.wealth.bridge}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-sunken p-4.5 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <span className="w-6 h-6 rounded-lg bg-sunken flex items-center justify-center">
                          <Zap className="w-3.5 h-3.5 text-ink" />
                        </span>
                        <span>나만의 치트키 무기</span>
                      </div>
                      <p className="text-sm text-ink leading-relaxed font-medium">
                        {narrative.wealthEngine.coreWeapon}
                      </p>
                    </div>

                    <div className="bg-sunken p-4.5 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <span className="w-6 h-6 rounded-lg bg-sunken flex items-center justify-center">
                          <DollarSign className="w-3.5 h-3.5 text-ink" />
                        </span>
                        <span>실전 머니 파이프라인</span>
                      </div>
                      <p className="text-sm text-ink leading-relaxed font-medium">
                        {narrative.wealthEngine.moneyPipeline}
                      </p>
                    </div>

                    <div className="bg-sunken p-4.5 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <span className="w-6 h-6 rounded-lg bg-sunken flex items-center justify-center">
                          <Briefcase className="w-3.5 h-3.5 text-ink" />
                        </span>
                        <span>최적의 일하는 방식</span>
                      </div>
                      <p className="text-sm text-ink leading-relaxed font-medium">
                        {narrative.wealthEngine.workStyle}
                      </p>
                    </div>
                  </div>

                  {/* career.bridge — 일(직장)에서 다음 주제로 넘어가는 문장.
                      직장은 독립 섹션이 없고 이 재물 블록 안에서 다뤄지므로 여기에 놓는다.
                      이 문장이 없으면 AI가 생성한 연결 고리 하나가 버려진다. */}
                  {personalAnalysis?.career?.bridge && (
                    <p className="text-sm text-ink-soft leading-relaxed">
                      {personalAnalysis.career.bridge}
                    </p>
                  )}
                </div>

                {(personalAnalysis?.love?.meeting_scene || personalAnalysis?.love?.friction_point) && (
                  <div className="space-y-4 pt-5 border-t border-line">
                    <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-line">
                      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-ink">
                        인연이 닿는 자리와 오래 가는 법
                      </h3>
                      <span className="text-xs font-medium text-ink-faint">연애 & 배우자운</span>
                    </div>
                    {personalAnalysis.love.bridge && (
                      <p className="text-sm text-ink-soft leading-relaxed">
                        {personalAnalysis.love.bridge}
                      </p>
                    )}
                    <div className="divide-y divide-line">
                      {personalAnalysis.love.meeting_scene && (
                        <div className="py-4 space-y-2">
                          <span className="text-[15px] font-semibold text-ink block">어디서 만나는가</span>
                          <p className="text-sm text-ink-soft leading-relaxed">{personalAnalysis.love.meeting_scene}</p>
                        </div>
                      )}
                      {personalAnalysis.love.friction_point && (
                        <div className="py-4 space-y-2">
                          <span className="text-[15px] font-semibold text-ink block">왜 부딪치고, 무엇을 합의해야 하는가</span>
                          <p className="text-sm text-ink-soft leading-relaxed">{personalAnalysis.love.friction_point}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 건강 — 일하는 방식이 몸에 닿는 지점 (AI v2) */}
                {(personalAnalysis?.health?.signal || personalAnalysis?.health?.recovery) && (
                  <div className="space-y-4 pt-5 border-t border-line">
                    <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-line">
                      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-ink">
                        몸이 먼저 보내는 신호
                      </h3>
                      <span className="text-xs font-medium text-ink-faint">건강 & 회복</span>
                    </div>
                    {personalAnalysis.health.bridge && (
                      <p className="text-sm text-ink-soft leading-relaxed">
                        {personalAnalysis.health.bridge}
                      </p>
                    )}
                    <div className="divide-y divide-line">
                      {personalAnalysis.health.signal && (
                        <div className="py-4 space-y-2">
                          <span className="text-[15px] font-semibold text-ink block">지칠 때 가장 먼저 오는 신호</span>
                          <p className="text-sm text-ink-soft leading-relaxed">{personalAnalysis.health.signal}</p>
                        </div>
                      )}
                      {personalAnalysis.health.recovery && (
                        <div className="py-4 space-y-2">
                          <span className="text-[15px] font-semibold text-ink block">진짜 회복이 일어나는 방식</span>
                          <p className="text-sm text-ink-soft leading-relaxed">{personalAnalysis.health.recovery}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Chapter 4. 앞으로 3년 내 맞이할 인생 타이밍 (대운 × 세운) */}
                <div className="space-y-4 pt-5 border-t border-line">
                  <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-line">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-ink">
                        앞으로 3년 내 맞이할 결정적 기회의 문 (2026 ~ 2028)
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-ink-faint">3개년 전략 로드맵</span>
                  </div>

                  <div className="space-y-3">
                    {/* 2026 */}
                    <div className="bg-surface p-4.5 rounded-xl border border-line space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          2026년 · {narrative.threeYearTiming.year2026.theme}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-xl bg-sunken text-ink font-semibold">
                          올해 운세
                        </span>
                      </div>
                      <p className="text-sm text-ink leading-relaxed">
                        {narrative.threeYearTiming.year2026.detail}
                      </p>
                      <div className="p-3 bg-sunken rounded-xl text-sm font-semibold text-ink flex items-start gap-2">
                        <span>실전 액션 : {narrative.threeYearTiming.year2026.action}</span>
                      </div>
                    </div>

                    {/* 2027 */}
                    <div className="bg-surface p-4.5 rounded-xl border border-line space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          2027년 · {narrative.threeYearTiming.year2027.theme}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-xl bg-sunken text-ink font-semibold">
                          내년 운세
                        </span>
                      </div>
                      <p className="text-sm text-ink leading-relaxed">
                        {narrative.threeYearTiming.year2027.detail}
                      </p>
                      <div className="p-3 bg-sunken rounded-xl text-sm font-semibold text-ink flex items-start gap-2">
                        <span>실전 액션 : {narrative.threeYearTiming.year2027.action}</span>
                      </div>
                    </div>

                    {/* 2028 */}
                    <div className="bg-surface p-4.5 rounded-xl border border-line space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          2028년 · {narrative.threeYearTiming.year2028.theme}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-xl bg-sunken text-ink font-semibold">
                          내후년 도약
                        </span>
                      </div>
                      <p className="text-sm text-ink leading-relaxed">
                        {narrative.threeYearTiming.year2028.detail}
                      </p>
                      <div className="p-3 bg-sunken rounded-xl text-sm font-semibold text-ink flex items-start gap-2">
                        <span>실전 액션 : {narrative.threeYearTiming.year2028.action}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chapter 5. 실전 사이다 처방전 · 인생 사용 설명서 */}
                <div className="space-y-4 pt-5 border-t border-line">
                  <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-line">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-ink">
                        실전 사이다 처방전 · 인생 사용 설명서
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-ink-faint">DO & DON'T 행동 강령</span>
                  </div>

                  {/* 핵심 진단 */}
                  <div className="p-4 sm:p-5 bg-sunken rounded-xl text-sm text-ink leading-relaxed font-semibold flex items-start gap-2.5">
                    <div>
                      <strong className="text-ink block mb-0.5">핵심 진단</strong>
                      <span>{narrative.prescription.coreSummary}</span>
                    </div>
                  </div>

                  {/* 3대 행동 강령 (DO) */}
                  <div className="bg-surface border border-line p-5 rounded-xl space-y-3.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                      <span className="w-6 h-6 rounded-lg bg-sunken flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-ink" />
                      </span>
                      <span>지금 당장 내 삶에서 취해야 할 3대 행동 (DO)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-sunken p-4 rounded-xl text-left space-y-1.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                            <Briefcase className="w-3.5 h-3.5 text-ink" />
                            <span>커리어 & 수익 창출</span>
                          </div>
                          <h5 className="text-xs font-semibold text-ink mt-1">{narrative.prescription.careerDo.title}</h5>
                          <p className="text-sm text-ink-soft leading-relaxed mt-1">{narrative.prescription.careerDo.desc}</p>
                        </div>
                      </div>

                      <div className="bg-sunken p-4 rounded-xl text-left space-y-1.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                            <DollarSign className="w-3.5 h-3.5 text-ink" />
                            <span>재물 & 자산 방어</span>
                          </div>
                          <h5 className="text-xs font-semibold text-ink mt-1">{narrative.prescription.wealthDo.title}</h5>
                          <p className="text-sm text-ink-soft leading-relaxed mt-1">{narrative.prescription.wealthDo.desc}</p>
                        </div>
                      </div>

                      <div className="bg-sunken p-4 rounded-xl text-left space-y-1.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                            <UserCheck className="w-3.5 h-3.5 text-ink" />
                            <span>인간관계 & 선 긋기</span>
                          </div>
                          <h5 className="text-xs font-semibold text-ink mt-1">{narrative.prescription.relationDo.title}</h5>
                          <p className="text-sm text-ink-soft leading-relaxed mt-1">{narrative.prescription.relationDo.desc}</p>
                        </div>
                      </div>
                    </div>

                    {/* 치명적 지뢰밭 (DON'T) */}
                    <div className="space-y-2.5 pt-3 border-t border-line">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <span className="w-6 h-6 rounded-lg bg-sunken flex items-center justify-center">
                          <ShieldAlert className="w-3.5 h-3.5 text-ink" />
                        </span>
                        <span>올해 절대 하지 말아야 할 치명적 지뢰밭 (DON'T)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {narrative.prescription.criticalDont.map((dont, dIdx) => (
                          <div key={dIdx} className="bg-sunken p-3.5 rounded-xl text-left space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                              <Ban className="w-3.5 h-3.5 text-ink" />
                              <span>{dont.title}</span>
                            </div>
                            <p className="text-sm text-ink leading-relaxed font-medium">{dont.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 한 줄 핵심 공식 */}
                    <div className="p-3.5 sm:p-4 bg-sunken rounded-xl text-sm text-ink font-semibold flex items-center gap-2.5">
                      <Target className="w-4 h-4 text-ink shrink-0" />
                      <span>{narrative.prescription.breakthroughFormula}</span>
                    </div>
                  </div>
                </div>

                {/* Chapter 6. 평생을 지배하는 귀인과 피해야 할 악연의 조건 */}
                <div className="space-y-4 pt-5 border-t border-line">
                  <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-line">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-ink">
                        평생을 지배하는 귀인과 피해야 할 악연의 조건
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-ink-faint">인간관계 필터링</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* 귀인 */}
                    <div className="bg-sunken p-4.5 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <span className="w-6 h-6 rounded-lg bg-sunken flex items-center justify-center">
                          <UserCheck className="w-3.5 h-3.5 text-ink" />
                        </span>
                        <span>나를 살리는 진짜 귀인의 특징</span>
                      </div>
                      <p className="text-sm text-ink leading-relaxed font-medium">
                        {narrative.relationshipFilter.nobleTraits}
                      </p>
                    </div>

                    {/* 악연 */}
                    <div className="bg-sunken p-4.5 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <span className="w-6 h-6 rounded-lg bg-sunken flex items-center justify-center">
                          <UserX className="w-3.5 h-3.5 text-ink" />
                        </span>
                        <span>내 피를 말리는 피해야 할 악연의 패턴</span>
                      </div>
                      <p className="text-sm text-ink leading-relaxed font-medium">
                        {narrative.relationshipFilter.toxicTraits}
                      </p>
                    </div>
                  </div>

                  {/* 선 긋기 원칙 */}
                  <div className="p-4 sm:p-4.5 rounded-xl bg-surface border border-line text-left space-y-1.5">
                    <p className="text-xs font-semibold text-ink flex items-center gap-1.5">
                      평생 후회 없는 인간관계 선 긋기 절대 공식
                    </p>
                    <p className="text-sm text-ink font-semibold leading-relaxed pl-5">
                      {narrative.relationshipFilter.boundaryRule}
                    </p>
                  </div>
                </div>

                {/* 연애 — 앞의 인간관계 이야기를 이어받는다 (AI v2) */}

                {/* 닫는 말 — 네 갈래를 한 문단으로 봉합한다 (AI v2) */}
                {personalAnalysis?.closing && (
                  <div className="pt-6 border-t border-line">
                    <blockquote className="border-l-2 border-seal pl-5">
                      <p className="font-serif text-base sm:text-lg text-ink leading-relaxed">
                        {personalAnalysis.closing}
                      </p>
                    </blockquote>
                  </div>
                )}


              </div>

              {/* 미해금 시 글래스모피즘 플로팅 해금 카드 */}
              {!isPremium && (
                <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-gradient-to-b from-transparent via-surface/80 to-surface rounded-xl">
                  <div className="bg-surface/95 border border-line shadow-2xl rounded-xl p-6 sm:p-7 max-w-md w-full text-center space-y-4 animate-fade-in backdrop-blur-md">
                    <div className="w-12 h-12 rounded-xl bg-seal/10 text-seal mx-auto flex items-center justify-center shadow-inner">
                      <Crown className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-seal/10 text-seal text-xs font-semibold font-mono tracking-wider border border-seal/20">
                        심층 평생 감정서 · 실전 처방전
                      </span>
                      <h4 className="font-serif text-lg font-semibold text-ink">
                        실전 사이다 솔루션 열람하기
                      </h4>
                      <p className="text-sm text-ink-soft leading-relaxed">
                        {narrative.bridgePrompt}
                      </p>
                    </div>

                    {/* 해금 액션: 확인권 버튼 또는 쿠폰 입력 */}
                    <div className="pt-2 space-y-3">
                      {hasTicket ? (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={onUnlockWithTicket}
                            className="w-full py-3.5 px-4 rounded-xl bg-seal hover:bg-seal-deep text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>확인권 1장으로 지금 즉시 열람</span>
                          </button>
                          <p className="text-xs text-ink-faint">
                            보유 확인권 {ticketCount}장 · 열람 즉시 블러가 제거됩니다.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5 text-left bg-sunken p-4 rounded-xl">
                          <p className="text-sm text-ink-soft leading-relaxed">
                            쿠폰 번호를 등록하면 화면 이동 없이 이 자리에서 즉시 해금됩니다.
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={localCouponInput}
                              onChange={(e) => setLocalCouponInput(e.target.value.toUpperCase())}
                              placeholder="쿠폰 번호 입력"
                              maxLength={20}
                              className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-ink bg-surface text-ink font-mono uppercase text-center placeholder:text-ink-faint border border-line"
                            />
                            <button
                              type="button"
                              onClick={() => onApplyCoupon?.(localCouponInput)}
                              disabled={couponLoading || !localCouponInput.trim()}
                              className="px-4 py-2 bg-seal hover:bg-seal-deep disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shrink-0"
                            >
                              {couponLoading ? "등록 중..." : "등록"}
                            </button>
                          </div>
                          {couponError && (
                            <p className="text-xs text-seal font-medium text-center mt-1">
                              {couponError}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =========================================================================
              [바텀 하단: 전문 명리학적 분석 근거 및 학술적 배경 설명]
              - 번잡하지 않도록 아코디언(접이식)으로 감싸 필요할 때만 신뢰도 확인
             ========================================================================= */}
          <details className="group pt-5 border-t border-line space-y-3 text-left">
            <summary className="flex items-center justify-between cursor-pointer list-none p-4 rounded-xl bg-sunken/60 hover:bg-sunken transition-colors select-none">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-surface border border-line flex items-center justify-center text-ink-soft shrink-0">
                  <BookOpen className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-serif text-sm font-semibold text-ink">
                    이 분석은 어떻게 도출되었는가? (명리학·자미두수 산출 근거)
                  </h4>
                  <p className="text-xs sm:text-xs text-ink-faint">
                    적천수·자평진전 3대 고전과 북송 자미두수 14정성 및 융 심리학 연계 공식
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-ink-faint transition-transform group-open:rotate-180 shrink-0" />
            </summary>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {/* 1. 사주 일주론 & 지장간 */}
              <div className="bg-sunken p-3.5 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <Award className="w-3.5 h-3.5 text-seal" />
                  <span>1. 정통 사주 일주론(日柱論) 및 지장간 암장 해독</span>
                </div>
                <p className="text-sm text-ink-soft leading-relaxed">
                  {narrative.astrologicalBasis.pillarBasis}
                </p>
              </div>

              {/* 2. 10년 대운 절기 산출 */}
              <div className="bg-sunken p-3.5 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <Compass className="w-3.5 h-3.5 text-ink" />
                  <span>2. 24절기 천문 역법 기반 10년 대운(大運) 산출식</span>
                </div>
                <p className="text-sm text-ink-soft leading-relaxed">
                  {narrative.astrologicalBasis.daewoonBasis}
                </p>
              </div>

              {/* 3. 자미두수 14정성 */}
              <div className="bg-sunken p-3.5 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <Sparkles className="w-3.5 h-3.5 text-ink" />
                  <span>3. 송대 정통 자미두수(紫微斗數) 14정성 배치학</span>
                </div>
                <p className="text-sm text-ink-soft leading-relaxed">
                  {narrative.astrologicalBasis.ziweiBasis}
                </p>
              </div>

              {/* 4. 현대 심리 지표 교차 검증 */}
              <div className="bg-sunken p-3.5 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  <span>4. 융(Jung) 분석심리학 페르소나 교차 검증</span>
                </div>
                <p className="text-sm text-ink-soft leading-relaxed">
                  {narrative.astrologicalBasis.psychologicalBasis}
                </p>
              </div>
            </div>
          </details>
        </div>
      ) : currentTab === "saju" ? (
        <>
          {/* Title */}
          <h2 className="text-center font-serif text-lg font-semibold tracking-tight text-ink pt-1">
            만세력 명식표命式表
          </h2>

          {/* Birthplace & Solar Time Correction Section */}
          {birthplace && (
            <div className="bg-sunken px-4 py-3 rounded-xl text-left space-y-1">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="font-semibold text-ink">
                  출생지 보정
                </span>
                <span className="text-xs font-medium text-ink-soft bg-surface px-2 py-0.5 rounded-md">
                  진태양시 {solar_correction_minutes && solar_correction_minutes >= 0 ? `+${solar_correction_minutes}` : solar_correction_minutes}분 조정
                </span>
              </div>
              <p className="text-sm text-ink-soft leading-relaxed">
                {birthplace.name} 출생 (경도 {birthplace.lon.toFixed(2)}°) · 입력 시각을 실제 태양시({solar_birth_time}) 기준으로 보정해 계산했습니다.
              </p>
            </div>
          )}

          {/* Saju Pillars Table */}
          <div className="border border-line rounded-xl overflow-hidden select-none text-center">
            {/* Header row */}
            <div className="grid grid-cols-4 divide-x divide-line bg-sunken">
              <div className="py-2 text-xs font-medium text-ink-soft">시주</div>
              <div className="py-2 text-xs font-semibold text-seal">일주 (나)</div>
              <div className="py-2 text-xs font-medium text-ink-soft">월주</div>
              <div className="py-2 text-xs font-medium text-ink-soft">연주</div>
            </div>

            {/* 천간 row */}
            <div className="grid grid-cols-4 divide-x divide-line border-t border-line bg-surface">
              {pillars.hour ? (
                <div className="py-3 flex flex-col items-center gap-0.5">
                  <span className={`font-serif text-2xl font-semibold ${getGanElementStyle(pillars.hour.gan).text}`}>{pillars.hour.gan}</span>
                  <span className="text-xs text-ink-faint">{daymasterMap[pillars.hour.gan]?.element || ""}</span>
                </div>
              ) : (
                <div className="py-3 flex items-center justify-center text-xs text-ink-faint">미입력</div>
              )}
              <div className="py-3 flex flex-col items-center gap-0.5">
                <span className={`font-serif text-2xl font-semibold ${getGanElementStyle(pillars.day.gan).text}`}>{pillars.day.gan}</span>
                <span className="text-xs text-ink-faint">일간 (나)</span>
              </div>
              <div className="py-3 flex flex-col items-center gap-0.5">
                <span className={`font-serif text-2xl font-semibold ${getGanElementStyle(pillars.month.gan).text}`}>{pillars.month.gan}</span>
                <span className="text-xs text-ink-faint">{daymasterMap[pillars.month.gan]?.element || ""}</span>
              </div>
              <div className="py-3 flex flex-col items-center gap-0.5">
                <span className={`font-serif text-2xl font-semibold ${getGanElementStyle(pillars.year.gan).text}`}>{pillars.year.gan}</span>
                <span className="text-xs text-ink-faint">{daymasterMap[pillars.year.gan]?.element || ""}</span>
              </div>
            </div>

            {/* 지지 row */}
            <div className="grid grid-cols-4 divide-x divide-line border-t border-line bg-surface">
              {pillars.hour ? (
                <div className="py-3 flex items-center justify-center">
                  <span className={`font-serif text-2xl font-semibold ${getJiElementStyle(pillars.hour.ji).text}`}>{pillars.hour.ji}</span>
                </div>
              ) : (
                <div className="py-3 flex items-center justify-center text-xs text-ink-faint">—</div>
              )}
              <div className="py-3 flex items-center justify-center">
                <span className={`font-serif text-2xl font-semibold ${getJiElementStyle(pillars.day.ji).text}`}>{pillars.day.ji}</span>
              </div>
              <div className="py-3 flex items-center justify-center">
                <span className={`font-serif text-2xl font-semibold ${getJiElementStyle(pillars.month.ji).text}`}>{pillars.month.ji}</span>
              </div>
              <div className="py-3 flex items-center justify-center">
                <span className={`font-serif text-2xl font-semibold ${getJiElementStyle(pillars.year.ji).text}`}>{pillars.year.ji}</span>
              </div>
            </div>
          </div>

          {/* Saju character detail box */}
          <div className="bg-sunken p-3 rounded-xl text-center">
            <div className="text-xs text-ink-soft flex flex-col sm:flex-row justify-center items-center gap-1.5">
              <span>나를 상징하는 일간(본원)</span>
              <span className="font-serif font-semibold text-sm text-ink">
                {daymaster.gan} ({daymasterMeta?.name})
              </span>
              {daymasterMeta?.animal && (
                <span className="inline-block px-2 py-0.5 text-xs bg-surface rounded-md text-ink-soft font-medium">
                  {daymasterMeta.animal}
                </span>
              )}
            </div>
          </div>

          {/* Premium Pillars Detail Table */}
          {pillars_detail && (
            <div className="space-y-3 text-left pt-2">
              <div className="text-xs font-medium text-ink-soft text-center">
                주별 십신·12운성 상세 풀이
              </div>
              <div className="grid grid-cols-1 gap-3">
                {pillars_detail.map((p, idx) => (
                  <div key={idx} className="bg-sunken p-4 rounded-xl flex flex-col gap-2.5">
                    <div className="flex justify-between items-center flex-wrap gap-1.5 border-b border-line pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block text-xs font-semibold ${
                          p.type === "일주" ? "text-seal" : "text-ink"
                        }`}>
                          {p.type}
                        </span>
                        <span className="font-serif text-sm font-semibold text-ink">{p.ganzi}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs bg-surface px-2 py-0.5 rounded-md font-medium text-ink-soft">
                          {p.stemSipsin === "일간 (나)" ? "본원" : p.stemSipsin} / {p.branchSipsin}
                        </span>
                        <span className="text-xs bg-surface px-2 py-0.5 rounded-md font-medium text-ink">
                          {p.unseong}
                        </span>
                      </div>
                    </div>

                    {/* Highly descriptive interpretation of what this pillar means for the user */}
                    <div className="bg-surface p-3.5 rounded-xl text-sm text-ink-soft leading-relaxed">
                      <p>
                        <span className="font-semibold text-ink mr-1">해설 ·</span>
                        {p.type === "일주" ? (
                          <>
                            <strong>나 자신(본질)</strong>을 상징하는 가장 핵심적인 기둥입니다. 
                            일지에 <strong>{p.branchSipsin}</strong>을 품어 {
                              p.branchSipsin === "상관" ? "예술적이고 창의적이며 영민하고, 개성 가득한 표현력과 훌륭한 언변이 특기입니다." :
                              p.branchSipsin === "식신" ? "넉넉한 인품과 의식주의 여유, 그리고 일상의 소소한 행복을 가꿔내는 능력이 탁월합니다." :
                              p.branchSipsin === "정재" ? "정직하고 알뜰한 자산 관리력과 깊은 신용을 바탕으로 성실하고 든든하게 부를 축적합니다." :
                              p.branchSipsin === "편재" ? "넓은 활동무대와 남다른 사업적/금융적 통찰력을 발휘하여 역동적인 기회를 선도합니다." :
                              p.branchSipsin === "정관" ? "바르고 모범적인 성품을 유지하며 명예와 공적 규율을 준수해 사회적 신망을 얻습니다." :
                              p.branchSipsin === "편관" ? "카리스마 넘치는 강한 책임감을 가지며 스스로를 단련하여 매사 솔선수범하는 기운입니다." :
                              p.branchSipsin === "정인" ? "따뜻한 도덕성과 부모님 같은 든든한 학문/문서의 지원을 수혜하는 기품을 지녔습니다." :
                              p.branchSipsin === "편인" ? "독창적이고 예리한 직관력과 학문/예술 등 특정 기술 영역에 대단한 깊이로 몰입하는 천재성을 띱니다." :
                              "나와 대등한 동료들과의 유대 및 뚝심 있는 독립심으로 주체적인 인생 개척을 추진합니다."
                            } 
                            생명 주기의 활력인 12운성은 <strong>{p.unseong}</strong>으로, {
                              p.unseong === "목욕" ? "도화의 기운처럼 때를 벗겨내듯 타인에게 나의 수려한 매력을 뽐내고 사교적 활력이 최고조로 돋보이는 상태를 의미합니다." :
                              p.unseong === "관대" ? "패기 넘치는 의관을 갖춘 청년처럼 힘찬 에너지와 도전정신이 넘쳐나 거칠 것 없이 나아가는 열정입니다." :
                              p.unseong === "건록" ? "벼슬길에 나아간 정치가처럼 인생의 가장 안정적이고 실질적인 주체적 자립과 전성기를 일구는 길운입니다." :
                              p.unseong === "제왕" ? "절정의 지휘력을 갖춘 우두머리처럼 막강한 주체성과 통솔력, 독립적인 기세를 가졌습니다." :
                              p.unseong === "장생" ? "세상의 큰 축복을 받으며 막 태어난 어린아이처럼 귀인의 풍성한 사랑과 물질적 인덕이 끊임없는 행운입니다." :
                              "원숙하고 차분한 지혜와 탁월한 위기관리력으로 세상을 깊이 관조하며 내적 자산을 두터이 쌓는 깊은 상태입니다."
                            }
                            {p.jigang && <span className="block mt-1.5 text-xs text-ink-faint">지장간 ({p.jigang}) · 지장간은 내면 깊숙이 숨어 있는 잠재의식적 욕구와 재능 기운을 뜻합니다.</span>}
                          </>
                        ) : p.type === "월주" ? (
                          <>
                            사회적 성향과 <strong>커리어(직업)의 방향성</strong>, 그리고 부모/형제운을 뜻합니다. 
                            천간의 <strong>{p.stemSipsin === "일간 (나)" ? "본원" : p.stemSipsin}</strong>과 지지의 <strong>{p.branchSipsin}</strong>이 결합하여 {
                              p.stemSipsin === "편재" || p.stemSipsin === "정재" ? "현실적 성취욕이 매우 뚜렷하고 금융, 투자, 비즈니스 분야에서 우수한 수완을 보여주며" :
                              p.stemSipsin === "정관" || p.stemSipsin === "편관" ? "사회적인 체면과 공공의 신뢰, 규율 있는 공직이나 대기업 직무에서 주도적 성공을 이루며" :
                              p.stemSipsin === "상관" || p.stemSipsin === "식신" ? "창의적인 설계, 전문 기술, 뛰어난 마케팅/소통 능력을 주무기로 삼아 영역을 주도적으로 확장하며" :
                              p.stemSipsin === "정인" || p.stemSipsin === "편인" ? "자격증, 깊은 학위, 브랜드 라이선스, 기획력 등 무형 자산을 바탕으로 교육/학술계에 우뚝 서는" :
                              "강한 주체성과 추진력, 혹은 동료들과의 긴밀한 협력 네트워크를 통하여 스스로 자립해 나가는"
                            } 성향이 사회적 직업 세계에서 강렬하게 표출됩니다. 12운성 <strong>{p.unseong}</strong>의 든든한 기반 위에 작용합니다.
                          </>
                        ) : p.type === "연주" ? (
                          <>
                            가문의 기운, 조상의 음덕, 그리고 <strong>어린 시절의 거시적인 환경</strong>을 의미합니다. 
                            귀하가 자란 근간에는 {
                              p.stemSipsin === "편재" || p.branchSipsin === "편재" || p.stemSipsin === "정재" || p.branchSipsin === "정재" ? "실용적인 부의 소유나 경제적 수완에 남들보다 일찍 눈떴던 흐름" :
                              p.stemSipsin === "정관" || p.branchSipsin === "정관" || p.stemSipsin === "편관" || p.branchSipsin === "편관" ? "도덕적이고 바른 예의범절 속에서 올곧은 리더십을 조기에 다졌던 환경" :
                              p.stemSipsin === "정인" || p.branchSipsin === "정인" || p.stemSipsin === "편인" || p.branchSipsin === "편인" ? "부모 및 조상의 따뜻한 지혜와 학문적 세례를 풍부히 받아 내적 토대를 기른 축복" :
                              "남달리 자유롭고 감각적인 창의성, 또는 자립심 강한 돌파력으로 개성 있게 자라난 기틀"
                            }이 자리해 있습니다. 12운성 <strong>{p.unseong}</strong>의 에너지가 유년기의 든든한 성장 배경이 되었습니다.
                          </>
                        ) : (
                          <>
                            인생의 후반기, 말년의 결실 및 <strong>지극히 개인적인 비밀 지향점(자녀/후배 포함)</strong>을 의미합니다. 
                            인생이 깊어질수록 귀하는 {
                              p.stemSipsin === "정인" || p.branchSipsin === "정인" || p.stemSipsin === "편인" || p.branchSipsin === "편인" ? "편안하게 저술/창작 연구에 몰입하고 임대, 지적재산 등 알짜배기 문서 자산을 소유하여 평화롭게 복을 누리는 모습" :
                              p.stemSipsin === "편재" || p.branchSipsin === "편재" || p.stemSipsin === "정재" || p.branchSipsin === "정재" ? "말년까지 유쾌한 비즈니스를 주도하거나 자산을 현명하게 순환시키며 실속과 부를 가득히 거머쥐는 모습" :
                              p.stemSipsin === "정관" || p.branchSipsin === "정관" || p.stemSipsin === "편관" || p.branchSipsin === "편관" ? "풍부한 사회적 공로를 통해 고문으로서 훌륭한 자격을 다져 많은 후배의 존경과 따뜻한 명예를 누리는 품격" :
                              "독창적인 취미 생활을 통해 삶을 소년소녀처럼 즐겁게 만끽하고 주변 사람에게 무한한 긍정적 영감을 나누는 축복"
                            }을 단단하게 맞이하게 될 것입니다. 12운성 <strong>{p.unseong}</strong>의 조화로운 마무리가 든든하게 지탱해 줍니다.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sipseong Strength */}
          {sipseong_strength && (
            <div className="space-y-3 text-left pt-4 border-t border-line">
              <div className="text-xs font-medium text-ink-soft text-center">
                십성 강약 분포
              </div>
              <div className="grid grid-cols-1 gap-2.5 bg-sunken p-4 rounded-xl">
                {Object.entries(sipseong_strength).map(([name, val]) => (
                  <div key={name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-medium text-ink">
                        {name} <span className="text-xs font-normal text-ink-faint ml-1">({getSipseongExplanation(name)})</span>
                      </span>
                      <span className="font-mono font-medium text-ink shrink-0">{val}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface rounded-xl overflow-hidden">
                      <div
                        className="h-full bg-ink/70 rounded-xl transition-all duration-500"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special Shinsal */}
          {special_sals_list && special_sals_list.length > 0 && (
            <div className="space-y-3 text-left pt-4 border-t border-line">
              <div className="text-xs font-medium text-ink-soft text-center">
                주요 신살·귀인 기운 해설
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {special_sals_list.map((sal, idx) => {
                  const matchedKey = Object.keys(shinsalExplanations).find(key => sal.includes(key));
                  const info = matchedKey ? shinsalExplanations[matchedKey] : null;

                  return (
                    <div key={idx} className="bg-sunken p-4 rounded-xl">
                      <div className="space-y-1 text-left">
                        <p className="font-semibold text-sm text-ink">
                          {info ? info.label : sal}
                        </p>
                        <p className="text-xs text-ink font-medium">
                          {info ? info.desc : "나의 삶에 특별한 복록을 돕는 기운입니다."}
                        </p>
                        <p className="text-sm text-ink-soft leading-relaxed">
                          {info ? info.detail : "인생의 여정에서 훌륭한 길잡이 역할을 하며 예상치 못한 축복과 번영을 불러옵니다."}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daewoon Scroll Grid */}
          {daewoon && !hideMix && (
            <div className="space-y-3 text-left pt-4 border-t border-line">
              <div className="text-xs text-center flex items-center justify-between gap-2">
                <span className="font-medium text-ink-soft">평생 대운大運 흐름 (10년 주기)</span>
                {isPremium && (
                  <span className="text-xs text-ink-faint">카드를 누르면 상세 풀이가 열립니다</span>
                )}
              </div>

              {!isPremium ? (
                <div className="bg-sunken p-6 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-surface text-ink-soft mx-auto flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-ink">
                    평생 대운 흐름도
                  </h4>
                  <p className="text-sm text-ink-soft leading-relaxed max-w-sm mx-auto">
                    일생을 이끄는 10년 주기 대운 표와 구간별 십성·12운성 풀이는 평생 감정서에서 확인할 수 있어요.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 overflow-x-auto pb-2.5 items-stretch">
                    {daewoon.map((item, idx) => {
                      const isCurrent = currentAge >= item.age && currentAge <= (daewoon[idx+1] ? daewoon[idx+1].age - 1 : item.age + 9);
                      const isSelected = selectedDaewoonIdx === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedDaewoonIdx(idx)}
                          className={`min-w-[105px] flex-shrink-0 p-3 rounded-xl text-center flex flex-col justify-between transition-all cursor-pointer relative ${
                            isSelected
                              ? "bg-seal text-white shadow-xs"
                              : isCurrent
                              ? "bg-sunken text-ink ring-1.5 ring-seal/50 hover:bg-line/60"
                              : "bg-sunken text-ink hover:bg-line/60"
                          }`}
                        >
                          {/* 상단 고정 높이 뱃지 슬롯: 모든 카드의 세로 기준선을 완벽히 일치 */}
                          <div className="h-5 flex items-center justify-center mb-1">
                            {isCurrent ? (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap leading-none ${
                                  isSelected
                                    ? "bg-white text-seal font-black"
                                    : "bg-seal text-white"
                                }`}
                              >
                                현재 대운
                              </span>
                            ) : (
                              <span className="text-[10px] py-0.5 opacity-0 select-none pointer-events-none leading-none">
                                대운
                              </span>
                            )}
                          </div>

                          <div className={`text-xs font-medium ${isSelected ? "text-white/80" : "text-ink-faint"}`}>
                            {item.age}세 대운
                          </div>

                          <div className="font-serif text-base font-semibold my-1">{item.ganzi}</div>

                          <div className={`text-xs leading-none ${isSelected ? "text-white/80" : "text-ink-soft"}`}>
                            {item.stemSipsin}/{item.branchSipsin}
                          </div>

                          <div className={`text-xs rounded-md py-0.5 font-medium mt-1.5 ${
                            isSelected ? "bg-white/20 text-white" : "bg-surface text-ink-soft"
                          }`}>
                            {item.unseong}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Saju Decadal Luck Detailed Guide */}
                  {selectedDaewoonIdx !== null && daewoon[selectedDaewoonIdx] && (() => {
                    const item = daewoon[selectedDaewoonIdx];
                    const isCurrent = currentAge >= item.age && currentAge <= (daewoon[selectedDaewoonIdx + 1] ? daewoon[selectedDaewoonIdx + 1].age - 1 : item.age + 9);
                    
                    // Detailed interpretation generation based on Sipsin and 12unseong
                    const activeSipsinTheme = item.stemSipsin === "비견" || item.stemSipsin === "겁재" || item.branchSipsin === "비견" || item.branchSipsin === "겁재" ? "비겁" :
                                              item.stemSipsin === "식신" || item.stemSipsin === "상관" || item.branchSipsin === "식신" || item.branchSipsin === "상관" ? "식상" :
                                              item.stemSipsin === "정재" || item.stemSipsin === "편재" || item.branchSipsin === "정재" || item.branchSipsin === "편재" ? "재성" :
                                              item.stemSipsin === "정관" || item.stemSipsin === "편관" || item.branchSipsin === "정관" || item.branchSipsin === "편관" ? "관성" : "인성";

                    const sipsinText = 
                      activeSipsinTheme === "비겁" ? "나 자신의 독립심과 주체성이 극대화되어 스스로 무언가를 창조하고 뚝심 있게 관철시키는 리더십의 10년입니다. 동업이나 경쟁 등 인간관계의 조율을 잘 다스리면 엄청난 자립 성과를 얻게 됩니다." :
                      activeSipsinTheme === "식상" ? "나의 천재성과 창의력, 기획 능력이 날개를 달아 거침없이 세상에 표현되는 아주 역동적인 10년입니다. 배움과 연구, 새로운 일을 벌이거나 사업을 확장해나가기에 가장 매끄러운 에너지입니다." :
                      activeSipsinTheme === "재성" ? "풍성한 재물과 가시적인 결과물이 실속 있게 영그는 일생일대의 황금기입니다. 비즈니스적 통찰이 늘고 노련한 현금 흐름 창출을 이뤄내며, 성실하게 부의 도약을 축적하기에 안성맞춤입니다." :
                      activeSipsinTheme === "관성" ? "사회적인 명예와 책임 있는 높은 지위, 탄탄한 조직 내의 인정을 거머쥐는 최고의 커리어 성공 흐름입니다. 중요한 라이선스를 따내거나 승진, 임용 등 정당하고 공적인 명예를 굳세게 지켜냅니다." :
                      "내적인 공부와 지혜를 듬뿍 쌓고, 귀인의 무조건적인 원조와 도움을 받아 탄탄하게 문서를 확보하는 실속 내실기입니다. 조급하게 행동하기보다 실력을 성숙하게 가다듬어 한 단계 인생 품격을 끌어올립니다.";

                    const unseongText = 
                      item.unseong === "장생" || item.unseong === "목욕" ? "마치 주변의 따뜻한 관심과 큰 인덕 속에 화려하게 주목받으며, 기분 좋고 트렌디하게 나 자신을 발산하는 쾌활하고 발랄한 생명 주기입니다." :
                      item.unseong === "관대" || item.unseong === "건록" || item.unseong === "제왕" ? "사주 기운 중 기세가 가장 단단하고 위세 높은 전성기로, 강력한 주관과 굳건한 추진력을 통하여 높은 사회적 빌딩을 일구는 당찬 추진 시기입니다." :
                      item.unseong === "쇠" || item.unseong === "양" || item.unseong === "태" ? "무리한 대외적 충돌을 피하고 주변과 부드럽게 상생하며, 지혜롭고 영민한 지혜와 통찰력으로 내실을 조화롭게 확보하는 안정 지향적 시기입니다." :
                      item.unseong === "병" || item.unseong === "사" || item.unseong === "묘" ? "생각과 깊이가 아주 깊어져서 학문적/예술적 창조성을 드높이고, 불필요한 지출 대신 철저한 실속 저축을 통하여 비공개적 자산 가치를 완벽히 다져놓는 알짜배기 시기입니다." :
                      "기존의 어수선한 껍질을 말끔히 허물어내고, 백지 위에서 완전히 신선한 새출발의 큰 꿈과 장기 기획을 안전하게 설계하기에 제격인 소중한 기획 시기입니다.";

                    return (
                      <div className="bg-sunken p-4 rounded-xl space-y-3 text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                          <div>
                            <span className="text-xs text-ink-faint">
                              {item.age}세 ~ {item.age + 9}세 10년 대운
                            </span>
                            <h4 className="text-sm font-semibold text-ink mt-1">
                              <span className="font-serif">{item.ganzi}</span> 대운 · {item.stemSipsin}/{item.branchSipsin} ({item.unseong})
                            </h4>
                          </div>
                          <div className="text-left sm:text-right">
                            {isCurrent && (
                              <span className="inline-block text-xs font-semibold text-seal">
                                현재 지나고 있는 구간
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3 text-xs leading-relaxed text-ink-soft">
                          <div className="space-y-1.5">
                            <span className="font-medium text-ink text-xs block">십성 에너지 흐름 ({item.stemSipsin}/{item.branchSipsin})</span>
                            <p className="bg-surface p-3 rounded-xl text-ink-soft">
                              {sipsinText}
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <span className="font-medium text-ink text-xs block">12운성 활력 지표 ({item.unseong})</span>
                            <p className="bg-surface p-3 rounded-xl text-ink-soft">
                              {unseongText}
                            </p>
                          </div>

                          <p className="text-xs text-ink-faint">
                            대운大運은 10년마다 주어지는 인생의 큰 환경이에요. 타고난 사주원국이 이 흐름을 순조롭게 지나도록 중심을 지키는 것이 중요합니다.
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* Five Elements count dashboard */}
          <div className="mt-4 pt-4 border-t border-line">
            <div className="text-xs font-medium text-ink-soft text-center mb-2">
              사주 오행 기운 집계
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {Object.entries(ohaeng_count).map(([el, count]) => {
                const styles = elementColors[el] || elementColors["목"];
                return (
                  <div key={el} className="p-2.5 rounded-xl bg-sunken flex flex-col items-center">
                    <span className={`text-xs font-medium ${styles.text}`}>
                      {elementNames[el] || el}
                    </span>
                    <span className="text-sm font-mono font-semibold mt-0.5 text-ink">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Title */}
          <h2 className="text-center font-serif text-lg font-semibold tracking-tight text-ink pt-1">
            자미두수 명반命盤
          </h2>

          {!ziwei ? (
            <div className="bg-sunken p-6 rounded-xl text-center text-sm text-ink-soft space-y-2">
              <p className="font-semibold text-sm text-ink">태어난 시간을 입력하면 조회할 수 있어요</p>
              <p className="text-xs leading-relaxed">자미두수 명반 계산에는 출생 시각이 필요합니다. 가입·참여 시 태어난 시간을 선택해 주세요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Palace selection instruction */}
              <p className="text-xs text-center text-ink-faint leading-none">
                궁 칸을 누르면 아래에 별 해석이 열립니다
              </p>

              {/* 4x4 Traditional Palace Grid */}
              <div className="grid grid-cols-4 grid-rows-4 gap-1.5 sm:gap-2">
                {renderZiweiGridCells()}
              </div>

              {/* Selected Palace Interpretation Card */}
              {selectedPalace && ziwei.palaces[selectedPalace] && (
                <div className="bg-sunken p-4 rounded-xl text-left space-y-3.5">
                  <div className="pb-2 flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <h4 className="text-sm font-semibold text-ink">
                        {palaceDescriptions[selectedPalace]?.kr || selectedPalace} 해석
                      </h4>
                      <p className="text-xs text-ink-faint mt-0.5">
                        경도 보정 궁위 · <strong className="font-serif text-ink-soft">{ziwei.palaces[selectedPalace].ganZhi} ({ziwei.palaces[selectedPalace].zhi}궁)</strong>
                      </p>
                    </div>
                    {ziwei.palaces[selectedPalace].isShenGong && (
                      <span className="text-xs font-medium bg-surface text-ink-soft px-2 py-0.5 rounded-md">
                        후반기 수호궁 (신궁身宮)
                      </span>
                    )}
                  </div>

                  {/* Palace Description */}
                  <p className="text-xs text-ink-soft bg-surface p-3 rounded-xl leading-relaxed">
                    <strong className="text-ink font-medium">궁성 설명 ·</strong> {palaceDescriptions[selectedPalace]?.desc}
                  </p>

                  {/* Stars in this Palace */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-ink-soft">
                      배치된 핵심 별 정보 ({ziwei.palaces[selectedPalace].stars.length}개)
                    </div>
                    {ziwei.palaces[selectedPalace].stars.length === 0 ? (
                      <p className="text-xs text-ink-faint">배치된 주요 별이 없는 공궁空宮 상태입니다. 맞은편 천이궁 등 대궁의 영향을 강하게 받습니다.</p>
                    ) : (
                      <div className="bg-surface rounded-xl divide-y divide-line">
                        {ziwei.palaces[selectedPalace].stars.map(s => {
                          const isMain = s.type === "main";
                          const isLucky = s.type === "lucky";
                          const isSha = s.type === "sha";

                          let labelText = "일반";
                          if (isMain) {
                            labelText = "14정성";
                          } else if (isLucky) {
                            labelText = "길성";
                          } else if (isSha) {
                            labelText = "살성";
                          }

                          return (
                            <div key={s.name} className="p-3.5 text-xs flex flex-col space-y-1 leading-relaxed">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold flex items-center gap-1.5 text-ink">
                                  <span className={`inline-block text-xs font-medium px-1.5 py-0.5 rounded-md bg-sunken ${isMain ? "text-ink" : "text-ink-soft"}`}>
                                    {labelText}
                                  </span>
                                  {s.nameKr} <span className="font-serif font-normal text-ink-soft">({s.name})</span>
                                </span>
                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                  {s.brightness && (
                                    <span className="text-ink-soft">
                                      {s.brightnessKr}
                                    </span>
                                  )}
                                  {s.siHua && (
                                    <span className="bg-ink text-paper px-1.5 py-0.5 rounded-md text-xs">
                                      {s.siHuaKr}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-1 mt-1">
                                <p className="text-sm text-ink-soft leading-relaxed">
                                  <strong className="text-ink font-medium">성질 ·</strong> {starMeanings[s.nameKr] || "사방의 길흉화복을 보조해 나가는 성질을 지닙니다."}
                                </p>
                                <p className="text-sm text-ink-soft leading-relaxed">
                                  <strong className="text-ink font-medium">{palaceDescriptions[selectedPalace]?.kr?.split(" ")[0] || selectedPalace}에서의 작용 ·</strong> {getStarMeaningInPalace(s.nameKr, selectedPalace)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Annual Liunian & Decadal Daxian Flow Panel */}
              <div className="space-y-6 pt-4 border-t border-line">
                {/* Liunian 운세 */}
                {ziwei.liunian && (() => {
                  const rawPalName = ziwei.liunian.natalPalaceAtMing;
                  const cleanPalName = rawPalName.endsWith("궁") ? rawPalName : (rawPalName + "궁");
                  const friendlyName = friendlyPalaceNames[cleanPalName] || cleanPalName;
                  const friendlyExplanation = friendlyPalaceExplanations[cleanPalName] || "내 인생의 다방면적인 조화와 성취가 어우러지는 중요한 해입니다.";

                  return (
                    <div className="bg-sunken p-4 rounded-xl text-xs space-y-3">
                      <div className="text-sm font-semibold text-ink pb-1">
                        금년 유년운세 (2026년 흐름)
                      </div>
                      <div className="p-4 bg-surface rounded-xl space-y-2 text-left">
                        <p className="text-ink text-sm font-medium leading-relaxed">
                          올해는 <span className="font-serif font-semibold">{ziwei.liunian.gan}{ziwei.liunian.zhi}년</span>으로, 한 해의 기류가 <span className="font-semibold text-seal">{cleanPalName} ({friendlyName})</span> 영역에 머물러 있습니다.
                        </p>
                        <p className="text-sm text-ink-soft leading-relaxed">
                          {friendlyExplanation}
                        </p>
                      </div>

                      {Object.keys(ziwei.liunian.siHuaPalaces).length > 0 && (
                        <div className="space-y-3">
                          <div className="text-xs font-medium text-ink-soft text-left">
                            올해의 네 가지 에너지 흐름 (유년 사화작용)
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(ziwei.liunian.siHuaPalaces).map(([hua, pal]) => {
                              const cleanHua = hua.replace(/\s*\(.*?\)/g, "").trim();
                              const cleanPal = pal.replace(/\s*\(.*?\)/g, "").trim();
                              const sihuaInfo = friendlySihuaExplanations[cleanHua];
                              const palaceTheme = friendlyPalaceNames[cleanPal] || cleanPal;

                              // Detailed custom descriptions avoiding generic sentences
                              const customDetail = getSihuaDetailedDescription(cleanHua, cleanPal);

                              return (
                                <div
                                  key={hua}
                                  className="p-4 rounded-xl bg-surface flex flex-col gap-2"
                                >
                                  <div className="text-left border-b border-line pb-2">
                                    <p className="font-semibold text-xs text-ink tracking-tight">
                                      {sihuaInfo ? sihuaInfo.label : hua}
                                    </p>
                                    <p className="text-xs text-ink-faint mt-0.5">
                                      작용점 · <span className="font-medium text-ink">{cleanPal} ({palaceTheme})</span>
                                    </p>
                                  </div>
                                  <div className="space-y-1.5 text-left flex-1">
                                    <p className="text-xs text-ink font-medium leading-normal">
                                      {sihuaInfo ? sihuaInfo.desc : "특별한 에너지 흐름이 활성화됩니다."}
                                    </p>
                                    <p className="text-sm text-ink-soft leading-relaxed">
                                      {customDetail}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}


              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
