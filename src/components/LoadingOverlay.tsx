import React, { useState, useEffect } from "react";

interface LoadingOverlayProps {
  message?: string;
}

const defaultPhrases = [
  "오행의 생극을 헤아리는 중...",
  "만세력을 계산하는 중...",
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
    <div className="fixed inset-0 bg-paper/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn">
      <div className="w-full max-w-sm bg-surface rounded-xl p-8 shadow-lg relative">

        {/* Traditional Yin-Yang Spinning loader */}
        {/* 기존 div 교체 */}
        <div className="flex justify-center mb-6">
          <svg
            className="w-20 h-20 animate-spin"
            style={{ animationDuration: "3s" }}
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="50" r="48" fill="var(--color-paper)" />
            <path
              d="M50,2 a48,48,0,0,1,0,96 a24,24,0,0,1,0,-48 a24,24,0,0,0,0,-48 z"
              fill="var(--color-ink)"
            />
            <circle cx="50" cy="26" r="9"  fill="var(--color-paper)" />
            <circle cx="50" cy="74" r="9"  fill="var(--color-ink)" />
            <circle cx="50" cy="26" r="4"  fill="var(--color-seal)" />
            <circle cx="50" cy="74" r="4"  fill="var(--color-paper)" />
            <circle cx="50" cy="50" r="48" fill="none" stroke="var(--color-ink)" strokeWidth="2" />
          </svg>
        </div>

        {/* Loading text */}
        <h4 className="font-serif text-lg font-semibold text-ink tracking-tight mb-2">
          천문 해석 중
        </h4>
        <p className="text-sm text-ink-soft min-h-[22px] font-sans transition-all duration-300">
          {displayMessage}
        </p>

        {/* Explanation footnote */}
        <div className="mt-8 pt-4 border-t border-line text-xs text-ink-faint leading-relaxed">
          만세력 계산과 오행 생극제화 분석으로 <br />
          인연 궁합을 풀이하고 있어요.
        </div>
      </div>
    </div>
  );
}
