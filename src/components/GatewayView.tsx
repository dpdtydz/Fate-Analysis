import React from "react";
import Layout from "./Layout";
import { ChevronRight } from "lucide-react";

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
              <img
                src="/gateway_my_saju.jpg"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover object-[center_45%]"
              />
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
              <img
                src="/gateway_group.jpg"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover object-[center_30%]"
              />
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
