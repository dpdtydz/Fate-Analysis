import React, { useMemo, useState } from "react";
import Layout from "./Layout";
import PairChemistryModal from "./PairChemistryModal";
import ViralCardModal from "./ViralCardModal";
import PdfReportModal from "./PdfReportModal";
import HybridArchetypeDemoModal from "./HybridArchetypeDemoModal";
import GroupStoryModal from "./GroupStoryModal";
import ShinsalBadges from "./ShinsalBadges";
import { calculateGroupAwards } from "../utils/shinsalCalculator";
import ZodiacAvatar from "./ZodiacAvatar";
import { Sparkles, Layers, Trophy } from "lucide-react";
import { Member } from "../types";
import { calculateSaju, getDynamicCharacter } from "../utils/saju";

/**
 * 개발 전용 QA 하네스 — 실데이터 없이 모달·리포트 화면을 확인하기 위한 임시 화면.
 * #/dev-qa 로만 접근하며 프로덕션 동선에는 링크가 없다.
 */
const CITY = { name: "서울", lat: 37.5665, lon: 126.978 };

function makeMember(
  id: string,
  nickname: string,
  gender: "남성" | "여성",
  date: string,
  time: string | null,
  mbti: string
): Member {
  const saju = calculateSaju(date, time, CITY, gender);
  const meta = getDynamicCharacter(saju.daymaster.gan, saju.pillars.day.ji);
  return {
    id,
    nickname,
    gender,
    birth_date: date,
    birth_time: time,
    saju,
    character_emoji: meta.emoji,
    character_animal: meta.animalName,
    character_color: meta.color,
    mbti,
    joined_at: new Date().toISOString(),
  } as Member;
}

export default function DevQaHarness() {
  const members = useMemo(
    () => [
      makeMember("qa1", "김지우", "여성", "1993-03-11", "09:20", "ENFP"),
      makeMember("qa2", "박서준", "남성", "1988-11-02", "22:40", "ISTJ"),
      makeMember("qa3", "이하늘", "여성", "1996-07-24", "14:05", "INFJ"),
      makeMember("qa4", "최도윤", "남성", "1991-01-15", null, "ESTP"),
    ],
    []
  );

  const [pairOpen, setPairOpen] = useState(false);
  const [targetIdx, setTargetIdx] = useState(1);
  const [viralOpen, setViralOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [hybridDemoOpen, setHybridDemoOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);

  const awardsResult = useMemo(() => {
    return calculateGroupAwards(members, [], 88);
  }, [members]);

  return (
    <Layout title="개발 QA" showHomeButton>
      <div className="space-y-6 py-2">
        <div>
          <h1 className="font-serif text-xl font-semibold text-ink">개발 전용 QA 하네스</h1>
          <p className="text-sm text-ink-soft mt-1">
            실데이터 없이 모달과 리포트 화면의 디자인을 확인합니다.
          </p>
        </div>

        <div className="bg-surface border border-line rounded-xl p-5 space-y-3">
          <h2 className="font-serif text-lg font-semibold text-ink">테스트 멤버</h2>
          <div className="grid grid-cols-2 gap-2">
            {members.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setTargetIdx(i);
                  if (i !== 0) setPairOpen(true);
                }}
                className={`p-3 rounded-xl text-left transition-colors cursor-pointer flex items-center gap-3 ${
                  i === 0 ? "bg-sunken" : "bg-sunken hover:bg-line"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-surface border border-line/60 flex items-center justify-center shrink-0 overflow-hidden">
                  <ZodiacAvatar member={m} size={32} fallbackEmoji={m.character_emoji} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink truncate">
                    {m.nickname} {i === 0 && <span className="text-xs text-ink-faint">(나)</span>}
                  </span>
                  <span className="block text-xs text-ink-soft mt-0.5 truncate">
                    {m.saju?.daymaster?.gan} {m.character_animal} · {m.mbti}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-faint">
            멤버를 누르면 1:1 궁합 모달이 열립니다.
          </p>
        </div>

        {/* 🏆 5대 사주 어워즈 프리뷰 섹션 */}
        <div className="bg-surface border border-line rounded-xl p-5 space-y-3 text-left">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="font-serif text-lg font-semibold text-ink">우리 모임 5대 사주 어워즈</h2>
            </div>
            <button
              type="button"
              onClick={() => setStoryOpen(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#ff5a36] to-[#ec4899] text-white hover:opacity-95 transition-opacity cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>9:16 스토리 공유</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {awardsResult.awardsList.map((award) => (
              <div key={award.id} className="p-3 bg-sunken rounded-xl space-y-2 border border-line/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink flex items-center gap-1">
                    <span>{award.badgeEmoji}</span>
                    <span>{award.awardName}</span>
                  </span>
                  <span className="text-[11px] font-bold text-seal bg-surface px-2 py-0.5 rounded-md">
                    {award.badgeTitle} · {award.score}점
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ZodiacAvatar member={award.winner} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-ink truncate">{award.winner.nickname}</p>
                    <p className="text-[11px] text-ink-soft truncate">{award.tagline}</p>
                  </div>
                </div>
                <div className="pt-1 border-t border-line/40">
                  <ShinsalBadges member={award.winner} compact />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-5 space-y-3">
          <h2 className="font-serif text-lg font-semibold text-ink">모달 확인</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setViralOpen(true)}
              className="py-3 px-4 bg-sunken hover:bg-line text-ink text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              소울 포토카드 모달
            </button>
            <button
              type="button"
              onClick={() => setPdfOpen(true)}
              className="py-3 px-4 bg-sunken hover:bg-line text-ink text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              감정서 리포트 모달
            </button>
            <button
              type="button"
              onClick={() => setStoryOpen(true)}
              className="py-3 px-4 bg-gradient-to-r from-[#ff5a36] to-[#ec4899] text-white text-sm font-bold rounded-xl transition-all cursor-pointer col-span-2 flex items-center justify-center gap-1.5 shadow-md"
            >
              <Trophy className="w-4 h-4 text-amber-200" />
              <span>9:16 인스타 사주 어워즈 스토리 모달 열기</span>
            </button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setHybridDemoOpen(true)}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-red-700 via-seal to-amber-700 hover:opacity-95 text-white text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>사주 × 자미두수 × MBTI 하이브리드 엔진 체험</span>
            </button>
          </div>
        </div>
      </div>

      <GroupStoryModal
        isOpen={storyOpen}
        onClose={() => setStoryOpen(false)}
        roomTitle="QA 테스트 모임"
        allMembers={members}
        groupScore={88}
      />

      <PairChemistryModal
        isOpen={pairOpen}
        onClose={() => setPairOpen(false)}
        myMember={members[0]}
        targetMember={members[targetIdx]}
        roomCode="QATEST"
      />

      <ViralCardModal
        isOpen={viralOpen}
        onClose={() => setViralOpen(false)}
        member={members[0]}
        allMembers={members}
        roomTitle="QA 테스트 모임"
        roomCode="QATEST"
        initialTab="identity"
      />

      <PdfReportModal
        isOpen={pdfOpen}
        onClose={() => setPdfOpen(false)}
        member={members[0]}
        roomTitle="QA 테스트 모임"
        roomCode="QATEST"
      />

      <HybridArchetypeDemoModal
        isOpen={hybridDemoOpen}
        onClose={() => setHybridDemoOpen(false)}
      />
    </Layout>
  );
}
