export interface IljuMeta {
  code: string;         // e.g. "신묘", "갑자"
  hanja: string;        // e.g. "辛卯", "甲子"
  element: "목" | "화" | "토" | "금" | "수";
  colorName: "청색(푸른)" | "적색(붉은)" | "황색(황금)" | "백색(하얀)" | "흑색(검은)";
  colorHex: string;
  animal: "쥐" | "소" | "호랑이" | "토끼" | "용" | "뱀" | "말" | "양" | "원숭이" | "닭" | "개" | "돼지";
  animalEmoji: string;
  title: string;        // e.g. "하얀 토끼 (백묘)"
  tagline: string;      // e.g. "맑고 예리한 영감과 순수한 미적 감각"
  traits: string[];     // 3 core keywords
  summary: string;
  strength: string;
  advice: string;
}

// 10간 오행 & 색상 매핑
const STEM_META: Record<string, { element: "목" | "화" | "토" | "금" | "수"; colorName: any; colorHex: string }> = {
  "갑": { element: "목", colorName: "청색(푸른)", colorHex: "#10B981" },
  "을": { element: "목", colorName: "청색(푸른)", colorHex: "#059669" },
  "병": { element: "화", colorName: "적색(붉은)", colorHex: "#EF4444" },
  "정": { element: "화", colorName: "적색(붉은)", colorHex: "#DC2626" },
  "무": { element: "토", colorName: "황색(황금)", colorHex: "#F59E0B" },
  "기": { element: "토", colorName: "황색(황금)", colorHex: "#D97706" },
  "경": { element: "금", colorName: "백색(하얀)", colorHex: "#64748B" },
  "신": { element: "금", colorName: "백색(하얀)", colorHex: "#94A3B8" },
  "임": { element: "수", colorName: "흑색(검은)", colorHex: "#3B82F6" },
  "계": { element: "수", colorName: "흑색(검은)", colorHex: "#2563EB" },
};

// 12지 동물 & 이모지 매핑
const BRANCH_META: Record<string, { animal: any; emoji: string }> = {
  "자": { animal: "쥐", emoji: "🐭" },
  "축": { animal: "소", emoji: "🐮" },
  "인": { animal: "호랑이", emoji: "🐯" },
  "묘": { animal: "토끼", emoji: "🐰" },
  "진": { animal: "용", emoji: "🐲" },
  "사": { animal: "뱀", emoji: "🐍" },
  "오": { animal: "말", emoji: "🐴" },
  "미": { animal: "양", emoji: "🐑" },
  "신": { animal: "원숭이", emoji: "🐵" },
  "유": { animal: "닭", emoji: "🐔" },
  "술": { animal: "개", emoji: "🐶" },
  "해": { animal: "돼지", emoji: "🐷" },
};

// 60간지 대표 특성 데이터
const ILJU_TRAITS_REGISTRY: Record<string, {
  tagline: string;
  traits: string[];
  summary: string;
  strength: string;
  advice: string;
}> = {
  "갑자": {
    tagline: "지혜로운 바다 위의 큰 나무",
    traits: ["총명함", "자존심", "창의성"],
    summary: "깊은 지혜와 자존심을 바탕으로 스스로 길을 개척하는 선구자적 기질을 가집니다.",
    strength: "아이디어가 풍부하고 배움이 빠르며 어디서나 리더로 두각을 나타냅니다.",
    advice: "고집을 내려놓고 타인의 조언을 경청할 때 더 큰 성취를 이룹니다."
  },
  "을축": {
    tagline: "눈 덮인 대지 위 끈질긴 인동초",
    traits: ["인내력", "성실함", "재물복"],
    summary: "어떤 혹한 속에서도 묵묵히 뿌리를 내리고 실속 있는 결실을 맺는 알짜배기 기운입니다.",
    strength: "우직한 인내력과 알뜰한 생활력으로 후반부로 갈수록 큰 자산을 모읍니다.",
    advice: "속마음을 혼자 삭이지 말고 가까운 사람들과 가볍게 털어놓으세요."
  },
  "병인": {
    tagline: "새벽 숲을 포효하는 찬란한 태양",
    traits: ["열정", "통솔력", "솔직함"],
    summary: "당당한 위엄과 솔직한 화끈함으로 주변을 단숨에 사로잡는 강력한 카리스마가 돋보입니다.",
    strength: "낙천적이며 추진력이 압도적이어서 새로운 프로젝트를 개척하는 데 탁월합니다.",
    advice: "뒷마무리를 꼼꼼하게 챙기는 끈기를 보완하면 금상첨화입니다."
  },
  "정묘": {
    tagline: "꽃밭을 비추는 따스한 등불",
    traits: ["감수성", "예술성", "친화력"],
    summary: "섬세하고 다정한 감성과 뛰어난 심미안으로 사람들의 마음을 보듬는 온화한 기운입니다.",
    strength: "직관력과 센스가 뛰어나 디자인, 기획, 사람과의 공감대 형성에 최고입니다.",
    advice: "감정 기복을 다스리고 중요한 결정은 냉정한 데이터로 검증하세요."
  },
  "무진": {
    tagline: "비구름을 품은 광활한 황룡",
    traits: ["스케일", "포용력", "배짱"],
    summary: "대인배의 기상과 흔들리지 않는 묵직함으로 만인을 품어 안는 웅장한 리더십을 지닙니다.",
    strength: "위기 속에서도 침착하며 남들이 엄두를 못 내는 거대한 판을 주도합니다.",
    advice: "독단적인 판단을 피하고 협업 파트너들의 세심한 감정을 보살피세요."
  },
  "기사": {
    tagline: "햇살을 머금은 비옥한 정원",
    traits: ["순발력", "다정함", "두뇌회전"],
    summary: "따뜻한 배려심과 비상한 지적 탐구심을 지녀 사람들에게 신뢰와 호감을 줍니다.",
    strength: "상황 판단이 매우 기민하며 주변을 편안하게 조율하는 중재자 역할을 잘 해냅니다.",
    advice: "지나친 의심이나 조급증을 내려놓고 여유로운 호흡을 유지하세요."
  },
  "경오": {
    tagline: "용광로 속에서 단련된 순백의 명마",
    traits: ["정의감", "품격", "결단력"],
    summary: "예의 바르고 단정하면서도 불의를 보면 참지 못하는 강직한 원칙주의자입니다.",
    strength: "조직의 규율을 바로 세우고 명확한 목표를 향해 달려가는 돌파력이 우수합니다.",
    advice: "완벽주의로 인한 스트레스를 줄이고 유연한 융통성을 발휘하세요."
  },
  "신미": {
    tagline: "따스한 햇살 아래 빛나는 보석",
    traits: ["완벽주의", "학구열", "의리"],
    summary: "섬세한 감각과 결벽에 가까운 깔끔함, 학구적인 전문성을 고루 겸비한 수재입니다.",
    strength: "정밀한 분석과 장인정신이 요구되는 분야에서 독보적인 완성도를 보입니다.",
    advice: "자신과 타인에게 조금 더 관대해질 때 마음의 평화가 깃듭니다."
  },
  "임신": {
    tagline: "바위를 뚫고 솟구치는 지혜의 샘물",
    traits: ["영민함", "임기응변", "다재다능"],
    summary: "팔방미인의 재치와 거침없는 흡수력으로 어떤 분야든 빠르게 습득하는 다재다능형입니다.",
    strength: "복잡한 문제도 단숨에 핵심을 짚어 해결하는 비상한 두뇌 회전이 돋보입니다.",
    advice: "한 우물을 진득하게 파는 인내심을 더하면 일가를 이룰 수 있습니다."
  },
  "계유": {
    tagline: "달빛 아래 맑게 고인 금빛 이슬",
    traits: ["청초함", "집중력", "직관력"],
    summary: "순수하고 티 없이 맑은 감성과 영적인 직관력, 학문적 몰입도가 매우 뛰어납니다.",
    strength: "잡념을 비우고 하나에 집중하여 깊은 경지의 통찰을 얻어냅니다.",
    advice: "지나친 폐쇄성을 경계하고 세상과 적극적으로 소통하세요."
  },
  "갑술": {
    tagline: "너른 들판을 든든히 지키는 충견",
    traits: ["책임감", "의리", "실속"],
    summary: "한 번 맺은 인연에 끝까지 신의를 다하며, 현실적인 실속과 재물 감각이 뛰어납니다.",
    strength: "성실하고 믿음직스러워 조직이나 사업에서 금고를 맡기기에 최적입니다.",
    advice: "갑작스러운 독선이나 감정적 고집을 피하고 타협점을 찾으세요."
  },
  "을해": {
    tagline: "푸른 바다를 자유롭게 누비는 연꽃",
    traits: ["친화력", "유연성", "선한 성품"],
    summary: "온화하고 다정다감하여 주변 사람들의 사랑과 후원을 한몸에 받는 복록의 소유자입니다.",
    strength: "적을 만들지 않는 온화한 처세술과 남다른 학예적 재능을 자랑합니다.",
    advice: "우유부단함에 휘둘리지 말고 거절할 때는 확실하게 선을 그으세요."
  },
  "신묘": {
    tagline: "달빛 속에서 빛나는 영민한 백토끼",
    traits: ["심미안", "예민함", "순수함"],
    summary: "맑고 깨끗한 심미안과 예민한 감각으로 세상의 디테일을 읽어내는 감성파입니다.",
    strength: "예술적 감각과 감수성이 뛰어나며 트렌드를 앞서가는 안목이 있습니다.",
    advice: "상처를 마음속에 오래 담아두지 말고 긍정적인 운동이나 취미로 해소하세요."
  },
  "갑진": {
    tagline: "봄비 속을 승천하는 푸른 청룡",
    traits: ["진취성", "자립심", "리더십"],
    summary: "스스로 정상에 오르려는 패기와 당당함으로 세상을 호령하는 백호/청룡의 기상입니다.",
    strength: "새로운 사업과 도전에 주저함이 없으며 강력한 추진력을 발휘합니다.",
    advice: "속도를 조금 늦추고 팀원들의 보폭을 맞추어 주는 미덕을 발휘하세요."
  },
  "병오": {
    tagline: "한낮의 벌판을 질주하는 붉은 적마",
    traits: ["열정", "솔직담백", "압도적 에너지"],
    summary: "누구도 흉내 낼 수 없는 폭발적인 에너지와 솔직한 승부욕으로 세상을 밝힙니다.",
    strength: "위기 속에서 전면에 나서 문제를 돌파하는 압도적 행동력이 빛납니다.",
    advice: "욱하는 성급함을 주의하고 호흡을 가다듬는 침착함을 기르세요."
  },
  "무오": {
    tagline: "태양 아래 우뚝 솟은 화산의 기상",
    traits: ["묵직함", "자존심", "신용"],
    summary: "태산 같은 뚝심과 변함없는 신용으로 사람들에게 든든한 버팀목이 되어 줍니다.",
    strength: "한 번 맡은 책임은 끝까지 완수하며 큰 조직을 안정적으로 수호합니다.",
    advice: "타인의 감정적 뉘앙스를 세심하게 배려하는 다정함을 더해보세요."
  },
  "경신": {
    tagline: "단단한 백색 바위 위의 영리한 원숭이",
    traits: ["의리", "강인함", "독립심"],
    summary: "어떤 외압에도 굴하지 않는 강철 같은 의지와 비범한 재주를 타고난 실력자입니다.",
    strength: "의리가 깊고 결단력이 확실하여 동료들의 든든한 수호자가 됩니다.",
    advice: "지나치게 날카로운 직설화법 대신 부드러운 대화법을 익히세요."
  },
  "계해": {
    tagline: "끝없이 펼쳐진 망망대해의 깊은 지혜",
    traits: ["포용력", "통찰력", "유연성"],
    summary: "모든 강물을 품어내는 대양처럼 넓은 아량과 깊이를 알 수 없는 심오한 지혜를 지녔습니다.",
    strength: "기획력과 직관력이 대단히 뛰어나며 어떤 환경에도 유연하게 적응합니다.",
    advice: "생각만으로 끝내지 말고 작은 것부터 즉시 실행으로 옮기는 습관을 들이세요."
  }
};

// 60간지 간지 조합 순서 목록
export const SIXTY_GANZI_LIST: string[] = [
  "갑자", "을축", "병인", "정묘", "무진", "기사", "경오", "신미", "임신", "계유",
  "갑술", "을해", "병자", "정축", "무인", "기묘", "경진", "신사", "임오", "계미",
  "갑신", "을유", "병술", "정해", "무자", "기축", "경인", "신묘", "임진", "계사",
  "갑오", "을미", "병신", "정유", "무술", "기해", "경자", "신축", "임인", "계묘",
  "갑진", "을사", "병오", "정미", "무신", "기유", "경술", "신해", "임자", "계축",
  "갑인", "을묘", "병진", "정사", "무오", "기미", "경신", "신유", "임술", "계해"
];

// 한자 매핑
const HANJA_STEM: Record<string, string> = {
  "갑": "甲", "을": "乙", "병": "丙", "정": "丁", "무": "戊",
  "기": "己", "경": "庚", "신": "辛", "임": "壬", "계": "癸"
};

const HANJA_BRANCH: Record<string, string> = {
  "자": "子", "축": "丑", "인": "寅", "묘": "卯", "진": "辰", "사": "巳",
  "오": "午", "미": "未", "신": "申", "유": "酉", "술": "戌", "해": "亥"
};

/**
 * 60간지 일주 단일 메타데이터 생성/조회
 */
export function getIljuMeta(iljuStr: string): IljuMeta {
  if (!iljuStr) return getIljuMeta("갑자");

  // 정규화: '辛卯' -> '신묘', '신묘일주' -> '신묘'
  let normalized = iljuStr.trim().replace(/일주$/, "");

  // 한자 to 한글 역변환
  for (const [kr, hj] of Object.entries(HANJA_STEM)) {
    normalized = normalized.replace(new RegExp(hj, "g"), kr);
  }
  for (const [kr, hj] of Object.entries(HANJA_BRANCH)) {
    normalized = normalized.replace(new RegExp(hj, "g"), kr);
  }

  // 2글자 추출 (간 + 지)
  const stem = normalized[0] || "갑";
  const branch = normalized[1] || "자";
  const key = `${stem}${branch}`;

  const stemInfo = STEM_META[stem] || STEM_META["갑"];
  const branchInfo = BRANCH_META[branch] || BRANCH_META["자"];
  const customTrait = ILJU_TRAITS_REGISTRY[key];

  const hanja = `${HANJA_STEM[stem] || "甲"}${HANJA_BRANCH[branch] || "子"}`;
  const title = `${stemInfo.colorName.split("(")[1].replace(")", "")} ${branchInfo.animal}`;

  return {
    code: key,
    hanja,
    element: stemInfo.element,
    colorName: stemInfo.colorName,
    colorHex: stemInfo.colorHex,
    animal: branchInfo.animal,
    animalEmoji: branchInfo.emoji,
    title,
    tagline: customTrait?.tagline || `${stemInfo.element} 기운의 ${title} 기질`,
    traits: customTrait?.traits || [stemInfo.element + "성향", branchInfo.animal + "기운", "독립심"],
    summary: customTrait?.summary || `${stemInfo.colorName}의 기운과 ${branchInfo.animal}의 지혜가 조화를 이루는 ${title}의 명식입니다.`,
    strength: customTrait?.strength || `특유의 ${branchInfo.animal} 기운으로 위기를 현명하게 극복하고 성실하게 전진합니다.`,
    advice: customTrait?.advice || `자신의 오행인 ${stemInfo.element} 기운을 믿고 꾸준히 페이스를 유지하세요.`
  };
}

/**
 * 60간지 전체 목록 생성
 */
export function getAllSixtyIlju(): IljuMeta[] {
  return SIXTY_GANZI_LIST.map(code => getIljuMeta(code));
}
