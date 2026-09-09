import React, { useRef, useState, useMemo } from "react";
import { X, Download, Share2, Sparkles, AlertCircle, Copy, Check } from "lucide-react";
import html2canvas from "html2canvas-pro";
import { Member } from "../types";
import { getMemberZodiacSrc, calculateMemberRole, ROLE_DETAILS, ROLE_RING_COLOR } from "./ZodiacAvatar";
import { getMemberNickname, getMemberElement } from "../utils/memberHelper";

interface GroupStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomTitle?: string;
  allMembers?: Member[];
  groupScore?: number;
}

export default function GroupStoryModal({
  isOpen,
  onClose,
  roomTitle = "우리들의 단톡방",
  allMembers = [],
  groupScore = 58
}: GroupStoryModalProps) {
  const storyCardRef = useRef<HTMLDivElement>(null);
  const [selectedPreset, setSelectedPreset] = useState<1 | 2 | 3>(1);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState("");

  // 대표 멤버 최대 3명 추출
  const displayMembers = useMemo(() => {
    if (!allMembers || allMembers.length === 0) {
      return [
        { nickname: "민서", element: "목", roleName: "👑 캡틴", ringColor: "#3e7c4f", avatarSrc: "/zodiac/zodiac_tiger_item_sunglasses.png" },
        { nickname: "지후", element: "화", roleName: "✨ 스파크", ringColor: "#c24234", avatarSrc: "/zodiac/zodiac_rabbit_item_scarf.png" },
        { nickname: "서준", element: "토", roleName: "🛡️ 키퍼", ringColor: "#b07c3f", avatarSrc: "/zodiac/zodiac_dragon_item_glasses.png" },
      ];
    }
    return allMembers.slice(0, 3).map((m) => {
      const role = calculateMemberRole(m);
      const roleDetail = ROLE_DETAILS[role.key];
      const ringColor = ROLE_RING_COLOR[role.key] || "#c24234";
      const avatarSrc = getMemberZodiacSrc(m);
      const roleEmoji = role.key === "spark" ? "✨" : role.key === "captain" ? "👑" : role.key === "keeper" ? "🛡️" : role.key === "healer" ? "🌿" : "🦉";
      return {
        nickname: getMemberNickname(m),
        element: getMemberElement(m),
        roleName: `${roleEmoji} ${roleDetail.role}`,
        ringColor,
        avatarSrc: avatarSrc || "/zodiac/zodiac_tiger_item_sunglasses.png",
      };
    });
  }, [allMembers]);

  // 프리셋 정의
  const presetData = useMemo(() => {
    const name1 = displayMembers[0]?.nickname || "멤버1";
    const name2 = displayMembers[1]?.nickname || "멤버2";
    const name3 = displayMembers[2]?.nickname || "멤버3";

    return {
      1: {
        headline: <>우리 모임의 기운,<br /><span className="text-[#ff5a36]">누가 서로를 채워줄까?</span></>,
        subHeadline: `사주 오행으로 풀어본 ${allMembers.length || 3}인 상생 시너지 리포트`,
        score: groupScore || 58,
        quote: `"서로의 부족한 기운을 든든하게 채워주는 환상의 밸런스"`,
        stats: [82, 68, 74, 88],
        desc: `서로 다른 오행 에너지가 만나 특별한 활력을 만들며, 결정적인 순간에 ${name2}의 추진력과 ${name3}의 안정감이 합쳐져 모임이 단단하게 유지됩니다.`,
        bubble: `🏷️ #모임사주 #인연케미 @친구태그`
      },
      2: {
        headline: <>단톡방의 숨은 중심,<br /><span className="text-[#ff5a36]">알고 보면 진짜 실세는?</span></>,
        subHeadline: "사주로 밝혀진 우리 모임의 분위기 메이커와 결정권자",
        score: Math.min(96, Math.max(88, groupScore + 20)),
        quote: `"도원결의급 단체 시너지! 한 사람이 끌고 모두가 받쳐주는 케미"`,
        stats: [94, 92, 88, 96],
        desc: `${name2}가 활기차게 분위기를 띄우고 ${name3}가 세심하게 조율하며, 모임의 중요한 순간에는 ${name1}의 든든한 존재감이 중심을 잡아줍니다.`,
        bubble: `🏷️ #단톡방실세 #모임케미 @친구태그`
      },
      3: {
        headline: <>서로 달라서 더 끌리는<br /><span className="text-[#00e5ff]">불과 얼음의 반전 궁합</span></>,
        subHeadline: "다름이 매력이 되는 극과 극의 짜릿한 상생 조합",
        score: Math.min(48, Math.max(38, groupScore - 15)),
        quote: `"티격태격할수록 더 끈끈해지는 특별한 콤비 시너지"`,
        stats: [68, 55, 62, 78],
        desc: `${name2}의 열정적인 기운과 ${name3}의 차분한 이성이 조화를 이루며, ${name1}이 따뜻한 가교 역할을 해줄 때 가장 빛나는 조합입니다.`,
        bubble: `🏷️ #반전케미 #인연사주 @친구태그`
      }
    };
  }, [displayMembers, allMembers, groupScore]);

  const current = presetData[selectedPreset];

  if (!isOpen) return null;

  const handleDownloadImage = async () => {
    if (!storyCardRef.current || isCapturing) return;
    setIsCapturing(true);

    try {
      const canvas = await html2canvas(storyCardRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#0a0e17",
        logging: false,
      });

      const dataUrl = canvas.toDataURL("image/png");
      setCapturedImageUrl(dataUrl);

      const link = document.createElement("a");
      link.download = `saju_story_${selectedPreset}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      navigator.clipboard.writeText(`${current.bubble}\nhttps://inyeons.com`);
      setCopiedText("스토리 이미지 저장 및 태그 복사 완료!");
      setTimeout(() => setCopiedText(""), 3500);
    } catch (err: any) {
      console.error("Story capture failed:", err);
      alert("이미지 다운로드 중 오류가 발생했습니다: " + err?.message);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[440px] flex flex-col items-center select-none">
        
        {/* Top Action Bar */}
        <div className="w-full flex items-center justify-between mb-3 px-1 text-white">
          <span className="text-sm font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#ff5a36]" />
            ✨ 인스타 스토리 공유 카드
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Selector */}
        <div className="w-full mb-3.5 bg-[#141b29] border border-white/10 p-1 rounded-xl flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSelectedPreset(1)}
            className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all text-center ${
              selectedPreset === 1
                ? "bg-[#ff5a36] text-white shadow-md shadow-[#ff5a36]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ✨ 기운 상생상극
          </button>
          <button
            type="button"
            onClick={() => setSelectedPreset(2)}
            className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all text-center ${
              selectedPreset === 2
                ? "bg-[#ff5a36] text-white shadow-md shadow-[#ff5a36]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            👑 단톡방 실세
          </button>
          <button
            type="button"
            onClick={() => setSelectedPreset(3)}
            className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all text-center ${
              selectedPreset === 3
                ? "bg-[#ff5a36] text-white shadow-md shadow-[#ff5a36]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ⚡ 반전 케미
          </button>
        </div>

        {/* ──────────────────────────────────────────
             9:16 Instagram Story Canvas (Target: 1080x1920)
           ────────────────────────────────────────── */}
        <div
          ref={storyCardRef}
          className="w-full h-[620px] rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden border border-white/15 shadow-2xl text-white"
          style={{
            background: "linear-gradient(180deg, #0f1523 0%, #080b12 100%)",
          }}
        >
          {/* Top Story Indicators */}
          <div>
            <div className="flex gap-1 w-full mb-3">
              <div className="h-0.5 flex-1 bg-[#ff5a36] rounded-full" />
              <div className="h-0.5 flex-1 bg-white/20 rounded-full" />
              <div className="h-0.5 flex-1 bg-white/20 rounded-full" />
            </div>

            {/* Header Brand */}
            <div className="flex items-center justify-between mb-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-[#ff5a36]">●</span> {roomTitle}
              </div>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                INYEON SAJU
              </span>
            </div>

            {/* Headline Card */}
            <div className="mt-1 mb-2">
              <h2 className="text-[20px] font-black leading-tight tracking-tight">
                {current.headline}
              </h2>
              <p className="text-[11px] text-slate-400 mt-1">
                {current.subHeadline}
              </p>
            </div>
          </div>

          {/* Center Card: Zodiac Avatars & Score */}
          <div className="bg-white rounded-2xl p-3 text-[#1c1d21] shadow-xl my-auto">
            {/* 3 Avatars Row */}
            <div className="flex justify-around items-center py-1 mb-2 border-b border-[#f0f0ec]">
              {displayMembers.map((m, idx) => (
                <div key={idx} className="flex flex-col items-center text-center w-20">
                  <div
                    className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden mb-1 shadow-sm relative"
                    style={{ border: `2px solid ${m.ringColor}` }}
                  >
                    <img
                      src={m.avatarSrc}
                      alt={m.nickname}
                      crossOrigin="anonymous"
                      className="w-10 h-10 object-contain scale-110 translate-y-0.5"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-[#1c1d21] leading-tight truncate max-w-full">
                    {m.nickname}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 bg-[#f4f4f1] text-[#55565e]">
                    {m.roleName}
                  </span>
                </div>
              ))}
            </div>

            {/* Score Headline */}
            <div className="text-center mb-2 flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-1.5 font-serif text-[17px] font-bold text-[#1c1d21]">
                <span>모임 케미는</span>
                <span className="text-[#c24234] font-serif font-extrabold">{current.score}점</span>
              </div>
              <div className="text-[10.5px] text-[#55565e] mt-0.5">
                {current.quote}
              </div>
            </div>

            {/* 4 Stats bars */}
            <div className="bg-[#f4f4f1] rounded-xl p-2 space-y-1 mb-2">
              {["다양성", "순환력", "안정감", "소통력"].map((label, sIdx) => {
                const val = current.stats[sIdx];
                return (
                  <div key={label} className="flex items-center gap-2 text-[10px]">
                    <span className="w-10 text-[#1c1d21] font-semibold">{label}</span>
                    <div className="flex-1 h-1 bg-[#e7e7e2] rounded-full overflow-hidden">
                      <div className="h-full bg-[#1c1d21] rounded-full opacity-75" style={{ width: `${val}%` }} />
                    </div>
                    <span className="w-6 text-right font-mono text-[#8e8f98]">{val}</span>
                  </div>
                );
              })}
            </div>

            {/* Description */}
            <p className="text-[10px] leading-relaxed text-[#55565e] pt-1.5 border-t border-[#e7e7e2]">
              {current.desc}
            </p>
          </div>

          {/* Bottom Viral CTA */}
          <div className="flex flex-col items-center gap-1.5 pt-2">
            <div className="bg-white/10 border border-dashed border-white/30 rounded-full px-3 py-1.5 text-[10.5px] font-bold text-white flex items-center gap-1">
              {current.bubble}
            </div>
            <span className="text-[9px] text-white/40 tracking-wider">
              인연사주 · fate-analysis · 단톡방 그룹 사주 궁합
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isCapturing}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#ff5a36] to-[#ff7043] text-white font-bold text-sm shadow-lg shadow-[#ff5a36]/30 flex items-center justify-center gap-2 hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isCapturing ? "1080×1920 렌더링 중..." : "1080×1920 HD 스토리 저장"}
          </button>
        </div>

        {copiedText && (
          <div className="mt-2 text-xs font-bold text-[#35b37e] flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            {copiedText}
          </div>
        )}

        {/* Fallback Direct Preview Modal for Mobile / Pop-up blocked browsers */}
        {capturedImageUrl && (
          <div className="fixed inset-0 z-[1100] bg-black/90 p-4 flex flex-col items-center justify-center">
            <div className="bg-[#141b29] border border-white/15 rounded-2xl p-4 max-w-[380px] w-full flex flex-col items-center">
              <div className="w-full flex justify-between items-center mb-2 text-white">
                <span className="font-bold text-sm">🎉 스토리 이미지 완성!</span>
                <button
                  type="button"
                  onClick={() => setCapturedImageUrl(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 text-center mb-3">
                자동 다운로드가 안 되었다면 이미지를 <b>길게 누르거나 우클릭</b>하여 저장하세요.
              </p>
              <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-white/10 mb-3">
                <img src={capturedImageUrl} alt="Story Card" className="w-full h-auto rounded-lg" />
              </div>
              <div className="flex gap-2 w-full">
                <a
                  href={capturedImageUrl}
                  download={`inyeon-saju-story-${Date.now()}.png`}
                  className="flex-1 py-2.5 rounded-xl bg-[#ff5a36] text-white font-bold text-xs text-center"
                >
                  다시 다운로드
                </a>
                <button
                  type="button"
                  onClick={() => setCapturedImageUrl(null)}
                  className="py-2.5 px-4 rounded-xl bg-white/10 text-white font-bold text-xs"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
