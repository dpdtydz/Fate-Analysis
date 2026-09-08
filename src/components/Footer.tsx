import React, { useState } from "react";
import { Instagram } from "lucide-react";
import LegalModal from "./LegalModal";

export default function Footer() {
  const [modalTab, setModalTab] = useState<"terms" | "privacy" | "cookies" | null>(null);

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
