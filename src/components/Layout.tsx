import React from "react";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showHomeButton?: boolean;
}

export default function Layout({ children, title, showHomeButton = false }: LayoutProps) {
  return (
    <div id="layout-root" className="min-h-screen bg-[#E8E0D0] py-0 sm:py-8 flex flex-col items-center justify-start font-sans">
      {/* Outer framing for a realistic smart terminal frame */}
      <div className="w-full max-w-md min-h-screen sm:min-h-[850px] bg-[#FAF7F2] text-[#2C3E50] border-x border-[#D6CCBC] sm:border sm:rounded-[24px] sm:shadow-2xl flex flex-col justify-between overflow-hidden relative">
        
        {/* Decorative corner line watermark from the Artistic Flair design */}
        <div className="absolute top-0 right-0 p-4 opacity-15 pointer-events-none select-none z-0">
          <svg width="80" height="80" viewBox="0 0 100 100">
            <path d="M10 10L90 90M90 10L10 90" stroke="#2C3E50" strokeWidth="0.8" />
          </svg>
        </div>

        {/* Minimal traditional Korean ceiling ornament (단청 배선 테두리) */}
        <div className="h-1.5 w-full bg-[#C0392B] z-10" />

        {/* Dynamic header with "Artistic Flair" tracking and typography */}
        <header className="px-6 py-5 border-b border-[#E8E0D0] flex items-center justify-between bg-[#FDFBF7]/90 backdrop-blur-xs z-10 relative">
          <div className="flex flex-col items-start text-left">
            <span className="text-[9px] tracking-[0.25em] uppercase text-[#8C7B6E] font-bold leading-none mb-1">
              THE TIES THAT BIND
            </span>
            <div className="flex items-center space-x-1.5">
              <span className="text-[#C0392B] font-serif text-lg font-bold">☯</span>
              <h1 className="font-serif text-base font-bold tracking-tight text-[#2C3E50] mt-0.5">
                {title || "인연사주"}
              </h1>
            </div>
          </div>
          {showHomeButton && (
            <a
              href="#/"
              className="text-[11px] font-semibold text-[#C0392B] hover:bg-[#C0392B] hover:text-white px-3 py-1.5 rounded-lg border border-[#C0392B] bg-[#FAF7F2] tracking-tight transition duration-200"
            >
              처음으로
            </a>
          )}
        </header>

        {/* Content Body */}
        <main className="flex-grow p-6 flex flex-col justify-start relative z-10">
          {children}
        </main>

        {/* Footnote matching user requirements and Artistic Flair styles */}
        <footer className="p-5 border-t border-[#E8E0D0] text-center bg-[#FDFBF7]/80 relative z-10">
          <p className="text-[10px] text-[#2C3E50]/60 tracking-tight leading-relaxed">
            본 서비스는 재미로 보는 사주 궁합 콘텐츠입니다.
            <br />
            생성된 방과 데이터는 개인 정보 보호를 위해 <strong>30일 후 자동 파기</strong>됩니다.
          </p>
        </footer>
      </div>
    </div>
  );
}
