import React, { useState } from "react";
import LegalModal from "./LegalModal";

export default function Footer() {
  const [modalTab, setModalTab] = useState<"terms" | "privacy" | "cookies" | null>(null);

  return (
    <footer className="px-5 py-6 border-t border-[#EFE9DF] bg-[#FAF8F5] text-center text-[#8C827A] text-xs">
      <div className="max-w-xl mx-auto space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <span>동양 정통 명리학(命理學) 및 오행 생극제화 알고리즘</span>
          <div className="flex items-center justify-center gap-3 text-[#7A6B5D] font-medium flex-wrap">
            <button
              type="button"
              onClick={() => setModalTab("privacy")}
              className="hover:text-[#C0392B] underline decoration-[#D6CCBC] underline-offset-2 transition cursor-pointer"
            >
              개인정보처리방침
            </button>
            <span className="text-[#D6CCBC]">|</span>
            <button
              type="button"
              onClick={() => setModalTab("terms")}
              className="hover:text-[#C0392B] underline decoration-[#D6CCBC] underline-offset-2 transition cursor-pointer"
            >
              이용약관
            </button>
            <span className="text-[#D6CCBC]">|</span>
            <button
              type="button"
              onClick={() => setModalTab("cookies")}
              className="hover:text-[#C0392B] underline decoration-[#D6CCBC] underline-offset-2 transition cursor-pointer"
            >
              광고 및 쿠키 정책
            </button>
          </div>
        </div>
        
        <p className="text-[10px] text-[#A3998E] leading-relaxed">
          생성된 모임방 및 참여 명식 데이터는 <strong>30일 경과 후 데이터베이스에서 자동 파기</strong>됩니다.
        </p>
        
        <p className="text-[9px] text-[#B0A79E]">
          Copyright © 인연사주 (Inyeon Saju). All Rights Reserved.
        </p>
      </div>

      <LegalModal
        isOpen={modalTab !== null}
        initialTab={modalTab || "terms"}
        onClose={() => setModalTab(null)}
      />
    </footer>
  );
}
