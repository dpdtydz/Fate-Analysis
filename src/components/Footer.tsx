import React, { useState } from "react";
import LegalModal from "./LegalModal";

export default function Footer() {
  const [modalTab, setModalTab] = useState<"terms" | "privacy" | "cookies" | null>(null);

  return (
    <footer className="px-5 py-6 border-t border-line text-center text-ink-faint text-xs">
      <div className="max-w-xl mx-auto space-y-2.5">
        <div className="flex items-center justify-center gap-3 flex-wrap">
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

        <p className="leading-relaxed">
          모임방과 참여 명식 데이터는 30일이 지나면 자동 삭제됩니다.
        </p>

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
