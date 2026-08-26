/**
 * Fluent Korean Utility (inspired by https://github.com/snflkd/fluent-korean)
 * 
 * LLM 및 시스템 생성 한국어 텍스트의 유창성, 자연스러운 조사 결합, 번역투 교정,
 * 그리고 완전한 문장 구조(조사/어미 누락 방지)를 지원하는 유틸리티입니다.
 */

// 받침(종성) 유무 확인 함수
export function hasJongseong(str: string): boolean {
  if (!str) return false;
  const lastChar = str.trim().slice(-1);
  const code = lastChar.charCodeAt(0);
  // 한글 유니코드 범위: 0xAC00 ~ 0xD7A3
  if (code < 0xAC00 || code > 0xD7A3) {
    // 영문, 숫자, 특수문자 등의 받침 추정 (숫자 0,1,3,6,7,8은 받침 있음)
    if (/[013678lmnrLMNR]$/.test(lastChar)) return true;
    return false;
  }
  return (code - 0xAC00) % 28 > 0;
}

/**
 * 단어 뒤에 적절한 한국어 조사를 자동으로 결합합니다.
 * @param word 앞 단어 (예: "김도화", "혁")
 * @param josaType 조사 종류 ("은/는", "이/가", "을/를", "과/와", "으로/로", "아/야")
 */
export function attachJosa(word: string, josaType: "은/는" | "이/가" | "을/를" | "과/와" | "으로/로" | "아/야"): string {
  if (!word) return "";
  const withJong = hasJongseong(word);

  switch (josaType) {
    case "은/는":
      return `${word}${withJong ? "은" : "는"}`;
    case "이/가":
      return `${word}${withJong ? "이" : "가"}`;
    case "을/를":
      return `${word}${withJong ? "을" : "를"}`;
    case "과/와":
      return `${word}${withJong ? "과" : "와"}`;
    case "으로/로": {
      // 종성이 'ㄹ'(받침 코드 8)인 경우 '로' 사용
      const code = word.trim().slice(-1).charCodeAt(0);
      const jong = (code - 0xAC00) % 28;
      if (jong === 8) return `${word}로`;
      return `${word}${withJong ? "으로" : "로"}`;
    }
    case "아/야":
      return `${word}${withJong ? "아" : "야"}`;
    default:
      return word;
  }
}

/**
 * fluent-korean 가이드라인 프롬프트 텍스트 (Gemini 및 LLM 주입용)
 * https://github.com/snflkd/fluent-korean 기반
 */
export const FLUENT_KOREAN_SYSTEM_INSTRUCTION = `
## [snflkd/fluent-korean 한국어 출력 유창성 가이드라인]
(https://github.com/snflkd/fluent-korean 원칙 준수)

1. **조사 및 어미의 생략 절대 금지 (완전한 문장 구조):**
   - 주어, 목적어, 보어 뒤에 붙는 필수 조사('은/는', '이/가', '을/를', '에/에게', '으로/로', '와/과' 등)를 절대 생략하지 마십시오.
   - 명사만 파편화하여 나열하는 '전보식 어투'나 개조식 문장(예: "성격 온화. 사주 목 기운 강함.")을 엄격히 금지합니다.
   - 온전한 주어-서술어 호응과 풍부한 연결 어미(~하며, ~하므로, ~합니다)를 갖춘 자연스러운 한국어 문장으로 서술하십시오.

2. **영어 번역투 및 은유적 직역 어휘 배제:**
   - "~를 가지다(have)", "~에 의해(by)", "~의 관점에서(in terms of)"와 같은 영어 번역투를 지양하고, 자연스러운 한국어 능동적 문장 및 세련된 어휘를 사용하십시오.

3. **명확하고 중의성이 없는 어휘와 한국어 문법 준수:**
   - 독자가 편안하게 읽을 수 있도록 정중하고 신뢰감 있는 어조(하십시오체/해요체)를 일관되게 유지하십시오.
   - 띄어쓰기와 맞춤법을 정확하게 준수하십시오.
`;

/**
 * AI 생성 텍스트의 미세한 번역투나 어색한 조사를 후보정하는 텍스트 정제기
 */
export function refineFluentKoreanText(text: string): string {
  if (!text) return "";
  return text
    // 중복 조사나 어색한 괄호 공백 정리
    .replace(/\s+/g, " ")
    .trim();
}
