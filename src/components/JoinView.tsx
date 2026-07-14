import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import SajuForm from "./SajuForm";
import LoadingOverlay from "./LoadingOverlay";
import { db, getAnonymousUser, auth, signInWithGoogle, saveRoomToHistory } from "../lib/firebase";
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

        const user = auth.currentUser;
        if (user && !user.isAnonymous) {
          const membersSnap = await getDocs(collection(db, "rooms", code, "members"));
          let foundMemberId = "";
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
      <Layout title="인연 참례 준비 중">
        <div className="flex flex-col items-center justify-center py-24 select-none">
          <div className="animate-spin text-3xl text-[#C0392B] font-serif">☯</div>
          <p className="text-xs text-[#8C7B6E] mt-3">문을 열 준비를 하고 있습니다...</p>
        </div>
      </Layout>
    );
  }

  const isGoogleUser = currentUser && !currentUser.isAnonymous;

  if (!isGoogleUser) {
    return (
      <Layout title={`${roomTitle || "인연방"} 참여하기`} showHomeButton>
        {loading && <LoadingOverlay message="인간 명부를 대접하는 중..." />}
        <div className="space-y-6 py-4 text-center">
          <div className="w-16 h-16 mx-auto rounded-full border border-[#D6CCBC] bg-[#FCFAF5] flex items-center justify-center font-serif text-3xl text-[#C0392B] shadow-xs">
            ☯
          </div>
          
          <div className="space-y-2">
            <h3 className="font-serif text-base font-bold text-[#2C3E50] tracking-tight">
              소셜 Google 로그인 필수 안내
            </h3>
            <p className="text-xs text-[#5A4D41] leading-relaxed max-w-sm mx-auto">
              익명(Anonymous) 방식의 통신 장해 및 프로필 유실 문제를 방지하기 위해 이 서비스는 <strong>Google 계정 인증</strong>을 필수로 채택하고 있습니다.
            </p>
          </div>

          <div className="bg-[#FCFAF6] border border-[#D6CCBC] p-5 rounded-2xl text-left text-xs text-[#8C7B6E] leading-relaxed space-y-1.5">
            <p className="font-bold text-[#C0392B]">💡 왜 소셜 로그인이 필요한가요?</p>
            <p>익명 방식은 방 초대 수락 도중 창을 닫아버리거나, 브라우저가 다르면 등록된 사주 캐릭터의 주인을 식별할 수 없는 치명적인 단점이 있습니다. 안전한 구글 로그인을 사용하세요!</p>
          </div>

          {error && (
            <div className="text-xs text-[#C0392B] bg-[#FDEDEC] p-3 rounded-xl border border-[#FADBD8] font-bold">
              ⚠️ {error}
            </div>
          )}

          <button
            type="button"
            onClick={async () => {
              try {
                setError("");
                setLoading(true);
                await signInWithGoogle();
              } catch (err: any) {
                setError(err.message || "구글 로그인 실패: 브라우저 팝업 차단 설정을 확인해 주세요.");
              } finally {
                setLoading(false);
              }
            }}
            className="w-full py-4 bg-[#2C3E50] text-[#FAF7F2] font-serif font-bold text-sm rounded-xl hover:bg-[#1A252F] active:scale-[0.99] transition-all tracking-wider shadow-md flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Google 계정으로 안전하게 참례하기</span>
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${roomTitle || "인연방"} 참여하기`} showHomeButton>
      {loading && <LoadingOverlay message="내 오행을 명부에 기록하는 중..." />}

      <div className="space-y-4 py-2">
        <div className="text-center">
          <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
            Google 인증 완료: {currentUser?.displayName}님
          </span>
          <h3 className="font-serif text-lg font-bold text-[#2C3E50] tracking-tight mt-2">
            인연방 사주 등록
          </h3>
          <p className="text-[11px] text-[#8C7B6E] leading-normal tracking-tight mt-1">
            태어난 일시의 한글 음양오행을 확인하여 다른 모임 동료들과의 <br />
            유쾌한 궁합 케미스트리를 엮을 준비를 완비해 볼까요?
          </p>
        </div>

        {error && (
          <div className="text-xs text-[#C0392B] bg-[#FDEDEC] p-3 rounded border border-[#FADBD8] font-medium text-center">
            ⚠️ {error}
          </div>
        )}

        <SajuForm onSubmit={handleJoinSubmit} submitButtonText="인연방 명부에 올리기" initialNickname={currentUser?.displayName || ""} />
      </div>
    </Layout>
  );
}
