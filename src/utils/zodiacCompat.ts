/**
 * 지지(地支) 관계로 계산하는 띠 궁합
 *
 * 사용하는 관계는 세 가지다.
 *  - 삼합(三合): 申子辰(수국) 亥卯未(목국) 寅午戌(화국) 巳酉丑(금국) — 같은 국(局)끼리 뭉친다
 *  - 육합(六合): 子丑 寅亥 卯戌 辰酉 巳申 午未 — 짝을 이루어 서로를 붙든다
 *  - 충(沖):     子午 丑未 寅申 卯酉 辰戌 巳亥 — 정면으로 부딪히는, 맞춰가야 할 관계
 *
 * 형(刑)·해(害)는 해석이 갈리고 층이 두꺼워져 여기서는 쓰지 않는다.
 *
 * 입력 지지는 한자("亥")와 한글("해")을 모두 받는다.
 * MySajuView가 profile.saju.pillars.day.ji에서 값을 가져오는데 한글로 저장된 경우가 있다.
 */

/** 지지 12개 (한자 정규형) */
export const BRANCHES = [
  "子", "丑", "寅", "卯", "辰", "巳",
  "午", "未", "申", "酉", "戌", "亥",
] as const;

export type Branch = (typeof BRANCHES)[number];

/** 한글 지지 → 한자 지지 */
const KO_TO_BRANCH: Record<string, Branch> = {
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳",
  오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
};

/** 지지 → 한글 띠 이름 */
const BRANCH_TO_ANIMAL_NAME: Record<Branch, string> = {
  子: "쥐", 丑: "소", 寅: "호랑이", 卯: "토끼",
  辰: "용", 巳: "뱀", 午: "말", 未: "양",
  申: "원숭이", 酉: "닭", 戌: "개", 亥: "돼지",
};

/** 지지 → 본기(本氣) 오행 — 캐릭터 이미지 오행을 정할 때 쓴다 */
const BRANCH_TO_ELEMENT: Record<Branch, string> = {
  寅: "목", 卯: "목",
  巳: "화", 午: "화",
  辰: "토", 戌: "토", 丑: "토", 未: "토",
  申: "금", 酉: "금",
  亥: "수", 子: "수",
};

/** 삼합 국(局) — 세 지지가 하나의 오행 기운으로 뭉친다 */
const SAMHAP: { members: Branch[]; guk: string }[] = [
  { members: ["申", "子", "辰"], guk: "수국(水局)" },
  { members: ["亥", "卯", "未"], guk: "목국(木局)" },
  { members: ["寅", "午", "戌"], guk: "화국(火局)" },
  { members: ["巳", "酉", "丑"], guk: "금국(金局)" },
];

/** 육합 — 짝을 이루는 두 지지 */
const YUKHAP: [Branch, Branch][] = [
  ["子", "丑"], ["寅", "亥"], ["卯", "戌"],
  ["辰", "酉"], ["巳", "申"], ["午", "未"],
];

/** 충 — 정면으로 마주 보는 두 지지 */
const CHUNG: [Branch, Branch][] = [
  ["子", "午"], ["丑", "未"], ["寅", "申"],
  ["卯", "酉"], ["辰", "戌"], ["巳", "亥"],
];

/** 한자·한글 어느 쪽이 들어와도 한자 지지로 정규화한다. 모르는 값이면 null. */
export function normalizeBranch(input?: string | null): Branch | null {
  if (!input) return null;
  const ch = input.trim().charAt(0);
  if (!ch) return null;
  if ((BRANCHES as readonly string[]).includes(ch)) return ch as Branch;
  return KO_TO_BRANCH[ch] ?? null;
}

/** 지지의 한글 띠 이름 */
export function branchAnimalName(branch: Branch): string {
  return BRANCH_TO_ANIMAL_NAME[branch];
}

/** 지지의 본기 오행 (한글: 목/화/토/금/수) */
export function branchElement(branch: Branch): string {
  return BRANCH_TO_ELEMENT[branch];
}

export type BestRelation = "삼합" | "육합";
export type CautionRelation = "충";

export interface BranchMatch<R extends string> {
  /** 상대 지지 (한자) */
  branch: Branch;
  /** 상대 띠 한글 이름 */
  animal: string;
  /** 상대 지지의 본기 오행 (한글) */
  element: string;
  /** 관계 이름 */
  relation: R;
  /** 관계 한자 표기 — 예: "亥卯未 삼합(三合)", "卯戌 육합(六合)" */
  hanjaRelation: string;
  /** 한 줄 설명 */
  oneLiner: string;
}

export type BestBranchMatch = BranchMatch<BestRelation>;
export type CautionBranchMatch = BranchMatch<CautionRelation>;

function pairText(a: Branch, b: Branch): string {
  return `${a}${b}`;
}

/**
 * 잘 맞는 띠 — 삼합 2개 + 육합 1개, 최대 3개.
 * 삼합을 먼저 두는 이유는 삼합이 육합보다 결속이 넓고 오래가는 관계이기 때문이다.
 */
export function getBestBranches(dayJi?: string | null): BestBranchMatch[] {
  const me = normalizeBranch(dayJi);
  if (!me) return [];

  const out: BestBranchMatch[] = [];
  const seen = new Set<Branch>();

  // 삼합 — 같은 국에 속한 나머지 두 지지
  const guk = SAMHAP.find((g) => g.members.includes(me));
  if (guk) {
    const label = guk.members.join("");
    for (const b of guk.members) {
      if (b === me || seen.has(b)) continue;
      seen.add(b);
      out.push({
        branch: b,
        animal: BRANCH_TO_ANIMAL_NAME[b],
        element: BRANCH_TO_ELEMENT[b],
        relation: "삼합",
        hanjaRelation: `${label} 삼합(三合)`,
        oneLiner: `${BRANCH_TO_ANIMAL_NAME[b]}띠와는 ${guk.guk}으로 뭉쳐, 목표가 같을 때 서로의 힘을 크게 키워줍니다.`,
      });
    }
  }

  // 육합 — 짝지지
  for (const [a, b] of YUKHAP) {
    let partner: Branch | null = null;
    if (a === me) partner = b;
    else if (b === me) partner = a;
    if (!partner || seen.has(partner)) continue;
    seen.add(partner);
    out.push({
      branch: partner,
      animal: BRANCH_TO_ANIMAL_NAME[partner],
      element: BRANCH_TO_ELEMENT[partner],
      relation: "육합",
      hanjaRelation: `${pairText(a, b)} 육합(六合)`,
      oneLiner: `${BRANCH_TO_ANIMAL_NAME[partner]}띠와는 육합으로 맞물려, 곁에 있는 것만으로 마음이 편안해지는 사이입니다.`,
    });
  }

  return out;
}

/** 맞춰가야 할 띠 — 충(沖) 하나. */
export function getCautionBranches(dayJi?: string | null): CautionBranchMatch[] {
  const me = normalizeBranch(dayJi);
  if (!me) return [];

  const out: CautionBranchMatch[] = [];
  for (const [a, b] of CHUNG) {
    let partner: Branch | null = null;
    if (a === me) partner = b;
    else if (b === me) partner = a;
    if (!partner) continue;
    out.push({
      branch: partner,
      animal: BRANCH_TO_ANIMAL_NAME[partner],
      element: BRANCH_TO_ELEMENT[partner],
      relation: "충",
      hanjaRelation: `${pairText(a, b)} 충(沖)`,
      oneLiner: `${BRANCH_TO_ANIMAL_NAME[partner]}띠와는 충으로 마주 서서, 속도와 방식을 먼저 맞추면 오히려 서로를 자극하는 관계가 됩니다.`,
    });
  }
  return out;
}

/**
 * 특정 오행을 가진 사람 중, 나(일지)와 가장 잘 맞는 띠를 고른다.
 *
 * "잘 맞는 카드"는 오행(예: 土)만 알려주는데, 캐릭터 이미지는 띠까지 있어야 고를 수 있다.
 * 그래서 그 오행을 본기로 가지는 지지 후보 중에서
 * 삼합 > 육합 > 무관계 순으로 나와 관계가 가까운 쪽을 대표로 뽑는다.
 * (土처럼 후보가 넷인 오행에서 아무거나 집지 않기 위한 규칙)
 *
 * @param element 상대의 오행 — 한글("토") 또는 한자("土")
 * @param dayJi   나의 일지
 * @returns 대표 지지와 띠 이름. 후보가 없으면 null
 */
export function getRepresentativeBranch(
  element?: string | null,
  dayJi?: string | null
): { branch: Branch; animal: string; element: string; relation: string } | null {
  if (!element) return null;

  // 한자 오행도 받아준다
  const HANJA_TO_KO: Record<string, string> = {
    木: "목", 火: "화", 土: "토", 金: "금", 水: "수",
  };
  const elem = HANJA_TO_KO[element] || element;

  const candidates = (BRANCHES as readonly Branch[]).filter(
    (b) => BRANCH_TO_ELEMENT[b] === elem
  );
  if (candidates.length === 0) return null;

  const me = normalizeBranch(dayJi);
  if (!me) {
    const b = candidates[0];
    return { branch: b, animal: BRANCH_TO_ANIMAL_NAME[b], element: elem, relation: "" };
  }

  const isSamhap = (other: Branch) =>
    SAMHAP.some((g) => g.members.includes(me) && g.members.includes(other) && other !== me);
  const isYukhap = (other: Branch) =>
    YUKHAP.some(([a, b]) => (a === me && b === other) || (b === me && a === other));

  // 삼합 → 육합 → 그 외 순으로 우선한다
  const ranked = [...candidates].sort((x, y) => {
    const rank = (b: Branch) => (isSamhap(b) ? 0 : isYukhap(b) ? 1 : 2);
    return rank(x) - rank(y);
  });

  const picked = ranked[0];
  return {
    branch: picked,
    animal: BRANCH_TO_ANIMAL_NAME[picked],
    element: elem,
    relation: isSamhap(picked) ? "삼합" : isYukhap(picked) ? "육합" : "",
  };
}
