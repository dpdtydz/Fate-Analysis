import React, { useRef, useState, useMemo, useEffect } from "react";
import { X, Download, Share2, Sparkles, Check, Crown, Flame, Compass, Coins, Award, Users, HeartHandshake, Zap, MessageSquare, Wine, Plane, Heart, ShieldAlert, ArrowRightLeft } from "lucide-react";
import html2canvas from "html2canvas-pro";
import { Member, GroupAnalysis, PairAnalysis } from "../types";
import { getMemberZodiacSrc, calculateMemberRole, ROLE_DETAILS, ROLE_RING_COLOR } from "./ZodiacAvatar";
import { getMemberNickname, getMemberElement } from "../utils/memberHelper";
import { calculateGroupAwards, AwardItem, calculateMemberSals } from "../utils/shinsalCalculator";
import { generateDynamicPairCompatibility, isDummyPair } from "../utils/pairChemistry";
import { generateDedicatedChemistryCard } from "../utils/cardGenerator";

interface GroupStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomTitle?: string;
  allMembers?: Member[];
  groupScore?: number;
  groupAnalysis?: GroupAnalysis;
  pairs?: PairAnalysis[];
  initialPair?: { m1: Member; m2: Member } | null;
  defaultTab?: "pair" | "group";
}

interface StoryDisplayMember {
  nickname: string;
  element: string;
  roleName: string;
  ringColor: string;
  avatarSrc: string;
}

// 6 Viral Categories for 1:1 Instagram Story
export interface PairStoryCategory {
  id: string;
  icon: string;
  title: string;
  score: number;
  comment: string;
  color: string;
}

export default function GroupStoryModal({
  isOpen,
  onClose,
  roomTitle = "우리들의 모임",
  allMembers = [],
  groupScore = 80,
  groupAnalysis,
  pairs = [],
  initialPair = null,
  defaultTab = "pair",
}: GroupStoryModalProps) {
  const storyCardRef = useRef<HTMLDivElement>(null);
  
  // Tab: "pair" (1:1 Friend Chemistry) or "group" (Group Awards)
  const [activeTab, setActiveTab] = useState<"pair" | "group">(defaultTab);

  // Selected Members for 1:1 Story
  const [memberAId, setMemberAId] = useState<string>(() => {
    if (initialPair?.m1?.id) return initialPair.m1.id;
    return allMembers[0]?.id || "";
  });
  const [memberBId, setMemberBId] = useState<string>(() => {
    if (initialPair?.m2?.id) return initialPair.m2.id;
    return allMembers[1]?.id || allMembers[0]?.id || "";
  });

  // Sync with initialPair if opened with a specific pair
  useEffect(() => {
    if (initialPair?.m1 && initialPair?.m2) {
      setMemberAId(initialPair.m1.id);
      setMemberBId(initialPair.m2.id);
      setActiveTab("pair");
    }
  }, [initialPair]);

  // Group Awards preset (1: 인기쟁이, 2: 단톡실세, 3: 캐리머신, 4: 역마러)
  const [selectedPreset, setSelectedPreset] = useState<1 | 2 | 3 | 4>(1);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [showLongPressGuide, setShowLongPressGuide] = useState(false);
  const [copiedText, setCopiedText] = useState("");

  const memberA = useMemo(() => allMembers.find(m => m.id === memberAId) || allMembers[0], [allMembers, memberAId]);
  const memberB = useMemo(() => allMembers.find(m => m.id === memberBId) || allMembers[1] || allMembers[0], [allMembers, memberBId]);

  // Find or generate pair analysis for Member A and B
  const currentPairAnalysis = useMemo(() => {
    if (!memberA || !memberB || memberA.id === memberB.id) return null;
    const matchIdOrNick = (targetIdOrNick: string, m: Member) => {
      if (!targetIdOrNick || !m) return false;
      const clean = targetIdOrNick.trim().toLowerCase().replace(/님$/, "");
      return m.id.toLowerCase() === clean || m.nickname.trim().toLowerCase().replace(/님$/, "") === clean;
    };

    const found = pairs.find(
      p => (matchIdOrNick(p.member_id_1, memberA) && matchIdOrNick(p.member_id_2, memberB)) ||
           (matchIdOrNick(p.member_id_2, memberA) && matchIdOrNick(p.member_id_1, memberB))
    );

    if (found && !isDummyPair(found)) return found;
    return generateDynamicPairCompatibility(memberA, memberB);
  }, [memberA, memberB, pairs]);

  // 1:1 6 Great Chemistry Categories Calculation
  const pair6Categories = useMemo((): { title: string; score: number; categories: PairStoryCategory[]; tagLine: string } => {
    if (!memberA || !memberB) {
      return {
        title: "환상의 인연 메이트",
        score: 88,
        categories: [],
        tagLine: "함께하면 시너지가 솟아나는 특급 조합"
      };
    }

    const pairScore = currentPairAnalysis?.score || 88;
    const elemA = getMemberElement(memberA);
    const elemB = getMemberElement(memberB);
    const salsA = calculateMemberSals(memberA);
    const salsB = calculateMemberSals(memberB);

    const hash = (memberA.id + memberB.id).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

    // 1. 티키타카 & 개그 핑퐁
    const tikitakaBase = Math.min(99, Math.max(78, pairScore + (elemA === "화" || elemB === "화" ? 3 : -2) + (hash % 5)));
    const tikitakaComment = tikitakaBase >= 92
      ? "숨만 쉬어도 빵 터짐! 침묵 1초도 못 견디는 핑퐁력"
      : tikitakaBase >= 84
      ? "쿵짝이 척척! 개그 코드 90% 일치하는 대화 메이트"
      : "조용하다가 결정적일 때 터지는 반전 티키타카";

    // 2. 술자리 & 텐션 폭발
    const alcoholBase = Math.min(99, Math.max(72, pairScore + (salsA.yeokmaCount + salsB.yeokmaCount > 0 ? 4 : 0) + ((hash * 3) % 7)));
    const alcoholComment = alcoholBase >= 92
      ? "1차에서 집에 갈 생각은 금지! 밤새 텐션 폭주각"
      : alcoholBase >= 82
      ? "안주 취향과 음주 페이스가 완벽히 맞아떨어짐"
      : "분위기 좋게 담소 나누며 가볍게 즐기는 힐링 술자리";

    // 3. 여행 & 라이프스타일
    const travelBase = Math.min(98, Math.max(70, pairScore + (salsA.sals.includes("역마살") || salsB.sals.includes("역마살") ? 5 : -1) + ((hash * 7) % 6)));
    const travelComment = travelBase >= 90
      ? "일정표 없이 떠나도 손발 척척 맞는 여행 꿀조합"
      : travelBase >= 80
      ? "즉흥과 계획이 적절히 조화를 이루는 안정적 동행"
      : "여행 스타일 조율만 살짝 거치면 무난한 메이트";

    // 4. 멘탈 힐링 & 고민 상담
    const healingBase = Math.min(99, Math.max(75, pairScore + (elemA === "토" || elemB === "토" ? 4 : 0) + ((hash * 11) % 5)));
    const healingComment = healingBase >= 92
      ? "새벽 2시에 전화해도 무조건 내 편 들어주는 안식처"
      : healingBase >= 84
      ? "속마음 털어놓으면 응어리가 풀리는 든든한 조언자"
      : "서로 배려하며 적당한 거리를 지켜주는 성숙한 관계";

    // 5. 자본주의 & 사업/동업
    const businessBase = Math.min(99, Math.max(70, pairScore + (elemA === "금" || elemB === "금" ? 4 : 0) + ((hash * 13) % 6)));
    const businessComment = businessBase >= 90
      ? "같이 복권 사거나 동업하면 곳간 채울 머니 콤비"
      : businessBase >= 80
      ? "돈 계산 철저하고 실속 확실히 챙겨주는 비즈니스 합"
      : "금전 거래는 깔끔하게, 정서적 유대는 두텁게 유지할 사이";

    // 6. 지뢰 팁 & 긁힘 방지
    const safetyScore = Math.min(98, Math.max(68, pairScore - ((hash * 17) % 9) + 4));
    const mineComment = (elemA === "화" && elemB === "수") || (elemA === "수" && elemB === "화")
      ? "주의: 둘 다 배고플 땐 말 걸지 말고 밥부터 먹일 것!"
      : (elemA === "금" && elemB === "목") || (elemA === "목" && elemB === "금")
      ? "주의: 돌직구 팩폭 금지! 칭찬과 리액션이 최고의 처방"
      : "주의: 상대방의 개인 시간과 취향을 쿨하게 존중할 것!";

    let tagLine = "찰떡같은 호흡을 자랑하는 소울메이트";
    if (pairScore >= 95) tagLine = "눈빛만 봐도 통하는 영혼의 단짝 콤비";
    else if (pairScore >= 90) tagLine = "오행과 성향이 완벽히 맞물리는 특급 엔진";
    else if (pairScore >= 80) tagLine = "서로에게 든든한 기운을 채워주는 상생 메이트";
    else tagLine = "티격태격하면서 정드는 애증의 톰과 제리";

    const categories: PairStoryCategory[] = [
      { id: "talk", icon: "🗣️", title: "티키타카 & 개그 핑퐁", score: tikitakaBase, comment: tikitakaComment, color: "#f43f5e" },
      { id: "drink", icon: "🍻", title: "술자리 & 텐션 폭발", score: alcoholBase, comment: alcoholComment, color: "#f97316" },
      { id: "travel", icon: "✈️", title: "여행 & 라이프스타일", score: travelBase, comment: travelComment, color: "#06b6d4" },
      { id: "healing", icon: "🧘", title: "멘탈 힐링 & 고민 상담", score: healingBase, comment: healingComment, color: "#10b981" },
      { id: "money", icon: "💼", title: "자본주의 & 동업 케미", score: businessBase, comment: businessComment, color: "#eab308" },
      { id: "warning", icon: "⚠️", title: "지뢰 팁 & 긁힘 방지", score: safetyScore, comment: mineComment, color: "#8b5cf6" },
    ];

    return {
      title: currentPairAnalysis?.label || tagLine,
      score: pairScore,
      categories,
      tagLine,
    };
  }, [memberA, memberB, currentPairAnalysis]);

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

  // Real Dynamic Preset Content for Group Awards
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
        v1 = Math.min(96, Math.max(82, 80 + (sals.dohwaCount * 4) + (elem === "화" ? 5 : 0)));
        v2 = Math.min(95, Math.max(80, 78 + Math.round((sipseong.식상 || 20) * 0.35)));
        v3 = Math.min(96, Math.max(83, 82 + (sals.sals.includes("도화살") ? 8 : 2)));
        v4 = Math.min(94, Math.max(78, 77 + Math.round((sipseong.인성 || 20) * 0.3)));
      } else if (category === "boss") {
        v1 = Math.min(96, Math.max(82, 80 + Math.round((sipseong.관성 || 20) * 0.4)));
        v2 = Math.min(95, Math.max(81, 79 + Math.round((sipseong.비겁 || 20) * 0.35) + (sals.sals.includes("괴강살") ? 5 : 0)));
        v3 = Math.min(96, Math.max(80, 78 + (elem === "금" ? 7 : 2)));
        v4 = Math.min(93, Math.max(79, 76 + Math.round((sipseong.인성 || 20) * 0.35)));
      } else if (category === "wealth") {
        v1 = Math.min(96, Math.max(82, 80 + Math.round((sipseong.재성 || 20) * 0.4)));
        v2 = Math.min(95, Math.max(80, 78 + (elem === "토" || elem === "금" ? 6 : 2)));
        v3 = Math.min(94, Math.max(79, 77 + Math.round((sipseong.식상 || 20) * 0.35)));
        v4 = Math.min(95, Math.max(81, 80 + (sals.unseong === "건록" || sals.unseong === "제왕" ? 6 : 1)));
      } else if (category === "yeokma") {
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

    const dohwaWinner = dohwaKing.winner;
    const dohwaRunner = dohwaKing.runnerUp || allMembers.find((m) => m.id !== dohwaWinner?.id) || dohwaWinner;
    const dohwaSals = calculateMemberSals(dohwaWinner);

    const bossWinner = bossKing.winner;
    const bossRunner = bossKing.runnerUp || allMembers.find((m) => m.id !== bossWinner?.id) || bossWinner;
    const bossSals = calculateMemberSals(bossWinner);

    const wealthWinner = wealthKing.winner;
    const wealthRunner = wealthKing.runnerUp || allMembers.find((m) => m.id !== wealthWinner?.id) || wealthWinner;

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
        bubble: `🏷️ #${cleanRoomTitle} #${dohwaKing.instagramHashtags[0]?.replace("#", "") || "인싸"} @${getMemberNickname(dohwaWinner)}`,
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
        bubble: `🏷️ #${cleanRoomTitle} #${bossKing.instagramHashtags[0]?.replace("#", "") || "실세"} @${getMemberNickname(bossWinner)}`,
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
        bubble: `🏷️ #${cleanRoomTitle} #${wealthKing.instagramHashtags[0]?.replace("#", "") || "부자"} @${getMemberNickname(wealthWinner)}`,
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
        bubble: `🏷️ #${cleanRoomTitle} #${yeokmaKing.instagramHashtags[0]?.replace("#", "") || "역마"} @${getMemberNickname(yeokmaWinner)}`,
      },
    };
  }, [awardsResult, allMembers, roomTitle]);

  const currentGroupPreset = presetData[selectedPreset];

  if (!isOpen) return null;

  const handleDownloadImage = async () => {
    if (!storyCardRef.current || isCapturing) return;
    setIsCapturing(true);

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // Pre-convert any standard <img> inside the story card
      const allImgs = Array.from(storyCardRef.current.querySelectorAll("img")) as HTMLImageElement[];
      await Promise.all(
        allImgs.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise((res) => {
            img.onload = () => res(null);
            img.onerror = () => res(null);
          });
        })
      );

      let dataUrl = "";
      if (activeTab === "pair") {
        const generated = await generateDedicatedChemistryCard({
          roomTitle: roomTitle || "우리 모임",
          groupScore: groupScore || 95,
          members: allMembers,
          m1: memberA,
          m2: memberB,
          pairScore: pair6Categories.score,
          pairLabel: pair6Categories.label,
          pairDesc: pair6Categories.desc,
        });
        dataUrl = generated.dataUrl;
      } else {
        // High quality 9:16 capture for group presets
        const canvas = await html2canvas(storyCardRef.current, {
          scale: 2.5,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#06080e",
          logging: false,
          onclone: (clonedDoc, clonedElement) => {
            try {
              const originalStyles = document.querySelectorAll("style");
              originalStyles.forEach((styleTag) => {
                clonedDoc.head.appendChild(styleTag.cloneNode(true));
              });
            } catch (e) {
              console.warn("Failed to clone styles in story modal:", e);
            }

            try {
              clonedElement.querySelectorAll("[data-capture-hide]").forEach((el) => el.remove());
            } catch (e) {
              console.warn("Failed to remove data-capture-hide:", e);
            }

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
                  // Ignore SecurityError
                }
              }
            } catch (e) {}

            if (compiledCss) {
              try {
                const styleTag = clonedDoc.createElement("style");
                styleTag.innerHTML = compiledCss;
                clonedDoc.head.appendChild(styleTag);
              } catch (e) {}
            }
          },
        });
        dataUrl = canvas.toDataURL("image/png");
      }

      setCapturedImageUrl(dataUrl);

      const filename = activeTab === "pair"
        ? `inyeon_pair_story_${getMemberNickname(memberA)}_${getMemberNickname(memberB)}.png`
        : `inyeon_story_${currentGroupPreset.id}_${getMemberNickname(currentGroupPreset.winner)}.png`;

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

      const copyTagText = activeTab === "pair"
        ? `🏷️ @${getMemberNickname(memberB)} 너 인정? ㅋㅋㅋ 우리 사주 케미 ${pair6Categories.score}점 실화냐 #인연사주 #모임궁합\nhttps://inyeons.com`
        : `${currentGroupPreset.bubble}\nhttps://inyeons.com`;

      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(copyTagText);
        } catch (clipErr) {}
      }

      setCopiedText(
        isMobile && isInAppBrowser
          ? "카드를 길게 눌러 사진첩에 저장하세요! 인스타 태그 문구도 복사되었습니다 ✨"
          : "스토리 이미지 저장 & 태그 복사 완료! 인스타에 공유해 보세요 🎉"
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
        
        {/* Top Header */}
        <div className="w-full flex items-center justify-between mb-2.5 px-1 text-white">
          <div className="flex items-center gap-1.5 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-[#ff5a36]" />
            <span>인스타 스토리 9:16 생성기</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Master Tab Switcher: [1:1 인싸 케미] vs [모임 랭킹 어워즈] */}
        <div className="w-full mb-3 bg-[#141b29] border border-white/10 p-1 rounded-xl grid grid-cols-2 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("pair")}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "pair"
                ? "bg-gradient-to-r from-[#f43f5e] to-[#ec4899] text-white shadow-md shadow-rose-500/30 font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>1:1 인싸 케미 (추천)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("group")}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "group"
                ? "bg-gradient-to-r from-[#ff5a36] to-[#eab308] text-white shadow-md shadow-amber-500/30 font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>모임 랭킹 어워즈</span>
          </button>
        </div>

        {/* Dynamic Selector based on Active Tab */}
        {activeTab === "pair" ? (
          /* Member A & Member B Switcher */
          <div className="w-full mb-3 bg-[#141b29]/80 border border-white/10 p-2 rounded-xl flex items-center justify-between gap-2 text-xs">
            <div className="flex-1 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 mb-1 font-semibold">나 (기준)</span>
              <select
                value={memberAId}
                onChange={(e) => setMemberAId(e.target.value)}
                className="w-full bg-[#0c101c] text-white text-xs font-bold px-2 py-1.5 rounded-lg border border-white/15 focus:outline-none focus:border-rose-400 cursor-pointer"
              >
                {allMembers.map(m => (
                  <option key={`opt-a-${m.id}`} value={m.id}>
                    {getMemberNickname(m)} ({getMemberElement(m)})
                  </option>
                ))}
              </select>
            </div>

            <div className="shrink-0 pt-3 text-rose-400">
              <Heart className="w-4 h-4 fill-rose-400/20" />
            </div>

            <div className="flex-1 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 mb-1 font-semibold">친구 (상대방)</span>
              <select
                value={memberBId}
                onChange={(e) => setMemberBId(e.target.value)}
                className="w-full bg-[#0c101c] text-white text-xs font-bold px-2 py-1.5 rounded-lg border border-white/15 focus:outline-none focus:border-rose-400 cursor-pointer"
              >
                {allMembers.filter(m => m.id !== memberAId).map(m => (
                  <option key={`opt-b-${m.id}`} value={m.id}>
                    {getMemberNickname(m)} ({getMemberElement(m)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          /* 4 Awards Preset Selector */
          <div className="w-full mb-3 bg-[#141b29] border border-white/10 p-1 rounded-xl grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => setSelectedPreset(1)}
              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center truncate cursor-pointer ${
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
              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center truncate cursor-pointer ${
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
              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center truncate cursor-pointer ${
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
              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center truncate cursor-pointer ${
                selectedPreset === 4
                  ? "bg-[#06b6d4] text-white shadow-md shadow-[#06b6d4]/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🐎 역마러
            </button>
          </div>
        )}

        {/* ──────────────────────────────────────────
             9:16 Instagram Story Canvas (Target: 1080x1920)
           ────────────────────────────────────────── */}
        <div
          ref={storyCardRef}
          className="w-full h-[620px] rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden border border-white/15 shadow-2xl text-white"
          style={{
            background: activeTab === "pair"
              ? "radial-gradient(circle at 50% 0%, #201127 0%, #0c0d16 65%, #05060a 100%)"
              : "linear-gradient(180deg, #0c101c 0%, #06080e 100%)",
          }}
        >
          {activeTab === "pair" ? (
            /* ──────────────────────────────────────────
                 TAB 1: 1:1 FRIEND CHEMISTRY 9:16 STORY CARD
               ────────────────────────────────────────── */
            <>
              <div>
                {/* Top Story Indicator Bars */}
                <div className="flex gap-1 w-full mb-3">
                  {[1, 2, 3, 4, 5, 6].map((step) => (
                    <div key={step} className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-400" />
                  ))}
                </div>

                {/* Brand & Room Title */}
                <div className="flex items-center justify-between mb-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-rose-300">
                    <span>●</span> {roomTitle}
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
                    <span>{getMemberNickname(memberA)}</span>
                    <span className="text-rose-400 text-sm">×</span>
                    <span>{getMemberNickname(memberB)}</span>
                    <span className="ml-auto font-mono text-xl font-extrabold text-rose-400">
                      {pair6Categories.score}점
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
                  {/* Member A */}
                  <div className="flex flex-col items-center text-center w-24">
                    <div className="w-13 h-13 rounded-full bg-slate-50 border-2 border-rose-400 flex items-center justify-center overflow-hidden shadow-xs relative">
                      <img
                        src={getMemberZodiacSrc(memberA) || "/zodiac/zodiac_tiger_item_sunglasses.png"}
                        alt={memberA?.nickname}
                        crossOrigin="anonymous"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-xs font-black text-slate-900 mt-1 truncate max-w-full">
                      {getMemberNickname(memberA)}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      {getMemberElement(memberA)} 기운
                    </span>
                  </div>

                  {/* Center Score Pulse Badge */}
                  <div className="flex flex-col items-center shrink-0 px-2">
                    <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
                      <Heart className="w-4 h-4 fill-rose-500 text-rose-500 animate-pulse" />
                    </div>
                    <span className="text-[10px] font-mono font-black text-rose-600 mt-0.5">
                      {pair6Categories.score}점
                    </span>
                  </div>

                  {/* Member B */}
                  <div className="flex flex-col items-center text-center w-24">
                    <div className="w-13 h-13 rounded-full bg-slate-50 border-2 border-amber-400 flex items-center justify-center overflow-hidden shadow-xs relative">
                      <img
                        src={getMemberZodiacSrc(memberB) || "/zodiac/zodiac_tiger_item_sunglasses.png"}
                        alt={memberB?.nickname}
                        crossOrigin="anonymous"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-xs font-black text-slate-900 mt-1 truncate max-w-full">
                      {getMemberNickname(memberB)}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      {getMemberElement(memberB)} 기운
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
                  🏷️ @{getMemberNickname(memberB)} 너 인정? ㅋㅋㅋ #인연사주 #모임궁합
                </div>
                <div className="flex items-center justify-between w-full text-[9.5px] text-slate-400 px-1 pt-0.5">
                  <span>사주·자미두수·MBTI 융합 1:1 케미</span>
                  <span className="font-mono">inyeons.com</span>
                </div>
              </div>
            </>
          ) : (
            /* ──────────────────────────────────────────
                 TAB 2: GROUP AWARDS 9:16 STORY CARD (PRESET)
               ────────────────────────────────────────── */
            <>
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
                    <span style={{ color: currentGroupPreset.themeColor }}>●</span> {roomTitle}
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                    INYEON AWARDS
                  </span>
                </div>

                {/* Award Badge Pill */}
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 border border-white/15 mb-2" style={{ color: currentGroupPreset.themeColor }}>
                  <Award className="w-3.5 h-3.5" />
                  <span>{currentGroupPreset.tag}</span>
                </div>

                {/* Headline Card */}
                <div className="mt-0.5 mb-1.5">
                  <h2 className="text-[19px] font-black leading-tight tracking-tight">
                    {currentGroupPreset.headline}
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {currentGroupPreset.subHeadline}
                  </p>
                </div>
              </div>

              {/* Center Card: 1위 & 2위 Profile & Real Metrics */}
              <div className="bg-white rounded-2xl p-3.5 text-[#1c1d21] shadow-xl my-auto relative">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider flex items-center gap-1 shadow-md">
                  <Crown className="w-3 h-3 fill-current" />
                  <span>1위 당선자</span>
                </div>

                <div className="flex justify-around items-center pt-2 pb-1 mb-2 border-b border-[#f0f0ec]">
                  {currentGroupPreset.displayMembers.map((m, idx) => (
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
                    <span>{currentGroupPreset.metricTitle}</span>
                    <span className="font-extrabold text-[19px]" style={{ color: currentGroupPreset.themeColor }}>
                      {currentGroupPreset.score}점
                    </span>
                  </div>
                  <div className="text-[10.5px] text-[#55565e] mt-0.5 font-medium italic">
                    {currentGroupPreset.quote}
                  </div>
                </div>

                {/* 4 Stats bars */}
                <div className="bg-[#f4f4f1] rounded-xl p-2.5 space-y-1.5 mb-2">
                  {currentGroupPreset.stats.labels.map((label, sIdx) => {
                    const val = currentGroupPreset.stats.values[sIdx];
                    return (
                      <div key={label} className="flex items-center gap-2 text-[10px]">
                        <span className="w-14 text-[#1c1d21] font-semibold text-left shrink-0">{label}</span>
                        <div className="flex-1 h-1.5 bg-[#e2e2dc] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full opacity-90 transition-all duration-500"
                            style={{ width: `${Math.min(100, val)}%`, backgroundColor: currentGroupPreset.themeColor }}
                          />
                        </div>
                        <span className="w-7 text-right font-mono font-bold text-[#1c1d21]">{val}%</span>
                      </div>
                    );
                  })}
                </div>

                {/* Description */}
                <p className="text-[10px] leading-relaxed text-[#55565e] pt-1.5 border-t border-[#e7e7e2]">
                  {currentGroupPreset.desc}
                </p>
              </div>

              {/* Bottom Viral CTA */}
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className="w-full py-1.5 px-3 rounded-xl bg-white/10 border border-white/15 text-[10.5px] font-medium text-center text-slate-300 truncate">
                  {currentGroupPreset.bubble}
                </div>
                <div className="flex items-center justify-between w-full text-[10px] text-slate-500 px-1 pt-0.5">
                  <span>사주·자미두수·MBTI 종합 분석</span>
                  <span>인연의 사주 · inyeons.com</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom Download & Share Action */}
        <div className="w-full flex flex-col gap-2 mt-3.5">
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isCapturing}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#ff5a36] to-[#ec4899] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#ff5a36]/30 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isCapturing ? (
              <span>9:16 고화질 스토리 이미지 생성 중...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>
                  {activeTab === "pair"
                    ? `${getMemberNickname(memberB)} 태그하고 스토리 저장하기`
                    : "스토리 이미지 저장하고 친구 태그하기"}
                </span>
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
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
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
              className="w-full py-2.5 bg-gradient-to-r from-[#ff5a36] to-[#ec4899] text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              확인 완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
