import React from "react";
import Layout from "./Layout";
import { Sparkles, Users } from "lucide-react";

export default function GatewayView() {
  return (
    <Layout maxWidth="2xl" showHomeButton={false}>
      <div className="py-4 sm:py-7 space-y-6 animate-fade-in text-center">
        {/* Header Title with Oriental Accent */}
        <div className="space-y-2 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5EE] border border-[#E8DFC8]/70 text-[#C0392B] text-xs font-serif font-bold shadow-3xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C0392B] animate-pulse"></span>
            <span>천문 만세력 × 오행 케미스트리</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight">
            인연사주 <span className="text-[#8C827A] font-normal text-lg sm:text-xl">因緣四柱</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#6B5E52] max-w-md mx-auto leading-relaxed">
            나를 온전히 마주하는 사주 분석과 소중한 인연들의 궁합을 확인해 보세요.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 2-SPLIT ORIENTAL ART GATEWAY CARDS */}
        {/* ========================================================================= */}
        <div className="space-y-4 pt-1">
          
          {/* ======================================================================= */}
          {/* 1. Upper Card: 나만의 소울 사주 카드 보러가기 (동양화 수묵채색화 테마) */}
          {/* ======================================================================= */}
          <a
            href="#/my-saju"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = "#/my-saju";
            }}
            className="group relative block w-full bg-gradient-to-b from-[#FAF6EF] via-[#F4EDE0] to-[#E9DFCE] hover:from-[#FFFBF4] hover:to-[#E4D7C2] active:scale-[0.99] transition-all duration-300 rounded-3xl p-8 sm:p-11 shadow-sm hover:shadow-md cursor-pointer border border-[#DFD3BE] overflow-hidden text-center"
          >
            {/* Background Oriental Ink Wash Art Layer */}
            <div className="absolute inset-0 pointer-events-none opacity-45 group-hover:opacity-60 transition-opacity duration-300">
              <svg
                viewBox="0 0 600 240"
                preserveAspectRatio="none"
                className="w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Sun / Moon Gradient */}
                  <linearGradient id="orientalSun" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C0392B" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#D35400" stopOpacity="0.1" />
                  </linearGradient>

                  {/* Mountain Ink Wash Gradient 1 */}
                  <linearGradient id="inkMountain1" x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="#2C3E50" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#2C3E50" stopOpacity="0.02" />
                  </linearGradient>

                  {/* Mountain Ink Wash Gradient 2 */}
                  <linearGradient id="inkMountain2" x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="#1E293B" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#1E293B" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Cloud Gradient */}
                  <linearGradient id="cloudGold" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.35" />
                    <stop offset="50%" stopColor="#E6C280" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.1" />
                  </linearGradient>
                </defs>

                {/* Oriental Celestial Glowing Sun/Moon Disk */}
                <circle cx="500" cy="70" r="58" fill="url(#orientalSun)" />

                {/* Auspicious Oriental Clouds (전통 운문) */}
                <path
                  d="M 50,70 Q 70,55 90,70 Q 110,50 135,65 Q 155,55 175,70 Q 145,85 110,80 Q 75,90 50,70 Z"
                  fill="url(#cloudGold)"
                  opacity="0.6"
                />
                <path
                  d="M 420,110 Q 440,95 460,110 Q 480,92 505,107 Q 525,97 545,112 Q 515,127 480,122 Q 445,130 420,110 Z"
                  fill="url(#cloudGold)"
                  opacity="0.5"
                />

                {/* Flying Cranes (선학 / 仙鶴) */}
                <g opacity="0.35" transform="translate(390, 45) scale(0.65)">
                  {/* Crane 1 */}
                  <path
                    d="M 0,15 Q 12,0 24,10 Q 36,0 48,15 Q 26,12 24,25 Q 22,12 0,15 Z"
                    fill="#1E293B"
                  />
                  {/* Crane 2 */}
                  <path
                    d="M 45,-15 Q 54,-25 64,-17 Q 74,-25 84,-15 Q 66,-17 64,-7 Q 62,-17 45,-15 Z"
                    fill="#1E293B"
                    transform="scale(0.8)"
                  />
                </g>

                {/* Distant Mountain Peak Layer (원경 수묵 산맥) */}
                <path
                  d="M 0,240 L 0,150 Q 80,120 150,145 Q 220,110 320,155 Q 420,90 510,135 Q 560,115 600,140 L 600,240 Z"
                  fill="url(#inkMountain2)"
                />

                {/* Forefront Ink Mountain Layer (근경 수묵 산맥) */}
                <path
                  d="M 0,240 L 0,185 Q 90,145 180,180 Q 280,140 370,175 Q 470,130 550,170 Q 580,160 600,180 L 600,240 Z"
                  fill="url(#inkMountain1)"
                />
              </svg>
            </div>

            {/* Hanji Frame & Seal Design */}
            <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
              {/* Traditional Red Lacquer Seal (낙관 / 命) */}
              <div className="w-9 h-9 rounded-md bg-[#C0392B] text-white flex items-center justify-center font-serif text-sm font-bold shadow-sm border border-[#962D22]/60 select-none">
                命
              </div>

              {/* Oriental Eyebrow */}
              <div className="inline-flex items-center gap-1.5 text-[11px] font-serif font-bold text-[#8C6239] bg-[#FFFFFF]/70 px-3 py-0.5 rounded-full border border-[#E2D6C0]/80 shadow-3xs">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                <span>나만의 4주 8자 만세력과 소울 카드</span>
              </div>

              {/* Main Headline */}
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E293B] group-hover:text-[#C0392B] transition-colors leading-tight tracking-tight">
                나만의 소울<br className="sm:hidden" /> 사주 카드 보러가기
              </h2>

              <p className="text-xs sm:text-sm text-[#5C5046] max-w-md mx-auto leading-relaxed pt-0.5">
                생년월일시 입력으로 본질 오행, 고유 소울 동물, 기운 밸런스와 오늘의 일진을 즉시 확인합니다.
              </p>
            </div>
          </a>

          {/* ======================================================================= */}
          {/* 2. Lower Card: 모임 그룹 궁합 (동양화 인연·소나무 케미 테마) */}
          {/* ======================================================================= */}
          <a
            href="#/group"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = "#/group";
            }}
            className="group relative block w-full bg-gradient-to-b from-[#F7F4EE] via-[#EFEAE0] to-[#E5DFD4] hover:from-[#FAF8F3] hover:to-[#DFD7CB] active:scale-[0.99] transition-all duration-300 rounded-3xl p-8 sm:p-11 shadow-sm hover:shadow-md cursor-pointer border border-[#DCD3C4] overflow-hidden text-center"
          >
            {/* Background Oriental Harmony Art Layer */}
            <div className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-55 transition-opacity duration-300">
              <svg
                viewBox="0 0 600 240"
                preserveAspectRatio="none"
                className="w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Moon Halo Gradient */}
                  <linearGradient id="harmonyMoon" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#B8860B" stopOpacity="0.05" />
                  </linearGradient>

                  {/* Harmony Blue/Pine Gradient */}
                  <linearGradient id="inkPine" x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="#2E4053" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2E4053" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Full Moon of Harmony (인연을 비추는 보름달) */}
                <circle cx="100" cy="70" r="50" fill="url(#harmonyMoon)" />

                {/* Constellation & Connection Lines (인연의 연결망) */}
                <g opacity="0.3" stroke="#8C6239" strokeWidth="1" strokeDasharray="3,3">
                  <line x1="80" y1="50" x2="140" y2="90" />
                  <line x1="140" y1="90" x2="220" y2="60" />
                  <line x1="220" y1="60" x2="300" y2="100" />
                  <line x1="300" y1="100" x2="380" y2="70" />
                  <line x1="380" y1="70" x2="480" y2="90" />
                  <circle cx="80" cy="50" r="2.5" fill="#8C6239" />
                  <circle cx="140" cy="90" r="2.5" fill="#8C6239" />
                  <circle cx="220" cy="60" r="2.5" fill="#8C6239" />
                  <circle cx="300" cy="100" r="2.5" fill="#8C6239" />
                  <circle cx="380" cy="70" r="2.5" fill="#8C6239" />
                  <circle cx="480" cy="90" r="2.5" fill="#8C6239" />
                </g>

                {/* Stylized Ink Pine & Hills (소나무와 능선) */}
                <path
                  d="M 0,240 L 0,165 Q 120,135 240,165 Q 360,125 480,160 Q 540,145 600,165 L 600,240 Z"
                  fill="url(#inkPine)"
                />
              </svg>
            </div>

            {/* Hanji Frame & Seal Design */}
            <div className="relative z-10 flex flex-col items-center justify-center space-y-3">
              {/* Traditional Red Lacquer Seal (낙관 / 緣) */}
              <div className="w-9 h-9 rounded-md bg-[#2C3E50] text-white flex items-center justify-center font-serif text-sm font-bold shadow-sm border border-[#1A252F]/60 select-none">
                緣
              </div>

              {/* Oriental Eyebrow */}
              <div className="inline-flex items-center gap-1.5 text-[11px] font-serif font-bold text-[#5C5046] bg-[#FFFFFF]/70 px-3 py-0.5 rounded-full border border-[#D6CEC0]/80 shadow-3xs">
                <Users className="w-3 h-3 text-[#2C3E50]" />
                <span>친구·동료들과 함께 보는 12간지 케미 지도</span>
              </div>

              {/* Main Headline */}
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E293B] group-hover:text-[#C0392B] transition-colors leading-tight tracking-tight">
                모임 그룹 궁합
              </h2>

              <p className="text-xs sm:text-sm text-[#5C5046] max-w-md mx-auto leading-relaxed pt-0.5">
                친구, 팀원들과 방을 열고 12간지 상생·상극 궁합도와 그룹 케미스트리를 한눈에 분석합니다.
              </p>
            </div>
          </a>

        </div>

        {/* Footer info snippet */}
        <div className="pt-2 text-center">
          <p className="text-[11px] text-[#8C827A] font-serif">
            한국천문연구원 정밀 만세력 데이터 기반 · 태양시 경도 시차 보정
          </p>
        </div>
      </div>
    </Layout>
  );
}
