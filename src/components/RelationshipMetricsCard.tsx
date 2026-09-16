import React, { useState } from "react";
import { ChevronDown, ChevronUp, HeartHandshake, Sparkles, HelpCircle } from "lucide-react";
import { Member } from "../types";
import { getDetailedRelationshipMetrics, DetailedRelationshipMetric } from "../utils/pairChemistry";

interface RelationshipMetricsCardProps {
  m1: Member;
  m2: Member;
  pairScore: number;
  title?: string;
}

export default function RelationshipMetricsCard({
  m1,
  m2,
  pairScore,
  title,
}: RelationshipMetricsCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const metrics: DetailedRelationshipMetric[] = getDetailedRelationshipMetrics(m1, m2, pairScore);

  const toggleMetric = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-line pb-2.5">
        <h3 className="font-serif text-sm font-bold text-ink flex items-center gap-1.5">
          <HeartHandshake className="w-4 h-4 text-seal" />
          <span>{title || `${m1.nickname} & ${m2.nickname} 관계 역학`}</span>
        </h3>
        <span className="text-[11px] text-ink-faint flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-seal" />
          카드를 터치하면 왜 이 점수인지 상세 풀이가 열려요!
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {metrics.map((item) => {
          const isExpanded = expandedId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => toggleMetric(item.id)}
              className={`p-3.5 rounded-xl transition-all cursor-pointer border text-left ${
                isExpanded
                  ? "bg-surface border-seal/40 shadow-sm ring-1 ring-seal/20"
                  : "bg-sunken hover:bg-surface border-line hover:border-seal/30"
              }`}
            >
              {/* Card Header: Label & Score */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-ink flex items-center gap-1">
                  <span>{item.label}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-seal text-sm">{item.score}점</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMetric(item.id);
                    }}
                    className="text-ink-faint hover:text-ink transition-colors p-0.5"
                    aria-label={isExpanded ? "상세 닫기" : "상세 열기"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-seal" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-line rounded-full overflow-hidden my-2">
                <div
                  className="h-full bg-gradient-to-r from-seal to-wood rounded-full transition-all duration-300"
                  style={{ width: `${item.score}%` }}
                />
              </div>

              {/* Short Summary Description */}
              <p className="text-[11px] text-ink-faint leading-tight flex items-center justify-between">
                <span>{item.shortDesc}</span>
                <span className="text-[10px] text-seal font-semibold shrink-0 ml-1">
                  {isExpanded ? "접기 ▲" : "풀이보기 ▼"}
                </span>
              </p>

              {/* Interactive Accordion Body: Detailed Reason & Action Tip */}
              {isExpanded && (
                <div
                  className="mt-3 pt-3 border-t border-line/60 space-y-2.5 animate-fade-in text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Detailed Reason */}
                  <div className="bg-sunken/80 rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center gap-1 text-seal font-bold text-[11px]">
                      <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.reasonTitle}</span>
                    </div>
                    <p className="text-ink-soft text-[11px] leading-relaxed">
                      {item.detailReason}
                    </p>
                  </div>

                  {/* Action Tip */}
                  <div className="bg-seal/5 rounded-lg p-2.5 space-y-1 border border-seal/10">
                    <div className="flex items-center gap-1 text-seal font-bold text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.actionTipTitle}</span>
                    </div>
                    <p className="text-ink text-[11px] leading-relaxed">
                      {item.actionTip}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
