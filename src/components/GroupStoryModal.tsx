import React, { useRef, useState, useMemo, useEffect } from "react";
import { X, Download, Share2, Sparkles, Check, Crown, Flame, Compass, Coins, Award, Users, HeartHandshake, Zap, MessageSquare, Wine, Plane, Heart, ShieldAlert, ArrowRightLeft } from "lucide-react";
import html2canvas from "html2canvas-pro";
import { Member, GroupAnalysis, PairAnalysis } from "../types";
import { getMemberZodiacSrc, calculateMemberRole, ROLE_DETAILS, ROLE_RING_COLOR } from "./ZodiacAvatar";
import { getMemberNickname, getMemberElement } from "../utils/memberHelper";
import { calculateGroupAwards, AwardItem, calculateMemberSals } from "../utils/shinsalCalculator";
import { generateDynamicPairCompatibility, isDummyPair } from "../utils/pairChemistry";
import { generateDedicatedChemistryCard, generateDedicatedGroupCard } from "../utils/cardGenerator";

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
  const [selectingTarget, setSelectingTarget] = useState<"A" | "B">("B");

  const handleSwapMembers = () => {
    const tempA = memberAId;
    setMemberAId(memberBId);
    setMemberBId(tempA);
  };

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

    // 1. 대화 티키타카
    const tikitakaBase = Math.min(99, Math.max(78, pairScore + (elemA === "화" || elemB === "화" ? 3 : -2) + (hash % 5)));
    const tikitakaComment = tikitakaBase >= 92
      ? "생각의 속도가 비슷해 말 한마디로도 통하는 사이"
      : tikitakaBase >= 84
      ? "말이 끊이지 않고 자연스럽게 이어지는 대화 흐름"
      : "필요한 순간에 명쾌하게 소통하는 담백한 사이";

    // 2. 모임 텐션 & 분위기
    const alcoholBase = Math.min(99, Math.max(72, pairScore + (salsA.yeokmaCount + salsB.yeokmaCount > 0 ? 4 : 0) + ((hash * 3) % 7)));
    const alcoholComment = alcoholBase >= 92
      ? "함께 있는 것만으로도 모임 분위기를 끌어올리는 시너지"
      : alcoholBase >= 82
      ? "서로의 페이스를 편안하게 존중하며 즐기는 호흡"
      : "과하지 않게 은은한 즐거움을 나누는 안정적인 무드";

    // 3. 여행 & 라이프스타일
    const travelBase = Math.min(98, Math.max(70, pairScore + (salsA.sals.includes("역마살") || salsB.sals.includes("역마살") ? 5 : -1) + ((hash * 7) % 6)));
    const travelComment = travelBase >= 90
      ? "돌발 변수가 생겨도 함께 웃으며 유쾌하게 넘기는 메이트"
      : travelBase >= 80
      ? "취향과 동선을 자연스럽게 배려하며 맞춰가는 편안함"
      : "사전에 계획과 역할을 조율하면 깔끔하게 어울릴 조합";

    // 4. 감정 공감 & 멘탈 케어
    const healingBase = Math.min(99, Math.max(75, pairScore + (elemA === "토" || elemB === "토" ? 4 : 0) + ((hash * 11) % 5)));
    const healingComment = healingBase >= 92
      ? "속 깊은 이야기까지 안심하고 털어놓을 수 있는 안식처"
      : healingBase >= 84
      ? "진심 어린 경청과 공감으로 서로에게 힘이 되어주는 관계"
      : "서로의 감정선을 존중하며 묵묵히 곁을 지켜주는 사이";

    // 5. 현실 시너지 & 협업
    const businessBase = Math.min(99, Math.max(70, pairScore + (elemA === "금" || elemB === "금" ? 4 : 0) + ((hash * 13) % 6)));
    const businessComment = businessBase >= 90
      ? "기획과 실행의 균형이 뛰어나 확실한 결실을 맺는 파트너"
      : businessBase >= 80
      ? "역할 분담이 명확할 때 최고의 성과를 내는 콤비"
      : "서로의 전문 영역을 인정하고 존중할 때 시너지가 나는 사이";

    // 6. 관계 팁 & 배려 포인트
    const safetyScore = Math.min(98, Math.max(68, pairScore - ((hash * 17) % 9) + 4));
    const mineComment = (elemA === "화" && elemB === "수") || (elemA === "수" && elemB === "화")
      ? "피곤할 땐 즉답을 피하고 한 템포 쉬어가는 대화가 좋아요"
      : (elemA === "금" && elemB === "목") || (elemA === "목" && elemB === "금")
      ? "직설적인 피드백보다는 따뜻한 인정 한마디가 최고의 처방"
      : "상대방만의 고유한 템포와 개인 시간을 편안하게 존중해 주기";

    let tagLine = "기분 좋은 파장을 나누는 조화로운 인연";
    if (pairScore >= 95) tagLine = "눈빛만 봐도 뜻이 통하는 최상의 케미스트리";
    else if (pairScore >= 90) tagLine = "서로의 장점을 극대화해 주는 든든한 파트너";
    else if (pairScore >= 80) tagLine = "서로의 부족한 기운을 차분히 채워주는 상생 메이트";
    else tagLine = "서로 다른 개성이 만나 색다른 재미를 만드는 조합";

    const categories: PairStoryCategory[] = [
      { id: "talk", icon: "💬", title: "대화 티키타카", score: tikitakaBase, comment: tikitakaComment, color: "#f43f5e" },
      { id: "drink", icon: "⚡", title: "모임 텐션 & 분위기", score: alcoholBase, comment: alcoholComment, color: "#f97316" },
      { id: "travel", icon: "✈️", title: "여행 & 일상 호흡", score: travelBase, comment: travelComment, color: "#06b6d4" },
      { id: "healing", icon: "🌿", title: "감정 공감 & 멘탈 케어", score: healingBase, comment: healingComment, color: "#10b981" },
      { id: "money", icon: "💼", title: "현실 시너지 & 협업", score: businessBase, comment: businessComment, color: "#eab308" },
      { id: "warning", icon: "💡", title: "관계 팁 & 배려 포인트", score: safetyScore, comment: mineComment, color: "#8b5cf6" },
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
        tag: "🌸 분위기 메이커",
        themeColor: "#ec4899",
        winner: dohwaWinner,
        runner: dohwaRunner,
        displayMembers: [
          toDisplayMember(dohwaRunner, "✨ 매력 라이벌", "#f43f5e"),
          toDisplayMember(dohwaWinner, "🌸 도화력 1위", "#ec4899"),
        ],
        headline: (
          <>
            모임의 기분 좋은 에너지,<br />
            <span className="text-[#f43f5e]">분위기 메이커 1위는 {getMemberNickname(dohwaWinner)}!</span>
          </>
        ),
        subHeadline: `사주 명식의 4대 왕지(子·午·卯·酉)와 ${dohwaSals.unseong} 기운`,
        score: dohwaKing.score,
        metricTitle: "호감 친화 지수",
        quote: `"${dohwaKing.tagline.replace(/"/g, "")}"`,
        stats: formatStats(dohwaKing, "dohwa", ["친화력", "호감 지수", "분위기 환기", "공감 매력"]),
        desc: `${getMemberNickname(dohwaWinner)}님은 특유의 밝고 편안한 에너지로 모임에 온기를 불어넣는 사람입니다. 함께 있는 것만으로도 주변 사람들의 기분을 유쾌하게 만들어 줍니다.`,
        bubble: `🏷️ #${cleanRoomTitle} #분위기메이커 @${getMemberNickname(dohwaWinner)}`,
      },
      2: {
        id: "boss",
        tag: "👑 든든한 숨은 리더",
        themeColor: "#ff5a36",
        winner: bossWinner,
        runner: bossRunner,
        displayMembers: [
          toDisplayMember(bossRunner, "🛡️ 든든한 조력자", "#3b82f6"),
          toDisplayMember(bossWinner, "👑 신뢰 리더 1위", "#ff5a36"),
        ],
        headline: (
          <>
            모임의 든든한 중심축,<br />
            <span className="text-[#ff5a36]">신뢰의 리더 1위는 {getMemberNickname(bossWinner)}!</span>
          </>
        ),
        subHeadline: `멤버 전체 평균 케미와 ${bossSals.sals.slice(0, 2).join("·")}의 리더십`,
        score: bossKing.score,
        metricTitle: "신뢰 리더십 지수",
        quote: `"${bossKing.tagline.replace(/"/g, "")}"`,
        stats: formatStats(bossKing, "boss", ["통솔력", "위기 대처", "방향 결정", "화합력"]),
        desc: `${getMemberNickname(bossWinner)}님은 평소에는 편안하게 어울리다가도 결정적인 순간에 방향을 잡아주는 든든한 중심축입니다. 멤버들의 깊은 신뢰를 받는 모임의 기둥입니다.`,
        bubble: `🏷️ #${cleanRoomTitle} #모임의기둥 @${getMemberNickname(bossWinner)}`,
      },
      3: {
        id: "wealth",
        tag: "💰 현실적 조율자",
        themeColor: "#eab308",
        winner: wealthWinner,
        runner: wealthRunner,
        displayMembers: [
          toDisplayMember(wealthRunner, "🪙 실속 파트너", "#10b981"),
          toDisplayMember(wealthWinner, "💰 현실 조율 1위", "#eab308"),
        ],
        headline: (
          <>
            모임을 든든하게 지탱하는,<br />
            <span className="text-[#eab308]">현실 감각 1위는 {getMemberNickname(wealthWinner)}!</span>
          </>
        ),
        subHeadline: `사주 명식의 왕성한 재성(財星)과 자산 비축 에너지`,
        score: wealthKing.score,
        metricTitle: "현실 조율 지수",
        quote: `"${wealthKing.tagline.replace(/"/g, "")}"`,
        stats: formatStats(wealthKing, "wealth", ["재물 흐름", "자산 감각", "실속 조율", "결실 완성"]),
        desc: `${getMemberNickname(wealthWinner)}님은 감각적이고 세심한 현실 감각으로 모임이 헛돌지 않도록 알차게 채워주는 복덩이입니다. 실속과 균형을 확실하게 챙겨주는 존재입니다.`,
        bubble: `🏷️ #${cleanRoomTitle} #모임의복덩이 @${getMemberNickname(wealthWinner)}`,
      },
      4: {
        id: "yeokma",
        tag: "🐎 활력 넘치는 행동대장",
        themeColor: "#06b6d4",
        winner: yeokmaWinner,
        runner: yeokmaRunner,
        displayMembers: [
          toDisplayMember(yeokmaRunner, "⚡ 추진 메이트", "#8b5cf6"),
          toDisplayMember(yeokmaWinner, "🐎 실행력 1위", "#06b6d4"),
        ],
        headline: (
          <>
            약속과 추진력의 아이콘,<br />
            <span className="text-[#06b6d4]">행동대장 1위는 {getMemberNickname(yeokmaWinner)}!</span>
          </>
        ),
        subHeadline: `사생지(寅·申·巳·亥)와 역마의 폭발적 활동 반경`,
        score: yeokmaKing.score,
        metricTitle: "추진 실행 지수",
        quote: `"${yeokmaKing.tagline.replace(/"/g, "")}"`,
        stats: formatStats(yeokmaKing, "yeokma", ["기동력", "활동 반경", "실행 속도", "도전 정신"]),
        desc: `${getMemberNickname(yeokmaWinner)}님은 모임의 약속과 새로운 모임 활동에 가장 먼저 불을 지피는 활력 엔진입니다. 망설이지 않고 행동으로 옮기는 추진력의 소유자입니다.`,
        bubble: `🏷️ #${cleanRoomTitle} #실행력1위 @${getMemberNickname(yeokmaWinner)}`,
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
        const generated = await generateDedicatedGroupCard({
          roomTitle: roomTitle || "우리 모임",
          groupScore: groupScore || 95,
          members: allMembers,
          atmosphere: currentGroupPreset?.desc,
        });
        dataUrl = generated.dataUrl;
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
        ? `🏷️ @${getMemberNickname(memberB)} 우리 사주 조합 점수 실시간 확인 ✨ (${pair6Categories.score}점) #인연사주 #사주케미\nhttps://inyeons.com`
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

        {/* Master Tab Switcher: [1:1 둘만의 케미] vs [모임 캐릭터 랭킹] */}
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
            <span>1:1 둘만의 케미</span>
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
            <span>모임 캐릭터 랭킹</span>
          </button>
        </div>

        {/* Dynamic Selector based on Active Tab */}
        {activeTab === "pair" ? (
          /* High-End Member Matchup Card & Interactive Chip Carousel */
          <div className="w-full mb-3 bg-[#141b29]/90 border border-white/10 p-2.5 rounded-2xl flex flex-col gap-2 shadow-lg">
            {/* Upper Face-Off Row */}
            <div className="flex items-center justify-between gap-2">
              {/* Slot A: 나 */}
              <button
                type="button"
                onClick={() => setSelectingTarget("A")}
                className={`flex-1 flex items-center gap-2 p-2 rounded-xl transition-all border cursor-pointer ${
                  selectingTarget === "A"
                    ? "bg-rose-500/20 border-rose-500/50 shadow-sm shadow-rose-500/20"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={getMemberZodiacSrc(memberA)}
                    alt={getMemberNickname(memberA)}
                    className="w-8 h-8 rounded-full bg-slate-800 object-cover border-2"
                    style={{ borderColor: ROLE_RING_COLOR[getMemberElement(memberA) as any] || "#f43f5e" }}
                  />
                  <span className="absolute -bottom-1 -right-1 text-[8px] bg-rose-600 text-white font-black px-1 rounded-full">
                    ME
                  </span>
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-[10px] text-rose-300 font-semibold leading-tight">기준 (나)</p>
                  <p className="text-xs font-bold text-white truncate">{getMemberNickname(memberA)}</p>
                </div>
              </button>

              {/* Center Swap Button */}
              <button
                type="button"
                onClick={handleSwapMembers}
                title="두 사람 자리 바꾸기"
                className="shrink-0 w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500/20 border border-white/15 hover:border-rose-400/50 text-slate-300 hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>

              {/* Slot B: 친구 */}
              <button
                type="button"
                onClick={() => setSelectingTarget("B")}
                className={`flex-1 flex items-center gap-2 p-2 rounded-xl transition-all border cursor-pointer ${
                  selectingTarget === "B"
                    ? "bg-blue-500/20 border-blue-500/50 shadow-sm shadow-blue-500/20"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={getMemberZodiacSrc(memberB)}
                    alt={getMemberNickname(memberB)}
                    className="w-8 h-8 rounded-full bg-slate-800 object-cover border-2"
                    style={{ borderColor: ROLE_RING_COLOR[getMemberElement(memberB) as any] || "#3b82f6" }}
                  />
                  <span className="absolute -bottom-1 -right-1 text-[8px] bg-blue-600 text-white font-black px-1 rounded-full">
                    YOU
                  </span>
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-[10px] text-blue-300 font-semibold leading-tight">친구 (상대)</p>
                  <p className="text-xs font-bold text-white truncate">{getMemberNickname(memberB)}</p>
                </div>
              </button>
            </div>

            {/* Bottom Horizontal Avatar Chips */}
            <div className="pt-1.5 border-t border-white/10 flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-0.5 text-[10px] text-slate-400">
                <span className="font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-rose-400" />
                  <span>{selectingTarget === "B" ? "케미를 볼 친구를 선택하세요" : "나(기준 멤버)를 선택하세요"}</span>
                </span>
                <span className="text-[9px] text-slate-500">터치 시 즉시 변경</span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {allMembers.map((m) => {
                  const isSelected = selectingTarget === "B" ? m.id === memberBId : m.id === memberAId;
                  const isOther = selectingTarget === "B" ? m.id === memberAId : m.id === memberBId;
                  const elem = getMemberElement(m) || "화";
                  const nick = getMemberNickname(m);

                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        if (selectingTarget === "B") {
                          if (m.id === memberAId) {
                            handleSwapMembers();
                          } else {
                            setMemberBId(m.id);
                          }
                        } else {
                          if (m.id === memberBId) {
                            handleSwapMembers();
                          } else {
                            setMemberAId(m.id);
                          }
                        }
                      }}
                      className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-400 shadow-sm shadow-rose-500/30 scale-105"
                          : isOther
                          ? "bg-white/5 border-dashed border-white/20 text-slate-400 hover:text-white"
                          : "bg-white/10 border-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      <img
                        src={getMemberZodiacSrc(m)}
                        alt={nick}
                        className="w-4 h-4 rounded-full bg-slate-800 object-cover"
                      />
                      <span className="truncate max-w-[65px]">{nick}</span>
                      <span className="text-[10px] font-normal opacity-70">({elem})</span>
                    </button>
                  );
                })}
              </div>
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
              🌸 분위기메이커
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
              👑 숨은 리더
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
              💰 현실 조율
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
              🐎 행동대장
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
                  🏷️ @{getMemberNickname(memberB)} 우리 사주 조합 점수 실시간 확인 ✨ ({pair6Categories.score}점)
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
