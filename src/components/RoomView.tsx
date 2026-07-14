import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { db, auth, saveRoomToHistory } from "../lib/firebase";
import { doc, getDoc, collection, onSnapshot, deleteDoc } from "firebase/firestore";
import { Member, Room } from "../types";
import { Copy, Share2, Users, Calendar, HelpCircle } from "lucide-react";

interface RoomViewProps {
  code: string;
}

export default function RoomView({ code }: RoomViewProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [localMemberId, setLocalMemberId] = useState<string>(() => localStorage.getItem(`saju_member_id_${code}`) || "");

  useEffect(() => {
    setLoading(true);
    setError("");

    // 1. Fetch Room Info
    const roomRef = doc(db, "rooms", code);
    getDoc(roomRef)
      .then((roomSnap) => {
        if (!roomSnap.exists()) {
          setError("존재하지 않거나 만료된 모임방 코드입니다.");
          setLoading(false);
          return;
        }
        const roomData = roomSnap.data();
        if (roomData && roomData.expire_at) {
          const expireDate = new Date(roomData.expire_at);
          if (expireDate < new Date()) {
            setError("만료된 모임입니다 (생성 후 30일 경과).");
            setLoading(false);
            return;
          }
        }
        setRoom({ code, ...roomData } as Room);

        // Keep local history fresh for ease of re-entry
        if (roomData) {
          const isOwner = auth.currentUser && auth.currentUser.uid === roomData.owner_uid;
          saveRoomToHistory(code, isOwner ? "owner" : "member", roomData.title || "인연 사주방");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("방 정보를 불러오는 도중 오류가 발생했습니다.");
        setLoading(false);
      });

    // 2. Listen to members dynamically in real-time
    const membersCol = collection(db, "rooms", code, "members");
    const unsubscribe = onSnapshot(membersCol, (snapshot) => {
      const activeMembers: Member[] = [];
      snapshot.forEach((docSnap) => {
        activeMembers.push({ id: docSnap.id, ...docSnap.data() } as Member);
      });
      // Sort members (Host or earlier joins first)
      activeMembers.sort((a, b) => b.joined_at?.localeCompare(a.joined_at));
      setMembers(activeMembers);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError("참여자 명단을 실시간 수신하는 도중 오류가 발생했습니다.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [code]);

  // Automatic session recovery & database self-healing deduplication
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user && !user.isAnonymous && members.length > 0) {
        // Find all members belonging to this logged in user
        const myMembers = members.filter((m) => m.user_uid === user.uid);
        if (myMembers.length > 0) {
          // Sort by joined_at descending (newest first)
          myMembers.sort((a, b) => {
            const timeA = a.joined_at ? new Date(a.joined_at).getTime() : 0;
            const timeB = b.joined_at ? new Date(b.joined_at).getTime() : 0;
            return timeB - timeA;
          });

          const newestMember = myMembers[0];

          // If there are duplicate members with the same Google UID, heal the DB by deleting older ones!
          if (myMembers.length > 1) {
            console.log("Self-healing: Found duplicate member entries in this room. Cleaning older ones...", myMembers.slice(1));
            myMembers.slice(1).forEach((oldMember) => {
              const oldDocRef = doc(db, "rooms", code, "members", oldMember.id);
              deleteDoc(oldDocRef).catch((err) => {
                console.error("Failed to delete duplicate member:", err);
              });
            });
          }

          // Heal local state representation so they are recognized as "Me (나)"
          if (newestMember.id !== localMemberId) {
            localStorage.setItem(`saju_member_id_${code}`, newestMember.id);
            setLocalMemberId(newestMember.id);
          }
        }
      }
    });
    return () => unsubscribeAuth();
  }, [members, code, localMemberId]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}${window.location.pathname}#/room/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <Layout title="인연 로딩 중">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin text-3xl text-[#C0392B] font-serif">☯</div>
          <p className="text-xs text-[#8C7B6E] mt-3">인연방 사주 대장을 소환하는 중...</p>
        </div>
      </Layout>
    );
  }

  if (error || !room) {
    return (
      <Layout title="오류 알림" showHomeButton>
        <div className="text-center py-12 space-y-4">
          <div className="text-3xl">⚠️</div>
          <p className="text-sm font-semibold text-[#C0392B]">{error || "방을 불러올 수 없습니다."}</p>
          <a
            href="#/"
            className="inline-block px-5 py-2.5 bg-[#2C3E50] text-[#FAF7F2] rounded text-xs font-serif font-bold tracking-tight shadow-sm hover:opacity-90"
          >
            대기실로 돌아가기
          </a>
        </div>
      </Layout>
    );
  }

  const hasJoined = members.some((m) => m.id === localMemberId);

  return (
    <Layout title={room.title} showHomeButton>
      <div className="space-y-6 py-2">
        
        {/* Card: Room Meta & Invite Link */}
        <div className="bg-white/60 backdrop-blur-xs border border-[#D6CCBC] p-5 rounded-2xl space-y-4 shadow-xs text-left">
          <div className="flex items-center justify-between border-b border-[#E8E0D0] pb-3">
            <div>
              <span className="text-[9px] bg-[#E8E0D0] text-[#5A4D41] px-2 py-0.5 rounded font-bold font-sans uppercase tracking-wider">코드대장</span>
              <h3 className="font-serif text-lg font-bold text-[#2C3E50] tracking-tight mt-1.5">
                {room.title}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#8C7B6E] flex items-center justify-end font-bold">
                <Users className="w-3 h-3 mr-1" />
                {members.length}명 참여 중
              </span>
              <span className="text-[9px] text-[#A69B8F] flex items-center justify-end font-medium mt-1">
                <Calendar className="w-2.5 h-2.5 mr-0.5" />
                30일 후 자동 삭제
              </span>
            </div>
          </div>

          {/* Invitation Copy Controls */}
          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <button
              id="copy-code-btn"
              onClick={handleCopyCode}
              className="flex items-center justify-center space-x-1.5 py-3 px-3 bg-white border border-[#E8E0D0] hover:bg-[#F9F6EE] hover:border-[#D6CCBC] active:scale-[0.98] transition-all rounded-xl text-xs font-bold text-[#2C3E50] cursor-pointer"
            >
              <span className="font-mono font-bold text-[#C0392B] tracking-widest">{code}</span>
              <Copy className="w-3.5 h-3.5 text-[#8C7B6E]" />
              <span className="text-[10px]">{copiedCode ? "복사완료" : "코드복사"}</span>
            </button>

            <button
              id="copy-link-btn"
              onClick={handleCopyLink}
              className="flex items-center justify-center space-x-1.5 py-3 px-3 bg-[#FAF7F2] border border-[#C0392B] hover:bg-[#C0392B] hover:text-white active:scale-[0.98] transition-all rounded-xl text-xs font-serif font-bold text-[#C0392B] cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? "링크 복사됨!" : "초대링크 복사"}</span>
            </button>
          </div>
        </div>

        {/* Member Directory Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C7B6E] font-serif uppercase tracking-[0.15em]">이 자리에 앉은 인연 ({members.length}명)</span>
            {hasJoined && (
              <span className="text-[10px] text-[#C0392B] bg-[#FDEDEC] px-2 py-0.5 rounded-lg border border-[#FADBD8] font-bold font-sans">
                나도 참가 완료 👤
              </span>
            )}
          </div>

          <div id="members-grid" className="grid grid-cols-2 gap-3">
            {members.map((member) => {
              const isMe = member.id === localMemberId;
              return (
                <a
                  key={member.id}
                  href={`#/room/${code}/me/${member.id}`}
                  className={`p-4 bg-white/70 border rounded-2xl shadow-xs flex flex-col items-center justify-center text-center transition-all duration-200 group relative hover:border-[#C0392B]/40 hover:bg-white hover:shadow-sm ${
                    isMe ? "border-[#C0392B] ring-1 ring-[#C0392B]/10" : "border-[#E8E0D0]"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E8E0D0] flex items-center justify-center text-2xl relative mb-2 group-hover:scale-105 transition-transform duration-200">
                    {member.character_emoji}
                    {isMe && (
                      <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-[#C0392B] text-white text-[8px] flex items-center justify-center rounded-full font-sans font-bold shadow-sm">
                        나
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-[#2C3E50] truncate max-w-full">
                    {member.nickname}
                  </span>
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded-lg mt-1.5 border"
                    style={{
                      backgroundColor: `${member.character_color}15`,
                      borderColor: `${member.character_color}40`,
                      color: member.character_color,
                    }}
                  >
                    {member.saju.daymaster.gan} {member.character_animal} {member.mbti ? ` · ${member.mbti.toUpperCase()}` : ""}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Info Banner about Soul Character */}
        <div className="bg-[#FAF7F2]/80 border border-[#E8E0D0] rounded-2xl p-4 text-left text-xs leading-relaxed space-y-1">
          <p className="font-bold font-serif text-[#C0392B] flex items-center gap-1.5">
            💡 소울 캐릭터의 비밀을 알고 계시나요?
          </p>
          <p className="text-[#8C7B6E] text-[11px]">
            여기에 표시되는 <strong>'소울 캐릭터'</strong>는 여러분이 평소에 알고 있던 <strong>태어난 연도별 띠가 아닙니다.</strong> 전통 사주명리학에서 내 성품의 진짜 본질을 가장 명확히 드러내는 <strong>'태어난 날의 기운(일주 - 천간의 색상 + 지지의 동물)'</strong>을 조합해 만든 고유한 심벌입니다.
          </p>
          <p className="text-[#A69B8F] text-[10px] pt-1 border-t border-[#E8E0D0]/60">
            예를 들어 1993년생 닭띠여도, 태어난 날이 신해(辛亥)일에 해당하면 돼지날의 수렴하는 기운과 은색의 보석 기운을 담은 <strong>은색 돼지 🐷</strong> 캐릭터가 부여됩니다. 각자의 캐릭터를 눌러 고유한 사주 명식과 성향 분석을 확인해 보세요!
          </p>
        </div>

        {/* Action button bar */}
        <div className="space-y-4.5 pt-4">
          {/* Guest Join Button */}
          {!hasJoined && (
            <a
              id="join-room-btn"
              href={`#/room/${code}/join`}
              className="block w-full py-3.5 bg-white border border-[#C0392B] hover:bg-[#C0392B] hover:text-white text-[#C0392B] rounded-xl font-serif font-bold text-sm text-center shadow-sm tracking-widest active:scale-[0.99] transition-all duration-200 cursor-pointer"
            >
              나도 사주 입력하고 궁합 참여하기
            </a>
          )}

          {/* Calculate Group Compatibility Chemistry Button */}
          <a
            id="calculate-group-btn"
            href={members.length >= 2 ? `#/room/${code}/group` : undefined}
            className={`block w-full py-4 text-center font-serif font-bold text-sm rounded-xl shadow-lg transition-all duration-200 tracking-widest ${
              members.length >= 2
                ? "bg-[#C0392B] text-white hover:bg-[#A93226] active:scale-[0.98] shadow-[#C0392B]/20 cursor-pointer"
                : "bg-[#E8E0D0] text-[#A69B8F] shadow-[#E8E0D0]/10 cursor-not-allowed"
            }`}
            onClick={(e) => {
              if (members.length < 2) {
                e.preventDefault();
                alert("궁합을 파악하기 위해선 최소 2명 이상 참여해야 합니다.");
              }
            }}
          >
            {members.length >= 2
              ? "우리 모임 궁합 보기"
              : "2명 이상 모이면 궁합 보기 열림"}
          </a>
        </div>
      </div>
    </Layout>
  );
}
