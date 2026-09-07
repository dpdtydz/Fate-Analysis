import React, { useState, useEffect } from "react";
import { 
  Sun, 
  Calendar, 
  Moon, 
  Compass, 
  Lock, 
  Coins, 
  Clock, 
  Hash,
  Heart,
  Briefcase,
  Activity,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Target
} from "lucide-react";
import { calculateTodayFortune } from "../utils/saju";

/**
 * 운세 패널 — 내 사주(MySajuView)와 그룹 내 내 사주(MeView)가 공유한다.
 *
 * 두 화면이 각자 구현을 갖고 있어 제공 범위가 갈라졌던 것을 한 곳으로 모았다.
 * 다음에 운세 UI를 고칠 때 여기 한 파일만 고치면 양쪽에 반영된다.
 *
 * 무료/유료 경계:
 *   - 오늘  = calculateTodayFortune 룰베이스. 결제 없이 항상 보인다 (AI 호출 없음).
 *   - 주·월·년 = /api/horoscope (Gemini). 유료 사용자만.
 *
 * 비용 규칙 (중요):
 *   /api/horoscope는 4종을 한 번에 생성하므로 호출 1회가 곧 과금 1회다.
 *   따라서 isUnlocked가 true일 때만 호출한다. 무료 사용자는 네트워크 요청 자체가 없고,
 *   잠긴 탭은 룰베이스 오늘 데이터를 블러 처리해 미리보기로 보여준다.
 */

export type HoroscopePeriod = "today" | "weekly" | "monthly" | "yearly";

const PERIOD_META: Record<HoroscopePeriod, { label: string; short: string; Icon: any }> = {
  today: { label: "오늘 운세", short: "오늘", Icon: Sun },
  weekly: { label: "주간 예보", short: "주간", Icon: Calendar },
  monthly: { label: "월간 리포트", short: "월간", Icon: Moon },
  yearly: { label: "연간 운세", short: "연간", Icon: Compass },
};

const LOCK_COPY: Record<Exclude<HoroscopePeriod, "today">, { title: string; desc: string }> = {
  weekly: {
    title: "주간 정밀 예보 & 요일별 운세",
    desc: "이번 주 대인관계, 재물, 건강 흐름과 요일별 일일 예보를 모두 열람할 수 있어요.",
  },
  monthly: {
    title: "월간 리포트 & 주차별 운세 궤적",
    desc: "이번 달 꼭 잡아야 할 기회와 피해야 할 함정, 주차별 흐름을 안내합니다.",
  },
  yearly: {
    title: "연간 대운세 & 재물·성공 로드맵",
    desc: "올해의 대변국과 재물길(積財之路), 커리어 도약 시기를 한눈에 확인하세요.",
  },
};

export interface HoroscopePanelProps {
  /** 사주가 포함된 멤버/프로필 객체 — /api/horoscope 요청 본문에 그대로 실린다 */
  member: any;
  /** 유료 해금 여부. MeView는 isPdfUnlocked, MySajuView는 isCouponUnlocked를 넘긴다 */
  isUnlocked: boolean;
  /** 캐시 구분 키 (그룹 멤버는 memberId, 개인 화면은 "self") */
  cacheKey: string;
  /** 잠금 카드의 해금 버튼 — 상점 모달 열기 등 화면별 동작을 위임받는다 */
  onUnlockClick?: () => void;
}

export default function HoroscopePanel({
  member,
  isUnlocked,
  cacheKey,
  onUnlockClick,
}: HoroscopePanelProps) {
  const [activeTab, setActiveTab] = useState<HoroscopePeriod>("today");
  const [horoscope, setHoroscope] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const gan = member?.saju?.daymaster?.gan || "무토";
  const elem = member?.saju?.daymaster?.element || "토";
  const dmGan = gan.length > 1 ? gan[0] : gan;
  const todayCalc = calculateTodayFortune(dmGan, elem);

  const fetchHoroscope = async (force = false) => {
    if (!member?.saju) return;

    // 캐시 확인 — 같은 날이면 재호출하지 않는다
    try {
      const cached = localStorage.getItem(`saju_horoscope_${cacheKey}`);
      if (cached && !force) {
        const parsed = JSON.parse(cached);
        if (parsed.cachedDate === new Date().toDateString()) {
          setHoroscope(parsed.data);
          return;
        }
      }
    } catch {
      // 캐시 파손은 무시하고 새로 받는다
    }

    if (horoscope && !force) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/horoscope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member }),
      });
      if (!res.ok) throw new Error("운세를 생성하지 못했어요. 잠시 후 다시 시도해 주세요.");
      const data = await res.json();
      setHoroscope(data);
      try {
        localStorage.setItem(
          `saju_horoscope_${cacheKey}`,
          JSON.stringify({ cachedDate: new Date().toDateString(), data })
        );
      } catch {
        // 저장 실패는 기능에 영향 없음
      }
    } catch (err: any) {
      setError(err.message || "운세를 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  };

  // 유료 사용자에게만 AI를 호출한다 — 무료 사용자는 요청 자체가 발생하지 않는다
  useEffect(() => {
    if (isUnlocked && member?.saju && !horoscope && !loading && !error) {
      fetchHoroscope();
    }
  }, [isUnlocked, member, horoscope, loading, error]);

  const isLocked = activeTab !== "today" && !isUnlocked;
  const aiData = horoscope?.[activeTab];

  // 오늘 탭은 룰베이스가 기준이고, 유료 사용자는 AI 해설이 있으면 그것을 얹는다.
  // 잠긴 탭은 AI 데이터가 아예 없으므로(무료 사용자는 호출하지 않는다) 룰베이스를
  // 티저로 깔아준다 — 그래야 블러 뒤에 실체가 있어 잠금 카드가 뜰 자리가 생긴다.
  const score = activeTab === "today" || isLocked ? todayCalc.score : aiData?.score || 80;
  const summary =
    activeTab === "today"
      ? aiData?.summary || todayCalc.advice
      : isLocked
        ? todayCalc.advice
        : aiData?.summary || "";

  const renderRichText = (text: string) => {
    if (!text) return null;
    const paragraphs = text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
    return (
      <div className="space-y-3 pt-1">
        {paragraphs.map((para, idx) => (
          <p key={idx} className="text-sm text-ink-soft leading-relaxed text-left">
            {para.startsWith("-") || para.startsWith("•") || para.startsWith("*") ? (
              <span className="flex items-start">
                <span className="text-ink-faint mr-2 shrink-0 mt-1">•</span>
                <span>{para.replace(/^[-•*]\s*/, "")}</span>
              </span>
            ) : (
              para
            )}
          </p>
        ))}
      </div>
    );
  };

  const luckyItems =
    activeTab === "today" || isLocked
      ? {
          color: aiData?.lucky_items?.color || todayCalc.luckColor,
          number: aiData?.lucky_items?.number || todayCalc.luckyNumber,
          direction: aiData?.lucky_items?.direction || todayCalc.luckDirection,
          time: aiData?.lucky_items?.time || todayCalc.luckyTime,
        }
      : aiData?.lucky_items;

  return (
    <div className="space-y-5 animate-fade-in text-left">
      {/* 기간 선택 */}
      <div className="grid grid-cols-4 gap-1 bg-sunken p-1 rounded-xl">
        {(Object.keys(PERIOD_META) as HoroscopePeriod[]).map((tab) => {
          const { label, short, Icon } = PERIOD_META[tab];
          const isActive = activeTab === tab;
          const tabLocked = tab !== "today" && !isUnlocked;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 flex flex-col sm:flex-row items-center justify-center gap-1 text-xs rounded-lg cursor-pointer transition-colors ${
                isActive
                  ? "bg-surface text-ink font-semibold"
                  : "text-ink-soft hover:text-ink font-medium"
              }`}
            >
              {tabLocked ? (
                <Lock className={`w-3.5 h-3.5 ${isActive ? "text-ink" : "text-ink-faint"}`} />
              ) : (
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-ink" : "text-ink-faint"}`} />
              )}
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{short}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3.5 text-center">
          <div className="w-8 h-8 border-2 border-line border-t-ink rounded-full animate-spin" />
          <p className="text-sm font-medium text-ink">오늘의 일진과 만세력을 연결하고 있어요.</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-sunken rounded-xl text-center space-y-2.5">
          <p className="text-sm font-medium text-seal">{error}</p>
          <button
            type="button"
            onClick={() => fetchHoroscope(true)}
            className="px-5 py-3 bg-sunken hover:bg-line text-ink rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className="relative">
          <div
            className={
              isLocked
                ? "filter blur-sm opacity-40 select-none pointer-events-none space-y-5"
                : "space-y-5"
            }
          >
            {/* 점수 카드 */}
            <div className="bg-sunken p-5 rounded-xl">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border-b border-line pb-4">
                <h3 className="font-serif text-lg font-semibold text-ink">
                  {PERIOD_META[activeTab].label}
                </h3>
                <div className="flex items-center gap-3 bg-surface px-3.5 py-2 rounded-xl shrink-0 self-center">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle cx="24" cy="24" r="20" stroke="var(--color-line)" strokeWidth="3.5" fill="transparent" />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="var(--color-seal)"
                        strokeWidth="3.5"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 20}
                        strokeDashoffset={2 * Math.PI * 20 * (1 - score / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-xs font-mono font-semibold text-seal">{score}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-ink-faint leading-none mb-1">길운 지표</span>
                    <span className="text-sm font-semibold text-ink leading-none">
                      {score >= 90 ? "대길 (大吉)" : score >= 80 ? "소길 (小吉)" : score >= 70 ? "평온 (平穩)" : "주의 (注意)"}
                    </span>
                  </div>
                </div>
              </div>

              {activeTab === "today" && (
                <h4 className="font-semibold text-sm text-ink pt-3">{todayCalc.title}</h4>
              )}
              <div className="leading-relaxed pt-2">{renderRichText(summary)}</div>
            </div>

            {/* 행운 처방 — 오늘 탭은 룰베이스만으로도 항상 채워진다 */}
            {luckyItems && (
              <div className="space-y-3">
                <h3 className="text-[15px] font-semibold text-ink border-b border-line pb-2">
                  {activeTab === "today" ? "오늘의 행운 처방" : "행운 처방"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { Icon: Sun, label: "행운의 색", value: luckyItems.color },
                    { Icon: Hash, label: "행운의 숫자", value: luckyItems.number },
                    { Icon: Compass, label: "행운의 방위", value: luckyItems.direction },
                    { Icon: Clock, label: "행운의 시간", value: luckyItems.time },
                  ]
                    .filter((it) => it.value)
                    .map(({ Icon, label, value }) => (
                      <div key={label} className="bg-sunken p-4 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-ink-faint" />
                          <span className="text-xs text-ink-faint">{label}</span>
                        </div>
                        <p className="text-sm text-ink font-medium leading-relaxed">{value}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 주간 전용 상세 섹션 */}
            {activeTab === "weekly" && (aiData?.love_and_social || aiData?.wealth_and_job || aiData?.health_and_energy || aiData?.daily_flow) && (
              <div className="space-y-4 pt-2">
                <h3 className="text-[15px] font-semibold text-ink border-b border-line pb-2">
                  분야별 심층 흐름
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {aiData.love_and_social && (
                    <div className="bg-sunken p-4.5 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <Heart className="w-3.5 h-3.5 text-ink" />
                        <span>대인관계 & 인연</span>
                      </div>
                      <p className="text-sm text-ink-soft leading-relaxed">{aiData.love_and_social}</p>
                    </div>
                  )}
                  {aiData.wealth_and_job && (
                    <div className="bg-sunken p-4.5 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <Briefcase className="w-3.5 h-3.5 text-ink" />
                        <span>재물 & 업무 기회</span>
                      </div>
                      <p className="text-sm text-ink-soft leading-relaxed">{aiData.wealth_and_job}</p>
                    </div>
                  )}
                  {aiData.health_and_energy && (
                    <div className="bg-sunken p-4.5 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <Activity className="w-3.5 h-3.5 text-ink" />
                        <span>건강 & 에너지 관리</span>
                      </div>
                      <p className="text-sm text-ink-soft leading-relaxed">{aiData.health_and_energy}</p>
                    </div>
                  )}
                </div>

                {/* 요일별 7일 예보 */}
                {Array.isArray(aiData.daily_flow) && aiData.daily_flow.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>요일별 일일 흐름</span>
                    </h4>
                    <div className="divide-y divide-line rounded-xl bg-sunken overflow-hidden">
                      {aiData.daily_flow.map((dayText: string, dIdx: number) => {
                        const dayNames = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];
                        const dayName = dayNames[dIdx] || `${dIdx + 1}일차`;
                        return (
                          <div key={dIdx} className="p-3.5 flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4 text-left">
                            <span className="shrink-0 text-xs font-semibold text-ink w-14">{dayName}</span>
                            <p className="text-sm text-ink-soft leading-relaxed flex-1">{dayText}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 월간 전용 상세 섹션 */}
            {activeTab === "monthly" && (aiData?.key_theme || aiData?.opportunities || aiData?.precautions || aiData?.weeks_flow) && (
              <div className="space-y-4 pt-2">
                {aiData.key_theme && (
                  <div className="p-4 bg-sunken rounded-xl space-y-1 text-left">
                    <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                      <Target className="w-3.5 h-3.5 text-ink" />
                      <span>이달을 관통하는 핵심 테마</span>
                    </div>
                    <p className="text-sm text-ink font-medium leading-relaxed pl-5">{aiData.key_theme}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aiData.opportunities && (
                    <div className="bg-sunken p-4.5 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <Sparkles className="w-3.5 h-3.5 text-ink" />
                        <span>가장 적극적으로 취해야 할 기회</span>
                      </div>
                      <p className="text-sm text-ink-soft leading-relaxed">{aiData.opportunities}</p>
                    </div>
                  )}
                  {aiData.precautions && (
                    <div className="bg-sunken p-4.5 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <ShieldAlert className="w-3.5 h-3.5 text-ink" />
                        <span>주의해야 할 함정과 대처법</span>
                      </div>
                      <p className="text-sm text-ink-soft leading-relaxed">{aiData.precautions}</p>
                    </div>
                  )}
                </div>

                {/* 주차별 흐름 */}
                {Array.isArray(aiData.weeks_flow) && aiData.weeks_flow.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>주차별 운세 궤적</span>
                    </h4>
                    <div className="divide-y divide-line rounded-xl bg-sunken overflow-hidden">
                      {aiData.weeks_flow.map((weekText: string, wIdx: number) => (
                        <div key={wIdx} className="p-3.5 flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4 text-left">
                          <span className="shrink-0 text-xs font-semibold text-ink w-14">{wIdx + 1}주차</span>
                          <p className="text-sm text-ink-soft leading-relaxed flex-1">{weekText}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 연간 전용 상세 섹션 */}
            {activeTab === "yearly" && (aiData?.grand_trend || aiData?.wealth_flow || aiData?.career_path || aiData?.personal_growth) && (
              <div className="space-y-4 pt-2">
                <h3 className="text-[15px] font-semibold text-ink border-b border-line pb-2">
                  올해의 4대 핵심 로드맵
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {aiData.grand_trend && (
                    <div className="bg-sunken p-4.5 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <TrendingUp className="w-3.5 h-3.5 text-ink" />
                        <span>올해의 대변국과 변곡점</span>
                      </div>
                      <p className="text-sm text-ink-soft leading-relaxed">{aiData.grand_trend}</p>
                    </div>
                  )}
                  {aiData.wealth_flow && (
                    <div className="bg-sunken p-4.5 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <Coins className="w-3.5 h-3.5 text-ink" />
                        <span>재물 축적과 자산 운용</span>
                      </div>
                      <p className="text-sm text-ink-soft leading-relaxed">{aiData.wealth_flow}</p>
                    </div>
                  )}
                  {aiData.career_path && (
                    <div className="bg-sunken p-4.5 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <Briefcase className="w-3.5 h-3.5 text-ink" />
                        <span>직업 성취와 커리어 도약</span>
                      </div>
                      <p className="text-sm text-ink-soft leading-relaxed">{aiData.career_path}</p>
                    </div>
                  )}
                  {aiData.personal_growth && (
                    <div className="bg-sunken p-4.5 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <Compass className="w-3.5 h-3.5 text-ink" />
                        <span>내면 성장과 마음 수양</span>
                      </div>
                      <p className="text-sm text-ink-soft leading-relaxed">{aiData.personal_growth}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI 전용 상세 (유료 - 호환용) */}
            {aiData?.detail && (
              <div className="space-y-3">
                <h3 className="text-[15px] font-semibold text-ink border-b border-line pb-2">
                  자세히 보기
                </h3>
                {renderRichText(aiData.detail)}
              </div>
            )}
          </div>

          {/* 잠금 오버레이 */}
          {isLocked && (
            <div className="absolute inset-0 bg-paper/85 flex items-start justify-center p-4 pt-16 rounded-xl">
              <div className="w-full max-w-sm bg-surface rounded-xl p-6 shadow-lg space-y-4 text-center">
                <div className="w-12 h-12 rounded-xl bg-sunken flex items-center justify-center mx-auto text-seal">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-ink">
                    {LOCK_COPY[activeTab as Exclude<HoroscopePeriod, "today">].title}
                  </h3>
                  <p className="text-sm text-ink-soft leading-relaxed">
                    {LOCK_COPY[activeTab as Exclude<HoroscopePeriod, "today">].desc}
                  </p>
                </div>
                {onUnlockClick && (
                  <button
                    type="button"
                    onClick={onUnlockClick}
                    className="w-full py-3 bg-seal hover:bg-seal-deep text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  >
                    확인권 또는 쿠폰으로 열기
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
