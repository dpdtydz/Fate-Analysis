# 🔮 인연사주 (Inyeon Saju) - 우리들의 사용 설명서

> **태어난 날의 음양오행(陰陽五行)과 정통 명리학으로 풀어보는 모임과 사람 사이의 인연 및 궁합 리포트**  
> 🌐 **공식 서비스**: [https://inyeons.com](https://inyeons.com)  
> 📷 **공식 인스타그램**: [@inyeonssaju](https://www.instagram.com/inyeonssaju)

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-Cloud_Run-4285F4?style=flat-square&logo=google-cloud)](https://cloud.google.com/run)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-2.5_Flash-8E75C2?style=flat-square&logo=google)](https://ai.google.dev/)
[![Instagram](https://img.shields.io/badge/Instagram-@inyeonssaju-E4405F?style=flat-square&logo=instagram)](https://www.instagram.com/inyeonssaju)

---

## 📌 프로젝트 소개 (Overview)

**인연사주(Inyeon Saju)**는 정통 동양 만세력(萬歲曆) 알고리즘과 음양오행(木·火·土·金·水) 상생상극(相生相剋) 원리를 현대적인 감성으로 재해석한 **그룹 및 1:1 사주 궁합 분석 플랫폼**입니다.

카카오톡 단톡방, 동호회, 스터디, 스타트업/회사 팀 등 모임의 링크나 6자리 코드 하나로 모든 멤버가 참여하여, 서로의 기운이 빚어내는 **모임 케미 점수**, **인터랙티브 관계도 지도**, **1:1 비밀 인연 등급(S~F)**, **성향 충돌 완충 수칙**을 한눈에 확인할 수 있습니다.

또한 생성된 결과는 **인스타그램 스토리(9:16)** 및 단톡방에 즉시 공유하기 좋은 카드 형태로 캡처·저장할 수 있습니다.

---

## ✨ 핵심 기능 (Key Features)

### 1. 🧭 전국 출생지 경도 보정 & 정밀 만세력 엔진
- **진태양시 보정**: 대한민국 전국 시·도 및 시·군 단위 경도 데이터를 바탕으로 균시차(동경 135도 기준 시차)를 자동 보정하여 정밀한 시주(時柱) 산출
- **직관적인 셀렉트(Select) 입력**: 1930~2026년 연/월/일 및 시/분을 모바일 환경에 최적화된 드롭다운 셀렉터로 편리하게 선택 (윤달/평달, 조자시/야자시 완벽 대응)
- **수호 십이지 & 오행 캐릭터**: 나를 상징하는 일간(日干) 본성과 사신수(청룡·주작·백호·현무) 동물 캐릭터 자동 매칭

### 2. 👥 그룹 모임 궁합 & 인터랙티브 관계도 (`GroupNetwork`)
- **모임 케미 점수 (100점 만점)**: 구성원 전체의 오행 분포와 순환력을 연산하여 모임의 분위기 메타포 및 종합 궁합 점수 산출
- **SVG 원형 네트워크 관계도**: 멤버 간 상생(초록선), 상극(빨간선) 기운 흐름을 동적으로 시각화
- **최고 시너지 콤비 랭킹**: 모임 내에서 가장 케미가 폭발하는 Top 베스트 콤비와 시너지 팁 추천

### 3. 📸 인스타그램 스토리(9:16) 최적화 카드 캡처
- 단톡방 및 인스타 스토리에 올렸을 때 군더더기 없이 한눈에 들어오도록 핵심 요약 카드(케미 점수 + 관계도 맵 + 1위 콤비 + 공식 워터마크)를 9:16 컴팩트 비율로 캡처 다운로드
- 모바일 환경에서 Web Share API(`navigator.share`) 및 롱프레스 저장 가이드 완벽 지원

### 4. 🔒 비밀 인연 등급 & 1:1 맞춤 완충 수칙
- 모임 멤버 전원의 1:1 궁합을 S부터 F까지 등급화하여 숨겨진 상성 궤적 확인
- 생각이 부딪힐 수 있는 오행 상극 구간에 대한 실질적인 대화법과 완충 수칙 제공
- 쿠폰 코드 등록 및 프리미엄 해금 연동

### 5. 📊 개인 심층 운세 리포트 & AI 풀이 (`MeView`)
- 사주 원국표(사주팔자 8글자) 및 십성(十星), 대운/세운 흐름 시각화
- Google Gemini AI를 접목한 개인 맞춤형 성격 분석, 인생 조언, 귀인운 풀이

### 6. 📄 다면 PDF 감명서 & 바이럴 카드 모달
- 전문 감명서 수준의 고화질 PDF 다운로드 기능 지원 (`html2canvas-pro` & `jsPDF`)
- 개인 명식을 감각적인 카드뉴스로 생성해 소장할 수 있는 바이럴 카드 모달 제공

---

## 🏛️ 기술 아키텍처 (Tech Stack)

```text
┌─────────────────────────────────────────────────────────────┐
│                       Frontend Stack                        │
│   React 18  │  TypeScript  │  Tailwind CSS  │  Lucide Icons │
│   html2canvas-pro  │  jsPDF  │  Canvas-Confetti             │
├─────────────────────────────────────────────────────────────┤
│                 Saju & Astronomical Engines                 │
│   @orrery/core (태양시 보정) │ lunar-javascript (음양력 절기) │
├─────────────────────────────────────────────────────────────┤
│                      Backend & Database                     │
│   Node.js / Express (server.ts)  │  Google Cloud Run        │
│   Firebase Firestore (Realtime)  │  Firebase Auth (Security)│
├─────────────────────────────────────────────────────────────┤
│                     AI & External Services                  │
│   Google Gemini 2.5/Flash API    │  PortOne (포트원 결제)    │
│   Instagram (@inyeonssaju)       │  Google AdSense          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 프로젝트 폴더 구조 (Directory Structure)

```text
Fate-Analysis/
├── public/                     # 정적 자산, 파비콘, 인스타 스토리/피드 홍보 이미지
│   ├── inyeon_story_promo.png  # 9:16 인스타 스토리 홍보 카드
│   ├── feed_promo_1~5.png      # 1:1 인스타 피드용 테마 카드뉴스 (5종)
│   └── instagram_profile_*.png # 인스타 원형 프로필 엠블럼 (한지/다크)
├── src/
│   ├── components/             # 핵심 React 컴포넌트
│   │   ├── SajuForm.tsx        # 생년월일/시간 셀렉트 드롭다운 및 음양력 변환 폼
│   │   ├── GroupView.tsx       # 모임 케미 분석, 인스타 스토리 캡처, 1:1 아코디언
│   │   ├── GroupNetwork.tsx    # SVG 기반 원형 오행 네트워크 관계도 맵
│   │   ├── MeView.tsx          # 개인 사주팔자, 대운, 십신, AI 종합 리포트
│   │   ├── RoomView.tsx        # 모임 대기실 및 멤버 명단 관리
│   │   ├── LandingView.tsx     # 메인 랜딩, 모임 생성/입장, 명리학 아카이브
│   │   ├── ViralCardModal.tsx  # 인스타 공유용 바이럴 카드 생성 모달
│   │   ├── Footer.tsx          # 이용약관/개인정보 및 @inyeonssaju 인스타 링크
│   │   └── ...
│   ├── utils/
│   │   ├── saju.ts             # 음양오행, 천간지지, 십이지 캐릭터 계산 로직
│   │   ├── pdfGenerator.ts     # 다면 인쇄용 PDF 리포트 생성 유틸
│   │   └── ...
│   ├── types.ts                # 전역 TypeScript 인터페이스 및 타입 정의
│   ├── App.tsx                 # 최상위 라우팅 및 룸/회원 세션 상태 관리
│   └── main.tsx                # React Root 진입점
├── server.ts                   # Express 백엔드 API (Cloud Run 배포, Gemini AI 연동)
├── Dockerfile                  # 프로덕션 배포용 다단계 Docker 빌드 파일
├── cloudbuild.yaml             # Google Cloud Build 자동 배포 파이프라인
└── package.json                # 프로젝트 의존성 및 빌드 스크립트
```

---

## 🚀 로컬 개발 및 실행 (Getting Started)

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정 (`.env`)
```env
# Firebase Client Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Server / AI Configuration
PORT=8080
GEMINI_API_KEY=your_gemini_api_key
```

### 3. 개발 서버 실행
```bash
# 클라이언트 개발 서버 (Vite)
npm run dev

# 프로덕션 번들 빌드 및 타입 검증
npm run build
```

---

## 📱 공식 채널 & 문의

- **웹사이트**: [https://inyeons.com](https://inyeons.com)
- **공식 인스타그램**: [@inyeonssaju](https://www.instagram.com/inyeonssaju)
- **데이터 보관 정책**: 모임방과 명식 데이터는 생성 후 30일 경과 시 안전하게 자동 정리됩니다.

---

© 2026 **인연사주 (Inyeon Saju)**. All Rights Reserved.
