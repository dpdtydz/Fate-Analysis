import React, { useState, useEffect } from "react";
import { backgroundAnalysisManager, AnalysisNotificationEvent } from "../utils/backgroundAnalysisManager";
import { Sparkles, ArrowRight, X, Bell } from "lucide-react";

export default function GlobalAnalysisAlert() {
  const [activeAlert, setActiveAlert] = useState<AnalysisNotificationEvent | null>(null);

  useEffect(() => {
    const unsubscribe = backgroundAnalysisManager.subscribe((event) => {
      // Check if user is already on that exact group view
      const currentHash = window.location.hash || "";
      const targetHash = `#/room/${event.roomCode}/group`;

      // If user is already looking at this exact screen, we don't need a blocking floating card
      if (currentHash === targetHash) {
        return;
      }

      setActiveAlert(event);
    });

    return () => unsubscribe();
  }, []);

  if (!activeAlert) return null;

  const handleNavigate = () => {
    window.location.hash = `#/room/${activeAlert.roomCode}/group`;
    setActiveAlert(null);
  };

  const handleDismiss = () => {
    setActiveAlert(null);
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md animate-fade-in">
      <div className="bg-surface/95 backdrop-blur-md border-2 border-seal/30 rounded-2xl p-4 shadow-xl text-left flex items-start justify-between gap-3 select-none">
        <div className="flex items-start space-x-3 min-w-0">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-seal/10 text-seal shrink-0 mt-0.5">
            <Bell className="w-5 h-5 text-seal animate-bounce" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-seal opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-seal"></span>
            </span>
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-seal bg-seal/10 px-2 py-0.5 rounded-md">
                분석 완료
              </span>
              <span className="text-[11px] text-ink-faint">방금 전</span>
            </div>
            <h4 className="text-sm font-semibold text-ink leading-snug truncate">
              {activeAlert.roomTitle}
            </h4>
            <p className="text-xs text-ink-soft leading-relaxed">
              모임 멤버 전원의 1:1 인연과 4대 영역 궁합 분석이 모두 끝났어요!
            </p>
            <div className="pt-1.5">
              <button
                onClick={handleNavigate}
                className="inline-flex items-center space-x-1 px-3.5 py-1.5 bg-seal hover:bg-seal-deep text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <span>결과 보러 가기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-ink-faint hover:text-ink p-1 rounded-lg hover:bg-sunken transition-colors shrink-0 cursor-pointer"
          aria-label="알림 닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
