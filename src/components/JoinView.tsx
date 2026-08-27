import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import SajuForm from "./SajuForm";
import LoadingOverlay from "./LoadingOverlay";
import { db, getAnonymousUser, auth, signInWithGoogle, saveRoomToHistory, getFriendlyAuthErrorMessage, getUserPersonalProfile, PersonalSajuProfile, saveUserPersonalProfile } from "../lib/firebase";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

interface JoinViewProps {
  code: string;
}

export default function JoinView({ code }: JoinViewProps) {
  const [roomTitle, setRoomTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [personalProfile, setPersonalProfile] = useState<PersonalSajuProfile | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Verify room existence and check for existing memberships
    const checkRoomAndMember = async () => {
      try {
        const snap = await getDoc(doc(db, "rooms", code));
        if (!snap.exists()) {
          setError("존재하지 않거나 이미 해체된 방 코드입니다.");
          setPageLoading(false);
          return;
        }
        setRoomTitle(snap.data().title);

        const membersSnap = await getDocs(collection(db, "rooms", code, "members"));
        const user = auth.currentUser;
        let foundMemberId = "";

        if (user && !user.isAnonymous) {
          // Fetch existing central Saju profile
          const profile = await getUserPersonalProfile();
          if (profile) {
            setPersonalProfile(profile);
          }

          membersSnap.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.user_uid === user.uid) {
              foundMemberId = docSnap.id;
            }
          });

          if (foundMemberId) {
            console.log("Existing member found, recovering session:", foundMemberId);
            localStorage.setItem(`saju_member_id_${code}`, foundMemberId);
            window.location.hash = `#/room/${code}`;
            return;
          }
        }
      } catch (err) {
        console.error(err);
        setError("방 정보를 확인하는 와중 통신 장애가 발생했습니다.");
      } finally {
        setPageLoading(false);
      }
    };

    checkRoomAndMember();
  }, [code, currentUser]);

  const handleJoinSubmit = async (sajuForm: {
    nickname: string;
    gender: string;
    birth_date: string;
    birth_time: string | null;
    saju: any;
    character_emoji: string;
    character_animal: string;
    character_color: string;
    mbti?: string | null;
  }) => {
    setError("");
    setLoading(true);

    try {
      // 1. Double check authentication UID
      const user = auth.currentUser;
      if (!user || user.isAnonymous) {
        throw new Error("보안 요구사항에 따라 실제 Google 소셜 로그인 계정이 필요합니다.");
      }
      const memberUid = user.uid;

      // 2. Create unique guest member ID
      const guestMemberId = "member_" + Math.random().toString(36).substring(2, 11);
      const nowStr = new Date().toISOString();

      // 3. Save member document to rooms/{code}/members/{guestMemberId}
      const payload: any = {
        nickname: sajuForm.nickname,
        gender: sajuForm.gender,
        birth_date: sajuForm.birth_date,
        birth_time: sajuForm.birth_time,
        saju: sajuForm.saju,
        character_emoji: sajuForm.character_emoji,
        character_animal: sajuForm.character_animal,
        character_color: sajuForm.character_color,
        joined_at: nowStr,
        user_uid: memberUid, // for security rules (본인 문서 검증)
      };
      if (sajuForm.mbti) {
        payload.mbti = sajuForm.mbti;
      }
      await setDoc(doc(db, "rooms", code, "members", guestMemberId), payload);

      // Only initialize central personal profile if user has NO profile at all yet
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
        });
      }

      // 4. CACHE INVALIDATION strictly matching requirements
      const cacheRef = doc(db, "rooms", code, "analysis", "result");
      await deleteDoc(cacheRef).catch((e) => {
        console.log("No existing cached report to delete, continuing safely.");
      });

      // 5. Cache in localStorage
      localStorage.setItem(`saju_member_id_${code}`, guestMemberId);

      // 6. Save to local list of joined/administered rooms
      saveRoomToHistory(code, "member", roomTitle || "인연 사주방");

      // Redirect to main room dashboard
      window.location.hash = `#/room/${code}`;

    } catch (err: any) {
      console.error("Failed to join room:", err);
      setError(err.message || "모임 참가 도중 전송 오류가 일어났습니다.");
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Layout title="모임방 참여">
        <div className="flex flex-col items-center justify-center py-20 select-none">
          <div className="w-10 h-10 rounded-full border-2 border-seal border-t-transparent animate-spin mb-3" />
          <p className="text-xs text-ink-soft">모임방 정보를 확인하고 있습니다...</p>
        </div>
      </Layout>
    );
  }

  const isGoogleUser = currentUser && !currentUser.isAnonymous;

  if (!isGoogleUser) {
    return (
      <Layout title={`${roomTitle || "모임방"} 참여하기`} showHomeButton>
        {loading && <LoadingOverlay message="로그인하는 중..." />}
        <div className="space-y-4 py-3 text-center max-w-md mx-auto">
          <div className="w-12 h-12 mx-auto rounded-md bg-ink text-white flex items-center justify-center font-serif text-xl select-none">
            參
          </div>

          <div className="space-y-1">
            <h3 className="font-serif text-lg font-semibold text-ink tracking-tight">
              로그인하고 참여하기
            </h3>
            <p className="text-sm text-ink-soft leading-relaxed max-w-sm mx-auto">
              사주 프로필을 안전하게 보관하고 궁합을 다시 볼 수 있도록 Google 계정으로 로그인합니다.
            </p>
          </div>

          <div className="bg-surface border border-line p-4 rounded-xl text-left text-sm text-ink-soft leading-relaxed">
            다시 방문해도 등록한 사주 캐릭터와 궁합 분석을 언제든 확인할 수 있습니다.
          </div>

          {error && (
            <p className="text-xs text-seal bg-sunken p-3 rounded-xl font-medium">{error}</p>
          )}

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
            <span>Google 계정으로 계속하기</span>
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${roomTitle || "모임방"} 참여하기`} showHomeButton>
      {loading && <LoadingOverlay message="사주를 등록하는 중..." />}

      <div className="space-y-5 py-1">
        <div className="text-center space-y-1">
          <h3 className="font-serif text-xl font-semibold text-ink tracking-tight">
            '{roomTitle || "모임방"}'에 사주 등록
          </h3>
          <p className="text-sm text-ink-soft">
            태어난 일시를 입력하면 모임 멤버들과의 궁합이 계산됩니다.
          </p>
        </div>

        {error && (
          <p className="text-xs text-seal bg-sunken p-3 rounded-xl font-medium text-center">
            {error}
          </p>
        )}

        <SajuForm
          onSubmit={handleJoinSubmit}
          submitButtonText="등록하고 참여하기"
          initialNickname={personalProfile?.nickname || currentUser?.displayName || ""} 
          initialGender={personalProfile?.gender || "여성"}
          initialBirthDate={personalProfile?.birth_date || ""}
          initialBirthTime={personalProfile?.birth_time || null}
          initialMbti={personalProfile?.mbti || null}
          initialBirthplaceCity={personalProfile?.birthplace_city || null}
          initialBirthplaceRegion={personalProfile?.birthplace_region || null}
        />
      </div>
    </Layout>
  );
}
