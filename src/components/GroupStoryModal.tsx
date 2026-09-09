import React, { useRef, useState, useMemo } from "react";
import { X, Download, Share2, Sparkles, AlertCircle, Copy, Check } from "lucide-react";
import html2canvas from "html2canvas-pro";
import { Member, GroupAnalysis, PairAnalysis } from "../types";
import { getMemberZodiacSrc, calculateMemberRole, ROLE_DETAILS, ROLE_RING_COLOR } from "./ZodiacAvatar";
import { getMemberNickname, getMemberElement } from "../utils/memberHelper";

interface GroupStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomTitle?: string;
  allMembers?: Member[];
  groupScore?: number;
  groupAnalysis?: GroupAnalysis;
  pairs?: PairAnalysis[];
}

interface StoryDisplayMember {
  nickname: string;
  element: string;
  roleName: string;
  ringColor: string;
  avatarSrc: string;
}

export default function GroupStoryModal({
  isOpen,
  onClose,
  roomTitle = "우리들의 모임",
  allMembers = [],
  groupScore = 80,
  groupAnalysis,
  pairs = [],
}: GroupStoryModalProps) {
  const storyCardRef = useRef<HTMLDivElement>(null);
  const [selectedPreset, setSelectedPreset] = useState<1 | 2 | 3>(1);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState("");

  // Helper to find member by ID or Nickname
  const findMember = (idOrName?: string): Member | undefined => {
    if (!idOrName) return undefined;
    const norm = idOrName.trim().toLowerCase().replace(/님$/, "");
    return allMembers.find((m) => {
      const mId = m.id.trim().toLowerCase();
      const mNick = m.nickname.trim().toLowerCase().replace(/님$/, "");
      return mId === norm || mNick === norm || mId.includes(norm) || mNick.includes(norm) || norm.includes(mNick);
    });
  };

  // Helper to convert Member to StoryDisplayMember
  const toDisplayMember = (m?: Member, customRole?: string, customRingColor?: string): StoryDisplayMember => {
    if (!m) {
      return {
        nickname: "멤버",
        element: "기운",
        roleName: customRole || "✨ 멤버",
        ringColor: customRingColor || "#c24234",
        avatarSrc: "/zodiac/zodiac_tiger_item_sunglasses.png",
      };
    }
    const role = calculateMemberRole(m);
    const roleDetail = ROLE_DETAILS[role.key];
    const ringColor = customRingColor || ROLE_RING_COLOR[role.key] || "#c24234";
    const avatarSrc = getMemberZodiacSrc(m);
    const roleEmoji = role.key === "spark" ? "✨" : role.key === "captain" ? "👑" : role.key === "keeper" ? "🛡️" : role.key === "healer" ? "🌿" : "🦉";
    return {
      nickname: getMemberNickname(m),
      element: getMemberElement(m) || "기운",
      roleName: customRole || `${roleEmoji} ${roleDetail?.role || "멤버"}`,
      ringColor,
      avatarSrc: avatarSrc || "/zodiac/zodiac_tiger_item_sunglasses.png",
    };
  };

  // Real data dynamics calculation
  const dynamics = useMemo(() => {
    const validPairs = pairs && pairs.length > 0
      ? [...pairs].sort((a, b) => (b.score || 0) - (a.score || 0))
      : [];

    // 1. Top Synergy Pair
    const topPair = validPairs[0];
    const topM1 = topPair ? (findMember(topPair.member_id_1) || allMembers[0]) : allMembers[0];
    const topM2 = topPair ? (findMember(topPair.member_id_2) || allMembers[1]) : (allMembers[1] || allMembers[0]);
    const topScore = topPair ? topPair.score : (groupScore ? Math.min(98, groupScore + 8) : 94);

    // 2. Contrast / Tension Pair (bottom of sorted pairs)
    const botPair = validPairs.length > 1 ? validPairs[validPairs.length - 1] : null;
    const botM1 = botPair ? (findMember(botPair.member_id_1) || allMembers[0]) : allMembers[0];
    const botM2 = botPair ? (findMember(botPair.member_id_2) || allMembers[allMembers.length - 1]) : (allMembers[allMembers.length - 1] || allMembers[1]);
    const botScore = botPair ? botPair.score : (groupScore ? Math.max(50, groupScore - 18) : 62);

    // 3. Power Hub Member (Member with highest average chemistry across group)
    let powerMember = allMembers[0];
    let powerMemberAvg = 85;

    if (allMembers.length > 0 && validPairs.length > 0) {
      const scoreMap: Record<string, { sum: number; count: number }> = {};
      validPairs.forEach((p) => {
        const s = p.score || 70;
        if (!scoreMap[p.member_id_1]) scoreMap[p.member_id_1] = { sum: 0, count: 0 };
        if (!scoreMap[p.member_id_2]) scoreMap[p.member_id_2] = { sum: 0, count: 0 };
        scoreMap[p.member_id_1].sum += s;
        scoreMap[p.member_id_1].count += 1;
        scoreMap[p.member_id_2].sum += s;
        scoreMap[p.member_id_2].count += 1;
      });

      let highestAvg = 0;
      let highestId = allMembers[0]?.id;
      Object.entries(scoreMap).forEach(([id, { sum, count }]) => {
        if (count > 0) {
          const avg = sum / count;
          if (avg > highestAvg) {
            highestAvg = avg;
            highestId = id;
          }
        }
      });

      const found = findMember(highestId);
      if (found) {
        powerMember = found;
        powerMemberAvg = Math.round(highestAvg);
      }
    }

    // 4. Mediator / Bridge Member (someone distinct from botM1 & botM2)
    const mediator = allMembers.find((m) => m.id !== botM1?.id && m.id !== botM2?.id) || powerMember || allMembers[0];

    // 5. Group Element Distribution
    const elements = allMembers.map((m) => getMemberElement(m)).filter(Boolean);
    const uniqueElements = new Set(elements);
    const diversityScore = Math.min(98, Math.max(68, uniqueElements.size * 22));
    const actualGroupScore = groupAnalysis?.overall_score || groupScore || 85;

    return {
      topM1,
      topM2,
      topScore,
      botM1,
      botM2,
      botScore,
      powerMember,
      powerMemberAvg,
      mediator,
      diversityScore,
      actualGroupScore,
      groupTitle: groupAnalysis?.title || roomTitle,
      atmosphere: groupAnalysis?.atmosphere || "서로의 부족한 기운을 채워주는 든든한 상생 시너지",
      synergyTips: groupAnalysis?.synergy_tips || "서로 다른 기운과 강점을 존중할 때 시너지가 배가됩니다.",
    };
  }, [allMembers, pairs, groupAnalysis, groupScore, roomTitle]);

  // Real Dynamic Preset Content
  const presetData = useMemo(() => {
    const {
      topM1,
      topM2,
      topScore,
      botM1,
      botM2,
      botScore,
      powerMember,
      powerMemberAvg,
      mediator,
      diversityScore,
      actualGroupScore,
      groupTitle,
      atmosphere,
      synergyTips,
    } = dynamics;

    const name1 = topM1?.nickname || "멤버1";
    const name2 = topM2?.nickname || "멤버2";
    const powerName = powerMember?.nickname || "실세";
    const botName1 = botM1?.nickname || "멤버1";
    const botName2 = botM2?.nickname || "멤버2";
    const cleanRoomTitle = roomTitle.replace(/\s+/g, "").slice(0, 10);

    return {
      1: {
        members: [
          toDisplayMember(topM1, "🔥 최고시너지", "#c24234"),
          toDisplayMember(powerMember, "👑 모임허브", "#3e7c4f"),
          toDisplayMember(topM2, "🔥 최고시너지", "#c24234"),
        ],
        headline: (
          <>
            우리 모임의 기운,<br />
            <span className="text-[#ff5a36]">{name1} & {name2} {topScore}점 시너지!</span>
          </>
        ),
        subHeadline: `사주 오행으로 분석한 ${allMembers.length || 3}인 [${groupTitle}] 종합 리포트`,
        score: actualGroupScore,
        quote: `"${atmosphere}"`,
        stats: [
          diversityScore,
          actualGroupScore,
          topScore,
          Math.round((topScore + actualGroupScore) / 2),
        ],
        statsLabels: ["다양성", "순환력", "최고결속", "화합력"],
        desc: `${name1}님(${topM1?.saju?.daymaster?.element || "기운"})과 ${name2}님(${topM2?.saju?.daymaster?.element || "기운"})이 ${topScore}점 특급 엔진으로 모임을 이끌며, ${synergyTips}`,
        bubble: `🏷️ #${cleanRoomTitle} #${name1}X${name2}_${topScore}점 @친구태그`,
      },
      2: {
        members: [
          toDisplayMember(allMembers.find((m) => m.id !== powerMember?.id) || topM1, "✨ 분위기메이커", "#f59e0b"),
          toDisplayMember(powerMember, "👑 단톡방 실세", "#ff5a36"),
          toDisplayMember(allMembers.reverse().find((m) => m.id !== powerMember?.id) || topM2, "🛡️ 든든한가드", "#3b82f6"),
        ],
        headline: (
          <>
            단톡방의 숨은 중심,<br />
            <span className="text-[#ff5a36]">사주상 진짜 실세는 {powerName}?</span>
          </>
        ),
        subHeadline: `모임원 전체 평균 케미 ${powerMemberAvg}점을 기록한 기운의 허브`,
        score: powerMemberAvg,
        quote: `"${powerName}님이 중심을 잡고 모임의 에너지를 묵직하게 지탱합니다"`,
        stats: [
          Math.min(99, powerMemberAvg + 4),
          Math.min(98, powerMemberAvg + 2),
          Math.min(99, powerMemberAvg + 5),
          powerMemberAvg,
        ],
        statsLabels: ["장악력", "포용력", "존재감", "화합력"],
        desc: `${powerName}님은 ${powerMember?.saju?.daymaster?.element || "따뜻한"} 기운으로 멤버들과 고른 궁합을 보이며, 말없이 있어도 모임의 멘탈과 결속을 지탱하는 진정한 실세 역할을 합니다.`,
        bubble: `🏷️ #단톡방실세_${powerName} #모임보스 @${powerName}`,
      },
      3: {
        members: [
          toDisplayMember(botM1, "⚡ 개성파", "#00e5ff"),
          toDisplayMember(mediator, "🌿 중재자", "#3e7c4f"),
          toDisplayMember(botM2, "⚡ 반전파", "#00e5ff"),
        ],
        headline: (
          <>
            서로 달라서 더 끌리는<br />
            <span className="text-[#00e5ff]">{botName1} & {botName2} 반전 케미</span>
          </>
        ),
        subHeadline: `${botM1?.saju?.daymaster?.element || "불"}과 ${botM2?.saju?.daymaster?.element || "물"}의 아슬아슬 짜릿한 상생 조합`,
        score: botScore,
        quote: `"부딪힐수록 서로의 빈틈을 메우는 독특한 반전 시너지"`,
        stats: [95, 92, Math.max(68, botScore + 12), 96],
        statsLabels: ["텐션감", "솔직함", "상호보완", "반전매력"],
        desc: `${botName1}님과 ${botName2}님은 성향 차이로 묘한 긴장감이 있지만, ${mediator ? `${mediator.nickname}님의 조율과 ` : ""}명확한 역할 분담이 이뤄지면 가장 매력적인 반전 콤비가 됩니다.`,
        bubble: `🏷️ #반전케미_${botName1}_${botName2} #단짝궁합 @친구태그`,
      },
    };
  }, [dynamics, allMembers, roomTitle]);

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
              {current.members.map((m, idx) => (
                <div key={`${m.nickname}-${idx}`} className="flex flex-col items-center text-center w-20">
                  <div
                    className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden mb-1 shadow-sm relative"
                    style={{ border: `2.5px solid ${m.ringColor}` }}
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
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 bg-[#f4f4f1] text-[#55565e] truncate max-w-full">
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
              {current.statsLabels.map((label, sIdx) => {
                const val = current.stats[sIdx];
                return (
                  <div key={label} className="flex items-center gap-2 text-[10px]">
                    <span className="w-12 text-[#1c1d21] font-semibold text-left">{label}</span>
                    <div className="flex-1 h-1.5 bg-[#e7e7e2] rounded-full overflow-hidden">
                      <div className="h-full bg-[#1c1d21] rounded-full opacity-80" style={{ width: `${Math.min(100, val)}%` }} />
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
