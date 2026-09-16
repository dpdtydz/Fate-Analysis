import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { ChevronRight, Clock, Sparkles, Users, Heart } from "lucide-react";
import { getRecentRooms, getRecentPersonalProfile, getRecentSnaps, RecentRoomItem, RecentSnapItem } from "../lib/offlineVault";

export default function GatewayView() {
  const [recentRooms, setRecentRooms] = useState<RecentRoomItem[]>([]);
  const [recentProfile, setRecentProfile] = useState<any | null>(null);
  const [recentSnaps, setRecentSnaps] = useState<RecentSnapItem[]>([]);

  useEffect(() => {
    setRecentRooms(getRecentRooms());
    setRecentProfile(getRecentPersonalProfile());
    setRecentSnaps(getRecentSnaps());
  }, []);

  const latestRoom = recentRooms[0];
  const latestSnap = recentSnaps[0];

  return (
    <Layout maxWidth="2xl" showHomeButton={false}>
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

        {/* 최근 이어보기 섹션 (최근 방문 모임, 1:1 스냅 또는 프로필이 있을 때만 표출) */}
        {(latestRoom || recentProfile || latestSnap) && (
          <div className="p-4 rounded-2xl bg-sunken border border-line space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-ink-faint">
              <span className="flex items-center gap-1.5 font-medium text-ink">
                <Clock className="w-3.5 h-3.5 text-seal" />
                최근 이어서 보기
              </span>
              <span className="text-[11px]">링크로 언제든 다시 확인 가능</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {latestSnap && (
                <a
                  href={`#/snap/${latestSnap.code}`}
                  className="p-3 bg-surface rounded-xl border border-line hover:border-seal/50 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-[11px] text-seal font-semibold">최근 1:1 인연 스냅</span>
                    <p className="text-xs sm:text-sm font-bold text-ink truncate group-hover:text-seal transition-colors">
                      {latestSnap.partnerName ? `${latestSnap.creatorName} & ${latestSnap.partnerName}` : `${latestSnap.creatorName}님의 1:1 초대`}
                    </p>
                    <p className="text-[11px] text-ink-soft">
                      {latestSnap.partnerName ? "1:1 상세 궁합 결과 다시보기" : `초대코드: ${latestSnap.code}`}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-faint group-hover:text-seal group-hover:translate-x-0.5 transition-all shrink-0" />
                </a>
              )}

              {latestRoom && (
                <a
                  href={`#/room/${latestRoom.code}`}
                  className="p-3 bg-surface rounded-xl border border-line hover:border-seal/50 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-[11px] text-seal font-semibold">최근 방문 모임</span>
                    <p className="text-xs sm:text-sm font-bold text-ink truncate group-hover:text-seal transition-colors">
                      {latestRoom.title}
                    </p>
                    <p className="text-[11px] text-ink-soft flex items-center gap-1">
                      <Users className="w-3 h-3 text-ink-faint" />
                      <span>{latestRoom.memberCount || 1}명 참여 중</span>
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-faint group-hover:text-seal group-hover:translate-x-0.5 transition-all shrink-0" />
                </a>
              )}

              {recentProfile && !latestSnap && (
                <a
                  href="#/my-saju"
                  className="p-3 bg-surface rounded-xl border border-line hover:border-seal/50 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-[11px] text-wood font-semibold">저장된 내 사주</span>
                    <p className="text-xs sm:text-sm font-bold text-ink truncate group-hover:text-seal transition-colors">
                      {recentProfile.name || recentProfile.nickname || "나의 사주 명식"}
                    </p>
                    <p className="text-[11px] text-ink-soft truncate">
                      {recentProfile.dayMaster ? `일간: ${recentProfile.dayMaster}` : recentProfile.birthDate}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-faint group-hover:text-seal group-hover:translate-x-0.5 transition-all shrink-0" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* 수묵 화첩 — 진입 선택지 */}
        <div className="space-y-5">
          <a
            href="#/my-saju"
            className="group block bg-surface border border-line hover:border-ink-faint rounded-xl overflow-hidden transition-colors"
          >
            <div className="relative aspect-[800/460]">
              <img
                src="/gateway_my_saju.jpg"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover object-[center_45%]"
              />
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

          {/* 1:1 인연 궁합 스냅 (12지신 종이컵 전화기 시그니처 배너) */}
          <a
            href="#/snap"
            className="group block bg-surface border border-line hover:border-rose-400 dark:hover:border-rose-500 rounded-xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md relative"
          >
            {/* 상단 태그 배지 */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-rose-500 text-white text-[11px] font-black tracking-wide shadow-md flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>NEW · 1:1 둘만의 비밀 스냅</span>
              </span>
            </div>

            <div className="absolute top-3 right-3 z-10 hidden sm:flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-rose-600 dark:text-rose-400 text-[10.5px] font-bold shadow-xs border border-rose-200 dark:border-rose-900/50 backdrop-blur-xs">
                ⚡ 1초 초대장 생성
              </span>
            </div>

            {/* 🐶 목도리 강아지 & 🐰 선글라스 토끼 1:1 시그니처 배너 (인연의 붉은 실) */}
            <div className="relative aspect-[800/440] sm:aspect-[800/400] overflow-hidden bg-gradient-to-b from-[#FFFDF9] via-[#FFF8F3] to-[#FDF4EE] dark:from-slate-900/90 dark:via-slate-800/70 dark:to-slate-900/90 flex items-center justify-around px-4 sm:px-10 py-6 select-none">
              {/* 은은한 배경 오로라 빛 */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(244,63,94,0.12),transparent_70%)] pointer-events-none" />

              {/* 🐶 목도리 강아지 */}
              <div className="relative z-10 flex flex-col items-center group-hover:scale-105 group-hover:-rotate-2 group-hover:translate-x-1.5 transition-all duration-300">
                <div className="mb-2 px-3 py-1 rounded-full bg-white/95 dark:bg-slate-900/90 border border-rose-200/80 dark:border-rose-900/60 shadow-xs text-[10px] sm:text-[11px] font-bold text-ink flex items-center gap-1 animate-bounce">
                  <span>우리 인연일까?</span>
                  <span>🐶</span>
                </div>
                <img
                  src="/zodiac/zodiac_dog_item_scarf.webp"
                  alt="목도리 강아지"
                  className="w-28 sm:w-36 h-auto drop-shadow-xl transition-transform duration-300"
                />
              </div>

              {/* 중앙 붉은 실 연결 & 99% 하트 배지 */}
              <div className="relative z-20 flex flex-col items-center justify-center -my-2">
                {/* 물결치는 붉은 인연의 실 */}
                <div className="w-24 sm:w-36 flex items-center justify-center relative my-1">
                  <div className="w-full border-t-2 border-dashed border-rose-400 dark:border-rose-500 animate-pulse" />
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white dark:bg-slate-900 border-2 border-rose-400 dark:border-rose-500 shadow-lg flex flex-col items-center justify-center -my-3 z-10 group-hover:scale-110 transition-transform">
                  <span className="text-base sm:text-lg leading-none">💖</span>
                  <span className="text-[10px] sm:text-[11px] font-black font-mono text-rose-600 dark:text-rose-400 leading-tight">
                    99%
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] text-ink-faint font-semibold mt-4">인연의 붉은 실</span>
              </div>

              {/* 🐰 선글라스 힙한 토끼 */}
              <div className="relative z-10 flex flex-col items-center group-hover:scale-105 group-hover:rotate-2 group-hover:-translate-x-1.5 transition-all duration-300">
                <div className="mb-2 px-3 py-1 rounded-full bg-white/95 dark:bg-slate-900/90 border border-amber-200/80 dark:border-amber-900/60 shadow-xs text-[10px] sm:text-[11px] font-bold text-ink flex items-center gap-1 animate-bounce [animation-delay:200ms]">
                  <span>링크 줘봐, 볼래!</span>
                  <span>🐰</span>
                </div>
                <img
                  src="/zodiac/zodiac_rabbit_item_sunglasses.webp"
                  alt="선글라스 토끼"
                  className="w-28 sm:w-36 h-auto drop-shadow-xl transition-transform duration-300"
                />
              </div>
            </div>

            {/* 카드 설명 텍스트 및 태그 칩 */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-lg font-bold text-ink group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    1:1 인연 궁합 스냅
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                    HOT
                  </span>
                </div>
                <p className="text-sm text-ink-soft leading-relaxed">
                  초대장을 만들어 상대방과 1:1로 사주·별자리·MBTI·자미두수 궁합을 봅니다.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-sunken text-ink-soft font-medium border border-line">
                    💌 둘만의 초대장 링크
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-sunken text-ink-soft font-medium border border-line">
                    📸 9:16 인스타 스토리
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-sunken text-ink-soft font-medium border border-line">
                    🔒 비밀 엄수 (1:1 매칭)
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 shrink-0 text-ink-faint group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
            </div>
          </a>

          <a
            href="#/group"
            className="group block bg-surface border border-line hover:border-ink-faint rounded-xl overflow-hidden transition-colors"
          >
            <div className="relative aspect-[800/460]">
              <img
                src="/gateway_group.jpg"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover object-[center_30%]"
              />
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
