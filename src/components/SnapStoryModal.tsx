import React, { useRef, useState, useEffect } from "react";
import { X, Download, Sparkles, Check, HeartHandshake, Share2, Copy } from "lucide-react";
import html2canvas from "html2canvas-pro";
import { Member } from "../types";
import { generateDedicatedChemistryCard } from "../utils/cardGenerator";
import ZodiacAvatar from "./ZodiacAvatar";

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

export default function SnapStoryModal({
  isOpen,
  onClose,
  m1,
  m2,
  pairScore,
  pairGrade,
  pairLabel,
  pairDesc
}: SnapStoryModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [theme, setTheme] = useState<"midnight" | "hanji" | "neon">("midnight");
  const [copiedText, setCopiedText] = useState("");
  const [showLongPressGuide, setShowLongPressGuide] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setCopiedText("");

    try {
      let dataUrl = "";
      // 1) Try Canvas Generator first for ultra crisp 1080x1920
      try {
        const generated = await generateDedicatedChemistryCard({
          roomTitle: "1:1 비밀 인연 스냅",
          groupScore: pairScore,
          members: [m1, m2],
          m1,
          m2,
          pairScore,
          pairLabel: pairLabel || "운명적 소울메이트",
          pairDesc: pairDesc || "서로의 기운을 밝혀주는 특별한 인연입니다."
        });
        dataUrl = generated.dataUrl;
      } catch (canvasErr) {
        console.warn("Canvas export fallback to html2canvas-pro:", canvasErr);
        if (cardRef.current) {
          const canvas = await html2canvas(cardRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null
          });
          dataUrl = canvas.toDataURL("image/png");
        }
      }

      if (!dataUrl) {
        throw new Error("이미지 생성에 실패했습니다.");
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

      // Copy tag text for Instagram
      const tagText = `🏷️ @${m2.nickname} 우리 둘만의 1:1 사주 궁합 점수: ${pairScore}점 (${pairGrade}등급)! ✨\n#인연사주 #1대1비밀궁합 #사주케미`;
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(tagText);
        } catch {
          // ignore
        }
      }

      setCopiedText(
        isMobile && isInAppBrowser
          ? "아래 카드를 길게 눌러 사진첩에 저장하세요! 인스타 태그 문구도 복사되었습니다 ✨"
          : "스토리 포스터 저장 & 인스타 태그 문구 복사 완료! 🎉"
      );
      setTimeout(() => setCopiedText(""), 4500);
    } catch (err: any) {
      console.error("Story capture error:", err);
      alert("이미지 저장 중 오류가 발생했습니다: " + (err?.message || String(err)));
    } finally {
      setIsCapturing(false);
    }
  };

  // Theme styling definitions
  const themeStyles = {
    midnight: {
      cardBg: "bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#090d16] text-white border-slate-700/50",
      accent: "text-rose-400",
      badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      sealRing: "border-amber-400/40 bg-amber-500/10 text-amber-300",
      knotColor: "#f43f5e"
    },
    hanji: {
      cardBg: "bg-gradient-to-b from-[#FAF7F2] via-[#F5EFEB] to-[#EAE0D5] text-[#2C2523] border-[#D6C7B8]",
      accent: "text-[#B93826]",
      badgeBg: "bg-[#B93826]/10 text-[#B93826] border-[#B93826]/30",
      sealRing: "border-[#B93826]/40 bg-[#B93826]/5 text-[#B93826]",
      knotColor: "#B93826"
    },
    neon: {
      cardBg: "bg-gradient-to-b from-[#18002e] via-[#090014] to-[#000000] text-white border-fuchsia-500/40",
      accent: "text-fuchsia-400",
      badgeBg: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50",
      sealRing: "border-cyan-400/50 bg-cyan-500/10 text-cyan-300",
      knotColor: "#ec4899"
    }
  }[theme];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[1000] overflow-y-auto bg-black/85 backdrop-blur-md flex flex-col items-center justify-start p-3 sm:p-6 py-6 sm:py-10 animate-fade-in"
    >
      {/* Top Floating Close */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-4 right-4 z-[1050] w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer backdrop-blur-md"
        aria-label="닫기"
      >
        <X className="w-5 h-5" />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] flex flex-col items-center select-none relative shrink-0 space-y-4"
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between px-2 text-white">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span>1:1 인스타 스토리 전용 포스터 (9:16)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Selector Pills */}
        <div className="flex items-center gap-2 p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-xs font-semibold text-white/80">
          <button
            type="button"
            onClick={() => setTheme("midnight")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              theme === "midnight" ? "bg-white text-slate-900 font-bold shadow-xs" : "hover:text-white"
            }`}
          >
            🌌 미드나잇
          </button>
          <button
            type="button"
            onClick={() => setTheme("hanji")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              theme === "hanji" ? "bg-white text-slate-900 font-bold shadow-xs" : "hover:text-white"
            }`}
          >
            📜 전통 한지
          </button>
          <button
            type="button"
            onClick={() => setTheme("neon")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              theme === "neon" ? "bg-white text-slate-900 font-bold shadow-xs" : "hover:text-white"
            }`}
          >
            🔮 네온 팝
          </button>
        </div>

        {/* 🌟 9:16 Instagram Story Canvas Card */}
        <div
          ref={cardRef}
          className={`w-full aspect-[9/16] rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden border shadow-2xl transition-colors duration-300 ${themeStyles.cardBg}`}
        >
          {/* Top Brand & Title */}
          <div className="flex items-center justify-between text-xs z-10">
            <div className="flex items-center gap-1.5 font-bold tracking-wider opacity-90">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>1:1 인연사주 운명 궁합</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-xs font-semibold">
              INSTA STORY
            </span>
          </div>

          {/* Central Visual Showdown: Avatars + Destiny Knot */}
          <div className="flex flex-col items-center justify-center space-y-6 my-auto z-10">
            <div className="flex items-center justify-center gap-4 sm:gap-6 w-full">
              {/* Creator */}
              <div className="flex flex-col items-center space-y-2 flex-1 min-w-0">
                <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md p-1.5 border border-white/20 shadow-lg flex items-center justify-center">
                  <ZodiacAvatar member={m1} size={64} fallbackEmoji={m1.character_emoji} />
                </div>
                <div className="text-center min-w-0 w-full">
                  <span className="text-[10px] opacity-70 block font-medium">초대자</span>
                  <p className="text-sm font-black truncate">{m1.nickname}</p>
                  <p className="text-[10px] opacity-80 font-mono">
                    {m1.character_animal} · {m1.saju.daymaster.gan}{m1.saju.daymaster.element}
                  </p>
                </div>
              </div>

              {/* Central Seal Badge */}
              <div className="relative flex flex-col items-center justify-center shrink-0">
                <div className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center shadow-lg ${themeStyles.sealRing}`}>
                  <span className="text-[9px] font-bold tracking-tight opacity-75">인연 지수</span>
                  <span className="text-2xl font-black font-mono leading-none">{pairScore}</span>
                  <span className="text-[9px] font-extrabold mt-0.5 tracking-wide">등급 {pairGrade}</span>
                </div>
                <div className="w-16 border-t-2 border-dashed border-rose-500/40 my-1 animate-pulse" />
              </div>

              {/* Partner */}
              <div className="flex flex-col items-center space-y-2 flex-1 min-w-0">
                <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md p-1.5 border border-white/20 shadow-lg flex items-center justify-center">
                  <ZodiacAvatar member={m2} size={64} fallbackEmoji={m2.character_emoji} />
                </div>
                <div className="text-center min-w-0 w-full">
                  <span className="text-[10px] opacity-70 block font-medium">친구</span>
                  <p className="text-sm font-black truncate">{m2.nickname}</p>
                  <p className="text-[10px] opacity-80 font-mono">
                    {m2.character_animal} · {m2.saju.daymaster.gan}{m2.saju.daymaster.element}
                  </p>
                </div>
              </div>
            </div>

            {/* Verdict Headline */}
            <div className="text-center space-y-1.5 px-3">
              <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-black border ${themeStyles.badgeBg}`}>
                {pairLabel || "운명적 소울메이트"}
              </span>
              <p className="text-xs leading-relaxed opacity-85 line-clamp-2 max-w-[280px] mx-auto">
                {pairDesc || "서로에게 긍정적인 에너지를 채워주며 함께할수록 빛나는 최고의 케미스트리입니다."}
              </p>
            </div>
          </div>

          {/* Bottom Tags & Watermark */}
          <div className="space-y-3 z-10 pt-2 border-t border-white/10">
            <div className="flex items-center justify-center gap-2 text-xs font-bold">
              <span className="px-2.5 py-1 rounded-lg bg-white/10">@{m1.nickname}</span>
              <span className="opacity-60">&</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10">@{m2.nickname}</span>
            </div>
            <p className="text-[10px] text-center opacity-60 tracking-widest font-mono">
              INYEONS.COM · 1:1 SECRET SNAP
            </p>
          </div>
        </div>

        {/* Status Toast */}
        {copiedText && (
          <div className="w-full p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-xs font-semibold text-center animate-fade-in flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{copiedText}</span>
          </div>
        )}

        {/* Action Button: Download & Copy */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isCapturing}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-[#f43f5e] via-[#e11d48] to-[#ec4899] hover:opacity-95 text-white font-bold text-sm rounded-2xl shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
        >
          {isCapturing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{isCapturing ? "포스터 이미지 생성 중..." : "📸 인스타 스토리 포스터 저장하기"}</span>
        </button>

        {/* Mobile in-app guide if needed */}
        {showLongPressGuide && capturedImageUrl && (
          <div className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-center space-y-2">
            <p className="text-xs text-white/90 font-bold">
              👇 아래 이미지를 길게 꾹 눌러 '사진 저장'을 선택해주세요!
            </p>
            <img
              src={capturedImageUrl}
              alt="Story Preview"
              className="w-40 mx-auto rounded-xl shadow-lg border border-white/30"
            />
          </div>
        )}
      </div>
    </div>
  );
}
