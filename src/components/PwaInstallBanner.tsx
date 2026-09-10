import React, { useState, useEffect } from "react";
import { Download, Share2, X, PlusSquare, Smartphone, Sparkles } from "lucide-react";

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone PWA mode
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // 2. Check if user dismissed the banner recently (within 3 days)
    const dismissedAt = localStorage.getItem("inyeon_pwa_dismissed_at");
    if (dismissedAt) {
      const diffDays = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (diffDays < 3) {
        return;
      }
    }

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios|opt|edgios/.test(ua);

    if (isIosDevice) {
      setIsIos(true);
      // Show banner after 2.5 seconds on iOS Safari
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2500);
      return () => clearTimeout(timer);
    }

    // 4. Android / Chrome beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Delay showing banner slightly for better initial reading experience
      setTimeout(() => {
        setIsOpen(true);
      }, 2000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem("inyeon_pwa_dismissed_at", Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      setIsOpen(false);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || !isOpen) return null;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md animate-fade-in">
      <div className="bg-[#1c1d21]/95 text-white backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/15 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-seal flex items-center justify-center text-white shadow-md shrink-0">
              <span className="font-serif font-bold text-lg">緣</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white">인연의 사주 홈 화면 앱 추가</h4>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-seal text-white font-semibold">
                  추천
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                주소창 없이 전체화면으로 빠르게 접속하고 모임 알림을 확인하세요
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* iOS vs Android Action Guide */}
        {isIos ? (
          <div className="bg-white/10 rounded-xl p-2.5 text-[11px] text-slate-200 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#007aff] shrink-0" />
            <p className="leading-tight">
              하단 <strong>[공유]</strong> 버튼을 누른 후 <strong>[홈 화면에 추가 <PlusSquare className="w-3 h-3 inline pb-0.5" />]</strong>를 선택해 주세요.
            </p>
          </div>
        ) : deferredPrompt ? (
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-2.5 bg-seal hover:bg-seal-deep text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>원클릭 앱으로 홈 화면에 설치하기</span>
          </button>
        ) : (
          <div className="bg-white/10 rounded-xl p-2.5 text-[11px] text-slate-200 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="leading-tight">
              브라우저 메뉴(⋮)에서 <strong>[앱 설치]</strong> 또는 <strong>[홈 화면에 추가]</strong>를 눌러주세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
