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

          {/* 1:1 인연 궁합 스냅 (고화질 12간지 귀여운 캐릭터 듀오 시그니처 배너) */}
          <a
            href="#/snap"
            className="group block bg-gradient-to-b from-surface to-rose-50/30 dark:to-rose-950/10 border-2 border-rose-300/60 dark:border-rose-500/40 hover:border-rose-400 dark:hover:border-rose-400 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-rose-500/10 relative"
          >
            {/* 상단 태그 배지들 */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-rose-500 text-white text-[11px] font-black tracking-wide shadow-md flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>NEW · 1:1 둘만의 비밀 스냅</span>
              </span>
            </div>

            <div className="absolute top-3 right-3 z-20 hidden sm:flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 text-rose-600 dark:text-rose-400 text-[10.5px] font-bold shadow-xs border border-rose-200 dark:border-rose-900/50 backdrop-blur-xs">
                ⚡ 1초 초대장 생성
              </span>
            </div>

            {/* 귀여운 12간지 캐릭터 스테이지 */}
            <div className="relative w-full h-56 sm:h-64 overflow-hidden bg-gradient-to-br from-[#fff0f3] via-[#fff7ed] to-[#f5f3ff] dark:from-[#2a1320] dark:via-[#1e1728] dark:to-[#141a29] flex items-center justify-center select-none">
              {/* 은은한 우주 오행 오버레이 */}
              <img
                src="/zodiac/space_fire.webp"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover opacity-15 dark:opacity-25 mix-blend-overlay pointer-events-none"
              />

              {/* 감성 블러 광채 효과 (Glow Orbs) */}
              <div className="absolute -top-10 left-1/4 w-40 h-40 bg-rose-400/25 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 right-1/4 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

              {/* 배경에서 살짝 빼꼼 쳐다보는 친구들 (호랑이 & 돼지) */}
              <div className="absolute left-3 sm:left-10 bottom-2 opacity-40 sm:opacity-50 group-hover:opacity-70 group-hover:-translate-y-1 transition-all duration-300 pointer-events-none">
                <img
                  src="/zodiac/zodiac_tiger_item_headphones.webp"
                  alt="호랑이"
                  className="w-14 sm:w-20 h-auto filter drop-shadow-md -rotate-12"
                />
              </div>
              <div className="absolute right-3 sm:right-10 bottom-2 opacity-40 sm:opacity-50 group-hover:opacity-70 group-hover:-translate-y-1 transition-all duration-300 pointer-events-none">
                <img
                  src="/zodiac/zodiac_pig_item_bowtie.webp"
                  alt="돼지"
                  className="w-14 sm:w-20 h-auto filter drop-shadow-md rotate-12"
                />
              </div>

              {/* 중앙 메인 듀오 (목도리 강아지 & 선글라스 토끼) */}
              <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-6 pt-3">
                {/* 🐶 목도리 시바견 (사용자 최애 캐릭터 에셋) */}
                <div className="flex flex-col items-center group-hover:scale-105 group-hover:-rotate-3 group-hover:translate-x-1.5 transition-all duration-300">
                  <div className="mb-1.5 px-2.5 py-1 rounded-full bg-white/95 dark:bg-slate-900/90 border border-rose-200/80 dark:border-rose-900/60 shadow-xs text-[10px] sm:text-[11px] font-bold text-ink flex items-center gap-1 animate-bounce">
                    <span>우리 잘 맞을까?</span>
                    <span>🐶</span>
                  </div>
                  <img
                    src="/zodiac/zodiac_dog_item_scarf.webp"
                    alt="목도리 강아지"
                    className="w-28 sm:w-36 h-auto drop-shadow-2xl transition-transform duration-300"
                  />
                </div>

                {/* 중앙 하트 케미 인연선 & 펄스 뱃지 */}
                <div className="flex flex-col items-center justify-center px-1 z-20">
                  <div className="w-8 sm:w-12 h-0.5 bg-gradient-to-r from-rose-400 via-pink-400 to-amber-400 rounded-full my-1 hidden sm:block opacity-60" />
                  <div className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white dark:bg-slate-900 shadow-lg border border-rose-200 dark:border-rose-800 flex items-center gap-1 group-hover:scale-110 transition-transform duration-300">
                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 fill-rose-500 animate-pulse" />
                    <span className="text-[11px] sm:text-xs font-black bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                      99% 케미
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-ink-faint font-semibold mt-1">인연의 붉은 실</span>
                </div>

                {/* 🐰 선글라스 힙한 토끼 */}
                <div className="flex flex-col items-center group-hover:scale-105 group-hover:rotate-3 group-hover:-translate-x-1.5 transition-all duration-300">
                  <div className="mb-1.5 px-2.5 py-1 rounded-full bg-white/95 dark:bg-slate-900/90 border border-amber-200/80 dark:border-amber-900/60 shadow-xs text-[10px] sm:text-[11px] font-bold text-ink flex items-center gap-1 animate-bounce [animation-delay:200ms]">
                    <span>링크 줘봐, 볼래!</span>
                    <span>🐰</span>
                  </div>
                  <img
                    src="/zodiac/zodiac_rabbit_item_sunglasses.webp"
                    alt="선글라스 토끼"
                    className="w-28 sm:w-36 h-auto drop-shadow-2xl transition-transform duration-300"
                  />
                </div>
              </div>
            </div>

            {/* 카드 설명 텍스트 및 태그 칩 */}
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-lg font-bold text-ink group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    1:1 인연 궁합 스냅 (Snap)
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                    HOT
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed max-w-lg">
                  상대방에게 링크만 톡 보내면 즉시 매칭! 사주·오행·별자리·MBTI·자미두수까지 6대 실생활 궁합을 둘만의 시크릿 카드로 확인하세요.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-sunken text-ink-soft font-medium border border-line">
                    💌 둘만의 초대장 링크
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-sunken text-ink-soft font-medium border border-line">
                    📸 9:16 인스타 스토리
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-sunken text-ink-soft font-medium border border-line">
                    💫 6대 맞춤 궁합
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-rose-500 font-bold text-xs sm:text-sm shrink-0 self-end sm:self-center">
                <span>지금 시작하기</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
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
