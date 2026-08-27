import React, { useMemo, useState } from "react";
import Layout from "./Layout";
import PairChemistryModal from "./PairChemistryModal";
import ViralCardModal from "./ViralCardModal";
import PdfReportModal from "./PdfReportModal";
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
                className={`p-3 rounded-xl text-left transition-colors cursor-pointer ${
                  i === 0 ? "bg-sunken" : "bg-sunken hover:bg-line"
                }`}
              >
                <span className="block text-sm font-semibold text-ink">
                  {m.nickname} {i === 0 && <span className="text-xs text-ink-faint">(나)</span>}
                </span>
                <span className="block text-xs text-ink-soft mt-0.5">
                  {m.saju?.daymaster?.gan} {m.character_animal} · {m.mbti}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-faint">
            멤버를 누르면 1:1 궁합 모달이 열립니다.
          </p>
        </div>

        <div className="bg-surface border border-line rounded-xl p-5 space-y-3">
          <h2 className="font-serif text-lg font-semibold text-ink">모달 확인</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setViralOpen(true)}
              className="py-3 px-4 bg-sunken hover:bg-line text-ink text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              공유 카드 모달
            </button>
            <button
              type="button"
              onClick={() => setPdfOpen(true)}
              className="py-3 px-4 bg-sunken hover:bg-line text-ink text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              감정서 리포트 모달
            </button>
          </div>
        </div>
      </div>

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
    </Layout>
  );
}
