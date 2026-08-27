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
      <Layout title="모임방">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-seal border-t-transparent animate-spin mb-3" />
          <p className="text-xs text-ink-soft">모임방 정보를 불러오는 중...</p>
        </div>
      </Layout>
    );
  }

  if (error || !room) {
    return (
      <Layout title="모임방" showHomeButton>
        <div className="text-center py-12 space-y-4">
          <p className="text-sm font-medium text-ink">{error || "방을 불러올 수 없습니다."}</p>
          <a
            href="#/"
            className="inline-block px-5 py-2.5 bg-sunken hover:bg-line text-ink rounded-xl text-sm font-semibold transition-colors"
          >
            처음으로 돌아가기
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={room.title} showHomeButton>
      <div className="space-y-6 py-2">
        
        {!hasJoined && (
          <div className="bg-surface border border-line rounded-xl p-5 text-center space-y-3 animate-fade-in">
            <p className="font-semibold text-sm text-ink">아직 이 모임방에 등록되지 않았습니다</p>
            <p className="text-sm text-ink-soft leading-relaxed max-w-sm mx-auto">
              생년월일시를 등록하면 멤버들과의 1:1 궁합과 모임 오행 조화를 볼 수 있습니다.
            </p>
            <a
              href={`#/room/${code}/join`}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-seal hover:bg-seal-deep text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              내 사주 등록하기
            </a>
          </div>
        )}

        {/* =========================================================================
            FRONT GROUP SOUL CARD: 규격 380px, #FFFFFF, radius 28px, Pretendard
           ========================================================================= */}
        {groupMetrics && (
          <div className="w-full bg-surface rounded-xl p-6 sm:p-7 border border-line text-left animate-fade-in">
            {/* 1. 상단 표기 */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono tracking-[0.14em] text-ink-faint">
                GROUP · {groupMetrics.memberCount}인
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-xs font-medium text-ink-soft hover:text-ink bg-sunken hover:bg-line px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {copiedLink ? "링크 복사됨" : "초대하기"}
              </button>
            </div>

            {/* 2. 엠블럼 */}
            <div className="w-[96px] h-[96px] mx-auto mb-4 rounded-full bg-sunken flex items-center justify-center">
              <svg viewBox="0 0 48 48" fill="none" stroke="#B3382C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[56px] h-[56px]">
                <circle cx="24" cy="24" r="16" />
                <circle cx="24" cy="14" r="6" />
                <circle cx="15" cy="29" r="6" />
                <circle cx="33" cy="29" r="6" />
                <line x1="24" y1="14" x2="15" y2="29" opacity="0.4" />
                <line x1="24" y1="14" x2="33" y2="29" opacity="0.4" />
                <line x1="15" y1="29" x2="33" y2="29" opacity="0.4" />
              </svg>
            </div>

            {/* 3. 모임 케미 점수 */}
            <h3 className="text-center font-serif text-2xl font-semibold tracking-tight leading-snug text-ink mb-2">
              모임 케미 <span className="text-seal">{groupMetrics.score}점</span>
            </h3>

            {/* 4. 한 줄 정의 */}
            <p className="text-center text-sm leading-relaxed text-ink-soft max-w-[290px] mx-auto mb-5">
              {groupMetrics.uniqueElements}가지 오행이 서로를 살리며 균형을 이룹니다.
            </p>

            {/* 5. 계산 지표 (다양성·순환) */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2.5 w-full">
                <span className="text-xs font-medium text-ink w-[48px] shrink-0 text-left">다양성</span>
                <div className="h-[7px] bg-sunken rounded-full overflow-hidden flex-1">
                  <div className="h-full rounded-full bg-ink/70" style={{ width: `${Math.min(98, groupMetrics.uniqueElements * 22)}%` }} />
                </div>
                <span className="text-xs font-mono text-right text-ink-faint w-[30px] shrink-0">{Math.min(98, groupMetrics.uniqueElements * 22)}</span>
              </div>
              <div className="flex items-center gap-2.5 w-full">
                <span className="text-xs font-medium text-ink w-[48px] shrink-0 text-left">순환력</span>
                <div className="h-[7px] bg-sunken rounded-full overflow-hidden flex-1">
                  <div className="h-full rounded-full bg-ink/70" style={{ width: `${groupMetrics.score}%` }} />
                </div>
                <span className="text-xs font-mono text-right text-ink-faint w-[30px] shrink-0">{groupMetrics.score}</span>
              </div>
            </div>

            {/* 6. Action CTA Footer */}
            <div className="pt-4 border-t border-line flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setViralCardTab("group");
                  setIsViralModalOpen(true);
                }}
                className="px-3.5 py-2.5 bg-sunken hover:bg-line text-ink rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                카드 만들기
              </button>

              <a
                href={members.length >= 2 ? `#/room/${code}/group` : undefined}
                onClick={(e) => {
                  if (members.length < 2) {
                    e.preventDefault();
                    alert("모임 전체 분석은 2명 이상 참여하면 볼 수 있습니다.");
                  }
                }}
                className={`flex-1 py-2.5 px-3 text-center rounded-xl text-xs font-semibold transition-colors ${
                  members.length >= 2
                    ? "bg-seal hover:bg-seal-deep text-white cursor-pointer"
                    : "bg-sunken text-ink-faint cursor-not-allowed"
                }`}
              >
                모임 전체 분석 보기
              </a>
            </div>
          </div>
        )}

        {/* SECTION 1: 1-on-1 Individual Chemistry Explorer */}
        <div className="space-y-3 pt-1">
          <div className="text-left">
            <h2 className="font-serif text-lg font-semibold text-ink">
              멤버별 궁합 <span className="text-sm text-ink-faint font-sans font-normal">{members.length}명</span>
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              멤버를 누르면 나와의 1:1 궁합이 열립니다.
            </p>
          </div>

          <div id="members-grid" className="grid grid-cols-2 gap-3">
            {!hasJoined && (
              <a
                href={`#/room/${code}/join`}
                className="p-4 border border-dashed border-ink-faint hover:border-ink rounded-xl flex flex-col items-center justify-center text-center transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-sunken flex items-center justify-center text-xl text-ink-soft mb-2">
                  +
                </div>
                <span className="text-sm font-semibold text-ink">나도 참여하기</span>
                <span className="text-xs text-ink-faint mt-1 leading-tight">
                  내 사주를 등록하고 궁합 보기
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
                    className="p-4 bg-surface border border-line hover:border-ink-faint rounded-xl flex flex-col items-center justify-center text-center transition-colors group relative"
                  >
                    <div className="w-12 h-12 rounded-full bg-sunken flex items-center justify-center text-2xl relative mb-2">
                      {member.character_emoji}
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-seal text-white text-xs flex items-center justify-center rounded-full font-sans font-semibold">
                        나
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-ink truncate max-w-full">
                      {member.nickname}
                    </span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-lg mt-1.5"
                      style={{
                        backgroundColor: `${member.character_color}14`,
                        color: member.character_color,
                      }}
                    >
                      {member.saju.daymaster.gan} {member.character_animal} {member.mbti ? ` · ${member.mbti.toUpperCase()}` : ""}
                    </span>
                    <span className="text-xs text-seal mt-2 font-medium">
                      내 소울 카드 보기
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
                  className="p-4 bg-surface border border-line hover:border-ink-faint rounded-xl flex flex-col items-center justify-center text-center transition-colors group relative cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-sunken flex items-center justify-center text-2xl relative mb-2">
                    {member.character_emoji}
                  </div>
                  <span className="text-sm font-semibold text-ink truncate max-w-full">
                    {member.nickname}
                  </span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-lg mt-1.5"
                    style={{
                      backgroundColor: `${member.character_color}14`,
                      color: member.character_color,
                    }}
                  >
                    {member.saju.daymaster.gan} {member.character_animal} {member.mbti ? ` · ${member.mbti.toUpperCase()}` : ""}
                  </span>
                  <span className="text-xs text-ink-faint group-hover:text-ink mt-2 font-medium transition-colors">
                    나와의 궁합 보기
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: Progressive Disclosure for Macro Group Details */}
        <div className="bg-surface border border-line rounded-xl p-5 text-left space-y-4">
          <button
            type="button"
            onClick={() => setShowDetailAccordion(!showDetailAccordion)}
            className="w-full flex items-center justify-between text-left cursor-pointer group select-none"
          >
            <h4 className="font-serif text-lg font-semibold text-ink">
              모임 오행 조화
            </h4>
            <span className="text-xs font-medium text-ink-soft bg-sunken hover:bg-line px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0">
              <span>{showDetailAccordion ? "접기" : "자세히"}</span>
              {showDetailAccordion ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {/* 1단계: 기본 무료 공개 (오행 분포 현황) */}
          {groupMetrics && (
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {[
                { key: "목", label: "목 木", color: "var(--color-wood)" },
                { key: "화", label: "화 火", color: "var(--color-fire)" },
                { key: "토", label: "토 土", color: "var(--color-earth)" },
                { key: "금", label: "금 金", color: "var(--color-metal)" },
                { key: "수", label: "수 水", color: "var(--color-water)" }
              ].map((item) => {
                const count = groupMetrics.counts[item.key] || 0;
                return (
                  <div key={item.key} className="p-2.5 bg-sunken rounded-xl">
                    <span className="text-xs font-medium block" style={{ color: item.color }}>{item.label}</span>
                    <span className="text-sm font-semibold text-ink font-mono">{count}명</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2단계: 자세히 보기 토글 시 심층 영역 */}
          {showDetailAccordion && (
            <div className="pt-3 border-t border-line space-y-4 animate-fade-in">
              <p className="p-4 bg-sunken rounded-xl text-xs leading-relaxed text-ink-soft">
                오행이 고루 있을수록 의사결정의 사각지대가 줄어듭니다. 모임 전체 그래프와 전원 1:1 궁합 풀이는
                모임 전체 분석에서 볼 수 있습니다.
              </p>

              {/* 3단계: 유료/쿠폰 해금 안내 */}
              <div className="p-4 bg-sunken rounded-xl space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">
                    멤버 간 1:1 속궁합 풀이
                  </span>
                  <span className="text-xs text-ink-faint shrink-0">
                    {isGroupUnlocked ? "열람 가능" : "쿠폰·이용권"}
                  </span>
                </div>
                <p className="text-xs text-ink-soft leading-relaxed">
                  구성원 간 상성 등급(S~F)과 사주·자미두수·MBTI·별자리 네 영역의 1:1 궁합 해설을 볼 수 있습니다.
                </p>
                <div className="flex gap-2 pt-1">
                  <a
                    href={`#/room/${code}/group`}
                    className="flex-1 py-2.5 bg-seal hover:bg-seal-deep text-white rounded-xl text-xs font-semibold text-center transition-colors cursor-pointer"
                  >
                    모임 전체 분석 보기
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setShopTab("group");
                      setIsShopOpen(true);
                    }}
                    className="px-3.5 py-2.5 bg-surface hover:bg-line text-ink rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    쿠폰 · 상점
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Room Invite Controls */}
        <div className="bg-surface border border-line p-4 rounded-xl space-y-3 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-ink">초대 코드 <span className="font-mono text-seal">{code}</span></span>
            <span className="text-ink-faint">30일 후 자동 만료</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="copy-code-btn"
              onClick={handleCopyCode}
              className="py-2.5 px-3 bg-sunken hover:bg-line rounded-xl text-xs font-semibold text-ink flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-ink-faint" />
              <span>{copiedCode ? "복사 완료" : "코드 복사"}</span>
            </button>
            <button
              id="copy-link-btn"
              onClick={handleCopyLink}
              className="py-2.5 px-3 bg-sunken hover:bg-line rounded-xl text-xs font-semibold text-ink flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-ink-faint" />
              <span>{copiedLink ? "링크 복사됨" : "초대 링크 복사"}</span>
            </button>
          </div>
        </div>
      </div>

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

