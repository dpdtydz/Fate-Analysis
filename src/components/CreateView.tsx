import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import SajuForm from "./SajuForm";
import LoadingOverlay from "./LoadingOverlay";
import { 
  db, 
  auth, 
  signInWithGoogle, 
  linkCurrentAccountWithGoogle, 
  saveRoomToHistory, 
  getUserMembershipInfo, 
  getFriendlyAuthErrorMessage,
  getUserPersonalProfile,
  saveUserPersonalProfile,
  PersonalSajuProfile
} from "../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { AlertCircle, Sparkles, Chrome, CheckCircle2, ShieldAlert, ArrowRight } from "lucide-react";
import UpgradeToSocialModal from "./UpgradeToSocialModal";
import AuthModal from "./AuthModal";

export default function CreateView() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [personalProfile, setPersonalProfile] = useState<PersonalSajuProfile | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    getUserPersonalProfile().then((p) => {
      setPersonalProfile(p);
    });
  }, [currentUser]);

  const membership = getUserMembershipInfo(currentUser);

  const handleCreateRoom = async (sajuForm: {
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
    setError("");

    if (!membership.canCreateRoom) {
      setError("방 개설은 Google SNS 연동 정회원 전용입니다. 먼저 계정을 연동해 주세요.");
      return;
    }

    if (!title.trim()) {
      setError("모임 이름(방 제목)을 입력해 주세요.");
      return;
    }

    setLoading(true);

    try {
      // 1. Double check authentication UID
      const user = auth.currentUser;
      if (!user || user.isAnonymous) {
        throw new Error("보안 요구사항에 따라 실제 Google 소셜 로그인 계정이 필요합니다.");
      }
      const ownerUid = user.uid;

      // 2. Generate unique 6-digit room code
      let code = "";
      let unique = false;
      let attempts = 0;

      while (!unique && attempts < 10) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let tempCode = "";
        for (let i = 0; i < 6; i++) {
          tempCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Verify if room code already exists
        const roomSnap = await getDoc(doc(db, "rooms", tempCode));
        if (!roomSnap.exists()) {
          code = tempCode;
          unique = true;
        }
        attempts++;
      }

      if (!code) {
        throw new Error("고유 방 코드를 생성하는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
      }

      // 3. Setup dates (expires in 30 days as requested)
      const now = new Date();
      const expire = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

      // 4. Create Room document
      await setDoc(doc(db, "rooms", code), {
        code,
        title: title.trim(),
        owner_uid: ownerUid,
        created_at: now.toISOString(),
        expire_at: expire.toISOString(),
        is_locked: false,
      });

      // 5. Create Host as first group member in subcollection
      const hostMemberId = "member_" + Math.random().toString(36).substring(2, 11);
      const hostPayload: any = {
        nickname: sajuForm.nickname,
        gender: sajuForm.gender,
        birth_date: sajuForm.birth_date,
        birth_time: sajuForm.birth_time,
        saju: sajuForm.saju,
        character_emoji: sajuForm.character_emoji,
        character_animal: sajuForm.character_animal,
        character_color: sajuForm.character_color,
        user_uid: ownerUid,
        joined_at: now.toISOString(),
      };
      if (sajuForm.mbti) {
        hostPayload.mbti = sajuForm.mbti;
      }
      if (sajuForm.birthplace_region) {
        hostPayload.birthplace_region = sajuForm.birthplace_region;
      }
      if (sajuForm.birthplace_city) {
        hostPayload.birthplace_city = sajuForm.birthplace_city;
      }

      await setDoc(doc(db, "rooms", code, "members", hostMemberId), hostPayload);

      // Only initialize personal profile if user currently does NOT have any saved personal profile
      if (!personalProfile) {
        saveUserPersonalProfile({
          nickname: sajuForm.nickname,
          gender: (sajuForm.gender as "남성" | "여성") || "남성",
          birth_date: sajuForm.birth_date,
          birth_time: sajuForm.birth_time,
          saju: sajuForm.saju,
          character_emoji: sajuForm.character_emoji,
          character_animal: sajuForm.character_animal,
          character_color: sajuForm.character_color,
          mbti: sajuForm.mbti || null,
          birthplace_region: sajuForm.birthplace_region || null,
          birthplace_city: sajuForm.birthplace_city || null,
          updatedAt: now.getTime(),
        });
      }

      // 6. Save in local member ID and history
      localStorage.setItem(`saju_member_id_${code}`, hostMemberId);
      saveRoomToHistory(code, "owner", title.trim());

      // 7. Route directly to the created room
      window.location.hash = `#/room/${code}`;
    } catch (err: any) {
      console.error("Room creation error:", err);
      setError(err.message || "방을 여는 도중 오류가 발생했습니다. 네트워크 연동 상태를 확인하세요.");
      setLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await linkCurrentAccountWithGoogle();
      setSuccessMsg(res.message);
    } catch (err: any) {
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // State 1: Regular Email User (Must link Google to create room)
  if (membership.isEmailOnly) {
    return (
      <Layout title="인연방 개설 권한 안내" showHomeButton>
        {loading && <LoadingOverlay message="Google 계정 연동 처리 중..." />}
        <div className="space-y-5 py-3 text-center max-w-md mx-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl border border-amber-300 bg-amber-50 flex items-center justify-center font-serif text-2xl text-amber-700 shadow-xs select-none">
            <Sparkles className="w-7 h-7 text-amber-600" />
          </div>

          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-serif font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
              👑 정회원 승급 필요
            </span>
            <h3 className="font-serif text-lg font-bold text-[#2C3E50] tracking-tight">
              Google 연동 후 모임방을 만드실 수 있습니다
            </h3>
            <p className="text-xs text-[#4F443B] leading-relaxed">
              현재 <strong className="text-[#2C3E50] font-mono">{membership.email}</strong>(일반회원)으로 로그인되어 있습니다.
              호스트 권한 활성화를 위해 1초 Google 연동을 완료해 주세요.
            </p>
          </div>

          <div className="bg-[#FCFAF7] border border-[#E2D8C7] p-4 rounded-2xl text-left text-xs text-[#4F443B] leading-relaxed space-y-2">
            <p className="font-bold text-[#2C3E50] flex items-center gap-1.5 font-serif">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>연동 시 기존 데이터 100% 보존</span>
            </p>
            <p className="text-[11px]">기존에 참여했던 모임방 기록과 사주 분석 내역은 그대로 유지되며, 즉시 방장 권한과 쿠폰 혜택이 열립니다.</p>
          </div>

          {error && (
            <div className="text-xs text-[#C0392B] bg-[#FDEDEC] p-3 rounded-xl border border-[#FADBD8] font-medium">
              ⚠️ {error}
            </div>
          )}

          {successMsg && (
            <div className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-medium">
              {successMsg}
            </div>
          )}

          <button
            type="button"
            onClick={handleLinkGoogle}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 active:scale-98 text-white font-serif font-bold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Chrome className="w-4 h-4 text-white" />
            <span>{loading ? "Google 연동 중..." : "🚀 1초만에 Google 연동하고 방 개설하기"}</span>
          </button>
        </div>
      </Layout>
    );
  }

  // State 2: Guest / Unauthenticated
  if (!membership.isSocialVerified) {
    return (
      <Layout title="인연방 개설" showHomeButton>
        {loading && <LoadingOverlay message="인간 명부를 여는 중..." />}
        <div className="space-y-5 py-3 text-center max-w-md mx-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl border border-[#C0392B]/40 bg-[#FDF2F0] flex items-center justify-center font-serif text-2xl text-[#C0392B] shadow-xs select-none">
            <span className="font-bold">開</span>
          </div>
          
          <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-bold text-[#2C3E50] tracking-tight">
              Google 정회원 로그인 안내
            </h3>
            <p className="text-xs text-[#4F443B] leading-relaxed">
              모임방 개설자의 방 관리 권한 유지와 안전한 데이터 보관을 위해 Google 계정 인증을 진행합니다.
            </p>
          </div>

          <div className="bg-[#FCFAF7] border border-[#E2D8C7] p-4 rounded-2xl text-left text-xs text-[#4F443B] leading-relaxed space-y-1">
            <p className="font-bold text-[#2C3E50]">💡 정회원 개설 혜택</p>
            <p className="text-[11px]">브라우저를 닫거나 기기를 변경해도 생성한 모임방을 안전하게 관리하고 멤버들의 궁합 결과를 지속적으로 열람할 수 있습니다.</p>
          </div>

          {error && (
            <div className="text-xs text-[#C0392B] bg-[#FDEDEC] p-3 rounded-xl border border-[#FADBD8] font-medium">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  setError("");
                  setLoading(true);
                  await signInWithGoogle();
                } catch (err: any) {
                  setError(getFriendlyAuthErrorMessage(err));
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full py-3.5 bg-[#2C3E50] hover:bg-[#1E293B] active:scale-98 text-[#FAF7F2] font-serif font-bold text-sm rounded-2xl transition-all tracking-wide shadow-md flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Chrome className="w-4 h-4 text-amber-400" />
              <span>Google 계정으로 로그인하고 방 만들기</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-2.5 text-xs text-[#5C5046] hover:text-[#2C3E50] transition underline"
            >
              다른 방법으로 로그인 / 회원가입
            </button>
          </div>
        </div>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </Layout>
    );
  }

  // State 3: Verified Google Social Member
  return (
    <Layout title="인연방 개설" showHomeButton>
      {loading && <LoadingOverlay message="기운을 열고 새 연방을 세우는 중..." />}

      <div className="space-y-4 py-1">
        <div className="text-center">
          <span className="text-[10px] bg-amber-50 text-amber-900 px-2.5 py-1 rounded-full border border-amber-200 font-serif font-bold inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            정회원 인증: {membership.displayName}님
          </span>
          <h3 className="font-serif text-lg font-bold text-[#2C3E50] tracking-tight mt-2">
            새로운 인연방 만들기
          </h3>
          <p className="text-xs text-[#4F443B] mt-0.5">
            모임 이름을 정하고, 방장님의 사주명식을 첫 번째로 등록합니다.
          </p>
        </div>

        {/* Room Title */}
        <div className="space-y-1 bg-[#FCFAF7] p-4 border border-[#E2D8C7] rounded-xl shadow-xs text-left">
          <label className="block text-xs font-semibold text-[#2C3E50]">모임명 (인연방 제목)</label>
          <input
            id="room-title-input"
            type="text"
            maxLength={20}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 우리 팀 회식, 경영학과 동기 모임"
            className="w-full px-3.5 py-2.5 bg-white border border-[#D6CCBC] focus:outline-none focus:ring-1 focus:ring-[#C0392B] focus:border-[#C0392B] rounded-lg text-sm placeholder:text-[#B0A69B] text-[#2C3E50]"
          />
        </div>

        {/* Auth / general error messaging */}
        {error && (
          <div className="text-xs text-[#C0392B] bg-[#FDEDEC] p-3 rounded-lg border border-[#FADBD8] font-medium text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Owner's saju profile block */}
        <SajuForm 
          onSubmit={handleCreateRoom} 
          submitButtonText="방 개설 및 나도 등록하기" 
          initialNickname={personalProfile?.nickname || currentUser?.displayName || ""} 
          initialGender={personalProfile?.gender}
          initialBirthDate={personalProfile?.birth_date}
          initialBirthTime={personalProfile?.birth_time}
          initialMbti={personalProfile?.mbti || ""}
          initialBirthplaceRegion={personalProfile?.birthplace_region || ""}
          initialBirthplaceCity={personalProfile?.birthplace_city || ""}
        />
      </div>
    </Layout>
  );
}
