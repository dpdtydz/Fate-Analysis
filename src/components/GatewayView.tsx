import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { ChevronRight, Clock, Sparkles, Users } from "lucide-react";
import { getRecentRooms, getRecentPersonalProfile, RecentRoomItem } from "../lib/offlineVault";

export default function GatewayView() {
  const [recentRooms, setRecentRooms] = useState<RecentRoomItem[]>([]);
  const [recentProfile, setRecentProfile] = useState<any | null>(null);

  useEffect(() => {
    setRecentRooms(getRecentRooms());
    setRecentProfile(getRecentPersonalProfile());
  }, []);

  const latestRoom = recentRooms[0];

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

        {/* 최근 이어보기 섹션 (최근 방문 모임 또는 프로필이 있을 때만 표출) */}
        {(latestRoom || recentProfile) && (
          <div className="p-4 rounded-2xl bg-sunken border border-line space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs text-ink-faint">
              <span className="flex items-center gap-1.5 font-medium text-ink">
                <Clock className="w-3.5 h-3.5 text-seal" />
                최근 이어서 보기
              </span>
              <span className="text-[11px]">로컬에 안전하게 보관 중</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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

              {recentProfile && (
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

        {/* 두 폭의 수묵 — 진입 선택지 */}
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
