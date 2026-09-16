import React, { useRef, useState, useEffect, useMemo } from "react";
import { X, Download, Heart, HeartHandshake, Share2, Sparkles, Check } from "lucide-react";
import html2canvas from "html2canvas-pro";
import { Member } from "../types";
import { getMemberZodiacSrc } from "./ZodiacAvatar";
import { getMemberNickname, getMemberElement } from "../utils/memberHelper";
import { calculateMemberSals } from "../utils/shinsalCalculator";
import { generateDedicatedChemistryCard } from "../utils/cardGenerator";

interface SnapStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  m1: Member;
  m2: Member;
  pairScore: number;
  pairGrade: string;
  pairLabel?: string;
  pairDesc?: string;
}

export interface PairStoryCategory {
  id: string;
  icon: string;
  title: string;
  score: number;
  comment: string;
  color: string;
}

export default function SnapStoryModal({
  isOpen,
  onClose,
  m1,
  m2,
  pairScore,
  pairGrade,
  pairLabel,
  pairDesc,
}: SnapStoryModalProps) {
  const storyCardRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [showLongPressGuide, setShowLongPressGuide] = useState(false);
  const [copiedText, setCopiedText] = useState("");

  // ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Compute 6 Rich Viral Saju Chemistry Categories (Original High-Fidelity Design)
  const pair6Categories = useMemo(() => {
    const elemA = getMemberElement(m1);
    const elemB = getMemberElement(m2);
    const nickA = getMemberNickname(m1);
    const nickB = getMemberNickname(m2);

    const hash = Math.abs(
      (nickA.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) * 31 +
       nickB.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0))
    );

    const salsA = calculateMemberSals(m1);
    const salsB = calculateMemberSals(m2);

    // 1. 대화 티키타카
    const hasDohwa = salsA.dohwaCount + salsB.dohwaCount > 0;
    const tikitakaBase = Math.min(96, Math.max(45, Math.round(pairScore * 0.95 + (hasDohwa ? 5 : -4) + (((hash * 13) % 9) - 4))));
    const tikitakaComment = tikitakaBase >= 85
      ? "생각의 속도가 비슷해 말 한마디로도 통하는 사이"
      : tikitakaBase >= 72
      ? "말이 끊이지 않고 자연스럽게 이어지는 대화 흐름"
      : tikitakaBase >= 58
      ? "필요한 순간에 명쾌하게 소통하는 담백한 사이"
      : "서로의 대화 템포와 표현 방식을 맞춰가는 중인 사이";

    // 2. 모임 텐션 & 분위기
    const hasActiveSal = salsA.yeokmaCount + salsB.yeokmaCount + salsA.dohwaCount + salsB.dohwaCount > 0;
    const alcoholBase = Math.min(94, Math.max(40, Math.round(pairScore * 0.92 + (hasActiveSal ? 6 : -5) + (((hash * 3) % 7) - 3))));
    const alcoholComment = alcoholBase >= 80
      ? "함께 있는 것만으로도 분위기를 끌어올리는 특급 시너지"
      : alcoholBase >= 68
      ? "서로의 페이스를 편안하게 존중하며 즐기는 호흡"
      : alcoholBase >= 54
      ? "과하지 않게 은은한 즐거움을 나누는 차분한 무드"
      : "조용하고 정적인 환경에서 더 편안함을 느끼는 조합";

    // 3. 여행 & 일상 호흡
    const hasTravelSal = salsA.sals.includes("역마살") || salsB.sals.includes("역마살");
    const travelBase = Math.min(92, Math.max(38, Math.round(pairScore * 0.90 + (hasTravelSal ? 5 : -6) + (((hash * 7) % 7) - 3))));
    const travelComment = travelBase >= 78
      ? "돌발 변수가 생겨도 함께 웃으며 유쾌하게 넘기는 메이트"
      : travelBase >= 65
      ? "취향과 동선을 자연스럽게 배려하며 맞춰가는 편안함"
      : travelBase >= 52
      ? "사전에 계획과 역할을 조율하면 깔끔하게 어울릴 조합"
      : "각자의 개인 시간과 독립적인 휴식을 보장해야 할 동행";

    // 4. 감정 공감 & 멘탈 케어
    const hasEarthOrWater = elemA === "토" || elemB === "토" || elemA === "수" || elemB === "수";
    const healingBase = Math.min(95, Math.max(42, Math.round(pairScore * 0.92 + (hasEarthOrWater ? 5 : -5) + (((hash * 11) % 7) - 3))));
    const healingComment = healingBase >= 80
      ? "속 깊은 이야기까지 안심하고 털어놓을 수 있는 안식처"
      : healingBase >= 68
      ? "진심 어린 경청과 공감으로 서로에게 힘이 되어주는 관계"
      : healingBase >= 54
      ? "서로의 감정선을 존중하며 묵묵히 곁을 지켜주는 사이"
      : "감정적인 의존보다는 적절한 거리감 유지가 편한 사이";

    // 5. 현실 시너지 & 협업
    const hasMetalOrEarth = elemA === "금" || elemB === "금" || elemA === "토" || elemB === "토";
    const businessBase = Math.min(94, Math.max(40, Math.round(pairScore * 0.90 + (hasMetalOrEarth ? 5 : -6) + (((hash * 17) % 7) - 3))));
    const businessComment = businessBase >= 78
      ? "기획과 실행의 균형이 뛰어나 확실한 결실을 맺는 파트너"
      : businessBase >= 66
      ? "역할 분담이 명확할 때 최고의 성과를 내는 콤비"
      : businessBase >= 52
      ? "서로의 전문 영역을 인정하고 존중할 때 시너지가 나는 사이"
      : "공동 작업 시 명확한 룰과 배려가 필요한 관계";

    // 6. 관계 팁 & 배려 포인트
    const safetyScore = Math.min(84, Math.max(38, Math.round(pairScore * 0.78 - ((hash * 19) % 8))));
    const mineComment = (elemA === "화" && elemB === "수") || (elemA === "수" && elemB === "화")
      ? "피곤할 땐 즉답을 피하고 한 템포 쉬어가는 대화가 좋아요"
      : (elemA === "금" && elemB === "목") || (elemA === "목" && elemB === "금")
      ? "직설적인 피드백보다는 따뜻한 인정 한마디가 최고의 처방"
      : safetyScore < 55
      ? "서로의 호의가 간섭으로 느껴지지 않도록 경계를 존중하기"
      : "상대방만의 고유한 템포와 개인 시간을 편안하게 존중해 주기";

    let tagLine = pairDesc || "기분 좋은 파장을 나누는 조화로운 인연";
    if (pairScore >= 85) tagLine = "눈빛만 봐도 뜻이 통하는 최상의 케미스트리";
    else if (pairScore >= 75) tagLine = "서로의 장점을 극대화해 주는 든든한 파트너";
    else if (pairScore >= 65) tagLine = "서로의 부족한 기운을 차분히 채워주는 상생 메이트";

    const categories: PairStoryCategory[] = [
      { id: "talk", icon: "💬", title: "대화 티키타카", score: tikitakaBase, comment: tikitakaComment, color: "#f43f5e" },
      { id: "drink", icon: "⚡", title: "모임 텐션 & 분위기", score: alcoholBase, comment: alcoholComment, color: "#f97316" },
      { id: "travel", icon: "✈️", title: "여행 & 일상 호흡", score: travelBase, comment: travelComment, color: "#06b6d4" },
      { id: "healing", icon: "🌿", title: "감정 공감 & 멘탈 케어", score: healingBase, comment: healingComment, color: "#10b981" },
      { id: "money", icon: "💼", title: "현실 시너지 & 협업", score: businessBase, comment: businessComment, color: "#eab308" },
      { id: "warning", icon: "💡", title: "관계 팁 & 배려 포인트", score: safetyScore, comment: mineComment, color: "#8b5cf6" },
    ];

    return {
      title: pairLabel || tagLine,
      score: pairScore,
      categories,
      tagLine,
    };
  }, [m1, m2, pairScore, pairLabel, pairDesc]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setCopiedText("");

    try {
      let dataUrl = "";
      // 1) Try high-res Canvas Generator first
      try {
        const generated = await generateDedicatedChemistryCard({
          roomTitle: "1:1 비밀 인연 스냅",
          groupScore: pairScore,
          members: [m1, m2],
          m1,
          m2,
          pairScore,
          pairLabel: pairLabel || pair6Categories.title,
          pairDesc: pairDesc || pair6Categories.tagLine,
        });
        dataUrl = generated.dataUrl;
      } catch (canvasErr) {
        console.warn("Canvas export fallback to html2canvas-pro:", canvasErr);
        if (storyCardRef.current) {
          const canvas = await html2canvas(storyCardRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
          });
          dataUrl = canvas.toDataURL("image/png");
        }
      }

      if (!dataUrl) {
        throw new Error("포스터 이미지 생성에 실패했습니다.");
      }

      setCapturedImageUrl(dataUrl);

      const filename = `inyeon_1to1_${m1.nickname}_${m2.nickname}_${pairScore}점.png`;
      const isMobile = /mobile|android|iphone|ipad/i.test(navigator.userAgent);
      const isInAppBrowser = /instagram|kakaotalk|naver/i.test(navigator.userAgent);

      if (isMobile && isInAppBrowser) {
        setShowLongPressGuide(true);
      } else {
        const link = document.createElement("a");
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Story capture error:", err);
      alert("포스터 저장 중 오류가 발생했습니다. 화면을 캡처해서 사용해주세요.");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCopyTag = async () => {
    const text = `@${getMemberNickname(m2)} 나와의 사주 궁합 점수는 ${pairScore}점! (${pair6Categories.title}) #인연사주`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText("복사완료! 인스타 스토리에 붙여넣기 해보세요.");
      setTimeout(() => setCopiedText(""), 3000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-[420px] my-auto bg-[#0a0d14] border border-white/15 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col items-center">
        {/* Header (Clean & Minimal: No Select Boxes) */}
        <div className="flex items-center justify-between w-full mb-3 text-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="font-serif text-base sm:text-lg font-bold">1:1 인스타 스토리 전용 포스터</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ──────────────────────────────────────────
             9:16 Instagram Story Canvas (Original High-Fidelity Design)
           ────────────────────────────────────────── */}
        <div
          ref={storyCardRef}
          className="w-full h-[620px] rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden border border-white/15 shadow-2xl text-white"
          style={{
            background: "radial-gradient(circle at 50% 0%, #201127 0%, #0c0d16 65%, #05060a 100%)",
          }}
        >
          <div>
            {/* Top Story Indicator Progress Bars */}
            <div className="flex gap-1 w-full mb-3">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div key={step} className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-400" />
              ))}
            </div>

            {/* Brand & Room Title */}
            <div className="flex items-center justify-between mb-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-rose-300">
                <span>●</span> 1:1 인연사주 운명 궁합
              </div>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                INYEON CHEMISTRY
              </span>
            </div>

            {/* Pair Tag Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-2">
              <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
              <span>너랑 나의 사주 팩폭 케미</span>
            </div>

            {/* Headline Title */}
            <div className="mt-0.5 mb-1 text-left">
              <h2 className="text-[18px] font-black leading-tight tracking-tight text-white flex items-baseline gap-1.5">
                <span>{getMemberNickname(m1)}</span>
                <span className="text-rose-400 text-sm">×</span>
                <span>{getMemberNickname(m2)}</span>
                <span className="ml-auto font-mono text-xl font-extrabold text-rose-400 flex items-center gap-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-black leading-none ${
                    pairGrade === "UR" ? "bg-gradient-to-r from-amber-400 to-rose-500 text-white shadow-xs" :
                    pairGrade === "SSR" ? "bg-rose-500 text-white" :
                    pairGrade === "SR" ? "bg-purple-600 text-white" :
                    pairGrade === "SSS" ? "bg-indigo-600 text-white" :
                    pairGrade === "SS" ? "bg-blue-600 text-white" :
                    pairGrade === "S" ? "bg-emerald-600 text-white" :
                    pairGrade === "A" ? "bg-teal-600 text-white" :
                    pairGrade === "B" ? "bg-amber-600 text-white" :
                    pairGrade === "C" ? "bg-orange-600 text-white" :
                    pairGrade === "D" ? "bg-rose-700 text-white" :
                    "bg-slate-900 text-white"
                  }`}>
                    {pairGrade}
                  </span>
                  <span>{pairScore}점</span>
                </span>
              </h2>
              <p className="text-[11px] text-slate-300 font-semibold mt-0.5">
                "{pair6Categories.tagLine}"
              </p>
            </div>
          </div>

          {/* Center 1:1 Chemistry Card (White/Paper Surface) */}
          <div className="bg-white rounded-2xl p-3 text-[#1c1d21] shadow-xl my-auto relative space-y-2">
            {/* Two Avatars Confrontation with Heart Synergy */}
            <div className="flex items-center justify-around py-1 border-b border-slate-100">
              {/* Member 1 (초대자) */}
              <div className="flex flex-col items-center text-center w-24">
                <div className="w-13 h-13 rounded-full bg-slate-50 border-2 border-rose-400 flex items-center justify-center overflow-hidden shadow-xs relative">
                  <img
                    src={getMemberZodiacSrc(m1) || "/zodiac/zodiac_tiger_item_sunglasses.png"}
                    alt={m1.nickname}
                    crossOrigin="anonymous"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xs font-black text-slate-900 mt-1 truncate max-w-full">
                  {getMemberNickname(m1)}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                  {getMemberElement(m1)} 기운
                </span>
              </div>

              {/* Center Score Pulse Badge */}
              <div className="flex flex-col items-center shrink-0 px-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500 animate-pulse" />
                </div>
                <span className="text-[10px] font-mono font-black text-rose-600 mt-0.5">
                  {pairScore}점
                </span>
              </div>

              {/* Member 2 (친구) */}
              <div className="flex flex-col items-center text-center w-24">
                <div className="w-13 h-13 rounded-full bg-slate-50 border-2 border-amber-400 flex items-center justify-center overflow-hidden shadow-xs relative">
                  <img
                    src={getMemberZodiacSrc(m2) || "/zodiac/zodiac_tiger_item_sunglasses.png"}
                    alt={m2.nickname}
                    crossOrigin="anonymous"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xs font-black text-slate-900 mt-1 truncate max-w-full">
                  {getMemberNickname(m2)}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                  {getMemberElement(m2)} 기운
                </span>
              </div>
            </div>

            {/* 6 Vital Category Progress Bars */}
            <div className="space-y-1.5 pt-0.5">
              {pair6Categories.categories.map((cat) => (
                <div key={cat.id} className="text-left bg-slate-50/80 rounded-lg p-1.5 border border-slate-100">
                  <div className="flex items-center justify-between text-[10px] mb-0.5 font-bold">
                    <span className="flex items-center gap-1 text-slate-800">
                      <span>{cat.icon}</span>
                      <span>{cat.title}</span>
                    </span>
                    <span className="font-mono text-slate-900" style={{ color: cat.color }}>
                      {cat.score}%
                    </span>
                  </div>
                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.score}%`, backgroundColor: cat.color }}
                    />
                  </div>
                  <p className="text-[9.5px] text-slate-600 leading-tight font-medium break-keep">
                    {cat.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Tag Sticker & Watermark */}
          <div className="flex flex-col items-center gap-1 pt-1 text-center">
            <div className="w-full py-1.5 px-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-[11px] font-extrabold text-rose-200 truncate">
              🏷️ @{getMemberNickname(m2)} 우리 사주 조합 점수 실시간 확인 ✨ ({pairScore}점)
            </div>
            <div className="flex items-center justify-between w-full text-[9.5px] text-slate-400 px-1 pt-0.5">
              <span>사주·자미두수·MBTI 융합 1:1 케미</span>
              <span className="font-mono">inyeons.com</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="w-full mt-4 space-y-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isCapturing}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:opacity-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isCapturing ? "포스터 고화질 생성 중..." : "📸 인스타 스토리 포스터 저장하기"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyTag}
            className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>{copiedText || `@${getMemberNickname(m2)} 태그 문구 복사하기`}</span>
          </button>
        </div>

        {/* Mobile in-app long press popup if direct download is blocked */}
        {showLongPressGuide && capturedImageUrl && (
          <div className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4">
            <div className="bg-[#141b29] border border-white/20 rounded-3xl p-5 max-w-sm w-full text-center space-y-4 text-white">
              <p className="text-sm font-bold text-rose-300">이미지를 길게 눌러 사진첩에 저장하세요</p>
              <img
                src={capturedImageUrl}
                alt="1:1 스토리 포스터"
                className="max-h-[60vh] mx-auto rounded-2xl shadow-2xl border border-white/10"
              />
              <button
                type="button"
                onClick={() => setShowLongPressGuide(false)}
                className="w-full py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
