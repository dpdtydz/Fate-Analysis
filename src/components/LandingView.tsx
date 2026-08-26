import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { 
  auth, 
  db, 
  getRoomHistory, 
  signInWithGoogle, 
  signOutUser, 
  removeRoomFromHistory, 
  clearAllLocalCache, 
  getUserMembershipInfo,
  getUserPersonalProfile,
  PersonalSajuProfile,
  getFriendlyAuthErrorMessage
} from "../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { 
  LogIn, 
  LogOut, 
  Compass, 
  Sparkles, 
  BookOpen, 
  ChevronRight, 
  UserCheck, 
  Trash2, 
  RefreshCw, 
  Crown, 
  Users, 
  KeyRound, 
  PlusCircle, 
  ArrowRight, 
  ShieldCheck, 
  HelpCircle,
  Sun,
  Edit3,
  RotateCcw
} from "lucide-react";
import PremiumPaywall from "./PremiumPaywall";
import GoogleAds from "./GoogleAds";
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
  const [loginLoading, setLoginLoading] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [policyModal, setPolicyModal] = useState<"column1" | "column2" | "column3" | "column4" | null>(null);
  const [isRoomsExpanded, setIsRoomsExpanded] = useState(false);
  const [archiveTab, setArchiveTab] = useState<"columns" | "faq">("columns");

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

  const [cleanLoading, setCleanLoading] = useState(false);
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

  const handleCleanDummyRooms = async () => {
    if (!currentUser) return;
    if (!confirm("⚠️ '테스트', 'test', 'backdoor', '백도어', 'dummy', '더미', '임시방' 등의 문구가 포함된 개발용 더미 방들을 데이터베이스에서 일괄 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.")) {
      return;
    }
    
    try {
      setCleanLoading(true);
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/admin/clean-dummy-rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        }
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(`🧹 더미방 일괄 파기 완료: ${data.message}`);
        window.location.reload();
      } else {
        alert(`⚠️ 정리 오류: ${data.error || "일괄 정리에 실패했습니다."}`);
      }
    } catch (err) {
      console.error("Clean dummy rooms failed:", err);
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setCleanLoading(false);
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

  const isGoogleUser = currentUser && !currentUser.isAnonymous;

  return (
    <Layout maxWidth="6xl">
      <div className="space-y-6">
        
        {/* ========================================================================= */}
        {/* TOP TAB SWITCHER: [Tab1: 나만의 소울 사주 카드] vs [Tab2: 모임 그룹 궁합] (Frame 2147258042) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 gap-2 bg-[#EFE9DF] p-1.5 rounded-2xl text-xs sm:text-sm font-serif font-bold shadow-2xs">
          <a
            href="#/my-saju"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = "#/my-saju";
            }}
            className="py-3 px-2.5 rounded-xl text-[#5C5046] hover:text-[#2C3E50] hover:bg-white/50 flex items-center justify-center gap-1.5 transition cursor-pointer text-center"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="truncate">나만의 소울 사주 카드</span>
          </a>

          <button
            type="button"
            className="py-3 px-2.5 rounded-xl bg-white text-[#2C3E50] shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer text-center"
          >
            <Users className="w-4 h-4 text-[#C0392B]" />
            <span className="truncate">모임 그룹 궁합</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* HERO SECTION: Authentic Korean Editorial Identity */}
        {/* ========================================================================= */}
        <div className="text-center sm:text-left pt-1 pb-3 border-b border-[#EFE9DF]">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-[#FDF3F1] border border-[#C0392B]/30 text-[#C0392B] text-xs font-serif font-bold">
                <span>因緣四柱</span>
                <span className="text-[10px] opacity-70">|</span>
                <span className="text-[11px] font-sans font-medium text-[#4F443B]">정통 만세력 & 그룹 케미스트리</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1E293B] leading-tight">
                우리 모임의 기운과 <br className="sm:hidden" />
                <span className="text-[#C0392B]">인연 지도</span>를 펼치다
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] max-w-lg leading-relaxed font-normal">
                단톡방, 프로젝트 팀, 동호회 사람들의 태어난 날(음양오행)을 기반으로<br className="hidden sm:inline" />
                서로를 살리는 상생(相生)과 지혜롭게 조율할 내면 기질 상성·케미스트리를 정밀 분석합니다.
              </p>
            </div>

            {/* Quick Stats Pill / Seal Stamp */}
            <div className="hidden sm:flex flex-col items-end justify-center p-3.5 bg-[#FAF8F5] border border-[#E7E1D6] rounded-xl text-right space-y-1 shrink-0">
              <span className="text-[10px] text-[#8C827A] font-mono uppercase tracking-wider">Analysis Engine</span>
              <span className="text-xs font-serif font-bold text-[#1E293B]">萬歲曆 · 紫微斗數 · MBTI</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                🔒 개인정보 30일 파기
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ACTION BENTO GRID: Create Room (Left) vs Join Code (Right) */}
        {/* ========================================================================= */}
        <div id="group-action-cards" className="grid grid-cols-1 md:grid-cols-2 gap-4 scroll-mt-6">
          
          {/* Card 1: Create Room */}
          <div className="bg-gradient-to-br from-[#2C3E50] to-[#1E293B] text-white p-6 rounded-2xl shadow-sm border border-[#1E293B] flex flex-col justify-between space-y-5 relative overflow-hidden group">
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 tracking-wider font-serif bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  새로운 인연방
                </span>
                <span className="text-[11px] text-slate-300 font-mono">1분 완료</span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-bold tracking-tight text-white leading-snug">
                모임방 개설하고<br />
                초대 코드 발급받기
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                방을 만들고 6자리 코드를 공유하면, 구성원들이 각자 생년월일을 입력해 12간지 캐릭터와 전체 궁합이 완성됩니다.
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
              className="relative z-10 w-full py-3 px-4 bg-[#C0392B] hover:bg-[#A93226] active:scale-[0.99] text-white font-serif font-bold text-sm rounded-xl text-center transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
            >
              <span>새로운 인연방 만들기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Join by Code */}
          <div className="bg-[#FAF8F5] p-6 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A524A] font-serif bg-white px-2.5 py-1 rounded-lg shadow-2xs">
                  <KeyRound className="w-3.5 h-3.5 text-[#C0392B]" />
                  초대 코드 입장
                </span>
                <span className="text-[11px] text-[#8C827A]">공유받은 6자리</span>
              </div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#1E293B]">
                전달받은 코드로 바로 참여
              </h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                단톡방에서 공유받은 영문/숫자 6자리 코드를 입력하여 모임 궁합 명부에 이름을 올리세요.
              </p>
            </div>

            <form id="join-code-form" onSubmit={handleJoinByCode} className="space-y-2.5">
              <div className="flex space-x-2">
                <input
                  id="join-code-input"
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="예: AF7X29"
                  className="flex-grow px-3.5 py-2.5 bg-white border border-[#D6CCBC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C0392B]/20 focus:border-[#C0392B] text-sm text-[#1E293B] placeholder:text-[#B0A69B] uppercase font-mono tracking-widest font-bold"
                />
                <button
                  id="join-code-submit"
                  type="submit"
                  className="px-5 py-2.5 bg-[#1E293B] text-white rounded-xl text-xs font-serif font-bold hover:bg-[#0F172A] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  입장하기
                </button>
              </div>
              {error && (
                <p className="text-[11px] text-[#C0392B] font-medium">⚠️ {error}</p>
              )}
            </form>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MY REGISTERED ROOMS LIST (나의 인연 사주방 기록서 - 회원 전용) */}
        {/* ========================================================================= */}
        {currentUser && !currentUser.isAnonymous && (
          <div className="border-t border-[#EFE9DF] pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EFE9DF] pb-3">
              <div className="flex items-center space-x-2 text-[#1E293B]">
                <BookOpen className="w-4 h-4 text-[#C0392B]" />
                <h3 className="font-serif text-sm font-bold tracking-tight">
                  나의 인연방 목록
                </h3>
                <span className="text-[11px] font-mono text-[#8C827A] bg-[#FAF8F5] px-2 py-0.5 rounded-full font-bold">
                  {historyRooms.length}개
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
                    className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#C0392B] hover:bg-[#C0392B] hover:text-white px-2 py-0.5 rounded border border-[#C0392B]/40 bg-white transition duration-150 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>로그아웃</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Chips */}
            {historyRooms.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setRoomFilter("all")}
                  className={`px-2.5 py-1 rounded-lg transition-all text-[11px] font-serif font-bold cursor-pointer ${
                    roomFilter === "all"
                      ? "bg-[#1E293B] text-white shadow-2xs"
                      : "bg-[#FAF8F5] text-[#64748B] hover:bg-[#F4EFE6] border border-[#E7E1D6]"
                  }`}
                >
                  전체 ({historyRooms.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoomFilter("owner")}
                  className={`px-2.5 py-1 rounded-lg transition-all text-[11px] font-serif font-bold cursor-pointer ${
                    roomFilter === "owner"
                      ? "bg-[#C0392B] text-white shadow-2xs"
                      : "bg-[#FAF8F5] text-[#64748B] hover:bg-[#F4EFE6] border border-[#E7E1D6]"
                  }`}
                >
                  내가 방장 ({historyRooms.filter(r => r.role === "owner" || r.role === "admin").length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoomFilter("member")}
                  className={`px-2.5 py-1 rounded-lg transition-all text-[11px] font-serif font-bold cursor-pointer ${
                    roomFilter === "member"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-[#FAF8F5] text-[#64748B] hover:bg-[#F4EFE6] border border-[#E7E1D6]"
                  }`}
                >
                  참여한 모임 ({historyRooms.filter(r => r.role === "member").length})
                </button>
              </div>
            )}

            {roomsLoading ? (
              <div className="py-8 text-center text-xs text-[#8C827A] flex justify-center items-center space-x-2 animate-pulse">
                <Compass className="w-4 h-4 animate-spin text-[#C0392B]" />
                <span>사주 인연 명부를 동기화하는 중...</span>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {displayed.map((room) => (
                          <div
                            key={room.code}
                            className="flex items-center justify-between p-3.5 rounded-xl border border-[#E7E1D6] bg-[#FAF8F5] hover:bg-[#F4EFE6] hover:border-[#D6CCBC] transition-all group"
                          >
                            <a
                              href={`#/room/${room.code}`}
                              className="flex-grow space-y-1 block min-w-0 pr-2"
                            >
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                    room.role === "admin"
                                      ? "bg-[#1E293B]/10 text-[#1E293B] border-[#1E293B]/20"
                                      : room.role === "owner"
                                        ? "bg-red-50 text-red-700 border-red-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                  }`}
                                >
                                  {room.role === "admin" ? "운영자" : room.role === "owner" ? "방장" : "참가"}
                                </span>
                                <h4 className="text-xs font-bold text-[#1E293B] group-hover:text-[#C0392B] transition-colors truncate" title={room.title}>
                                  {room.title}
                                </h4>
                              </div>
                              <p className="text-[10px] text-[#8C827A] font-mono tracking-wider">
                                코드: <strong className="text-[#1E293B]">{room.code}</strong>
                              </p>
                            </a>

                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                type="button"
                                title={room.role === "admin" ? "인연방 데이터 영구 삭제" : "목록에서 제외"}
                                aria-label={room.role === "admin" ? "인연방 데이터 영구 삭제" : "목록에서 제외"}
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  
                                  const targetTitle = room.title || "인연 사주방";
                                  if (!confirm(`정말로 '${targetTitle}' 방을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다`)) {
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
                                className="min-w-[40px] min-h-[40px] flex items-center justify-center text-gray-300 hover:text-[#C0392B] rounded-lg hover:bg-white transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <ChevronRight className="w-4 h-4 text-[#8C827A] group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        ))}
                      </div>

                      {filtered.length > 3 && (
                        <div className="pt-2 text-center">
                          <button
                            type="button"
                            onClick={() => setIsRoomsExpanded(!isRoomsExpanded)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FAF8F5] hover:bg-[#F2ECE0] border border-[#E7E1D6] text-xs font-serif font-bold text-[#1E293B] rounded-xl transition cursor-pointer shadow-3xs active:scale-98"
                          >
                            <span>
                              {isRoomsExpanded
                                ? "인연방 목록 접기 ▲"
                                : `외 ${filtered.length - 3}개 인연방 더보기 (전체 ${filtered.length}개) ▼`}
                            </span>
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Troubleshooting Footer */}
                <div className="pt-3 border-t border-[#EFE9DF] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#8C827A]">
                  <span>방 목록이 누락되었나요?</span>
                  <div className="flex items-center space-x-3 font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        setRoomsLoading(true);
                        setTimeout(() => window.location.reload(), 300);
                      }}
                      className="inline-flex items-center space-x-1 text-[#1E293B] hover:text-[#C0392B] transition cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>목록 새로고침</span>
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("⚠️ 브라우저 로컬 방 참여 기록과 캐시를 초기화하시겠습니까?\n\n초대 코드로 언제든 재참여할 수 있습니다.")) {
                          clearAllLocalCache();
                          window.location.reload();
                        }
                      }}
                      className="text-[#8C827A] hover:text-red-600 transition cursor-pointer"
                    >
                      캐시 초기화
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <p className="text-xs text-[#8C827A] leading-relaxed">
                  아직 가입하거나 개설한 인연방이 없습니다.<br />
                  새로운 방을 세우거나 초대 코드로 참례해 보세요.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4 CORE ANALYSIS MODULES (Bento Feature Showcase) */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 border-b border-[#EFE9DF] pb-2">
            <span className="text-xs font-serif font-bold text-[#1E293B] uppercase tracking-wider">
              ✦ 인연사주 4대 핵심 분석 영역
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Feature 1 */}
            <div className="p-4 bg-[#FAF8F5] rounded-xl space-y-1.5">
              <span className="text-base font-serif text-[#C0392B] font-bold">01</span>
              <h4 className="text-xs font-serif font-bold text-[#1E293B]">음양오행 생극제화</h4>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                목·화·토·금·수 오행의 분포와 모임 내 결핍/과다 기운을 진단하여 상생의 흐름을 밝힙니다.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-4 bg-[#FAF8F5] rounded-xl space-y-1.5">
              <span className="text-base font-serif text-[#C0392B] font-bold">02</span>
              <h4 className="text-xs font-serif font-bold text-[#1E293B]">자미두수 12궁 명반</h4>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                북극성과 108개 성좌 배치를 기반으로 명궁과 부처궁, 노복궁의 인연 지형도를 정밀 해독합니다.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-4 bg-[#FAF8F5] rounded-xl space-y-1.5">
              <span className="text-base font-serif text-[#C0392B] font-bold">03</span>
              <h4 className="text-xs font-serif font-bold text-[#1E293B]">현대 MBTI 성향 융합</h4>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                동양 철학과 현대 성격 심리학(MBTI)을 교차 분석하여 소통 방식과 가치관 호환도를 측정합니다.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-4 bg-[#FAF8F5] rounded-xl space-y-1.5">
              <span className="text-base font-serif text-[#C0392B] font-bold">04</span>
              <h4 className="text-xs font-serif font-bold text-[#1E293B]">맞춤형 상생 처방전</h4>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                갈등이 우려되는 관계라도 오행 보완 및 대화 행동 수칙을 제공하여 원만한 시너지를 돕습니다.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ACADEMIC ARCHIVE & FAQ CONSOLIDATED SECTION (Google AdSense Quality Content) */}
        {/* ========================================================================= */}
        <div className="border-t border-[#EFE9DF] pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EFE9DF] pb-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-[#C0392B]" />
              <h3 className="font-serif text-sm font-bold text-[#1E293B]">
                인연 연구소 · 학술 칼럼 & FAQ
              </h3>
            </div>

            {/* Archive Tab Switcher */}
            <div className="flex bg-[#FAF7F2] p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setArchiveTab("columns")}
                className={`px-3 py-1.5 rounded-lg transition text-center flex items-center gap-1.5 cursor-pointer ${
                  archiveTab === "columns"
                    ? "bg-white text-[#2C3E50] shadow-2xs font-serif"
                    : "text-[#64748B] hover:text-[#2C3E50]"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#C0392B]" />
                <span>명리학 학술 칼럼 (4편)</span>
              </button>
              <button
                type="button"
                onClick={() => setArchiveTab("faq")}
                className={`px-3 py-1.5 rounded-lg transition text-center flex items-center gap-1.5 cursor-pointer ${
                  archiveTab === "faq"
                    ? "bg-white text-[#2C3E50] shadow-2xs font-serif"
                    : "text-[#64748B] hover:text-[#2C3E50]"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#C0392B]" />
                <span>자주 묻는 질문 FAQ</span>
              </button>
            </div>
          </div>

          {archiveTab === "columns" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 animate-fade-in">
              {/* Column 1 */}
              <div 
                onClick={() => { 
                  setPolicyModal("column1");
                  window.location.hash = "#/column/1"; 
                }}
                className="p-4 bg-[#FAF8F5] hover:bg-[#F4EFE6] rounded-xl cursor-pointer transition-all space-y-1.5 group shadow-2xs"
              >
                <div className="flex items-center justify-between text-[10px] text-[#C0392B] font-bold">
                  <span>학술 칼럼 01</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="text-xs font-serif font-bold text-[#1E293B] group-hover:text-[#C0392B] transition-colors">
                  십성(十星)으로 해석하는 사회적 관계와 팀워크 심리학
                </h4>
                <p className="text-[11px] text-[#64748B] truncate leading-relaxed">
                  십성 체계가 조직과 모임 구성원의 행동 방식에 미치는 영향 분석.
                </p>
              </div>

              {/* Column 2 */}
              <div 
                onClick={() => { 
                  setPolicyModal("column2");
                  window.location.hash = "#/column/2"; 
                }}
                className="p-4 bg-[#FAF8F5] hover:bg-[#F4EFE6] rounded-xl cursor-pointer transition-all space-y-1.5 group shadow-2xs"
              >
                <div className="flex items-center justify-between text-[10px] text-[#C0392B] font-bold">
                  <span>학술 칼럼 02</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="text-xs font-serif font-bold text-[#1E293B] group-hover:text-[#C0392B] transition-colors">
                  자미두수(紫微斗數) 명반과 대운의 인연 지형도
                </h4>
                <p className="text-[11px] text-[#64748B] truncate leading-relaxed">
                  북극성과 12궁 명반 및 대운 주기가 궁합에 미치는 파급력 연구.
                </p>
              </div>

              {/* Column 3 */}
              <div 
                onClick={() => { 
                  setPolicyModal("column3");
                  window.location.hash = "#/column/3"; 
                }}
                className="p-4 bg-[#FAF8F5] hover:bg-[#F4EFE6] rounded-xl cursor-pointer transition-all space-y-1.5 group shadow-2xs"
              >
                <div className="flex items-center justify-between text-[10px] text-[#C0392B] font-bold">
                  <span>학술 칼럼 03</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="text-xs font-serif font-bold text-[#1E293B] group-hover:text-[#C0392B] transition-colors">
                  음양오행(陰陽五行) 생극제화와 스트레스 완화
                </h4>
                <p className="text-[11px] text-[#64748B] truncate leading-relaxed">
                  오행의 치우침을 진단하고 상호 부족한 기운을 보완하는 방법론.
                </p>
              </div>

              {/* Column 4 */}
              <div 
                onClick={() => { 
                  setPolicyModal("column4");
                  window.location.hash = "#/column/4"; 
                }}
                className="p-4 bg-[#FAF8F5] hover:bg-[#F4EFE6] rounded-xl cursor-pointer transition-all space-y-1.5 group shadow-2xs"
              >
                <div className="flex items-center justify-between text-[10px] text-[#C0392B] font-bold">
                  <span>학술 칼럼 04</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="text-xs font-serif font-bold text-[#1E293B] group-hover:text-[#C0392B] transition-colors">
                  정통 만세력 알고리즘과 절기(節氣) 도출 고찰
                </h4>
                <p className="text-[11px] text-[#64748B] truncate leading-relaxed">
                  절기 시각 정밀 변환 알고리즘과 자시 구분 기준 상세 고찰.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 animate-fade-in">
              {[
                {
                  q: "Q1. 태어난 시(時)를 몰라도 사주 분석이 가능한가요?",
                  a: "네, 태어난 연·월·일만 아셔도 전체 운세와 타고난 성향의 약 80% 이상을 정밀하게 추출해낼 수 있습니다. 사주학에서 연월일은 한 사람의 사회적 성향과 대인 관계의 큰 틀을 상징하기 때문입니다. 물론, 태어난 시각까지 정확히 입력하시면 더욱 세밀한 자미두수 12궁 명반과 상대방과의 1:1 심층 케미스트리 및 시너지 리포트가 100% 온전하게 완성되어 최상의 정밀도를 제공합니다."
                },
                {
                  q: "Q2. 음력 생일 및 윤달도 오차 없이 정확히 계산되나요?",
                  a: "물론입니다. 저희 시스템은 대한민국 기상청 및 국립천문대 천문 우주 데이터를 기반으로 한 정통 학술 만세력 데이터베이스가 완벽하게 내장되어 있습니다. 이에 따라 일반적인 인터넷 음양력 변환기에서는 흔히 놓치기 쉬운 '평달/윤달 구분'은 물론, 태양의 황경을 15도 간격으로 쪼갠 24절기(節氣) 입기 시각을 분 단위까지 정밀 계산하여 어떠한 생년월일이라도 단 1초의 오차도 없이 완벽하게 변환해 드립니다."
                },
                {
                  q: "Q3. 모임방에는 최대 몇 명까지 참여할 수 있나요?",
                  a: "인원 제한 없이 카카오톡 단톡방 멤버 전체나 사내 프로젝트 팀원 전원이 동시에 참여하실 수 있습니다. 방을 개설한 후 부여받은 6자리 초대 코드를 공유하기만 하면 되며, 2명 이상의 구성원이 모이는 순간부터 서로 간의 모든 1:1 상성 등급(S~F) 매트릭스와 모임 전체의 균형도를 나타내는 그룹 조화도가 실시간으로 자동 산출되어 역동적으로 변화합니다."
                },
                {
                  q: "Q4. 입력한 생년월일 등 개인정보의 보안은 안전한가요?",
                  a: "저희는 회원님의 소중한 개인정보 보호를 최우선 가치로 삼고 있습니다. 입력하신 이름과 생년월일 등의 명식 데이터는 전송 즉시 비대칭 암호화 기술을 거쳐 안전하게 보호됩니다. 또한, 방을 만든 지 30일이 지나거나 방장이 방을 해체하는 즉시 관련된 모든 구성원의 사주 기록은 시스템 상에서 복구 불가능한 형태로 영구 파기되어 흔적조차 남지 않습니다."
                }
              ].map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={index} className="bg-white rounded-xl border border-[#E7E1D6] overflow-hidden transition-all duration-200">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full px-4 py-3.5 flex justify-between items-center text-left text-xs font-serif font-bold text-[#1E293B] hover:bg-[#FAF8F5] transition cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <span 
                        className="text-[#8C827A] text-[9px] transition-transform duration-200" 
                        style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      >
                        ▼
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-[11px] text-[#64748B] leading-relaxed border-t border-dashed border-[#EFE9DF] bg-[#FAF8F5]/30 animate-fade-in">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Floating Premium Shop Trigger */}
      <button
        type="button"
        onClick={() => setIsShopOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-serif font-bold text-xs tracking-wider rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-[0.97] transition-all cursor-pointer ring-4 ring-amber-100/60"
      >
        <Crown className="w-4 h-4 fill-amber-300 text-amber-200" />
        <span>인연 상점</span>
      </button>

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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => {
            setPolicyModal(null);
            window.location.hash = "#/";
          }}
        >
          <div 
            className="bg-white border border-[#D6CCBC] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl text-left space-y-5 relative text-[#1E293B]"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => { 
                setPolicyModal(null);
                window.location.hash = "#/"; 
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition cursor-pointer"
              aria-label="닫기"
            >
              ✕
            </button>

            {policyModal === "column1" && (
              <div className="space-y-4 text-xs leading-relaxed">
                <span className="text-[10px] font-bold text-[#C0392B] bg-[#FCFAF6] px-2.5 py-1 border border-[#E8E0D0] rounded-full inline-block">
                  명리학 학술 칼럼 #01
                </span>
                <h2 className="text-lg font-serif font-bold border-b border-[#E8E0D0] pb-2 text-[#1E293B]">
                  십성(十星)으로 해석하는 사회적 관계와 팀워크 심리학
                </h2>
                <div className="space-y-3 text-[#4A4036] leading-relaxed">
                  <p>
                    동양명리학의 <strong>십성(十星, 또는 십신)</strong>은 사주의 기준점인 일간(日干, 태어난 날의 천간)과 다른 글자들과의 음양오행 생극 관계를 10가지 성향과 사회적 기제로 체계화한 고도의 인간관계 분류학입니다.
                  </p>
                  <div className="bg-[#FAF8F5] border border-[#E8E0D0] rounded-xl p-4 space-y-2.5">
                    <h3 className="font-serif font-bold text-xs text-[#1E293B]">팀 내 5대 십성 군집의 역할 역학</h3>
                    <ul className="space-y-2 text-[11px]">
                      <li>
                        <strong>1. 비겁(비견·겁재) - [주도 & 경쟁]:</strong> 확고한 주관과 강한 실행력. 동료들과의 선의의 경쟁을 통해 프로젝트를 앞장서 견인하는 추진형 리더의 기질입니다.
                      </li>
                      <li>
                        <strong>2. 식상(식신·상관) - [창의 & 표현]:</strong> 풍부한 아이디어와 기획력, 막힘없는 커뮤니케이션. 모임의 분위기를 띄우고 혁신적인 제안을 내놓는 브레인스토머입니다.
                      </li>
                      <li>
                        <strong>3. 재성(편재·정재) - [실용 & 결실]:</strong> 치밀한 자원 관리, 일정 준수, 현실적인 손익 계산 능력. 모임과 비즈니스의 최종 결과물을 확실하게 만들어내는 실행가입니다.
                      </li>
                      <li>
                        <strong>4. 관성(편관·정관) - [규율 & 책임]:</strong> 조직의 원칙 준수, 책임감 있는 조율과 위기관리. 모임의 신뢰성과 구조를 탄탄하게 지탱하는 버팀목입니다.
                      </li>
                      <li>
                        <strong>5. 인성(편인·정인) - [통찰 & 수용]:</strong> 깊은 학문적 탐구, 타인에 대한 공감과 지혜로운 조언. 갈등 상황에서 팀원들을 보듬고 해결책을 제시하는 멘토입니다.
                      </li>
                    </ul>
                  </div>
                  <p>
                    인연사주는 모임 구성원들의 십성 구성을 종합 분석하여, 누가 전략을 세우고 누가 실행하며 누가 조직을 화합으로 이끌어야 하는지 최적의 시너지 지도를 제시합니다.
                  </p>
                </div>
              </div>
            )}

            {policyModal === "column2" && (
              <div className="space-y-4 text-xs leading-relaxed">
                <span className="text-[10px] font-bold text-[#C0392B] bg-[#FCFAF6] px-2.5 py-1 border border-[#E8E0D0] rounded-full inline-block">
                  명리학 학술 칼럼 #02
                </span>
                <h2 className="text-lg font-serif font-bold border-b border-[#E8E0D0] pb-2 text-[#1E293B]">
                  자미두수(紫微斗數) 명반과 대운의 인연 지형도
                </h2>
                <div className="space-y-3 text-[#4A4036] leading-relaxed">
                  <p>
                    <strong>자미두수(紫微斗數)</strong>는 북극성과 14대 주성을 중심으로 108개의 별을 12개 궁(宮)에 배치하여 인간의 운명과 인간관계의 결을 입체적으로 조망하는 동양의 최고급 성학(星學)입니다.
                  </p>
                  <div className="bg-[#FAF8F5] border border-[#E8E0D0] rounded-xl p-4 space-y-2.5">
                    <h3 className="font-serif font-bold text-xs text-[#1E293B]">대인관계와 인연을 주관하는 핵심 4궁</h3>
                    <ul className="space-y-2 text-[11px]">
                      <li>
                        <strong>• 명궁(命宮):</strong> 타고난 본질과 자아상, 세상을 바라보는 제1렌즈.
                      </li>
                      <li>
                        <strong>• 형제궁(兄弟宮) & 노복궁(奴僕宮):</strong> 친구, 동료, 비즈니스 파트너와의 상호작용 방식과 협력의 신뢰도.
                      </li>
                      <li>
                        <strong>• 부처궁(夫妻宮):</strong> 1:1 친밀한 관계에서 추구하는 가치관과 이상적인 파트너십 형태.
                      </li>
                      <li>
                        <strong>• 천이궁(遷移宮):</strong> 낯선 환경이나 새로운 그룹에 들어갔을 때 발현되는 사회적 적응력.
                      </li>
                    </ul>
                  </div>
                  <p>
                    인연사주는 사주의 4기둥 8글자 분석과 더불어, 자미두수의 궁위별 조화도를 함께 산출하여 겉으로 드러나는 행동뿐 아니라 내면의 깊은 심리적 공명까지 정확하게 풀어냅니다.
                  </p>
                </div>
              </div>
            )}

            {policyModal === "column3" && (
              <div className="space-y-4 text-xs leading-relaxed">
                <span className="text-[10px] font-bold text-[#C0392B] bg-[#FCFAF6] px-2.5 py-1 border border-[#E8E0D0] rounded-full inline-block">
                  명리학 학술 칼럼 #03
                </span>
                <h2 className="text-lg font-serif font-bold border-b border-[#E8E0D0] pb-2 text-[#1E293B]">
                  음양오행(陰陽五行) 생극제화와 스트레스 완화
                </h2>
                <div className="space-y-3 text-[#4A4036] leading-relaxed">
                  <p>
                    자연의 모든 생명 현상은 <strong>목(木)·화(火)·토(土)·금(金)·수(水)</strong> 다섯 원소의 상생(相生, 돕고 북돋움)과 상극(相剋, 견제하고 단련함)의 역동적인 순환 속에서 균형을 찾아갑니다.
                  </p>
                  <div className="bg-[#FAF8F5] border border-[#E8E0D0] rounded-xl p-4 space-y-2.5">
                    <h3 className="font-serif font-bold text-xs text-[#1E293B]">오행 과다·결핍 시 나타나는 관계 스트레스와 처방</h3>
                    <ul className="space-y-2 text-[11px]">
                      <li>
                        <strong>• 목(木) 과다 / 금(金) 부족:</strong> 추진력은 강하나 마무리가 흐려질 수 있음 ➔ 금(金) 성향의 결단력 있는 파트너와 협업.
                      </li>
                      <li>
                        <strong>• 화(火) 과다 / 수(水) 부족:</strong> 열정적이나 쉽게 피로하고 감정 기복 ➔ 차분한 수(水) 기운의 동료를 통해 이성적 완충.
                      </li>
                      <li>
                        <strong>• 토(土) 과다 / 목(木) 부족:</strong> 신중하나 변화에 둔감 ➔ 생기 있는 목(木) 기운으로 새로운 활력을 충전.
                      </li>
                    </ul>
                  </div>
                  <p>
                    그룹 내 특정 오행이 결핍되거나 과도할 때 발생하는 마찰을 사전에 파악하면, 서로를 탓하는 대신 상호보완적 역할을 부여함으로써 갈등을 창조적 에너지로 승화시킬 수 있습니다.
                  </p>
                </div>
              </div>
            )}

            {policyModal === "column4" && (
              <div className="space-y-4 text-xs leading-relaxed">
                <span className="text-[10px] font-bold text-[#C0392B] bg-[#FCFAF6] px-2.5 py-1 border border-[#E8E0D0] rounded-full inline-block">
                  명리학 학술 칼럼 #04
                </span>
                <h2 className="text-lg font-serif font-bold border-b border-[#E8E0D0] pb-2 text-[#1E293B]">
                  정통 만세력 알고리즘과 절기(節氣) 도출 고찰
                </h2>
                <div className="space-y-3 text-[#4A4036] leading-relaxed">
                  <p>
                    사주명리학의 기초는 단순한 달력 날짜가 아니라, 태양의 황도 좌표(황경 15도 간격)에 따라 정확하게 결정되는 <strong>24절기(節氣)</strong>의 입기 시각(時刻)입니다.
                  </p>
                  <div className="bg-[#FAF8F5] border border-[#E8E0D0] rounded-xl p-4 space-y-2.5">
                    <h3 className="font-serif font-bold text-xs text-[#1E293B]">인연사주 정밀 천문 엔진의 3대 보정 원칙</h3>
                    <ul className="space-y-2 text-[11px]">
                      <li>
                        <strong>1. 진태양시(True Solar Time) 경도 보정:</strong> 대한민국 표준시(동경 135도 기준)와 서울 실제 경도(동경 126.97도) 사이의 약 32분 시차를 정밀하게 보정합니다.
                      </li>
                      <li>
                        <strong>2. 절기 입기 시각 분 단위 정밀 계산:</strong> 입춘(立春), 입하(立夏) 등 절기가 바뀌는 당일 태어난 경우에도 몇 시 몇 분에 태어났는지에 따라 정확한 월주(月柱)를 판별합니다.
                      </li>
                      <li>
                        <strong>3. 야자시(夜子時) / 조자시(朝子時) 명확한 기준:</strong> 밤 11시 30분 이후 출생 시 자시(子時)의 일주 변경 논쟁을 표준 명리학 정설에 맞춰 명확하게 처리합니다.
                      </li>
                    </ul>
                  </div>
                  <p>
                    이를 통해 사용자가 어떤 연도나 절기 경계선에 태어났더라도 단 1초의 오차 없이 신뢰할 수 있는 정확한 간지(干支)를 도출합니다.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#E8E0D0] flex justify-end">
              <button
                type="button"
                onClick={() => { 
                  setPolicyModal(null);
                  window.location.hash = "#/"; 
                }}
                className="px-5 py-2 bg-[#1E293B] text-white text-xs font-serif font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer"
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

      {/* Elegant Delayed Undo Deletion Toast */}
      {pendingDeleteRoom && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-full bg-[#1E293B] text-white border border-slate-700 rounded-xl shadow-2xl p-4 animate-slide-up">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-serif font-bold truncate max-w-[180px]">
                '{pendingDeleteRoom.title}' 방이 {pendingDeleteRoom.actionType === "delete_db" ? "삭제" : "제외"}되었습니다
              </span>
            </div>
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
              className="px-2.5 py-1.5 bg-[#C0392B] hover:bg-[#A93226] text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
              title="삭제 취소"
            >
              <RotateCcw className="w-3 h-3" />
              <span>되돌리기 (Undo)</span>
            </button>
          </div>
          {/* Animated remaining progress countdown */}
          <div className="mt-2.5 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 animate-[countdown_5s_linear_forwards]" />
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


