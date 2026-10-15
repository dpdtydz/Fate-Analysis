import React, { useState, useEffect } from "react";
import { Instagram } from "lucide-react";
import LegalModal from "./LegalModal";
import { isViewingNoExpireRoom } from "../utils/roomPolicy";

export default function Footer() {
  const [modalTab, setModalTab] = useState<"terms" | "privacy" | "cookies" | null>(null);

  // 보관 정책 예외 방에서는 "30일 뒤 자동 삭제" 안내를 숨긴다.
  // 그 방에는 적용되지 않는 정책이라, 그대로 두면 사용자가 잘못 알게 된다.
  const [hideRetentionNotice, setHideRetentionNotice] = useState(() => isViewingNoExpireRoom());
  useEffect(() => {
    const sync = () => setHideRetentionNotice(isViewingNoExpireRoom());
    sync(); // 해시 라우팅은 마운트 시점과 실제 경로가 어긋날 수 있다
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return (
    <footer className="px-5 py-6 border-t border-line text-center text-ink-faint text-xs">
      <div className="max-w-xl mx-auto space-y-2.5">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a
            href="https://www.instagram.com/inyeonssaju"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-ink-soft hover:text-ink transition-colors"
          >
            <Instagram className="w-3.5 h-3.5 text-[#E1306C]" />
            <span>@inyeonssaju</span>
          </a>
          <span className="text-line">·</span>
          <button
            type="button"
            onClick={() => setModalTab("privacy")}
            className="hover:text-ink underline decoration-line underline-offset-2 transition-colors cursor-pointer"
          >
            개인정보처리방침
          </button>
          <button
            type="button"
            onClick={() => setModalTab("terms")}
            className="hover:text-ink underline decoration-line underline-offset-2 transition-colors cursor-pointer"
          >
            이용약관
          </button>
          <button
            type="button"
            onClick={() => setModalTab("cookies")}
            className="hover:text-ink underline decoration-line underline-offset-2 transition-colors cursor-pointer"
          >
            광고 및 쿠키 정책
          </button>
        </div>

        {!hideRetentionNotice && (
          <p className="leading-relaxed">
            모임방과 참여 명식 데이터는 30일이 지나면 자동 삭제됩니다.
          </p>
        )}

        <p>© 인연사주 (Inyeon Saju)</p>
      </div>

      <LegalModal
        isOpen={modalTab !== null}
        initialTab={modalTab || "terms"}
        onClose={() => setModalTab(null)}
      />
    </footer>
  );
}
