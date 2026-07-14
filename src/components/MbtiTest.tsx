import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowLeft, ArrowRight, Check, CheckCircle2, RotateCcw } from "lucide-react";

interface MbtiTestProps {
  onComplete: (mbti: string) => void;
  onCancel: () => void;
}

interface Question {
  id: number;
  dimension: "EI" | "SN" | "TF" | "JP";
  text: string;
  optionA: { text: string; value: string }; // E, S, T, J
  optionB: { text: string; value: string }; // I, N, F, P
}

const QUESTIONS: Question[] = [
  // E vs I
  {
    id: 1,
    dimension: "EI",
    text: "주말이나 쉬는 날에 나는 주로 어떤 행동을 선호하나요?",
    optionA: { text: "밖에서 지인을 만나거나 활발하게 외출하는 편이다.", value: "E" },
    optionB: { text: "집에서 나만의 공간에서 조용히 에너지를 재충전하는 편이다.", value: "I" }
  },
  {
    id: 2,
    dimension: "EI",
    text: "새로운 낯선 모임에 갔을 때 나의 모습은 어떠한가요?",
    optionA: { text: "먼저 적극적으로 말을 건네거나 대화를 유도하려 노력한다.", value: "E" },
    optionB: { text: "주로 상대방의 이야기를 조용히 경청하며 천천히 적응해 나간다.", value: "I" }
  },
  {
    id: 3,
    dimension: "EI",
    text: "스트레스를 왕창 받았을 때 나에게 가장 효과적인 해소법은?",
    optionA: { text: "친구들과 한바탕 신나게 수다를 떨며 밖에서 노는 것.", value: "E" },
    optionB: { text: "방 안에서 차분하게 좋아하는 음악이나 영화를 보며 쉬는 것.", value: "I" }
  },
  // S vs N
  {
    id: 4,
    dimension: "SN",
    text: "누군가 이야기를 나눌 때 나의 이목을 더 끄는 것은 무엇인가요?",
    optionA: { text: "실제 경험담이나 현실적인 수치, 명확하게 입증된 팩트 정보.", value: "S" },
    optionB: { text: "미래의 무궁무진한 가능성이나 독특한 상상력을 발휘하는 아이디어.", value: "N" }
  },
  {
    id: 5,
    dimension: "SN",
    text: "여행지에서 가고 싶던 카페 길을 찾을 때 나는 어떻게 움직이나요?",
    optionA: { text: "구체적인 이정표나 건물 간판(ex. oo상가 골목에서 우회전)을 유심히 본다.", value: "S" },
    optionB: { text: "전반적인 방향 감각이나 지도 앱의 전체 흐름 위주로 직관적으로 찾아간다.", value: "N" }
  },
  {
    id: 6,
    dimension: "SN",
    text: "영화나 소설을 감상하고 난 후, 내가 가장 주로 나누는 대화는?",
    optionA: { text: "기억에 남는 액션 씬이나 구체적인 줄거리, 사건의 개연성 이야기.", value: "S" },
    optionB: { text: "작품 속에 은유적으로 내포된 상징, 감독의 철학적 메시지 사색하기.", value: "N" }
  },
  // T vs F
  {
    id: 7,
    dimension: "TF",
    text: "친한 친구가 심각하고 슬픈 일을 겪으며 울먹일 때 내 머릿속엔...",
    optionA: { text: "일이 왜 그렇게 됐는지 인과를 살피며 실용적인 해결 방안을 떠올린다.", value: "T" },
    optionB: { text: "친구가 받았을 가슴 아픈 감정에 백퍼센트 공감하며 위로의 품을 열어준다.", value: "F" }
  },
  {
    id: 8,
    dimension: "TF",
    text: "의견이 격렬히 대립될 때, 내가 가치 있게 느끼는 대화 노선은?",
    optionA: { text: "감정을 걷어내고 팩트를 기반으로 정답이나 올바른 정론을 유도하는 것.", value: "T" },
    optionB: { text: "서로 감정이 다치지 않게 조화롭게 타협하며 돈독한 분위기를 수호하는 것.", value: "F" }
  },
  {
    id: 9,
    dimension: "TF",
    text: "나에게 가장 마음 깊이 와닿는 최고의 칭찬은 어느 쪽인가요?",
    optionA: { text: "일 처리가 확실하고 유능하며 똑똑하다는 이성적 능력 칭찬.", value: "T" },
    optionB: { text: "마음씨가 따뜻하고 타인을 잘 돌봐주는 착한 사람이라는 인품 칭찬.", value: "F" }
  },
  // J vs P
  {
    id: 10,
    dimension: "JP",
    text: "친구들과 함께 내일 여행을 떠날 때 나의 짐 싸기와 준비 상태는?",
    optionA: { text: "날짜별 코스, 시간표, 비상 대책까지 명확하게 사전에 기획해 둔다.", value: "J" },
    optionB: { text: "큰 행선지만 몇 개 찍어두고, 나머지는 현지 기분과 상황에 맞게 즐긴다.", value: "P" }
  },
  {
    id: 11,
    dimension: "JP",
    text: "기한이 일주일 남은 중요한 프로젝트나 공부를 해야 할 때 나는...",
    optionA: { text: "매일 해야 할 분량을 성실하게 균등 분배해서 미리미리 끝내둔다.", value: "J" },
    optionB: { text: "일단 좀 미뤄두다가 마감 이틀 전부터 엄청난 집중력을 쏟아 벼락치기한다.", value: "P" }
  },
  {
    id: 12,
    dimension: "JP",
    text: "나의 방이나 컴퓨터 폴더 안의 파일들을 정리 정돈할 때 스타일은?",
    optionA: { text: "카테고리별로 일목요연하고 깔끔하게 분류해 두어 찾기 쉽게 제자리에 둔다.", value: "J" },
    optionB: { text: "굳이 완벽하게 정리하지 않아도 어디에 뭐가 있는지 자연스럽게 직감한다.", value: "P" }
  }
];

export const MBTI_EXPLANATIONS: Record<string, { title: string; desc: string; icon: string }> = {
  "ISTJ": { title: "청렴결백한 논리주의자", desc: "매우 성실하며 사실에 근거하여 사고하고 흔들림 없이 책임을 다하는 신뢰의 아이콘", icon: "📐" },
  "ISFJ": { title: "용감한 수호자", desc: "소중한 이들을 헌신적이고 따뜻하게 돌보며 신용을 중시하고 묵묵히 자리를 사수하는 성자", icon: "🛡️" },
  "INFJ": { title: "선의의 옹호자", desc: "마음의 깊은 통찰력을 바탕으로 신념을 지키며 다른 이들을 돕고 이정표를 놓는 선지자", icon: "🔮" },
  "INTJ": { title: "용의주도한 전략가", desc: "상상력이 풍부하면서도 결단력이 있으며 호기심이 무궁무진하고 치밀한 분석을 뽐내는 지혜가", icon: "♟️" },
  "ISTP": { title: "만능 재주꾼", desc: "냉철한 이성과 강인한 호기심을 지녀 도구를 능숙하게 다루고 문제를 해결하는 실천가", icon: "🛠️" },
  "ISFP": { title: "호기심 많은 예술가", desc: "언제나 새로운 것에 도전하며 유연하고 다정다감한 태도로 세상을 아름답게 감상하는 미식가", icon: "🎨" },
  "INFP": { title: "열정적인 중재자", desc: "상냥하고 이타적이며 마음속 신념과 세상을 아름답게 조율해 나가는 따사로운 이상주의자", icon: "🌸" },
  "INTP": { title: "논리적인 사색가", desc: "지적 호기심이 타의 추종을 불허하며 새로운 아이디어 분석과 논리를 찾아 헤매는 고고한 학자", icon: "🧪" },
  "ESTP": { title: "모험을 즐기는 사업가", desc: "벼랑 끝 직관과 강인한 실행력을 무기로 삼아 활기차고 역동적으로 문제를 타개해 내는 장군", icon: "⚡" },
  "ESFP": { title: "자유로운 영혼의 연예인", desc: "천성이 유쾌하며 주변 사람들을 매료시키는 화려한 소통과 일상의 기쁨을 최고로 즐기는 주인공", icon: "✨" },
  "ENFP": { title: "재기발랄한 활동가", desc: "인정 넘치고 사교적이며 생동감 넘치는 상상력과 긍정적 영감 에너지를 퍼뜨리는 쾌남아", icon: "🎈" },
  "ENTP": { title: "뜨거운 논쟁을 즐기는 변론가", desc: "영리하고 지치지 않는 두뇌를 지녀 통념을 타파하고 참신한 대안을 제시하는 기발한 혁신가", icon: "🔥" },
  "ESTJ": { title: "엄격한 관리자", desc: "뛰어난 조직 수완을 발휘하여 일과 사람을 조율하고 원칙과 신용을 수호하는 듬직한 지휘관", icon: "📋" },
  "ESFJ": { title: "사교적인 외교관", desc: "배려심이 깊고 타인에게 아낌없는 격려와 사교적 조화를 선물하는 가장 사랑스러운 동반자", icon: "🤝" },
  "ENFJ": { title: "정의로운 사회운동가", desc: "강렬한 카리스마와 온화한 정서를 결합하여 많은 이들을 희망찬 가치로 이끄는 훌륭한 지도자", icon: "🗣️" },
  "ENTJ": { title: "대담한 지도자", desc: "목표를 정하면 어떤 가혹한 역경도 강력한 의지와 전략적 수완으로 지배하고 해결해 내는 제왕", icon: "👑" }
};

export default function MbtiTest({ onComplete, onCancel }: MbtiTestProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [testCompleted, setTestCompleted] = useState(false);
  const [calculatedMbti, setCalculatedMbti] = useState("");

  const handleSelectOption = (value: string) => {
    const q = QUESTIONS[currentIdx];
    const newAnswers = { ...answers, [q.id]: value };
    setAnswers(newAnswers);

    if (currentIdx < QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentIdx(currentIdx + 1);
      }, 250);
    } else {
      // Finished all 12 questions! Calculate the MBTI
      const score: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
      Object.entries(newAnswers).forEach(([_, val]) => {
        const key = val as string;
        score[key] = (score[key] || 0) + 1;
      });

      const mbtiResult = [
        (score.E || 0) >= (score.I || 0) ? "E" : "I",
        (score.S || 0) >= (score.N || 0) ? "S" : "N",
        (score.T || 0) >= (score.F || 0) ? "T" : "F",
        (score.J || 0) >= (score.P || 0) ? "J" : "P"
      ].join("");

      setCalculatedMbti(mbtiResult);
      setTestCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const resetTest = () => {
    setAnswers({});
    setCurrentIdx(0);
    setTestCompleted(false);
    setCalculatedMbti("");
  };

  const progressPercent = Math.round(((currentIdx) / QUESTIONS.length) * 100);

  if (testCompleted) {
    const info = MBTI_EXPLANATIONS[calculatedMbti] || { title: "매력적인 분석 성향", desc: "나만의 고유한 인생 성향이 깃든 MBTI 코드", icon: "⭐" };
    return (
      <div className="bg-white border border-[#D6CCBC] p-6 rounded-2xl shadow-md text-center space-y-5 animate-fade-in text-left">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#FCFAF5] border border-[#D6CCBC] flex items-center justify-center text-4xl shadow-xs">
            {info.icon}
          </div>
          <span className="text-[10px] bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/20 px-2.5 py-1 rounded-full font-bold">
            성향 분석 완료 ☯
          </span>
          <h3 className="font-serif text-2xl font-black text-[#2C3E50] tracking-tight">
            {calculatedMbti}
          </h3>
          <h4 className="font-serif text-sm font-bold text-[#C0392B]">
            {info.title}
          </h4>
          <p className="text-xs text-[#5A4D41] leading-relaxed max-w-xs mx-auto pt-2">
            {info.desc}
          </p>
        </div>

        <div className="bg-[#FCFAF6] border border-[#E8E0D0] p-4 rounded-xl text-center space-y-1">
          <p className="text-[11px] text-[#8C7B6E]">
            이 MBTI 기운을 내 사주 명식에 등록하여 <br />
            <strong>오행과의 조화 및 궁합 케미</strong>를 완성할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={resetTest}
            className="py-3.5 bg-[#FAF7F2] border border-[#D6CCBC] hover:bg-[#F0EDE4] text-[#8C7B6E] font-serif font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>처음부터 다시</span>
          </button>
          <button
            onClick={() => onComplete(calculatedMbti)}
            className="py-3.5 bg-[#C0392B] hover:bg-[#A93226] text-white font-serif font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-[#C0392B]/10 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>이 기운 등록하기</span>
          </button>
        </div>

        <button
          onClick={onCancel}
          className="w-full text-center text-[11px] text-[#8C7B6E] hover:underline pt-1"
        >
          돌아가기
        </button>
      </div>
    );
  }

  const q = QUESTIONS[currentIdx];

  return (
    <div className="bg-white border border-[#D6CCBC] p-6 rounded-2xl shadow-md space-y-6 text-left relative overflow-hidden">
      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-[#8C7B6E] font-bold">
          <span>스피드 MBTI 테스트</span>
          <span>{currentIdx + 1} / {QUESTIONS.length} 문항</span>
        </div>
        <div className="w-full h-1.5 bg-[#F0EDE4] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C0392B] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="space-y-4 pt-1 select-none">
        <div className="bg-[#FAF7F2] border border-[#E8E0D0] p-5 rounded-xl min-h-[100px] flex items-center justify-center text-center">
          <h3 className="font-serif text-sm font-extrabold text-[#2C3E50] leading-relaxed">
            {q.text}
          </h3>
        </div>

        {/* Options */}
        <div className="space-y-3.5">
          <button
            onClick={() => handleSelectOption(q.optionA.value)}
            className={`w-full p-4.5 rounded-xl border text-left text-xs leading-relaxed font-semibold transition-all duration-200 cursor-pointer flex items-start gap-3 bg-white border-[#E8E0D0] hover:border-[#C0392B] hover:bg-[#FFF9F6] active:scale-[0.99]`}
          >
            <span className="w-5 h-5 rounded-full bg-[#FCFAF5] border border-[#D6CCBC] flex items-center justify-center text-[10px] font-bold text-[#8C7B6E] mt-0.5 shrink-0">A</span>
            <span className="text-[#5A4D41]">{q.optionA.text}</span>
          </button>

          <button
            onClick={() => handleSelectOption(q.optionB.value)}
            className={`w-full p-4.5 rounded-xl border text-left text-xs leading-relaxed font-semibold transition-all duration-200 cursor-pointer flex items-start gap-3 bg-white border-[#E8E0D0] hover:border-[#C0392B] hover:bg-[#FFF9F6] active:scale-[0.99]`}
          >
            <span className="w-5 h-5 rounded-full bg-[#FCFAF5] border border-[#D6CCBC] flex items-center justify-center text-[10px] font-bold text-[#8C7B6E] mt-0.5 shrink-0">B</span>
            <span className="text-[#5A4D41]">{q.optionB.text}</span>
          </button>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-[#F0EDE4]">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className={`flex items-center gap-1 py-1.5 px-3 rounded text-[11px] font-bold font-serif ${
            currentIdx === 0 ? "text-[#D6CCBC] cursor-not-allowed" : "text-[#8C7B6E] hover:text-[#C0392B] cursor-pointer"
          }`}
        >
          <ArrowLeft className="w-3 h-3" />
          이전 문항
        </button>

        <button
          onClick={onCancel}
          className="text-[11px] text-[#8C7B6E] hover:underline"
        >
          테스트 취소
        </button>
      </div>
    </div>
  );
}
