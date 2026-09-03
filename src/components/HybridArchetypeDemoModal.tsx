import React, { useState } from "react";
import { X, Sparkles, Shield, Check } from "lucide-react";

interface AnimalDef {
  key: string;
  name: string;
  emoji: string;
  yearLabel: string;
  elementTone: string;
}

const ZODIAC_ANIMALS: AnimalDef[] = [
  { key: "rabbit", name: "토끼", emoji: "🐰", yearLabel: "辛卯년 토끼띠", elementTone: "수/목 파스텔" },
  { key: "tiger", name: "호랑이", emoji: "🐯", yearLabel: "甲寅년 호랑이띠", elementTone: "청명한 블루" },
  { key: "dragon", name: "용", emoji: "🐉", yearLabel: "壬辰년 용띠", elementTone: "하늘빛 스카이" },
  { key: "snake", name: "뱀", emoji: "🐍", yearLabel: "乙巳년 뱀띠", elementTone: "에메랄드 블루" },
  { key: "horse", name: "말", emoji: "🐴", yearLabel: "丙午년 말띠", elementTone: "밝은 파스텔 블루" },
  { key: "ox", name: "소", emoji: "🐮", yearLabel: "癸丑년 소띠", elementTone: "차분한 쿨 블루" },
  { key: "rat", name: "쥐", emoji: "🐭", yearLabel: "甲子년 쥐띠", elementTone: "청량한 아쿠아" },
  { key: "sheep", name: "양", emoji: "🐑", yearLabel: "丁未년 양띠", elementTone: "포근한 블루" },
  { key: "monkey", name: "원숭이", emoji: "🐵", yearLabel: "庚申년 원숭이띠", elementTone: "경쾌한 블루" },
  { key: "rooster", name: "닭", emoji: "🐔", yearLabel: "辛酉년 닭띠", elementTone: "산뜻한 블루" },
  { key: "dog", name: "개", emoji: "🐶", yearLabel: "戊戌년 개띠", elementTone: "다정한 블루" },
  { key: "pig", name: "돼지", emoji: "🐷", yearLabel: "己亥년 돼지띠", elementTone: "통통한 베이비블루" },
];

interface ItemProfileTemplate {
  id: string;
  itemKey: string;
  rolePrefix: string;
  itemIcon: string;
  itemName: string;
  mbti: string;
  starName: string;
  badgeColor: string;
  headlineTemplate: (animalName: string) => string;
  quote: string;
  tagBase: string[];
  stats: { label: string; value: number; color: string }[];
  descTemplate: (animalName: string) => string;
}

const ITEM_TEMPLATES: ItemProfileTemplate[] = [
  {
    id: "glasses",
    itemKey: "glasses",
    rolePrefix: "스마트 안경을 쓴 통찰의 지략가",
    itemIcon: "👓",
    itemName: "동글이 스마트 안경",
    mbti: "INTJ",
    starName: "천기성 (天機)",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    headlineTemplate: (a) => `동글이 안경 너머로 본질을 꿰뚫는 ${a} 브레인`,
    quote: '"보이지 않는 이면의 구조를 읽고 명쾌한 해법을 찾아요."',
    tagBase: ["스마트 안경", "통찰력 98", "INTJ 브레인", "전략 분석"],
    stats: [
      { label: "통찰력", value: 98, color: "bg-[#1C1D21]" },
      { label: "전략 기획", value: 92, color: "bg-[#3B82F6]" },
      { label: "결단력", value: 85, color: "bg-[#B91C1C]" },
      { label: "침착함", value: 94, color: "bg-[#10B981]" },
    ],
    descTemplate: (a) =>
      `얼굴에 꼭 맞춘 스마트 안경처럼, 복잡하게 얽힌 문제 속에서도 감정에 치우치지 않고 가장 효율적인 최적의 수를 찾아내는 ${a} 캐릭터의 날카로운 지략가입니다.`,
  },
  {
    id: "sunglasses",
    itemKey: "sunglasses",
    rolePrefix: "힙한 선글라스를 쓴 비타민 메이커",
    itemIcon: "🕶️",
    itemName: "레트로 파티 선글라스",
    mbti: "ENFP",
    starName: "탐랑성 (貪狼)",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    headlineTemplate: (a) => `선글라스를 얹은 유쾌한 ${a} 비타민`,
    quote: '"모임의 어색한 공기를 단숨에 신나는 축제로 바꿔요!"',
    tagBase: ["파티 선글라스", "친화력 97", "ENFP 에너지", "분위기 메이커"],
    stats: [
      { label: "친화력", value: 97, color: "bg-[#1C1D21]" },
      { label: "순발력", value: 91, color: "bg-[#F59E0B]" },
      { label: "도파민", value: 95, color: "bg-[#B91C1C]" },
      { label: "대화 촉발", value: 89, color: "bg-[#10B981]" },
    ],
    descTemplate: (a) =>
      `트렌디한 선글라스를 걸친 모습처럼, 만나는 사람마다 무장해제시키는 독보적인 친화력으로 모임 전체에 활기찬 웃음을 선물하는 분위기 기둥입니다.`,
  },
  {
    id: "bowtie",
    itemKey: "bowtie",
    rolePrefix: "단정한 보타이를 맨 신뢰의 캡틴",
    itemIcon: "👔",
    itemName: "클래식 레드 보타이",
    mbti: "ESTJ",
    starName: "자미성 (紫微)",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    headlineTemplate: (a) => `단정한 보타이로 중심을 잡는 ${a} 리더`,
    quote: '"말보다 행동으로 보여주고 끝까지 책임집니다."',
    tagBase: ["레드 보타이", "실행력 96", "ESTJ 리더", "확고한 책임"],
    stats: [
      { label: "실행력", value: 96, color: "bg-[#1C1D21]" },
      { label: "통솔력", value: 93, color: "bg-[#B91C1C]" },
      { label: "추진력", value: 91, color: "bg-[#3B82F6]" },
      { label: "신뢰도", value: 95, color: "bg-[#10B981]" },
    ],
    descTemplate: (a) =>
      `단정하게 멘 붉은 보타이처럼, 언제나 정돈된 자세와 흔들리지 않는 원칙으로 갈팡질팡하는 모임원들을 하나로 묶어 결승선까지 이끄는 캡틴입니다.`,
  },
  {
    id: "headphones",
    itemKey: "headphones",
    rolePrefix: "헤드폰을 낀 몰입형 마이웨이",
    itemIcon: "🎧",
    itemName: "무선 노이즈캔슬링 헤드폰",
    mbti: "ISTP",
    starName: "칠살성 (七殺)",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    headlineTemplate: (a) => `헤드폰을 끼고 결과에 집중하는 ${a} 실력파`,
    quote: '"주변 소음에 흔들리지 않고 나만의 템포로 완성해요."',
    tagBase: ["무선 헤드폰", "집중력 95", "ISTP 장인", "조용한 해결사"],
    stats: [
      { label: "집중력", value: 95, color: "bg-[#1C1D21]" },
      { label: "문제 해결", value: 93, color: "bg-[#3B82F6]" },
      { label: "위기 대처", value: 90, color: "bg-[#B91C1C]" },
      { label: "독립성", value: 94, color: "bg-[#10B981]" },
    ],
    descTemplate: (a) =>
      `귀를 포근히 감싼 헤드폰처럼, 번잡한 잡음에 휩쓸리지 않고 묵묵히 상황을 관찰하다가 가장 직관적이고 정확한 기술로 문제를 해결하는 장인형 페르소나입니다.`,
  },
  {
    id: "scarf",
    itemKey: "scarf",
    rolePrefix: "포근한 목도리를 두른 온기 메이커",
    itemIcon: "🧣",
    itemName: "손뜨개 니트 목도리",
    mbti: "ISFJ",
    starName: "천동성 (天同)",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    headlineTemplate: (a) => `포근한 목도리처럼 마음을 녹여주는 ${a} 안식처`,
    quote: '"모두가 편안하게 머무를 수 있는 따뜻함이 좋아요."',
    tagBase: ["니트 목도리", "공감력 99", "ISFJ 배려", "다정한 온기"],
    stats: [
      { label: "공감력", value: 99, color: "bg-[#1C1D21]" },
      { label: "경청 지수", value: 96, color: "bg-[#EC4899]" },
      { label: "갈등 완화", value: 92, color: "bg-[#3B82F6]" },
      { label: "섬세함", value: 95, color: "bg-[#10B981]" },
    ],
    descTemplate: (a) =>
      `목을 따스하게 감싼 붉은 목도리처럼, 누구 하나 소외되지 않도록 세심하게 눈길을 주고 차가워진 분위기를 사르르 녹여주는 모임의 포근한 마음 난로입니다.`,
  },
];

const MEMBER_NAMES = ["김민준", "박도현", "최도윤", "이서연", "정수빈"];

export default function HybridArchetypeDemoModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selectedAnimalKey, setSelectedAnimalKey] = useState<string>("rabbit");
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  if (!isOpen) return null;

  const currentAnimal =
    ZODIAC_ANIMALS.find((a) => a.key === selectedAnimalKey) || ZODIAC_ANIMALS[0];
  const currentTemplate = ITEM_TEMPLATES[selectedIdx];

  // Dynamic image path with cache buster: /zodiac/zodiac_{animal}_item_{item}.webp
  const ASSET_VERSION = "muzik_v10";
  const imageSrc = `/zodiac/zodiac_${currentAnimal.key}_item_${currentTemplate.itemKey}.webp?v=${ASSET_VERSION}`;
  const fallbackPngSrc = `/zodiac/zodiac_${currentAnimal.key}_item_${currentTemplate.itemKey}.png?v=${ASSET_VERSION}`;
  const memberName = MEMBER_NAMES[selectedIdx] || "회원";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#FAF9F6] border border-[#E7E7E2] rounded-2xl w-full max-w-4xl max-h-[94vh] overflow-y-auto shadow-2xl flex flex-col relative text-[#1C1D21]">
        
        {/* Header */}
        <div className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-md px-6 py-4 border-b border-[#E7E7E2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#B91C1C]/10 text-[#B91C1C] flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#1C1D21] flex items-center gap-2">
                <span>12지신 × 현대 라이프스타일 100% 정적 리소스 엔진</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Pre-rendered WebP
                </span>
              </h3>
              <p className="text-xs text-[#7A7B82]">
                런타임 합성 없이 일괄 사전 제작된 고해상도 투명 WebP 에셋 (로딩 0ms · 픽셀 일치 100%)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#8E8F98] hover:text-[#1C1D21] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-7 space-y-6">

          {/* 12 Animal Selector Bar */}
          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#55565E] flex items-center gap-1.5">
                <span>12지신 동물 선택 (원하는 띠를 클릭해보세요):</span>
              </span>
              <span className="text-[11px] font-mono text-[#8E8F98]">
                선택된 띠: <strong className="text-[#B91C1C]">{currentAnimal.emoji} {currentAnimal.name} ({currentAnimal.yearLabel})</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
              {ZODIAC_ANIMALS.map((a) => {
                const isSelected = a.key === selectedAnimalKey;
                return (
                  <button
                    key={a.key}
                    onClick={() => setSelectedAnimalKey(a.key)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#1C1D21] text-white border-[#1C1D21] shadow-sm"
                        : "bg-[#F2F1EC] text-[#55565E] border-[#E7E7E2] hover:bg-white"
                    }`}
                  >
                    <span>{a.emoji}</span>
                    <span>{a.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5 Item Sub-tabs for the selected animal */}
          <div className="space-y-1.5 text-left">
            <span className="text-xs font-semibold text-[#55565E]">
              {currentAnimal.emoji} {currentAnimal.name}띠 동일 사주 5명의 고유 현대 소품 분기:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ITEM_TEMPLATES.map((t, idx) => {
                const itemImg = `/zodiac/zodiac_${currentAnimal.key}_item_${t.itemKey}.webp?v=${ASSET_VERSION}`;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedIdx(idx)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      selectedIdx === idx
                        ? "bg-white border-[#1C1D21] shadow-md ring-1 ring-[#1C1D21]"
                        : "bg-[#F2F1EC] border-[#E7E7E2] hover:bg-white text-[#55565E]"
                    }`}
                  >
                    <img
                      src={itemImg}
                      alt={t.itemName}
                      className="w-8 h-8 object-contain shrink-0"
                      onError={(e) => {
                        // Fallback to base animal if item webp is still compiling
                        (e.currentTarget as HTMLImageElement).src = `/zodiac/zodiac_${currentAnimal.key}_base.png`;
                      }}
                    />
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="text-xs font-bold text-[#1C1D21] truncate flex items-center gap-1">
                        <span>{MEMBER_NAMES[idx]}</span>
                        <span className="text-xs">{t.itemIcon}</span>
                      </div>
                      <div className="text-[10px] text-[#7A7B82] truncate">{t.mbti}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clean Card Preview (ViralCardModal Identical Aesthetic) */}
          <div className="w-full max-w-[380px] mx-auto bg-[#FCFCFA] rounded-2xl p-7 border border-[#E7E7E2] shadow-[0_20px_50px_-20px_rgba(28,29,33,0.18)] text-left select-none space-y-5">
            
            {/* Top Serial & Badges */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-mono tracking-wider text-[#8E8F98]">
                {currentAnimal.emoji} {currentAnimal.yearLabel}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold border border-slate-200">
                  {currentTemplate.mbti}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${currentTemplate.badgeColor}`}>
                  {currentTemplate.itemIcon} {currentTemplate.itemName}
                </span>
              </div>
            </div>

            {/* Character Graphic: Clean, 140px, Zero cut-off background clutter */}
            <div className="w-36 h-36 mx-auto flex items-center justify-center">
              <img
                src={imageSrc}
                alt={currentTemplate.headlineTemplate(currentAnimal.name)}
                className="w-full h-full object-contain select-none filter drop-shadow-sm transition-all duration-300 transform hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = fallbackPngSrc;
                }}
              />
            </div>

            {/* Title & Headline */}
            <div className="text-center space-y-1">
              <h2 className="font-serif text-[19px] font-bold text-[#1C1D21] tracking-tight">
                {memberName}님은 <span className="text-[#B91C1C]">{currentTemplate.rolePrefix}</span>
              </h2>
              <p className="text-xs text-[#55565E] font-medium">
                {currentTemplate.quote}
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {currentTemplate.tagBase.map((tag, i) => (
                <span
                  key={i}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#F2F1EC] text-[#55565E]"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Continuous Fine-Grained Stats */}
            <div className="space-y-2 pt-3 border-t border-[#E7E7E2]">
              {currentTemplate.stats.map((s, i) => (
                <div key={i} className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#55565E] font-medium">{s.label}</span>
                    <span className="font-mono font-bold text-[#1C1D21]">{s.value}</span>
                  </div>
                  <div className="w-full bg-[#EFEFEA] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${s.color} transition-all duration-300`}
                      style={{ width: `${s.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Analysis Paragraph */}
            <p className="text-xs text-[#55565E] leading-relaxed pt-3 border-t border-[#E7E7E2]">
              {currentTemplate.descTemplate(currentAnimal.name)}
            </p>

          </div>

          {/* Side-by-Side 5-Member Proof Table */}
          <div className="pt-5 border-t border-[#E7E7E2] space-y-3 text-left">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-semibold text-xs text-[#1C1D21] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#B91C1C]" />
                <span>{currentAnimal.emoji} {currentAnimal.name}띠 5인 비교표 (동일 사주 · 5대 고유 일상 아이템)</span>
              </h4>
              <span className="text-[11px] text-[#B91C1C] font-semibold">
                동일 화풍 정적 리소스 배포 (중복 0%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
              {ITEM_TEMPLATES.map((t, i) => {
                const itemImg = `/zodiac/zodiac_${currentAnimal.key}_item_${t.itemKey}.webp?v=${ASSET_VERSION}`;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedIdx(i)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      selectedIdx === i
                        ? "bg-white border-[#1C1D21] shadow-sm ring-1 ring-[#1C1D21]"
                        : "bg-[#F7F6F2] border-[#E7E7E2] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={itemImg}
                        alt=""
                        className="w-8 h-8 object-contain shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `/zodiac/zodiac_${currentAnimal.key}_base.png`;
                        }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-[#1C1D21] text-xs truncate flex items-center gap-1">
                          <span>{MEMBER_NAMES[i]}</span>
                          <span>{t.itemIcon}</span>
                        </div>
                        <div className="text-[9.5px] text-[#7A7B82] truncate">{t.mbti}</div>
                      </div>
                    </div>
                    <div className="text-[10.5px] font-semibold text-[#B91C1C] truncate">
                      {t.itemName}
                    </div>
                    <div className="pt-1 border-t border-[#E7E7E2] grid grid-cols-2 gap-1 text-[9.5px] font-mono text-center">
                      <div className="bg-white p-1 rounded border border-[#E7E7E2]">
                        {t.stats[0].label} <strong className="block">{t.stats[0].value}</strong>
                      </div>
                      <div className="bg-white p-1 rounded border border-[#E7E7E2]">
                        {t.stats[1].label} <strong className="block">{t.stats[1].value}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#F2F1EC] px-6 py-4 border-t border-[#E7E7E2] flex items-center justify-between text-xs text-[#7A7B82]">
          <span>인연사주 정갈한 디자인 시스템 · 12지신 완성형 정적 리소스 파이프라인</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1C1D21] text-white font-medium hover:bg-black transition-colors cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>

      </div>
    </div>
  );
}
