import React, { useState, useEffect } from "react";
import { Member } from "../types";
import { X, ShieldCheck, Share2, Check } from "lucide-react";
import { shareToKakaoOrClipboard } from "../utils/shareHelper";
import { logAnalyticsEvent } from "../lib/firebase";
import ZodiacAvatar from "./ZodiacAvatar";

interface PairChemistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  myMember: Member | null;
  targetMember: Member | null;
  roomCode?: string;
  onOpenShop?: (tab: "secret" | "pdf" | "group") => void;
  onJoinPrompt?: () => void;
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

function calculatePairDetail(m1: Member, m2: Member) {
  const getDeterministicHashScore = (str1: string, str2: string, seed: number, min = 68, max = 96) => {
    const combined = [str1, str2].sort().join("");
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs((hash + seed) % (max - min + 1)) + min;
  };

  const m1Id = m1.id || "m1";
  const m2Id = m2.id || "m2";

  const g1 = m1.saju?.daymaster?.gan || "무토";
  const g2 = m2.saju?.daymaster?.gan || "기토";
  const elem1 = m1.saju?.daymaster?.element || "토";
  const elem2 = m2.saju?.daymaster?.element || "토";

  const GAN_META: Record<string, { nick: string; desc: string }> = {
    "갑목": { nick: "우직한 거목", desc: "곧고 굳센 기상과 진취적인 리더십" },
    "을목": { nick: "유연한 화초", desc: "끈질긴 친화력과 부드러운 유연성" },
    "병화": { nick: "눈부신 태양", desc: "사방을 비추는 열정과 솔직한 사교성" },
    "정화": { nick: "따뜻한 등불", desc: "내면을 세심하게 읽는 지혜와 강한 집중력" },
    "무토": { nick: "광활한 태산", desc: "흔들리지 않는 든든한 신용과 묵직한 포용력" },
    "기토": { nick: "기름진 정원", desc: "주변을 알뜰살뜰 보살피는 포근함과 대처능력" },
    "경금": { nick: "강인한 원석", desc: "우직한 뚝심과 확실한 의리, 칼날 같은 단호함" },
    "신금": { nick: "반짝이는 보석", desc: "눈부신 지적 영민함과 세심하고 정교한 완벽주의" },
    "임수": { nick: "도도한 강물", desc: "웅장한 포용력과 물길처럼 흐르는 깊은 지혜" },
    "계수": { nick: "촉촉한 이슬", desc: "메마른 세상을 적시는 맑고 지혜로운 임기응변" }
  };

  const meta1 = GAN_META[g1] || { nick: `${elem1}기운`, desc: `${elem1}의 기운` };
  const meta2 = GAN_META[g2] || { nick: `${elem2}기운`, desc: `${elem2}의 기운` };

  const isGeneratingSajuSupport =
    (elem1 === "목" && elem2 === "화") ||
    (elem1 === "화" && elem2 === "토") ||
    (elem1 === "토" && elem2 === "금") ||
    (elem1 === "금" && elem2 === "수") ||
    (elem1 === "수" && elem2 === "목");

  const isReceivingSajuSupport =
    (elem2 === "목" && elem1 === "화") ||
    (elem2 === "화" && elem1 === "토") ||
    (elem2 === "토" && elem1 === "금") ||
    (elem2 === "금" && elem1 === "수") ||
    (elem2 === "수" && elem1 === "목");

  const isSajuClash =
    (elem1 === "목" && elem2 === "토") ||
    (elem1 === "토" && elem2 === "수") ||
    (elem1 === "수" && elem2 === "화") ||
    (elem1 === "화" && elem2 === "금") ||
    (elem1 === "금" && elem2 === "목") ||
    (elem2 === "목" && elem1 === "토") ||
    (elem2 === "토" && elem1 === "수") ||
    (elem2 === "수" && elem1 === "화") ||
    (elem2 === "화" && elem1 === "금") ||
    (elem2 === "금" && elem1 === "목");

  let sajuScore1to2 = getDeterministicHashScore(m1Id, m2Id, 11, 75, 96);
  let sajuScore2to1 = getDeterministicHashScore(m1Id, m2Id, 33, 75, 96);
  let label = "상생과 화합의 인연 메이트";
  let desc = "";
  let sajuDesc = "";

  if (isGeneratingSajuSupport) {
    label = "오행상생의 창조적 파트너";
    desc = `${m1.nickname}님의 ${meta1.nick} 성정이 ${m2.nickname}님의 ${meta2.nick} 성정을 든든하게 촉진해 주는 상생 조합입니다. 두 분이 함께하면 아이디어가 구체적인 결실로 이어집니다.`;
    sajuDesc = `${m1.nickname}님의 '${elem1}' 기운이 ${m2.nickname}님의 '${elem2}' 기운을 생(生)해 주어, 대화를 나눌수록 서로에게 추진력과 영감을 불어넣습니다.`;
  } else if (isReceivingSajuSupport) {
    label = "따뜻한 조력과 든든한 상생 기류";
    desc = `${m2.nickname}님의 ${meta2.nick} 기운이 ${m1.nickname}님의 ${meta1.nick} 기질을 자상하게 품어주고 힘을 실어주는 신뢰의 인연입니다.`;
    sajuDesc = `${m2.nickname}님의 '${elem2}' 기운이 ${m1.nickname}님의 '${elem1}' 기운을 든든히 보살펴 주어, 심리적 안정감과 깊은 신뢰를 나누게 됩니다.`;
  } else if (elem1 === elem2) {
    label = "거울을 보듯 통하는 소울 조합";
    desc = `서로 같은 '${elem1}' 오행을 공유하여 긴 설명 없이도 마음이 통하는 깊은 동질감과 유대감을 나눕니다.`;
    sajuDesc = `같은 성향의 궤도를 달리는 동반자로서 서로의 장점을 거울처럼 비춰주며 함께 성장하는 화합의 기류입니다.`;
  } else if (isSajuClash) {
    label = "긴장 속에서 꽃피는 혁신 케미";
    desc = `서로 다른 관점과 오행 기운을 지녀 긴장감이 돌지만, 적절한 존중을 유지하면 서로의 맹점을 채워주는 좋은 지적 파트너가 됩니다.`;
    sajuDesc = `${elem1}과 ${elem2}의 기운이 만나 팽팽한 자극을 형성하므로, 함께 프로젝트를 하거나 토론할 때 독창적인 해법을 끌어냅니다.`;
  } else {
    label = "서로의 빈틈을 채우는 균형의 인연";
    desc = `${m1.nickname}님과 ${m2.nickname}님은 서로 다른 매력을 지녀 함께 있을 때 각자의 시야를 넓혀주는 조화로운 조합입니다.`;
    sajuDesc = `오행의 순환 속에서 서로에게 새로운 자극과 보완적 안목을 제시하는 인연입니다.`;
  }

  const totalScore = Math.round((sajuScore1to2 + sajuScore2to1) / 2);

  // Zodiac 4-element check
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

  let zodiacDesc = `${z1.name}(${ze1})와 ${z2.name}(${ze2})의 만남으로 서로 다른 별자리 에너지를 교환합니다.`;
  if (ze1 === ze2) {
    zodiacDesc = `같은 '${ze1}' 성좌 에너지를 공유하여 정서적 공감대와 직관적 소통이 빠르게 이루어집니다.`;
  } else if ((ze1 === "불(火)" && ze2 === "바람(風)") || (ze1 === "바람(風)" && ze2 === "불(火)")) {
    zodiacDesc = "바람이 불꽃을 키우듯, 대화할수록 열정과 아이디어가 샘솟는 별자리 조합입니다.";
  } else if ((ze1 === "흙(土)" && ze2 === "물(水)") || (ze1 === "물(水)" && ze2 === "흙(土)")) {
    zodiacDesc = "흙에 물이 스며들듯, 서로에게 안정감과 영감을 주는 조화로운 별자리입니다.";
  }

  // MBTI
  const hasMbtiBoth = !!(m1.mbti && m2.mbti && m1.mbti !== "미입력" && m2.mbti !== "미입력");
  let mbtiDesc = "두 분의 MBTI 성향이 등록되면 심리적 행동 패턴과 대화법을 추가로 분석해 드립니다.";
  if (hasMbtiBoth) {
    const mb1 = (m1.mbti || "").toUpperCase();
    const mb2 = (m2.mbti || "").toUpperCase();
    const sameCount = (mb1[0] === mb2[0] ? 1 : 0) + (mb1[1] === mb2[1] ? 1 : 0) + (mb1[2] === mb2[2] ? 1 : 0) + (mb1[3] === mb2[3] ? 1 : 0);
    if (sameCount >= 3) {
      mbtiDesc = `${mb1}와 ${mb2}의 만남으로 사고방식과 가치관이 흡사하여 첫 만남부터 오랜 친구처럼 편안함을 느낍니다.`;
    } else if (sameCount === 2) {
      mbtiDesc = `${mb1}와 ${mb2}의 조합은 공통점과 상반된 매력이 균형을 이루어 서로에게 지루할 틈이 없는 관계입니다.`;
    } else {
      mbtiDesc = `${mb1}와 ${mb2}는 서로 다른 심리 유형을 지녀 새로운 시야를 열어주는 지적 자극 파트너입니다.`;
    }
  }

  return {
    totalScore,
    label,
    desc,
    saju: {
      score1to2: sajuScore1to2,
      score2to1: sajuScore2to1,
      desc: sajuDesc,
    },
    zodiac: {
      z1,
      z2,
      ze1,
      ze2,
      desc: zodiacDesc,
    },
    mbti: {
      hasBoth: hasMbtiBoth,
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
  onOpenShop,
  onJoinPrompt,
}: PairChemistryModalProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "ohaeng" | "psychology">("summary");
  const [shareSuccessMsg, setShareSuccessMsg] = useState("");

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
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 animate-fade-in">
        <div className="bg-surface rounded-xl shadow-lg max-w-sm w-full p-6 space-y-5 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-ink-faint hover:text-ink rounded-xl hover:bg-sunken transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 mx-auto rounded-xl bg-sunken flex items-center justify-center overflow-hidden">
            <ZodiacAvatar member={targetMember} size={48} fallbackEmoji={targetMember.character_emoji} />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-ink-faint">1:1 궁합</p>
            <h3 className="font-serif text-lg font-semibold text-ink">
              {targetMember.nickname}님과의 궁합
            </h3>
            <p className="text-sm text-ink-soft leading-relaxed">
              {targetMember.nickname}님의 상세 사주명식은 비공개입니다.<br />
              방에 참여하면 나와의 1:1 궁합을 확인할 수 있어요.
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={() => {
                onClose();
                if (onJoinPrompt) onJoinPrompt();
              }}
              className="w-full py-3 bg-seal hover:bg-seal-deep text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
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
      </div>
    );
  }

  // Case 2: Both members exist -> Calculate & Display 1:1 Chemistry
  const analysis = calculatePairDetail(myMember, targetMember);

  const handleShareResult = async () => {
    const currentUrl = window.location.href;
    const res = await shareToKakaoOrClipboard({
      title: `${myMember.nickname}님 & ${targetMember.nickname}님의 1:1 인연 궁합`,
      badge: analysis.label,
      score: analysis.totalScore,
      description: analysis.desc,
      url: currentUrl,
    });

    if (res.method === "web_share") {
      setShareSuccessMsg("공유 창이 열렸습니다.");
    } else {
      setShareSuccessMsg("공유 문구와 링크가 클립보드에 복사되었습니다. 카카오톡에 붙여넣어 보세요.");
    }
    setTimeout(() => setShareSuccessMsg(""), 3500);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-black/50 overflow-y-auto animate-fade-in">
      <div className="bg-surface rounded-xl shadow-lg max-w-lg w-full p-5 sm:p-6 space-y-4 text-left relative my-auto max-h-[92vh] overflow-y-auto flex flex-col">

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

        {/* Kakao share action bar */}
        <div className="bg-sunken rounded-xl p-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-ink">
              {targetMember.nickname}님에게 결과 공유
            </p>
            <p className="text-xs text-ink-soft mt-0.5">
              요약 카드로 전달됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={handleShareResult}
            className="px-3 py-2 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>카톡 공유</span>
          </button>
        </div>

        {shareSuccessMsg && (
          <p className="bg-sunken text-ink p-2.5 rounded-xl text-xs font-medium text-center animate-fade-in flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4 text-ink-soft" />
            <span>{shareSuccessMsg}</span>
          </p>
        )}

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
            <div className="bg-sunken rounded-xl p-5 space-y-2 text-center">
              <div className="flex items-center justify-between text-xs text-ink-faint">
                <span>인연 상생 지수</span>
                <span className="font-mono text-2xl font-semibold text-ink">
                  {analysis.totalScore}점
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
          </div>
        )}

        {/* Tab 2: Five elements detail */}
        {activeTab === "ohaeng" && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-sunken rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <span className="text-sm font-semibold text-ink">오행 상생 조화</span>
                <span className="text-xs text-ink-soft bg-surface px-2 py-0.5 rounded-lg">
                  {myMember.saju?.daymaster?.gan || "토"} → {targetMember.saju?.daymaster?.gan || "토"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-surface p-2.5 rounded-xl">
                  <span className="text-ink-faint block">나 → {targetMember.nickname}</span>
                  <span className="text-sm font-semibold font-mono text-ink">{analysis.saju.score1to2}점</span>
                </div>
                <div className="bg-surface p-2.5 rounded-xl">
                  <span className="text-ink-faint block">{targetMember.nickname} → 나</span>
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
                <span className="text-sm font-semibold text-ink">별자리 4원소 조화</span>
                <span className="text-xs text-ink-soft bg-surface px-2 py-0.5 rounded-lg">
                  {analysis.zodiac.ze1} × {analysis.zodiac.ze2}
                </span>
              </div>
              <p className="text-sm text-ink-soft leading-relaxed">
                {analysis.zodiac.desc}
              </p>
            </div>

            {/* MBTI Card */}
            {analysis.mbti.hasBoth ? (
              <div className="bg-sunken rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <span className="text-sm font-semibold text-ink">MBTI 성향 조화</span>
                  <span className="text-xs text-ink-soft bg-surface px-2 py-0.5 rounded-lg">
                    {myMember.mbti?.toUpperCase()} × {targetMember.mbti?.toUpperCase()}
                  </span>
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

        {/* Premium Deep Unlock CTA */}
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

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-sunken hover:bg-line text-ink text-sm font-semibold rounded-xl transition-colors cursor-pointer"
        >
          닫기
        </button>

      </div>
    </div>
  );
}
