import { Member, PairAnalysis } from "../types";

export function getWesternZodiac(birthDateStr?: string): { name: string; emoji: string } {
  if (!birthDateStr) return { name: "알 수 없음", emoji: "⭐" };
  const parts = birthDateStr.split("-");
  if (parts.length < 3) return { name: "알 수 없음", emoji: "⭐" };
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(month) || isNaN(day)) return { name: "알 수 없음", emoji: "⭐" };

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { name: "양자리", emoji: "♈" };
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { name: "황소자리", emoji: "♉" };
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return { name: "쌍둥이자리", emoji: "♊" };
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return { name: "게자리", emoji: "♋" };
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { name: "사자자리", emoji: "♌" };
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { name: "처녀자리", emoji: "♍" };
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { name: "천칭자리", emoji: "♎" };
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { name: "전갈자리", emoji: "♏" };
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { name: "사수자리", emoji: "♐" };
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { name: "염소자리", emoji: "♑" };
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { name: "물병자리", emoji: "♒" };
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return { name: "물고기자리", emoji: "♓" };

  return { name: "알 수 없음", emoji: "⭐" };
}

export function isDummyPair(pair?: Partial<PairAnalysis> | null): boolean {
  if (!pair) return true;
  if (!pair.description || pair.description.trim() === "대조합" || pair.description.trim().length < 5) return true;
  if (!pair.saju?.description || pair.saju.description.trim() === "대조합" || pair.saju.description.trim().length < 5) return true;
  if (!pair.ziwei?.description || pair.ziwei.description.trim() === "대조합" || pair.ziwei.description.trim().length < 5) return true;
  if (pair.label === "대조합") return true;
  return false;
}

export function generateDynamicPairCompatibility(m1: Member, m2: Member): PairAnalysis {
  const getDeterministicHashScore = (str1: string, str2: string, seed: number, min = 65, max = 95) => {
    const combined = [str1, str2].sort().join("");
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs((hash + seed) % (max - min + 1)) + min;
  };

  const m1Id = m1.id || "m1";
  const m2Id = m2.id || "m2";

  const g1 = m1.saju?.daymaster?.gan || "무토";
  const g2 = m2.saju?.daymaster?.gan || "기토";
  const elem1 = m1.saju?.daymaster?.element || "토";
  const elem2 = m2.saju?.daymaster?.element || "토";

  const GAN_META: Record<string, { nick: string; desc: string }> = {
    "갑목": { nick: "우직한 거목", desc: "곧고 굳센 기상과 진취적인 리더십" },
    "을목": { nick: "유연한 화초", desc: "끈질긴 친화력과 아름답고 부드러운 유연성" },
    "병화": { nick: "눈부신 태양", desc: "사방을 비추는 열정과 화끈하고 솔직한 사교성" },
    "정화": { nick: "따뜻한 등불", desc: "내면을 세심하게 읽는 세심한 지혜와 강한 집중력" },
    "무토": { nick: "광활한 태산", desc: "흔들리지 않는 든든한 신용과 묵직한 포용력" },
    "기토": { nick: "기름진 정원", desc: "주변을 알뜰살뜰 보살피는 포근함과 뛰어난 대처능력" },
    "경금": { nick: "강인한 원석", desc: "우직한 뚝심과 확실한 의리, 칼날 같은 단호함" },
    "신금": { nick: "반짝이는 보석", desc: "눈부신 지적 영민함과 세심하고 정교한 완벽주의" },
    "임수": { nick: "도도한 강물", desc: "웅장한 포용력과 물길처럼 흐르는 깊은 지혜" },
    "계수": { nick: "촉촉한 이슬", desc: "메마른 세상을 적시는 맑고 지혜로운 임기응변" },
  };

  const meta1 = GAN_META[g1] || { nick: `${elem1}기운`, desc: `${elem1}의 기운` };
  const meta2 = GAN_META[g2] || { nick: `${elem2}기운`, desc: `${elem2}의 기운` };

  let sajuScore1to2 = getDeterministicHashScore(m1Id, m2Id, 11, 70, 96);
  let sajuScore2to1 = getDeterministicHashScore(m1Id, m2Id, 33, 70, 96);
  let sajuLabel = "상생과 화합의 인연 조합";
  let sajuDesc = "";

  const isGeneratingSajuSupport =
    (elem1 === "목" && elem2 === "화") ||
    (elem1 === "화" && elem2 === "토") ||
    (elem1 === "토" && elem2 === "금") ||
    (elem1 === "금" && elem2 === "수") ||
    (elem1 === "수" && elem2 === "목");

  const isReceivingSajuSupport =
    (elem2 === "목" && elem1 === "화") ||
    (elem2 === "화" && elem1 === "토") ||
    (elem2 === "토" && elem1 === "금") ||
    (elem2 === "금" && elem1 === "수") ||
    (elem2 === "수" && elem1 === "목");

  const isSajuClash =
    (elem1 === "목" && elem2 === "토") ||
    (elem1 === "토" && elem2 === "수") ||
    (elem1 === "수" && elem2 === "화") ||
    (elem1 === "화" && elem2 === "금") ||
    (elem1 === "금" && elem2 === "목") ||
    (elem2 === "목" && elem1 === "토") ||
    (elem2 === "토" && elem1 === "수") ||
    (elem2 === "수" && elem1 === "화") ||
    (elem2 === "화" && elem1 === "금") ||
    (elem2 === "금" && elem1 === "목");

  if (isGeneratingSajuSupport) {
    sajuScore1to2 = getDeterministicHashScore(m1Id, m2Id, 17, 85, 97);
    sajuScore2to1 = getDeterministicHashScore(m1Id, m2Id, 41, 80, 95);
    sajuLabel = "오행상생의 창조적 파트너";
    sajuDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${sajuScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${sajuScore2to1}점. ${g1}의 기운이 ${g2}을 촉진해 주어, ${m1.nickname}님의 추진력이 ${m2.nickname}님의 성과로 부드럽게 이어지는 완벽한 창조적 흐름입니다.`;
  } else if (isReceivingSajuSupport) {
    sajuScore1to2 = getDeterministicHashScore(m1Id, m2Id, 23, 80, 95);
    sajuScore2to1 = getDeterministicHashScore(m1Id, m2Id, 59, 85, 97);
    sajuLabel = "상생과 든든한 조력 기류";
    sajuDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${sajuScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${sajuScore2to1}점. ${g2}의 포근한 기운이 ${g1}을 든든하게 생(生)해 주어, 서로 신뢰가 대단히 깊고 함께 대화하면 심리적 안정감을 얻는 훌륭한 관계입니다.`;
  } else if (elem1 === elem2) {
    sajuScore1to2 = getDeterministicHashScore(m1Id, m2Id, 15, 78, 92);
    sajuScore2to1 = getDeterministicHashScore(m1Id, m2Id, 45, 78, 92);
    sajuLabel = "거울을 보듯 통하는 소울 조합";
    sajuDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${sajuScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${sajuScore2to1}점. 서로 같은 '${elem1}'의 오행 기운을 공유하여, 굳이 많은 설명을 하지 않아도 깊은 동질감과 끈끈한 유대감을 나누는 완벽한 동료입니다.`;
  } else if (isSajuClash) {
    sajuScore1to2 = getDeterministicHashScore(m1Id, m2Id, 19, 65, 80);
    sajuScore2to1 = getDeterministicHashScore(m1Id, m2Id, 37, 65, 80);
    sajuLabel = "긴장 속에서 꽃피는 혁신 조합";
    sajuDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${sajuScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${sajuScore2to1}점. ${g1}과 ${g2}의 기운이 극(剋)하며 팽팽한 텐션을 형성하나, 적절한 거리와 예의를 유지하면 서로의 빈틈을 칼같이 메워주는 최고의 지적 자극제가 됩니다.`;
  } else {
    sajuScore1to2 = getDeterministicHashScore(m1Id, m2Id, 21, 75, 88);
    sajuScore2to1 = getDeterministicHashScore(m1Id, m2Id, 51, 75, 88);
    sajuLabel = "온화하고 편안한 상생 조합";
    sajuDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${sajuScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${sajuScore2to1}점. 서로 간섭하지 않는 온화한 오행 기운의 조화로, 편안한 소통과 담백한 신뢰를 지켜나가는 물 흐르듯 잔잔한 인연 기류입니다.`;
  }

  const z1 = getWesternZodiac(m1.birth_date);
  const z2 = getWesternZodiac(m2.birth_date);

  const getZodiacElement = (name: string) => {
    if (["양자리", "사자자리", "사수자리"].includes(name)) return "불";
    if (["황소자리", "처녀자리", "염소자리"].includes(name)) return "흙";
    if (["쌍둥이자리", "천칭자리", "물병자리"].includes(name)) return "공기";
    return "물";
  };

  const ze1 = getZodiacElement(z1.name);
  const ze2 = getZodiacElement(z2.name);

  let zodiacScore1to2 = getDeterministicHashScore(m1Id, m2Id, 25, 70, 95);
  let zodiacScore2to1 = getDeterministicHashScore(m1Id, m2Id, 65, 70, 95);
  let zodiacDesc = "";

  if (ze1 === ze2) {
    zodiacScore1to2 = getDeterministicHashScore(m1Id, m2Id, 29, 85, 96);
    zodiacScore2to1 = getDeterministicHashScore(m1Id, m2Id, 69, 85, 96);
    zodiacDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${zodiacScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${zodiacScore2to1}점. 두 분 다 같은 '${ze1}'의 별자리 원소를 지녀 가치관과 유머 코드가 아주 흡사하며, 함께 있으면 어색함 없이 유쾌하고 명쾌한 소통이 가능합니다.`;
  } else if (
    (ze1 === "불" && ze2 === "공기") || (ze1 === "공기" && ze2 === "불") ||
    (ze1 === "흙" && ze2 === "물") || (ze1 === "물" && ze2 === "흙")
  ) {
    zodiacScore1to2 = getDeterministicHashScore(m1Id, m2Id, 31, 82, 94);
    zodiacScore2to1 = getDeterministicHashScore(m1Id, m2Id, 71, 82, 94);
    zodiacDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${zodiacScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${zodiacScore2to1}점. ${z1.name}의 기운과 ${z2.name}의 기운이 활력 있게 만나 에너지를 지피거나 대지를 촉촉하게 가꿔주듯, 활기차고 성장을 자극하는 궁합입니다.`;
  } else {
    zodiacScore1to2 = getDeterministicHashScore(m1Id, m2Id, 33, 68, 85);
    zodiacScore2to1 = getDeterministicHashScore(m1Id, m2Id, 73, 68, 85);
    zodiacDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${zodiacScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${zodiacScore2to1}점. 서로 다른 성좌 영역에 속해 있으나, 그렇기에 더욱 신선하고 평소 생각지 못한 각도에서 독창적인 아이디어와 새로운 관점을 제공해 줍니다.`;
  }

  let ziweiScore1to2 = getDeterministicHashScore(m1Id, m2Id, 44, 70, 94);
  let ziweiScore2to1 = getDeterministicHashScore(m1Id, m2Id, 88, 70, 94);

  const ziweiStars = [
    { name: "자미성", desc: "고귀한 중심을 잡아주는 리더의 기상" },
    { name: "거문성", desc: "명쾌하고 치밀하며 어두운 틈을 찾아내는 수완" },
    { name: "천부성", desc: "풍요롭고 너그러우며 다정히 품어주는 기량" },
    { name: "태양성", desc: "공명정대하고 시원시원하며 정의를 사랑하는 열정" },
    { name: "무곡성", desc: "한번 맺은 약속은 철저히 지키는 강직한 재물 성정" },
  ];

  const m1ZIndex = getDeterministicHashScore(m1Id, m2Id, 1, 0, ziweiStars.length - 1);
  const m2ZIndex = getDeterministicHashScore(m1Id, m2Id, 9, 0, ziweiStars.length - 1);
  const m1ZStar = ziweiStars[m1ZIndex];
  const m2ZStar = ziweiStars[m2ZIndex];

  let ziweiDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${ziweiScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${ziweiScore2to1}점. ${m1.nickname}님의 명궁 기저에 깃든 ${m1ZStar.name}(${m1ZStar.desc})과 ${m2.nickname}님의 ${m2ZStar.name}(${m2ZStar.desc})이 절묘한 별자리 기류로 만나, 서로의 자리를 빛내주고 존중해주는 품격 있는 관계를 지향합니다.`;

  let mbtiScore1to2 = 80;
  let mbtiScore2to1 = 80;
  let mbtiDesc = "";

  const code1 = m1.mbti?.trim().toUpperCase() || "";
  const code2 = m2.mbti?.trim().toUpperCase() || "";
  const isMbti1Ok = code1.length === 4 && !code1.includes("미");
  const isMbti2Ok = code2.length === 4 && !code2.includes("미");

  if (isMbti1Ok && isMbti2Ok) {
    let sameCount = 0;
    if (code1[0] === code2[0]) sameCount++;
    if (code1[1] === code2[1]) sameCount++;
    if (code1[2] === code2[2]) sameCount++;
    if (code1[3] === code2[3]) sameCount++;

    mbtiScore1to2 = 70 + sameCount * 7 + getDeterministicHashScore(m1Id, m2Id, 5, 0, 5);
    mbtiScore2to1 = 70 + sameCount * 7 + getDeterministicHashScore(m1Id, m2Id, 15, 0, 5);

    let synergyBullet = "";
    if (code1[2] === code2[2] && code1[2] === "T") {
      synergyBullet = "이성적이고 담백한 팩트 체크와 효율 중심 소통이 완벽하게 일치합니다.";
    } else if (code1[2] === code2[2] && code1[2] === "F") {
      synergyBullet = "따뜻하고 속 깊은 정서적 교감과 따뜻한 리액션이 어우러져 한없이 포근합니다.";
    } else {
      synergyBullet = "냉철한 피드백(T)과 따뜻한 심리적 위로(F)가 결합하여 지성과 감성을 고루 다듬어줍니다.";
    }

    let detailDiff = "";
    if (code1[1] !== code2[1]) {
      detailDiff += " 현실 감각(S)과 넓은 상상력(N)의 조화로 시너지를 내며,";
    }
    if (code1[3] !== code2[3]) {
      detailDiff += " 체계적인 정리(J)와 민첩하고 유연한 대처(P)가 어우러져 돌발 상황에 무척 강합니다.";
    }

    mbtiDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${mbtiScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${mbtiScore2to1}점. ${code1}와 ${code2} 성향이 만나,${detailDiff} ${synergyBullet}`;
  } else {
    mbtiScore1to2 = getDeterministicHashScore(m1Id, m2Id, 55, 75, 85);
    mbtiScore2to1 = getDeterministicHashScore(m1Id, m2Id, 85, 75, 85);
    const unreg = !isMbti1Ok ? m1.nickname : m2.nickname;
    mbtiDesc = `${m1.nickname}님은 ${m2.nickname}님에게 ${mbtiScore1to2}점, ${m2.nickname}님은 ${m1.nickname}님에게 ${mbtiScore2to1}점. ${unreg}님이 성향 지표(MBTI)를 등록하지 않았으므로, 정통 사주와 성좌 데이터를 근간 삼아 입체적 관계를 다듬어 나갑니다.`;
  }

  const avgScore = Math.round(
    (sajuScore1to2 + sajuScore2to1 + ziweiScore1to2 + ziweiScore2to1 + zodiacScore1to2 + zodiacScore2to1 + mbtiScore1to2 + mbtiScore2to1) / 8
  );

  const getGanNick = (gan: string, elem?: string) => {
    const g = String(gan || "");
    if (g.includes("갑")) return "거목";
    if (g.includes("을")) return "화초";
    if (g.includes("병")) return "태양";
    if (g.includes("정")) return "등불";
    if (g.includes("무")) return "태산";
    if (g.includes("기")) return "정원";
    if (g.includes("경")) return "원석";
    if (g.includes("신")) return "보석";
    if (g.includes("임")) return "강물";
    if (g.includes("계")) return "이슬";

    const e = String(elem || "");
    if (e.includes("목") || g.includes("목")) return "목 기운";
    if (e.includes("화") || g.includes("화")) return "화 기운";
    if (e.includes("토") || g.includes("토")) return "토 기운";
    if (e.includes("금") || g.includes("금")) return "금 기운";
    if (e.includes("수") || g.includes("수")) return "수 기운";

    return "고유 기운";
  };

  const nick1 = getGanNick(g1, elem1);
  const nick2 = getGanNick(g2, elem2);

  let finalLabel = "";
  let finalDesc = "";

  if (isGeneratingSajuSupport) {
    const labelOptions = [
      `${nick1}과 ${nick2}의 상생적 영감`,
      `오행상생의 창조적 파트너십`,
      `${z1.name}와 ${z2.name}의 시너지 기류`,
    ];
    finalLabel = labelOptions[getDeterministicHashScore(m1Id, m2Id, 7, 0, labelOptions.length - 1)];

    const descOptions = [
      `${m1.nickname}님의 ${meta1.nick} 성정(${meta1.desc})이 ${m2.nickname}님의 ${meta2.nick} 성정(${meta2.desc})을 촉진하여 기적 같은 성장을 만들어내는 흐름입니다. 오행상 ${elem1}의 활기찬 에너지가 ${elem2}을 생(生)하며 촉발하여, 대화를 나눌수록 창조적인 영감이 끝없이 솟구치는 환상적인 파트너십이 발휘됩니다.`,
      `${m1.nickname}님의 진취적인 기획력과 ${m2.nickname}님의 안정적인 디테일이 합을 맞춰 하나의 아름다운 작품을 완성해 가듯, 두 분이 힘을 합쳤을 때 상상을 초월하는 완성도와 시너지를 보여주는 아름다운 궁합입니다.`,
    ];
    finalDesc = descOptions[getDeterministicHashScore(m1Id, m2Id, 17, 0, descOptions.length - 1)];
  } else if (isReceivingSajuSupport) {
    const labelOptions = [
      `${nick2}과 ${nick1}의 든든한 상생 기류`,
      `따뜻한 조력과 편안한 교감`,
      `${z2.name}가 품어주는 상생 연대`,
    ];
    finalLabel = labelOptions[getDeterministicHashScore(m1Id, m2Id, 7, 0, labelOptions.length - 1)];

    const descOptions = [
      `${m2.nickname}님의 포근하고 넓은 ${meta2.nick} 기운이 ${m1.nickname}님의 섬세한 ${meta1.nick} 성정을 든든하게 받쳐주고 생(生)해주는 완벽한 조력의 기류입니다. 두 분이 함께하면 일상에서 쌓였던 불안과 피로가 마법처럼 해소되며 서로에 대한 대단한 신뢰가 굳건하게 형성됩니다.`,
      `${m2.nickname}님의 깊은 포용력이 ${m1.nickname}님의 무한한 가능성을 자상하게 이끌어내어 주는 기라성 같은 인연입니다. 힘든 고난이 찾아와도 서로를 향한 변치 않는 위로와 격려를 아끼지 않는 단단하고 돈독한 상생 조합입니다.`,
    ];
    finalDesc = descOptions[getDeterministicHashScore(m1Id, m2Id, 17, 0, descOptions.length - 1)];
  } else if (elem1 === elem2) {
    const labelOptions = [
      `같은 ${elem1} 기운의 소울 메이트`,
      `거울을 보듯 깊이 공감하는 소통`,
      `${z1.name}와 ${z2.name}의 깊은 우정`,
    ];
    finalLabel = labelOptions[getDeterministicHashScore(m1Id, m2Id, 7, 0, labelOptions.length - 1)];

    const descOptions = [
      `서로 같은 '${elem1}'의 오행 원소를 풍부하게 공유하고 있어, 처음 만난 순간부터 영혼 깊숙이 통하는 대단한 동질감을 경험하는 조합입니다. 굳이 말 한마디를 나누지 않아도 눈빛만으로 상대의 의도와 마음을 꿰뚫어 보며, 변함없이 곁을 지켜주는 든든한 동반자가 되어줍니다.`,
      `서로 닮은꼴의 성향과 가치관을 지니고 있어 같은 방향을 바라보고 시원시원하게 나아가는 영혼의 단짝입니다. 갈등의 여지가 지극히 적으며, 서로에게 거울 같은 자극을 주며 동반 성장할 수 있는 완벽한 화합의 파트너십을 보여줍니다.`,
    ];
    finalDesc = descOptions[getDeterministicHashScore(m1Id, m2Id, 17, 0, descOptions.length - 1)];
  } else if (isSajuClash) {
    const labelOptions = [
      `${nick1}과 ${nick2}의 긴장 속 혁신 케미`,
      `서로의 맹점을 완벽하게 메우는 퍼즐`,
      `뜨겁고 날카로운 자극의 관계 기류`,
    ];
    finalLabel = labelOptions[getDeterministicHashScore(m1Id, m2Id, 7, 0, labelOptions.length - 1)];

    const descOptions = [
      `${m1.nickname}님의 ${meta1.nick}과 ${m2.nickname}님의 ${meta2.nick}이 오행상 서로 극(剋)하며 은근한 텐션을 형성합니다. 하지만 이는 갈등이 아닌 서로의 맹점을 날카롭게 깨워주는 지적 자극제가 되며, 적절한 존중을 유지할 때 세상 어떤 조합보다 완벽하게 서로를 메워주는 훌륭한 퍼즐이 됩니다.`,
      `서로 다른 시선과 가치관을 지녀 가끔씩 신선한 충격을 나누지만, 오히려 그렇기 때문에 평소에 생각해내지 못한 전혀 다른 창의적 각도의 해결책을 이끌어내며, 지적인 성장과 혁신을 최고치로 유도하는 파트너입니다.`,
    ];
    finalDesc = descOptions[getDeterministicHashScore(m1Id, m2Id, 17, 0, descOptions.length - 1)];
  } else {
    const labelOptions = [
      `온화함 속에서 은은히 피어나는 신뢰`,
      `담백하고 편안한 상생 파트너`,
      `${z1.name}와 ${z2.name}의 온화한 화합`,
    ];
    finalLabel = labelOptions[getDeterministicHashScore(m1Id, m2Id, 7, 0, labelOptions.length - 1)];

    const descOptions = [
      `서로에게 불필요한 간섭과 요구를 하지 않으며, 한없이 편안하고 담백한 흐름을 지속하는 오행 조화입니다. 서로의 속도와 경계를 온전하게 존중하면서도, 보이지 않는 곳에서 항상 서로를 응원하며 오랜 신뢰를 묵직하게 쌓아 나가는 훌륭한 파트너십입니다.`,
      `${z1.name}와 ${z2.name}의 유연한 기조가 사주는 온화함과 결합하여, 거친 파도가 없는 잔잔한 바다처럼 편안하게 동행할 수 있는 궁합을 형성합니다. 서로에게 훌륭한 쉼터이자 영감이 되어주며 안정감 있는 전진을 이끕니다.`,
    ];
    finalDesc = descOptions[getDeterministicHashScore(m1Id, m2Id, 17, 0, descOptions.length - 1)];
  }

  return {
    member_id_1: m1Id,
    member_id_2: m2Id,
    score: avgScore,
    label: finalLabel,
    description: finalDesc,
    saju: {
      score_1_to_2: sajuScore1to2,
      score_2_to_1: sajuScore2to1,
      description: sajuDesc,
    },
    ziwei: {
      score_1_to_2: ziweiScore1to2,
      score_2_to_1: ziweiScore2to1,
      description: ziweiDesc,
    },
    mbti: {
      score_1_to_2: mbtiScore1to2,
      score_2_to_1: mbtiScore2to1,
      description: mbtiDesc,
    },
    zodiac: {
      score_1_to_2: zodiacScore1to2,
      score_2_to_1: zodiacScore2to1,
      description: zodiacDesc,
    },
  };
}
