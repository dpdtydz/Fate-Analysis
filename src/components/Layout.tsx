import React, { useState, useEffect } from "react";
import { Sparkles, Home, ChevronLeft, User as UserIcon, LogOut, Chrome, ArrowUpRight, UserX, AlertTriangle, X, CheckCircle2, Settings, ShieldCheck } from "lucide-react";
import { auth, getUserMembershipInfo, signOutUser, deleteUserAccount, isAdminUser } from "../lib/firebase";
import AuthModal from "./AuthModal";
import UpgradeToSocialModal from "./UpgradeToSocialModal";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  maxWidth?: "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
  headerRight?: React.ReactNode;
}

export default function Layout({
  children,
  title,
  subtitle,
  showHomeButton = false,
  showBackButton = false,
  onBack,
  maxWidth = "3xl",
  headerRight,
}: LayoutProps) {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  const membership = getUserMembershipInfo(currentUser);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim() !== "탈퇴") {
      setDeleteError("'탈퇴'를 정확히 입력해 주세요.");
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");
    try {
      const res = await deleteUserAccount();
      setDeleteSuccess(res.message);
      setTimeout(() => {
        setIsDeleteModalOpen(false);
        setDeleteConfirmText("");
        setDeleteSuccess("");
        window.location.hash = "#/";
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setDeleteError(err.message || "탈퇴 처리 중 오류가 발생했습니다.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const maxWidthClass = {
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
  }[maxWidth];

  return (
    <div
      id="layout-root"
      className="min-h-screen bg-[#F7F5F0] text-[#1E293B] flex flex-col items-center justify-start font-sans antialiased selection:bg-[#C0392B]/15 selection:text-[#9E2A2B]"
    >
      {/* Top Subtle Traditional Roofline Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#9E2A2B] via-[#C0392B] to-[#9E2A2B]" />

      {/* Main Responsive App Container */}
      <div className={`w-full ${maxWidthClass} min-h-screen sm:min-h-0 sm:my-6 sm:mb-12 bg-white sm:rounded-2xl sm:shadow-[0_4px_24px_rgba(44,62,80,0.06)] border-x sm:border border-[#E7E1D6] flex flex-col justify-between transition-all duration-200`}>
        
        {/* Modern Editorial Header */}
        <header className="px-4 sm:px-7 py-3 sm:py-4 border-b border-[#EFE9DF] bg-[#FCFAF6] flex items-center justify-between relative">
          <div className="flex items-center space-x-3">
            {showBackButton ? (
              <button
                type="button"
                onClick={onBack ? onBack : () => window.history.back()}
                className="w-8 h-8 -ml-1.5 rounded-lg flex items-center justify-center text-[#5A524A] hover:text-[#1E293B] hover:bg-[#EFE9DF] transition-colors"
                title="뒤로 가기"
                aria-label="뒤로 가기"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <a
                href="#/"
                className="flex items-center space-x-2.5 group"
              >
                {/* Traditional In-yeon (인연) Red Seal Stamp */}
                <div className="w-8 h-8 rounded-lg border border-[#C0392B]/40 bg-[#FDF3F1] flex items-center justify-center text-[#C0392B] font-serif text-sm font-bold shadow-2xs group-hover:scale-105 transition-transform select-none">
                  緣
                </div>
                <div>
                  <span className="block text-[10px] text-[#8C827A] font-medium tracking-wide uppercase">
                    {subtitle || "오행 조화와 사주 궁합"}
                  </span>
                  <span className="font-serif text-base sm:text-lg font-bold tracking-tight text-[#1E293B] leading-none block mt-0.5">
                    {title || "인연사주"}
                  </span>
                </div>
              </a>
            )}

            {showBackButton && (
              <div>
                <span className="block text-[10px] text-[#8C827A] font-medium tracking-wide">
                  {subtitle || "오행 조화와 사주 궁합"}
                </span>
                <h1 className="font-serif text-base sm:text-lg font-bold tracking-tight text-[#1E293B] leading-none mt-0.5">
                  {title || "인연사주"}
                </h1>
              </div>
            )}
          </div>

          {/* Right Action Area: Navigation & Auth Membership */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            
            {/* Quick Tab Links */}
            <div className="hidden xs:flex items-center space-x-1 mr-1">
              <a
                href="#/my-saju"
                className="px-2 py-1 text-[11px] font-serif font-bold text-[#4F443B] hover:text-[#C0392B] hover:bg-[#F2ECE0] rounded-lg transition flex items-center gap-1"
                title="내 사주·운세 바로가기"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>내 사주</span>
              </a>
              <a
                href="#/group"
                className="px-2 py-1 text-[11px] font-serif font-bold text-[#4F443B] hover:text-[#C0392B] hover:bg-[#F2ECE0] rounded-lg transition flex items-center gap-1"
                title="모임·그룹 궁합 바로가기"
              >
                <Home className="w-3 h-3 text-[#C0392B]" />
                <span>모임</span>
              </a>
            </div>

            {headerRight}

            {/* Membership Badge & User Control */}
            {membership.isGuest ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center space-x-1 text-xs font-serif font-bold text-[#5A524A] hover:text-[#1E293B] hover:bg-[#F2ECE0] px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#E2D8C7] bg-[#FCFAF7] transition active:scale-95 shadow-2xs"
              >
                <UserIcon className="w-3.5 h-3.5 text-amber-700" />
                <span>로그인 / 가입</span>
              </button>
            ) : membership.isSocialVerified ? (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="inline-flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-serif font-bold bg-amber-50 border border-amber-200 text-amber-900 px-2 py-1 rounded-lg leading-none">
                  <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                  <span className="inline-block truncate max-w-[60px] sm:max-w-[100px] align-middle">{membership.displayName}</span>
                  <span className="bg-amber-200/80 text-amber-950 text-[9px] px-1 py-0.5 rounded whitespace-nowrap leading-none align-middle">정회원</span>
                </span>
                
                {/* Settings dropdown menu with 44px+ hitboxes, tooltips and distinct warning styles */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-800 rounded-lg hover:bg-[#F2ECE0]/50 transition cursor-pointer"
                    title="설정 및 계정 관리"
                    aria-label="설정 및 계정 관리"
                  >
                    <Settings className="w-4 h-4 text-[#4F443B]" />
                  </button>
                  {isSettingsOpen && (
                    <>
                      {/* Invisible full screen overlay to handle click away smoothly */}
                      <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)} />
                      {/* Floating panel */}
                      <div className="absolute right-0 mt-2 w-48 bg-[#FCFAF7] border border-[#E2D8C7] rounded-xl shadow-lg py-1 z-50 animate-fade-in text-left">
                        {isAdminUser(currentUser) && (
                          <>
                            <a
                              href="#/admin"
                              onClick={() => setIsSettingsOpen(false)}
                              className="w-full min-h-[44px] px-4 py-2 text-left text-xs text-amber-900 bg-amber-50/80 hover:bg-amber-100/80 flex items-center gap-2.5 transition cursor-pointer font-bold"
                              title="관리자 전용 관제 콘솔"
                            >
                              <ShieldCheck className="w-4 h-4 text-amber-600" />
                              <span>관리자 콘솔</span>
                            </a>
                            <div className="h-px bg-[#EFE9DF] my-1" />
                          </>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            setIsSettingsOpen(false);
                            try {
                              await signOutUser();
                              window.location.hash = "#/";
                            } catch (err) {
                              console.error("Sign-out error:", err);
                            }
                          }}
                          className="w-full min-h-[44px] px-4 py-2 text-left text-xs text-[#5A524A] hover:text-[#1E293B] hover:bg-[#F2ECE0] flex items-center gap-2.5 transition cursor-pointer"
                          title="로그아웃"
                          aria-label="로그아웃"
                        >
                          <LogOut className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">로그아웃</span>
                        </button>
                        <div className="h-px bg-[#EFE9DF] my-1" />
                        <button
                          type="button"
                          onClick={() => {
                            setIsSettingsOpen(false);
                            setDeleteConfirmText("");
                            setDeleteError("");
                            setDeleteSuccess("");
                            setIsDeleteModalOpen(true);
                          }}
                          className="w-full min-h-[44px] px-4 py-2 text-left text-xs text-red-600 hover:text-red-700 hover:bg-red-50/60 flex items-center gap-2.5 transition font-bold cursor-pointer"
                          title="회원탈퇴"
                          aria-label="회원탈퇴"
                        >
                          <UserX className="w-4 h-4 text-red-600" />
                          <span>회원탈퇴</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* Regular Email Member */
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="inline-flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-serif font-bold bg-gray-100 border border-gray-300 text-gray-700 px-2 py-1 rounded-lg leading-none">
                  <UserIcon className="w-3 h-3 text-gray-500 shrink-0" />
                  <span className="inline-block truncate max-w-[60px] sm:max-w-[100px] align-middle">{membership.displayName}</span>
                  <span className="bg-gray-200 text-gray-800 text-[9px] px-1 py-0.5 rounded whitespace-nowrap leading-none align-middle">일반</span>
                </span>

                {/* Upgrade Nudge Button */}
                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[10.5px] font-serif font-bold bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 text-white px-2 sm:px-2.5 py-1 rounded-lg shadow-2xs transition active:scale-95 animate-pulse whitespace-nowrap"
                  title="Google 계정 연동하고 방 개설 및 쿠폰 혜택 받기"
                  aria-label="Google 계정 연동하고 방 개설 및 쿠폰 혜택 받기"
                >
                  <Sparkles className="w-3 h-3 text-yellow-300" />
                  <span className="hidden xs:inline">정회원</span>
                  <span>승급</span>
                </button>

                {/* Settings dropdown menu with 44px+ hitboxes, tooltips and distinct warning styles */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-800 rounded-lg hover:bg-[#F2ECE0]/50 transition cursor-pointer"
                    title="설정 및 계정 관리"
                    aria-label="설정 및 계정 관리"
                  >
                    <Settings className="w-4 h-4 text-[#4F443B]" />
                  </button>
                  {isSettingsOpen && (
                    <>
                      {/* Invisible full screen overlay to handle click away smoothly */}
                      <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)} />
                      {/* Floating panel */}
                      <div className="absolute right-0 mt-2 w-48 bg-[#FCFAF7] border border-[#E2D8C7] rounded-xl shadow-lg py-1 z-50 animate-fade-in text-left">
                        {isAdminUser(currentUser) && (
                          <>
                            <a
                              href="#/admin"
                              onClick={() => setIsSettingsOpen(false)}
                              className="w-full min-h-[44px] px-4 py-2 text-left text-xs text-amber-900 bg-amber-50/80 hover:bg-amber-100/80 flex items-center gap-2.5 transition cursor-pointer font-bold"
                              title="관리자 전용 관제 콘솔"
                            >
                              <ShieldCheck className="w-4 h-4 text-amber-600" />
                              <span>관리자 콘솔</span>
                            </a>
                            <div className="h-px bg-[#EFE9DF] my-1" />
                          </>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            setIsSettingsOpen(false);
                            try {
                              await signOutUser();
                              window.location.hash = "#/";
                            } catch (err) {
                              console.error("Sign-out error:", err);
                            }
                          }}
                          className="w-full min-h-[44px] px-4 py-2 text-left text-xs text-[#5A524A] hover:text-[#1E293B] hover:bg-[#F2ECE0] flex items-center gap-2.5 transition cursor-pointer"
                          title="로그아웃"
                          aria-label="로그아웃"
                        >
                          <LogOut className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">로그아웃</span>
                        </button>
                        <div className="h-px bg-[#EFE9DF] my-1" />
                        <button
                          type="button"
                          onClick={() => {
                            setIsSettingsOpen(false);
                            setDeleteConfirmText("");
                            setDeleteError("");
                            setDeleteSuccess("");
                            setIsDeleteModalOpen(true);
                          }}
                          className="w-full min-h-[44px] px-4 py-2 text-left text-xs text-red-600 hover:text-red-700 hover:bg-red-50/60 flex items-center gap-2.5 transition font-bold cursor-pointer"
                          title="회원탈퇴"
                          aria-label="회원탈퇴"
                        >
                          <UserX className="w-4 h-4 text-red-600" />
                          <span>회원탈퇴</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {showHomeButton && (
              <a
                href="#/"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-[#5A524A] hover:text-[#1E293B] hover:bg-[#F2ECE0] px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#E2D8C7] bg-[#FCFAF7] tracking-tight transition active:scale-95 shadow-2xs"
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">처음으로</span>
              </a>
            )}
          </div>
        </header>

        {/* Content Body with Responsive Padding */}
        <main className="flex-grow p-4 sm:p-7 flex flex-col justify-start relative z-10">
          {children}
        </main>

        {/* Modern Editorial Footnote */}
        <Footer />
      </div>

      {/* Auth Modal for Sign In / Sign Up */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Upgrade to Social Modal for Regular Email Members */}
      <UpgradeToSocialModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        triggerReason="profile_upgrade"
      />

      {/* Account Deletion (Withdrawal) Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FAF8F5] border border-[#E2D8C7] w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 text-left relative">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-[#8C827A] hover:text-[#1E293B] p-1 rounded-lg hover:bg-[#EFE9DF] transition"
              title="닫기"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1E293B]">회원 탈퇴</h3>
                <p className="text-xs text-[#8C827A]">계정 및 개인 데이터 영구 파기</p>
              </div>
            </div>

            <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 text-xs text-red-900 leading-relaxed space-y-2">
              <p className="font-bold">⚠️ 탈퇴 전 반드시 확인해 주세요:</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-red-800">
                <li>저장된 내 사주 명식 및 프로필 정보가 즉시 완전 삭제됩니다.</li>
                <li>보유 중인 1회 확인권 및 쿠폰 내역이 영구 소멸되며 복구되지 않습니다.</li>
                <li>탈퇴 후 동일한 아이디로 재가입하셔도 이전 데이터는 복원되지 않습니다.</li>
              </ul>
            </div>

            {deleteSuccess ? (
              <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-300 p-3 rounded-xl flex items-center gap-2 animate-fade-in font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{deleteSuccess} 잠시 후 메인 화면으로 이동합니다...</span>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-[#5A524A]">
                  탈퇴를 확인하기 위해 아래 입력란에 <span className="text-red-600 font-bold">'탈퇴'</span>를 입력해 주세요.
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => {
                    setDeleteConfirmText(e.target.value);
                    if (deleteError) setDeleteError("");
                  }}
                  placeholder="'탈퇴' 입력"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5CBBF] bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                />

                {deleteError && (
                  <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
                    {deleteError}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-serif font-bold text-xs rounded-xl transition"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || deleteConfirmText.trim() !== "탈퇴"}
                    className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-serif font-bold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {deleteLoading ? "처리 중..." : "회원 탈퇴 완료"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

