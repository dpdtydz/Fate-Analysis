import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import {
  auth,
  db,
  signOutUser,
  removeRoomFromHistory,
  clearAllLocalCache,
  getUserMembershipInfo,
  getUserPersonalProfile,
  PersonalSajuProfile
} from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  LogOut,
  Compass,
  ChevronRight,
  Trash2,
  RefreshCw,
  ArrowRight,
  RotateCcw
} from "lucide-react";
import PremiumPaywall from "./PremiumPaywall";
import { logAnalyticsEvent } from "../lib/analytics";
import UpgradeToSocialModal from "./UpgradeToSocialModal";
import AuthModal from "./AuthModal";

interface HistoryRoom {
  code: string;
  role: "owner" | "member" | "admin";
  title: string;
  updatedAt: number;
}

export default function LandingView() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [historyRooms, setHistoryRooms] = useState<HistoryRoom[]>([]);
  const [roomFilter, setRoomFilter] = useState<"all" | "owner" | "member">("all");
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [myProfile, setMyProfile] = useState<PersonalSajuProfile | null>(null);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [policyModal, setPolicyModal] = useState<"column1" | "column2" | "column3" | "column4" | null>(null);
  const [isRoomsExpanded, setIsRoomsExpanded] = useState(false);

  // Listen to hash / initial load for Academic Columns deep linking
  useEffect(() => {
    const checkColumnHash = () => {
      const currentHash = window.location.hash;
      const match = currentHash.match(/^#\/column\/([1-4])$/);
      if (match) {
        setPolicyModal(`column${match[1]}` as any);
      } else if (!currentHash.startsWith("#/column/")) {
        setPolicyModal(null);
      }
    };

    checkColumnHash();
    window.addEventListener("hashchange", checkColumnHash);
    return () => window.removeEventListener("hashchange", checkColumnHash);
  }, []);

  const membership = getUserMembershipInfo(currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const [pendingDeleteRoom, setPendingDeleteRoom] = useState<{
    code: string;
    title: string;
    role: string;
    actionType: "delete_db" | "exclude_list";
    roomObj: any;
    timeoutId: any;
  } | null>(null);

  const handleImmediateCommit = async (pendingObj: any) => {
    if (!pendingObj) return;
    clearTimeout(pendingObj.timeoutId);
    if (pendingObj.actionType === "delete_db") {
      try {
        const idToken = await currentUser?.getIdToken();
        if (idToken) {
          await fetch(`/api/admin/rooms/${pendingObj.code}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${idToken}`
            }
          });
        }
      } catch (err) {
        console.error("Failed immediate commit delete:", err);
      }
    } else {
      await removeRoomFromHistory(pendingObj.code);
    }
  };

  useEffect(() => {
    getUserPersonalProfile().then((p) => setMyProfile(p));
  }, [currentUser]);

  useEffect(() => {
    const loadUserRooms = async () => {
      setRoomsLoading(true);
      try {
        const mergedMap = new Map<string, HistoryRoom>();

        // 1. If user is logged in (authenticated), load their rooms from cloud Firestore
        if (currentUser && !currentUser.isAnonymous) {
          const q = query(
            collection(db, "rooms"),
            where("owner_uid", "==", currentUser.uid)
          );
          try {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((docSnap) => {
              const data = docSnap.data();
              mergedMap.set(docSnap.id, {
                code: docSnap.id,
                role: "owner",
                title: data.title || "인연 사주방",
                updatedAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
              });
            });
          } catch (e) {
            console.error("Error loading owner rooms:", e);
          }

          try {
            const joinedSnap = await getDocs(collection(db, "users", currentUser.uid, "joined_rooms"));
            joinedSnap.forEach((docSnap) => {
              if (!mergedMap.has(docSnap.id)) {
                const data = docSnap.data();
                mergedMap.set(docSnap.id, {
                  code: docSnap.id,
                  role: data.role as "member",
                  title: data.title || "인연 사주방",
                  updatedAt: data.updatedAt || Date.now(),
                });
              }
            });
          } catch (e) {
            console.error("Error loading joined rooms:", e);
          }
        } else {
          // 2. If user is logged out or has no account, do not persist or load previous rooms
          setHistoryRooms([]);
          setRoomsLoading(false);
          return;
        }

        const finalRooms = Array.from(mergedMap.values()).sort(
          (a, b) => b.updatedAt - a.updatedAt
        );
        setHistoryRooms(finalRooms);
      } catch (err) {
        console.error("Error loading user rooms list:", err);
      } finally {
        setRoomsLoading(false);
      }
    };

    loadUserRooms();
  }, [currentUser]);

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 6 || !/^[A-Z0-9]{6}$/.test(cleanCode)) {
      setError("올바른 6자리 영문/숫자 코드를 입력해 주세요.");
      return;
    }

    logAnalyticsEvent({
      eventName: "join_room",
      category: "traffic",
      metadata: { source: "landing_input" },
      roomCode: cleanCode
    });

    window.location.hash = `#/room/${cleanCode}`;
  };

  const columns = [
    {
      key: "column1" as const,
      no: 1,
      title: "십성(十星)으로 해석하는 사회적 관계와 팀워크 심리학",
      summary: "십성 체계가 조직과 모임 구성원의 행동 방식에 미치는 영향"
    },
    {
      key: "column2" as const,
      no: 2,
      title: "자미두수(紫微斗數) 명반과 대운의 인연 지형도",
      summary: "12궁 명반과 대운 주기가 궁합에 미치는 영향"
    },
    {
      key: "column3" as const,
      no: 3,
      title: "음양오행(陰陽五行) 생극제화와 스트레스 완화",
      summary: "오행의 치우침을 진단하고 부족한 기운을 보완하는 방법"
    },
    {
      key: "column4" as const,
      no: 4,
      title: "정통 만세력 알고리즘과 절기(節氣) 도출 고찰",
      summary: "절기 시각 변환 알고리즘과 자시 구분 기준"
    }
  ];

  const faqs = [
    {
      q: "태어난 시(時)를 몰라도 분석이 되나요?",
      a: "네. 연·월·일만으로도 타고난 성향과 전체 운의 큰 틀을 분석할 수 있습니다. 태어난 시각까지 입력하면 자미두수 12궁 명반과 1:1 궁합 리포트가 온전히 완성됩니다."
    },
    {
      q: "음력 생일과 윤달도 정확히 계산되나요?",
      a: "네. 한국천문연구원 만세력 데이터를 기반으로 평달·윤달을 구분하고, 24절기 입기 시각을 분 단위까지 반영해 변환합니다."
    },
    {
      q: "모임방에는 몇 명까지 참여할 수 있나요?",
      a: "인원 제한이 없습니다. 초대 코드를 공유하면 되고, 2명 이상 모이면 1:1 상성 매트릭스와 그룹 조화도가 자동으로 산출됩니다."
    },
    {
      q: "입력한 생년월일은 안전하게 관리되나요?",
      a: "입력한 명식 데이터는 암호화되어 저장되며, 방 생성 후 30일이 지나거나 방장이 방을 해체하면 구성원 전체의 기록이 복구 불가능한 형태로 삭제됩니다."
    }
  ];

  return (
    <Layout maxWidth="2xl">
      <div className="space-y-10">

        {/* 탭: 내 사주 / 모임 궁합 */}
        <div className="grid grid-cols-2 gap-1 bg-sunken p-1 rounded-xl text-sm">
          <a
            href="#/my-saju"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = "#/my-saju";
            }}
            className="py-2.5 px-3 rounded-lg text-ink-soft hover:text-ink text-center font-medium transition-colors cursor-pointer"
          >
            내 사주
          </a>
          <button
            type="button"
            className="py-2.5 px-3 rounded-lg bg-surface text-ink text-center font-semibold cursor-default"
          >
            모임 궁합
          </button>
        </div>

        {/* 헤드라인: 한 문장으로 */}
        <div className="space-y-2.5">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-ink leading-snug">
            우리 모임의 궁합,
            <br className="sm:hidden" /> 한 번에 봅니다
          </h1>
          <p className="text-sm text-ink-soft leading-relaxed max-w-lg">
            방을 만들어 초대 코드를 공유하면, 구성원 각자의 사주를 바탕으로 서로의 상성과 모임 전체의 조화를 분석합니다.
          </p>
        </div>

        {/* 주 행동: 방 만들기(주) / 코드 입장(보조) */}
        <div id="group-action-cards" className="grid grid-cols-1 sm:grid-cols-2 gap-3 scroll-mt-6">

          {/* Card 1: Create Room */}
          <div className="bg-surface border border-line rounded-xl p-5 flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="text-[15px] font-semibold text-ink">새 모임방 만들기</h2>
              <p className="text-sm text-ink-soft leading-relaxed">
                방을 만들면 6자리 초대 코드가 발급됩니다. 구성원이 각자 생년월일을 입력하면 전체 궁합이 완성됩니다.
              </p>
            </div>

            <button
              id="create-room-btn"
              onClick={() => {
                if (membership.isEmailOnly) {
                  setIsUpgradeModalOpen(true);
                } else if (membership.isGuest) {
                  setIsAuthModalOpen(true);
                } else {
                  window.location.hash = "#/create";
                }
              }}
              className="w-full py-3 px-4 bg-seal hover:bg-seal-deep text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>모임방 만들기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Join by Code */}
          <div className="bg-surface border border-line rounded-xl p-5 flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="text-[15px] font-semibold text-ink">초대 코드로 입장</h2>
              <p className="text-sm text-ink-soft leading-relaxed">
                공유받은 6자리 코드를 입력하면 바로 참여할 수 있습니다.
              </p>
            </div>

            <form id="join-code-form" onSubmit={handleJoinByCode} className="space-y-2">
              <div className="flex gap-2">
                <input
                  id="join-code-input"
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="예: AF7X29"
                  className="flex-grow min-w-0 px-4 py-3 bg-sunken rounded-xl focus:outline-none focus:ring-1 focus:ring-ink text-sm text-ink placeholder:text-ink-faint uppercase font-mono tracking-widest"
                />
                <button
                  id="join-code-submit"
                  type="submit"
                  className="px-5 py-3 bg-sunken hover:bg-line text-ink rounded-xl text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  입장하기
                </button>
              </div>
              {error && (
                <p className="text-xs text-seal font-medium">{error}</p>
              )}
            </form>
          </div>
        </div>

        {/* 나의 모임방 목록 (로그인 회원 전용) */}
        {currentUser && !currentUser.isAnonymous && (
          <div className="border-t border-line pt-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-serif text-lg font-semibold text-ink">
                나의 모임방 <span className="text-sm text-ink-faint font-sans font-normal">{historyRooms.length}개</span>
              </h3>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-ink-faint truncate max-w-[180px]">
                  {currentUser?.displayName || currentUser?.email}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await signOutUser();
                    } catch (err) {
                      console.error("Sign-out error:", err);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-ink-soft hover:text-ink px-2 py-1 rounded-xl bg-sunken hover:bg-line transition-colors cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>로그아웃</span>
                </button>
              </div>
            </div>

            {/* Filter Chips */}
            {historyRooms.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                {([
                  { key: "all", label: `전체 ${historyRooms.length}` },
                  { key: "owner", label: `내가 방장 ${historyRooms.filter(r => r.role === "owner" || r.role === "admin").length}` },
                  { key: "member", label: `참여한 모임 ${historyRooms.filter(r => r.role === "member").length}` }
                ] as const).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setRoomFilter(f.key)}
                    className={`px-3 py-1.5 rounded-xl transition-colors font-medium cursor-pointer ${
                      roomFilter === f.key
                        ? "bg-ink text-white"
                        : "bg-sunken text-ink-soft hover:text-ink"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {roomsLoading ? (
              <div className="py-8 text-center text-xs text-ink-faint flex justify-center items-center gap-2">
                <Compass className="w-4 h-4 animate-spin" />
                <span>모임방 목록을 불러오는 중...</span>
              </div>
            ) : historyRooms.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  const filtered = historyRooms.filter((r) => {
                    if (roomFilter === "owner") return r.role === "owner" || r.role === "admin";
                    if (roomFilter === "member") return r.role === "member";
                    return true;
                  });
                  const displayed = isRoomsExpanded ? filtered : filtered.slice(0, 3);

                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {displayed.map((room) => (
                          <div
                            key={room.code}
                            className="flex items-center justify-between p-4 rounded-xl border border-line bg-surface hover:border-ink-faint transition-colors group"
                          >
                            <a
                              href={`#/room/${room.code}`}
                              className="flex-grow space-y-1 block min-w-0 pr-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-1.5 py-0.5 rounded bg-sunken text-ink-soft">
                                  {room.role === "admin" ? "운영자" : room.role === "owner" ? "방장" : "참가"}
                                </span>
                                <h4 className="text-sm font-semibold text-ink truncate" title={room.title}>
                                  {room.title}
                                </h4>
                              </div>
                              <p className="text-xs text-ink-faint font-mono tracking-wider">
                                코드 {room.code}
                              </p>
                            </a>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                title={room.role === "admin" ? "모임방 데이터 영구 삭제" : "목록에서 제외"}
                                aria-label={room.role === "admin" ? "모임방 데이터 영구 삭제" : "목록에서 제외"}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  e.preventDefault();

                                  const targetTitle = room.title || "인연 사주방";
                                  if (!confirm(`'${targetTitle}' 방을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) {
                                    return;
                                  }

                                  // Commit any previously pending deletion immediately to keep action stack consistent
                                  if (pendingDeleteRoom) {
                                    await handleImmediateCommit(pendingDeleteRoom);
                                  }

                                  const isSystemAdmin = currentUser?.email?.toLowerCase() === "lhs41977@gmail.com";
                                  const actionType = (isSystemAdmin && room.role === "admin") ? "delete_db" : "exclude_list";

                                  // Optimistically hide from UI immediately
                                  setHistoryRooms((prev) => prev.filter((r) => r.code !== room.code));

                                  // Queue delayed backend operation
                                  const timeoutId = setTimeout(async () => {
                                    try {
                                      if (actionType === "delete_db") {
                                        const idToken = await currentUser?.getIdToken();
                                        if (idToken) {
                                          await fetch(`/api/admin/rooms/${room.code}`, {
                                            method: "DELETE",
                                            headers: {
                                              Authorization: `Bearer ${idToken}`
                                            }
                                          });
                                        }
                                      } else {
                                        await removeRoomFromHistory(room.code);
                                      }
                                    } catch (err) {
                                      console.error("Delayed execution failed:", err);
                                    } finally {
                                      setPendingDeleteRoom(null);
                                    }
                                  }, 5000);

                                  setPendingDeleteRoom({
                                    code: room.code,
                                    title: targetTitle,
                                    role: room.role,
                                    actionType,
                                    roomObj: room,
                                    timeoutId
                                  });
                                }}
                                className="min-w-[40px] min-h-[40px] flex items-center justify-center text-ink-faint hover:text-seal rounded-xl hover:bg-sunken transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <ChevronRight className="w-4 h-4 text-ink-faint" />
                            </div>
                          </div>
                        ))}
                      </div>

                      {filtered.length > 3 && (
                        <div className="pt-1 text-center">
                          <button
                            type="button"
                            onClick={() => setIsRoomsExpanded(!isRoomsExpanded)}
                            className="inline-flex items-center px-4 py-2 bg-sunken hover:bg-line text-xs font-medium text-ink rounded-xl transition-colors cursor-pointer"
                          >
                            {isRoomsExpanded
                              ? "목록 접기"
                              : `${filtered.length - 3}개 더 보기`}
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Troubleshooting Footer */}
                <div className="pt-3 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ink-faint">
                  <span>방 목록이 누락되었나요?</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRoomsLoading(true);
                        setTimeout(() => window.location.reload(), 300);
                      }}
                      className="inline-flex items-center gap-1 text-ink-soft hover:text-ink transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>목록 새로고침</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("브라우저에 저장된 방 참여 기록과 캐시를 초기화할까요?\n초대 코드로 언제든 다시 참여할 수 있습니다.")) {
                          clearAllLocalCache();
                          window.location.reload();
                        }
                      }}
                      className="text-ink-faint hover:text-ink transition-colors cursor-pointer"
                    >
                      캐시 초기화
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-ink-faint leading-relaxed">
                  아직 참여한 모임방이 없습니다.
                  <br />
                  새 방을 만들거나 초대 코드로 참여해 보세요.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 무엇을 분석하나요 — 접힌 소개 (정보과부하 방지) */}
        <details className="border-t border-line pt-8 group">
          <summary className="flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <h3 className="font-serif text-lg font-semibold text-ink">무엇을 분석하나요</h3>
            <ChevronRight className="w-4 h-4 text-ink-faint transition-transform group-open:rotate-90" />
          </summary>
          <ul className="mt-4 space-y-3 text-sm text-ink-soft leading-relaxed">
            <li>
              <strong className="text-ink font-semibold">음양오행 분포</strong> — 목·화·토·금·수 기운의 분포와 모임 내 결핍·과다를 진단합니다.
            </li>
            <li>
              <strong className="text-ink font-semibold">자미두수 12궁 명반</strong> — 명궁·부처궁·노복궁을 중심으로 인연의 흐름을 읽습니다.
            </li>
            <li>
              <strong className="text-ink font-semibold">MBTI 교차 분석</strong> — 사주 기질과 성격 유형을 함께 보아 소통 방식의 호환도를 봅니다.
            </li>
            <li>
              <strong className="text-ink font-semibold">관계별 조언</strong> — 긴장이 예상되는 관계에는 보완 방법과 대화 수칙을 제안합니다.
            </li>
          </ul>
        </details>

        {/* 인연 연구소: 칼럼 + FAQ */}
        <div className="border-t border-line pt-8 space-y-8">
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-semibold text-ink">명리학 칼럼</h3>
            <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-surface">
              {columns.map((col) => (
                <li key={col.key}>
                  <button
                    type="button"
                    onClick={() => {
                      setPolicyModal(col.key);
                      window.location.hash = `#/column/${col.no}`;
                    }}
                    className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-sunken transition-colors cursor-pointer"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink truncate">{col.title}</span>
                      <span className="block text-xs text-ink-faint mt-0.5 truncate">{col.summary}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0 text-ink-faint" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-serif text-lg font-semibold text-ink">자주 묻는 질문</h3>
            <div className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-surface">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={index}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full px-4 py-3.5 flex justify-between items-center gap-3 text-left text-sm font-medium text-ink hover:bg-sunken transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronRight
                        className="w-4 h-4 shrink-0 text-ink-faint transition-transform"
                        style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-sm text-ink-soft leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 상점 진입 — 떠 있는 버튼 대신 맥락 안의 조용한 진입점 */}
          <div className="flex items-center justify-between gap-3 border border-line rounded-xl bg-surface px-4 py-3.5">
            <p className="text-sm text-ink-soft">심층 리포트 이용권이 필요하신가요?</p>
            <button
              type="button"
              onClick={() => setIsShopOpen(true)}
              className="shrink-0 text-sm font-semibold text-ink bg-sunken hover:bg-line px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              상점 열기
            </button>
          </div>
        </div>

      </div>

      {/* Premium Shop Modal */}
      {isShopOpen && (
        <PremiumPaywall
          isModal
          onClose={() => setIsShopOpen(false)}
        />
      )}

      {/* Policy & Column Modals */}
      {policyModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          onClick={() => {
            setPolicyModal(null);
            window.location.hash = "#/";
          }}
        >
          <div
            className="bg-surface rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-lg text-left space-y-5 relative text-ink"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setPolicyModal(null);
                window.location.hash = "#/";
              }}
              className="absolute top-4 right-4 text-ink-faint hover:text-ink text-lg w-8 h-8 flex items-center justify-center rounded-xl hover:bg-sunken transition-colors cursor-pointer"
              aria-label="닫기"
            >
              ✕
            </button>

            {policyModal === "column1" && (
              <div className="space-y-4 text-sm leading-relaxed">
                <span className="text-xs text-ink-faint">명리학 칼럼 01</span>
                <h2 className="text-lg font-serif font-semibold border-b border-line pb-3 text-ink">
                  십성(十星)으로 해석하는 사회적 관계와 팀워크 심리학
                </h2>
                <div className="space-y-3 text-ink-soft leading-relaxed">
                  <p>
                    동양명리학의 <strong className="text-ink">십성(十星, 또는 십신)</strong>은 사주의 기준점인 일간(日干, 태어난 날의 천간)과 다른 글자들과의 음양오행 생극 관계를 10가지 성향과 사회적 기제로 체계화한 인간관계 분류 체계입니다.
                  </p>
                  <div className="bg-sunken rounded-xl p-4 space-y-2.5">
                    <h3 className="font-semibold text-sm text-ink">팀 내 5대 십성 군집의 역할</h3>
                    <ul className="space-y-2 text-xs leading-relaxed">
                      <li>
                        <strong className="text-ink">비겁(비견·겁재) — 주도·경쟁:</strong> 확고한 주관과 실행력으로 프로젝트를 앞장서 견인하는 추진형 기질입니다.
                      </li>
                      <li>
                        <strong className="text-ink">식상(식신·상관) — 창의·표현:</strong> 풍부한 아이디어와 막힘없는 커뮤니케이션으로 모임에 혁신적인 제안을 내놓습니다.
                      </li>
                      <li>
                        <strong className="text-ink">재성(편재·정재) — 실용·결실:</strong> 자원 관리와 일정 준수, 현실적인 판단으로 결과물을 만들어냅니다.
                      </li>
                      <li>
                        <strong className="text-ink">관성(편관·정관) — 규율·책임:</strong> 원칙 준수와 책임감 있는 조율로 모임의 신뢰와 구조를 지탱합니다.
                      </li>
                      <li>
                        <strong className="text-ink">인성(편인·정인) — 통찰·수용:</strong> 깊은 탐구와 공감으로 갈등 상황에서 팀원을 보듬고 해결책을 제시합니다.
                      </li>
                    </ul>
                  </div>
                  <p>
                    인연사주는 모임 구성원들의 십성 구성을 종합해, 누가 전략을 세우고 누가 실행하며 누가 화합을 이끄는지 시너지 지도를 제시합니다.
                  </p>
                </div>
              </div>
            )}

            {policyModal === "column2" && (
              <div className="space-y-4 text-sm leading-relaxed">
                <span className="text-xs text-ink-faint">명리학 칼럼 02</span>
                <h2 className="text-lg font-serif font-semibold border-b border-line pb-3 text-ink">
                  자미두수(紫微斗數) 명반과 대운의 인연 지형도
                </h2>
                <div className="space-y-3 text-ink-soft leading-relaxed">
                  <p>
                    <strong className="text-ink">자미두수(紫微斗數)</strong>는 북극성과 14대 주성을 중심으로 108개의 별을 12개 궁(宮)에 배치하여 인간의 운명과 인간관계의 결을 입체적으로 조망하는 동양 성학(星學)입니다.
                  </p>
                  <div className="bg-sunken rounded-xl p-4 space-y-2.5">
                    <h3 className="font-semibold text-sm text-ink">대인관계와 인연을 주관하는 핵심 4궁</h3>
                    <ul className="space-y-2 text-xs leading-relaxed">
                      <li>
                        <strong className="text-ink">명궁(命宮):</strong> 타고난 본질과 자아상, 세상을 바라보는 제1렌즈.
                      </li>
                      <li>
                        <strong className="text-ink">형제궁(兄弟宮)·노복궁(奴僕宮):</strong> 친구, 동료, 파트너와의 상호작용 방식과 협력의 신뢰도.
                      </li>
                      <li>
                        <strong className="text-ink">부처궁(夫妻宮):</strong> 1:1 친밀한 관계에서 추구하는 가치관과 이상적인 파트너십 형태.
                      </li>
                      <li>
                        <strong className="text-ink">천이궁(遷移宮):</strong> 낯선 환경이나 새로운 그룹에서 발현되는 사회적 적응력.
                      </li>
                    </ul>
                  </div>
                  <p>
                    인연사주는 사주 여덟 글자 분석과 함께 자미두수의 궁위별 조화도를 산출해, 겉으로 드러나는 행동과 내면의 심리적 공명을 함께 풀어냅니다.
                  </p>
                </div>
              </div>
            )}

            {policyModal === "column3" && (
              <div className="space-y-4 text-sm leading-relaxed">
                <span className="text-xs text-ink-faint">명리학 칼럼 03</span>
                <h2 className="text-lg font-serif font-semibold border-b border-line pb-3 text-ink">
                  음양오행(陰陽五行) 생극제화와 스트레스 완화
                </h2>
                <div className="space-y-3 text-ink-soft leading-relaxed">
                  <p>
                    자연의 모든 생명 현상은 <strong className="text-ink">목(木)·화(火)·토(土)·금(金)·수(水)</strong> 다섯 원소의 상생(相生, 돕고 북돋움)과 상극(相剋, 견제하고 단련함)의 순환 속에서 균형을 찾아갑니다.
                  </p>
                  <div className="bg-sunken rounded-xl p-4 space-y-2.5">
                    <h3 className="font-semibold text-sm text-ink">오행 과다·결핍 시 나타나는 관계 스트레스와 보완</h3>
                    <ul className="space-y-2 text-xs leading-relaxed">
                      <li>
                        <strong className="text-ink">목(木) 과다 / 금(金) 부족:</strong> 추진력은 강하나 마무리가 흐려질 수 있음 — 결단력 있는 금(金) 성향의 파트너와 협업.
                      </li>
                      <li>
                        <strong className="text-ink">화(火) 과다 / 수(水) 부족:</strong> 열정적이나 쉽게 지치고 감정 기복 — 차분한 수(水) 기운의 동료를 통한 이성적 완충.
                      </li>
                      <li>
                        <strong className="text-ink">토(土) 과다 / 목(木) 부족:</strong> 신중하나 변화에 둔감 — 생기 있는 목(木) 기운으로 활력을 보충.
                      </li>
                    </ul>
                  </div>
                  <p>
                    그룹 내 특정 오행이 결핍되거나 과도할 때 발생하는 마찰을 미리 파악하면, 서로를 탓하는 대신 상호보완적 역할을 나눠 갈등을 창조적 에너지로 바꿀 수 있습니다.
                  </p>
                </div>
              </div>
            )}

            {policyModal === "column4" && (
              <div className="space-y-4 text-sm leading-relaxed">
                <span className="text-xs text-ink-faint">명리학 칼럼 04</span>
                <h2 className="text-lg font-serif font-semibold border-b border-line pb-3 text-ink">
                  정통 만세력 알고리즘과 절기(節氣) 도출 고찰
                </h2>
                <div className="space-y-3 text-ink-soft leading-relaxed">
                  <p>
                    사주명리학의 기초는 단순한 달력 날짜가 아니라, 태양의 황도 좌표(황경 15도 간격)에 따라 결정되는 <strong className="text-ink">24절기(節氣)</strong>의 입기 시각(時刻)입니다.
                  </p>
                  <div className="bg-sunken rounded-xl p-4 space-y-2.5">
                    <h3 className="font-semibold text-sm text-ink">인연사주 천문 엔진의 3대 보정 원칙</h3>
                    <ul className="space-y-2 text-xs leading-relaxed">
                      <li>
                        <strong className="text-ink">1. 진태양시(True Solar Time) 경도 보정:</strong> 대한민국 표준시(동경 135도 기준)와 서울 실제 경도(동경 126.97도) 사이의 약 32분 시차를 보정합니다.
                      </li>
                      <li>
                        <strong className="text-ink">2. 절기 입기 시각 분 단위 계산:</strong> 입춘(立春) 등 절기가 바뀌는 당일에 태어난 경우에도 시각에 따라 정확한 월주(月柱)를 판별합니다.
                      </li>
                      <li>
                        <strong className="text-ink">3. 야자시(夜子時)/조자시(朝子時) 기준:</strong> 밤 11시 30분 이후 출생 시 일주 변경 논쟁을 표준 명리학 정설에 맞춰 처리합니다.
                      </li>
                    </ul>
                  </div>
                  <p>
                    이를 통해 어떤 연도나 절기 경계선에 태어났더라도 신뢰할 수 있는 간지(干支)를 도출합니다.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-line flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setPolicyModal(null);
                  window.location.hash = "#/";
                }}
                className="px-5 py-2 bg-sunken hover:bg-line text-ink text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal for Sign In / Sign Up */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          const currentMem = getUserMembershipInfo(auth.currentUser);
          if (currentMem.canCreateRoom) {
            window.location.hash = "#/create";
          }
        }}
      />

      {/* Upgrade to Social Modal for Regular Email Members trying to Create Room */}
      <UpgradeToSocialModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        triggerReason="create_room"
        onSuccess={() => {
          window.location.hash = "#/create";
        }}
      />

      {/* Delayed Undo Deletion Toast */}
      {pendingDeleteRoom && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-full bg-ink text-white rounded-xl shadow-lg p-4 animate-slide-up">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium truncate max-w-[200px]">
              '{pendingDeleteRoom.title}' 방이 {pendingDeleteRoom.actionType === "delete_db" ? "삭제" : "제외"}되었습니다
            </span>
            <button
              type="button"
              onClick={() => {
                // Clear countdown, restore list item
                clearTimeout(pendingDeleteRoom.timeoutId);
                setHistoryRooms(prev => {
                  if (prev.some(r => r.code === pendingDeleteRoom.code)) return prev;
                  return [pendingDeleteRoom.roomObj, ...prev];
                });
                setPendingDeleteRoom(null);
              }}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              title="삭제 취소"
            >
              <RotateCcw className="w-3 h-3" />
              <span>되돌리기</span>
            </button>
          </div>
          {/* Animated remaining progress countdown */}
          <div className="mt-2.5 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/70 animate-[countdown_5s_linear_forwards]" />
          </div>
        </div>
      )}

      {/* Local custom keyframes injection */}
      <style>{`
        @keyframes countdown {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </Layout>
  );
}
