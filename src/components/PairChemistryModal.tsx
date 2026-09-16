import React, { useState, useEffect } from "react";
import { Member } from "../types";
import { X, ShieldCheck, Check, Sparkles, CheckCircle2, HeartHandshake, Compass, HelpCircle } from "lucide-react";
import { logAnalyticsEvent, checkProductUnlock } from "../lib/firebase";
import { generateDynamicPairCompatibility } from "../utils/pairChemistry";
import { getPairAsymmetricScores } from "./GroupNetwork";
import ZodiacAvatar from "./ZodiacAvatar";
import BottomSheet from "./BottomSheet";
import RelationshipMetricsCard from "./RelationshipMetricsCard";

interface PairChemistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  myMember: Member | null;
  targetMember: Member | null;
  roomCode?: string;
  isSecretUnlocked?: boolean;
  onOpenShop?: (tab: "secret" | "pdf" | "group") => void;
  onJoinPrompt?: () => void;
  onOpenStoryModal?: (m1: Member, m2: Member) => void;
  pair?: any;
  initialScore?: number;
}

function getWesternZodiac(birthDateStr: string): { name: string; emoji: string } {
  if (!birthDateStr) return { name: "알 수 없음", emoji: "⭐" };
  const parts = birthDateStr.split("-");
  if (parts.length < 3) return { name: "알 수 없음", emoji: "⭐" };
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { name: "양자리", emoji: "♈" };
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { name: "황소자리", emoji: "♉" };
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return { name: "쌍둥이자리", emoji: "♊" };
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return { name: "게자리", emoji: "♋" };
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { name: "사자자리", emoji: "♌" };
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { name: "처녀자리", emoji: "♍" };
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { name: "천칭자리", emoji: "♎" };
  if ((month === 10 && day >= 23) || (month === 11 && day <= 22)) return { name: "전갈자리", emoji: "♏" };
  if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return { name: "사수자리", emoji: "♐" };
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { name: "염소자리", emoji: "♑" };
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { name: "물병자리", emoji: "♒" };
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return { name: "물고기자리", emoji: "♓" };

  return { name: "알 수 없음", emoji: "⭐" };
}

function syncDescriptionScores(text: string, s1to2: number, s2to1: number): string {
  if (!text) return "";
  const scoreRegex = /^(.+?님은\s+.+?님에게\s+)\d+점(,\s+.+?님은\s+.+?님에게\s+)\d+점\.\s*/;
  if (scoreRegex.test(text)) {
    return text.replace(scoreRegex, `$1${s1to2}점$2${s2to1}점. `);
  }
  return text;
}

function calculatePairDetail(m1: Member, m2: Member, passedPair?: any, initialScore?: number) {
  const dynamic = generateDynamicPairCompatibility(m1, m2);
  const targetPair = passedPair || dynamic;

  const isM1First = targetPair && targetPair.member_id_1
    ? (m1.id.trim().toLowerCase() === targetPair.member_id_1.trim().toLowerCase() ||
       m1.nickname.trim().toLowerCase().replace(/님$/, "") === targetPair.member_id_1.trim().toLowerCase().replace(/님$/, ""))
    : true;

  // Priority: initialScore > passedPair.score > targetPair.avgScore > dynamic.avgScore
  const totalScore =
    typeof initialScore === "number"
      ? initialScore
      : typeof targetPair.score === "number"
        ? targetPair.score
        : (targetPair.avgScore ?? dynamic.avgScore ?? 75);

  const { score1to2: totalScore1to2, score2to1: totalScore2to1 } = getPairAsymmetricScores(targetPair, m1, m2);

  const label = targetPair.label || dynamic.label;
  const desc = targetPair.description || dynamic.description;

  const z1 = getWesternZodiac(m1.birth_date);
  const z2 = getWesternZodiac(m2.birth_date);
  const ZODIAC_ELEMENTS: Record<string, string> = {
    "양자리": "불(火)", "사자자리": "불(火)", "사수자리": "불(火)",
    "황소자리": "흙(土)", "처녀자리": "흙(土)", "염소자리": "흙(土)",
    "쌍둥이자리": "바람(風)", "천칭자리": "바람(風)", "물병자리": "바람(風)",
    "게자리": "물(水)", "전갈자리": "물(水)", "물고기자리": "물(水)"
  };
  const ze1 = ZODIAC_ELEMENTS[z1.name] || "원소";
  const ze2 = ZODIAC_ELEMENTS[z2.name] || "원소";

  // Saju
  const rawSaju1to2 = targetPair.saju?.score_1_to_2 ?? targetPair.saju?.score1to2 ?? dynamic.saju.score1to2;
  const rawSaju2to1 = targetPair.saju?.score_2_to_1 ?? targetPair.saju?.score2to1 ?? dynamic.saju.score2to1;
  const sajuScore1to2 = isM1First ? rawSaju1to2 : rawSaju2to1;
  const sajuScore2to1 = isM1First ? rawSaju2to1 : rawSaju1to2;
  const sajuAvg = Math.round((sajuScore1to2 + sajuScore2to1) / 2);
  const rawSajuDesc = targetPair.saju?.description ?? dynamic.saju.desc;
  const sajuDesc = syncDescriptionScores(rawSajuDesc, sajuScore1to2, sajuScore2to1);

  // Ziwei
  const rawZiwei1to2 = targetPair.ziwei?.score_1_to_2 ?? targetPair.ziwei?.score1to2 ?? dynamic.ziwei?.score1to2 ?? 50;
  const rawZiwei2to1 = targetPair.ziwei?.score_2_to_1 ?? targetPair.ziwei?.score2to1 ?? dynamic.ziwei?.score2to1 ?? 50;
  const ziweiScore1to2 = isM1First ? rawZiwei1to2 : rawZiwei2to1;
  const ziweiScore2to1 = isM1First ? rawZiwei2to1 : rawZiwei1to2;
  const ziweiAvg = Math.round((ziweiScore1to2 + ziweiScore2to1) / 2);

  // Zodiac
  const rawZodiac1to2 = targetPair.zodiac?.score_1_to_2 ?? targetPair.zodiac?.score1to2 ?? dynamic.zodiac?.score1to2 ?? 50;
  const rawZodiac2to1 = targetPair.zodiac?.score_2_to_1 ?? targetPair.zodiac?.score2to1 ?? dynamic.zodiac?.score2to1 ?? 50;
  const zodiacScore1to2 = isM1First ? rawZodiac1to2 : rawZodiac2to1;
  const zodiacScore2to1 = isM1First ? rawZodiac2to1 : rawZodiac1to2;
  const zodiacAvg = Math.round((zodiacScore1to2 + zodiacScore2to1) / 2);
  const rawZodiacDesc = targetPair.zodiac?.description ?? dynamic.zodiac.desc;
  const zodiacDesc = syncDescriptionScores(rawZodiacDesc, zodiacScore1to2, zodiacScore2to1);

  // MBTI
  const hasMbtiBoth = !!(m1.mbti && m2.mbti && m1.mbti !== "미입력" && m2.mbti !== "미입력");
  const rawMbti1to2 = targetPair.mbti?.score_1_to_2 ?? targetPair.mbti?.score1to2 ?? dynamic.mbti?.score1to2 ?? 50;
  const rawMbti2to1 = targetPair.mbti?.score_2_to_1 ?? targetPair.mbti?.score2to1 ?? dynamic.mbti?.score2to1 ?? 50;
  const mbtiScore1to2 = isM1First ? rawMbti1to2 : rawMbti2to1;
  const mbtiScore2to1 = isM1First ? rawMbti2to1 : rawMbti1to2;
  const mbtiAvg = Math.round((mbtiScore1to2 + mbtiScore2to1) / 2);
  const rawMbtiDesc = targetPair.mbti?.description ?? dynamic.mbti.desc;
  const mbtiDesc = syncDescriptionScores(rawMbtiDesc, mbtiScore1to2, mbtiScore2to1);

  return {
    totalScore,
    totalScore1to2,
    totalScore2to1,
    label,
    desc,
    saju: {
      score1to2: sajuScore1to2,
      score2to1: sajuScore2to1,
      avg: sajuAvg,
      desc: sajuDesc,
    },
    ziwei: {
      score1to2: ziweiScore1to2,
      score2to1: ziweiScore2to1,
      avg: ziweiAvg,
    },
    zodiac: {
      z1,
      z2,
      ze1,
      ze2,
      score1to2: zodiacScore1to2,
      score2to1: zodiacScore2to1,
      avg: zodiacAvg,
      desc: zodiacDesc,
    },
    mbti: {
      hasBoth: hasMbtiBoth,
      score1to2: mbtiScore1to2,
      score2to1: mbtiScore2to1,
      avg: mbtiAvg,
      desc: mbtiDesc,
    }
  };
}

export default function PairChemistryModal({
  isOpen,
  onClose,
  myMember,
  targetMember,
  roomCode,
  isSecretUnlocked = false,
  onOpenShop,
  onJoinPrompt,
  onOpenStoryModal,
  pair,
  initialScore,
}: PairChemistryModalProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "ohaeng" | "psychology">("summary");
  const [showScoreTooltip, setShowScoreTooltip] = useState(false);
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (isSecretUnlocked) return true;
    if (typeof window !== "undefined") {
      if (localStorage.getItem("saju_unlocked_secret") === "true") return true;
      if (localStorage.getItem("saju_premium_unlocked_local") === "true") return true;
      if (localStorage.getItem("saju_user_tier") === "premium" || localStorage.getItem("saju_user_tier") === "coupon") return true;
    }
    return false;
  });

  useEffect(() => {
    if (isSecretUnlocked) {
      setUnlocked(true);
      return;
    }
    // Double-check with Firestore / user account
    checkProductUnlock("secret", roomCode).then((res) => {
      if (res) setUnlocked(true);
    }).catch(() => {});
  }, [isSecretUnlocked, roomCode, isOpen]);

  useEffect(() => {
    if (isOpen && targetMember) {
      logAnalyticsEvent("view_pair_detail", "saju_view", {
        targetNickname: targetMember.nickname,
        roomCode: roomCode || "direct",
      });
    }
  }, [isOpen, targetMember?.nickname]);

  if (!isOpen || !targetMember) return null;

  // Case 1: Visitor has not joined the room yet
  if (!myMember) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="max-w-sm"
        showCloseButton={true}
      >
        <div className="space-y-5 text-center py-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-sunken flex items-center justify-center overflow-hidden shadow-inner">
            <ZodiacAvatar member={targetMember} size={52} fallbackEmoji={targetMember.character_emoji} />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-ink-faint font-medium">1:1 인연 궁합</p>
            <h3 className="font-serif text-xl font-bold text-ink">
              {targetMember.nickname}님과의 궁합
            </h3>
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed px-2">
              {targetMember.nickname}님의 상세 사주명식은 비공개입니다.<br />
              내 생년월일시를 입력하면 둘만의 정밀 궁합과 시너지를 바로 확인할 수 있어요.
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={() => {
                onClose();
                if (onJoinPrompt) onJoinPrompt();
              }}
              className="w-full py-3 bg-seal hover:bg-seal-deep text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              생년월일 입력하고 궁합 보기
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-sunken hover:bg-line text-ink text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </BottomSheet>
    );
  }

  // Case 2: Both members exist -> Calculate & Display 1:1 Chemistry
  const analysis = calculatePairDetail(myMember, targetMember, pair, initialScore);


  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-lg"
      showCloseButton={false}
    >
      <div className="space-y-4">
        {/* Header with Dual Avatars */}
        <div className="flex items-start justify-between border-b border-line pb-3.5">
          <div className="flex items-center gap-3">
            {/* My Avatar */}
            <div className="flex flex-col items-center">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: `${myMember.character_color}15`,
                }}
              >
                <ZodiacAvatar member={myMember} size={36} fallbackEmoji={myMember.character_emoji} />
              </div>
              <span className="text-xs font-medium text-ink mt-1 truncate max-w-[64px]">
                나 · {myMember.nickname}
              </span>
            </div>

            {/* Connection separator */}
            <div className="flex flex-col items-center justify-center px-1">
              <span className="text-ink-faint text-base leading-none">×</span>
              <span className="text-xs text-ink-faint mt-1">1:1</span>
            </div>

            {/* Target Member Avatar */}
            <div className="flex flex-col items-center">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: `${targetMember.character_color}15`,
                }}
              >
                <ZodiacAvatar member={targetMember} size={36} fallbackEmoji={targetMember.character_emoji} />
              </div>
              <span className="text-xs font-medium text-ink mt-1 truncate max-w-[64px]">
                {targetMember.nickname}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-ink-faint hover:text-ink rounded-xl hover:bg-sunken transition-colors cursor-pointer"
            title="닫기"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share Action Bar: Instagram Story 9:16 + Kakao */}
        <div className="bg-sunken rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div>
            <p className="text-xs font-semibold text-ink flex items-center gap-1">
              <span>✨ 둘만의 케미 결과 자랑하기</span>
            </p>
            <p className="text-[11px] text-ink-soft mt-0.5">
              두 사람의 6대 맞춤 케미 결과를 확인하고 자랑해 보세요.
            </p>
          </div>
          <div className="shrink-0">
            {onOpenStoryModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStoryModal(myMember, targetMember);
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#f43f5e] to-[#ec4899] hover:opacity-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>✨ 자랑하기</span>
              </button>
            )}
          </div>
        </div>


        {/* Tab navigation */}
        <div className="flex bg-sunken p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`flex-1 py-2 rounded-lg transition-colors text-center cursor-pointer ${
              activeTab === "summary"
                ? "bg-surface text-ink font-semibold"
                : "text-ink-soft hover:text-ink font-medium"
            }`}
          >
            핵심 요약
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ohaeng")}
            className={`flex-1 py-2 rounded-lg transition-colors text-center cursor-pointer ${
              activeTab === "ohaeng"
                ? "bg-surface text-ink font-semibold"
                : "text-ink-soft hover:text-ink font-medium"
            }`}
          >
            오행 상생
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("psychology")}
            className={`flex-1 py-2 rounded-lg transition-colors text-center cursor-pointer ${
              activeTab === "psychology"
                ? "bg-surface text-ink font-semibold"
                : "text-ink-soft hover:text-ink font-medium"
            }`}
          >
            별자리·MBTI
          </button>
        </div>

        {/* Tab 1: Summary */}
        {activeTab === "summary" && (
          <div className="space-y-3 animate-fade-in">
            {/* Score & Relationship Title */}
            <div className="bg-sunken rounded-xl p-5 space-y-2.5 text-center">
              <div className="flex items-center justify-between text-xs text-ink-faint relative">
                <div className="flex items-center gap-1.5">
                  <span>인연 상생 지수</span>
                  <button
                    type="button"
                    onClick={() => setShowScoreTooltip((prev) => !prev)}
                    className="p-0.5 text-ink-faint hover:text-seal transition-colors rounded-full focus:outline-none cursor-pointer"
                    aria-label="점수 산출 기준 안내"
                    title="점수 산출 기준"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="font-mono text-2xl font-bold text-seal">
                  {analysis.totalScore}점
                </span>

                {/* Score Calculation Tooltip */}
                {showScoreTooltip && (
                  <div
                    role="tooltip"
                    className="absolute top-7 left-0 z-30 w-64 p-3 bg-surface border border-line rounded-xl shadow-xl text-left animate-fade-in text-xs space-y-1.5 text-ink"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-seal text-xs">인연 상생 지수 산출 기준</span>
                      <button
                        type="button"
                        onClick={() => setShowScoreTooltip(false)}
                        className="text-ink-faint hover:text-ink text-xs p-0.5"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-ink-soft text-[11px] leading-relaxed">
                      두 분의 <strong>사주 오행 상생(주는 기운 vs 받는 기운)</strong>과 <strong>서양 별자리 4원소</strong>, <strong>자미두수 명궁</strong>, <strong>MBTI 성향 기질</strong>의 조화를 종합 평가하여 산출한 종합 궁합 점수입니다.
                    </p>
                  </div>
                )}
              </div>

              {/* Directional score tags for total chemistry */}
              <div className="flex items-center justify-center gap-2 pt-0.5 pb-0.5">
                <span className="text-[11px] px-2.5 py-0.5 bg-surface border border-line rounded-lg text-ink-soft">
                  주는 기운 <strong className="font-mono text-ink ml-1 font-semibold">{analysis.totalScore1to2}점</strong>
                </span>
                <span className="text-ink-faint text-xs">·</span>
                <span className="text-[11px] px-2.5 py-0.5 bg-surface border border-line rounded-lg text-ink-soft">
                  받는 기운 <strong className="font-mono text-ink ml-1 font-semibold">{analysis.totalScore2to1}점</strong>
                </span>
              </div>

              <h4 className="font-serif text-lg font-semibold text-ink">
                {analysis.label}
              </h4>
              <p className="text-sm text-ink-soft leading-relaxed max-w-md mx-auto pt-1">
                {analysis.desc}
              </p>
            </div>

            {/* Quick 2 Points */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-sunken rounded-xl p-3 space-y-1">
                <span className="text-xs text-ink-faint block">오행 흐름</span>
                <p className="text-sm font-semibold text-ink">
                  {myMember.saju?.daymaster?.gan || "토"} × {targetMember.saju?.daymaster?.gan || "토"}
                </p>
                <span className="text-xs text-ink-soft line-clamp-1">{analysis.saju.desc}</span>
              </div>

              <div className="bg-sunken rounded-xl p-3 space-y-1">
                <span className="text-xs text-ink-faint block">별자리 4원소</span>
                <p className="text-sm font-semibold text-ink">
                  {analysis.zodiac.ze1} × {analysis.zodiac.ze2}
                </p>
                <span className="text-xs text-ink-soft line-clamp-1">{analysis.zodiac.desc}</span>
              </div>
            </div>

            {/* 6 Core Relation Metrics with interactive detailed breakdown */}
            <RelationshipMetricsCard
              m1={myMember}
              m2={targetMember}
              pairScore={analysis.totalScore}
              title={`${myMember.nickname} & ${targetMember.nickname} 관계 역학`}
            />
          </div>
        )}

        {/* Tab 2: Five elements detail */}
        {activeTab === "ohaeng" && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-sunken rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink">오행 상생 조화</span>
                  <span className="font-mono text-xs font-bold text-seal bg-surface px-1.5 py-0.5 rounded">
                    {analysis.saju.avg}점
                  </span>
                </div>
                <span className="text-xs text-ink-soft bg-surface px-2 py-0.5 rounded-lg">
                  {myMember.saju?.daymaster?.gan || "토"} → {targetMember.saju?.daymaster?.gan || "토"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-surface p-2.5 rounded-xl">
                  <div className="flex items-center justify-between text-ink-faint mb-0.5">
                    <span className="truncate">나 → {targetMember.nickname}</span>
                    <span className="text-[10px] shrink-0">주는 기운</span>
                  </div>
                  <span className="text-sm font-semibold font-mono text-ink">{analysis.saju.score1to2}점</span>
                </div>
                <div className="bg-surface p-2.5 rounded-xl">
                  <div className="flex items-center justify-between text-ink-faint mb-0.5">
                    <span className="truncate">{targetMember.nickname} → 나</span>
                    <span className="text-[10px] shrink-0">받는 기운</span>
                  </div>
                  <span className="text-sm font-semibold font-mono text-ink">{analysis.saju.score2to1}점</span>
                </div>
              </div>

              <p className="text-sm text-ink-soft leading-relaxed">
                {analysis.saju.desc}
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Astro & MBTI */}
        {activeTab === "psychology" && (
          <div className="space-y-3 animate-fade-in">
            {/* Zodiac Card */}
            <div className="bg-sunken rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink">별자리 4원소 조화</span>
                  <span className="font-mono text-xs font-bold text-seal bg-surface px-1.5 py-0.5 rounded">
                    {analysis.zodiac.avg}점
                  </span>
                </div>
                <span className="text-xs text-ink-soft bg-surface px-2 py-0.5 rounded-lg">
                  {analysis.zodiac.ze1} × {analysis.zodiac.ze2}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-surface p-2.5 rounded-xl">
                  <div className="flex items-center justify-between text-ink-faint mb-0.5">
                    <span className="truncate">나 → {targetMember.nickname}</span>
                    <span className="text-[10px] shrink-0">주는 기운</span>
                  </div>
                  <span className="text-sm font-semibold font-mono text-ink">{analysis.zodiac.score1to2}점</span>
                </div>
                <div className="bg-surface p-2.5 rounded-xl">
                  <div className="flex items-center justify-between text-ink-faint mb-0.5">
                    <span className="truncate">{targetMember.nickname} → 나</span>
                    <span className="text-[10px] shrink-0">받는 기운</span>
                  </div>
                  <span className="text-sm font-semibold font-mono text-ink">{analysis.zodiac.score2to1}점</span>
                </div>
              </div>

              <p className="text-sm text-ink-soft leading-relaxed">
                {analysis.zodiac.desc}
              </p>
            </div>

            {/* MBTI Card */}
            {analysis.mbti.hasBoth ? (
              <div className="bg-sunken rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-ink">MBTI 성향 조화</span>
                    <span className="font-mono text-xs font-bold text-seal bg-surface px-1.5 py-0.5 rounded">
                      {analysis.mbti.avg}점
                    </span>
                  </div>
                  <span className="text-xs text-ink-soft bg-surface px-2 py-0.5 rounded-lg">
                    {myMember.mbti?.toUpperCase()} × {targetMember.mbti?.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-surface p-2.5 rounded-xl">
                    <div className="flex items-center justify-between text-ink-faint mb-0.5">
                      <span className="truncate">나 → {targetMember.nickname}</span>
                      <span className="text-[10px] shrink-0">주는 기운</span>
                    </div>
                    <span className="text-sm font-semibold font-mono text-ink">{analysis.mbti.score1to2}점</span>
                  </div>
                  <div className="bg-surface p-2.5 rounded-xl">
                    <div className="flex items-center justify-between text-ink-faint mb-0.5">
                      <span className="truncate">{targetMember.nickname} → 나</span>
                      <span className="text-[10px] shrink-0">받는 기운</span>
                    </div>
                    <span className="text-sm font-semibold font-mono text-ink">{analysis.mbti.score2to1}점</span>
                  </div>
                </div>

                <p className="text-sm text-ink-soft leading-relaxed">
                  {analysis.mbti.desc}
                </p>
              </div>
            ) : (
              <div className="bg-sunken rounded-xl p-3.5 text-xs text-ink-faint leading-relaxed">
                MBTI 궁합은 두 분 모두 MBTI를 등록하면 추가로 분석됩니다.
              </div>
            )}
          </div>
        )}

        {/* Privacy Protection Notice */}
        <div className="bg-sunken rounded-xl p-3 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-ink-faint shrink-0 mt-0.5" />
          <p className="text-xs text-ink-soft leading-relaxed">
            상대의 생년월일시와 상세 명식은 비공개이며, 1:1 궁합 결과만 계산해 보여드립니다.
          </p>
        </div>

        {/* Premium Deep Unlock CTA / Unlocked Deep Synergy Section */}
        {unlocked ? (
          <div className="bg-surface border border-line rounded-xl p-4 sm:p-5 space-y-4 shadow-sm animate-fade-in">
            {/* Header Badge */}
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-seal/10 text-seal flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h5 className="text-sm font-semibold text-ink">
                    1:1 심층 인연 상성 풀이
                  </h5>
                  <span className="text-[11px] text-ink-soft">
                    {myMember.nickname} × {targetMember.nickname} 전용 해독서
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800 shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                해금 완료 · 평생 무제한
              </span>
            </div>

            {/* Deep Insight 1: Synergy Maximization */}
            <div className="bg-sunken rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-seal">
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>시너지 극대화 처방</span>
              </div>
              <p className="text-xs text-ink leading-relaxed">
                {analysis.label}: {analysis.desc} 두 사람이 협업하거나 대화할 때는 서로의 결정을 믿고 지지해 줄 때 본래 역량의 120% 이상의 상생 폭발력이 발현됩니다.
              </p>
            </div>

            {/* Deep Insight 2: Conflict Resolution Guideline */}
            <div className="bg-sunken rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Compass className="w-3.5 h-3.5 text-ink-soft" />
                <span>갈등 조율 및 황금 대화법</span>
              </div>
              <p className="text-xs text-ink-soft leading-relaxed">
                {myMember.saju?.daymaster?.gan || "나"} 기운과 {targetMember.saju?.daymaster?.gan || "상대"} 기운이 부딪힐 때는 즉각적인 논쟁보다 감정을 가라앉힐 수 있는 3분의 완충 시간(수/水 기운)을 갖는 것이 관계를 더욱 돈독하게 만듭니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-sunken rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-left">
              <h5 className="text-sm font-semibold text-ink">
                두 사람의 심층 궁합 풀이
              </h5>
              <p className="text-xs text-ink-soft mt-0.5">
                갈등 조율과 1:1 시너지 리포트를 더 깊이 볼 수 있어요.
              </p>
            </div>

            <button
              onClick={() => {
                logAnalyticsEvent("click_locked_feature", "monetization", { feature: "secret", from: "pair_modal" });
                onClose();
                if (onOpenShop) onOpenShop("secret");
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-seal hover:bg-seal-deep text-white text-sm font-semibold rounded-xl transition-colors shrink-0 cursor-pointer"
            >
              심층 풀이 보기
            </button>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-sunken hover:bg-line text-ink text-sm font-semibold rounded-xl transition-colors cursor-pointer"
        >
          닫기
        </button>
      </div>
    </BottomSheet>
  );
}
