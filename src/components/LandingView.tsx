import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { auth, db, getRoomHistory, signInWithGoogle, signOutUser, removeRoomFromHistory, clearAllLocalCache } from "../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { LogIn, LogOut, Compass, Sparkles, BookOpen, ChevronRight, UserCheck, Trash2, RefreshCw, Crown } from "lucide-react";
import PremiumPaywall from "./PremiumPaywall";
import GoogleAds from "./GoogleAds";

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
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [policyModal, setPolicyModal] = useState<"privacy" | "terms" | "cookies" | "column1" | "column2" | "column3" | "column4" | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadUserRooms = async () => {
      setRoomsLoading(true);
      console.log("Loading user rooms, currentUser:", currentUser);
      try {
        const localHistory = getRoomHistory(); // Array of { code, role, title, updatedAt }
        const mergedMap = new Map<string, HistoryRoom>();

        // 1. If Google account logged in, load real-time database owned rooms dynamically
        if (currentUser && !currentUser.isAnonymous) {
          const isAdmin = currentUser.email?.toLowerCase() === "lhs41977@gmail.com";
          console.log("CurrentUser email:", currentUser.email, "IsAdmin:", isAdmin);
          
          // A. Load owned rooms
          const q = isAdmin
            ? query(collection(db, "rooms"))
            : query(
                collection(db, "rooms"),
                where("owner_uid", "==", currentUser.uid)
              );
          
          try {
            const querySnapshot = await getDocs(q);
            console.log("Admin rooms query successful, size:", querySnapshot.size);
            querySnapshot.forEach((docSnap) => {
              const data = docSnap.data();
              mergedMap.set(docSnap.id, {
                code: docSnap.id,
                role: isAdmin ? "admin" : "owner",
                title: data.title || "인연 사주방",
                updatedAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
              });
            });
          } catch (e) {
            console.error("Error loading admin rooms:", e);
          }

          // B. Load joined rooms from user profile
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
        }

        // 2. Load and overlay local localStorage histories to catch member/guest rooms
        for (const item of localHistory) {
          if (!mergedMap.has(item.code)) {
            try {
              const rSnap = await getDoc(doc(db, "rooms", item.code));
              if (rSnap.exists()) {
                const rData = rSnap.data();
                const isExpired = rData.expire_at && new Date(rData.expire_at) < new Date();
                if (!isExpired) {
                  mergedMap.set(item.code, {
                    code: item.code,
                    role: item.role,
                    title: rData.title || item.title,
                    updatedAt: item.updatedAt || Date.now(),
                  });
                }
              }
            } catch (err) {
              // Fallback to offline representation if database fetch fails
              mergedMap.set(item.code, {
                code: item.code,
                role: item.role,
                title: item.title,
                updatedAt: item.updatedAt || Date.now(),
              });
            }
          }
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

    // Go directly to room
    window.location.hash = `#/room/${cleanCode}`;
  };

  const isGoogleUser = currentUser && !currentUser.isAnonymous;

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-4 text-center">
        {/* Visual Symbol logo */}
        <div className="w-16 h-16 rounded-full border border-[#D6CCBC] bg-[#FCFAF5] flex items-center justify-center font-serif text-3xl text-[#C0392B] shadow-xs mb-4">
          ☯
        </div>
        
        <h2 className="font-serif text-3xl font-bold tracking-tight text-[#C0392B] mb-1.5 leading-tight animate-fade-in">
          인연사주
        </h2>
        <p className="font-serif text-xs italic text-[#8C7B6E] tracking-[0.1em] mb-6">
          단톡방 · 모임용 사주 기반 단체 궁합 엮기
        </p>

        {/* Traditional card container design */}
        <div className="w-full bg-[#FCFAF6] border border-[#D6CCBC] p-5 rounded-2xl text-left space-y-3.5 shadow-xs mb-5">
          <p className="text-xs font-bold text-[#8C7B6E] uppercase tracking-[0.2em] text-center border-b border-[#E8E0D0] pb-2.5">
            소동물 사주 캐릭터와 궁합 인연망
          </p>
          <ul className="space-y-2 text-xs text-[#5A4D41] leading-relaxed list-none pl-0.5">
            <li className="flex items-start">
              <span className="text-[#C0392B] mr-2 font-bold select-none">✦</span>
              <span>방장이 방을 개설하고 <strong>초대 링크</strong>를 주면 모임 참여가 시작됩니다.</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#C0392B] mr-2 font-bold select-none">✦</span>
              <span>각자 생년월일시 사주를 입력하면 음양오행 및 만세력 동물 캐릭터가 입명됩니다.</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#C0392B] mr-2 font-bold select-none">✦</span>
              <span>동양 오행의 상생/상극 관계를 바탕으로 다채로운 AI 궁합 인연망을 확인해 보세요.</span>
            </li>
          </ul>
        </div>

        {/* Main Action Control Panel */}
        <div className="w-full space-y-4">
          
          {/* Create Button block */}
          <a
            id="create-room-btn"
            href="#/create"
            className="block w-full py-4 bg-[#C0392B] text-[#FAF7F2] rounded-xl font-serif font-bold text-sm text-center hover:bg-[#A93226] active:scale-[0.99] transition-all tracking-widest shadow-md flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>새로운 인연방 만들기</span>
          </a>

          {/* CODE JOIN FORM */}
          <form id="join-code-form" onSubmit={handleJoinByCode} className="bg-white/60 backdrop-blur-xs p-4.5 border border-[#D6CCBC] rounded-2xl text-left space-y-3 shadow-xs">
            <label className="block text-xs font-bold text-[#2C3E50] tracking-tight">초대 코드로 인연 참가</label>
            <div className="flex space-x-2">
              <input
                id="join-code-input"
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6자리 대문자 코드 예: AF7X29"
                className="flex-grow px-3.5 py-3.5 bg-white border border-[#E8E0D0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C0392B]/20 focus:border-[#C0392B] text-sm text-[#2C3E50] placeholder:text-[#B0A69B] uppercase font-mono tracking-widest"
              />
              <button
                id="join-code-submit"
                type="submit"
                className="px-5 py-3.5 bg-[#2C3E50] text-[#FAF7F2] rounded-xl text-xs font-serif font-bold hover:bg-[#1A252F] hover:text-white transition-all cursor-pointer"
              >
                입장
              </button>
            </div>
            {error && (
              <p className="text-[11px] text-[#C0392B] font-bold mt-1 text-center">⚠️ {error}</p>
            )}
          </form>

          {/* MY REGISTERED ROOMS PANEL (나의 인연 사주방 기록서) */}
          <div className="w-full border border-[#D6CCBC] rounded-2xl bg-[#FCFAF6] text-left p-4.5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E8E0D0] pb-2.5">
              <div className="flex items-center space-x-2 text-[#2C3E50]">
                <BookOpen className="w-4 h-4 text-[#C0392B]" />
                <h3 className="font-serif text-xs font-bold uppercase tracking-wider">
                  {currentUser?.email === "lhs41977@gmail.com" ? "전체 인연방 대장 (운영자 모드)" : "나의 인연방 목록"}
                </h3>
              </div>
              {isGoogleUser && (
                <div className="flex items-center space-x-1.5">
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Google 연동 중 ({currentUser?.displayName})
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
                    className="flex items-center space-x-0.5 text-[9px] font-bold text-[#C0392B] hover:bg-[#C0392B] hover:text-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#C0392B] bg-[#FAF7F2] transition duration-150 cursor-pointer"
                  >
                    <LogOut className="w-2.5 h-2.5" />
                    <span>로그아웃</span>
                  </button>
                </div>
              )}
            </div>

            {currentUser?.email === "lhs41977@gmail.com" && (
              <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-xl text-[11px] text-purple-800 space-y-2">
                <p className="font-bold flex items-center">
                  <span className="mr-1">👑</span>
                  <span>최고 관리 권한 (Master Administrator) 활성화</span>
                </p>
                <p className="text-purple-700/90 leading-relaxed font-semibold">
                  lhs41977@gmail.com 계정으로 접속하셨습니다. 데이터베이스 내의 모든 생성된 사주 인연방 원격 모니터링 및 실시간 설문 & BM 정책 관리를 지원합니다.
                </p>
                <a
                  href="#/admin"
                  className="block w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-center text-xs tracking-wider transition shadow-sm cursor-pointer"
                >
                  🔒 실시간 설문 & BM 관리자 콘솔 입장
                </a>
              </div>
            )}

            {roomsLoading ? (
              <div className="py-6 text-center text-xs text-[#8C7B6E] flex justify-center items-center space-x-2 animate-pulse">
                <Compass className="w-4 h-4 animate-spin text-[#C0392B]" />
                <span>사주 명부를 살피는 중...</span>
              </div>
            ) : historyRooms.length > 0 ? (
              <div className="space-y-2">
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {historyRooms.map((room) => (
                    <div
                      key={room.code}
                      className="flex items-center justify-between p-3 rounded-xl border border-[#E8E0D0]/70 bg-white hover:bg-[#F2ECE0]/20 transition-all group duration-150"
                    >
                      <a
                        href={`#/room/${room.code}`}
                        className="flex-grow space-y-1 block"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              room.role === "admin"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : room.role === "owner"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {room.role === "admin" ? "운영자" : room.role === "owner" ? "방장" : "참가"}
                          </span>
                          <h4 className="text-xs font-bold text-[#2C3E50] group-hover:text-[#C0392B] transition-colors line-clamp-1">
                            {room.title}
                          </h4>
                        </div>
                        <p className="text-[10px] text-[#8C7B6E] font-mono tracking-wider">
                          코드: {room.code}
                        </p>
                      </a>
                      <div className="flex items-center space-x-1.5 ml-2 shrink-0">
                        <button
                          type="button"
                          title="목록에서 삭제"
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (confirm(`'${room.title}' 방을 목록에서 제외하시겠습니까?\n\n(참고사항: 실제 데이터가 삭제되는 것은 아니며, 본인의 브라우저 목록에서만 제외됩니다. 초대 코드를 입력해 언제든 재참여할 수 있습니다)`)) {
                              await removeRoomFromHistory(room.code);
                              setHistoryRooms((prev) => prev.filter((r) => r.code !== room.code));
                            }
                          }}
                          className="p-1.5 text-gray-300 hover:text-[#C0392B] rounded-lg hover:bg-red-50 transition duration-150 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-[#8C7B6E] group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Local Storage / Cache Troubleshooting Support Footer */}
                <div className="pt-2.5 mt-2 border-t border-[#E8E0D0]/50 flex justify-between items-center text-[10px] text-[#8C7B6E]">
                  <span>방 목록이 안 보이시나요?</span>
                  <div className="flex items-center space-x-2 font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setRoomsLoading(true);
                        setTimeout(() => {
                          window.location.reload();
                        }, 400);
                      }}
                      className="inline-flex items-center space-x-1 text-[#2C3E50] hover:text-[#C0392B] transition cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>목록 동기화</span>
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("⚠️ 모든 로컬 방 참여 기록 및 캐시를 완전히 비우시겠습니까?\n\n(방 자체가 삭제되지는 않으나, 다시 들어가기 위해서는 방의 6자리 초대 코드를 입력하셔야 합니다. 목록을 깨끗하게 정리할 때 아주 유용합니다)")) {
                          clearAllLocalCache();
                          alert("브라우저 로컬 데이터가 안전하게 모두 정제되었습니다. 첫 페이지로 이동합니다.");
                          window.location.reload();
                        }
                      }}
                      className="text-[#8C7B6E] hover:text-red-600 transition cursor-pointer"
                    >
                      전체 캐시 비우기
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-7 text-center space-y-2">
                <p className="text-[11px] text-[#8C7B6E] leading-loose">
                  아직 가입했거나 개설한 모임방 인연이 없습니다.<br />
                  새로운 방을 세우거나 초대 코드로 참례해 보세요.
                </p>
                {!isGoogleUser && (
                  <div className="pt-1.5 max-w-xs mx-auto">
                    <button
                      type="button"
                      disabled={loginLoading}
                      onClick={async () => {
                        try {
                          setLoginLoading(true);
                          await signInWithGoogle();
                        } catch (err) {
                          console.error("Popup login failed:", err);
                        } finally {
                          setLoginLoading(false);
                        }
                      }}
                      className="inline-flex items-center justify-center space-x-1 py-1.5 px-3 bg-white border border-[#D6CCBC] text-[10px] text-[#2C3E50] font-bold rounded-lg hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
                    >
                      <LogIn className="w-3 h-3 text-[#C0392B]" />
                      <span>{loginLoading ? "로그인 중..." : "구글 로그인으로 방 목록 복구하기"}</span>
                    </button>
                  </div>
                )}

                {/* Local Storage / Cache Troubleshooting Support Footer for Empty list */}
                <div className="pt-2.5 mt-2 border-t border-[#E8E0D0]/50 flex justify-end text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("⚠️ 모든 로컬 방 참여 기록 및 캐시를 완전히 비우시겠습니까?\n\n(기록 정리 및 캐시 불일치 해결 시 유용합니다)")) {
                        clearAllLocalCache();
                        alert("브라우저 캐시 데이터가 정제되었습니다.");
                        window.location.reload();
                      }
                    }}
                    className="font-semibold text-[#8C7B6E] hover:text-red-600 transition cursor-pointer"
                  >
                    브라우저 캐시 비우기
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Google Ads Slot / Fallback Premium Promo - Removed on landing page to strictly adhere to AdSense Policy */}
        </div>

        {/* ========================================================================= */}
        {/* PUBLISHER CONTENT & MYUNGRIHAK EDUCATIONAL GUIDE (Google AdSense Compliant) */}
        {/* ========================================================================= */}
        <div className="w-full mt-8 text-left space-y-6 border-t border-[#D6CCBC] pt-8">
          
          {/* Section 1: Introduction to Myungrihak & Group Chemistry */}
          <section className="bg-[#FCFAF6] border border-[#D6CCBC] p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center space-x-2 border-b border-[#E8E0D0] pb-2">
              <span className="text-lg">📜</span>
              <h3 className="font-serif text-sm font-bold text-[#2C3E50]">
                동양 전통 명리학(命理學)과 모임 궁합의 원리
              </h3>
            </div>
            <p className="text-xs text-[#5A4D41] leading-relaxed">
              <strong>인연사주</strong>는 태어난 연·월·일·시의 음양오행(陰陽五行) 생극제화(生克制化) 원리와 자미두수(紫微斗數) 명반을 종합적으로 분석하여, 단톡방, 동호회, 회사 팀 등 여러 사람이 모였을 때 발생하는 <strong>그룹 케미스트리(Group Chemistry)</strong>를 측정하는 혁신적인 동양학 서비스입니다.
            </p>
            <p className="text-xs text-[#5A4D41] leading-relaxed">
              수천 년 역사의 정통 만세력(萬歲曆) 알고리즘을 바탕으로 태어난 날의 천간(日干)을 중심으로 본연의 성향을 진단하며, 모임 내 구성원 간 1:1 상생(相生)·상극(相剋) 관계 및 십성(十星) 대운의 조화를 다각도로 규명합니다.
            </p>
          </section>

          {/* Section 2: Five Elements (오행: 木 火 土 金 水) Explanation */}
          <section className="bg-white border border-[#D6CCBC] p-5 rounded-2xl shadow-xs space-y-3">
            <h3 className="font-serif text-xs font-bold text-[#2C3E50] border-b border-[#E8E0D0] pb-2 uppercase tracking-wider flex items-center">
              <span className="text-[#C0392B] mr-1.5 font-bold">☯</span>
              음양오행(陰陽五行)의 상생과 상극 구조
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#5A4D41]">
              <div className="p-3 bg-[#FCFAF6] rounded-xl border border-[#E8E0D0]">
                <h4 className="font-bold text-[#C0392B] mb-1">🌿 목(木) & 화(火) 기운</h4>
                <p className="text-[11px] leading-relaxed">
                  <strong>목(木)</strong>은 창의성과 성장을, <strong>화(火)</strong>는 열정과 추진력을 상징합니다. 목생화(木生火) 원리로 목 기운이 화 기운을 뒷받침할 때 그룹 내 아이디어 발상과 기획력이 극대화됩니다.
                </p>
              </div>
              <div className="p-3 bg-[#FCFAF6] rounded-xl border border-[#E8E0D0]">
                <h4 className="font-bold text-[#8C6D31] mb-1">⛰️ 토(土) 기운</h4>
                <p className="text-[11px] leading-relaxed">
                  <strong>토(土)</strong>는 신뢰와 중재, 포용력을 의미합니다. 대립하는 기운을 완충하여 모임의 중심을 잡아주고 구성원 간 갈등을 조율하는 핵심적인 중재자 역할을 수행합니다.
                </p>
              </div>
              <div className="p-3 bg-[#FCFAF6] rounded-xl border border-[#E8E0D0]">
                <h4 className="font-bold text-[#4A6B82] mb-1">⚔️ 금(金) 기운</h4>
                <p className="text-[11px] leading-relaxed">
                  <strong>금(金)</strong>은 결단력과 규율, 결실을 상징합니다. 단호한 규칙 제정과 결단으로 모임의 실행력을 높이며 과감한 목표 달성을 이끌어냅니다.
                </p>
              </div>
              <div className="p-3 bg-[#FCFAF6] rounded-xl border border-[#E8E0D0]">
                <h4 className="font-bold text-[#2C3E50] mb-1">🌊 수(水) 기운</h4>
                <p className="text-[11px] leading-relaxed">
                  <strong>수(水)</strong>는 지혜, 유연성, 소통 능력을 뜻합니다. 수생목(水生木) 원리로 상대를 적시며 차분하게 아이디어를 심화시키고 공감대를 형성합니다.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Key Features & Usage Guide */}
          <section className="bg-[#FCFAF6] border border-[#D6CCBC] p-5 rounded-2xl shadow-xs space-y-3">
            <h3 className="font-serif text-xs font-bold text-[#2C3E50] border-b border-[#E8E0D0] pb-2 uppercase tracking-wider flex items-center">
              <span className="text-[#C0392B] mr-1.5 font-bold">✦</span>
              인연사주 핵심 가이드 및 활용법
            </h3>
            <ol className="list-decimal pl-4 space-y-2 text-xs text-[#5A4D41] leading-relaxed font-medium">
              <li>
                <strong>초대 링크 기반 그룹 참여:</strong> 카카오톡 단톡방이나 모임에 6자리 초대 코드를 공유하여 손쉽게 동료들을 초대할 수 있습니다.
              </li>
              <li>
                <strong>정밀한 음양오행 및 캐릭터 입명:</strong> 양력/음력 출생 정보와 정확한 시(時)를 입력하여 12간지 소동물 캐릭터와 개인 오행 분포를 도출합니다.
              </li>
              <li>
                <strong>1:1 궁합 매칭 및 시너지 매트릭스:</strong> 두 명씩 짝지은 속궁합, 대운 흐름, 성격 상충 및 상생 지수를 인공지능 명리학 엔진으로 상세히 분석합니다.
              </li>
              <li>
                <strong>개인정보 철저 보호:</strong> 모든 사주 정보는 안전하게 암호화 관리되며 언제든 방 탈퇴 및 데이터 삭제가 가능합니다.
              </li>
            </ol>
          </section>

          {/* Section 4: Comprehensive FAQ (자주 묻는 질문) */}
          <section className="bg-white border border-[#D6CCBC] p-5 rounded-2xl shadow-xs space-y-3">
            <h3 className="font-serif text-xs font-bold text-[#2C3E50] border-b border-[#E8E0D0] pb-2 uppercase tracking-wider flex items-center">
              <span className="text-[#C0392B] mr-1.5 font-bold">❓</span>
              자주 묻는 질문 (FAQ)
            </h3>

            <div className="space-y-3 text-xs text-[#5A4D41]">
              <div className="border-b border-[#F2ECE0] pb-2.5">
                <h4 className="font-bold text-[#2C3E50] mb-1">Q1. 출생 시(時)를 모르는 경우에도 사주 분석이 가능한가요?</h4>
                <p className="text-[11px] text-[#7A6B5D] leading-relaxed">
                  네, 출생 시를 모를 경우 '삼주(연·월·일)' 만으로도 음양오행과 일간(日干) 본질 분석을 기본 수행합니다. 다만, 더 정밀한 자미두수 명반과 1:1 속궁합 정밀 분석을 위해 가급적 태어난 시각을 확인하여 입력하시는 것을 권장합니다.
                </p>
              </div>

              <div className="border-b border-[#F2ECE0] pb-2.5">
                <h4 className="font-bold text-[#2C3E50] mb-1">Q2. 음력 생일 및 윤달 처리는 어떻게 이루어지나요?</h4>
                <p className="text-[11px] text-[#7A6B5D] leading-relaxed">
                  인연사주는 천문학 정통 만세력 데이터베이스를 탑재하고 있어 음력 생일 및 윤달(潤月) 날짜를 양력 정밀 시각으로 자동 전환하여 정확한 절기(節氣) 기준 사주 팔자를 도출합니다.
                </p>
              </div>

              <div className="border-b border-[#F2ECE0] pb-2.5">
                <h4 className="font-bold text-[#2C3E50] mb-1">Q3. 모임방에는 최대 몇 명까지 참여할 수 있나요?</h4>
                <p className="text-[11px] text-[#7A6B5D] leading-relaxed">
                  기본적으로 인원 제한 없이 여러 지인이 자유롭게 참여할 수 있으며, 2명 이상의 멤버가 모이면 1:1 사주 궁합과 그룹 오행 조화도가 실시간 업데이트됩니다.
                </p>
              </div>

              <div className="border-b border-[#F2ECE0] pb-2.5">
                <h4 className="font-bold text-[#2C3E50] mb-1">Q4. 작성한 개인 생년월일 정보는 어떻게 관리되나요?</h4>
                <p className="text-[11px] text-[#7A6B5D] leading-relaxed">
                  입력된 사주 및 운세 정보는 오직 궁합 리포트 생성 목적으로만 활용되며 외부 제3자에게 절대 제공되지 않습니다. 개인 프로필 수정 또는 방 삭제를 통해 언제든 완전 삭제할 수 있습니다.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Myungrihak Academic Column Archive (AdSense High Quality Publisher Content) */}
          <section className="bg-white border border-[#D6CCBC] p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E0D0] pb-2">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-[#C0392B]" />
                <h3 className="font-serif text-xs font-bold text-[#2C3E50] uppercase tracking-wider">
                  명리학 학술 칼럼 & 인연 연구소
                </h3>
              </div>
              <span className="text-[10px] text-[#8C7B6E] font-medium">정통 명리 칼럼 4편</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Column 1 */}
              <div 
                onClick={() => setPolicyModal("column1")}
                className="p-3.5 bg-[#FCFAF6] hover:bg-[#F7F2EA] border border-[#E8E0D0] rounded-xl cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between text-[10px] text-[#C0392B] font-bold">
                  <span>칼럼 01</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="text-xs font-bold text-[#2C3E50] group-hover:text-[#C0392B] transition-colors">
                  십성(十星)으로 해석하는 사회적 관계와 팀워크
                </h4>
                <p className="text-[11px] text-[#7A6B5D] line-clamp-2 leading-relaxed">
                  비견, 겁재, 식신, 상관, 편재, 정재, 편관, 정관, 편인, 정인 십성 체계가 조직과 모임 구성원의 행동 양식에 미치는 영향을 학술적으로 고찰합니다.
                </p>
              </div>

              {/* Column 2 */}
              <div 
                onClick={() => setPolicyModal("column2")}
                className="p-3.5 bg-[#FCFAF6] hover:bg-[#F7F2EA] border border-[#E8E0D0] rounded-xl cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between text-[10px] text-[#C0392B] font-bold">
                  <span>칼럼 02</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="text-xs font-bold text-[#2C3E50] group-hover:text-[#C0392B] transition-colors">
                  자미두수(紫微斗數) 명반과 대운의 인연 지형도
                </h4>
                <p className="text-[11px] text-[#7A6B5D] line-clamp-2 leading-relaxed">
                  북극성과 12궁 명반 배치, 그리고 10년 대운(大運)의 주기적 변화가 사람 사이의 궁합과 협력 시기에 미치는 파급력을 다룹니다.
                </p>
              </div>

              {/* Column 3 */}
              <div 
                onClick={() => setPolicyModal("column3")}
                className="p-3.5 bg-[#FCFAF6] hover:bg-[#F7F2EA] border border-[#E8E0D0] rounded-xl cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between text-[10px] text-[#C0392B] font-bold">
                  <span>칼럼 03</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="text-xs font-bold text-[#2C3E50] group-hover:text-[#C0392B] transition-colors">
                  음양오행(陰陽五行) 생극제화와 스트레스 완화
                </h4>
                <p className="text-[11px] text-[#7A6B5D] line-clamp-2 leading-relaxed">
                  목·화·토·금·수 오행의 치우침을 진단하고, 모임 구성원 상호 간 부족한 기운을 보완하는 오행 균형 조화 방법론입니다.
                </p>
              </div>

              {/* Column 4 */}
              <div 
                onClick={() => setPolicyModal("column4")}
                className="p-3.5 bg-[#FCFAF6] hover:bg-[#F7F2EA] border border-[#E8E0D0] rounded-xl cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between text-[10px] text-[#C0392B] font-bold">
                  <span>칼럼 04</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="text-xs font-bold text-[#2C3E50] group-hover:text-[#C0392B] transition-colors">
                  정통 만세력 알고리즘과 절기(節氣) 도출 고찰
                </h4>
                <p className="text-[11px] text-[#7A6B5D] line-clamp-2 leading-relaxed">
                  입춘, 경칩, 청명 등 절기 시각의 정밀 변환 알고리즘과 태어난 시간대별 자시(子時) 구분 기준을 상세 고찰합니다.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Legal & Policy Footer Links (AdSense Strictly Compliant) */}
          <div className="text-[11px] text-[#8C7B6E] leading-relaxed text-center py-4 border-t border-[#E8E0D0] space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-3 font-semibold text-[#5A4D41]">
              <button 
                onClick={() => setPolicyModal("privacy")}
                className="hover:text-[#C0392B] underline decoration-[#D6CCBC] underline-offset-2 transition cursor-pointer"
              >
                개인정보처리방침
              </button>
              <span className="text-[#D6CCBC]">|</span>
              <button 
                onClick={() => setPolicyModal("terms")}
                className="hover:text-[#C0392B] underline decoration-[#D6CCBC] underline-offset-2 transition cursor-pointer"
              >
                이용약관
              </button>
              <span className="text-[#D6CCBC]">|</span>
              <button 
                onClick={() => setPolicyModal("cookies")}
                className="hover:text-[#C0392B] underline decoration-[#D6CCBC] underline-offset-2 transition cursor-pointer"
              >
                광고 및 쿠키 정책
              </button>
            </div>
            <p className="text-[10px] text-[#8C7B6E]">
              인연사주는 정통 명리학 알고리즘과 자미두수 명반 분석을 결합한 인연 및 성향 리포트 서비스입니다.
            </p>
            <p className="text-[10px] text-[#8C7B6E]">
              Copyright © 인연사주 (Inyeon Saju). All Rights Reserved.
            </p>
          </div>

        </div>
      </div>

      {/* Floating Premium Shop Trigger */}
      <button
        type="button"
        onClick={() => {
          setIsShopOpen(true);
        }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 px-4 py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-serif font-extrabold text-[11px] tracking-wider rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-[0.97] transition-all cursor-pointer ring-4 ring-amber-100/50"
      >
        <Crown className="w-3.5 h-3.5 fill-amber-300 animate-pulse text-amber-200" />
        <span>인연 상점</span>
      </button>

      {/* Premium Shop Modal */}
      {isShopOpen && (
        <PremiumPaywall 
          isModal
          onClose={() => setIsShopOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* POLICY & ACADEMIC COLUMN MODALS (Google AdSense Mandatory Policy Compliance) */}
      {/* ========================================================================= */}
      {policyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-[#D6CCBC] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl text-left space-y-4 relative text-[#2C3E50]">
            <button 
              onClick={() => setPolicyModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition"
            >
              ✕
            </button>

            {/* Modal Content: Privacy Policy */}
            {policyModal === "privacy" && (
              <div className="space-y-3 text-xs leading-relaxed">
                <h2 className="text-base font-serif font-bold border-b border-[#E8E0D0] pb-2 text-[#C0392B]">
                  개인정보처리방침 (Privacy Policy)
                </h2>
                <p className="text-[#5A4D41]">
                  인연사주(이하 '회사' 또는 '서비스')는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 본 방침은 이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
                </p>
                <h3 className="font-bold text-[#2C3E50] mt-2">1. 수집하는 개인정보 항목 및 수집방법</h3>
                <p className="text-[#5A4D41]">
                  - 수집 항목: 성명(닉네임), 생년월일, 양력/음력 구분, 출생시각, 성별, 서비스 이용 기록, 접속 로그, 쿠키, IP 주소.<br />
                  - 수집 방법: 모임방 생성 및 참가 시 이용자 직접 입력.
                </p>
                <h3 className="font-bold text-[#2C3E50] mt-2">2. 개인정보의 수집 및 이용목적</h3>
                <p className="text-[#5A4D41]">
                  - 사주 명리학 알고리즘 분석, 오행 및 자미두수 리포트 제공, 1:1 속궁합 및 그룹 케미스트리 분석.<br />
                  - 서비스 이용에 따른 본인 확인 및 부정 이용 방지.
                </p>
                <h3 className="font-bold text-[#2C3E50] mt-2">3. Google AdSense 및 쿠키(Cookie) 관련 고지 (필수 항목)</h3>
                <div className="p-3 bg-[#FFFDF9] border border-[#E8E0D0] rounded-xl text-[#2C3E50] space-y-1">
                  <p className="font-bold text-[#C0392B]">[Google AdSense 맞춤형 광고 안내]</p>
                  <p className="text-[11px] leading-relaxed">
                    본 웹사이트는 구글(Google Inc.)을 포함한 제3자 광고 사업자의 Google AdSense 광고 서비스를 제공합니다. 구글 및 제3자 제공업체는 쿠키(Cookie) 기술을 활용하여 사용자의 과거 방문 기록 및 웹 검색 내역에 기반한 맞춤형 광고를 게재합니다. 사용자는 구글 광고 설정(<a href="https://adssettings.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">https://adssettings.google.com</a>)에서 맞춤형 광고 수신을 거부할 수 있습니다.
                  </p>
                </div>
                <h3 className="font-bold text-[#2C3E50] mt-2">4. 개인정보의 보유 및 파기</h3>
                <p className="text-[#5A4D41]">
                  이용자의 개인정보는 서비스 목적이 달성되거나 이용자가 방 탈퇴 및 데이터 삭제 요청 시 즉시 완전 파기됩니다.
                </p>
              </div>
            )}

            {/* Modal Content: Terms of Service */}
            {policyModal === "terms" && (
              <div className="space-y-3 text-xs leading-relaxed">
                <h2 className="text-base font-serif font-bold border-b border-[#E8E0D0] pb-2 text-[#C0392B]">
                  서비스 이용약관 (Terms of Service)
                </h2>
                <p className="text-[#5A4D41]">
                  본 약관은 인연사주 서비스가 제공하는 동양 명리학 기반 콘텐츠 및 모임 궁합 서비스의 이용조건 및 절차, 권리와 의무에 관한 사항을 규정합니다.
                </p>
                <h3 className="font-bold text-[#2C3E50] mt-2">제 1 조 (목적)</h3>
                <p className="text-[#5A4D41]">
                  본 서비스는 정통 동양 만세력 및 오행 생극제화 알고리즘에 기초하여 재미와 친목을 유도하는 그룹 케미스트리 정보 서비스를 제공함을 목적으로 합니다.
                </p>
                <h3 className="font-bold text-[#2C3E50] mt-2">제 2 조 (서비스의 제공 및 변경)</h3>
                <p className="text-[#5A4D41]">
                  서비스는 365일 24시간 제공을 원칙으로 하며, 시스템 점검 및 서버 개선이 필요한 경우 사전 고지 후 일시 중지될 수 있습니다. 본 서비스의 분석 결과는 명리학적 참고 자료이며 절대적 신념이나 법적 판단 근거가 될 수 없습니다.
                </p>
              </div>
            )}

            {/* Modal Content: Cookie & Ad Policy */}
            {policyModal === "cookies" && (
              <div className="space-y-3 text-xs leading-relaxed">
                <h2 className="text-base font-serif font-bold border-b border-[#E8E0D0] pb-2 text-[#C0392B]">
                  광고 및 쿠키(Cookie) 운영 정책
                </h2>
                <p className="text-[#5A4D41]">
                  인연사주는 사용자경험 개선 및 무료 서비스 유지를 위해 쿠키 기술과 구글 에드센스(Google AdSense) 플랫폼을 운용합니다.
                </p>
                <h3 className="font-bold text-[#2C3E50] mt-2">쿠키란 무엇인가요?</h3>
                <p className="text-[#5A4D41]">
                  쿠키는 사용자가 웹사이트 방문 시 브라우저에 저장되는 소규모 텍스트 파일로, 빠른 로그인 상태 유지 및 맞춤형 콘텐츠 제공에 활용됩니다.
                </p>
                <h3 className="font-bold text-[#2C3E50] mt-2">쿠키 제어 방법</h3>
                <p className="text-[#5A4D41]">
                  사용자는 웹브라우저 옵션 설정을 통해 쿠키 허용 여부를 선택하거나 모든 쿠키 저장 시마다 확인을 거치도록 설정할 수 있습니다.
                </p>
              </div>
            )}

            {/* Modal Content: Column 1 */}
            {policyModal === "column1" && (
              <div className="space-y-3 text-xs leading-relaxed">
                <span className="text-[10px] font-bold text-[#C0392B] bg-[#FCFAF6] px-2 py-0.5 border border-[#E8E0D0] rounded-sm">
                  명리학 학술 칼럼 #01
                </span>
                <h2 className="text-base font-serif font-bold border-b border-[#E8E0D0] pb-2 text-[#2C3E50]">
                  십성(十星)으로 해석하는 사회적 관계와 팀워크 심리학
                </h2>
                <p className="text-[#5A4D41]">
                  동양명리학의 십성(十星)은 일간(日干)을 기준으로 타 오행과의 음양 관계를 분류한 10가지 성향 지표입니다.
                </p>
                <p className="text-[#5A4D41]">
                  - <strong>비견(比肩) & 겁재(劫財):</strong> 주관이 뚜렷하고 동료와의 선의의 경쟁을 즐기는 리더십 및 도전 정신.<br />
                  - <strong>식신(食神) & 상관(傷官):</strong> 풍부한 표현력과 기획력, 창의적인 브레인스토밍을 이끄는 아이디어 생산자.<br />
                  - <strong>편재(偏財) & 정재(正財):</strong> 치밀한 재무 감각, 계획성, 현실적인 리소스 분배 능력.<br />
                  - <strong>편관(偏官) & 정관(正官):</strong> 규율 준수, 조직적 결속력, 과감한 결단과 실행력.<br />
                  - <strong>편인(偏印) & 정인(正印):</strong> 원리 탐구, 깊은 공감력, 지속적인 학습과 멘토링 역량.
                </p>
                <p className="text-[#5A4D41]">
                  모임 내 십성의 균형이 이루어질 때 아이디어(식상) → 결실(재성) → 규율(관성) → 학습(인성)으로 이어지는 이상적인 팀 시너지가 발휘됩니다.
                </p>
              </div>
            )}

            {/* Modal Content: Column 2 */}
            {policyModal === "column2" && (
              <div className="space-y-3 text-xs leading-relaxed">
                <span className="text-[10px] font-bold text-[#C0392B] bg-[#FCFAF6] px-2 py-0.5 border border-[#E8E0D0] rounded-sm">
                  명리학 학술 칼럼 #02
                </span>
                <h2 className="text-base font-serif font-bold border-b border-[#E8E0D0] pb-2 text-[#2C3E50]">
                  자미두수(紫微斗數) 명반과 대운의 인연 지형도
                </h2>
                <p className="text-[#5A4D41]">
                  자미두수(紫微斗數)는 북극성과 108개 별의 배치를 기반으로 인군의 운명을 조망하는 정통 동양 점성학 체계입니다. 명궁(命宮), 형제궁(兄弟宮), 부처궁(夫妻宮), 노복궁(奴僕宮)의 주성 배치는 타인과의 연대 방식과 소통 유형을 극명하게 보여줍니다.
                </p>
                <p className="text-[#5A4D41]">
                  특히 10년 단위 대운(大運)의 흐름 속에서 화록(化祿), 화권(化權), 화과(化科), 화기(化忌) 사화(四化)의 변화는 특정 시기에 모임 내에서 협업이 번창하거나 오해가 생기는 원인을 명확하게 설명해 줍니다.
                </p>
              </div>
            )}

            {/* Modal Content: Column 3 */}
            {policyModal === "column3" && (
              <div className="space-y-3 text-xs leading-relaxed">
                <span className="text-[10px] font-bold text-[#C0392B] bg-[#FCFAF6] px-2 py-0.5 border border-[#E8E0D0] rounded-sm">
                  명리학 학술 칼럼 #03
                </span>
                <h2 className="text-base font-serif font-bold border-b border-[#E8E0D0] pb-2 text-[#2C3E50]">
                  음양오행(陰陽五行) 생극제화와 스트레스 완화
                </h2>
                <p className="text-[#5A4D41]">
                  우주 자연의 기본 다섯 기운인 목(木), 화(火), 토(土), 금(金), 수(水)는 서로를 돕는 상생(相生)과 서로를 견제하는 상극(相剋)의 유기적 순환 고리를 형성합니다.
                </p>
                <p className="text-[#5A4D41]">
                  어느 한 오행이 과다하거나 결핍될 경우 관계의 불균형이 발생할 수 있습니다. 수(水) 기운이 부족하여 건조하고 과열된 조직에는 유연성과 소통 능력을 지닌 수 기운의 인재가 완충 역할을 수행하며, 금(金) 기운이 과다하여 지나치게 엄격한 분위기에는 화(火) 및 수(水) 기운이 부드러운 조화를 가져다줍니다.
                </p>
              </div>
            )}

            {/* Modal Content: Column 4 */}
            {policyModal === "column4" && (
              <div className="space-y-3 text-xs leading-relaxed">
                <span className="text-[10px] font-bold text-[#C0392B] bg-[#FCFAF6] px-2 py-0.5 border border-[#E8E0D0] rounded-sm">
                  명리학 학술 칼럼 #04
                </span>
                <h2 className="text-base font-serif font-bold border-b border-[#E8E0D0] pb-2 text-[#2C3E50]">
                  정통 만세력 알고리즘과 절기(節氣) 도출 고찰
                </h2>
                <p className="text-[#5A4D41]">
                  사주팔자를 판단할 때 가장 핵심이 되는 부분은 태양이 경도 15도 간격으로 지나가는 24절기(節氣)의 정밀 시각을 정확히 도출하는 것입니다.
                </p>
                <p className="text-[#5A4D41]">
                  인연사주는 한국천문연구원 표준시 데이터 및 정통 천문 만세력 공식을 탑재하여 음력 생일 및 윤달을 명확하게 환산합니다. 야자시(夜子時) 및 조자시(朝子時) 구분 로직까지 정밀 계산하여 태어난 날의 일간(日干) 오행을 오차 없이 특정합니다.
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-[#E8E0D0] flex justify-end">
              <button
                type="button"
                onClick={() => setPolicyModal(null)}
                className="px-4 py-2 bg-[#2C3E50] text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

