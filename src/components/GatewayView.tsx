import React from "react";
import Layout from "./Layout";
import { ChevronRight } from "lucide-react";

/**
 * 수묵 장면 1 — 아침 해와 산 (命 · 내 사주)
 * design.md §1: 먹 단색 농담 + 인주 한 점(해). 원근은 농도로.
 */
function DawnMountainScene() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 800 460"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gwA-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBFBF9" />
          <stop offset="100%" stopColor="#F1F1ED" />
        </linearGradient>
        <radialGradient id="gwA-sun" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#C24A3C" />
          <stop offset="75%" stopColor="#B3382C" />
          <stop offset="100%" stopColor="#B3382C" stopOpacity="0.92" />
        </radialGradient>
        <linearGradient id="gwA-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1C1D21" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#1C1D21" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gwA-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1C1D21" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#1C1D21" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="gwA-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1C1D21" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#1C1D21" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="gwA-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBFBF9" stopOpacity="0" />
          <stop offset="55%" stopColor="#FBFBF9" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FBFBF9" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="800" height="460" fill="url(#gwA-sky)" />

      {/* 인주 한 점 — 아침 해 */}
      <circle cx="565" cy="112" r="70" fill="#B3382C" opacity="0.07" />
      <circle cx="565" cy="112" r="52" fill="url(#gwA-sun)" />

      {/* 새 두엇 */}
      <g stroke="#1C1D21" strokeOpacity="0.55" strokeWidth="2.4" fill="none" strokeLinecap="round">
        <path d="M452 148 q 9 -9 18 0 q 9 -9 18 0" />
        <path d="M492 175 q 7 -7 14 0 q 7 -7 14 0" opacity="0.7" />
      </g>

      {/* 원경 — 옅은 먹 */}
      <path
        d="M0 258 C 90 232, 150 250, 228 222 C 300 198, 362 234, 432 218 C 520 198, 602 240, 690 222 C 738 213, 778 228, 800 221 L800 460 L0 460 Z"
        fill="url(#gwA-far)"
      />

      <rect x="0" y="238" width="800" height="72" fill="url(#gwA-mist)" />

      {/* 중경 — 봉우리 */}
      <path
        d="M0 336 C 56 302, 104 318, 152 278 C 192 244, 228 262, 272 300 C 336 352, 420 306, 484 318 C 560 332, 642 300, 720 326 C 758 338, 784 330, 800 334 L800 460 L0 460 Z"
        fill="url(#gwA-mid)"
      />

      <rect x="0" y="330" width="800" height="64" fill="url(#gwA-mist)" />

      {/* 근경 능선 */}
      <path
        d="M270 460 C 350 420, 452 398, 560 392 C 664 386, 744 410, 800 398 L800 460 Z"
        fill="url(#gwA-near)"
      />

      {/* 전경 벼랑 */}
      <path
        d="M0 460 L0 372 C 42 362, 86 378, 126 396 C 158 410, 186 432, 206 460 Z"
        fill="#1C1D21"
        opacity="0.72"
      />

      {/* 벼랑 위 소나무 — 몸통 */}
      <path
        d="M84 384 C 92 362, 78 344, 96 318 C 104 306, 100 296, 110 286"
        stroke="#1C1D21"
        strokeOpacity="0.88"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M94 344 C 110 336, 124 336, 140 328"
        stroke="#1C1D21"
        strokeOpacity="0.8"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* 솔잎 층 — 납작한 관 */}
      <g fill="#1C1D21">
        <path d="M52 292 Q 88 272 124 288 Q 158 276 186 292 Q 150 306 116 300 Q 82 308 52 292 Z" opacity="0.85" />
        <path d="M96 322 Q 128 306 158 318 Q 184 310 204 322 Q 174 334 146 328 Q 118 336 96 322 Z" opacity="0.75" />
        <path d="M40 318 Q 62 306 84 314 Q 70 326 52 324 Q 44 324 40 318 Z" opacity="0.7" />
      </g>
    </svg>
  );
}

/**
 * 수묵 장면 2 — 달밤의 학 한 쌍 (緣 · 모임 궁합)
 * design.md §1: 먹 단색 + 인주 한 점(단정丹頂). 물에 비친 달로 '이어짐'을 그린다.
 */
function MoonCraneScene() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 800 460"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gwB-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7F8F6" />
          <stop offset="100%" stopColor="#EFF0EC" />
        </linearGradient>
        <linearGradient id="gwB-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1C1D21" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#1C1D21" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gwB-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1C1D21" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#1C1D21" stopOpacity="0.02" />
        </linearGradient>
        <radialGradient id="gwB-moonhalo" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="800" height="460" fill="url(#gwB-sky)" />

      {/* 보름달 */}
      <circle cx="212" cy="122" r="86" fill="url(#gwB-moonhalo)" />
      <circle cx="212" cy="122" r="56" fill="#FFFFFF" />
      <circle cx="212" cy="122" r="56" fill="none" stroke="#1C1D21" strokeOpacity="0.28" strokeWidth="1.5" />

      {/* 원경 능선 */}
      <path
        d="M0 286 C 110 262, 210 278, 320 258 C 430 240, 540 270, 650 252 C 710 243, 760 256, 800 248 L800 460 L0 460 Z"
        fill="url(#gwB-far)"
      />
      <path
        d="M420 460 C 500 400, 600 372, 700 368 C 744 366, 778 374, 800 372 L800 460 Z"
        fill="url(#gwB-mid)"
      />

      {/* 학 한 쌍 — 달을 향해 나란히 */}
      <g transform="translate(470 160)">
        {/* 앞선 학 */}
        <g>
          <path d="M-6 -2 C 8 -32 42 -44 68 -38 C 46 -24 24 -8 4 2 Z" fill="#1C1D21" opacity="0.78" />
          <path d="M2 6 C 18 24 46 32 66 26 C 46 20 26 12 10 2 Z" fill="#1C1D21" opacity="0.5" />
          <ellipse cx="0" cy="2" rx="21" ry="7.5" fill="#1C1D21" opacity="0.82" />
          <path d="M-18 0 C -32 -4 -44 -6 -56 -13" stroke="#1C1D21" strokeOpacity="0.82" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <circle cx="-57" cy="-14" r="3.4" fill="#1C1D21" opacity="0.85" />
          <path d="M-60 -14 L -71 -12" stroke="#1C1D21" strokeOpacity="0.8" strokeWidth="2.2" strokeLinecap="round" />
          {/* 인주 한 점 — 단정(丹頂) */}
          <circle cx="-57" cy="-17.5" r="2.4" fill="#B3382C" />
          <path d="M17 3 C 27 5 36 10 43 17 C 32 14 23 10 15 7 Z" fill="#1C1D21" opacity="0.9" />
          <path d="M10 8 L 34 17 M13 10 L 37 21" stroke="#1C1D21" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
        </g>
        {/* 뒤따르는 학 */}
        <g transform="translate(118 58) scale(0.72)">
          <path d="M-6 -2 C 8 -32 42 -44 68 -38 C 46 -24 24 -8 4 2 Z" fill="#1C1D21" opacity="0.62" />
          <path d="M2 6 C 18 24 46 32 66 26 C 46 20 26 12 10 2 Z" fill="#1C1D21" opacity="0.4" />
          <ellipse cx="0" cy="2" rx="21" ry="7.5" fill="#1C1D21" opacity="0.66" />
          <path d="M-18 0 C -32 -4 -44 -6 -56 -13" stroke="#1C1D21" strokeOpacity="0.66" strokeWidth="3.4" strokeLinecap="round" fill="none" />
          <circle cx="-57" cy="-14" r="3.4" fill="#1C1D21" opacity="0.7" />
          <path d="M-60 -14 L -71 -12" stroke="#1C1D21" strokeOpacity="0.64" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M17 3 C 27 5 36 10 43 17 C 32 14 23 10 15 7 Z" fill="#1C1D21" opacity="0.72" />
          <path d="M10 8 L 34 17 M13 10 L 37 21" stroke="#1C1D21" strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      </g>

      {/* 물결과 달그림자 */}
      <g stroke="#1C1D21" strokeLinecap="round" fill="none">
        <path d="M40 404 H 250" strokeOpacity="0.14" strokeWidth="2" />
        <path d="M110 422 H 360" strokeOpacity="0.1" strokeWidth="2" />
        <path d="M300 440 H 520" strokeOpacity="0.08" strokeWidth="2" />
        <path d="M560 418 H 760" strokeOpacity="0.1" strokeWidth="2" />
        <path d="M178 410 H 216 M226 410 H 244" strokeOpacity="0.3" strokeWidth="2.5" />
        <path d="M188 424 H 212 M220 424 H 232" strokeOpacity="0.22" strokeWidth="2.5" />
        <path d="M196 438 H 224" strokeOpacity="0.15" strokeWidth="2.5" />
      </g>

      {/* 전경 갈대 */}
      <g stroke="#1C1D21" strokeLinecap="round" fill="none">
        <path d="M744 460 C 740 428 748 402 764 382" strokeOpacity="0.6" strokeWidth="2.6" />
        <path d="M764 382 q 12 -8 22 -4 q -12 2 -18 10" strokeOpacity="0.6" strokeWidth="2.4" />
        <path d="M712 460 C 712 434 720 414 734 398" strokeOpacity="0.45" strokeWidth="2.2" />
        <path d="M734 398 q 10 -7 19 -4 q -10 2 -15 9" strokeOpacity="0.45" strokeWidth="2" />
        <path d="M780 460 C 778 438 784 420 794 408" strokeOpacity="0.35" strokeWidth="2" />
      </g>
    </svg>
  );
}

export default function GatewayView() {
  return (
    <Layout maxWidth="xl" showHomeButton={false}>
      <div className="py-8 sm:py-12 space-y-10">
        {/* 헤드라인 */}
        <div className="text-center space-y-3">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            태어난 날이 말해주는
            <br />
            나, 그리고 우리 사이
          </h1>
          <p className="text-sm text-ink-soft leading-relaxed">
            만세력 기반 사주 분석으로 나의 기질과 인연의 궁합을 읽습니다.
          </p>
        </div>

        {/* 두 폭의 수묵 — 진입 선택지 */}
        <div className="space-y-5">
          <a
            href="#/my-saju"
            className="group block bg-surface border border-line hover:border-ink-faint rounded-xl overflow-hidden transition-colors"
          >
            <div className="relative aspect-[800/460]">
              <DawnMountainScene />
              {/* 낙관 — 작품의 서명 */}
              <span className="absolute bottom-3 right-3 w-7 h-7 rounded-sm bg-seal text-white font-serif text-xs flex items-center justify-center select-none">
                命
              </span>
            </div>
            <div className="p-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-lg font-semibold text-ink">내 사주 보기</h2>
                <p className="text-sm text-ink-soft mt-1 leading-relaxed">
                  생년월일시로 나의 오행 기질과 오늘의 운을 봅니다.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 shrink-0 text-ink-faint group-hover:text-ink transition-colors" />
            </div>
          </a>

          <a
            href="#/group"
            className="group block bg-surface border border-line hover:border-ink-faint rounded-xl overflow-hidden transition-colors"
          >
            <div className="relative aspect-[800/460]">
              <MoonCraneScene />
              <span className="absolute bottom-3 right-3 w-7 h-7 rounded-sm bg-seal text-white font-serif text-xs flex items-center justify-center select-none">
                緣
              </span>
            </div>
            <div className="p-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-lg font-semibold text-ink">모임 궁합 보기</h2>
                <p className="text-sm text-ink-soft mt-1 leading-relaxed">
                  친구, 동료와 방을 만들어 서로의 궁합을 확인합니다.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 shrink-0 text-ink-faint group-hover:text-ink transition-colors" />
            </div>
          </a>
        </div>

        <p className="text-center text-xs text-ink-faint">
          한국천문연구원 만세력 데이터 기반 · 태양시 경도 보정
        </p>
      </div>
    </Layout>
  );
}
