import React, { useRef, useState, useMemo } from "react";
import { X, Download, Share2, Sparkles, Check, Crown, Flame, Compass, Coins, Award } from "lucide-react";
import html2canvas from "html2canvas-pro";
import { Member, GroupAnalysis, PairAnalysis } from "../types";
import { getMemberZodiacSrc, calculateMemberRole, ROLE_DETAILS, ROLE_RING_COLOR } from "./ZodiacAvatar";
import { getMemberNickname, getMemberElement } from "../utils/memberHelper";
import { calculateGroupAwards, AwardItem, calculateMemberSals } from "../utils/shinsalCalculator";

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
  // 1: 인기쟁이(도화), 2: 단톡방 실세, 3: 자본주의 캐리머신(재물), 4: 탈출 넘버원(역마)
  const [selectedPreset, setSelectedPreset] = useState<1 | 2 | 3 | 4>(1);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [showLongPressGuide, setShowLongPressGuide] = useState(false);
  const [copiedText, setCopiedText] = useState("");

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

  // Real awards calculation from actual members
  const awardsResult = useMemo(() => {
    return calculateGroupAwards(allMembers, pairs, groupScore);
  }, [allMembers, pairs, groupScore]);

  // Real Dynamic Preset Content
  const presetData = useMemo(() => {
    const { dohwaKing, bossKing, wealthKing, yeokmaKing } = awardsResult;
    const cleanRoomTitle = roomTitle.replace(/\s+/g, "").slice(0, 10);

    const formatStats = (award: AwardItem, category: "dohwa" | "boss" | "wealth" | "yeokma", labels: string[]) => {
      const base = award.score;
      const m = award.winner;
      const elem = getMemberElement(m);
      const sipseong = m?.saju?.sipseong_strength || { 비겁: 20, 식상: 20, 재성: 20, 관성: 20, 인성: 20 };
      const sals = calculateMemberSals(m);

      let v1 = base, v2 = base, v3 = base, v4 = base;

      if (category === "dohwa") {
        // labels: ["시선집중", "호감지수", "셀럽아우라", "화합매력"]
        v1 = Math.min(96, Math.max(82, 80 + (sals.dohwaCount * 4) + (elem === "화" ? 5 : 0)));
        v2 = Math.min(95, Math.max(80, 78 + Math.round((sipseong.식상 || 20) * 0.35)));
        v3 = Math.min(96, Math.max(83, 82 + (sals.sals.includes("도화살") ? 8 : 2)));
        v4 = Math.min(94, Math.max(78, 77 + Math.round((sipseong.인성 || 20) * 0.3)));
      } else if (category === "boss") {
        // labels: ["통솔력", "멘탈장악", "결정타", "화합력"]
        v1 = Math.min(96, Math.max(82, 80 + Math.round((sipseong.관성 || 20) * 0.4)));
        v2 = Math.min(95, Math.max(81, 79 + Math.round((sipseong.비겁 || 20) * 0.35) + (sals.sals.includes("괴강살") ? 5 : 0)));
        v3 = Math.min(96, Math.max(80, 78 + (elem === "금" ? 7 : 2)));
        v4 = Math.min(93, Math.max(79, 76 + Math.round((sipseong.인성 || 20) * 0.35)));
      } else if (category === "wealth") {
        // labels: ["재물생산", "자산비축", "스폰서력", "하드캐리"]
        v1 = Math.min(96, Math.max(82, 80 + Math.round((sipseong.재성 || 20) * 0.4)));
        v2 = Math.min(95, Math.max(80, 78 + (elem === "토" || elem === "금" ? 6 : 2)));
        v3 = Math.min(94, Math.max(79, 77 + Math.round((sipseong.식상 || 20) * 0.35)));
        v4 = Math.min(95, Math.max(81, 80 + (sals.unseong === "건록" || sals.unseong === "제왕" ? 6 : 1)));
      } else if (category === "yeokma") {
        // labels: ["기동력", "행동반경", "번개추진", "자유본능"]
        v1 = Math.min(96, Math.max(83, 81 + (sals.yeokmaCount * 4)));
        v2 = Math.min(95, Math.max(80, 79 + (sals.sals.includes("역마살") ? 7 : 2)));
        v3 = Math.min(94, Math.max(81, 78 + (elem === "목" || elem === "화" ? 6 : 2)));
        v4 = Math.min(93, Math.max(78, 77 + Math.round((sipseong.식상 || 20) * 0.35)));
      }

      return {
        labels,
        values: [v1, v2, v3, v4]
      };
    };

    // 1. 인기쟁이 (도화 1위)
    const dohwaWinner = dohwaKing.winner;
    const dohwaRunner = dohwaKing.runnerUp || allMembers.find((m) => m.id !== dohwaWinner?.id) || dohwaWinner;
    const dohwaSals = calculateMemberSals(dohwaWinner);

    // 2. 단톡방 실세 (보스 1위)
    const bossWinner = bossKing.winner;
    const bossRunner = bossKing.runnerUp || allMembers.find((m) => m.id !== bossWinner?.id) || bossWinner;
    const bossSals = calculateMemberSals(bossWinner);

    // 3. 자본주의 캐리머신 (재물 1위)
    const wealthWinner = wealthKing.winner;
    const wealthRunner = wealthKing.runnerUp || allMembers.find((m) => m.id !== wealthWinner?.id) || wealthWinner;

    // 4. 탈출 넘버원 (역마 1위)
    const yeokmaWinner = yeokmaKing.winner;
    const yeokmaRunner = yeokmaKing.runnerUp || allMembers.find((m) => m.id !== yeokmaWinner?.id) || yeokmaWinner;

    return {
      1: {
        id: "dohwa",
        tag: "🌸 모임 공식 인기쟁이",
        themeColor: "#ec4899",
        winner: dohwaWinner,
        runner: dohwaRunner,
        displayMembers: [
          toDisplayMember(dohwaRunner, "✨ 매력 라이벌", "#f43f5e"),
          toDisplayMember(dohwaWinner, "🌸 도화력 1위", "#ec4899"),
        ],
        headline: (
          <>
            우리 모임 최고 인기쟁이,<br />
            <span className="text-[#f43f5e]">도화력 1위는 {getMemberNickname(dohwaWinner)}!</span>
          </>
        ),
        subHeadline: `사주 명식의 4대 왕지(子·午·卯·酉)와 ${dohwaSals.unseong} 기운`,
        score: dohwaKing.score,
        metricTitle: "도화 흡인 지수",
        quote: `"${dohwaKing.tagline.replace(/"/g, "")}"`,
        stats: formatStats(dohwaKing, "dohwa", ["시선집중", "호감지수", "셀럽아우라", "화합매력"]),
        desc: `${getMemberNickname(dohwaWinner)}님은 가만히 있어도 사람들의 시선을 이끄는 은근한 도화 에너지를 타고났습니다. 모임 단톡방과 술자리에서 독보적인 존재감을 발산합니다.`,
        bubble: `🏷️ #${cleanRoomTitle} #${dohwaKing.instagramHashtags[0].replace("#", "")} @${getMemberNickname(dohwaWinner)}`,
      },
      2: {
        id: "boss",
        tag: "👑 단톡방 숨은 실세",
        themeColor: "#ff5a36",
        winner: bossWinner,
        runner: bossRunner,
        displayMembers: [
          toDisplayMember(bossRunner, "🛡️ 부방장", "#3b82f6"),
          toDisplayMember(bossWinner, "👑 단톡방 실세", "#ff5a36"),
        ],
        headline: (
          <>
            단톡방의 진짜 보스,<br />
            <span className="text-[#ff5a36]">사주상 숨은 실세는 {getMemberNickname(bossWinner)}!</span>
          </>
        ),
        subHeadline: `멤버 전체 평균 케미와 ${bossSals.sals.slice(0, 2).join("·")}의 리더십`,
        score: bossKing.score,
        metricTitle: "조직 장악 지수",
        quote: `"${bossKing.tagline.replace(/"/g, "")}"`,
        stats: formatStats(bossKing, "boss", ["통솔력", "멘탈장악", "결정타", "화합력"]),
        desc: `${getMemberNickname(bossWinner)}님은 겉으로는 무던해 보여도 결정적 순간에 판을 뒤흔드는 실질적 권력자입니다. 멤버들의 신뢰를 한 몸에 받으며 단톡방의 중심축 역할을 합니다.`,
        bubble: `🏷️ #${cleanRoomTitle} #${bossKing.instagramHashtags[0].replace("#", "")} @${getMemberNickname(bossWinner)}`,
      },
      3: {
        id: "wealth",
        tag: "💰 자본주의 캐리머신",
        themeColor: "#eab308",
        winner: wealthWinner,
        runner: wealthRunner,
        displayMembers: [
          toDisplayMember(wealthRunner, "🪙 알짜재력", "#10b981"),
          toDisplayMember(wealthWinner, "💰 재물운 1위", "#eab308"),
        ],
        headline: (
          <>
            회식 때 제일 든든한,<br />
            <span className="text-[#eab308]">모임의 물주 {getMemberNickname(wealthWinner)}!</span>
          </>
        ),
        subHeadline: `사주 명식의 왕성한 재성(財星)과 자산 비축 에너지`,
        score: wealthKing.score,
        metricTitle: "재물 결속 지수",
        quote: `"${wealthKing.tagline.replace(/"/g, "")}"`,
        stats: formatStats(wealthKing, "wealth", ["재물생산", "자산비축", "스폰서력", "하드캐리"]),
        desc: `${getMemberNickname(wealthWinner)}님은 모임의 곳간을 채우고 사업과 재테크에서 탁월한 수완을 발휘할 기운입니다. 이번 모임 회식은 ${getMemberNickname(wealthWinner)}님에게 기대해 보세요!`,
        bubble: `🏷️ #${cleanRoomTitle} #${wealthKing.instagramHashtags[0].replace("#", "")} @${getMemberNickname(wealthWinner)}`,
      },
      4: {
        id: "yeokma",
        tag: "🐎 탈출 넘버원 역마러",
        themeColor: "#06b6d4",
        winner: yeokmaWinner,
        runner: yeokmaRunner,
        displayMembers: [
          toDisplayMember(yeokmaRunner, "⚡ 번개메이트", "#8b5cf6"),
          toDisplayMember(yeokmaWinner, "🐎 역마력 1위", "#06b6d4"),
        ],
        headline: (
          <>
            주말에 집에 안 붙어있는,<br />
            <span className="text-[#06b6d4]">초고속 기동력 1위 {getMemberNickname(yeokmaWinner)}!</span>
          </>
        ),
        subHeadline: `사생지(寅·申·巳·亥)와 역마의 폭발적 활동 반경`,
        score: yeokmaKing.score,
        metricTitle: "활동 기동 지수",
        quote: `"${yeokmaKing.tagline.replace(/"/g, "")}"`,
        stats: formatStats(yeokmaKing, "yeokma", ["기동력", "행동반경", "번개추진", "자유본능"]),
        desc: `${getMemberNickname(yeokmaWinner)}님은 약속이 잡히면 번개처럼 달려오고 전국 방방곡곡 여행을 주도하는 에너자이저입니다. 모임의 야외 활동과 여행은 이 사람 손에 달렸습니다.`,
        bubble: `🏷️ #${cleanRoomTitle} #${yeokmaKing.instagramHashtags[0].replace("#", "")} @${getMemberNickname(yeokmaWinner)}`,
      },
    };
  }, [awardsResult, allMembers, roomTitle]);

  const current = presetData[selectedPreset];

  if (!isOpen) return null;

  const handleDownloadImage = async () => {
    if (!storyCardRef.current || isCapturing) return;
    setIsCapturing(true);

    try {
      // 1. Ensure fonts are loaded
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // 2. Ensure all images inside card are fully loaded
      const cardImages = Array.from(storyCardRef.current.querySelectorAll("img")) as HTMLImageElement[];
      await Promise.all(
        cardImages.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise((res) => {
            img.onload = () => res(null);
            img.onerror = () => res(null);
          });
        })
      );

      // 3. High quality 9:16 capture with complete style and font serialization
      const canvas = await html2canvas(storyCardRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#06080e",
        logging: false,
        onclone: (clonedDoc, clonedElement) => {
          // Copy dynamic style tags
          try {
            const originalStyles = document.querySelectorAll("style");
            originalStyles.forEach((styleTag) => {
              clonedDoc.head.appendChild(styleTag.cloneNode(true));
            });
          } catch (e) {
            console.warn("Failed to clone style tags in GroupStoryModal:", e);
          }

          // 0. Physically remove all data-capture-hide elements
          try {
            clonedElement.querySelectorAll("[data-capture-hide]").forEach((el) => el.remove());
          } catch (e) {
            console.warn("Failed to remove data-capture-hide in GroupStoryModal:", e);
          }

          // Serialize css rules from document stylesheets
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
                // Cross-origin stylesheet security fallback
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

              const innerStyle = clonedDoc.createElement("style");
              innerStyle.innerHTML = compiledCss;
              clonedElement.appendChild(innerStyle);
            } catch (e) {
              console.warn("Failed to inject serialized style rules:", e);
            }
          }

          // Disable all animations on cloned elements
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
          } catch (e) {
            console.warn("Failed to inject animation reset:", e);
          }
        },
      });

      const dataUrl = canvas.toDataURL("image/png");
      setCapturedImageUrl(dataUrl);

      const filename = `inyeon_story_${current.id}_${getMemberNickname(current.winner)}.png`;

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

      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(`${current.bubble}\nhttps://inyeons.com`);
        } catch (clipErr) {
          console.debug("Clipboard text write failed:", clipErr);
        }
      }
      setCopiedText(
        isMobile && isInAppBrowser
          ? "카드를 길게 눌러 사진첩에 저장하세요! 태그도 복사되었습니다 ✨"
          : "스토리 이미지 저장 및 태그 복사 완료! 인스타에 올려보세요 🎉"
      );
      setTimeout(() => setCopiedText(""), 4500);
    } catch (err: any) {
      console.error("Story capture failed:", err);
      alert("이미지 다운로드 중 오류가 발생했습니다: " + (err?.message || err));
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-[420px] flex flex-col items-center select-none">
        
        {/* Top Action Bar */}
        <div className="w-full flex items-center justify-between mb-2.5 px-1 text-white">
          <span className="text-sm font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#ff5a36]" />
            인스타 스토리 9:16 사주 어워즈
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Awards Preset Selector */}
        <div className="w-full mb-3 bg-[#141b29] border border-white/10 p-1 rounded-xl grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => setSelectedPreset(1)}
            className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center truncate ${
              selectedPreset === 1
                ? "bg-[#ec4899] text-white shadow-md shadow-[#ec4899]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🌸 인기쟁이
          </button>
          <button
            type="button"
            onClick={() => setSelectedPreset(2)}
            className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center truncate ${
              selectedPreset === 2
                ? "bg-[#ff5a36] text-white shadow-md shadow-[#ff5a36]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            👑 단톡실세
          </button>
          <button
            type="button"
            onClick={() => setSelectedPreset(3)}
            className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center truncate ${
              selectedPreset === 3
                ? "bg-[#eab308] text-white shadow-md shadow-[#eab308]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            💰 캐리머신
          </button>
          <button
            type="button"
            onClick={() => setSelectedPreset(4)}
            className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center truncate ${
              selectedPreset === 4
                ? "bg-[#06b6d4] text-white shadow-md shadow-[#06b6d4]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🐎 역마러
          </button>
        </div>

        {/* ──────────────────────────────────────────
             9:16 Instagram Story Canvas (Target: 1080x1920)
           ────────────────────────────────────────── */}
        <div
          ref={storyCardRef}
          className="w-full h-[620px] rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden border border-white/15 shadow-2xl text-white"
          style={{
            background: "linear-gradient(180deg, #0c101c 0%, #06080e 100%)",
          }}
        >
          {/* Top Story Indicators */}
          <div>
            <div className="flex gap-1 w-full mb-3">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-0.5 flex-1 rounded-full ${
                    selectedPreset === step ? "bg-[#ff5a36]" : "bg-white/20"
                  }`}
                />
              ))}
            </div>

            {/* Header Brand */}
            <div className="flex items-center justify-between mb-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <span style={{ color: current.themeColor }}>●</span> {roomTitle}
              </div>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                INYEON AWARDS
              </span>
            </div>

            {/* Award Badge Pill */}
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 border border-white/15 mb-2" style={{ color: current.themeColor }}>
              <Award className="w-3.5 h-3.5" />
              <span>{current.tag}</span>
            </div>

            {/* Headline Card */}
            <div className="mt-0.5 mb-1.5">
              <h2 className="text-[19px] font-black leading-tight tracking-tight">
                {current.headline}
              </h2>
              <p className="text-[11px] text-slate-400 mt-1">
                {current.subHeadline}
              </p>
            </div>
          </div>

          {/* Center Card: 1위 & 2위 Profile & Real Metrics */}
          <div className="bg-white rounded-2xl p-3.5 text-[#1c1d21] shadow-xl my-auto relative">
            {/* Top 1 Crown Indicator */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider flex items-center gap-1 shadow-md">
              <Crown className="w-3 h-3 fill-current" />
              <span>1위 당선자</span>
            </div>

            {/* Members Representation */}
            <div className="flex justify-around items-center pt-2 pb-1 mb-2 border-b border-[#f0f0ec]">
              {current.displayMembers.map((m, idx) => (
                <div key={`${m.nickname}-${idx}`} className="flex flex-col items-center text-center w-28">
                  <div
                    className={`rounded-full bg-white flex items-center justify-center overflow-hidden mb-1 shadow-sm relative ${
                      idx === 1 ? "w-16 h-16 ring-4 ring-amber-400/40" : "w-12 h-12 opacity-80"
                    }`}
                    style={{ border: `3px solid ${m.ringColor}` }}
                  >
                    <img
                      src={m.avatarSrc}
                      alt={m.nickname}
                      crossOrigin="anonymous"
                      className="w-full h-full object-contain scale-110 translate-y-0.5"
                    />
                  </div>
                  <span className={`text-[#1c1d21] leading-tight truncate max-w-full ${idx === 1 ? "text-xs font-black" : "text-[11px] font-medium"}`}>
                    {m.nickname}
                  </span>
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded mt-0.5 bg-[#f4f4f1] text-[#55565e] truncate max-w-full">
                    {m.roleName}
                  </span>
                </div>
              ))}
            </div>

            {/* Score Headline */}
            <div className="text-center mb-2 flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-1.5 text-[16px] font-bold text-[#1c1d21]">
                <span>{current.metricTitle}</span>
                <span className="font-extrabold text-[19px]" style={{ color: current.themeColor }}>
                  {current.score}점
                </span>
              </div>
              <div className="text-[10.5px] text-[#55565e] mt-0.5 font-medium italic">
                {current.quote}
              </div>
            </div>

            {/* 4 Stats bars */}
            <div className="bg-[#f4f4f1] rounded-xl p-2.5 space-y-1.5 mb-2">
              {current.stats.labels.map((label, sIdx) => {
                const val = current.stats.values[sIdx];
                return (
                  <div key={label} className="flex items-center gap-2 text-[10px]">
                    <span className="w-14 text-[#1c1d21] font-semibold text-left shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 bg-[#e2e2dc] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full opacity-90 transition-all duration-500"
                        style={{ width: `${Math.min(100, val)}%`, backgroundColor: current.themeColor }}
                      />
                    </div>
                    <span className="w-7 text-right font-mono font-bold text-[#1c1d21]">{val}%</span>
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
          <div className="flex flex-col items-center gap-1 pt-1">
            <div className="w-full py-1.5 px-3 rounded-xl bg-white/10 border border-white/15 text-[10.5px] font-medium text-center text-slate-300 truncate">
              {current.bubble}
            </div>
            <div className="flex items-center justify-between w-full text-[10px] text-slate-500 px-1 pt-0.5">
              <span>사주·자미두수·MBTI 종합 분석</span>
              <span>인연의 사주 · inyeons.com</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="w-full flex flex-col gap-2 mt-3.5">
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isCapturing}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#ff5a36] to-[#ec4899] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#ff5a36]/30 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isCapturing ? (
              <span>9:16 이미지 고화질 생성 중...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>스토리 이미지 저장하고 친구 태그하기</span>
              </>
            )}
          </button>

          {copiedText && (
            <div className="w-full py-2 px-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs text-center flex items-center justify-center gap-1.5 animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>{copiedText}</span>
            </div>
          )}
        </div>

      </div>

      {/* 모바일 인앱 브라우저용 길게 눌러 저장 가이드 모달 */}
      {showLongPressGuide && capturedImageUrl && (
        <div className="fixed inset-0 z-[1100] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-sm w-full p-4 text-white text-center space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-amber-400">📱 사진첩에 저장하는 법</span>
              <button
                type="button"
                onClick={() => setShowLongPressGuide(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              아래 이미지를 <strong>손가락으로 1초간 길게 누르면</strong> 나타나는 메뉴에서 <strong className="text-amber-300">'사진에 저장'</strong> 또는 <strong className="text-amber-300">'이미지 다운로드'</strong>를 선택하세요.
            </p>
            <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-white/10 shadow-inner p-1 bg-black/50">
              <img
                src={capturedImageUrl}
                alt="스토리 카드"
                className="w-full h-auto rounded-lg shadow-md"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowLongPressGuide(false)}
              className="w-full py-2.5 bg-gradient-to-r from-[#ff5a36] to-[#ec4899] text-white font-bold rounded-xl text-xs"
            >
              확인 완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
