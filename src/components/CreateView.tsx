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

      // Always save and sync personal profile so it is immediately accessible in My Saju
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
      <Layout title="모임방 만들기" showHomeButton>
        {loading && <LoadingOverlay message="Google 계정을 연동하는 중..." />}
        <div className="space-y-5 py-3 text-center max-w-md mx-auto">
          <div className="w-12 h-12 mx-auto rounded-md bg-ink text-white flex items-center justify-center font-serif text-xl select-none">
            開
          </div>

          <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-semibold text-ink tracking-tight">
              Google 연동 후 모임방을 만들 수 있습니다
            </h3>
            <p className="text-sm text-ink-soft leading-relaxed">
              지금은 <strong className="text-ink font-mono">{membership.email}</strong> 일반회원으로 로그인되어 있습니다.
              방장 권한을 쓰려면 Google 계정을 연동해 주세요.
            </p>
          </div>

          <div className="bg-surface border border-line p-4 rounded-xl text-left text-sm text-ink-soft leading-relaxed space-y-1">
            <p className="font-semibold text-ink">연동해도 기존 데이터는 그대로 유지됩니다.</p>
            <p className="text-xs">참여했던 모임방 기록과 사주 분석 내역이 보존되고, 방장 권한과 쿠폰 기능이 열립니다.</p>
          </div>

          {error && (
            <p className="text-xs text-seal bg-sunken p-3 rounded-xl font-medium">{error}</p>
          )}

          {successMsg && (
            <p className="text-xs text-ink bg-sunken p-3 rounded-xl font-medium">{successMsg}</p>
          )}

          <button
            type="button"
            onClick={handleLinkGoogle}
            disabled={loading}
            className="w-full py-3.5 bg-ink hover:bg-ink/90 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Chrome className="w-4 h-4 text-white" />
            <span>{loading ? "Google 연동 중..." : "Google 계정 연동하기"}</span>
          </button>
        </div>
      </Layout>
    );
  }

  // State 2: Guest / Unauthenticated
  if (!membership.isSocialVerified) {
    return (
      <Layout title="모임방 만들기" showHomeButton>
        {loading && <LoadingOverlay message="로그인하는 중..." />}
        <div className="space-y-5 py-3 text-center max-w-md mx-auto">
          <div className="w-12 h-12 mx-auto rounded-md bg-ink text-white flex items-center justify-center font-serif text-xl select-none">
            開
          </div>

          <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-semibold text-ink tracking-tight">
              로그인하고 모임방 만들기
            </h3>
            <p className="text-sm text-ink-soft leading-relaxed">
              방 관리 권한을 유지하고 데이터를 안전하게 보관하기 위해 Google 계정으로 로그인합니다.
            </p>
          </div>

          <div className="bg-surface border border-line p-4 rounded-xl text-left text-sm text-ink-soft leading-relaxed">
            브라우저를 닫거나 기기를 바꿔도 만든 모임방을 관리하고 멤버들의 궁합 결과를 계속 볼 수 있습니다.
          </div>

          {error && (
            <p className="text-xs text-seal bg-sunken p-3 rounded-xl font-medium">{error}</p>
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
              className="w-full py-3.5 bg-ink hover:bg-ink/90 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Chrome className="w-4 h-4" />
              <span>Google 계정으로 계속하기</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-2.5 text-xs text-ink-soft hover:text-ink transition-colors underline decoration-line underline-offset-2 cursor-pointer"
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
    <Layout title="모임방 만들기" showHomeButton>
      {loading && <LoadingOverlay message="모임방을 만드는 중..." />}

      <div className="space-y-5 py-1">
        <div className="text-center space-y-1">
          <h3 className="font-serif text-xl font-semibold text-ink tracking-tight">
            새 모임방 만들기
          </h3>
          <p className="text-sm text-ink-soft">
            모임 이름을 정하고, 방장의 사주를 첫 번째로 등록합니다.
          </p>
        </div>

        {/* Room Title */}
        <div className="space-y-1.5 bg-surface p-5 border border-line rounded-xl text-left">
          <label className="block text-xs font-medium text-ink-soft">모임 이름</label>
          <input
            id="room-title-input"
            type="text"
            maxLength={20}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 우리 팀 회식, 경영학과 동기 모임"
            className="w-full px-4 py-3 bg-sunken rounded-xl focus:outline-none focus:ring-1 focus:ring-ink text-sm placeholder:text-ink-faint text-ink"
          />
        </div>

        {/* Auth / general error messaging */}
        {error && (
          <p className="text-xs text-seal bg-sunken p-3 rounded-xl font-medium text-center">
            {error}
          </p>
        )}

        {/* Owner's saju profile block */}
        <SajuForm 
          onSubmit={handleCreateRoom} 
          submitButtonText="방 만들고 내 사주 등록하기"
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
