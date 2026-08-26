import React, { useState, useEffect } from "react";

interface LoadingOverlayProps {
  message?: string;
}

const defaultPhrases = [
  "오행의 생극을 헤아리는 중...",
  "정통 만세력을 계산하는 중...",
  "인연 궁합을 엮는 중...",
  "사주 원국을 해독하는 중...",
  "명식의 조화와 기운을 살피는 중..."
];

export default function LoadingOverlay({ message }: LoadingOverlayProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % defaultPhrases.length);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  const displayMessage = message || defaultPhrases[phraseIndex];

  return (
    <div className="fixed inset-0 bg-[#F5F2EB]/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn">
      <div className="w-full max-w-sm bg-[#FAF7F2] border border-[#E8E0D0] rounded-xl p-8 shadow-md relative overflow-hidden">
        
        {/* Border graphic ornament */}
        <div className="absolute top-0 inset-x-0 h-1 bg-[#C0392B]" />

        {/* Traditional Yin-Yang Spinning loader */}
        {/* 기존 div 교체 */}
        <div className="flex justify-center mb-6">
          <svg
            className="w-20 h-20 animate-spin"
            style={{ animationDuration: "3s" }}
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="50" r="48" fill="#FAF7F2" />
            <path
              d="M50,2 a48,48,0,0,1,0,96 a24,24,0,0,1,0,-48 a24,24,0,0,0,0,-48 z"
              fill="#C0392B"
            />
            <circle cx="50" cy="26" r="9"  fill="#FAF7F2" />
            <circle cx="50" cy="74" r="9"  fill="#C0392B" />
            <circle cx="50" cy="26" r="4"  fill="#C0392B" />
            <circle cx="50" cy="74" r="4"  fill="#FAF7F2" />
            <circle cx="50" cy="50" r="48" fill="none" stroke="#C0392B" strokeWidth="2" />
          </svg>
        </div>

        {/* Loading text */}
        <h4 className="font-serif text-lg font-bold text-[#2C3E50] tracking-tight mb-2">
          천문 해석 중
        </h4>
        <p className="text-sm font-medium text-[#C0392B] min-h-[22px] font-sans transition-all duration-300 animate-pulse">
          {displayMessage}
        </p>

        {/* Explanation footnote */}
        <div className="mt-8 pt-4 border-t border-[#E8E0D0] text-[10px] text-[#A69B8F] leading-normal tracking-tight">
          동양 정통 만세력 계산 및 오행 생극제화 알고리즘으로 <br />
          인연 케미스트리를 정밀하게 풀이하고 있습니다.
        </div>
      </div>
    </div>
  );
}
