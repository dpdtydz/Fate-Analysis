import React, { useMemo, useState } from "react";
import { Member, PairAnalysis } from "../types";
import { Sparkles, ArrowRightLeft, Heart, Filter, Users, Smile, AlertTriangle, Crown } from "lucide-react";

interface GroupNetworkProps {
  members: Member[];
  pairs: PairAnalysis[];
  isPremium: boolean;
}

const isMbtiRegistered = (m?: any): boolean => {
  if (!m || !m.mbti) return false;
  const val = String(m.mbti).trim();
  return val !== "" && val !== "null" && val.toLowerCase() !== "미입력" && !val.toLowerCase().includes("미입력");
};

// Deterministic asymmetric chemistry score generator based on Saju five elements (Ohaeng) and unique name hashes
const getAsymmetricScores = (m1: Member, m2: Member, baseScore: number) => {
  if (!m1 || !m2) return { score1to2: baseScore, score2to1: baseScore };

  const hash1 = [...(m1.id || "")].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hash2 = [...(m2.id || "")].reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const elem1 = m1.saju?.daymaster?.element || "";
  const elem2 = m2.saju?.daymaster?.element || "";

  const saeng: Record<string, string> = { "목": "화", "화": "토", "토": "금", "금": "수", "수": "목" };
  const geuk: Record<string, string> = { "목": "토", "토": "수", "수": "화", "화": "금", "금": "목" };

  let offset1to2 = (hash1 % 7) - 3;
  let offset2to1 = (hash2 % 7) - 3;

  if (elem1 && elem2) {
    if (saeng[elem1] === elem2) {
      offset1to2 -= 3;
      offset2to1 += 13;
    } else if (saeng[elem2] === elem1) {
      offset1to2 += 13;
      offset2to1 -= 3;
    }

    if (geuk[elem1] === elem2) {
      offset1to2 += 5;
      offset2to1 -= 17;
    } else if (geuk[elem2] === elem1) {
      offset1to2 -= 17;
      offset2to1 += 5;
    }
  }

  const score1to2 = Math.max(12, Math.min(99, baseScore + offset1to2));
  const score2to1 = Math.max(12, Math.min(99, baseScore + offset2to1));

  return { score1to2, score2to1 };
};

const getPairAsymmetricScores = (pair: PairAnalysis | undefined, m1: Member, m2: Member) => {
  if (!m1 || !m2) return { score1to2: 50, score2to1: 50 };
  if (!pair) {
    return getAsymmetricScores(m1, m2, 65);
  }

  if (pair.saju && pair.ziwei && pair.mbti && pair.zodiac) {
    const isM1First = m1.id.trim().toLowerCase() === pair.member_id_1.trim().toLowerCase() ||
                      m1.nickname.trim().toLowerCase().replace(/님$/, "") === pair.member_id_1.trim().toLowerCase().replace(/님$/, "");
    
    const saju_1_to_2 = pair.saju.score_1_to_2;
    const saju_2_to_1 = pair.saju.score_2_to_1;
    const ziwei_1_to_2 = pair.ziwei.score_1_to_2;
    const ziwei_2_to_1 = pair.ziwei.score_2_to_1;
    const mbti_1_to_2 = pair.mbti.score_1_to_2;
    const mbti_2_to_1 = pair.mbti.score_2_to_1;
    const zodiac_1_to_2 = pair.zodiac.score_1_to_2;
    const zodiac_2_to_1 = pair.zodiac.score_2_to_1;

    const avg_1_to_2 = Math.round((saju_1_to_2 + ziwei_1_to_2 + mbti_1_to_2 + zodiac_1_to_2) / 4);
    const avg_2_to_1 = Math.round((saju_2_to_1 + ziwei_2_to_1 + mbti_2_to_1 + zodiac_2_to_1) / 4);

    if (isM1First) {
      return { score1to2: avg_1_to_2, score2to1: avg_2_to_1 };
    } else {
      return { score1to2: avg_2_to_1, score2to1: avg_1_to_2 };
    }
  }

  return getAsymmetricScores(m1, m2, pair.score);
};

export default function GroupNetwork({ members, pairs, isPremium }: GroupNetworkProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // Filter for high/low/all connections when a node is selected or in overview
  const [relationFilter, setRelationFilter] = useState<"all" | "good" | "bad">("all");

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#f97316"; // 수려한 케미 (귤색)
    if (score >= 70) return "#10b981"; // 상생 조화 (초록색)
    if (score >= 50) return "#eab308"; // 무난 평온 (노란색)
    if (score >= 30) return "#f97316"; // 티격태격 (황토색)
    return "#ef4444";                  // 상극 오행 (붉은색)
  };

  const getScoreBgClass = (score: number) => {
    if (score >= 90) return "bg-orange-50 text-orange-600 border-orange-200";
    if (score >= 70) return "bg-emerald-50 text-emerald-600 border-emerald-200";
    if (score >= 50) return "bg-amber-50 text-amber-600 border-amber-200";
    return "bg-rose-50 text-rose-600 border-rose-200";
  };

  // --- REVOLUTIONARY DYNAMIC SIZING FOR MANY MEMBERS ---
  const isLargeGroup = members.length > 8;
  const svgSize = isLargeGroup ? 440 : 340;
  const center = svgSize / 2;
  const radius = isLargeGroup ? 145 : 105;
  const nodeRadius = isLargeGroup ? 14 : 18;

  // Coordinates for members in a circle
  const nodes = useMemo(() => {
    const n = members.length;
    return members.map((m, i) => {
      // Rotate starting angle so first node is exactly at top
      const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
      return {
        id: m.id,
        nickname: m.nickname,
        emoji: m.character_emoji,
        color: m.character_color,
        element: m.saju?.daymaster?.element || "기운",
        rawMember: m,
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
      };
    });
  }, [members, center, radius]);

  // Robust finder helper using ID or fuzzy Nickname matching
  const findNode = (idOrName: string) => {
    if (!idOrName) return null;
    const normalized = idOrName.trim().toLowerCase();
    
    let found = nodes.find((n) => n.id.trim().toLowerCase() === normalized);
    if (found) return found;

    const cleanNorm = normalized.replace(/님$/, "");
    found = nodes.find((n) => n.nickname.trim().toLowerCase().replace(/님$/, "") === cleanNorm);
    if (found) return found;

    found = nodes.find((n) => {
      const dbNick = n.nickname.trim().toLowerCase().replace(/님$/, "");
      return dbNick.includes(cleanNorm) || cleanNorm.includes(dbNick);
    });
    return found || null;
  };

  // Find base pair score helper
  const findBasePair = (idA: string, idB: string) => {
    const nodeA = nodes.find(n => n.id === idA);
    const nodeB = nodes.find(n => n.id === idB);
    if (!nodeA || !nodeB) return undefined;

    const matchIdOrName = (memberIdOrName: string, node: any) => {
      if (!memberIdOrName || !node) return false;
      const normInput = memberIdOrName.trim().toLowerCase().replace(/님$/, "");
      const normId = node.id.trim().toLowerCase();
      const normNick = node.nickname.trim().toLowerCase().replace(/님$/, "");
      return (
        normId === normInput ||
        normNick === normInput ||
        normId.includes(normInput) ||
        normNick.includes(normInput) ||
        normInput.includes(normNick)
      );
    };

    return pairs.find(
      (p) =>
        (matchIdOrName(p.member_id_1, nodeA) && matchIdOrName(p.member_id_2, nodeB)) ||
        (matchIdOrName(p.member_id_2, nodeA) && matchIdOrName(p.member_id_1, nodeB))
    );
  };

  // Compute lines between nodes with filtering support
  const lines = useMemo(() => {
    let activePairs = [];

    if (selectedNodeId) {
      // If a person is selected, draw connections with EVERY other member (asymmetric)
      const otherNodes = nodes.filter((n) => n.id !== selectedNodeId);
      
      const allAsymPairs = otherNodes.map((other) => {
        const pair = findBasePair(selectedNodeId, other.id);
        const mSelected = members.find((m) => m.id === selectedNodeId)!;
        const mOther = other.rawMember;

        const { score1to2, score2to1 } = getPairAsymmetricScores(pair, mSelected, mOther);
        const avgScore = (score1to2 + score2to1) / 2;

        return {
          id1: selectedNodeId,
          id2: other.id,
          score1to2,
          score2to1,
          avgScore,
          color: getScoreColor(avgScore),
        };
      });

      // Apply relationship filter
      if (relationFilter === "good") {
        activePairs = allAsymPairs.filter(p => p.avgScore >= 70);
      } else if (relationFilter === "bad") {
        activePairs = allAsymPairs.filter(p => p.avgScore < 50);
      } else {
        activePairs = allAsymPairs;
      }
    } else {
      // Unselected state: show ONLY the top 4 strongest combinations in the group
      const sortedPairs = [...pairs].sort((a, b) => b.score - a.score).slice(0, 4);
      activePairs = sortedPairs.map((p) => {
        const nodeA = findNode(p.member_id_1);
        const nodeB = findNode(p.member_id_2);
        if (!nodeA || !nodeB) return null;

        const { score1to2, score2to1 } = getPairAsymmetricScores(p, nodeA.rawMember, nodeB.rawMember);

        return {
          id1: nodeA.id,
          id2: nodeB.id,
          score1to2,
          score2to1,
          avgScore: p.score,
          color: getScoreColor(p.score),
        };
      }).filter((p) => p !== null) as any[];
    }

    return activePairs.map((ap) => {
      const nodeA = nodes.find((n) => n.id === ap.id1);
      const nodeB = nodes.find((n) => n.id === ap.id2);
      if (!nodeA || !nodeB) return null;

      return {
        ...ap,
        x1: nodeA.x,
        y1: nodeA.y,
        x2: nodeB.x,
        y2: nodeB.y,
        nodeA,
        nodeB,
      };
    }).filter((l) => l !== null) as Array<{
      id1: string;
      id2: string;
      score1to2: number;
      score2to1: number;
      avgScore: number;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      nodeA: typeof nodes[0];
      nodeB: typeof nodes[0];
    }>;
  }, [nodes, pairs, selectedNodeId, members, relationFilter]);

  const selectedMember = useMemo(() => {
    return members.find((m) => m.id === selectedNodeId) || null;
  }, [members, selectedNodeId]);

  return (
    <div className="flex flex-col bg-[#FAF8F3] p-4.5 sm:p-5 border border-[#E8E0D0] rounded-2xl relative overflow-hidden space-y-4">
      {/* Network Header */}
      <div className="text-center space-y-1.5">
        <h4 className="font-serif text-sm font-bold text-[#5A4D41] flex items-center justify-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#C0392B]" />
          <span>{selectedMember ? `${selectedMember.nickname}의 인연 관계도` : "우리의 궁합 지형도"}</span>
        </h4>
        <p className="text-[10px] text-[#8C7B6E] font-semibold max-w-sm mx-auto leading-relaxed">
          {selectedMember 
            ? `선택된 ${selectedMember.nickname}님을 중심으로 각 상대방과의 주고받는 양방향 기운과 친밀도 점수가 표시됩니다.`
            : "모임 전체에서 우주의 운명적 기운이 깃든 최고의 명품 케미 4쌍이 실시간으로 연결되어 보여집니다."}
        </p>
      </div>

      {/* FILTER BUTTONS: Solves clutter by letting users filter high/low connections */}
      {selectedNodeId && (
        <div className="flex items-center justify-center space-x-1.5 text-[10px]">
          <span className="text-[#8C7B6E] font-bold flex items-center space-x-0.5 mr-1">
            <Filter className="w-3 h-3 text-[#C0392B]" />
            <span>관계 필터:</span>
          </span>
          <button
            onClick={() => setRelationFilter("all")}
            className={`px-2 py-1 rounded-md border font-bold transition-all ${
              relationFilter === "all"
                ? "bg-[#C0392B] text-[#FAF7F2] border-transparent"
                : "bg-white text-[#5A4D41] border-[#D6CCBC] hover:bg-gray-50"
            }`}
          >
            모두 보기
          </button>
          <button
            onClick={() => setRelationFilter("good")}
            className={`px-2 py-1 rounded-md border font-bold transition-all flex items-center space-x-1 ${
              relationFilter === "good"
                ? "bg-emerald-600 text-[#FAF7F2] border-transparent"
                : "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50/30"
            }`}
          >
            <Smile className="w-2.5 h-2.5" />
            <span>맑음 (70점+)</span>
          </button>
          <button
            onClick={() => setRelationFilter("bad")}
            className={`px-2 py-1 rounded-md border font-bold transition-all flex items-center space-x-1 ${
              relationFilter === "bad"
                ? "bg-rose-600 text-[#FAF7F2] border-transparent"
                : "bg-white text-rose-600 border-rose-200 hover:bg-rose-50/30"
            }`}
          >
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>주의 (50점-)</span>
          </button>
        </div>
      )}

      {/* SVG Container: Dynamically scales based on member count */}
      <div 
        className="relative w-full mx-auto bg-white/50 border border-[#FAF0DE] rounded-2xl shadow-inner-xs p-2 flex items-center justify-center overflow-visible"
        style={{ maxWidth: `${svgSize}px`, aspectRatio: "1/1" }}
      >
        <svg
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="w-full h-full text-xs overflow-visible select-none"
        >
          {/* 1. ELEGANT AMBIENT BACKGROUND LINES AND GLOWS */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#FAF0DE"
            strokeWidth="1"
            strokeDasharray="4,4"
          />

          {/* 2. DRAW ELEGANT RELATIONSHIP LINES WITHOUT SCATTERED OVERLAYS */}
          {lines.map((line, idx) => {
            const isSelectedLine = selectedNodeId === line.id1 || selectedNodeId === line.id2;
            
            return (
              <g key={`line-${idx}`} className="transition-all duration-300">
                {/* Glow effect under connection lines */}
                <line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={line.color}
                  strokeWidth={selectedNodeId ? "3" : "4"}
                  strokeLinecap="round"
                  className="transition-all duration-300 opacity-20"
                />
                
                {/* Sharp clean central connection line */}
                <line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={line.color}
                  strokeWidth={selectedNodeId ? "1.5" : "2"}
                  strokeLinecap="round"
                  className="transition-all duration-300 opacity-80"
                />
              </g>
            );
          })}

          {/* 3. DRAW ROUND NODES & DETAILED DYNAMIC LABEL BADGES */}
          {nodes.map((node) => {
            // Text placement calculation (pointing outward from the circle center)
            const textOffset = isLargeGroup ? 20 : 25;
            const angle = Math.atan2(node.y - center, node.x - center);
            const labelX = node.x + textOffset * Math.cos(angle);
            const labelY = node.y + textOffset * Math.sin(angle);

            const isSelected = selectedNodeId === node.id;
            
            // Check if this node is connected to the selected node in the filtered list
            const isConnected = selectedNodeId 
              ? (node.id === selectedNodeId || lines.some(l => l.id1 === node.id || l.id2 === node.id)) 
              : true;

            // Get the scores from selected to this node
            let asymmetricInfo = null;
            if (selectedNodeId && !isSelected) {
              const pair = findBasePair(selectedNodeId, node.id);
              const baseScore = pair ? pair.score : 65;
              const mSelected = members.find((m) => m.id === selectedNodeId)!;
              
              const { score1to2, score2to1 } = getAsymmetricScores(mSelected, node.rawMember, baseScore);
              asymmetricInfo = { score1to2, score2to1 };
            }

            return (
              <g
                key={`node-${node.id}`}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedNodeId(selectedNodeId === node.id ? null : node.id);
                  setRelationFilter("all"); // Reset filter when switching nodes
                }}
              >
                {/* Pulsing ring around selected node */}
                {isSelected && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={nodeRadius + 6}
                    fill="none"
                    stroke="#C0392B"
                    strokeWidth="1.5"
                    strokeDasharray="4,2"
                    className="animate-pulse"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? nodeRadius + 3 : nodeRadius}
                  fill={isSelected ? "#C0392B" : "#FAF7F2"}
                  stroke={isSelected ? "#C0392B" : node.color}
                  strokeWidth="3"
                  className="transition-all duration-300 shadow-sm"
                  opacity={isConnected ? 1 : 0.25}
                />

                {/* Character Emoji inside Node */}
                <text
                  x={node.x}
                  y={node.y + (isLargeGroup ? 4 : 5)}
                  textAnchor="middle"
                  fontSize={isSelected ? (isLargeGroup ? "16px" : "19px") : (isLargeGroup ? "13px" : "16px")}
                  className="transition-all duration-300 select-none pointer-events-none"
                  opacity={isConnected ? 1 : 0.25}
                >
                  {node.emoji}
                </text>

                {/* Element Tag bubble directly below circle */}
                <g transform={`translate(${node.x}, ${node.y + (isSelected ? nodeRadius + 3 : nodeRadius)})`}>
                  <rect
                    x="-9"
                    y="-4"
                    width="18"
                    height="9"
                    rx="2"
                    fill={node.color}
                    className="opacity-95 shadow-2xs"
                  />
                  <text
                    textAnchor="middle"
                    y="3"
                    fill="#white"
                    fontSize="6px"
                    fontWeight="black"
                    className="text-white font-bold select-none pointer-events-none"
                  >
                    {node.element}
                  </text>
                </g>

                {/* NICKNAME & SCORE CARD COMBINED: Solves 100% of line clutters */}
                <foreignObject
                  x={labelX - 35}
                  y={labelY - (asymmetricInfo ? 17 : 9)}
                  width="70"
                  height={asymmetricInfo ? "32" : "18"}
                  className="overflow-visible pointer-events-none select-none transition-all duration-300"
                  opacity={isConnected ? 1 : 0.2}
                >
                  <div className="flex flex-col items-center justify-center space-y-0.5">
                    {/* Nickname plate */}
                    <div className={`px-1.5 py-0.5 rounded-md border text-[8px] font-black tracking-tight text-[#2C3E50] shadow-2xs bg-[#FAF7F2] truncate text-center w-full max-w-[60px] ${
                      isSelected ? "border-[#C0392B] font-extrabold ring-1 ring-[#C0392B]/20" : "border-[#E8E0D0]"
                    }`}>
                      {node.nickname}
                    </div>

                    {/* Highly polished dynamic bi-directional score badge below nickname */}
                    {asymmetricInfo && isConnected && (
                      <div className="flex items-center justify-center space-x-0.5 bg-[#2C3E50] text-[#FAF7F2] px-1 py-0.5 rounded-sm shadow-3xs text-[6.5px] font-bold font-mono">
                        <span className="text-red-300">{asymmetricInfo.score1to2}</span>
                        <span className="text-gray-400 font-sans text-[6px]">⇄</span>
                        <span className="text-emerald-300">{asymmetricInfo.score2to1}</span>
                      </div>
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Member Details Panel: Provides deep insights with beautiful layout */}
      {selectedMember ? (
        <div className="bg-white border border-[#E8E0D0] p-4.5 rounded-xl space-y-3 text-left shadow-xs transition-all duration-300">
          <div className="flex items-center justify-between border-b border-[#FAF0DE] pb-2">
            <span className="font-serif text-xs font-bold text-[#C0392B] flex items-center space-x-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{selectedMember.nickname} 기준 양방향 궁합 분석</span>
            </span>
            <button
              onClick={() => {
                setSelectedNodeId(null);
                setRelationFilter("all");
              }}
              className="text-[9px] text-[#8C7B6E] hover:text-[#C0392B] font-bold border border-[#D6CCBC] px-2 py-0.5 rounded-md hover:bg-gray-50 transition-colors"
            >
              전체 4쌍 보기
            </button>
          </div>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {nodes
              .filter((n) => n.id !== selectedNodeId)
              .map((other) => {
                const basePair = findBasePair(selectedNodeId, other.id);
                const { score1to2, score2to1 } = getPairAsymmetricScores(basePair, selectedMember, other.rawMember);
                const avgScore = (score1to2 + score2to1) / 2;

                // Match with active relation filter
                if (relationFilter === "good" && avgScore < 70) return null;
                if (relationFilter === "bad" && avgScore >= 50) return null;

                let relationalPhrase = "4대 우주 영역(사주, 자미두수, 별자리, MBTI)이 조화롭게 평화로운 조율력을 이루는 보완 관계입니다.";
                if (score1to2 >= 88 && score2to1 >= 88) {
                  relationalPhrase = "🌌 4대 영역 모두 완벽한 공명을 이루는 우주가 내린 최고의 영혼의 동반자입니다!";
                } else if (Math.abs(score1to2 - score2to1) >= 15) {
                  if (score1to2 > score2to1) {
                    relationalPhrase = `💛 ${selectedMember.nickname}님이 4대 영역 전반에서 상대방에게 긍정적 시너지를 아낌없이 이끌어주는 배려형 구도입니다.`;
                  } else {
                    relationalPhrase = `💚 ${other.nickname}님이 4대 영역 전반에서 아낌없이 성심껏 맞춰주고 서포트해주는 든든한 조력자 구조입니다.`;
                  }
                } else if (score1to2 <= 39 && score2to1 <= 39) {
                  relationalPhrase = "⚡ 4대 영역의 성질 차이로 인한 강력한 스파크! 세심한 대화와 상호 양보가 필요한 조합입니다.";
                } else if (score1to2 >= 70 && score2to1 <= 50) {
                  relationalPhrase = "💨 동상이몽! 나의 높은 종합 호감도와 시너지에 비해 상대방이 다소 속도를 늦추고 있습니다.";
                }

                const isM1First = basePair
                  ? (selectedMember.id.trim().toLowerCase() === basePair.member_id_1.trim().toLowerCase() ||
                     selectedMember.nickname.trim().toLowerCase().replace(/님$/, "") === basePair.member_id_1.trim().toLowerCase().replace(/님$/, ""))
                  : true;

                return (
                  <div
                    key={`asym-list-${other.id}`}
                    className="border p-3.5 rounded-xl flex flex-col space-y-2.5 bg-[#FAF9F6] border-[#FAF0DE] hover:border-gray-300 transition-colors shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#FAF0DE]/60 pb-2">
                      <div className="flex items-center space-x-1.5 font-bold text-[#2C3E50] text-xs">
                        <span>{other.emoji}</span>
                        <span>{other.nickname}님과의 인연</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-[#FAF8F3] border border-[#E8E0D0] text-[#8C7B6E] rounded-md font-medium">
                          {other.element} 기운 | {other.rawMember.mbti || "MBTI 없음"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center space-x-1 text-[10px]">
                          <span className="text-[#8C7B6E] font-medium">{selectedMember.nickname}님은 {other.nickname}님에게</span>
                          <span className="font-bold text-[#C0392B] bg-red-50/80 px-2 py-0.5 rounded border border-red-100">{score1to2}점</span>
                        </div>
                        <span className="text-gray-300 text-[9px]">|</span>
                        <div className="flex items-center space-x-1 text-[10px]">
                          <span className="text-[#8C7B6E] font-medium">{other.nickname}님은 {selectedMember.nickname}님에게</span>
                          <span className="font-bold text-green-600 bg-green-50/80 px-2 py-0.5 rounded border border-green-100">{score2to1}점</span>
                        </div>
                      </div>
                    </div>

                    {isPremium ? (
                      <>
                        {basePair && (
                          <div className="text-[10.5px] text-[#5A4D41] leading-relaxed bg-amber-50/30 p-2.5 rounded-lg border border-[#FAF0DE]/80">
                            <div className="font-bold text-[#C0392B] mb-1 flex items-center gap-1 text-[9.5px]">
                              🔮 4대 영역 종합 인연 감정 ({basePair.label})
                            </div>
                            <p className="font-semibold leading-relaxed">{basePair.description}</p>
                          </div>
                        )}

                        <p className="text-[10px] text-[#8C7B6E] font-medium leading-relaxed pl-1.5 border-l-2 border-amber-400 ml-0.5">
                          {relationalPhrase}
                        </p>

                        {basePair && basePair.saju && basePair.ziwei && basePair.mbti && basePair.zodiac && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2 mt-1 pt-1 border-t border-dashed border-[#FAF0DE]">
                              {/* Saju */}
                              <div className="bg-white/60 p-2 rounded-lg border border-[#FAF0DE] text-[9px] space-y-1">
                                <div className="font-bold text-[#2C3E50] flex justify-between">
                                  <span>☯️ 사주 궁합</span>
                                  <span className="text-amber-700 font-bold">
                                    {Math.round((basePair.saju.score_1_to_2 + basePair.saju.score_2_to_1) / 2)}점
                                  </span>
                                </div>
                                <div className="text-[8.5px] text-[#8C7B6E] flex justify-between">
                                  <span>나의 기운 ➔ 상대:</span>
                                  <span className="font-bold text-red-500">{isM1First ? basePair.saju.score_1_to_2 : basePair.saju.score_2_to_1}점</span>
                                </div>
                                <div className="text-[8.5px] text-[#8C7B6E] flex justify-between">
                                  <span>상대 기운 ➔ 나:</span>
                                  <span className="font-bold text-green-600">{isM1First ? basePair.saju.score_2_to_1 : basePair.saju.score_1_to_2}점</span>
                                </div>
                              </div>
                              {/* Ziwei */}
                              <div className="bg-white/60 p-2 rounded-lg border border-[#FAF0DE] text-[9px] space-y-1">
                                <div className="font-bold text-[#2C3E50] flex justify-between">
                                  <span>🔮 자미두수</span>
                                  <span className="text-indigo-700 font-bold">
                                    {Math.round((basePair.ziwei.score_1_to_2 + basePair.ziwei.score_2_to_1) / 2)}점
                                  </span>
                                </div>
                                <div className="text-[8.5px] text-[#8C7B6E] flex justify-between">
                                  <span>나의 명궁 ➔ 상대:</span>
                                  <span className="font-bold text-red-500">{isM1First ? basePair.ziwei.score_1_to_2 : basePair.ziwei.score_2_to_1}점</span>
                                </div>
                                <div className="text-[8.5px] text-[#8C7B6E] flex justify-between">
                                  <span>상대 명궁 ➔ 나:</span>
                                  <span className="font-bold text-green-600">{isM1First ? basePair.ziwei.score_2_to_1 : basePair.ziwei.score_1_to_2}점</span>
                                </div>
                              </div>
                              {/* MBTI */}
                              {isMbtiRegistered(selectedMember) && isMbtiRegistered(other.rawMember) ? (
                                <div className="bg-white/60 p-2 rounded-lg border border-[#FAF0DE] text-[9px] space-y-1">
                                  <div className="font-bold text-[#2C3E50] flex justify-between">
                                    <span>🧠 MBTI 성향</span>
                                    <span className="text-emerald-700 font-bold">
                                      {Math.round((basePair.mbti.score_1_to_2 + basePair.mbti.score_2_to_1) / 2)}점
                                    </span>
                                  </div>
                                  <div className="text-[8.5px] text-[#8C7B6E] flex justify-between">
                                    <span>나의 성정 ➔ 상대:</span>
                                    <span className="font-bold text-red-500">{isM1First ? basePair.mbti.score_1_to_2 : basePair.mbti.score_2_to_1}점</span>
                                  </div>
                                  <div className="text-[8.5px] text-[#8C7B6E] flex justify-between">
                                    <span>상대 성정 ➔ 나:</span>
                                    <span className="font-bold text-green-600">{isM1First ? basePair.mbti.score_2_to_1 : basePair.mbti.score_1_to_2}점</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-white/40 p-2 rounded-lg border border-[#FAF0DE] text-[9px] space-y-1">
                                  <div className="font-bold text-[#8C7B6E] flex justify-between">
                                    <span>🧠 MBTI 성향</span>
                                    <span className="text-gray-400 font-normal">미등록</span>
                                  </div>
                                  <div className="text-[8px] text-[#8C7B6E] italic leading-tight">
                                    {!isMbtiRegistered(selectedMember) && !isMbtiRegistered(other.rawMember)
                                      ? "두 사람 모두 MBTI 미등록"
                                      : !isMbtiRegistered(selectedMember)
                                      ? `${selectedMember.nickname}님 MBTI 미등록`
                                      : `${other.nickname}님 MBTI 미등록`}
                                  </div>
                                </div>
                              )}
                              {/* Zodiac */}
                              <div className="bg-white/60 p-2 rounded-lg border border-[#FAF0DE] text-[9px] space-y-1">
                                <div className="font-bold text-[#2C3E50] flex justify-between">
                                  <span>⭐ 별자리 궁합</span>
                                  <span className="text-rose-700 font-bold">
                                    {Math.round((basePair.zodiac.score_1_to_2 + basePair.zodiac.score_2_to_1) / 2)}점
                                  </span>
                                </div>
                                <div className="text-[8.5px] text-[#8C7B6E] flex justify-between">
                                  <span>나의 별자리 ➔ 상대:</span>
                                  <span className="font-bold text-red-500">{isM1First ? basePair.zodiac.score_1_to_2 : basePair.zodiac.score_2_to_1}점</span>
                                </div>
                                <div className="text-[8.5px] text-[#8C7B6E] flex justify-between">
                                  <span>상대 별자리 ➔ 나:</span>
                                  <span className="font-bold text-green-600">{isM1First ? basePair.zodiac.score_2_to_1 : basePair.zodiac.score_1_to_2}점</span>
                                </div>
                              </div>
                            </div>

                            {/* 4-Area Detailed Accordion/Disclosure */}
                            <details className="mt-1 group bg-white/40 border border-[#FAF0DE] rounded-lg p-2">
                              <summary className="text-[9px] font-extrabold text-[#8C7B6E] hover:text-[#C0392B] cursor-pointer list-none flex items-center justify-between select-none">
                                <span className="flex items-center gap-1">
                                  <span className="transition-transform group-open:rotate-90">▶</span>
                                  <span>🔍 4대 영역별 상세 텍스트 감정 분석 해설 보기</span>
                                </span>
                                <span className="text-[8px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-mono">열기/닫기</span>
                              </summary>
                              <div className="grid grid-cols-1 gap-2 mt-2 pt-2 border-t border-dashed border-[#FAF0DE]">
                                {/* Saju desc */}
                                <div className="space-y-0.5 text-left">
                                  <div className="font-bold text-[9px] text-[#2C3E50] flex items-center gap-1">
                                    <span>☯️ 사주 궁합:</span>
                                    <span className="text-amber-800 font-extrabold">{Math.round((basePair.saju.score_1_to_2 + basePair.saju.score_2_to_1) / 2)}점</span>
                                  </div>
                                  <p className="text-[#5A4D41] text-[8.5px] leading-relaxed pl-1.5 border-l border-amber-400 font-medium whitespace-pre-wrap">{basePair.saju.description}</p>
                                </div>
                                {/* Ziwei desc */}
                                <div className="space-y-0.5 text-left">
                                  <div className="font-bold text-[9px] text-[#2C3E50] flex items-center gap-1">
                                    <span>🔮 자미두수 궁합:</span>
                                    <span className="text-indigo-800 font-extrabold">{Math.round((basePair.ziwei.score_1_to_2 + basePair.ziwei.score_2_to_1) / 2)}점</span>
                                  </div>
                                  <p className="text-[#5A4D41] text-[8.5px] leading-relaxed pl-1.5 border-l border-indigo-400 font-medium whitespace-pre-wrap">{basePair.ziwei.description}</p>
                                </div>
                                {/* Mbti desc */}
                                <div className="space-y-0.5 text-left">
                                  <div className="font-bold text-[9px] text-[#2C3E50] flex items-center gap-1">
                                    <span>🧠 MBTI 성향 궁합:</span>
                                    {isMbtiRegistered(selectedMember) && isMbtiRegistered(other.rawMember) ? (
                                      <span className="text-emerald-800 font-extrabold">{Math.round((basePair.mbti.score_1_to_2 + basePair.mbti.score_2_to_1) / 2)}점</span>
                                    ) : (
                                      <span className="text-gray-400 font-normal text-[8px] bg-gray-100 px-1 rounded">미등록</span>
                                    )}
                                  </div>
                                  {isMbtiRegistered(selectedMember) && isMbtiRegistered(other.rawMember) ? (
                                    <p className="text-[#5A4D41] text-[8.5px] leading-relaxed pl-1.5 border-l border-emerald-400 font-medium whitespace-pre-wrap">{basePair.mbti.description}</p>
                                  ) : (
                                    <p className="text-[#8C7B6E] text-[8.5px] leading-relaxed pl-1.5 border-l border-gray-300 font-medium italic whitespace-pre-wrap">
                                      {!isMbtiRegistered(selectedMember) && !isMbtiRegistered(other.rawMember)
                                        ? "두 사람 모두 MBTI를 등록하지 않아 성향 궁합을 볼 수 없습니다."
                                        : !isMbtiRegistered(selectedMember)
                                        ? `${selectedMember.nickname}님이 MBTI를 등록하지 않아 성향 궁합을 볼 수 없습니다.`
                                        : `${other.nickname}님이 MBTI를 등록하지 않아 성향 궁합을 볼 수 없습니다.`}
                                    </p>
                                  )}
                                </div>
                                {/* Zodiac desc */}
                                <div className="space-y-0.5 text-left">
                                  <div className="font-bold text-[9px] text-[#2C3E50] flex items-center gap-1">
                                    <span>⭐ 별자리 궁합:</span>
                                    <span className="text-rose-800 font-extrabold">{Math.round((basePair.zodiac.score_1_to_2 + basePair.zodiac.score_2_to_1) / 2)}점</span>
                                  </div>
                                  <p className="text-[#5A4D41] text-[8.5px] leading-relaxed pl-1.5 border-l border-rose-400 font-medium whitespace-pre-wrap">{basePair.zodiac.description}</p>
                                </div>
                              </div>
                            </details>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-amber-50/40 border border-amber-200 p-3 rounded-lg text-center space-y-2 mt-1 relative overflow-hidden">
                        <div className="flex items-center justify-center space-x-1.5 text-amber-800 text-[10px] font-bold">
                          <Crown className="w-3.5 h-3.5 fill-amber-300" />
                          <span>개별 상세 인연 해설 & 피방처방 잠겨있음</span>
                        </div>
                        <p className="text-[9.5px] text-[#8C7B6E] leading-relaxed">
                          두 분의 4대 영역 종합 감정 해설과 사주/자미/성향/별자리 1:1 정밀 텍스트 처방전은 <strong>'모임 전체 인원의 오행 상생 궁합 총괄 보고서'</strong> 또는 <strong>'비밀 인연 등급 해독권'</strong> 구매 후 즉시 무제한 개방됩니다.
                        </p>
                        <button
                          onClick={() => {
                            const paywallBtn = document.getElementById("checkout-premium-btn") || document.querySelector("button[id*='paywall']");
                            if (paywallBtn) {
                              paywallBtn.scrollIntoView({ behavior: "smooth" });
                            } else {
                              window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                            }
                          }}
                          className="px-3 py-1 bg-gradient-to-r from-amber-700 to-amber-800 text-white rounded text-[9px] font-bold cursor-pointer inline-flex items-center gap-1 hover:opacity-90 shadow-2xs"
                        >
                          👑 프리미엄 기능 해금하기 (요금제 보기)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            {nodes.filter((n) => n.id !== selectedNodeId).length > 0 &&  
             lines.length === 0 && (
              <div className="text-center py-6 text-xs text-[#8C7B6E] font-medium">
                선택한 필터 기준에 부합하는 인연이 없습니다. 다른 필터를 선택해보세요!
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 pt-2 border-t border-[#E8E0D0] w-full">
          <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1.5 text-[9px] text-[#8C7B6E] font-bold">
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-[#f97316] rounded-full inline-block" />
              <span>수려한 케미 (90+)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-[#10b981] rounded-full inline-block" />
              <span>상생 조화 (70-89)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-[#eab308] rounded-full inline-block" />
              <span>무난 평온 (50-69)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-[#fb923c] rounded-full inline-block" />
              <span>티격태격 (30-49)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-[#ef4444] rounded-full inline-block" />
              <span>주의와 양보 (0-29)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
