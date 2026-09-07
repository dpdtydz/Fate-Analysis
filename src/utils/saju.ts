import {
  calculateSaju as orreryCalculateSaju,
  createChart as orreryCreateChart,
  getDaxianList as orreryGetDaxianList,
  calculateLiunian as orreryCalculateLiunian
} from '@orrery/core';
import {
  SajuData,
  PillarUnit,
  DaewoonItem,
  PillarDetailItem,
  ZiweiChart,
  ZiweiPalace,
  ZiweiStar,
  ZiweiDaxianItem,
  ZiweiLiunian
} from '../types';

export const starHanjaToHangul: Record<string, string> = {
  "紫微": "자미", "天機": "천기", "太陽": "태양", "武曲": "무곡", "天同": "천동",
  "廉貞": "염정", "天府": "천부", "太陰": "태음", "貪狼": "탐랑", "巨門": "거문",
  "天相": "천상", "天梁": "천량", "七殺": "칠살", "破軍": "파군",
  "左輔": "좌보", "右弼": "우필", "文昌": "문창", "文曲": "문곡",
  "天魁": "천괴", "天鉞": "천월", "祿存": "록존", "天馬": "천마",
  "擎羊": "경양", "陀羅": "타라", "火星": "화성", "鈴星": "영성",
  "地空": "지공", "地劫": "지겁"
};

export const palaceHanjaToHangul: Record<string, string> = {
  "命宮": "명궁", "兄弟": "형제궁", "夫妻": "부처궁", "子女": "자녀궁",
  "財帛": "재백궁", "疾厄": "질액궁", "遷移": "천이궁", "交友": "교우궁",
  "官祿": "관록궁", "田宅": "전택궁", "福德": "복덕궁", "父母": "부모궁"
};

export const brightnessHanjaToHangul: Record<string, string> = {
  "廟": "묘 (가장 밝음)", "旺": "왕 (왕성함)", "得": "득 (무난함)", "利": "리 (유리함)", "陷": "함 (어두움)"
};

export const siHuaHanjaToHangul: Record<string, string> = {
  "化祿": "화록 (재물)", "化權": "화권 (권력)", "化科": "화과 (명예)", "化忌": "화기 (장애)"
};

const mainStarSet = new Set(['紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍']);
const luckyStarSet = new Set(['左輔', '右弼', '文昌', '文曲', '天魁', '天鉞', '祿存', '天馬']);
const shaStarSet = new Set(['擎羊', '陀羅', '火星', '鈴星', '地空', '地劫']);

function getStarType(name: string): "main" | "lucky" | "sha" | "other" {
  if (mainStarSet.has(name)) return "main";
  if (luckyStarSet.has(name)) return "lucky";
  if (shaStarSet.has(name)) return "sha";
  return "other";
}

export const sipsinHanjaToHangul: Record<string, string> = {
  "比肩": "비견",
  "劫財": "겁재",
  "食神": "식신",
  "傷官": "상관",
  "偏財": "편재",
  "正財": "정재",
  "偏官": "편관",
  "正官": "정관",
  "偏印": "편인",
  "正印": "정인",
  "本元": "일간 (나)",
  "?": "미정"
};

export const unseongHanjaToHangul: Record<string, string> = {
  "長生": "장생",
  "沐浴": "목욕",
  "冠帶": "관대",
  "臨官": "건록",
  "建祿": "건록",
  "乾祿": "건록",
  "帝旺": "제왕",
  "衰": "쇠",
  "病": "병",
  "死": "사",
  "墓": "묘",
  "絶": "절",
  "胎": "태",
  "養": "양"
};

export const sinsalHanjaToHangul: Record<string, string> = {
  "地殺": "지살",
  "年殺": "연살 (도화살)",
  "咸池": "연살 (도화살)",
  "月殺": "월살",
  "亡神": "망신살",
  "將星": "장성살",
  "攀鞍": "반안살",
  "驛馬": "역마살",
  "六害": "육해살",
  "華蓋": "화개살",
  "劫殺": "겁살",
  "災殺": "재살 (수옥살)",
  "天殺": "천살"
};

const generationOrder = ["목", "화", "토", "금", "수"];

function getSipseongGroup(daymasterElement: string, targetElement: string): "비겁" | "식상" | "재성" | "관성" | "인성" {
  if (daymasterElement === targetElement) return "비겁";
  
  const dmIdx = generationOrder.indexOf(daymasterElement);
  const targetIdx = generationOrder.indexOf(targetElement);
  
  const diff = (targetIdx - dmIdx + 5) % 5;
  if (diff === 1) return "식상";
  if (diff === 2) return "재성";
  if (diff === 3) return "관성";
  if (diff === 4) return "인성";
  
  return "비겁";
}

export function calculateSaju(
  birthDate: string,
  birthTime: string | null,
  birthplace?: { name: string; lat: number; lon: number } | null,
  genderStr: string = "여성"
): SajuData {
  const [y, m, d] = birthDate.split('-').map(Number);
  
  let h = 12;
  let min = 0;
  const unknownTime = !birthTime || birthTime === "unknown" || !birthTime.includes(':');
  if (birthTime && !unknownTime) {
    const [hr, mn] = birthTime.split(':').map(Number);
    h = isNaN(hr) ? 12 : hr;
    min = isNaN(mn) ? 0 : mn;
  }

  // Calculate Solar Time Correction (진태양시 보정)
  let solar_correction_minutes = 0;
  let correctedHour = h;
  let correctedMinute = min;
  let solar_birth_time: string | null = null;

  let adjustedYear = y;
  let adjustedMonth = m;
  let adjustedDay = d;

  if (birthTime) {
    // 135.0 is the KST standard meridian
    const offset = birthplace?.lon ? (birthplace.lon - 135.0) * 4 : -32; // Default to Seoul (-32m) if not specified
    solar_correction_minutes = Math.round(offset);
    
    const localDateObj = new Date(Date.UTC(y, m - 1, d, h, min));
    const solarDateObj = new Date(localDateObj.getTime() + solar_correction_minutes * 60 * 1000);
    
    adjustedYear = solarDateObj.getUTCFullYear();
    adjustedMonth = solarDateObj.getUTCMonth() + 1;
    adjustedDay = solarDateObj.getUTCDate();
    correctedHour = solarDateObj.getUTCHours();
    correctedMinute = solarDateObj.getUTCMinutes();
    solar_birth_time = `${correctedHour.toString().padStart(2, '0')}:${correctedMinute.toString().padStart(2, '0')}`;
  }

  // Saju calculation with @orrery/core
  const orreryResult = orreryCalculateSaju({
    year: adjustedYear,
    month: adjustedMonth,
    day: adjustedDay,
    hour: correctedHour,
    minute: correctedMinute,
    gender: (genderStr === "남성" || genderStr === "male" || genderStr === "M") ? 'M' : 'F',
    unknownTime,
    jasiMethod: 'unified' as any,
  });

  const yearPillar = orreryResult.pillars[3].pillar;
  const monthPillar = orreryResult.pillars[2].pillar;
  const dayPillar = orreryResult.pillars[1].pillar;
  const hourPillar = unknownTime ? null : orreryResult.pillars[0].pillar;

  const pillars = {
    year: { gan: yearPillar.stem, ji: yearPillar.branch },
    month: { gan: monthPillar.stem, ji: monthPillar.branch },
    day: { gan: dayPillar.stem, ji: dayPillar.branch },
    hour: hourPillar ? { gan: hourPillar.stem, ji: hourPillar.branch } : null,
  };

  const daymasterGan = dayPillar.stem;
  const ganToElement: Record<string, string> = {
    "甲": "목", "乙": "목",
    "丙": "화", "丁": "화",
    "戊": "토", "己": "토",
    "庚": "금", "辛": "금",
    "壬": "수", "癸": "수"
  };
  const daymasterElement = ganToElement[daymasterGan] || "목";

  // Ohaeng Count
  const ohaeng_count = { "목": 0, "화": 0, "토": 0, "금": 0, "수": 0 };
  const addElement = (char: string, isGan: boolean) => {
    if (!char) return;
    if (isGan) {
      const element = ganToElement[char];
      if (element === "목" || element === "화" || element === "토" || element === "금" || element === "수") {
        ohaeng_count[element]++;
      }
    } else {
      let elementValue: "목" | "화" | "토" | "금" | "수" | null = null;
      if (char === "寅" || char === "卯") {
        elementValue = "목";
      } else if (char === "巳" || char === "午") {
        elementValue = "화";
      } else if (char === "辰" || char === "戌" || char === "丑" || char === "未") {
        elementValue = "토";
      } else if (char === "申" || char === "酉") {
        elementValue = "금";
      } else if (char === "亥" || char === "子") {
        elementValue = "수";
      }
      if (elementValue) {
        ohaeng_count[elementValue]++;
      }
    }
  };

  addElement(pillars.year.gan, true);
  addElement(pillars.year.ji, false);
  addElement(pillars.month.gan, true);
  addElement(pillars.month.ji, false);
  addElement(pillars.day.gan, true);
  addElement(pillars.day.ji, false);
  if (pillars.hour) {
    addElement(pillars.hour.gan, true);
    addElement(pillars.hour.ji, false);
  }

  // Assembly pillars detail
  const pillars_detail: PillarDetailItem[] = [
    {
      type: "연주",
      ganzi: orreryResult.pillars[3].pillar.ganzi,
      stem: orreryResult.pillars[3].pillar.stem,
      branch: orreryResult.pillars[3].pillar.branch,
      stemSipsin: sipsinHanjaToHangul[orreryResult.pillars[3].stemSipsin] || orreryResult.pillars[3].stemSipsin,
      branchSipsin: sipsinHanjaToHangul[orreryResult.pillars[3].branchSipsin] || orreryResult.pillars[3].branchSipsin,
      unseong: unseongHanjaToHangul[orreryResult.pillars[3].unseong] || orreryResult.pillars[3].unseong,
      sinsal: sinsalHanjaToHangul[orreryResult.pillars[3].sinsal] || orreryResult.pillars[3].sinsal,
      jigang: Array.from(orreryResult.pillars[3].jigang).join(", "),
    },
    {
      type: "월주",
      ganzi: orreryResult.pillars[2].pillar.ganzi,
      stem: orreryResult.pillars[2].pillar.stem,
      branch: orreryResult.pillars[2].pillar.branch,
      stemSipsin: sipsinHanjaToHangul[orreryResult.pillars[2].stemSipsin] || orreryResult.pillars[2].stemSipsin,
      branchSipsin: sipsinHanjaToHangul[orreryResult.pillars[2].branchSipsin] || orreryResult.pillars[2].branchSipsin,
      unseong: unseongHanjaToHangul[orreryResult.pillars[2].unseong] || orreryResult.pillars[2].unseong,
      sinsal: sinsalHanjaToHangul[orreryResult.pillars[2].sinsal] || orreryResult.pillars[2].sinsal,
      jigang: Array.from(orreryResult.pillars[2].jigang).join(", "),
    },
    {
      type: "일주",
      ganzi: orreryResult.pillars[1].pillar.ganzi,
      stem: orreryResult.pillars[1].pillar.stem,
      branch: orreryResult.pillars[1].pillar.branch,
      stemSipsin: "일간 (나)",
      branchSipsin: sipsinHanjaToHangul[orreryResult.pillars[1].branchSipsin] || orreryResult.pillars[1].branchSipsin,
      unseong: unseongHanjaToHangul[orreryResult.pillars[1].unseong] || orreryResult.pillars[1].unseong,
      sinsal: sinsalHanjaToHangul[orreryResult.pillars[1].sinsal] || orreryResult.pillars[1].sinsal,
      jigang: Array.from(orreryResult.pillars[1].jigang).join(", "),
    }
  ];

  if (pillars.hour) {
    pillars_detail.unshift({
      type: "시주",
      ganzi: orreryResult.pillars[0].pillar.ganzi,
      stem: orreryResult.pillars[0].pillar.stem,
      branch: orreryResult.pillars[0].pillar.branch,
      stemSipsin: sipsinHanjaToHangul[orreryResult.pillars[0].stemSipsin] || orreryResult.pillars[0].stemSipsin,
      branchSipsin: sipsinHanjaToHangul[orreryResult.pillars[0].branchSipsin] || orreryResult.pillars[0].branchSipsin,
      unseong: unseongHanjaToHangul[orreryResult.pillars[0].unseong] || orreryResult.pillars[0].unseong,
      sinsal: sinsalHanjaToHangul[orreryResult.pillars[0].sinsal] || orreryResult.pillars[0].sinsal,
      jigang: Array.from(orreryResult.pillars[0].jigang).join(", "),
    });
  }

  // Daewoon mapping
  const daewoon: DaewoonItem[] = orreryResult.daewoon.map(item => ({
    age: item.age,
    ganzi: item.ganzi,
    stemSipsin: sipsinHanjaToHangul[item.stemSipsin] || item.stemSipsin,
    branchSipsin: sipsinHanjaToHangul[item.branchSipsin] || item.branchSipsin,
    unseong: unseongHanjaToHangul[item.unseong] || item.unseong,
  }));

  // Sipseong Strength calculation
  const weights = [
    { type: "stem", val: pillars.year.gan, w: 10 },
    { type: "branch", val: pillars.year.ji, w: 10 },
    { type: "stem", val: pillars.month.gan, w: 10 },
    { type: "branch", val: pillars.month.ji, w: 35 },
    { type: "stem", val: pillars.day.gan, w: 10 },
    { type: "branch", val: pillars.day.ji, w: 15 },
  ];
  if (pillars.hour) {
    weights.push({ type: "stem", val: pillars.hour.gan, w: 10 });
    weights.push({ type: "branch", val: pillars.hour.ji, w: 10 });
  }

  const sipseong_points = { "비겁": 0, "식상": 0, "재성": 0, "관성": 0, "인성": 0 };
  let totalWeight = 0;

  weights.forEach(item => {
    let element: "목" | "화" | "토" | "금" | "수" | null = null;
    if (item.type === "stem") {
      element = ganToElement[item.val] as any;
    } else {
      const char = item.val;
      if (char === "寅" || char === "卯") element = "목";
      else if (char === "巳" || char === "午") element = "화";
      else if (char === "辰" || char === "戌" || char === "丑" || char === "未") element = "토";
      else if (char === "申" || char === "酉") element = "금";
      else if (char === "亥" || char === "子") element = "수";
    }

    if (element) {
      const group = getSipseongGroup(daymasterElement, element);
      sipseong_points[group] += item.w;
      totalWeight += item.w;
    }
  });

  const sipseong_strength = { "비겁": 0, "식상": 0, "재성": 0, "관성": 0, "인성": 0 };
  if (totalWeight > 0) {
    Object.keys(sipseong_points).forEach(key => {
      const k = key as keyof typeof sipseong_points;
      sipseong_strength[k] = Math.round((sipseong_points[k] / totalWeight) * 100);
    });
  }

  // Shinsal mapping
  const special_sals_list: string[] = [];
  const salNames: Record<string, string> = {
    yangin: "양인살 (강인한 의지력)",
    baekho: "백호대살 (강렬한 추진력)",
    goegang: "괴강살 (우두머리 기질)",
    dohwa: "도화살 (사람을 끄는 매력)",
    cheonul: "천을귀인 (하늘이 돕는 귀인)",
    cheonduk: "천덕귀인 (흉을 길로 바꾸는 길신)",
    wolduk: "월덕귀인 (인덕과 평생의 복록)",
    munchang: "문창귀인 (학문과 두뇌 총명)",
    hongyeom: "홍염살 (치명적인 붉은 매력)",
    geumyeo: "금여성 (황금 마차를 타는 복록)"
  };

  Object.keys(orreryResult.specialSals).forEach(key => {
    const val = orreryResult.specialSals[key as keyof typeof orreryResult.specialSals];
    if (Array.isArray(val) && val.length > 0) {
      special_sals_list.push(salNames[key] || key);
    } else if (val === true) {
      special_sals_list.push(salNames[key] || key);
    }
  });

  // Ziwei Dousu calculation
  let ziwei: ZiweiChart | null = null;
  try {
    const isMale = genderStr === "남성" || genderStr === "M";
    const chart = orreryCreateChart(adjustedYear, adjustedMonth, adjustedDay, correctedHour, correctedMinute, isMale);
    
    const palaces: Record<string, ZiweiPalace> = {};
    Object.entries(chart.palaces).forEach(([key, p]: [string, any]) => {
      const stars: ZiweiStar[] = (p.stars || []).map((s: any) => ({
        name: s.name,
        nameKr: starHanjaToHangul[s.name] || s.name,
        type: getStarType(s.name),
        brightness: s.brightness || "",
        brightnessKr: brightnessHanjaToHangul[s.brightness] || s.brightness || "",
        siHua: s.siHua || "",
        siHuaKr: siHuaHanjaToHangul[s.siHua] || s.siHua || ""
      }));

      palaces[key] = {
        name: p.name,
        nameKr: palaceHanjaToHangul[p.name] || p.name,
        zhi: p.zhi,
        gan: p.gan,
        ganZhi: p.ganZhi,
        stars,
        isShenGong: p.isShenGong
      };
    });

    const daxianListRaw = orreryGetDaxianList(chart);
    const daXianList: ZiweiDaxianItem[] = daxianListRaw.map((d: any) => ({
      ageStart: d.ageStart,
      ageEnd: d.ageEnd,
      palaceName: palaceHanjaToHangul[d.palaceName] || d.palaceName,
      ganZhi: d.ganZhi,
      mainStars: d.mainStars.map((s: string) => starHanjaToHangul[s] || s)
    }));

    const currentYear = 2026;
    const liunianRaw = orreryCalculateLiunian(chart, currentYear);
    const liunian: ZiweiLiunian = {
      year: liunianRaw.year,
      gan: liunianRaw.gan,
      zhi: liunianRaw.zhi,
      mingGongZhi: liunianRaw.mingGongZhi,
      natalPalaceAtMing: palaceHanjaToHangul[liunianRaw.natalPalaceAtMing] || liunianRaw.natalPalaceAtMing,
      siHua: Object.fromEntries(
        Object.entries(liunianRaw.siHua || {}).map(([star, hua]) => [
          starHanjaToHangul[star] || star,
          siHuaHanjaToHangul[hua as string] || hua as string
        ])
      ),
      siHuaPalaces: Object.fromEntries(
        Object.entries(liunianRaw.siHuaPalaces || {}).map(([hua, pal]) => [
          siHuaHanjaToHangul[hua] || hua,
          palaceHanjaToHangul[pal as string] || pal as string
        ])
      )
    };

    ziwei = {
      solarYear: chart.solarYear,
      solarMonth: chart.solarMonth,
      solarDay: chart.solarDay,
      hour: chart.hour,
      minute: chart.minute,
      isMale: chart.isMale,
      lunarYear: chart.lunarYear,
      lunarMonth: chart.lunarMonth,
      lunarDay: chart.lunarDay,
      isLeapMonth: chart.isLeapMonth,
      yearGan: chart.yearGan,
      yearZhi: chart.yearZhi,
      mingGongZhi: chart.mingGongZhi,
      shenGongZhi: chart.shenGongZhi,
      wuXingJu: chart.wuXingJu,
      palaces,
      daXianStartAge: chart.daXianStartAge,
      daXianList,
      liunian,
    };
  } catch (err) {
    console.error("Ziwei Dousu calculation failed:", err);
  }

  return {
    pillars,
    daymaster: { gan: daymasterGan, element: daymasterElement },
    ohaeng_count,
    birthplace,
    solar_birth_time,
    solar_correction_minutes,
    daewoon,
    sipseong_strength,
    pillars_detail,
    special_sals_list,
    ziwei,
  };
}

export interface DaymasterMetaData {
  animal: string;
  element: string;
  color: string;
  emoji: string;
  name: string;
}

export const daymasterMap: Record<string, DaymasterMetaData> = {
  "甲": { name: "갑목", animal: "거목", element: "木", color: "#15803d", emoji: "🌲" },
  "乙": { name: "을목", animal: "꽃과 넝쿨", element: "木", color: "#22c55e", emoji: "🌸" },
  "丙": { name: "병화", animal: "태양", element: "火", color: "#dc2626", emoji: "☀️" },
  "丁": { name: "정화", animal: "촛불/등불", element: "火", color: "#f97316", emoji: "🕯️" },
  "戊": { name: "무토", animal: "거대한 산", element: "土", color: "#b45309", emoji: "⛰️" },
  "己": { name: "기토", animal: "비옥한 텃밭", element: "土", color: "#eab308", emoji: "🪴" },
  "庚": { name: "경금", animal: "무쇠칼/원석", element: "金", color: "#4b5563", emoji: "⚔️" },
  "辛": { name: "신금", animal: "영롱한 보석", element: "金", color: "#9ca3af", emoji: "💎" },
  "壬": { name: "임수", animal: "드넓은 바다", element: "水", color: "#1e293b", emoji: "🌊" },
  "癸": { name: "계수", animal: "촉촉한 단비", element: "水", color: "#111827", emoji: "💧" }
};

export interface DynamicCharacter {
  name: string;
  animalName: string;
  animal: string;
  element: string;
  color: string;
  emoji: string;
  keyword: string;
}

export function getDynamicCharacter(gan: string, ji: string): DynamicCharacter {
  const stemsMap: Record<string, { element: string; prefix: string; color: string; desc: string }> = {
    "甲": { element: "木", prefix: "청록색", color: "#15803d", desc: "곧고 웅장하며 진취성이 강한 대나무 대들보" },
    "乙": { element: "木", prefix: "초록색", color: "#22c55e", desc: "끈기 있고 유연성이 강한 화사한 덩굴 꽃풀" },
    "丙": { element: "火", prefix: "적색", color: "#dc2626", desc: "열정적이고 솔직하여 어둠을 밝혀내는 한낮의 태양" },
    "丁": { element: "火", prefix: "주황색", color: "#f97316", desc: "온화하고 감성 섬세하며 주변을 품어내는 모닥불" },
    "戊": { element: "土", prefix: "황토색", color: "#b45309", desc: "중후하고 과묵하며 모든 은하수를 지키는 거대한 산맥" },
    "己": { element: "土", prefix: "노란색", color: "#eab308", desc: "포근하고 다정하며 풍요롭게 씨앗을 기르는 기름진 텃밭" },
    "庚": { element: "金", prefix: "백색", color: "#4b5563", desc: "강직하고 의리 넘치머 강건한 통솔력을 가진 큰 무쇠칼" },
    "辛": { element: "金", prefix: "은색", color: "#9ca3af", desc: "영롱하고 완벽을 선호하며 빛깔 고운 밤송이 속 보석 원석" },
    "壬": { element: "水", prefix: "흑색", color: "#1e293b", desc: "도도하고 총명하며 한량 없이 수렴해 나가는 드넓은 대양" },
    "癸": { element: "水", prefix: "흑색", color: "#111827", desc: "재치 넘치고 지혜로우며 메마른 대지를 적시는 여린 봄 밤비" }
  };

  const branchesMap: Record<string, { animal: string; emoji: string; desc: string }> = {
    "子": { animal: "쥐", emoji: "🐭", desc: "기민한 재간과 수완" },
    "丑": { animal: "소", emoji: "🐮", desc: "우직성 가득한 불퇴전" },
    "寅": { animal: "호랑이", emoji: "🐯", desc: "기백 넘치는 통솔력" },
    "卯": { animal: "토끼", emoji: "🐰", desc: "온화한 지천성과 무구한 감성" },
    "辰": { animal: "용", emoji: "🐲", desc: "신비스럽고 야망 넘치는 위엄" },
    "巳": { animal: "뱀", emoji: "🐍", desc: "심층적 통찰과 독사 같은 기획력" },
    "午": { animal: "말", emoji: "🐴", desc: "역동적인 활동성과 진보적 성정" },
    "未": { animal: "양", emoji: "🐑", desc: "인내와 자비심 가득한 심평" },
    "申": { animal: "원숭이", emoji: "🐵", desc: "재치 발랄함과 천의무봉한 만능" },
    "酉": { animal: "닭", emoji: "🐔", desc: "섬세 정교한 선견지명" },
    "戌": { animal: "개", emoji: "🐶", desc: "의리와 절개를 다 지키는 정직심" },
    "亥": { animal: "돼지", emoji: "🐷", desc: "평화 속을 구가하는 낙천가" }
  };

  const stem = stemsMap[gan] || { element: "木", prefix: "초록색", color: "#22c55e", desc: "활기찬 생명 기운" };
  const branch = branchesMap[ji] || { animal: "토끼", emoji: "🐰", desc: "평화주의" };

  return {
    name: `${gan}${stem.element} ${stem.prefix} ${branch.animal}`,
    animalName: `${stem.prefix} ${branch.animal}`,
    animal: branch.animal,
    element: stem.element,
    color: stem.color,
    emoji: branch.emoji,
    keyword: `${stem.desc} • ${branch.desc}`
  };
}

export interface TodayFortuneResult {
  score: number;
  level: string;
  title: string;
  advice: string;
  luckColor: string;
  luckDirection: string;
  luckItem: string;
  luckyNumber: string;
  luckyTime: string;
  todayDateStr: string;
}

export function calculateTodayFortune(
  daymasterGan: string,
  daymasterElement: string,
  targetDate?: Date
): TodayFortuneResult {
  const today = targetDate || new Date();
  const dateStr = today.toISOString().slice(0, 10);
  
  // Deterministic daily score between 75 and 98 based on daymaster and date
  let seed = 0;
  const cleanGan = daymasterGan || "갑목";
  const cleanElem = daymasterElement || "목";
  const combinedStr = cleanGan + cleanElem + dateStr;
  
  for (let i = 0; i < combinedStr.length; i++) {
    seed = (seed << 5) - seed + combinedStr.charCodeAt(i);
    seed |= 0;
  }
  const score = 75 + Math.abs(seed % 24);

  // Five Elements Luck Configuration
  const ELEMENT_LUCK: Record<string, { color: string; direction: string; item: string; number: string; time: string }> = {
    "목": { color: "청색·에메랄드 그린", direction: "동쪽", item: "나무 소재 소품, 푸른 식물", number: "3, 8", time: "오전 7시 ~ 9시 (진시)" },
    "화": { color: "붉은색·코랄 오렌지", direction: "남쪽", item: "따뜻한 차, 밝은 조명", number: "2, 7", time: "오전 11시 ~ 오후 1시 (오시)" },
    "토": { color: "황금색·베이지 브라운", direction: "중앙", item: "도자기, 흙 테라코타 소품", number: "5, 10", time: "오후 1시 ~ 3시 (미시)" },
    "금": { color: "백색·메탈릭 실버", direction: "서쪽", item: "금속 액세서리, 클래식 시계", number: "4, 9", time: "오후 3시 ~ 5시 (신시)" },
    "수": { color: "검정색·딥 네이비", direction: "북쪽", item: "충분한 수분 섭취, 차분한 음악", number: "1, 6", time: "오후 9시 ~ 11시 (해시)" },
  };

  const luck = ELEMENT_LUCK[cleanElem] || ELEMENT_LUCK["토"];

  // 오행별 맞춤 일일 해설 가이드 (오전 기류, 오후 일과 및 대인관계, 저녁 정리)
  const ELEMENT_DAILY_GUIDE: Record<string, { morning: string; afternoon: string; evening: string }> = {
    "목": {
      morning: "새로운 발상과 시작의 기운이 맑게 차오르는 아침입니다. 오랫동안 마음에 품어왔던 계획이 있다면 미루지 마시고 첫걸음을 떼기에 좋습니다.",
      afternoon: "오후에는 사람들과 의견을 나누는 자리에서 본인의 뜻이 설득력을 얻습니다. 조급하게 앞서기보다 상대의 말을 먼저 경청하면 자연스럽게 협조가 따릅니다.",
      evening: "하루 동안 뻗어낸 기운을 거두어들이고 가벼운 산책이나 명상으로 생각을 정리하십시오. 무리한 약속보다 내면을 쉬게 하는 것이 내일의 성장을 돕습니다."
    },
    "화": {
      morning: "활동성과 집중력이 높게 솟아오르는 시기입니다. 중요한 연락이나 대외적인 소통을 오전 중에 신속하게 처리하면 좋은 흐름을 탑니다.",
      afternoon: "오후에는 즉흥적인 감정이나 충동적인 결정을 경계해야 합니다. 한 템포 천천히 호흡을 고르고 실속을 한 번 더 점검하는 것이 결실을 지키는 비결입니다.",
      evening: "조용한 공간에서 따뜻한 차 한 잔으로 마음의 열기를 가라앉히십시오. 복잡한 생각을 비워내면 밤사이 본래의 밝은 영감이 맑게 되살아납니다."
    },
    "토": {
      morning: "묵직하게 중심을 잡고 상황을 넓게 바라보아야 하는 아침입니다. 주변의 잔물결에 흔들리지 않고 본인의 자리를 굳건히 지키는 것이 가장 큰 힘입니다.",
      afternoon: "오후에는 주변 사람들의 부탁이나 중재 요청이 들어올 수 있습니다. 남의 일에 과도하게 에너지를 쓰기보다 본인의 우선순위를 단단히 챙기는 것이 현명합니다.",
      evening: "오늘 손에 남은 성과와 지출을 차분히 돌아보며 곳간을 정리하십시오. 단단한 안식처에서 충분히 쉬어야 내일도 흔들림 없는 태산의 위엄을 유지합니다."
    },
    "금": {
      morning: "판단력과 분별력이 명쾌하게 살아나는 시간입니다. 얽혀 있던 일이나 미루어 두었던 서류 작업을 정돈하기에 가장 이로운 때입니다.",
      afternoon: "오후에는 지나치게 엄격한 잣대를 남에게 들이대지 않도록 유의하십시오. 결론은 명확히 하되 표현을 부드럽게 감싸 안을 때 불필요한 마찰을 비껴갑니다.",
      evening: "하루 동안 곧추세웠던 긴장의 날을 칼집에 넣고 편안히 내려놓으십시오. 따뜻한 온수로 피로를 씻어내며 심신을 이완하는 것이 가장 좋은 개운법입니다."
    },
    "수": {
      morning: "지혜와 통찰력이 깊어지는 아침입니다. 당장 눈앞의 작은 일에 얽매이지 마시고, 전체 판의 흐름을 조망하며 장기적인 방향을 잡으십시오.",
      afternoon: "오후에는 유연한 처세로 상황의 막힌 부분을 부드럽게 우회할 수 있습니다. 다만 생각이 너무 깊어져 실행을 주저하지 않도록 결단이 필요한 순간에는 단호해야 합니다.",
      evening: "차분한 음악이나 조용한 독서로 마음을 맑게 비워낼 시간입니다. 고요한 밤의 기운을 받아들일 때 내면의 직관이 한층 더 또렷해집니다."
    }
  };

  const guide = ELEMENT_DAILY_GUIDE[cleanElem] || ELEMENT_DAILY_GUIDE["토"];

  let fortuneLevel = "대길 (大吉)";
  let fortuneTitle = "생기가 넘치고 귀인의 도움이 따르는 조화로운 하루";
  let leadText = "오행의 순환이 순조로워 마음에 둔 일을 차분히 실행에 옮기기에 길한 운기입니다.";

  if (score >= 90) {
    fortuneLevel = "특길 (特吉)";
    fortuneTitle = "마음먹은 뜻이 막힘없이 술술 풀리는 황금빛 흐름";
    leadText = "천간과 지지의 기운이 강한 조화를 이루어, 자신감을 갖고 주도적으로 판을 열어가기에 가장 이상적인 날입니다.";
  } else if (score >= 82) {
    fortuneLevel = "대길 (大吉)";
    fortuneTitle = "노력한 만큼 알찬 결실과 보람이 깃드는 날";
    leadText = "성실하게 본인의 자리를 지키면 주변의 인정과 기대 이상의 성과를 거두게 되는 길한 흐름입니다.";
  } else {
    fortuneLevel = "평길 (平吉)";
    fortuneTitle = "무리한 확장보다 내실을 다지며 힘을 비축하는 날";
    leadText = "서두르거나 욕심을 내기보다 속도를 조절하며 차분하게 상황을 정비하는 지혜가 필요한 날입니다.";
  }

  const fortuneAdvice = `${leadText}\n\n${guide.morning} ${guide.afternoon}\n\n${guide.evening}`;

  return {
    score,
    level: fortuneLevel,
    title: fortuneTitle,
    advice: fortuneAdvice,
    luckColor: luck.color,
    luckDirection: luck.direction,
    luckItem: luck.item,
    luckyNumber: luck.number,
    luckyTime: luck.time,
    todayDateStr: `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`,
  };
}

