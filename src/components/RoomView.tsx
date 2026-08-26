import React, { useState, useEffect, useMemo } from "react";
import Layout from "./Layout";
import { db, auth, saveRoomToHistory, saveUserPersonalProfile, checkProductUnlock, getUserPersonalProfile } from "../lib/firebase";
import { doc, getDoc, setDoc, collection, onSnapshot, deleteDoc } from "firebase/firestore";
import { Member, Room } from "../types";
import { shareToKakaoOrClipboard } from "../utils/shareHelper";
import { Copy, Share2, Users, Calendar, Crown, Heart, Sparkles, ChevronDown, ChevronUp, Lock, Lightbulb, Ticket } from "lucide-react";
import PremiumPaywall from "./PremiumPaywall";
import PairChemistryModal from "./PairChemistryModal";
import ViralCardModal from "./ViralCardModal";
import GoogleAds from "./GoogleAds";

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
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [shopTab, setShopTab] = useState<"secret" | "pdf" | "group">("group");
  const [selectedTargetMember, setSelectedTargetMember] = useState<Member | null>(null);
  const [isChemistryModalOpen, setIsChemistryModalOpen] = useState(false);
  const [isViralModalOpen, setIsViralModalOpen] = useState(false);
  const [viralCardTab, setViralCardTab] = useState<"identity" | "fortune" | "group" | "role">("group");
  const [showDetailAccordion, setShowDetailAccordion] = useState(false);
  const [isGroupUnlocked, setIsGroupUnlocked] = useState(false);

  const [localMemberId, setLocalMemberId] = useState<string>(() => localStorage.getItem(`saju_member_id_${code}`) || "");

  useEffect(() => {
    checkProductUnlock("group", code).then(setIsGroupUnlocked).catch(() => {});
  }, [code, isShopOpen]);

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

  // Group summary metrics
  const groupMetrics = useMemo(() => {
    if (members.length === 0) return null;
    const elements = members.map((m) => m.saju?.daymaster?.element).filter(Boolean) as string[];
    const uniqueElements = new Set(elements).size;
    const memberCount = members.length;
    const baseScore = 78;
    const diversityBonus = Math.min(uniqueElements * 4, 16);
    const sizeBonus = Math.min(memberCount * 2, 6);
    const score = Math.min(99, baseScore + diversityBonus + sizeBonus);

    const counts: Record<string, number> = { "목": 0, "화": 0, "토": 0, "금": 0, "수": 0 };
    elements.forEach(e => {
      if (counts[e] !== undefined) counts[e]++;
    });

    return {
      score,
      memberCount,
      uniqueElements,
      counts
    };
  }, [members]);

  // Automatic session recovery & database self-healing deduplication
  // Automatic session recovery, central-profile-based auto-join, and auto-sync
  useEffect(() => {
    const syncProfileAndRoom = async () => {
      const user = auth.currentUser;
      if (!user || user.isAnonymous || members.length === 0) return;

      try {
        const centralProfile = await getUserPersonalProfile();
        const myMembers = members.filter((m) => m.user_uid === user.uid);

        if (centralProfile) {
          if (myMembers.length === 0) {
            // Case A: User has a central profile but is NOT registered in this room yet -> AUTO-JOIN!
            console.log("Auto-joining room with existing central profile:", centralProfile.nickname);
            const guestMemberId = "member_" + Math.random().toString(36).substring(2, 11);
            const nowStr = new Date().toISOString();

            const payload = {
              nickname: centralProfile.nickname,
              gender: centralProfile.gender,
              birth_date: centralProfile.birth_date,
              birth_time: centralProfile.birth_time,
              saju: centralProfile.saju,
              character_emoji: centralProfile.character_emoji,
              character_animal: centralProfile.character_animal,
              character_color: centralProfile.character_color,
              mbti: centralProfile.mbti || null,
              joined_at: nowStr,
              user_uid: user.uid,
            };

            await setDoc(doc(db, "rooms", code, "members", guestMemberId), payload);

            // Invalidate room analysis cache so it recalculates with the new member
            const cacheRef = doc(db, "rooms", code, "analysis", "result");
            await deleteDoc(cacheRef).catch(() => {});

            localStorage.setItem(`saju_member_id_${code}`, guestMemberId);
            setLocalMemberId(guestMemberId);
          } else {
            // Case B: Already in the room -> AUTO-SYNC room details if they differ from central profile
            // Clean up any duplicates in the room first (Self-healing deduplication)
            const nicknameGroups: Record<string, Member[]> = {};
            myMembers.forEach((m) => {
              const nick = (m.nickname || "").trim();
              if (!nicknameGroups[nick]) {
                nicknameGroups[nick] = [];
              }
              nicknameGroups[nick].push(m);
            });

            Object.values(nicknameGroups).forEach((group) => {
              if (group.length > 1) {
                group.sort((a, b) => {
                  const timeA = a.joined_at ? new Date(a.joined_at).getTime() : 0;
                  const timeB = b.joined_at ? new Date(b.joined_at).getTime() : 0;
                  return timeB - timeA;
                });

                console.log("Self-healing: Cleaning older duplicate member entries for:", group[0].nickname);
                group.slice(1).forEach((oldMember) => {
                  const oldDocRef = doc(db, "rooms", code, "members", oldMember.id);
                  deleteDoc(oldDocRef).catch((err) => {
                    console.error("Failed to delete duplicate member:", err);
                  });
                });
              }
            });

            // Get the newest/active member doc
            const sorted = [...myMembers].sort((a, b) => {
              const timeA = a.joined_at ? new Date(a.joined_at).getTime() : 0;
              const timeB = b.joined_at ? new Date(b.joined_at).getTime() : 0;
              return timeB - timeA;
            });
            const activeMemberDoc = sorted[0];

            if (activeMemberDoc && activeMemberDoc.id !== localMemberId) {
              localStorage.setItem(`saju_member_id_${code}`, activeMemberDoc.id);
              setLocalMemberId(activeMemberDoc.id);
            }
          }
        } else {
          // Case C: User has NO central profile, but is registered in this room
          const sorted = [...myMembers].sort((a, b) => {
            const timeA = a.joined_at ? new Date(a.joined_at).getTime() : 0;
            const timeB = b.joined_at ? new Date(b.joined_at).getTime() : 0;
            return timeB - timeA;
          });
          const activeMemberDoc = sorted[0];

          if (activeMemberDoc && activeMemberDoc.id !== localMemberId) {
            localStorage.setItem(`saju_member_id_${code}`, activeMemberDoc.id);
            setLocalMemberId(activeMemberDoc.id);
          }
        }
      } catch (err) {
        console.error("Error running profile and room sync:", err);
      }
    };

    syncProfileAndRoom();
  }, [members, code, localMemberId]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}${window.location.pathname}#/room/${code}`;
    await shareToKakaoOrClipboard({
      title: `[인연사주] '${room?.title || "모임방"}'에 초대합니다!`,
      description: `생년월일만 넣으면 우리 모임의 1:1 케미와 오행 조화가 즉시 분석됩니다. 초대 코드: ${code}`,
      url: link,
    });
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const hasJoined = members.some((m) => m.id === localMemberId);
  const myMemberInfo = members.find((m) => m.id === localMemberId);

  if (loading) {
    return (
      <Layout title="인연 로딩 중">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin text-3xl text-[#C0392B] font-serif">☯</div>
          <p className="text-xs text-[#5C5046] mt-3">인연방 사주 대장을 소환하는 중...</p>
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

  return (
    <Layout title={room.title} showHomeButton>
      <div className="space-y-6 py-2">
        
        {!hasJoined && (
          <div className="bg-amber-50/90 border border-amber-200 rounded-[24px] p-5 text-center space-y-3 shadow-2xs animate-fade-in">
            <div className="flex items-center justify-center gap-1.5 text-amber-900 font-bold font-serif text-sm">
              <Users className="w-4 h-4 text-amber-700 animate-pulse" />
              <span>아직 이 모임방에 등록되지 않았습니다</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed max-w-sm mx-auto">
              현재 <strong className="text-amber-950">{auth.currentUser?.displayName || "회원"}님</strong> 계정으로 로그인되어 있으나, 이 방에는 사주 정보가 아직 입력되지 않았습니다. 생년월일시를 등록하시면 즉시 모임 멤버들과의 1:1 비밀 케미와 오행 조화를 분석하실 수 있습니다!
            </p>
            <a
              href={`#/room/${code}/join`}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#C0392B] hover:bg-[#A93226] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            >
              <span>내 사주 등록하고 모임 참여하기 ➔</span>
            </a>
          </div>
        )}

        {/* =========================================================================
            FRONT GROUP SOUL CARD: 규격 380px, #FFFFFF, radius 28px, Pretendard
           ========================================================================= */}
        {groupMetrics && (
          <div
            className="w-full bg-[#FFFFFF] rounded-[28px] p-6 sm:p-7 shadow-[0_15px_40px_-15px_rgba(192,57,43,0.12)] border border-[#EFE9DF] text-left animate-fade-in"
            style={{ fontFamily: '"Pretendard", system-ui, sans-serif' }}
          >
            {/* 1. 상단 시리얼 & 상생 배지 */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono tracking-[0.14em] text-[#5C5046]">
                GROUP · {groupMetrics.memberCount}인 결속
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold tracking-[0.08em] text-[#C0392B] bg-[#FDEDEC] px-2.5 py-1 rounded-full">
                  相生 SYNERGY
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-[11px] font-bold text-[#5C5046] hover:text-[#C0392B] bg-[#FAF7F2] px-2.5 py-1 rounded-full border border-[#E8E0D0] cursor-pointer"
                >
                  {copiedLink ? "링크 복사됨!" : "초대"}
                </button>
              </div>
            </div>

            {/* 2. 엠블럼: 지름 96px 원, 배경 #FDEDEC, 상생 기하 라인 SVG */}
            <div className="w-[96px] h-[96px] mx-auto mb-3.5 rounded-full bg-[#FDEDEC] flex items-center justify-center border border-[#F5D5D3]/60">
              <svg viewBox="0 0 48 48" fill="none" stroke="#C0392B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[56px] h-[56px]">
                <circle cx="24" cy="24" r="16" />
                <circle cx="24" cy="14" r="6" />
                <circle cx="15" cy="29" r="6" />
                <circle cx="33" cy="29" r="6" />
                <line x1="24" y1="14" x2="15" y2="29" opacity="0.4" />
                <line x1="24" y1="14" x2="33" y2="29" opacity="0.4" />
                <line x1="15" y1="29" x2="33" y2="29" opacity="0.4" />
              </svg>
            </div>

            {/* 3. 모임 케미 점수 헤드라인 */}
            <h3 className="text-center text-[22px] font-[800] tracking-[-0.02em] leading-[1.25] text-[#2C3E50] mb-2">
              모임 케미는 <span className="text-[#C0392B]">{groupMetrics.score}점</span>
            </h3>

            {/* 4. 한 줄 정의 */}
            <p className="text-center text-[13.5px] font-[500] leading-[1.5] text-[#5A4D41] max-w-[290px] mx-auto mb-4">
              "{groupMetrics.uniqueElements}대 오행이 서로를 생(生)하며 균형을 이뤄요"
            </p>

            {/* 5. 키워드 태그: 알약형 */}
            <div className="flex flex-wrap gap-1.5 justify-center mb-5">
              <span className="text-[11.5px] font-[600] text-[#C0392B] bg-[#FDEDEC] px-3 py-1 rounded-full">
                오행 상생 순환
              </span>
              <span className="text-[11.5px] font-[600] text-[#C0392B] bg-[#FDEDEC] px-3 py-1 rounded-full">
                {groupMetrics.memberCount}인 결속
              </span>
              <span className="text-[11.5px] font-[600] text-[#C0392B] bg-[#FDEDEC] px-3 py-1 rounded-full">
                시너지 증폭
              </span>
            </div>

            {/* 6. 4줄 스탯 바 */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2 w-full">
                <span className="text-[12px] font-[700] text-[#2C3E50] w-[48px] shrink-0 text-left">다양성</span>
                <div className="h-[6.5px] bg-[#F5EFE6] rounded-full overflow-hidden flex-1">
                  <div className="h-full rounded-full bg-[#35B37E]" style={{ width: `${Math.min(98, groupMetrics.uniqueElements * 22)}%` }} />
                </div>
                <span className="text-[11px] font-[700] font-mono text-right text-[#5C5046] w-[30px] shrink-0">{Math.min(98, groupMetrics.uniqueElements * 22)}</span>
              </div>
              <div className="flex items-center gap-2 w-full">
                <span className="text-[12px] font-[700] text-[#2C3E50] w-[48px] shrink-0 text-left">순환력</span>
                <div className="h-[6.5px] bg-[#F5EFE6] rounded-full overflow-hidden flex-1">
                  <div className="h-full rounded-full bg-[#C0392B]" style={{ width: `${groupMetrics.score}%` }} />
                </div>
                <span className="text-[11px] font-[700] font-mono text-right text-[#5C5046] w-[30px] shrink-0">{groupMetrics.score}</span>
              </div>
              <div className="flex items-center gap-2 w-full">
                <span className="text-[12px] font-[700] text-[#2C3E50] w-[48px] shrink-0 text-left">안정감</span>
                <div className="h-[6.5px] bg-[#F5EFE6] rounded-full overflow-hidden flex-1">
                  <div className="h-full rounded-full bg-[#E0A82E]" style={{ width: "88%" }} />
                </div>
                <span className="text-[11px] font-[700] font-mono text-right text-[#5C5046] w-[30px] shrink-0">88</span>
              </div>
              <div className="flex items-center gap-2 w-full">
                <span className="text-[12px] font-[700] text-[#2C3E50] w-[48px] shrink-0 text-left">소통력</span>
                <div className="h-[6.5px] bg-[#F5EFE6] rounded-full overflow-hidden flex-1">
                  <div className="h-full rounded-full bg-[#3B5BFF]" style={{ width: "92%" }} />
                </div>
                <span className="text-[11px] font-[700] font-mono text-right text-[#5C5046] w-[30px] shrink-0">92</span>
              </div>
            </div>

            {/* 7. Action CTA Footer */}
            <div className="pt-3.5 border-t border-[#EFE9DF] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setViralCardTab("group");
                  setIsViralModalOpen(true);
                }}
                className="px-3 py-2 bg-[#FAF7F2] hover:bg-[#F2ECE0] border border-[#E8E0D0] text-[#2C3E50] rounded-xl text-[11px] font-bold transition active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
              >
                📸 카드 만들기
              </button>

              <a
                href={members.length >= 2 ? `#/room/${code}/group` : undefined}
                onClick={(e) => {
                  if (members.length < 2) {
                    e.preventDefault();
                    alert("모임 전체 인망도를 분석하려면 최소 2명 이상 참여해야 합니다.");
                  }
                }}
                className={`flex-1 py-2 px-3 text-center rounded-xl text-[11px] font-bold transition active:scale-95 flex items-center justify-center gap-1 ${
                  members.length >= 2
                    ? "bg-[#C0392B] hover:bg-[#A93226] text-white shadow-xs cursor-pointer"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>종합 인망도 분석실 ➔</span>
              </a>
            </div>
          </div>
        )}

        {/* SECTION 1: 1-on-1 Individual Chemistry Explorer */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 text-left">
              <span className="text-xs font-bold text-[#2C3E50] font-serif uppercase tracking-wider flex items-center gap-1.5">
                <span className="text-rose-500">💖</span>
                <span>1:1 개인 인연 탐색 ({members.length}명)</span>
              </span>
              <p className="text-[11px] text-[#5C5046]">
                원하는 멤버를 눌러 <strong>나와의 1:1 오행 조화 및 궁합</strong>을 확인해 보세요.
              </p>
            </div>
            {hasJoined && (
              <span className="text-[10px] text-[#C0392B] bg-[#FDEDEC] px-2 py-0.5 rounded-lg border border-[#FADBD8] font-bold font-sans shrink-0">
                나도 참가 중 👤
              </span>
            )}
          </div>

          <div id="members-grid" className="grid grid-cols-2 gap-3">
            {!hasJoined && (
              <a
                href={`#/room/${code}/join`}
                className="p-4 bg-[#FDF2F0]/80 border-2 border-dashed border-[#C0392B]/30 hover:border-[#C0392B]/60 rounded-2xl shadow-2xs flex flex-col items-center justify-center text-center transition-all duration-200 group relative hover:bg-[#FDF2F0] cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-[#FDEDEC] flex items-center justify-center text-xl mb-2 group-hover:scale-105 transition-transform duration-200">
                  ➕
                </div>
                <span className="text-xs font-black text-[#C0392B]">
                  나도 참여하기
                </span>
                <span className="text-[9.5px] text-[#5C5046] mt-1.5 leading-tight">
                  내 사주 등록하고 멤버들과 궁합 분석하기
                </span>
              </a>
            )}
            {members.map((member) => {
              const isMe = member.id === localMemberId;
              if (isMe) {
                return (
                  <a
                    key={member.id}
                    href={`#/room/${code}/me/${member.id}`}
                    className="p-4 bg-white/95 border-2 border-[#C0392B]/40 ring-1 ring-[#C0392B]/10 rounded-2xl shadow-xs flex flex-col items-center justify-center text-center transition-all duration-200 group relative hover:bg-white hover:shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E8E0D0] flex items-center justify-center text-2xl relative mb-2 group-hover:scale-105 transition-transform duration-200">
                      {member.character_emoji}
                      <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-[#C0392B] text-white text-[8px] flex items-center justify-center rounded-full font-sans font-bold shadow-sm">
                        나
                      </span>
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
                    <span className="text-[9px] text-[#C0392B] mt-2 font-bold transition-all flex items-center gap-0.5">
                      🌟 내 소울 카드 열기
                    </span>
                  </a>
                );
              }

              return (
                <button
                  type="button"
                  key={member.id}
                  onClick={() => {
                    setSelectedTargetMember(member);
                    setIsChemistryModalOpen(true);
                  }}
                  className="p-4 bg-white/75 border border-[#E8E0D0] hover:border-rose-300 rounded-2xl shadow-xs flex flex-col items-center justify-center text-center transition-all duration-200 group relative hover:bg-white hover:shadow-sm cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E8E0D0] flex items-center justify-center text-2xl relative mb-2 group-hover:scale-105 transition-transform duration-200">
                    {member.character_emoji}
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
                  <span className="text-[9px] text-rose-600 mt-2 opacity-85 group-hover:opacity-100 font-bold transition-all flex items-center gap-0.5">
                    💖 나와의 1:1 케미
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: Progressive Disclosure for Macro Group Details */}
        <div className="bg-white/70 backdrop-blur-xs border border-[#D6CCBC] rounded-2xl p-5 text-left space-y-4 shadow-xs">
          <button
            type="button"
            onClick={() => setShowDetailAccordion(!showDetailAccordion)}
            className="w-full flex items-center justify-between border-b border-[#E8E0D0] pb-3 text-left cursor-pointer group select-none"
          >
            <div>
              <span className="text-[10px] font-bold text-[#C0392B] uppercase tracking-wider block">
                모임 종합 분석
              </span>
              <h4 className="font-serif text-sm font-bold text-[#2C3E50] mt-0.5 flex items-center gap-1.5 group-hover:text-[#C0392B] transition-colors">
                <span>🌐</span>
                <span>우리 모임의 오행 조화도 & 상세 분석</span>
              </h4>
            </div>
            <div className="text-xs font-bold text-[#C0392B] bg-[#FDEDEC] hover:bg-[#FADBD8] px-3 py-1.5 rounded-xl transition flex items-center gap-1 shrink-0">
              <span>{showDetailAccordion ? "간략히 보기" : "자세히 보기"}</span>
              {showDetailAccordion ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {/* 1단계: 기본 무료 공개 (오행 분포 현황) */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-[#5A4D41] block">
              📊 모임의 5가지 기운 분포 (무료)
            </span>
            {groupMetrics && (
              <div className="grid grid-cols-5 gap-1.5 text-center">
                {[
                  { key: "목", label: "목(木)", color: "#35B37E" },
                  { key: "화", label: "화(火)", color: "#F0632E" },
                  { key: "토", label: "토(土)", color: "#E0A82E" },
                  { key: "금", label: "금(金)", color: "#7C86A0" },
                  { key: "수", label: "수(水)", color: "#3B5BFF" }
                ].map((item) => {
                  const count = groupMetrics.counts[item.key] || 0;
                  return (
                    <div key={item.key} className="p-2 bg-[#FAF7F2]/60 rounded-xl">
                      <span className="text-[10px] font-bold block" style={{ color: item.color }}>{item.label}</span>
                      <span className="text-sm font-black text-[#2C3E50] font-mono">{count}명</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2단계: 자세히 보기 토글 시 심층 영역 */}
          {showDetailAccordion && (
            <div className="pt-3 border-t border-[#E8E0D0] space-y-4 animate-fade-in">
              <div className="p-4 bg-[#FCFAF6] border-l-3 border-[#C0392B] rounded-r-xl rounded-l-xs space-y-1.5 text-xs text-[#5A4D41] shadow-3xs">
                <p className="font-bold text-[#C0392B] flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>모임 화합 시너지 팁</span>
                </p>
                <p className="text-[11px] leading-relaxed text-[#5C5046]">
                  다양한 오행이 고루 포진할수록 의사결정 시 사각지대가 줄어들고 성과 순환이 빨라집니다. 
                  모임 전체의 인망도 그래프와 전원 1:1 비밀 케미 해독은 종합 분석실에서 즉시 확인하실 수 있습니다.
                </p>
              </div>

              {/* 3단계: 전체 심층 인망도 & 속마음 상성 유료/쿠폰 해금 안내 */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl space-y-2.5 relative shadow-3xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-700 fill-amber-300" />
                    <span className="text-xs font-black text-amber-950">
                      우리 모임 1:1 속궁합 & 내면 상성
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-amber-800 bg-white border border-amber-200 px-2 py-0.5 rounded-full">
                    {isGroupUnlocked ? "해금 완료" : "쿠폰 / 유료"}
                  </span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                  모임 구성원 간의 은밀한 내면 서열(S~F 등급), 4대 영역별(사주·자미두수·MBTI·별자리) 전수 1:1 케미 해설서를 열람하세요.
                </p>
                <div className="flex gap-2 pt-1">
                  <a
                    href={`#/room/${code}/group`}
                    className="flex-1 py-2 bg-[#C0392B] hover:bg-[#A93226] text-white rounded-lg text-[11px] font-bold text-center shadow-xs cursor-pointer"
                  >
                    종합 인망도 분석실 입장 ➔
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setShopTab("group");
                      setIsShopOpen(true);
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>쿠폰 입력 / 상점</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Room Invite Controls */}
        <div className="bg-white/60 backdrop-blur-xs border border-[#D6CCBC] p-4 rounded-2xl space-y-3 shadow-xs text-left">
          <div className="flex items-center justify-between text-xs text-[#5C5046]">
            <span className="font-bold text-[#2C3E50]">초대 코드: <span className="font-mono text-[#C0392B]">{code}</span></span>
            <span className="text-[10px]">30일 후 자동 만료</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="copy-code-btn"
              onClick={handleCopyCode}
              className="py-2.5 px-3 bg-white border border-[#E8E0D0] hover:bg-[#F9F6EE] active:scale-[0.98] rounded-xl text-xs font-bold text-[#2C3E50] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#5C5046]" />
              <span>{copiedCode ? "복사완료" : "코드 복사"}</span>
            </button>
            <button
              id="copy-link-btn"
              onClick={handleCopyLink}
              className="py-2.5 px-3 bg-[#FAF7F2] border border-[#C0392B] hover:bg-[#C0392B] hover:text-white active:scale-[0.98] rounded-xl text-xs font-serif font-bold text-[#C0392B] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? "링크 복사됨!" : "초대링크 복사"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Premium Shop Trigger */}
      <button
        type="button"
        onClick={() => {
          setShopTab("group");
          setIsShopOpen(true);
        }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 px-4 py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-serif font-extrabold text-[11px] tracking-wider rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-[0.97] transition-all cursor-pointer ring-4 ring-amber-100/50"
      >
        <Crown className="w-3.5 h-3.5 fill-amber-300 animate-pulse text-amber-200" />
        <span>인연 상점 · 쿠폰</span>
      </button>

      {/* Premium Shop Modal */}
      {isShopOpen && (
        <PremiumPaywall 
          isModal
          initialTab={shopTab}
          onClose={() => setIsShopOpen(false)}
          memberCount={members.length}
          roomCode={code}
        />
      )}

      {/* 1:1 Pair Chemistry Modal */}
      <PairChemistryModal
        isOpen={isChemistryModalOpen}
        onClose={() => setIsChemistryModalOpen(false)}
        myMember={myMemberInfo || null}
        targetMember={selectedTargetMember}
        roomCode={code}
        onOpenShop={(tab) => {
          setShopTab(tab);
          setIsShopOpen(true);
        }}
        onJoinPrompt={() => {
          window.location.hash = `#/room/${code}/join`;
        }}
      />

      {/* Viral Image Card Modal */}
      <ViralCardModal
        isOpen={isViralModalOpen}
        onClose={() => setIsViralModalOpen(false)}
        member={myMemberInfo || (members.length > 0 ? members[0] : null)}
        allMembers={members}
        roomTitle={room?.title || "우리들의 인연 모임"}
        roomCode={code}
        initialTab={viralCardTab}
      />
    </Layout>
  );
}

