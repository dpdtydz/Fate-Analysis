/**
 * GA4 / Mixpanel 연동 전환 퍼널 A/B 테스트 최적화 엔진
 * 모임 초대율 및 유료 리포트 결제/쿠폰 전환율을 극대화하기 위한 다변량 실험 인프라
 */

import { logAnalyticsEvent } from "./analytics";

export type ExperimentKey = 
  | "invite_cta_variant"       // 모임 초대 버튼 카피 및 액션
  | "paywall_headline_variant"  // 프리미엄 결제/쿠폰 모달 헤드라인
  | "soul_card_share_variant";  // 소울 카드 공유 시트 노출 방식

export interface ExperimentConfig<T extends string = string> {
  key: ExperimentKey;
  variants: { id: T; weight: number }[];
  description: string;
}

// 1. 등록된 활성 실험 목록
export const ACTIVE_EXPERIMENTS: Record<ExperimentKey, ExperimentConfig> = {
  invite_cta_variant: {
    key: "invite_cta_variant",
    variants: [
      { id: "A_control", weight: 34 },     // "친구 초대하기"
      { id: "B_chemi_test", weight: 33 },  // "우리 둘의 진짜 케미 확인하기"
      { id: "C_soul_card", weight: 33 }   // "소울 카드 보내고 무료 궁합 보기"
    ],
    description: "모임 초대 버튼 클릭률 및 바이럴 공유율 최적화"
  },
  paywall_headline_variant: {
    key: "paywall_headline_variant",
    variants: [
      { id: "A_control", weight: 50 },     // "평생 보관 심층 리포트"
      { id: "B_urgent_coupon", weight: 50 } // "오늘만 열리는 1회 무료 체험 쿠폰"
    ],
    description: "유료 심층 감정서 열람 전환율 최적화"
  },
  soul_card_share_variant: {
    key: "soul_card_share_variant",
    variants: [
      { id: "A_native_sheet", weight: 50 }, // 1초 네이티브 파일 공유 시트 우선
      { id: "B_card_preview", weight: 50 }  // 카드 비주얼 3D 뷰어 우선
    ],
    description: "소울 카드 이미지 저장 및 인스타/카톡 공유율 최적화"
  }
};

// 2. 일관된 디바이스/사용자 고유 해시 생성
function getOrCreateDeviceId(): string {
  const STORAGE_KEY = "inyeon_ab_device_id";
  let deviceId = localStorage.getItem(STORAGE_KEY);
  if (!deviceId) {
    deviceId = "dev_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  return deviceId;
}

// 간단한 결정론적(Deterministic) 스트링 해시 함수
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * 특정 실험의 사용자 변형군(Variant)을 결정론적으로 반환하고 노출 이벤트를 1회 기록
 */
export function getExperimentVariant<T extends string = string>(
  expKey: ExperimentKey,
  userIdOrSessionId?: string
): T {
  const exp = ACTIVE_EXPERIMENTS[expKey];
  if (!exp) return "A_control" as T;

  const subjectId = userIdOrSessionId || getOrCreateDeviceId();
  const seed = `${expKey}_${subjectId}`;
  const hashVal = hashString(seed) % 100;

  let cumulative = 0;
  let chosenVariant = exp.variants[0].id;

  for (const v of exp.variants) {
    cumulative += v.weight;
    if (hashVal < cumulative) {
      chosenVariant = v.id;
      break;
    }
  }

  // Impression 중복 방지 (세션 단위)
  const sessionLogKey = `inyeon_exp_imp_${expKey}_${chosenVariant}`;
  if (!sessionStorage.getItem(sessionLogKey)) {
    sessionStorage.setItem(sessionLogKey, "1");
    logAnalyticsEvent({
      eventName: "ab_test_impression",
      category: "experiment",
      metadata: {
        experiment_id: expKey,
        variant_id: chosenVariant,
        subject_id: subjectId
      }
    });
  }

  return chosenVariant as T;
}

/**
 * 실험 목표 전환(Conversion) 발생 시 호출 (예: 초대 버튼 클릭, 쿠폰 사용, 결제 완료 등)
 */
export function trackExperimentConversion(
  expKey: ExperimentKey,
  conversionGoal: string,
  extraMetadata?: Record<string, any>
) {
  const variant = getExperimentVariant(expKey);
  const subjectId = getOrCreateDeviceId();

  logAnalyticsEvent({
    eventName: "ab_test_conversion",
    category: "conversion",
    metadata: {
      experiment_id: expKey,
      variant_id: variant,
      goal: conversionGoal,
      subject_id: subjectId,
      ...extraMetadata
    }
  });
}
