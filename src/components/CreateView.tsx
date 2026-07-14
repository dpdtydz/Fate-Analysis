import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import SajuForm from "./SajuForm";
import LoadingOverlay from "./LoadingOverlay";
import { db, auth, signInWithGoogle, saveRoomToHistory } from "../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { AlertCircle } from "lucide-react";

export default function CreateView() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

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
  }) => {
    setError("");

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
        // Generate random uppercase alphanumeric
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
        joined_at: now.toISOString(),
        user_uid: ownerUid, // for security rules (본인 문서 검증)
      };
      if (sajuForm.mbti) {
        hostPayload.mbti = sajuForm.mbti;
      }
      await setDoc(doc(db, "rooms", code, "members", hostMemberId), hostPayload);

      // 6. Cache host's member membership in localStorage so they don't enter again
      localStorage.setItem(`saju_member_id_${code}`, hostMemberId);

      // 7. Save to local list of joined/administered rooms
      saveRoomToHistory(code, "owner", title.trim());

      // Redirect to main room page
      window.location.hash = `#/room/${code}`;

    } catch (err: any) {
      console.error("Room creation failed:", err);
      setError(err.message || "방을 여는 도중 오류가 발생했습니다. 네트워크 연동 상태를 확인하세요.");
      setLoading(false);
    }
  };

  const isGoogleUser = currentUser && !currentUser.isAnonymous;

  if (!isGoogleUser) {
    return (
      <Layout title="인연 사주방 개설" showHomeButton>
        {loading && <LoadingOverlay message="인간 명부를 여는 중..." />}
        <div className="space-y-6 py-4 text-center">
          <div className="w-16 h-16 mx-auto rounded-full border border-[#D6CCBC] bg-[#FCFAF5] flex items-center justify-center font-serif text-3xl text-[#C0392B] shadow-xs">
            ☯
          </div>
          
          <div className="space-y-2">
            <h3 className="font-serif text-base font-bold text-[#2C3E50] tracking-tight">
              소셜 Google 로그인 필수 안내
            </h3>
            <p className="text-xs text-[#5A4D41] leading-relaxed max-w-sm mx-auto">
              익명(Anonymous) 방식의 기기 연동 해제 및 데이터 유실 문제를 방지하기 위해 이 서비스는 <strong>Google 계정 인증</strong>을 필수로 채택하고 있습니다.
            </p>
          </div>

          <div className="bg-[#FCFAF6] border border-[#D6CCBC] p-5 rounded-2xl text-left text-xs text-[#8C7B6E] leading-relaxed space-y-1.5">
            <p className="font-bold text-[#C0392B]">💡 왜 소셜 로그인이 필요한가요?</p>
            <p>익명 로그인 방식은 브라우저 쿠키가 삭제되거나 사주 해설 도중 창을 닫으면 방장 권한을 잃어버리는 치명적 결함이 있습니다. 구글 간편 인증으로 30일 동안 언제 어디서든 방을 관리하세요!</p>
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
            <span>Google 계정으로 안전하게 계속하기</span>
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="인연 사주방 개설" showHomeButton>
      {loading && <LoadingOverlay message="기운을 열고 새 연방을 세우는 중..." />}

      <div className="space-y-5 py-2">
        <div className="text-center">
          <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
            Google 인증 완료: {currentUser?.displayName}님
          </span>
          <h3 className="font-serif text-lg font-bold text-[#2C3E50] tracking-tight mt-2 animate-fade-in">
            새로운 인연방 개설
          </h3>
          <p className="text-[11px] text-[#8C7B6E] tracking-tight mt-1">
            모임의 이름을 짓고, 방장님의 태어난 사주명식을 먼저 등록합시다.
          </p>
        </div>

        {/* Room Title */}
        <div className="space-y-1.5 bg-white/60 backdrop-blur-xs p-4 border border-[#D6CCBC] rounded-2xl shadow-xs text-left">
          <label className="block text-xs font-bold text-[#8C7B6E] tracking-[0.1em] mb-1">모임명 (인연방 이름)</label>
          <input
            id="room-title-input"
            type="text"
            maxLength={20}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 삼겹살 모임, 경영학과 동기들"
            className="w-full px-3.5 py-2.5 bg-white border border-[#E8E0D0] focus:outline-none focus:ring-2 focus:ring-[#C0392B]/20 focus:border-[#C0392B] rounded-xl text-sm placeholder:text-[#B0A69B] text-[#2C3E50] transition duration-200"
          />
        </div>

        {/* Auth / general error messaging */}
        {error && (
          <div className="text-xs text-[#C0392B] bg-[#FDEDEC] p-3 rounded-xl border border-[#FADBD8] font-bold text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Owner's saju profile block */}
        <SajuForm onSubmit={handleCreateRoom} submitButtonText="방 개설 및 나도 참여하기" initialNickname={currentUser?.displayName || ""} />
      </div>
    </Layout>
  );
}

