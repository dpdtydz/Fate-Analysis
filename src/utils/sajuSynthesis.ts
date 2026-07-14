import { SajuData } from "../types";

export interface SajuSynthesisResult {
  dayPillarName: string; // e.g., "갑인 (甲寅)"
  metaphor: string; // e.g., "우뚝 솟은 푸른 거목의 기상"
  daymasterAnalysis: string; // Detailed analysis of the daymaster stem
  pillarAnalysis: string; // Detailed analysis of the combination
  ohaengDiagnosis: string; // Five elements balance diagnostic
  comprehensiveSummary: string; // 3-4 sentence comprehensive advice/synthesis
}

const GAN_HANGUL: Record<string, string> = {
  "甲": "갑목", "乙": "을목", "丙": "병화", "丁": "정화", "戊": "무토",
  "己": "기토", "庚": "경금", "辛": "신금", "壬": "임수", "癸": "계수"
};

const JI_HANGUL: Record<string, string> = {
  "子": "자수", "丑": "축토", "寅": "인목", "卯": "묘목", "辰": "진토",
  "巳": "사화", "午": "오화", "未": "미토", "申": "신금", "酉": "유금",
  "戌": "술토", "亥": "해수"
};

const GAN_METAPHOR: Record<string, string> = {
  "甲": "우뚝 솟은 거목(巨木)의 기상과 리더십",
  "乙": "바람을 타고 피어나는 초목(草木)의 강인한 생명력",
  "丙": "온 세상을 두루 비추는 위풍당당한 태양(太陽)의 열정",
  "丁": "어둠 속을 따뜻하게 밝히는 아늑한 등불(燈火)의 온기",
  "戊": "모든 생명을 묵묵히 품어주는 광활하고 든든한 태산(泰山)",
  "己": "곡식을 길러내는 비옥하고 온화한 전답(田畓)의 자애로움",
  "庚": "강직하고 단단한 무쇠(庚金)와 가공되지 않은 바위의 결단력",
  "辛": "섬세하게 다듬어져 영롱하게 빛나는 보석(辛金)의 예리함",
  "壬": "도도하게 흐르며 만물을 품는 끝없는 대양(大洋)의 지혜",
  "癸": "대지를 촉촉이 적시는 맑은 봄비(雨露水)의 영감과 센스"
};

const JI_METAPHOR: Record<string, string> = {
  "子": "총명함과 깊은 직관을 지닌 영리한 쥐",
  "丑": "끈기와 우직함으로 대업을 성취하는 충직한 소",
  "寅": "위엄과 도전 정신으로 무리를 이끄는 당당한 호랑이",
  "卯": "예술적 감수성과 따뜻한 사교성을 품은 유연한 토끼",
  "辰": "스케일이 크고 신비로운 이상을 추구하는 푸른 용",
  "巳": "치밀한 계획성과 뜨거운 표현력을 지닌 지혜로운 뱀",
  "午": "자유로운 추진력과 넘치는 에너지를 발산하는 역동적인 말",
  "未": "배려심이 깊고 공동체의 조화를 소중히 여기는 부드러운 양",
  "申": "재주가 많고 임기응변에 능해 두뇌 회전이 빠른 원숭이",
  "酉": "완벽주의와 높은 심미안을 지닌 예리하고 총명한 닭",
  "戌": "신의가 두텁고 신뢰받는 충성스러운 수호자 개",
  "亥": "지혜롭고 마음이 넓으며 시작과 끝이 맺음성 있는 묵직한 돼지"
};

export function getSajuPillarsComprehensiveSynthesis(saju: SajuData, nickname: string): SajuSynthesisResult {
  const dayGan = saju.pillars.day.gan;
  const dayJi = saju.pillars.day.ji;

  const dayGanKor = GAN_HANGUL[dayGan] || "일간";
  const dayJiKor = JI_HANGUL[dayJi] || "일지";
  const dayPillarName = `${dayGanKor} ${dayJiKor} (${dayGan}${dayJi}) 일주`;

  const metaphor = `${dayGanKor}의 주체성과 ${dayJiKor}의 특성이 만나 조화를 이루는 격`;

  // 1. Daymaster Analysis
  const daymasterAnalysis = `당신의 우주적 본질이자 정신을 지배하는 천간 기운은 [${dayGanKor}]입니다. ${GAN_METAPHOR[dayGan] || "조화로운 기운"}를 상징하는 이 기운은 ${nickname}님의 숨겨진 리더십과 세련된 성품의 근간이 됩니다. 어떠한 난관 앞에서도 주체성을 잃지 않으며 자신만의 확실한 가치를 지켜나가는 원동력이 여기에 있습니다.`;

  // 2. Pillar Combination Analysis
  const pillarAnalysis = `나의 가장 가까운 환경과 배우자궁을 상징하는 일지 [${dayJiKor}]는 [${JI_METAPHOR[dayJi] || "유연한 기운"}]를 의미합니다. 천간의 정신력이 현실적인 동물 기운인 지지와 융합하여, 생각에 머무르지 않고 현실 속에서 유능하게 열매를 맺는 유연한 생존 방식을 형성합니다. 겉으로는 강건해 보이지만 속내는 은근히 잔정과 포용력이 넓은 성품입니다.`;

  // 3. Five Elements Balance Diagnostic
  const counts = saju.ohaeng_count || { "목": 0, "화": 0, "토": 0, "금": 0, "수": 0 };
  const strongestElement = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const weakestElement = Object.entries(counts).sort((a, b) => a[1] - b[1])[0][0];

  let ohaengDiagnosis = `오행 분포 상 현재 가장 도드라진 기운은 [${strongestElement} 기운](총 ${counts[strongestElement]}개)이며, 다소 아쉽거나 보완이 필요한 기운은 [${weakestElement} 기운](총 ${counts[weakestElement]}개)입니다. `;
  
  if (strongestElement === "목") {
    ohaengDiagnosis += "새로운 도전과 기획 능력이 탁월하지만, 마무리를 짓는 결단력이 약할 수 있으니 끈기를 기르는 것이 개운(開運)의 지름길입니다.";
  } else if (strongestElement === "화") {
    ohaengDiagnosis += "정열적이고 시원시원한 표현력을 가지셨으나, 때때로 급한 마음이 앞서 실수가 생길 수 있으니 한 템포 쉬어가는 여유가 행운을 가져다줍니다.";
  } else if (strongestElement === "토") {
    ohaengDiagnosis += "신용이 매우 두텁고 만물을 중재하는 무게감이 훌륭하지만, 자칫 고집이 강해지거나 생각이 많아져 정체될 수 있으니 신속한 실행력이 요구됩니다.";
  } else if (strongestElement === "금") {
    ohaengDiagnosis += "의리가 있고 시시비비가 명확하며 완벽주의 성향을 띠고 있으나, 가끔 주변에 너무 날카로운 기준을 들이댈 수 있으니 온화한 관용이 필요합니다.";
  } else {
    ohaengDiagnosis += "지혜가 깊고 임기응변에 유능하지만 생각이 지나치게 많아 행동을 주저할 수 있으니, 자신을 믿고 가볍게 밖으로 나아가는 활동성을 늘려보세요.";
  }

  // 4. Comprehensive Synthesis
  let comprehensiveSummary = "";
  if (dayGan === "甲" || dayGan === "乙") {
    comprehensiveSummary = `${nickname}님은 봄날의 숲처럼 끝없이 뻗어 나가는 푸르른 에너지를 지니셨습니다. 사주 오행의 균형 잡힌 쓰임새 덕택에 대인관계에서 타인의 성장판을 열어주는 선한 영향력을 행사하는 귀한 명식을 타고나셨습니다.`;
  } else if (dayGan === "丙" || dayGan === "丁") {
    comprehensiveSummary = `${nickname}님은 한여름의 불꽃이나 햇살처럼 세상을 따뜻하고 밝게 조율하는 능력이 돋보입니다. 특유의 높은 친화력과 표현력을 발휘하신다면 어떠한 집단에서나 분위기를 화사하게 피워내는 핵심 허브 역할을 멋지게 수행하실 것입니다.`;
  } else if (dayGan === "戊" || dayGan === "己") {
    comprehensiveSummary = `${nickname}님은 한가을의 넓고 넉넉한 대지처럼 만인을 포용하고 묵묵히 자신의 자리를 지키는 듬직한 사람입니다. 신의를 최고 가치로 여기는 곧은 성품 덕분에, 시간이 갈수록 주변의 존경과 인덕(人德)이 견고하게 쌓이는 대기만성형 흐름을 지녔습니다.`;
  } else if (dayGan === "庚" || dayGan === "辛") {
    comprehensiveSummary = `${nickname}님은 맑고 정교한 가을의 찬바람처럼 맺고 끊음이 확실하고 세련된 완성도가 명품인 사람입니다. 뛰어난 직관과 예리한 판단력을 활용하여 전문적인 영역에서 칼자루를 쥐는 활약을 보여줄 때 인생이 최고의 풍요와 명예를 맞이하게 됩니다.`;
  } else {
    comprehensiveSummary = `${nickname}님은 겨울철 밤하늘 아래 조용히 흐르는 생명의 근원수처럼, 지혜와 창조성이 무궁무진한 영성가 타입입니다. 남들이 쉽게 깨닫지 못하는 무의식의 영역이나 보이지 않는 맥락을 정확하게 해독하는 남다른 지혜를 품고 계십니다.`;
  }

  return {
    dayPillarName,
    metaphor: METAPHOR_PRESETS[dayGan + dayJi] || metaphor,
    daymasterAnalysis,
    pillarAnalysis,
    ohaengDiagnosis,
    comprehensiveSummary
  };
}

const METAPHOR_PRESETS: Record<string, string> = {
  "甲子": "한겨울 눈밭 속에 우뚝 솟아오른 푸른 나무의 기상 (강인한 주체성)",
  "甲戌": "가을 산맥을 당당하게 호령하며 영역을 가꾸는 푸른 호랑이",
  "甲申": "바위벽을 뚫고 솟아나 강직함을 보여주는 절벽 위의 기송 (의리와 사명)",
  "甲午": "여름 들판을 거침없이 활보하는 역동적이고 눈부신 청마 (도전과 기획)",
  "甲辰": "드넓은 봄날의 옥토 위에 영양이 풍부하게 자란 생명나무 (성장과 번영)",
  "甲寅": "뿌리가 단단하고 거대하여 숲을 지배하는 천상의 거목 (강직과 신념)",
  
  "乙丑": "얼어붙은 동토(凍土) 속에서 봄을 준비하는 담쟁이넝쿨 (인내와 끈기)",
  "乙亥": "끝없는 푸른 바다 위에 떠서 세상을 항해하는 수초 (적응력과 통찰)",
  "乙酉": "날카로운 바위 틈에서 피어난 우아한 꽃 한 송이 (강단과 예술성)",
  "乙未": "따뜻한 여름날의 푸른 들판에서 조화를 가꾸는 아름다운 초목",
  "乙巳": "화사한 꽃밭 사이를 지혜롭고 화려하게 누비는 영민한 초록 뱀",
  "乙卯": "봄비 속에 생명력이 가득 차 무한히 뻗어 나가는 푸르른 넝쿨",
  
  "丙子": "어두운 밤하늘 위를 화려하게 비추는 영롱한 오로라 (선구적 직관)",
  "丙戌": "노을빛 붉게 물든 거대한 태산 아래 타오르는 묵직한 화합",
  "丙申": "한낮의 가을 하늘 아래 반짝이는 영롱한 보석의 웅장함",
  "丙午": "대지를 뜨겁게 폭발시키는 백만 불꽃의 열정 (최고의 활동력)",
  "丙辰": "봄 안개를 뚫고 솟아올라 드넓은 벌판을 고르게 비추는 붉은 용",
  "丙寅": "붉은 태양을 등지고 밀림을 개척하는 기운찬 아침 호랑이 (위풍당당)",
  
  "丁丑": "보이지 않는 어둠 속에서 철을 녹이는 촛불의 내공과 기술성",
  "丁亥": "깊은 밤 잔잔한 바다 위에 반사된 신비로운 달빛 (지혜와 수호)",
  "丁酉": "어둠 속 금반지를 예리하게 감정하는 정밀한 헤드라이트 (완벽주의)",
  "丁未": "작열하는 타오르는 대지 위에서 만물을 익히는 은근한 열정",
  "丁巳": "붉게 타오르며 대지를 거침없이 누비는 뜨겁고 명쾌한 불꽃",
  "丁卯": "은은한 촛불이 나무 상자를 만나 영감을 증폭시키는 예술가 기질"
};
