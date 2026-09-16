import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Layout from "./Layout";
import { 
  Sparkles, 
  Share2, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  HeartHandshake, 
  UserPlus, 
  RotateCcw,
  Compass,
  Star,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRightLeft,
  Lock,
  Eye,
  Users,
  RefreshCw,
  Trash2,
  Crown,
  ExternalLink
} from "lucide-react";
import { Member, PairSnap, SajuData } from "../types";
import { 
  createPairSnap, 
  getPairSnap, 
  joinPairSnap, 
  subscribePairSnap,
  isSnapHost,
  getSnapGuestMemberId
} from "../lib/firebase";
import { 
  getRecentPersonalProfile, 
  saveRecentPersonalProfile,
  recordRecentSnap,
  getRecentSnaps,
  RecentSnapItem
} from "../lib/offlineVault";
import { generateDynamicPairCompatibility, getGradeFromScore } from "../utils/pairChemistry";
import { shareToKakaoOrClipboard } from "../utils/shareHelper";
import ZodiacAvatar from "./ZodiacAvatar";
import SajuForm from "./SajuForm";
import SnapStoryModal from "./SnapStoryModal";
import RelationshipMetricsCard from "./RelationshipMetricsCard";

interface SnapViewProps {
  code?: string;
}

function getWesternZodiac(birthDateStr: string): { name: string; emoji: string; element: string } {
  if (!birthDateStr) return { name: "알 수 없음", emoji: "⭐", element: "알 수 없음" };
  const parts = birthDateStr.split("-");
  if (parts.length < 3) return { name: "알 수 없음", emoji: "⭐", element: "알 수 없음" };
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { name: "양자리", emoji: "♈", element: "불(火)" };
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { name: "황소자리", emoji: "♉", element: "흙(土)" };
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return { name: "쌍둥이자리", emoji: "♊", element: "바람(風)" };
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return { name: "게자리", emoji: "♋", element: "물(水)" };
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { name: "사자자리", emoji: "♌", element: "불(火)" };
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { name: "처녀자리", emoji: "♍", element: "흙(土)" };
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { name: "천칭자리", emoji: "♎", element: "바람(風)" };
  if ((month === 10 && day >= 23) || (month === 11 && day <= 22)) return { name: "전갈자리", emoji: "♏", element: "물(水)" };
  if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return { name: "사수자리", emoji: "♐", element: "불(火)" };
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { name: "염소자리", emoji: "♑", element: "흙(土)" };
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { name: "물병자리", emoji: "♒", element: "바람(風)" };
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return { name: "물고기자리", emoji: "♓", element: "물(水)" };

  return { name: "알 수 없음", emoji: "⭐", element: "알 수 없음" };
}

export default function SnapView({ code: routeCode }: SnapViewProps) {
  const [currentCode, setCurrentCode] = useState<string | null>(routeCode || null);
  const [snapData, setSnapData] = useState<PairSnap | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(routeCode));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "saju" | "astro_mbti" | "ziwei">("summary");
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [recentSnaps, setRecentSnaps] = useState<RecentSnapItem[]>([]);
  const [myCreatedSnaps, setMyCreatedSnaps] = useState<PairSnap[]>([]);
  const [copiedLinkCode, setCopiedLinkCode] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const chipScrollRef = useRef<HTMLDivElement>(null);

  // 🌟 Load snaps created by the current host user from localStorage
  const loadMyCreatedSnaps = useCallback(() => {
    try {
      const hostKeys: Record<string, string> = JSON.parse(localStorage.getItem("saju_snap_host_keys") || "{}");
      const allSnaps: Record<string, PairSnap> = JSON.parse(localStorage.getItem("saju_pair_snaps") || "{}");
      const myCodes = Object.keys(hostKeys);
      const list: PairSnap[] = [];
      for (const code of myCodes) {
        if (allSnaps[code]) {
          list.push(allSnaps[code]);
        }
      }
      // Sort newest created first
      list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setMyCreatedSnaps(list);
    } catch (e) {
      console.warn("Failed to load my created snaps:", e);
    }
  }, []);

  useEffect(() => {
    loadMyCreatedSnaps();
  }, [loadMyCreatedSnaps, currentCode]);

  const handleDeleteCreatedSnap = (codeToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm(`비밀 스냅 링크 [${codeToDelete}]를 내 관리 목록에서 삭제하시겠습니까?`)) {
      return;
    }
    try {
      const hostKeys: Record<string, string> = JSON.parse(localStorage.getItem("saju_snap_host_keys") || "{}");
      delete hostKeys[codeToDelete];
      localStorage.setItem("saju_snap_host_keys", JSON.stringify(hostKeys));

      const allSnaps: Record<string, PairSnap> = JSON.parse(localStorage.getItem("saju_pair_snaps") || "{}");
      delete allSnaps[codeToDelete];
      localStorage.setItem("saju_pair_snaps", JSON.stringify(allSnaps));

      const recentList: RecentSnapItem[] = JSON.parse(localStorage.getItem("saju_recent_snaps") || "[]");
      const filtered = recentList.filter(item => item.code !== codeToDelete);
      localStorage.setItem("saju_recent_snaps", JSON.stringify(filtered));

      loadMyCreatedSnaps();
      setRecentSnaps(filtered);
    } catch (err) {
      console.error("Delete snap error:", err);
    }
  };

  const handleCopySnapUrl = (codeToCopy: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = `${window.location.origin}/#/snap/${codeToCopy}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLinkCode(codeToCopy);
      setTimeout(() => setCopiedLinkCode(null), 2500);
    });
  };

  // 🌟 Guest Member ID managed as reactive state (solves non-reactive freeze!)
  const [guestMemberId, setGuestMemberId] = useState<string | null>(() => {
    if (typeof window === "undefined" || !routeCode) return null;
    return getSnapGuestMemberId(routeCode);
  });

  // 🌟 Matching interaction overlay state (1: 사주 대조 -> 2: 오행 케미 분석 -> 3: 인연 매듭 완성)
  const [joiningAnimationStep, setJoiningAnimationStep] = useState<number>(0);
  const [joiningGuestName, setJoiningGuestName] = useState<string>("");
  const [joiningGuestEmoji, setJoiningGuestEmoji] = useState<string>("✨");

  // 🌟 Realtime Host Notifications & Manual Refresh
  const [newGuestToast, setNewGuestToast] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevPartnersCountRef = useRef<number>(0);

  // Sync guestMemberId when code changes
  useEffect(() => {
    if (currentCode) {
      setGuestMemberId(getSnapGuestMemberId(currentCode));
    } else {
      setGuestMemberId(null);
    }
  }, [currentCode]);

  // Check if current user is the Host (link creator)
  const isHost = useMemo(() => {
    if (!currentCode || !snapData) return false;
    return isSnapHost(currentCode, snapData.creator_key);
  }, [currentCode, snapData]);

  // All registered partners (with resilient local storage fallback)
  const partnersList = useMemo(() => {
    if (!snapData) return [];
    if (snapData.partners && snapData.partners.length > 0) {
      return snapData.partners;
    }
    if (snapData.partner) {
      return [snapData.partner];
    }
    // Resilient fallback: If memory snapData lost partners due to network hiccup, recover from local storage
    if (currentCode) {
      try {
        const localSnaps = JSON.parse(localStorage.getItem("saju_pair_snaps") || "{}");
        const cached = localSnaps[currentCode.toUpperCase().trim()];
        if (cached?.partners && cached.partners.length > 0) {
          return cached.partners;
        }
        if (cached?.partner) {
          return [cached.partner];
        }
      } catch {
        // ignore
      }
    }
    return [];
  }, [snapData, currentCode]);

  // Pre-calculate pair scores for each partner in the shelf
  const partnersWithScores = useMemo(() => {
    if (!snapData?.creator || partnersList.length === 0) return [];
    return partnersList.map((partner) => {
      try {
        const comp = generateDynamicPairCompatibility(snapData.creator, partner);
        const score = comp?.score ?? comp?.totalScore ?? 52;
        const gradeInfo = getGradeFromScore(score);
        return { partner, score, grade: gradeInfo.grade, gradeInfo };
      } catch {
        const score = 52;
        const gradeInfo = getGradeFromScore(score);
        return { partner, score, grade: gradeInfo.grade, gradeInfo };
      }
    });
  }, [snapData?.creator, partnersList]);

  // Current active partner index
  const activePartnerIndex = useMemo(() => {
    if (!selectedPartnerId || partnersList.length === 0) return 0;
    const idx = partnersList.findIndex((p) => p.id === selectedPartnerId);
    return idx >= 0 ? idx : 0;
  }, [partnersList, selectedPartnerId]);

  const handlePrevPartner = () => {
    if (partnersList.length <= 1) return;
    const prevIdx = (activePartnerIndex - 1 + partnersList.length) % partnersList.length;
    setSelectedPartnerId(partnersList[prevIdx].id);
  };

  const handleNextPartner = () => {
    if (partnersList.length <= 1) return;
    const nextIdx = (activePartnerIndex + 1) % partnersList.length;
    setSelectedPartnerId(partnersList[nextIdx].id);
  };

  // If host and no partner selected, select first partner
  useEffect(() => {
    if (isHost && partnersList.length > 0 && !selectedPartnerId) {
      setSelectedPartnerId(partnersList[0].id);
    }
  }, [isHost, partnersList, selectedPartnerId]);

  // Load recent snaps from localStorage
  useEffect(() => {
    setRecentSnaps(getRecentSnaps());
  }, [currentCode]);

  // Load existing snap if code exists in URL or state
  useEffect(() => {
    if (!currentCode) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const unsubscribe = subscribePairSnap(currentCode, (snap) => {
      setIsLoading(false);
      if (snap) {
        // Detect new partners for Host in realtime
        const currentCount = snap.partners?.length || (snap.partner ? 1 : 0);
        if (prevPartnersCountRef.current > 0 && currentCount > prevPartnersCountRef.current) {
          const newestPartner = snap.partners?.[snap.partners.length - 1] || snap.partner;
          if (newestPartner) {
            setNewGuestToast(`🎉 새로운 인연 [${newestPartner.nickname}]님의 사주가 방금 도착했습니다!`);
            setTimeout(() => setNewGuestToast(null), 5000);
            setSelectedPartnerId(newestPartner.id);
          }
        }
        prevPartnersCountRef.current = currentCount;

        setSnapData(snap);
        if (snap.creator) {
          const firstPartner = snap.partners?.[0] || snap.partner;
          recordRecentSnap(
            currentCode, 
            snap.creator.nickname, 
            firstPartner?.nickname
          );
          setRecentSnaps(getRecentSnaps());
        }
      } else {
        setErrorMessage("존재하지 않거나 만료된 1:1 비밀 인연 초대장입니다.");
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentCode]);

  // Manual fast-refresh handler
  const handleManualRefresh = async () => {
    if (!currentCode) return;
    setIsRefreshing(true);
    try {
      if (isHost && snapData) {
        // Force sync host snap to server & firestore
        fetch("/api/snap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(snapData)
        }).catch(() => {});
      }
      const snap = await getPairSnap(currentCode);
      if (snap) {
        setSnapData(snap);
      }
    } catch {
      // ignore
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Handle URL change
  useEffect(() => {
    if (routeCode && routeCode !== currentCode) {
      setCurrentCode(routeCode);
    }
  }, [routeCode]);

  // Check if saved profile exists
  const savedProfile = useMemo(() => {
    try {
      return getRecentPersonalProfile();
    } catch {
      return null;
    }
  }, []);

  // Creator flow: Create Snap
  const handleCreateSnap = async (formData: {
    nickname: string;
    gender: string;
    birth_date: string;
    birth_time: string | null;
    saju: any;
    character_emoji: string;
    character_animal: string;
    character_color: string;
    mbti?: string | null;
    birthplace_region?: string;
    birthplace_city?: string;
  }) => {
    setIsLoading(true);
    try {
      const creatorMember: Member = {
        id: `snap_host_${Date.now()}`,
        nickname: formData.nickname,
        gender: (formData.gender as "남성" | "여성") || "남성",
        birth_date: formData.birth_date,
        birth_time: formData.birth_time,
        saju: formData.saju,
        character_emoji: formData.character_emoji,
        character_animal: formData.character_animal,
        character_color: formData.character_color,
        mbti: formData.mbti || undefined,
        location: formData.birthplace_region ? `${formData.birthplace_region} ${formData.birthplace_city || ""}`.trim() : undefined,
        joined_at: new Date().toISOString()
      };

      // Save to local profile cache
      saveRecentPersonalProfile({
        nickname: formData.nickname,
        gender: (formData.gender as any) || "남성",
        birth_date: formData.birth_date,
        birth_time: formData.birth_time,
        saju: formData.saju,
        character_emoji: formData.character_emoji,
        character_animal: formData.character_animal,
        character_color: formData.character_color,
        mbti: formData.mbti || null,
        birthplace_region: formData.birthplace_region || null,
        birthplace_city: formData.birthplace_city || null,
        updatedAt: Date.now()
      });

      const newSnap = await createPairSnap(creatorMember);
      setSnapData(newSnap);
      setCurrentCode(newSnap.code);
      window.location.hash = `#/snap/${newSnap.code}`;
    } catch (err: any) {
      setErrorMessage(err?.message || "초대장 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Partner flow: Join Snap with rich interactive stages
  const handleJoinSnap = async (formData: {
    nickname: string;
    gender: string;
    birth_date: string;
    birth_time: string | null;
    saju: any;
    character_emoji: string;
    character_animal: string;
    character_color: string;
    mbti?: string | null;
    birthplace_region?: string;
    birthplace_city?: string;
  }) => {
    if (!currentCode) return;

    // Trigger rich matching interaction
    setJoiningGuestName(formData.nickname);
    setJoiningGuestEmoji(formData.character_emoji || "✨");
    setJoiningAnimationStep(1);
    setIsLoading(true);

    try {
      const partnerMember: Member = {
        id: `snap_guest_${Date.now()}`,
        nickname: formData.nickname,
        gender: (formData.gender as "남성" | "여성") || "남성",
        birth_date: formData.birth_date,
        birth_time: formData.birth_time,
        saju: formData.saju,
        character_emoji: formData.character_emoji,
        character_animal: formData.character_animal,
        character_color: formData.character_color,
        mbti: formData.mbti || undefined,
        location: formData.birthplace_region ? `${formData.birthplace_region} ${formData.birthplace_city || ""}`.trim() : undefined,
        joined_at: new Date().toISOString()
      };

      // Save to personal profile cache for guest too
      try {
        saveRecentPersonalProfile({
          nickname: formData.nickname,
          gender: (formData.gender as any) || "남성",
          birth_date: formData.birth_date,
          birth_time: formData.birth_time,
          saju: formData.saju,
          character_emoji: formData.character_emoji,
          character_animal: formData.character_animal,
          character_color: formData.character_color,
          mbti: formData.mbti || null,
          birthplace_region: formData.birthplace_region || null,
          birthplace_city: formData.birthplace_city || null,
          updatedAt: Date.now()
        });
      } catch {
        // ignore
      }

      // Step 1: Network call + minimum 1.0s visual pacing
      const [updated] = await Promise.all([
        joinPairSnap(currentCode, partnerMember),
        new Promise((resolve) => setTimeout(resolve, 1000))
      ]);

      // Step 2: Chemistry calculation visual
      setJoiningAnimationStep(2);
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Step 3: Destiny Knot completion visual
      setJoiningAnimationStep(3);
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Immediately commit new reactive states (Instant re-render without reload!)
      setGuestMemberId(partnerMember.id);
      setSelectedPartnerId(partnerMember.id);
      setSnapData(updated);

      // Smooth scroll to top of page
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "참여 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      setJoiningAnimationStep(0);
    }
  };

  // Copy helpers
  const shareUrl = typeof window !== "undefined" && currentCode 
    ? `${window.location.origin}${window.location.pathname}#/snap/${currentCode}` 
    : "";

  const handleCopyUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyCode = async () => {
    if (!currentCode) return;
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleKakaoShare = async () => {
    if (!snapData || !currentCode) return;
    const creatorName = snapData.creator.nickname;
    const title = `🔒 ${creatorName}님의 1:1 비밀 인연 초대장`;
    const description = `${creatorName}님과 나만의 1:1 비밀 사주 궁합을 확인해보세요! (다른 사람에게는 절대 공개되지 않는 비밀 매칭)`;

    await shareToKakaoOrClipboard({
      title,
      description,
      url: shareUrl,
    });
  };

  // Resolve currently active target partner:
  // - If Host: selectedPartnerId or first partner
  // - If Guest: the guest's own member record
  const activePartner = useMemo(() => {
    if (!snapData) return null;
    if (isHost) {
      if (selectedPartnerId) {
        return partnersList.find(p => p.id === selectedPartnerId) || partnersList[0] || null;
      }
      return partnersList[0] || null;
    }
    // Guest view: STRICT PRIVACY - ONLY allow seeing themselves!
    // NEVER leak or fallback to other partners under any circumstances.
    if (guestMemberId) {
      const mySelf = partnersList.find(p => p.id === guestMemberId);
      if (mySelf) return mySelf;
    }
    return null;
  }, [snapData, isHost, selectedPartnerId, partnersList, guestMemberId]);

  // 1:1 Analysis calculation between Creator and Active Partner
  const analysis = useMemo(() => {
    if (!snapData?.creator || !activePartner) return null;
    return generateDynamicPairCompatibility(snapData.creator, activePartner);
  }, [snapData?.creator, activePartner]);

  // Western Zodiac
  const zodiacCreator = useMemo(() => snapData ? getWesternZodiac(snapData.creator.birth_date) : null, [snapData?.creator]);
  const zodiacPartner = useMemo(() => activePartner ? getWesternZodiac(activePartner.birth_date) : null, [activePartner]);

  // 🌟 Interactive Matchmaking Transition Overlay
  const renderMatchingOverlay = () => {
    if (joiningAnimationStep === 0) return null;
    return (
      <div className="fixed inset-0 z-[9999] bg-paper/95 dark:bg-[#121212]/95 backdrop-blur-lg flex flex-col items-center justify-center p-6 animate-fade-in text-center select-none">
        <div className="relative max-w-sm w-full space-y-7 p-6 rounded-3xl bg-surface border border-line shadow-2xl">
          {/* Animated Connecting Avatars */}
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            {/* Host Avatar */}
            <div className="flex flex-col items-center space-y-1.5 animate-pulse">
              <div className="w-16 h-16 rounded-2xl bg-sunken border-2 border-seal shadow-md flex items-center justify-center text-3xl">
                {snapData?.creator?.character_emoji || "🐯"}
              </div>
              <span className="text-xs font-bold text-ink truncate max-w-[80px]">
                {snapData?.creator?.nickname || "초대자"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-seal/10 text-seal font-semibold">
                초대자
              </span>
            </div>

            {/* Spark & Connection Line */}
            <div className="relative flex flex-col items-center justify-center px-1">
              <div className="w-10 h-10 rounded-full bg-seal/10 border border-seal/30 flex items-center justify-center text-seal animate-bounce">
                <HeartHandshake className="w-5 h-5 text-seal" />
              </div>
              <div className="w-12 border-t-2 border-dashed border-seal/50 my-1 animate-pulse" />
              <div className="text-[10px] text-seal font-mono font-bold animate-pulse">
                {joiningAnimationStep === 1 ? "명식 대조" : joiningAnimationStep === 2 ? "오행 분석" : "인연 완성"}
              </div>
            </div>

            {/* Guest Avatar */}
            <div className="flex flex-col items-center space-y-1.5 animate-pulse">
              <div className="w-16 h-16 rounded-2xl bg-sunken border-2 border-wood shadow-md flex items-center justify-center text-3xl">
                {joiningGuestEmoji || "✨"}
              </div>
              <span className="text-xs font-bold text-ink truncate max-w-[80px]">
                {joiningGuestName || "나"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-wood/10 text-wood font-semibold">
                참여자
              </span>
            </div>
          </div>

          {/* Dynamic Stage Text */}
          <div className="space-y-3 pt-2">
            <div className="w-9 h-9 mx-auto rounded-full border-3 border-seal border-t-transparent animate-spin" />
            
            {joiningAnimationStep === 1 && (
              <div className="space-y-1 animate-fade-in">
                <h3 className="font-serif text-lg font-bold text-ink">
                  두 사람의 사주 명식을 대조하는 중...
                </h3>
                <p className="text-xs text-ink-soft leading-relaxed">
                  천간과 지지, 태어난 계절의 기운을 맞추어 인연의 좌표를 짚고 있습니다.
                </p>
              </div>
            )}

            {joiningAnimationStep === 2 && (
              <div className="space-y-1 animate-fade-in">
                <h3 className="font-serif text-lg font-bold text-ink">
                  음양오행 케미스트리 심층 분석 중...
                </h3>
                <p className="text-xs text-ink-soft leading-relaxed">
                  서로에게 부족한 오행을 채워주는 보완 에너지와 상생 코드를 도출하고 있습니다.
                </p>
              </div>
            )}

            {joiningAnimationStep === 3 && (
              <div className="space-y-1 animate-fade-in">
                <h3 className="font-serif text-lg font-bold text-seal flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4 text-seal" />
                  <span>1:1 비밀 인연의 매듭이 완성되었습니다!</span>
                </h3>
                <p className="text-xs text-ink-soft leading-relaxed">
                  오직 두 분만을 위한 궁합 결과를 화면에 펼칩니다...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 🌟 Realtime Notification Toast
  const renderToast = () => {
    if (!newGuestToast) return null;
    return (
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9998] max-w-md w-full px-4 animate-fade-in">
        <div className="p-3.5 bg-seal text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 animate-spin" />
            <span>{newGuestToast}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setNewGuestToast(null)}
            className="text-white/80 hover:text-white text-xs px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  // Render State 1: Loading
  if (isLoading && !snapData) {
    return (
      <Layout maxWidth="2xl">
        <div className="py-20 text-center space-y-4">
          <div className="w-12 h-12 mx-auto border-3 border-seal border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-ink-soft">1:1 비밀 초대장을 불러오는 중...</p>
        </div>
      </Layout>
    );
  }

  // Render State 2: Error
  if (errorMessage && !snapData) {
    return (
      <Layout maxWidth="2xl">
        <div className="py-16 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-seal/10 text-seal flex items-center justify-center text-2xl font-bold">
            !
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-xl font-bold text-ink">초대장을 찾을 수 없습니다</h2>
            <p className="text-sm text-ink-soft">{errorMessage}</p>
          </div>
          <a
            href="#/snap"
            onClick={() => {
              setCurrentCode(null);
              setErrorMessage(null);
              window.location.hash = "#/snap";
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-seal text-white font-semibold text-sm hover:bg-seal-deep transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>새 비밀 초대장 만들기</span>
          </a>
        </div>
      </Layout>
    );
  }

  // Render State 3: Mode Create (No Code yet in URL)
  if (!currentCode || !snapData) {
    return (
      <Layout maxWidth="2xl">
        <div className="py-8 sm:py-12 space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-seal/10 text-seal text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>1:1 비밀 인연 스냅</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
              나만의 1:1 비밀 궁합 링크 만들기
            </h1>
            <p className="text-sm text-ink-soft leading-relaxed max-w-md mx-auto">
              초대 링크를 친구나 지인들에게 공유해보세요.<br />
              <strong className="text-ink">링크로 들어온 친구들의 궁합은 오직 나에게만 비밀리에 모입니다!</strong>
            </p>
          </div>

          {/* 👑 1. 내가 개설한 비밀 초대장 관리 (Host Snaps Management) */}
          {myCreatedSnaps.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-surface border-2 border-seal/20 shadow-xs space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-seal/10 text-seal flex items-center justify-center">
                    <Crown className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-ink flex items-center gap-1.5">
                      <span>내가 개설한 비밀 초대장</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-seal text-white font-mono text-[10px] font-extrabold">
                        {myCreatedSnaps.length}
                      </span>
                    </h3>
                  </div>
                </div>
                <span className="text-[11px] text-ink-faint hidden sm:inline">
                  초대 링크를 다시 복사하거나 친구들의 궁합을 확인하세요
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {myCreatedSnaps.map((item) => {
                  const partnerCount = item.partners?.length || (item.partner ? 1 : 0);
                  const isCopied = copiedLinkCode === item.code;

                  return (
                    <div
                      key={item.code}
                      className="p-3.5 bg-sunken/60 hover:bg-sunken rounded-xl border border-line hover:border-seal/40 transition-all flex flex-col justify-between gap-3 group relative"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold text-seal bg-seal/10 px-2 py-0.5 rounded-md">
                            코드 {item.code}
                          </span>
                          {partnerCount > 0 ? (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>친구 {partnerCount}명 참여 중</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-ink-faint bg-sunken px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>친구 참여 대기 중</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm font-bold text-ink truncate">
                          {item.title || `${item.creator.nickname}님의 비밀 초대장`}
                        </p>
                        <p className="text-[11px] text-ink-soft truncate">
                          {item.partner ? `최근 궁합: ${item.partner.nickname}` : "친구에게 링크를 공유해보세요"}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 pt-1 border-t border-line/60">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentCode(item.code);
                            window.location.hash = `#/snap/${item.code}`;
                          }}
                          className="flex-1 py-1.5 px-2 bg-surface hover:bg-seal text-ink hover:text-white border border-line hover:border-seal rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>결과 확인</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleCopySnapUrl(item.code, e)}
                          className="py-1.5 px-2.5 bg-surface hover:bg-sunken text-ink-soft hover:text-ink border border-line rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          title="초대 링크 복사"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">복사됨!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>복사</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCreatedSnap(item.code, e)}
                          className="p-1.5 text-ink-faint hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="관리 목록에서 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🕒 2. 최근 확인한 비밀 궁합 링크 (요청대로 깔끔하게 최대 2개만 제공) */}
          {recentSnaps.filter(s => !myCreatedSnaps.some(m => m.code === s.code)).length > 0 && (
            <div className="p-4 rounded-2xl bg-sunken border border-line space-y-3">
              <div className="flex items-center justify-between text-xs text-ink-faint">
                <span className="flex items-center gap-1.5 font-medium text-ink">
                  <Clock className="w-3.5 h-3.5 text-seal" />
                  <span>최근 확인한 비밀 궁합 링크</span>
                </span>
                <span className="text-[11px]">최근 2개 링크</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {recentSnaps
                  .filter(s => !myCreatedSnaps.some(m => m.code === s.code))
                  .slice(0, 2)
                  .map((item) => (
                    <a
                      key={item.code}
                      href={`#/snap/${item.code}`}
                      onClick={() => {
                        setCurrentCode(item.code);
                        window.location.hash = `#/snap/${item.code}`;
                      }}
                      className="p-3 bg-surface rounded-xl border border-line hover:border-seal/50 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[10px] text-seal font-bold">비밀 스냅 · 코드 {item.code}</span>
                        <p className="text-xs sm:text-sm font-bold text-ink truncate group-hover:text-seal transition-colors">
                          {item.creatorName}님의 비밀 링크
                        </p>
                        <p className="text-[11px] text-ink-soft">
                          {item.partnerName ? `최근 파트너: ${item.partnerName}` : "친구 참여 대기 중"}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-ink-faint group-hover:text-seal group-hover:translate-x-0.5 transition-all shrink-0" />
                    </a>
                  ))}
              </div>
            </div>
          )}

          {/* Quick profile load if available */}
          {savedProfile && (
            <div className="p-4 rounded-2xl bg-surface border border-line flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <span className="text-[11px] font-semibold text-wood flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>기존 저장된 내 사주 발견</span>
                </span>
                <p className="text-sm font-bold text-ink truncate">
                  {savedProfile.nickname || "나의 사주"} ({savedProfile.birth_date})
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (savedProfile.saju) {
                    handleCreateSnap({
                      nickname: savedProfile.nickname || "나",
                      gender: savedProfile.gender || "남성",
                      birth_date: savedProfile.birth_date,
                      birth_time: savedProfile.birth_time || null,
                      saju: savedProfile.saju,
                      character_emoji: savedProfile.character_emoji || "🐯",
                      character_animal: savedProfile.character_animal || "호랑이",
                      character_color: savedProfile.character_color || "#35B37E",
                      mbti: savedProfile.mbti || null,
                      birthplace_region: savedProfile.birthplace_region || undefined,
                      birthplace_city: savedProfile.birthplace_city || undefined,
                    });
                  }
                }}
                className="px-3.5 py-2 bg-seal hover:bg-seal-deep text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              >
                <span>이 사주로 1초 생성</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Saju Input Form */}
          <div className="bg-surface border border-line rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
            <div className="border-b border-line pb-4">
              <h2 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-seal text-white text-xs flex items-center justify-center font-mono">1</span>
                <span>내 사주 등록 (링크 호스트)</span>
              </h2>
              <p className="text-xs text-ink-faint mt-1">
                친구들이 들어와 궁합을 볼 기준이 되는 본인의 사주 정보를 입력해주세요.
              </p>
            </div>

            <SajuForm
              onSubmit={handleCreateSnap}
              submitButtonText="비밀 초대장 만들고 링크 받기"
              initialNickname={savedProfile?.nickname || ""}
              initialGender={savedProfile?.gender as any}
              initialBirthDate={savedProfile?.birth_date}
              initialBirthTime={savedProfile?.birth_time}
              initialMbti={savedProfile?.mbti}
              initialRegion={savedProfile?.birthplace_region}
              initialCity={savedProfile?.birthplace_city}
              showEmailField={false}
            />
          </div>
        </div>
      </Layout>
    );
  }

  // Render State 4: GUEST VIEW (Not Host, and hasn't registered yet)
  if (!isHost && !activePartner) {
    return (
      <Layout maxWidth="2xl">
        {renderMatchingOverlay()}
        {renderToast()}

        <div className="py-6 sm:py-10 space-y-6 animate-fade-in">
          {/* Header Bar */}
          <div className="flex items-center justify-between text-xs text-ink-faint border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-seal/10 text-seal font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>1:1 비밀 인연 초대장</span>
              </span>
              <span className="font-mono text-ink-soft">코드: {currentCode}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Realtime Live Pulse */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sunken border border-line text-[10px] text-ink-faint">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>실시간 연결됨</span>
              </div>

              {/* Manual Refresh */}
              <button
                type="button"
                onClick={handleManualRefresh}
                className="px-2 py-1 bg-surface border border-line hover:border-seal text-ink hover:text-seal rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                title="초대장 새로고침"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin text-seal" : ""}`} />
                <span className="hidden sm:inline">동기화</span>
              </button>
            </div>
          </div>

          {/* Creator Profile Preview Card */}
          <div className="text-center space-y-4 pt-2">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-surface border-2 border-seal/30 shadow-md p-2 flex items-center justify-center">
              <ZodiacAvatar member={snapData.creator} size={64} fallbackEmoji={snapData.creator.character_emoji} />
            </div>

            <div className="space-y-1.5">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                {snapData.creator.nickname}님의 비밀 인연 초대
              </h1>
              <p className="text-xs sm:text-sm text-ink-soft max-w-sm mx-auto leading-relaxed">
                {snapData.creator.nickname}님과의 1:1 비밀 궁합입니다.<br />
                <span className="text-ink font-medium">내가 입력한 사주 정보는 {snapData.creator.nickname}님에게만 전달되며, 다른 참여자에게는 절대 공개되지 않습니다.</span>
              </p>
            </div>
          </div>

          {/* Partner Registration Form */}
          <div className="bg-surface border border-line rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
            <div className="border-b border-line pb-4">
              <h2 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-seal text-white text-xs flex items-center justify-center font-mono">2</span>
                <span>내 사주 정보 입력</span>
              </h2>
              <p className="text-xs text-ink-faint mt-1">
                이름(별명), 성별, 생년월일시를 입력하면 {snapData.creator.nickname}님과의 궁합이 완성됩니다.
              </p>
            </div>

            <SajuForm
              onSubmit={handleJoinSnap}
              submitButtonText={`${snapData.creator.nickname}님에게 비밀 사주 전달하고 궁합 보기`}
              showEmailField={false}
            />
          </div>
        </div>
      </Layout>
    );
  }

  // Render State 5: HOST with 0 Partners (Waiting for friends to join)
  if (isHost && partnersList.length === 0) {
    return (
      <Layout maxWidth="2xl">
        {renderToast()}

        <div className="py-6 sm:py-10 space-y-6 animate-fade-in">
          {/* Header Bar */}
          <div className="flex items-center justify-between text-xs text-ink-faint border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-seal/10 text-seal font-semibold">
                👑 링크 생성자 (호스트 전용 뷰)
              </span>
              <span className="font-mono text-ink-soft">코드: {currentCode}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sunken border border-line text-[10px] text-ink-faint">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>실시간 대기 중</span>
              </div>

              <button
                type="button"
                onClick={handleManualRefresh}
                className="px-2 py-1 bg-surface border border-line hover:border-seal text-ink hover:text-seal rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                title="상태 새로고침"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin text-seal" : ""}`} />
                <span className="hidden sm:inline">동기화</span>
              </button>
            </div>
          </div>

          {/* Creator Profile */}
          <div className="text-center space-y-4 pt-2">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-surface border-2 border-seal/30 shadow-md p-2 flex items-center justify-center">
              <ZodiacAvatar member={snapData.creator} size={64} fallbackEmoji={snapData.creator.character_emoji} />
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-seal/10 text-seal text-xs font-semibold">
                👑 링크 생성자 (호스트 전용 뷰)
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                비밀 궁합 링크가 생성되었습니다!
              </h1>
              <p className="text-xs sm:text-sm text-ink-soft max-w-sm mx-auto">
                친구들에게 아래 링크를 공유해보세요.<br />
                친구가 참여할 때마다 <strong className="text-ink">나만의 화면에 친구들과의 1:1 궁합이 비밀리에 추가</strong>됩니다.
              </p>
            </div>
          </div>

          {/* Share Box */}
          <div className="bg-sunken border border-line rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-seal" />
                <span>비밀 초대 링크 공유</span>
              </span>
              <span className="text-[11px] text-seal font-semibold animate-pulse">
                ● 친구들의 참여 대기 중
              </span>
            </div>

            {/* URL Input with copy */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-surface border border-line rounded-xl px-3 py-2.5 text-xs text-ink font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-3.5 py-2.5 bg-surface border border-line hover:border-seal text-ink hover:text-seal text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-seal" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? "복사완료" : "링크복사"}</span>
              </button>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleKakaoShare}
                className="py-2.5 px-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>카카오톡으로 초대장 보내기</span>
              </button>
              <button
                type="button"
                onClick={handleCopyCode}
                className="py-2.5 px-3 bg-surface hover:bg-line border border-line text-ink text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>초대코드 ({currentCode}) 복사</span>
              </button>
            </div>
          </div>

          {/* Test Partner Registration (Self test) */}
          <div className="bg-surface border border-line rounded-2xl p-5 space-y-4">
            <h3 className="font-serif text-sm font-bold text-ink flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-seal" />
              <span>직접 친구 정보 등록해보기 (테스트용)</span>
            </h3>
            <p className="text-xs text-ink-faint">
              링크를 보내지 않고 본인이 직접 상대방 사주를 입력해 1:1 궁합을 먼저 확인해볼 수도 있습니다.
            </p>
            <SajuForm
              onSubmit={handleJoinSnap}
              submitButtonText="상대방 추가하고 1:1 궁합 보기"
              showEmailField={false}
            />
          </div>
        </div>
      </Layout>
    );
  }

  // Render State 6: MASTER 1:1 RESULT VIEW
  // - Host can see and toggle between ALL partners using the chips UI (as requested in screenshot!)
  // - Guest can ONLY see themselves with the creator (strict privacy: other partners never leaked!)
  const m1 = snapData.creator;
  const m2 = activePartner!;
  const pairScore = analysis ? (analysis.score ?? analysis.totalScore ?? 52) : 52;
  const gradeInfo = getGradeFromScore(pairScore);
  const pairGrade = gradeInfo.grade;

  return (
    <Layout maxWidth="2xl">
      {renderMatchingOverlay()}
      {renderToast()}

      <div className="py-6 sm:py-10 space-y-6 animate-fade-in">
        {/* Top Floating Badge & Actions */}
        <div className="flex items-center justify-between text-xs text-ink-faint border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-seal/10 text-seal font-semibold">
              {isHost ? "👑 비밀 궁합 보관함 (호스트)" : "🔒 1:1 비밀 인연 스냅"}
            </span>
            <span className="font-mono text-ink-soft">코드: {currentCode}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Realtime Live Pulse */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-sunken border border-line text-[10px] text-ink-faint">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>실시간 연결됨</span>
            </div>

            {/* Manual Refresh */}
            <button
              type="button"
              onClick={handleManualRefresh}
              className="px-2 py-1 bg-surface border border-line hover:border-seal text-ink hover:text-seal rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer"
              title="데이터 동기화"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin text-seal" : ""}`} />
              <span className="hidden sm:inline">동기화</span>
            </button>

            {isHost && (
              <button
                type="button"
                onClick={handleCopyUrl}
                className="hover:text-seal transition-colors flex items-center gap-1 cursor-pointer"
                title="초대 링크 복사"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>링크 복사</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                window.location.hash = "#/snap";
                setCurrentCode(null);
                setSnapData(null);
              }}
              className="hover:text-seal transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>새 스냅</span>
            </button>
          </div>
        </div>

        {/* 🌟 HOST ONLY: Modern & Breathable Partner Selector Bar */}
        {isHost && partnersWithScores.length > 1 && (
          <div className="bg-surface/90 backdrop-blur-xs border border-line rounded-2xl p-3.5 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-seal animate-pulse" />
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  궁합 볼 친구 선택
                  <span className="px-1.5 py-0.5 rounded-full bg-seal/10 text-seal font-mono text-[11px] font-extrabold">
                    {partnersWithScores.length}명 참여
                  </span>
                </span>
              </div>
              <span className="text-[11px] text-ink-faint hidden sm:inline">
                원하는 친구를 터치하면 궁합이 바로 전환됩니다
              </span>
            </div>

            {/* Horizontal Friend Avatar Carousel */}
            <div
              ref={chipScrollRef}
              className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5 px-0.5 no-scrollbar scroll-smooth"
            >
              {partnersWithScores.map(({ partner, score, grade }) => {
                const isSelected = partner.id === m2.id;
                const isHighest = partnersWithScores.length > 1 && score === Math.max(...partnersWithScores.map((p) => p.score));

                return (
                  <button
                    key={partner.id}
                    type="button"
                    onClick={() => setSelectedPartnerId(partner.id)}
                    className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer shrink-0 text-left border ${
                      isSelected
                        ? "bg-seal/8 border-seal ring-1 ring-seal shadow-xs scale-[1.02]"
                        : "bg-sunken/60 hover:bg-surface border-line hover:border-seal/40 opacity-80 hover:opacity-100"
                    }`}
                  >
                    {/* Mini Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-transform ${
                          isSelected ? "scale-105" : "group-hover:scale-105"
                        }`}
                        style={{ backgroundColor: partner.character_color ? `${partner.character_color}25` : "#F3F4F6" }}
                      >
                        <span>{partner.character_emoji || "✨"}</span>
                      </div>
                      {isHighest && (
                        <span
                          className="absolute -top-1.5 -right-1 text-[10px] leading-none drop-shadow-xs"
                          title="최고 케미 점수"
                        >
                          👑
                        </span>
                      )}
                    </div>

                    {/* Name & Chem Score */}
                    <div className="min-w-0 pr-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-bold truncate max-w-[80px] sm:max-w-[100px] ${
                            isSelected ? "text-seal" : "text-ink group-hover:text-seal"
                          }`}
                        >
                          {partner.nickname}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-seal shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] font-extrabold font-mono text-ink-soft">
                          {score}점
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded leading-none ${gradeInfo.badgeBg}`}
                        >
                          {grade}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 🔒 GUEST ONLY Notice: Other participants remain 100% hidden! */}
        {!isHost && (
          <div className="p-4 rounded-2xl bg-sunken border border-line flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-seal/10 text-seal flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-ink">비밀 인연 궁합 전달 완료</p>
                <p className="text-[11px] text-ink-soft truncate">
                  {m1.nickname}님과 {m2.nickname}님만의 1:1 결과이며, 다른 참가자에게는 절대 노출되지 않습니다.
                </p>
              </div>
            </div>
            <a
              href="#/snap"
              className="px-3 py-1.5 rounded-xl bg-surface border border-line hover:border-seal text-ink hover:text-seal text-[11px] font-semibold shrink-0 transition-colors"
            >
              내 링크 만들기
            </a>
          </div>
        )}

        {/* 🌟 Hero Head-to-Head Stage (Spacious & Breathable with Prev/Next quick switcher) */}
        <div className="relative group">
          {/* Left / Right Quick Navigation Buttons (Host with 2+ partners) */}
          {isHost && partnersList.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevPartner}
                className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface border border-line shadow-lg text-ink hover:text-seal flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
                title="이전 친구 궁합"
                aria-label="이전 친구"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNextPartner}
                className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface border border-line shadow-lg text-ink hover:text-seal flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
                title="다음 친구 궁합"
                aria-label="다음 친구"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div className="bg-gradient-to-b from-surface via-surface to-sunken/60 border border-line rounded-3xl p-6 sm:p-9 text-center space-y-7 shadow-sm relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-seal/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-44 h-44 bg-wood/5 rounded-full blur-3xl pointer-events-none" />

            {/* Versus Avatars Showcase (Strict Fixed Grid & Layout Stability) */}
            <div className="flex items-start justify-center gap-3 sm:gap-8">
              {/* Member 1 (Creator - Host) */}
              <div className="flex flex-col items-center space-y-2.5 w-[104px] sm:w-[124px] shrink-0 text-center">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-surface border-2 border-seal/30 shadow-md p-2 flex items-center justify-center shrink-0 aspect-square">
                    <ZodiacAvatar member={m1} size={76} fallbackEmoji={m1.character_emoji} />
                  </div>
                  <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-seal text-white text-[10px] font-bold shadow-xs select-none">
                    나 (호스트)
                  </span>
                </div>
                <div className="w-full space-y-0.5 h-[66px] flex flex-col items-center justify-start">
                  <p className="text-sm sm:text-base font-bold text-ink truncate w-full">
                    {m1.nickname}
                  </p>
                  <p className="text-xs text-ink-faint font-mono truncate w-full">
                    {m1.character_animal} · {m1.saju.daymaster.gan}{m1.saju.daymaster.element}
                  </p>
                  {m1.mbti ? (
                    <span className="inline-block px-2 py-0.5 bg-sunken rounded-md text-[10px] font-semibold text-ink-soft">
                      {m1.mbti}
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 text-[10px] invisible select-none">
                      MBTI
                    </span>
                  )}
                </div>
              </div>

              {/* Central Seal Badge with Destiny Thread */}
              <div className="flex flex-col items-center justify-center space-y-1 z-10 shrink-0 w-[96px] sm:w-[116px] pt-1">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-surface border-2 border-seal/30 shadow-xl flex flex-col items-center justify-center relative shrink-0 aspect-square">
                  <span className="text-[10px] sm:text-xs font-bold text-ink-faint tracking-tight">인연 지수</span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-seal leading-none my-0.5">
                    {pairScore}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded leading-none ${gradeInfo.badgeBg}`}>
                      {pairGrade}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-ink-soft truncate w-full text-center">
                  {gradeInfo.title}
                </span>
                <div className="w-16 sm:w-20 border-t-2 border-dashed border-seal/40 my-1 animate-pulse" />
              </div>

              {/* Member 2 (Active Partner) */}
              <div key={m2.id} className="flex flex-col items-center space-y-2.5 w-[104px] sm:w-[124px] shrink-0 text-center animate-fade-in">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-surface border-2 border-wood/30 shadow-md p-2 flex items-center justify-center shrink-0 aspect-square">
                    <ZodiacAvatar member={m2} size={76} fallbackEmoji={m2.character_emoji} />
                  </div>
                  <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-wood text-white text-[10px] font-bold shadow-xs select-none">
                    상대방
                  </span>
                </div>
                <div className="w-full space-y-0.5 h-[66px] flex flex-col items-center justify-start">
                  <p className="text-sm sm:text-base font-bold text-ink truncate w-full">
                    {m2.nickname}
                  </p>
                  <p className="text-xs text-ink-faint font-mono truncate w-full">
                    {m2.character_animal} · {m2.saju.daymaster.gan}{m2.saju.daymaster.element}
                  </p>
                  {m2.mbti ? (
                    <span className="inline-block px-2 py-0.5 bg-sunken rounded-md text-[10px] font-semibold text-ink-soft">
                      {m2.mbti}
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 text-[10px] invisible select-none">
                      MBTI
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Relation Title & One Liner (Fixed Height to prevent card jumping) */}
            <div className="space-y-1.5 max-w-md mx-auto pt-1">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink tracking-tight min-h-[32px] flex items-center justify-center">
                {analysis?.label || `${m1.nickname}님과 ${m2.nickname}님의 인연`}
              </h2>
              <p className="text-xs sm:text-sm text-ink-soft leading-relaxed min-h-[44px] flex items-center justify-center text-center">
                {analysis?.description || "서로에게 긍정적인 에너지를 불어넣으며 함께 성장해 나가는 인연입니다."}
              </p>
            </div>

            {/* Unified Brag / Share Button */}
            <div className="flex items-center justify-center pt-2">
              <button
                type="button"
                onClick={() => setIsStoryModalOpen(true)}
                className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-[#f43f5e] via-[#e11d48] to-[#ec4899] hover:opacity-95 text-white text-sm font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-md active:scale-98"
              >
                <Sparkles className="w-4 h-4" />
                <span>✨ 자랑하기</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-sunken p-1 rounded-xl text-xs sm:text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`flex-1 py-2.5 rounded-lg transition-colors text-center cursor-pointer ${
              activeTab === "summary"
                ? "bg-surface text-ink font-bold shadow-xs"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            핵심 요약
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("saju")}
            className={`flex-1 py-2.5 rounded-lg transition-colors text-center cursor-pointer ${
              activeTab === "saju"
                ? "bg-surface text-ink font-bold shadow-xs"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            사주 명식
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("astro_mbti")}
            className={`flex-1 py-2.5 rounded-lg transition-colors text-center cursor-pointer ${
              activeTab === "astro_mbti"
                ? "bg-surface text-ink font-bold shadow-xs"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            별자리 · MBTI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ziwei")}
            className={`flex-1 py-2.5 rounded-lg transition-colors text-center cursor-pointer ${
              activeTab === "ziwei"
                ? "bg-surface text-ink font-bold shadow-xs"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            자미두수
          </button>
        </div>

        {/* Tab Content 1: Summary */}
        {activeTab === "summary" && (
          <div className="space-y-4 animate-fade-in">
            {/* 6 Core Relation Metrics with interactive detailed breakdown */}
            <RelationshipMetricsCard
              m1={m1}
              m2={m2}
              pairScore={pairScore}
              title={`${m1.nickname} & ${m2.nickname} 관계 역학`}
            />

            {/* Relationship Tips */}
            <div className="bg-sunken border border-line rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-seal" />
                <span>두 사람을 위한 인연 처방전</span>
              </h4>
              <ul className="text-xs text-ink-soft space-y-1.5 list-disc list-inside">
                <li>서로의 일간({m1.saju.daymaster.element}과 {m2.saju.daymaster.element}) 에너지가 자연스러운 상생을 이룹니다.</li>
                <li>한 사람이 아이디어를 낼 때 다른 한 사람이 구조화해 주는 완벽한 역할 분담이 가능합니다.</li>
                <li>서운한 점이 생길 때는 감정을 묵히지 말고 솔직하고 가볍게 대화로 푸는 것이 길합니다.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab Content 2: Saju Detail */}
        {activeTab === "saju" && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-surface border border-line rounded-2xl p-5 space-y-5">
              <h3 className="font-serif text-sm font-bold text-ink">
                오행(五行) 밸런스와 일간 상생
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Member 1 Elements */}
                <div className="p-4 bg-sunken rounded-xl space-y-3">
                  <div className="text-xs font-bold text-ink flex items-center justify-between">
                    <span>{m1.nickname}님의 오행</span>
                    <span className="text-[11px] text-seal">{m1.saju.daymaster.element}({m1.saju.daymaster.gan})</span>
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(m1.saju.ohaeng_count || {}).map(([elem, cnt]) => (
                      <div key={elem} className="flex items-center justify-between text-[11px]">
                        <span className="text-ink-soft">{elem}</span>
                        <span className="font-mono font-bold text-ink">{cnt}개</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Member 2 Elements */}
                <div className="p-4 bg-sunken rounded-xl space-y-3">
                  <div className="text-xs font-bold text-ink flex items-center justify-between">
                    <span>{m2.nickname}님의 오행</span>
                    <span className="text-[11px] text-wood">{m2.saju.daymaster.element}({m2.saju.daymaster.gan})</span>
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(m2.saju.ohaeng_count || {}).map(([elem, cnt]) => (
                      <div key={elem} className="flex items-center justify-between text-[11px]">
                        <span className="text-ink-soft">{elem}</span>
                        <span className="font-mono font-bold text-ink">{cnt}개</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Saju Compatibility Text */}
              <div className="p-4 bg-sunken rounded-xl space-y-2 text-xs">
                <span className="font-bold text-seal">일간 상생 분석:</span>
                <p className="text-ink-soft leading-relaxed">
                  {m1.nickname}님은 <strong>{m1.saju.daymaster.gan}{m1.saju.daymaster.element}</strong>의 기운으로 주도성과 추진력을 가지며, 
                  {m2.nickname}님은 <strong>{m2.saju.daymaster.gan}{m2.saju.daymaster.element}</strong>의 기운으로 유연함과 지혜를 갖추고 있습니다. 
                  서로에게 결핍된 기운을 자연스럽게 채워주는 상호보완적 조화를 이룹니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 3: Astro & MBTI */}
        {activeTab === "astro_mbti" && (
          <div className="space-y-4 animate-fade-in">
            {/* Western Zodiac */}
            <div className="bg-surface border border-line rounded-2xl p-5 space-y-4">
              <h3 className="font-serif text-sm font-bold text-ink flex items-center gap-1.5">
                <Star className="w-4 h-4 text-seal" />
                <span>서양 별자리 원소 궁합</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-sunken rounded-xl space-y-1">
                  <span className="text-2xl">{zodiacCreator?.emoji}</span>
                  <p className="text-xs font-bold text-ink">{zodiacCreator?.name}</p>
                  <p className="text-[11px] text-ink-faint">{zodiacCreator?.element}</p>
                </div>
                <div className="p-3 bg-sunken rounded-xl space-y-1">
                  <span className="text-2xl">{zodiacPartner?.emoji}</span>
                  <p className="text-xs font-bold text-ink">{zodiacPartner?.name}</p>
                  <p className="text-[11px] text-ink-faint">{zodiacPartner?.element}</p>
                </div>
              </div>

              <p className="text-xs text-ink-soft leading-relaxed bg-sunken p-3.5 rounded-xl">
                {zodiacCreator?.name}와 {zodiacPartner?.name}의 만남은 
                {zodiacCreator?.element === zodiacPartner?.element ? " 같은 원소로 서로의 마음을 누구보다 빠르게 이해하는 소울메이트 조합입니다." : " 서로 다른 관점을 선물하며 지루할 틈이 없는 시너지를 만듭니다."}
              </p>
            </div>

            {/* MBTI Chemistry */}
            <div className="bg-surface border border-line rounded-2xl p-5 space-y-4">
              <h3 className="font-serif text-sm font-bold text-ink flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-wood" />
                <span>MBTI 성격 케미</span>
              </h3>

              <div className="flex items-center justify-center gap-4 text-center">
                <div className="px-4 py-3 bg-sunken rounded-xl">
                  <span className="text-xs text-ink-faint block">{m1.nickname}</span>
                  <span className="font-mono text-base font-bold text-seal">{m1.mbti || "미입력"}</span>
                </div>
                <span className="text-sm font-bold text-ink-faint">&</span>
                <div className="px-4 py-3 bg-sunken rounded-xl">
                  <span className="text-xs text-ink-faint block">{m2.nickname}</span>
                  <span className="font-mono text-base font-bold text-wood">{m2.mbti || "미입력"}</span>
                </div>
              </div>

              <p className="text-xs text-ink-soft leading-relaxed bg-sunken p-3.5 rounded-xl">
                {m1.mbti && m2.mbti ? (
                  `${m1.mbti}의 추진력과 ${m2.mbti}의 섬세한 조율이 어우러져 서로의 맹점을 커버하는 환상적인 파트너십을 보여줍니다.`
                ) : (
                  "MBTI 정보를 입력하면 성격 지표별 소통 방식과 주의점을 정밀하게 분석해 드립니다."
                )}
              </p>
            </div>
          </div>
        )}

        {/* Tab Content 4: Ziwei Detail */}
        {activeTab === "ziwei" && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-surface border border-line rounded-2xl p-5 space-y-4">
              <h3 className="font-serif text-sm font-bold text-ink flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-seal" />
                <span>자미두수(紫微斗數) 동양 점성학 궁합</span>
              </h3>

              <div className="p-4 bg-sunken rounded-xl space-y-3 text-xs leading-relaxed text-ink-soft">
                <p>
                  동양 최고(最古)의 제왕학 점성술인 자미두수를 통해 두 분의 명궁(命宮)과 천이궁(遷移宮)의 기운을 대조했습니다.
                </p>
                <div className="p-3 bg-surface border border-line rounded-lg space-y-1">
                  <span className="font-bold text-ink text-xs">영혼의 합일 지수:</span>
                  <p className="text-[11px] text-ink-soft">
                    두 사람은 전생의 인연이 현생에서 마주친 듯, 처음 만났음에도 오랜 친구처럼 편안함을 느끼는 길성(吉星) 배합을 이루고 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🌟 Dedicated 1:1 Instagram Story Modal (Clean, No Group Clutter) */}
        {isStoryModalOpen && (
          <SnapStoryModal
            isOpen={isStoryModalOpen}
            onClose={() => setIsStoryModalOpen(false)}
            m1={m1}
            m2={m2}
            pairScore={pairScore}
            pairGrade={pairGrade}
            pairLabel={analysis?.label}
            pairDesc={analysis?.description}
          />
        )}
      </div>
    </Layout>
  );
}
