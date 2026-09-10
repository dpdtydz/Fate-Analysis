import React from "react";
import { Member } from "../types";
import ZodiacAvatar from "./ZodiacAvatar";
import { Sparkles, HeartHandshake, Info } from "lucide-react";

interface PairData {
  member_id_1: string;
  member_id_2: string;
  score: number;
  label?: string;
}

interface ChemistryMatrixProps {
  members: Member[];
  pairs?: PairData[];
  onSelectPair: (m1: Member, m2: Member) => void;
}

function getGradeFromScore(score: number): { grade: string; bgClass: string; textClass: string } {
  if (score >= 90) return { grade: "S+", bgClass: "bg-emerald-500/15 border-emerald-500/30", textClass: "text-emerald-700 dark:text-emerald-300 font-bold" };
  if (score >= 85) return { grade: "S", bgClass: "bg-teal-500/15 border-teal-500/30", textClass: "text-teal-700 dark:text-teal-300 font-semibold" };
  if (score >= 78) return { grade: "A+", bgClass: "bg-blue-500/15 border-blue-500/30", textClass: "text-blue-700 dark:text-blue-300 font-medium" };
  if (score >= 70) return { grade: "A", bgClass: "bg-amber-500/15 border-amber-500/30", textClass: "text-amber-700 dark:text-amber-300 font-medium" };
  return { grade: "B", bgClass: "bg-rose-500/10 border-rose-500/25", textClass: "text-rose-700 dark:text-rose-300 font-medium" };
}

export default function ChemistryMatrix({ members = [], pairs = [], onSelectPair }: ChemistryMatrixProps) {
  if (!members || members.length < 2) return null;

  // Create lookup map for fast pair score search
  const scoreMap = new Map<string, { score: number; label: string }>();
  (pairs || []).forEach((p) => {
    const key1 = `${p.member_id_1}:${p.member_id_2}`;
    const key2 = `${p.member_id_2}:${p.member_id_1}`;
    scoreMap.set(key1, { score: p.score, label: p.label || "" });
    scoreMap.set(key2, { score: p.score, label: p.label || "" });
  });

  const getPairScore = (id1: string, id2: string) => {
    const found = scoreMap.get(`${id1}:${id2}`);
    if (found) return found;

    // Deterministic fallback if not yet in pair list
    const combined = [id1, id2].sort().join("");
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    const score = Math.abs(hash % 25) + 72; // 72~96
    return { score, label: score >= 88 ? "천생연분" : "상호보완" };
  };

  return (
    <div className="space-y-3 text-left">
      {/* Matrix Header Notice */}
      <div className="flex items-center justify-between text-xs text-ink-soft">
        <span className="flex items-center gap-1.5 font-medium text-ink">
          <Sparkles className="w-3.5 h-3.5 text-seal" />
          모임 전원 1:1 케미 매트릭스
        </span>
        <span className="text-[11px] text-ink-faint">셀을 누르면 상세 궁합이 열립니다</span>
      </div>

      {/* Responsive Horizontal Scroll Container */}
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-xs pb-1">
        <table className="w-full text-center border-collapse text-xs min-w-[340px]">
          <thead>
            <tr className="bg-sunken border-b border-line">
              <th className="p-2.5 text-[11px] font-semibold text-ink-faint border-r border-line w-16">
                멤버
              </th>
              {members.map((m) => (
                <th key={`col-${m.id}`} className="p-2 border-r border-line last:border-r-0 min-w-[56px] sm:min-w-[68px]">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-7 h-7 rounded-full bg-surface border border-line flex items-center justify-center overflow-hidden">
                      <ZodiacAvatar member={m} size={24} fallbackEmoji={m.character_emoji} />
                    </div>
                    <span className="font-semibold text-ink text-[11px] truncate max-w-[50px]">
                      {m.nickname}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((rowMember, rowIdx) => (
              <tr key={`row-${rowMember.id}`} className="border-b border-line last:border-b-0 hover:bg-sunken/40 transition-colors">
                {/* Row Header */}
                <th className="p-2 bg-sunken/60 border-r border-line text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface border border-line flex items-center justify-center overflow-hidden shrink-0">
                      <ZodiacAvatar member={rowMember} size={20} fallbackEmoji={rowMember.character_emoji} />
                    </div>
                    <span className="font-semibold text-ink text-xs truncate max-w-[50px]">
                      {rowMember.nickname}
                    </span>
                  </div>
                </th>

                {/* Matrix Cells */}
                {members.map((colMember, colIdx) => {
                  if (rowMember.id === colMember.id) {
                    return (
                      <td key={`cell-${rowMember.id}-${colMember.id}`} className="p-2 border-r border-line last:border-r-0 bg-sunken/30 text-ink-faint font-mono text-[11px]">
                        -
                      </td>
                    );
                  }

                  const { score } = getPairScore(rowMember.id, colMember.id);
                  const meta = getGradeFromScore(score);

                  return (
                    <td
                      key={`cell-${rowMember.id}-${colMember.id}`}
                      onClick={() => onSelectPair(rowMember, colMember)}
                      className="p-1.5 sm:p-2 border-r border-line last:border-r-0 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                    >
                      <div className={`py-1 px-1.5 rounded-lg border ${meta.bgClass} flex flex-col items-center justify-center shadow-2xs`}>
                        <span className={`text-[10px] sm:text-xs ${meta.textClass}`}>
                          {score}점
                        </span>
                        <span className="text-[9px] font-bold text-ink-faint">
                          {meta.grade}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grade Legend */}
      <div className="flex flex-wrap items-center justify-end gap-2 text-[10px] text-ink-soft pt-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          S+ 환상 궁합 (90점 이상)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          S 최적 조화 (85~89점)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          A 든든한 협력 (78~84점)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          조율 필요
        </span>
      </div>
    </div>
  );
}
