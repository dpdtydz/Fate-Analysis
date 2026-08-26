import React, { useState, useEffect } from "react";
import { Home, ChevronLeft, LogOut, UserX, X, CheckCircle2, Settings, ShieldCheck } from "lucide-react";
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

  const settingsMenu = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        className="min-w-[40px] min-h-[40px] flex items-center justify-center text-ink-faint hover:text-ink rounded-xl hover:bg-sunken transition-colors cursor-pointer"
        title="설정 및 계정 관리"
        aria-label="설정 및 계정 관리"
      >
        <Settings className="w-4 h-4" />
      </button>
      {isSettingsOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-surface rounded-xl shadow-lg py-1 z-50 text-left">
            {isAdminUser(currentUser) && (
              <>
                <a
                  href="#/admin"
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full min-h-[44px] px-4 py-2 text-left text-xs font-semibold text-ink hover:bg-sunken flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-ink-faint" />
                  <span>관리자 콘솔</span>
                </a>
                <div className="h-px bg-line my-1" />
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
              className="w-full min-h-[44px] px-4 py-2 text-left text-xs text-ink-soft hover:text-ink hover:bg-sunken flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-ink-faint" />
              <span>로그아웃</span>
            </button>
            <div className="h-px bg-line my-1" />
            <button
              type="button"
              onClick={() => {
                setIsSettingsOpen(false);
                setDeleteConfirmText("");
                setDeleteError("");
                setDeleteSuccess("");
                setIsDeleteModalOpen(true);
              }}
              className="w-full min-h-[44px] px-4 py-2 text-left text-xs text-seal hover:bg-sunken flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <UserX className="w-4 h-4" />
              <span>회원탈퇴</span>
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div
      id="layout-root"
      className="min-h-screen bg-paper text-ink flex flex-col font-sans antialiased selection:bg-seal/15"
    >
      {/* 상단 인주 라인 */}
      <div className="h-0.5 w-full bg-seal" />

      {/* 헤더 — 가로줄 하나로만 구분 */}
      <header className="w-full border-b border-line">
        <div className={`${maxWidthClass} mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            {showBackButton ? (
              <button
                type="button"
                onClick={onBack ? onBack : () => window.history.back()}
                className="w-9 h-9 -ml-1.5 rounded-xl flex items-center justify-center text-ink-soft hover:text-ink hover:bg-sunken transition-colors"
                title="뒤로 가기"
                aria-label="뒤로 가기"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <a href="#/" className="flex items-center space-x-2.5">
                {/* 낙관 — 브랜드 마크 */}
                <span className="w-8 h-8 rounded-md bg-seal text-white font-serif text-sm flex items-center justify-center select-none">
                  緣
                </span>
                <span className="font-serif text-base sm:text-lg font-semibold tracking-tight text-ink leading-none">
                  {title || "인연사주"}
                </span>
              </a>
            )}

            {showBackButton && (
              <div>
                {subtitle && (
                  <span className="block text-xs text-ink-faint">{subtitle}</span>
                )}
                <h1 className="font-serif text-base sm:text-lg font-semibold tracking-tight text-ink leading-none mt-0.5">
                  {title || "인연사주"}
                </h1>
              </div>
            )}
          </div>

          {/* Right Action Area */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <nav className="hidden sm:flex items-center mr-1">
              <a
                href="#/my-saju"
                className="px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:text-ink hover:bg-sunken rounded-xl transition-colors"
              >
                내 사주
              </a>
              <a
                href="#/group"
                className="px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:text-ink hover:bg-sunken rounded-xl transition-colors"
              >
                모임 궁합
              </a>
            </nav>

            {headerRight}

            {membership.isGuest ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-xs font-semibold text-ink bg-sunken hover:bg-line px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                로그인
              </button>
            ) : (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs bg-sunken text-ink-soft px-2.5 py-1.5 rounded-xl leading-none">
                  <span className="inline-block truncate max-w-[64px] sm:max-w-[100px] align-middle font-medium">
                    {membership.displayName}
                  </span>
                  <span className="text-ink-faint whitespace-nowrap leading-none">
                    {membership.isSocialVerified ? "정회원" : "일반"}
                  </span>
                </span>

                {!membership.isSocialVerified && (
                  <button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="text-xs font-semibold text-ink bg-sunken hover:bg-line px-2.5 py-2 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                    title="Google 계정을 연동하면 방을 만들 수 있습니다"
                  >
                    정회원 전환
                  </button>
                )}

                {settingsMenu}
              </div>
            )}

            {showHomeButton && (
              <a
                href="#/"
                className="inline-flex items-center space-x-1 text-xs font-medium text-ink-soft hover:text-ink hover:bg-sunken px-2.5 py-1.5 rounded-xl transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">처음으로</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Content Body */}
      <main className={`${maxWidthClass} w-full mx-auto flex-grow px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-start relative z-10`}>
        {children}
      </main>

      <Footer />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <UpgradeToSocialModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        triggerReason="profile_upgrade"
      />

      {/* Account Deletion Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface w-full max-w-md rounded-xl p-6 shadow-lg space-y-4 text-left relative">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-ink-faint hover:text-ink p-1 rounded-xl hover:bg-sunken transition-colors"
              title="닫기"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-serif text-lg font-semibold text-ink">회원 탈퇴</h3>
              <p className="text-xs text-ink-faint mt-1">계정과 개인 데이터를 영구 삭제합니다.</p>
            </div>

            <div className="bg-sunken rounded-xl p-4 text-sm text-ink-soft leading-relaxed space-y-2">
              <p className="font-semibold text-ink">탈퇴하면 아래 데이터가 삭제됩니다.</p>
              <ul className="list-disc pl-4 space-y-1 text-xs">
                <li>저장된 내 사주 명식과 프로필 정보</li>
                <li>보유 중인 확인권·쿠폰 (복구되지 않습니다)</li>
                <li>같은 계정으로 재가입해도 이전 데이터는 복원되지 않습니다.</li>
              </ul>
            </div>

            {deleteSuccess ? (
              <div className="text-xs text-ink bg-sunken p-3 rounded-xl flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-ink-soft shrink-0" />
                <span>{deleteSuccess} 잠시 후 메인 화면으로 이동합니다.</span>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <label className="block text-xs font-medium text-ink-soft">
                  확인을 위해 아래 입력란에 <span className="text-seal font-semibold">'탈퇴'</span>를 입력해 주세요.
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => {
                    setDeleteConfirmText(e.target.value);
                    if (deleteError) setDeleteError("");
                  }}
                  placeholder="탈퇴"
                  className="w-full px-4 py-3 rounded-xl bg-sunken text-sm focus:outline-none focus:ring-1 focus:ring-ink"
                />

                {deleteError && (
                  <p className="text-xs text-seal font-medium">{deleteError}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 py-3 px-4 bg-sunken hover:bg-line text-ink font-semibold text-sm rounded-xl transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || deleteConfirmText.trim() !== "탈퇴"}
                    className="flex-1 py-3 px-4 bg-seal hover:bg-seal-deep disabled:opacity-40 text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {deleteLoading ? "처리 중..." : "탈퇴하기"}
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
