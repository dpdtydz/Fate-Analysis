import React, { useState, useEffect, useMemo, useCallback } from "react";
import Layout from "./Layout";
import { 
  Sparkles, 
  Share2, 
  Copy, 
  Check, 
  ChevronRight, 
  HeartHandshake, 
  UserPlus, 
  HelpCircle, 
  ArrowRight,
  RotateCcw,
  Compass,
  Star,
  ShieldCheck,
  Zap,
  Flame,
  Clock
} from "lucide-react";
import { Member, PairSnap, SajuData } from "../types";
import { calculateSaju } from "../utils/saju";
import { 
  createPairSnap, 
  getPairSnap, 
  joinPairSnap, 
  subscribePairSnap 
} from "../lib/firebase";
import { 
  getRecentPersonalProfile, 
  saveRecentPersonalProfile,
  recordRecentSnap,
  getRecentSnaps,
  RecentSnapItem
} from "../lib/offlineVault";
import { generateDynamicPairCompatibility } from "../utils/pairChemistry";
import { shareToKakaoOrClipboard } from "../utils/shareHelper";
import ZodiacAvatar from "./ZodiacAvatar";
import SajuForm from "./SajuForm";
import GroupStoryModal from "./GroupStoryModal";

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
        setSnapData(snap);
        if (snap.creator) {
          recordRecentSnap(
            currentCode, 
            snap.creator.nickname, 
            snap.partner?.nickname
          );
          setRecentSnaps(getRecentSnaps());
        }
      } else {
        setErrorMessage("존재하지 않거나 만료된 1:1 인연 초대장입니다.");
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentCode]);

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
    email?: string;
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
        email: formData.email,
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

  // Partner flow: Join Snap
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
    email?: string;
  }) => {
    if (!currentCode) return;
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
        email: formData.email,
        joined_at: new Date().toISOString()
      };

      const updated = await joinPairSnap(currentCode, partnerMember);
      setSnapData(updated);
    } catch (err: any) {
      setErrorMessage(err?.message || "참여 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
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
    const partnerName = snapData.partner?.nickname;

    const title = partnerName 
      ? `✨ ${creatorName}님 & ${partnerName}님의 1:1 인연 궁합 결과`
      : `💌 ${creatorName}님이 1:1 인연 궁합 초대장을 보냈어요!`;
    const description = partnerName
      ? `두 사람만의 사주, 별자리, MBTI, 자미두수 궁합 분석 결과를 확인해보세요!`
      : `닉네임과 생년월일을 입력하면 두 사람만의 1:1 상세 인연 궁합이 즉시 공개됩니다.`;

    await shareToKakaoOrClipboard({
      title,
      description,
      url: shareUrl,
    });
  };

  // 1:1 Analysis calculation when both creator & partner exist
  const analysis = useMemo(() => {
    if (!snapData?.creator || !snapData?.partner) return null;
    return generateDynamicPairCompatibility(snapData.creator, snapData.partner);
  }, [snapData?.creator, snapData?.partner]);

  // Western Zodiac
  const zodiacCreator = useMemo(() => snapData ? getWesternZodiac(snapData.creator.birth_date) : null, [snapData?.creator]);
  const zodiacPartner = useMemo(() => snapData?.partner ? getWesternZodiac(snapData.partner.birth_date) : null, [snapData?.partner]);

  // Render State 1: Loading
  if (isLoading && !snapData) {
    return (
      <Layout maxWidth="2xl">
        <div className="py-20 text-center space-y-4">
          <div className="w-12 h-12 mx-auto border-3 border-seal border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-ink-soft">1:1 인연 초대장을 불러오는 중...</p>
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
            <span>새 1:1 초대장 만들기</span>
          </a>
        </div>
      </Layout>
    );
  }

  // Render State 3: Mode Create (No Code yet)
  if (!currentCode || !snapData) {
    return (
      <Layout maxWidth="2xl">
        <div className="py-8 sm:py-12 space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-seal/10 text-seal text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>1:1 맞춤형 인연 스냅</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
              둘만의 깊은 인연 궁합
            </h1>
            <p className="text-sm text-ink-soft leading-relaxed max-w-md mx-auto">
              모임 없이 친구, 연인, 동료와 1:1로 빠르게!<br />
              내 사주를 등록하고 초대 링크를 상대방에게 보내보세요.
            </p>
          </div>

          {/* Recent 1:1 Snaps if available */}
          {recentSnaps.length > 0 && (
            <div className="p-4 rounded-2xl bg-sunken border border-line space-y-3">
              <div className="flex items-center justify-between text-xs text-ink-faint">
                <span className="flex items-center gap-1.5 font-medium text-ink">
                  <Clock className="w-3.5 h-3.5 text-seal" />
                  <span>최근 확인한 1:1 인연 궁합</span>
                </span>
                <span className="text-[11px]">링크로 언제든 다시 볼 수 있어요</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {recentSnaps.map((item) => (
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
                      <span className="text-[10px] text-seal font-bold">1:1 스냅 · 코드 {item.code}</span>
                      <p className="text-xs sm:text-sm font-bold text-ink truncate group-hover:text-seal transition-colors">
                        {item.partnerName ? `${item.creatorName} & ${item.partnerName}` : `${item.creatorName}님의 초대장`}
                      </p>
                      <p className="text-[11px] text-ink-soft">
                        {item.partnerName ? "궁합 결과 다시보기" : "상대방 접속 대기 중"}
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
                <span>내 정보 입력</span>
              </h2>
              <p className="text-xs text-ink-faint mt-1">
                상대방과의 1:1 상세 궁합 분석을 위해 본인의 사주 정보를 입력해주세요.
              </p>
            </div>

            <SajuForm
              onSubmit={handleCreateSnap}
              submitButtonText="1:1 초대장 만들고 링크 받기"
              initialNickname={savedProfile?.nickname || ""}
              initialGender={savedProfile?.gender as any}
              initialBirthDate={savedProfile?.birth_date}
              initialBirthTime={savedProfile?.birth_time}
              initialMbti={savedProfile?.mbti}
              initialRegion={savedProfile?.birthplace_region}
              initialCity={savedProfile?.birthplace_city}
            />
          </div>
        </div>
      </Layout>
    );
  }

  // Render State 4: Mode Wait / Join (Partner has NOT joined yet)
  if (!snapData.partner) {
    return (
      <Layout maxWidth="2xl">
        <div className="py-8 sm:py-12 space-y-8 animate-fade-in">
          {/* Creator Profile Preview Card */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-surface border-2 border-seal/30 shadow-md p-2 flex items-center justify-center">
              <ZodiacAvatar member={snapData.creator} size={64} fallbackEmoji={snapData.creator.character_emoji} />
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-seal/10 text-seal text-xs font-semibold">
                1:1 인연 초대장
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                {snapData.creator.nickname}님과의 1:1 궁합
              </h1>
              <p className="text-xs sm:text-sm text-ink-soft max-w-sm mx-auto">
                {snapData.creator.character_animal} 기운을 지닌 {snapData.creator.nickname}님과의<br />
                상세 사주, 서양 별자리, MBTI, 자미두수 궁합을 확인해보세요!
              </p>
            </div>
          </div>

          {/* Share Box (For Creator to invite partner) */}
          <div className="bg-sunken border border-line rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-seal" />
                <span>상대방 초대 링크 공유</span>
              </span>
              <span className="text-[11px] text-seal font-semibold animate-pulse">
                ● 상대방 접속 대기 중
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
                <span>카카오톡으로 초대</span>
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

          {/* Partner Registration Form */}
          <div className="bg-surface border border-line rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
            <div className="border-b border-line pb-4">
              <h2 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-seal text-white text-xs flex items-center justify-center font-mono">2</span>
                <span>상대방 정보 입력</span>
              </h2>
              <p className="text-xs text-ink-faint mt-1">
                닉네임, 이메일, MBTI, 사는곳과 생년월일을 입력하면 둘만의 분석 결과가 즉시 공개됩니다.
              </p>
            </div>

            <SajuForm
              onSubmit={handleJoinSnap}
              submitButtonText={`${snapData.creator.nickname}님과의 궁합 확인하기`}
            />
          </div>
        </div>
      </Layout>
    );
  }

  // Render State 5: Mode Result (Both Creator and Partner exist!)
  const m1 = snapData.creator;
  const m2 = snapData.partner;
  const pairScore = analysis?.totalScore ?? 82;
  const pairGrade = pairScore >= 90 ? "S+" : pairScore >= 80 ? "S" : pairScore >= 70 ? "A" : pairScore >= 60 ? "B" : "C";

  return (
    <Layout maxWidth="2xl">
      <div className="py-6 sm:py-10 space-y-8 animate-fade-in">
        {/* Top Floating Badge & Actions */}
        <div className="flex items-center justify-between text-xs text-ink-faint border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-seal/10 text-seal font-semibold">1:1 인연 스냅</span>
            <span className="font-mono text-ink-soft">코드: {currentCode}</span>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Hero Head-to-Head Card */}
        <div className="bg-gradient-to-b from-surface via-surface to-sunken border border-line rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-sm relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-seal/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-wood/5 rounded-full blur-3xl pointer-events-none" />

          {/* Versus Avatars */}
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            {/* Member 1 (Creator) */}
            <div className="flex flex-col items-center space-y-2 min-w-[90px]">
              <div className="relative">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-surface border-2 border-seal/30 shadow-md p-1.5 flex items-center justify-center">
                  <ZodiacAvatar member={m1} size={64} fallbackEmoji={m1.character_emoji} />
                </div>
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-seal text-white text-[10px] font-bold">
                  초대자
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-bold text-ink truncate max-w-[110px]">
                  {m1.nickname}
                </p>
                <p className="text-[11px] text-ink-faint">
                  {m1.character_animal} · {m1.saju.daymaster.gan}{m1.saju.daymaster.element}
                </p>
                {m1.mbti && (
                  <span className="inline-block px-1.5 py-0.2 bg-sunken rounded text-[10px] font-medium text-ink-soft">
                    {m1.mbti}
                  </span>
                )}
              </div>
            </div>

            {/* Chemistry Badge in the middle */}
            <div className="flex flex-col items-center justify-center space-y-1 z-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-surface border border-line shadow-lg flex flex-col items-center justify-center">
                <span className="text-[10px] sm:text-xs font-semibold text-ink-faint">인연 지수</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-seal leading-none">
                  {pairScore}
                </span>
                <span className="text-[10px] font-extrabold text-wood mt-0.5">
                  등급 {pairGrade}
                </span>
              </div>
            </div>

            {/* Member 2 (Partner) */}
            <div className="flex flex-col items-center space-y-2 min-w-[90px]">
              <div className="relative">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-surface border-2 border-wood/30 shadow-md p-1.5 flex items-center justify-center">
                  <ZodiacAvatar member={m2} size={64} fallbackEmoji={m2.character_emoji} />
                </div>
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-wood text-white text-[10px] font-bold">
                  동반자
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-bold text-ink truncate max-w-[110px]">
                  {m2.nickname}
                </p>
                <p className="text-[11px] text-ink-faint">
                  {m2.character_animal} · {m2.saju.daymaster.gan}{m2.saju.daymaster.element}
                </p>
                {m2.mbti && (
                  <span className="inline-block px-1.5 py-0.2 bg-sunken rounded text-[10px] font-medium text-ink-soft">
                    {m2.mbti}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Relation Title & One Liner */}
          <div className="space-y-2 max-w-lg mx-auto pt-2">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-ink">
              {analysis?.label || `${m1.nickname}님과 ${m2.nickname}님의 인연`}
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
              {analysis?.description || "서로에게 긍정적인 에너지를 불어넣으며 함께 성장해 나가는 인연입니다."}
            </p>
          </div>

          {/* Viral Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsStoryModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-[#f43f5e] to-[#ec4899] hover:opacity-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>📸 인스타 스토리로 공유하기</span>
            </button>
            <button
              type="button"
              onClick={handleKakaoShare}
              className="px-4 py-2.5 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>결과 자랑하기 (카톡)</span>
            </button>
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
            {/* 6 Core Relation Metrics */}
            <div className="bg-surface border border-line rounded-2xl p-5 space-y-4">
              <h3 className="font-serif text-sm font-bold text-ink flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-seal" />
                <span>두 사람의 6대 관계 역학</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "대화 티키타카", score: Math.min(95, Math.round(pairScore * 0.98)), desc: "생각의 파장이 맞아 자연스럽게 흐르는 대화" },
                  { label: "업무 & 협업 시너지", score: Math.min(92, Math.round(pairScore * 0.92 + 5)), desc: "서로의 부족한 점을 직관적으로 보완" },
                  { label: "감정 공감도", score: Math.min(96, Math.round(pairScore * 0.95 - 2)), desc: "말하지 않아도 눈빛으로 헤아리는 온기" },
                  { label: "현실 문제 조화", score: Math.min(90, Math.round(pairScore * 0.88 + 8)), desc: "위기 상황에서 침착하게 합을 맞추는 힘" },
                  { label: "취향 및 감성 공감", score: Math.min(94, Math.round(pairScore * 0.94)), desc: "일상의 소소한 가치와 아름다움을 공유" },
                  { label: "장기 인연 지속력", score: Math.min(98, Math.round(pairScore * 0.96 + 3)), desc: "시간이 흐를수록 깊어지는 든든한 신뢰" },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-sunken rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-ink">{item.label}</span>
                      <span className="font-mono font-bold text-seal">{item.score}점</span>
                    </div>
                    <div className="w-full h-1.5 bg-line rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-seal to-wood rounded-full" 
                        style={{ width: `${item.score}%` }} 
                      />
                    </div>
                    <p className="text-[11px] text-ink-faint leading-tight">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

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

        {/* Instagram Story Modal (Dedicated 1:1 format) */}
        {isStoryModalOpen && (
          <GroupStoryModal
            isOpen={isStoryModalOpen}
            onClose={() => setIsStoryModalOpen(false)}
            roomTitle={`${m1.nickname} & ${m2.nickname} 1:1 인연`}
            allMembers={[m1, m2]}
            groupScore={pairScore}
            initialPair={{ m1, m2 }}
            defaultTab="pair"
            currentMember={m1}
          />
        )}
      </div>
    </Layout>
  );
}
