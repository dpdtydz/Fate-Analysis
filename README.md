# 🔮 인연사주 (Inyeon Saju) - 우리들의 사용 설명서

> **태어난 날의 음양오행(陰陽五行) 기운으로 풀어보는 모임과 사람 사이의 인연 및 궁합 리포트**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![AdSense](https://img.shields.io/badge/Google_AdSense-Compliant-4285F4?style=flat-square&logo=google-ads)](https://adsense.google.com/)

---

## 📌 프로젝트 소개 (Overview)

**인연사주(Inyeon Saju)**는 정통 동양 만세력(萬歲曆) 알고리즘과 음양오행(木·火·土·金·水) 생극제화(生克制化) 원리를 바탕으로, 카카오톡 단톡방, 동호회, 회사 팀 등 여러 사람이 모였을 때 발생하는 **그룹 케미스트리(Group Chemistry)**와 **1:1 속궁합**을 정밀 측정해 주는 웹 스페셜리티 서비스입니다.

태어난 연·월·일·시를 절기(節氣) 기준으로 정확히 측정하여 나만의 12간지 캐릭터와 일간(日干) 본성을 도출하며, 모임 코드 하나로 동료들과 손쉽게 사주 궁합을 공유하고 소통할 수 있습니다.

---

## 📱 실제 사용 화면 프리뷰 (UI & Code Mockup Preview)

### 1. 모바일 앱 인터페이스 SVG 프리뷰

<div align="center">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="100%" style="max-width: 800px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <defs>
      <linearGradient id="bgGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1E293B"/>
        <stop offset="100%" stop-color="#0F172A"/>
      </linearGradient>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FCFAF6"/>
        <stop offset="100%" stop-color="#F5EFE6"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000000" flood-opacity="0.35"/>
      </filter>
    </defs>

    <!-- Canvas Background -->
    <rect width="800" height="520" rx="20" fill="url(#bgGlow)"/>
    
    <!-- Title Badge -->
    <text x="400" y="38" text-anchor="middle" fill="#E2E8F0" font-size="16" font-weight="bold" letter-spacing="1">인연사주 Real-time Interactive UI Mockup</text>

    <!-- LEFT PHONE FRAME (Group Chemistry Matrix) -->
    <g transform="translate(100, 60)" filter="url(#shadow)">
      <!-- Phone Body -->
      <rect width="280" height="420" rx="28" fill="#2C3E50" stroke="#475569" stroke-width="3"/>
      <!-- Screen Background -->
      <rect x="8" y="8" width="264" height="404" rx="22" fill="url(#cardGrad)"/>
      
      <!-- Top Notch / Status -->
      <rect x="102" y="14" width="76" height="12" rx="6" fill="#1E293B"/>
      
      <!-- App Header -->
      <text x="24" y="48" fill="#C0392B" font-size="14" font-weight="900" font-family="serif">☯ 인연사주</text>
      <rect x="180" y="34" width="76" height="20" rx="10" fill="#E8E0D0"/>
      <text x="218" y="48" text-anchor="middle" fill="#5A4D41" font-size="10" font-weight="bold">코드 #8F3K91</text>
      <line x1="24" y1="60" x2="240" y2="60" stroke="#D6CCBC" stroke-width="1"/>

      <!-- Group Chemistry Header -->
      <text x="24" y="80" fill="#2C3E50" font-size="12" font-weight="bold">👥 주말 등산모임 (4명)</text>
      <text x="24" y="94" fill="#7A6B5D" font-size="9">오행 전체 조화도 : <tspan fill="#27AE60" font-weight="bold">최상 (94%)</tspan></text>

      <!-- Five Elements Bar Graph -->
      <rect x="24" y="104" width="216" height="12" rx="6" fill="#E2E8F0"/>
      <rect x="24" y="104" width="60" height="12" rx="6" fill="#27AE60"/> <!-- 木 -->
      <rect x="84" y="104" width="45" height="12" fill="#E74C3C"/> <!-- 火 -->
      <rect x="129" y="104" width="40" height="12" fill="#D35400"/> <!-- 土 -->
      <rect x="169" y="104" width="35" height="12" fill="#7F8C8D"/> <!-- 金 -->
      <rect x="204" y="104" width="36" height="12" rx="6" fill="#2980B9"/> <!-- 水 -->

      <!-- Element Labels -->
      <text x="24" y="128" fill="#27AE60" font-size="8" font-weight="bold">木 28%</text>
      <text x="70" y="128" fill="#E74C3C" font-size="8" font-weight="bold">火 22%</text>
      <text x="115" y="128" fill="#D35400" font-size="8" font-weight="bold">土 18%</text>
      <text x="160" y="128" fill="#7F8C8D" font-size="8" font-weight="bold">金 16%</text>
      <text x="200" y="128" fill="#2980B9" font-size="8" font-weight="bold">水 16%</text>

      <!-- Member 1 Card -->
      <rect x="24" y="140" width="216" height="56" rx="10" fill="#FFFFFF" stroke="#E8E0D0" stroke-width="1"/>
      <circle cx="48" cy="168" r="16" fill="#E8F8F5"/>
      <text x="48" y="173" text-anchor="middle" font-size="14">🐉</text>
      <text x="72" y="162" fill="#2C3E50" font-size="11" font-weight="bold">김민준 (방장)</text>
      <text x="72" y="176" fill="#C0392B" font-size="9">갑목(甲木) · 푸른 용 캐릭터</text>
      <rect x="180" y="156" width="50" height="24" rx="6" fill="#27AE60"/>
      <text x="205" y="172" text-anchor="middle" fill="#FFFFFF" font-size="9" font-weight="bold">상생 리더</text>

      <!-- Member 2 Card -->
      <rect x="24" y="204" width="216" height="56" rx="10" fill="#FFFFFF" stroke="#E8E0D0" stroke-width="1"/>
      <circle cx="48" cy="232" r="16" fill="#FEF9E7"/>
      <text x="48" y="237" text-anchor="middle" font-size="14">🐯</text>
      <text x="72" y="226" fill="#2C3E50" font-size="11" font-weight="bold">이서연</text>
      <text x="72" y="240" fill="#E67E22" font-size="9">병화(丙火) · 붉은 호랑이</text>
      <rect x="180" y="220" width="50" height="24" rx="6" fill="#E74C3C"/>
      <text x="205" y="236" text-anchor="middle" fill="#FFFFFF" font-size="9" font-weight="bold">열정 시너지</text>

      <!-- 1:1 Match Preview Badge -->
      <rect x="24" y="268" width="216" height="68" rx="12" fill="#FFFDF9" stroke="#C0392B" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="36" y="286" fill="#C0392B" font-size="10" font-weight="bold">💘 BEST 1:1 궁합 커플</text>
      <text x="36" y="304" fill="#2C3E50" font-size="10">김민준(木)  x  이서연(火)</text>
      <text x="36" y="322" fill="#7A6B5D" font-size="9">"목생화(木生火) 원리로 서로의 능력을 높여줌"</text>
      <rect x="180" y="288" width="50" height="20" rx="10" fill="#C0392B"/>
      <text x="205" y="302" text-anchor="middle" fill="#FFFFFF" font-size="9" font-weight="bold">98점</text>

      <!-- Bottom Navigation Mock -->
      <rect x="24" y="348" width="216" height="36" rx="18" fill="#2C3E50"/>
      <text x="132" y="371" text-anchor="middle" fill="#FFFFFF" font-size="10" font-weight="bold">카카오톡 초대로 친구 더 추가하기</text>
    </g>

    <!-- RIGHT PHONE FRAME (Individual Saju Report - MeView) -->
    <g transform="translate(420, 60)" filter="url(#shadow)">
      <!-- Phone Body -->
      <rect width="280" height="420" rx="28" fill="#2C3E50" stroke="#475569" stroke-width="3"/>
      <!-- Screen Background -->
      <rect x="8" y="8" width="264" height="404" rx="22" fill="#FFFFFF"/>
      
      <!-- Top Notch -->
      <rect x="102" y="14" width="76" height="12" rx="6" fill="#1E293B"/>

      <!-- Header -->
      <text x="24" y="48" fill="#2C3E50" font-size="13" font-weight="bold">📊 개인 정밀 사주 명반</text>
      <text x="216" y="48" text-anchor="end" fill="#C0392B" font-size="10" font-weight="bold">만세력 Ver 3.4</text>
      <line x1="24" y1="58" x2="256" y2="58" stroke="#E8E0D0" stroke-width="1"/>

      <!-- Saju Table -->
      <rect x="24" y="70" width="232" height="70" rx="8" fill="#FCFAF6" stroke="#D6CCBC" stroke-width="1"/>
      <!-- Columns -->
      <line x1="82" y1="70" x2="82" y2="140" stroke="#E8E0D0"/>
      <line x1="140" y1="70" x2="140" y2="140" stroke="#E8E0D0"/>
      <line x1="198" y1="70" x2="198" y2="140" stroke="#E8E0D0"/>
      <line x1="24" y1="92" x2="256" y2="92" stroke="#E8E0D0"/>

      <text x="53" y="85" text-anchor="middle" fill="#7A6B5D" font-size="9" font-weight="bold">시주(時)</text>
      <text x="111" y="85" text-anchor="middle" fill="#7A6B5D" font-size="9" font-weight="bold">일주(日)</text>
      <text x="169" y="85" text-anchor="middle" fill="#7A6B5D" font-size="9" font-weight="bold">월주(月)</text>
      <text x="227" y="85" text-anchor="middle" fill="#7A6B5D" font-size="9" font-weight="bold">연주(年)</text>

      <text x="53" y="112" text-anchor="middle" fill="#27AE60" font-size="12" font-weight="bold">甲(木)</text>
      <text x="111" y="112" text-anchor="middle" fill="#E74C3C" font-size="12" font-weight="bold">丙(火)</text>
      <text x="169" y="112" text-anchor="middle" fill="#D35400" font-size="12" font-weight="bold">戊(土)</text>
      <text x="227" y="112" text-anchor="middle" fill="#2980B9" font-size="12" font-weight="bold">壬(水)</text>

      <text x="53" y="132" text-anchor="middle" fill="#2980B9" font-size="11">子(水)</text>
      <text x="111" y="132" text-anchor="middle" fill="#27AE60" font-size="11">寅(木)</text>
      <text x="169" y="132" text-anchor="middle" fill="#E74C3C" font-size="11">午(火)</text>
      <text x="227" y="132" text-anchor="middle" fill="#7F8C8D" font-size="11">申(金)</text>

      <!-- Analysis Report Card -->
      <rect x="24" y="152" width="232" height="110" rx="10" fill="#FCFAF6" stroke="#E8E0D0" stroke-width="1"/>
      <text x="36" y="172" fill="#C0392B" font-size="10" font-weight="bold">💡 일간(日干) 본성 및 운세 총평</text>
      <text x="36" y="190" fill="#2C3E50" font-size="9.5" font-weight="bold">"태양처럼 넓고 따뜻한 열정의 병화(丙火)"</text>
      <text x="36" y="208" fill="#5A4D41" font-size="8.5">· 조직에서 리더십과 창의성을 발휘하는 타입입니다.</text>
      <text x="36" y="222" fill="#5A4D41" font-size="8.5">· 식신과 편재의 조화로 기획 및 유통에 능합니다.</text>
      <text x="36" y="236" fill="#5A4D41" font-size="8.5">· 2026년 대운 : 관성 운으로 승진 및 계약 운 상승.</text>

      <!-- AI Gemini Advisor Callout -->
      <rect x="24" y="272" width="232" height="60" rx="10" fill="#F4F6F7" stroke="#BDC3C7" stroke-width="1"/>
      <text x="36" y="290" fill="#2980B9" font-size="10" font-weight="bold">🤖 AI 명리학 맞춤 조언 (Gemini 2.5)</text>
      <text x="36" y="306" fill="#34495E" font-size="8.5">"상대방의 금(金) 기운을 만나면 결단력이 한층 강화되어 프로젝트 성과가 배가됩니다."</text>

      <!-- AdSense Unit Safe Banner Mockup -->
      <rect x="24" y="342" width="232" height="42" rx="6" fill="#FFFDF9" stroke="#E8E0D0" stroke-width="1"/>
      <text x="140" y="362" text-anchor="middle" fill="#95A5A6" font-size="8.5">Google AdSense Safe Unit (Publisher Content Verified)</text>
      <rect x="32" y="348" width="30" height="12" rx="2" fill="#3498DB"/>
      <text x="47" y="357" text-anchor="middle" fill="#FFFFFF" font-size="7" font-weight="bold">Ad</text>
    </g>
  </svg>
</div>

---

### 2. 코드 및 컴포넌트 아키텍처 프리뷰 (Code Architecture)

```tsx
// src/components/GroupView.tsx - 그룹 사주 분석 및 1:1 궁합 리포트 렌더링
import React from 'react';
import { calculateFiveElements, getChemistryMatrix } from '../lib/sajuCalculator';
import GoogleAds from './GoogleAds';

export function GroupView({ members, roomCode }: { members: Member[]; roomCode: string }) {
  const elementsDistribution = calculateFiveElements(members);
  const chemistryReport = getChemistryMatrix(members);

  return (
    <div className="max-w-md mx-auto space-y-6 p-4 bg-[#FCFAF6]">
      {/* 1. 그룹 헤더 & 오행 분포 그래프 */}
      <section className="bg-white p-5 rounded-2xl border border-[#D6CCBC] shadow-xs">
        <h2 className="text-sm font-bold text-[#2C3E50] font-serif">👥 그룹 오행 조화도</h2>
        <div className="mt-3 flex h-3 rounded-full overflow-hidden">
          <div style={{ width: `${elementsDistribution.wood}%` }} className="bg-[#27AE60]" />
          <div style={{ width: `${elementsDistribution.fire}%` }} className="bg-[#E74C3C]" />
          <div style={{ width: `${elementsDistribution.earth}%` }} className="bg-[#D35400]" />
          <div style={{ width: `${elementsDistribution.metal}%` }} className="bg-[#7F8C8D]" />
          <div style={{ width: `${elementsDistribution.water}%` }} className="bg-[#2980B9]" />
        </div>
      </section>

      {/* 2. 1:1 궁합 매칭 매트릭스 */}
      <section className="space-y-3">
        {chemistryReport.matches.map((match) => (
          <div key={match.id} className="p-4 bg-white rounded-xl border border-[#E8E0D0] flex justify-between">
            <div>
              <span className="text-xs font-bold text-[#C0392B]">{match.pairNames}</span>
              <p className="text-[11px] text-[#7A6B5D]">{match.description}</p>
            </div>
            <span className="px-2.5 py-1 bg-[#C0392B] text-white text-xs font-bold rounded-lg h-fit">
              {match.score}점
            </span>
          </div>
        ))}
      </section>

      {/* 3. Google AdSense 정책 준수 유닛 (콘텐츠 검증 완료 시에만 노출) */}
      <GoogleAds layout="banner" hasContent={members.length >= 2} />
    </div>
  );
}
```

---

## ✨ 핵심 기능 (Key Features)

| 기능 | 상세 설명 |
| :--- | :--- |
| **🔮 정통 만세력 & 12간지 캐릭터** | 양력/음력/윤달 절기 시각 정밀 변환, 야자시·조자시 구분을 반영한 사주팔자 및 소동물 캐릭터 생성 |
| **👥 그룹 궁합 & 케미스트리 매트릭스** | 6자리 모임 코드로 손쉬운 초대, 오행 분포 그래프 및 구성원 간 상생·상극 궁합 리포트 연동 |
| **📊 나만의 사주 심층 리포트 (MeView)** | 일간(日干) 본성, 십성(十星) 구조, 자미두수(紫微斗數) 명반 연동 개인 운세 및 맞춤 AI 조언 |
| **📜 명리학 학술 칼럼 Archive** | 십성 심리학, 자미두수 대운, 오행 균형 완화론 등 고품질 학술 칼럼 4편 및 FAQ 제공 |
| **💳 프리미엄 샵 (Lemon Squeezy)** | 엽전/포인트 충전 오버레이 연동 및 서비스 이용 결제 지원 |
| **📲 카카오톡 아웃링크 스마트 가이드** | 카카오톡 인앱 브라우저 진입 시 사파리/크롬 외부 브라우저 자동 연결 안내 |
| **🛡️ AdSense 정책 엄격 준수** | 게시자 콘텐츠가 없는 유령 화면 광고 완전 차단 및 맞춤형 광고 거부 쿠키 고지 준수 |

---

## 🏛️ 기술 스택 (Tech Stack)

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend Stack                        │
│   React 18  │  TypeScript  │  Tailwind CSS  │  Motion      │
├─────────────────────────────────────────────────────────────┤
│                      Backend & Database                     │
│   Firebase Firestore  │  Firebase Auth  │  Express / Node   │
├─────────────────────────────────────────────────────────────┤
│                     External Integrations                   │
│   Lemon Squeezy API   │  Google AdSense │  Google Gemini    │
└─────────────────────────────────────────────────────────────┘
```

- **Core Framework**: React 18, Vite 5, TypeScript
- **Styling & UI**: Tailwind CSS, Lucide Icons, Custom Oriental Color Palette (`#FCFAF6`, `#2C3E50`, `#C0392B`)
- **Backend & Storage**: Firebase Firestore (Realtime Data Sync), Firebase Authentication
- **Monetization & Ads**: Google AdSense (Auto-Ads / Banner Units with Content Validation) & Lemon Squeezy Payment Overlay

---

## 📜 구글 애드센스(Google AdSense) 승인 가이드라인 준수

본 서비스는 Google AdSense 품질 지침 및 정책을 엄격히 준수하도록 설계되었습니다.

1. **게시자 콘텐츠 유무 검증 (`hasContent` Guard)**
   - 개인 분석 리포트나 그룹 분석 결과가 출력되지 않은 빈 화면(로딩 중, 단순 회원가입 폼)에는 광고 스크립트 호출을 원천 차단하여 **"게시자 콘텐츠가 없는 화면에 Google 게재 광고"** 위반을 방지합니다.
2. **고품질 학술 메인 콘텐츠 탑재**
   - 랜딩 페이지 하단에 명리학 학술 칼럼 4편과 종합 FAQ, 정통 만세력 작동 원리를 수록하여 **"가치가 별로 없는 콘텐츠"** 반려 이슈를 해결했습니다.
3. **필수 법적 모달 고지**
   - `개인정보처리방침`, `이용약관`, `광고 및 쿠키 정책` 모달을 상시 제공하며 Google AdSense 맞춤형 광고 쿠키 거부 수단을 명시했습니다.

---

## 📁 프로젝트 구조 (Directory Structure)

```text
├── index.html                  # HTML 메인 엔트리 (AdSense meta/script 포함)
├── src/
│   ├── App.tsx                 # 메인 애플리케이션 라우터 및 상태 관리
│   ├── main.tsx                # React Root 렌더러
│   ├── index.css               # 글로벌 Tailwind CSS 정의
│   ├── components/             # 모듈화된 UI 컴포넌트
│   │   ├── LandingView.tsx     # 메인 랜딩, 모임 생성/참여 및 학술 칼럼 모달
│   │   ├── RoomView.tsx        # 그룹 대기실 및 멤버 리스트
│   │   ├── GroupView.tsx       # 그룹 전체 궁합 매트릭스 & 오행 분석 리포트
│   │   ├── MeView.tsx          # 개인 정밀 사주 & 십성 분석 리포트
│   │   ├── GoogleAds.tsx       # 콘텐츠 검증 기반 안전한 AdSense 컴포넌트
│   │   ├── SajuForm.tsx        # 생년월일시 입력 폼
│   │   ├── SajuVisual.tsx      # 오행 차트 및 캐릭터 비주얼
│   │   ├── PremiumPaywall.tsx  # Lemon Squeezy 결제 샵 모달
│   │   └── ...
│   └── lib/                    # 파이어베이스 및 만세력 계산 유틸리티
└── metadata.json               # 앱 정보 및 주요 권한 설정
```

---

## 🔒 개인정보 및 보안

- 모든 유저 사주 정보는 Firestore 데이터베이스에 암호화되어 관리됩니다.
- 모임 방 탈퇴 및 프로필 삭제 시 유저 정보는 안전하게 영구 파기됩니다.

---

© 2026 **인연사주 (Inyeon Saju)**. All Rights Reserved.
