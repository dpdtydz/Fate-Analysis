import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { auth, db, getRoomHistory, signInWithGoogle, signOutUser, removeRoomFromHistory, clearAllLocalCache } from "../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { LogIn, LogOut, Compass, Sparkles, BookOpen, ChevronRight, UserCheck, Trash2, RefreshCw } from "lucide-react";

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

        </div>
      </div>
    </Layout>
  );
}

