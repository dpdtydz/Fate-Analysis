import React, { useState, useEffect } from "react";
import { WifiOff, CheckCircle2 } from "lucide-react";

export default function NetworkStatusBar() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true;
  });
  const [showBackOnlineNotice, setShowBackOnlineNotice] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnlineNotice(true);
      const t = setTimeout(() => setShowBackOnlineNotice(false), 3000);
      return () => clearTimeout(t);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnlineNotice(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showBackOnlineNotice) return null;

  return (
    <aside aria-label="네트워크 연결 상태" className="fixed top-0 left-0 right-0 z-[100] animate-fade-in pointer-events-none">
      {!isOnline && (
        <div className="bg-amber-600/95 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-md backdrop-blur-xs">
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <span>인터넷 연결 끊김 · 로컬에 저장된 최근 데이터로 표시합니다.</span>
        </div>
      )}

      {isOnline && showBackOnlineNotice && (
        <div className="bg-emerald-600/95 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-md backdrop-blur-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>네트워크가 다시 연결되었습니다.</span>
        </div>
      )}
    </aside>
  );
}
