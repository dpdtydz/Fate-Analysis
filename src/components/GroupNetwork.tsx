import React, { useMemo, useState, useRef, useEffect } from "react";
import { Member, PairAnalysis } from "../types";
import { ArrowRightLeft, Filter, Smile, AlertTriangle, Lock, ChevronDown, Zap } from "lucide-react";
import ZodiacAvatar, { getMemberZodiacSrc } from "./ZodiacAvatar";

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

// 오행 데이터 전용 색 (design.md §2 — SVG 리터럴 허용 5색)
const ELEMENT_HEX: Record<string, string> = {
  "목": "#3E7C4F",
  "화": "#C24234",
  "토": "#B07C3F",
  "금": "#7D848E",
  "수": "#35597A",
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
  const [relationFilter, setRelationFilter] = useState<"all" | "good" | "bad">("all");
  // Default to SVG for crisp vector rendering, animations, and high-fidelity character illustrations
  const [renderEngine, setRenderEngine] = useState<"svg" | "canvas">("svg");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 점수는 먹 농담(진하게=높음)과 인주(90+), 조화(70+)로 표현
  const getScoreColor = (score: number) => {
    if (score >= 90) return "#B3382C"; // 인주 (최고 구간 90+)
    if (score >= 75) return "#2D6A4F"; // 청록 (우수 상생 75~89)
    if (score >= 50) return "#4A4E69"; // 온화 (보통 50~74)
    return "#8D99AE";                  // 주의 (50 미만)
  };

  const getScoreOpacity = (score: number) => {
    if (score >= 90) return 1;
    if (score >= 70) return 0.9;
    if (score >= 50) return 0.7;
    return 0.5;
  };

  // --- DYNAMIC SIZING FOR OPTIMAL AVATAR VISIBILITY ---
  const isLargeGroup = members.length > 8;
  const svgSize = isLargeGroup ? 420 : 370;
  const center = svgSize / 2;
  const radius = isLargeGroup ? 140 : 118;
  const nodeRadius = isLargeGroup ? 21 : 25; // Large enough for face visibility

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
        imageSrc: getMemberZodiacSrc(m),
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
          opacity: getScoreOpacity(avgScore),
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
          opacity: getScoreOpacity(p.score),
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
      opacity: number;
      nodeA: typeof nodes[0];
      nodeB: typeof nodes[0];
    }>;
  }, [nodes, pairs, selectedNodeId, members, relationFilter]);

  const selectedMember = useMemo(() => {
    return members.find((m) => m.id === selectedNodeId) || null;
  }, [members, selectedNodeId]);

  // Canvas 2D Accelerated Renderer (60fps on mobile for large groups)
  useEffect(() => {
    if (renderEngine !== "canvas" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2;
    canvas.width = svgSize * dpr;
    canvas.height = svgSize * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, svgSize, svgSize);

    // 1. Guide circle
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#E7E7E2";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Lines & Score Badges
    lines.forEach((line) => {
      const isHighScore = line.avgScore >= 90;
      const isGoodScore = line.avgScore >= 75;

      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.strokeStyle = line.color;
      ctx.lineWidth = isHighScore ? 3.5 : (selectedNodeId ? 2 : 2.5);
      ctx.globalAlpha = line.opacity;
      ctx.stroke();

      // Score badge on line midpoint
      const mx = (line.x1 + line.x2) / 2;
      const my = (line.y1 + line.y2) / 2;
      const badgeW = isHighScore ? 34 : 28;
      const badgeH = 14;

      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = isHighScore ? "#B3382C" : (isGoodScore ? "#2D6A4F" : "#1C1D21");
      ctx.beginPath();
      ctx.roundRect(mx - badgeW / 2, my - badgeH / 2, badgeW, badgeH, badgeH / 2);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = '700 8px monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${Math.round(line.avgScore)}점`, mx, my + 0.5);
      ctx.restore();
    });

    ctx.globalAlpha = 1;

    // 3. Nodes
    nodes.forEach((node) => {
      const isSelected = selectedNodeId === node.id;
      const elemHex = ELEMENT_HEX[node.element] || "#7D848E";

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = "#B3382C";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      ctx.save();
      // Outer border circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.strokeStyle = isSelected ? "#B3382C" : elemHex;
      ctx.lineWidth = isSelected ? 3 : 2.5;
      ctx.stroke();

      // Inner image clipping
      if (node.imageSrc) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius - 1.5, 0, Math.PI * 2);
        ctx.clip();
        
        // Cache or render image
        const img = new Image();
        img.src = node.imageSrc;
        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(
            img,
            node.x - nodeRadius * 1.15,
            node.y - nodeRadius * 1.15,
            nodeRadius * 2.3,
            nodeRadius * 2.3
          );
        } else {
          ctx.font = `${isLargeGroup ? "14px" : "17px"} "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.emoji || "👤", node.x, node.y + 1);
        }
        ctx.restore();
      } else {
        ctx.font = `${isLargeGroup ? "14px" : "17px"} "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.emoji || "👤", node.x, node.y + 1);
      }
      ctx.restore();

      // Element badge
      ctx.fillStyle = elemHex;
      const bW = 18;
      const bH = 10;
      ctx.beginPath();
      ctx.roundRect(node.x - bW / 2, node.y + nodeRadius - 2, bW, bH, 3);
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.font = '700 7px "Pretendard", sans-serif';
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.element, node.x, node.y + nodeRadius + 3);

      // Label below
      ctx.font = '700 9px "Pretendard", sans-serif';
      ctx.fillStyle = isSelected ? "#B3382C" : "#1C1D21";
      ctx.fillText(node.nickname, node.x, node.y + nodeRadius + 15);
    });
  }, [renderEngine, nodes, lines, selectedNodeId, svgSize, center, radius, nodeRadius, isLargeGroup]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = svgSize / rect.width;
    const clickX = (e.clientX - rect.left) * scale;
    const clickY = (e.clientY - rect.top) * scale;

    const clicked = nodes.find(
      (n) => Math.hypot(clickX - n.x, clickY - n.y) <= nodeRadius + 10
    );
    if (clicked) {
      setSelectedNodeId(selectedNodeId === clicked.id ? null : clicked.id);
      setRelationFilter("all");
    } else {
      setSelectedNodeId(null);
    }
  };

  return (
    <div className="flex flex-col bg-surface p-5 border border-line rounded-xl relative overflow-hidden space-y-4">
      {/* Network Header */}
      <div className="text-center space-y-1.5">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-ink-faint text-[11px]">
            {renderEngine === "canvas" ? "⚡ Canvas 60fps 가속" : "📐 SVG 벡터"}
          </span>
          <button
            type="button"
            onClick={() => setRenderEngine(renderEngine === "canvas" ? "svg" : "canvas")}
            className="px-2 py-0.5 rounded-lg bg-sunken hover:bg-line text-ink-soft text-[11px] font-medium transition-colors cursor-pointer border border-line flex items-center gap-1"
          >
            <Zap className="w-2.5 h-2.5" />
            <span>{renderEngine === "canvas" ? "SVG로 전환" : "Canvas 가속"}</span>
          </button>
        </div>
        <h4 className="text-[15px] font-semibold text-ink">
          {selectedMember ? `${selectedMember.nickname}의 인연 관계도` : "모임 궁합 지도"}
        </h4>
        <p className="text-xs text-ink-soft max-w-sm mx-auto leading-relaxed">
          {selectedMember
            ? `${selectedMember.nickname}님을 중심으로 각 멤버와 주고받는 양방향 점수를 보여드려요.`
            : "모임에서 조화가 높은 대표 4쌍을 이어서 보여드려요. 멤버를 누르면 개인 기준으로 볼 수 있어요."}
        </p>
      </div>

      {/* FILTER BUTTONS: Solves clutter by letting users filter high/low connections */}
      {selectedNodeId && (
        <div className="flex items-center justify-center gap-1.5 text-xs flex-wrap">
          <span className="text-ink-faint font-medium flex items-center gap-0.5 mr-1">
            <Filter className="w-3 h-3" />
            <span>필터</span>
          </span>
          <button
            onClick={() => setRelationFilter("all")}
            className={`px-2.5 py-1 rounded-xl font-medium transition-colors cursor-pointer ${
              relationFilter === "all"
                ? "bg-seal text-white"
                : "bg-sunken text-ink-soft hover:bg-line"
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setRelationFilter("good")}
            className={`px-2.5 py-1 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              relationFilter === "good"
                ? "bg-seal text-white"
                : "bg-sunken text-ink-soft hover:bg-line"
            }`}
          >
            <Smile className="w-3 h-3" />
            <span>70점 이상</span>
          </button>
          <button
            onClick={() => setRelationFilter("bad")}
            className={`px-2.5 py-1 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              relationFilter === "bad"
                ? "bg-seal text-white"
                : "bg-sunken text-ink-soft hover:bg-line"
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>50점 미만</span>
          </button>
        </div>
      )}

      {/* Diagram Container: SVG or Canvas */}
      <div
        className="relative w-full mx-auto bg-sunken rounded-xl p-2 flex items-center justify-center overflow-visible"
        style={{ maxWidth: `${svgSize}px`, aspectRatio: "1/1" }}
      >
        {renderEngine === "canvas" ? (
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-pointer select-none rounded-xl"
            style={{ width: "100%", height: "100%", touchAction: "none" }}
          />
        ) : (
        <svg
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="w-full h-full text-xs overflow-visible select-none"
        >
          <defs>
            {/* Soft Shadow Filter for Nodes */}
            <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.12" />
            </filter>
            {/* Glow Filter for High Synergy Lines */}
            <filter id="synergyGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#B3382C" floodOpacity="0.4" />
            </filter>
            {/* Dynamic Clip Paths for Circular Avatars */}
            {nodes.map((node) => (
              <clipPath key={`clip-${node.id}`} id={`clip-${node.id}`}>
                <circle cx={node.x} cy={node.y} r={nodeRadius - 2} />
              </clipPath>
            ))}
          </defs>

          {/* 1. Quiet guide circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#E7E7E2"
            strokeWidth="1.2"
            strokeDasharray="4,4"
          />

          {/* 2. Relationship lines — 고품질 궁합 선 및 중앙 점수 뱃지 */}
          {lines.map((line, idx) => {
            const isHighScore = line.avgScore >= 90;
            const isGoodScore = line.avgScore >= 75;
            const mx = (line.x1 + line.x2) / 2;
            const my = (line.y1 + line.y2) / 2;
            const badgeW = isHighScore ? 36 : 30;
            const badgeH = 15;

            return (
              <g key={`line-${idx}`} className="transition-all duration-300">
                {/* Connection Line */}
                <line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={line.color}
                  strokeWidth={isHighScore ? "3.5" : selectedNodeId ? "2" : "2.5"}
                  strokeLinecap="round"
                  strokeOpacity={line.opacity}
                  filter={isHighScore ? "url(#synergyGlow)" : undefined}
                  className="transition-all duration-300"
                />

                {/* Score Badge floating on the line midpoint */}
                <g transform={`translate(${mx}, ${my})`} className="cursor-pointer">
                  <rect
                    x={-badgeW / 2}
                    y={-badgeH / 2}
                    width={badgeW}
                    height={badgeH}
                    rx={badgeH / 2}
                    fill={isHighScore ? "#B3382C" : isGoodScore ? "#2D6A4F" : "#1C1D21"}
                    stroke="#FFFFFF"
                    strokeWidth="1"
                    opacity={0.95}
                    filter="url(#nodeShadow)"
                  />
                  <text
                    textAnchor="middle"
                    y={3.5}
                    fill="#FFFFFF"
                    fontSize="8px"
                    fontWeight="700"
                    fontFamily="monospace"
                    className="select-none pointer-events-none"
                  >
                    {Math.round(line.avgScore)}점
                  </text>
                </g>
              </g>
            );
          })}

          {/* 3. DRAW ROUND NODES & DETAILED DYNAMIC LABEL BADGES */}
          {nodes.map((node) => {
            // Text placement calculation (pointing outward from the circle center)
            const textOffset = isLargeGroup ? 24 : 28;
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

            const elementHex = ELEMENT_HEX[node.element] || "#7D848E";

            return (
              <g
                key={`node-${node.id}`}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedNodeId(selectedNodeId === node.id ? null : node.id);
                  setRelationFilter("all"); // Reset filter when switching nodes
                }}
              >
                {/* Selected Node Pulsing Halo */}
                {isSelected && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={nodeRadius + 6}
                    fill="none"
                    stroke="#B3382C"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                    className="animate-spin-slow"
                  />
                )}

                {/* Main Node Background & Shadow */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? nodeRadius + 2 : nodeRadius}
                  fill="#FFFFFF"
                  stroke={isSelected ? "#B3382C" : elementHex}
                  strokeWidth={isSelected ? "3" : "2.5"}
                  filter="url(#nodeShadow)"
                  className="transition-all duration-300"
                  opacity={isConnected ? 1 : 0.3}
                />

                {/* Character Avatar Image (Clipped inside Circle) */}
                {node.imageSrc ? (
                  <image
                    href={node.imageSrc}
                    clipPath={`url(#clip-${node.id})`}
                    x={node.x - nodeRadius * 1.15}
                    y={node.y - nodeRadius * 1.15}
                    width={nodeRadius * 2.3}
                    height={nodeRadius * 2.3}
                    preserveAspectRatio="xMidYMid slice"
                    className="transition-all duration-300 select-none pointer-events-none"
                    opacity={isConnected ? 1 : 0.3}
                  />
                ) : (
                  <text
                    x={node.x}
                    y={node.y + 5}
                    textAnchor="middle"
                    fontSize={isLargeGroup ? "16px" : "19px"}
                    className="transition-all duration-300 select-none pointer-events-none"
                    opacity={isConnected ? 1 : 0.3}
                  >
                    {node.emoji || "👤"}
                  </text>
                )}

                {/* Element Tag bubble directly below circle */}
                <g transform={`translate(${node.x}, ${node.y + (isSelected ? nodeRadius + 3 : nodeRadius + 1)})`}>
                  <rect
                    x="-10"
                    y="-5"
                    width="20"
                    height="10"
                    rx="3"
                    fill={elementHex}
                    stroke="#FFFFFF"
                    strokeWidth="0.8"
                    opacity={isConnected ? 1 : 0.3}
                  />
                  <text
                    textAnchor="middle"
                    y="3"
                    fill="#FFFFFF"
                    fontSize="7px"
                    fontWeight="700"
                    className="select-none pointer-events-none"
                  >
                    {node.element}
                  </text>
                </g>

                {/* NICKNAME & SCORE CARD COMBINED */}
                <foreignObject
                  x={labelX - 38}
                  y={labelY - (asymmetricInfo ? 18 : 10)}
                  width="76"
                  height={asymmetricInfo ? "36" : "20"}
                  className="overflow-visible pointer-events-none select-none transition-all duration-300"
                  opacity={isConnected ? 1 : 0.25}
                >
                  <div className="flex flex-col items-center justify-center space-y-0.5">
                    {/* Nickname plate */}
                    <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-tight shadow-sm truncate text-center w-full max-w-[68px] border ${
                      isSelected ? "bg-seal text-white border-seal" : "bg-surface text-ink border-line"
                    }`}>
                      {node.nickname}
                    </div>

                    {/* Bi-directional score badge below nickname */}
                    {asymmetricInfo && isConnected && (
                      <div className="flex items-center justify-center space-x-1 bg-ink text-paper px-1.5 py-0.5 rounded-sm text-[7px] font-mono shadow-sm">
                        <span>{asymmetricInfo.score1to2}점</span>
                        <span className="opacity-60">⇄</span>
                        <span>{asymmetricInfo.score2to1}점</span>
                      </div>
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
        )}
      </div>

      {/* Selected Member Details Panel */}
      {selectedMember ? (
        <div className="bg-sunken p-4 rounded-xl space-y-3 text-left transition-all duration-300">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-ink flex items-center space-x-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-ink-faint" />
              <span>{selectedMember.nickname} 기준 양방향 궁합</span>
            </span>
            <button
              onClick={() => {
                setSelectedNodeId(null);
                setRelationFilter("all");
              }}
              className="text-xs text-ink-soft hover:text-ink font-medium bg-surface hover:bg-line px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
            >
              전체 보기
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

                let relationalPhrase = "4대 영역(사주, 자미두수, 별자리, MBTI)이 고르게 균형을 이루는 관계예요.";
                if (score1to2 >= 88 && score2to1 >= 88) {
                  relationalPhrase = "4대 영역 모두에서 높은 화합을 보여주는 동반자 궁합이에요.";
                } else if (Math.abs(score1to2 - score2to1) >= 15) {
                  if (score1to2 > score2to1) {
                    relationalPhrase = `${selectedMember.nickname}님이 상대에게 먼저 맞춰주고 이끌어주는 배려형 구도예요.`;
                  } else {
                    relationalPhrase = `${other.nickname}님이 먼저 맞춰주고 받쳐주는 조력자 구도예요.`;
                  }
                } else if (score1to2 <= 39 && score2to1 <= 39) {
                  relationalPhrase = "성질 차이가 커서 세심한 대화와 서로의 양보가 필요한 조합이에요.";
                } else if (score1to2 >= 70 && score2to1 <= 50) {
                  relationalPhrase = "나의 호감도에 비해 상대방은 아직 속도를 늦추고 있는 구도예요.";
                }

                const isM1First = basePair
                  ? (selectedMember.id.trim().toLowerCase() === basePair.member_id_1.trim().toLowerCase() ||
                     selectedMember.nickname.trim().toLowerCase().replace(/님$/, "") === basePair.member_id_1.trim().toLowerCase().replace(/님$/, ""))
                  : true;

                return (
                  <div
                    key={`asym-list-${other.id}`}
                    className="p-3.5 rounded-xl flex flex-col space-y-2.5 bg-surface transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2">
                      <div className="flex items-center space-x-1.5 font-semibold text-ink text-xs">
                        <ZodiacAvatar member={other.rawMember} size={18} fallbackEmoji={other.emoji} />
                        <span>{other.nickname}님과의 인연</span>
                        <span className="text-xs px-1.5 py-0.5 bg-sunken text-ink-soft rounded-md font-medium">
                          {other.element} 기운 · {other.rawMember.mbti || "MBTI 없음"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center space-x-1 text-xs">
                          <span className="text-ink-faint">주는 기운</span>
                          <span className="font-mono font-semibold text-ink bg-sunken px-2 py-0.5 rounded-md">{score1to2}점</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs">
                          <span className="text-ink-faint">받는 기운</span>
                          <span className="font-mono font-semibold text-ink bg-sunken px-2 py-0.5 rounded-md">{score2to1}점</span>
                        </div>
                      </div>
                    </div>

                    {isPremium ? (
                      <>
                        {basePair && (
                          <div className="text-xs text-ink-soft leading-relaxed bg-sunken p-2.5 rounded-xl">
                            <div className="font-semibold text-ink mb-1 text-xs">
                              4대 영역 종합 인연 풀이 ({basePair.label})
                            </div>
                            <p className="leading-relaxed">{basePair.description}</p>
                          </div>
                        )}

                        <p className="text-xs text-ink-soft leading-relaxed">
                          {relationalPhrase}
                        </p>

                        {basePair && basePair.saju && basePair.ziwei && basePair.mbti && basePair.zodiac && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              {/* Saju */}
                              <div className="bg-sunken p-2.5 rounded-xl text-xs space-y-1">
                                <div className="font-semibold text-ink flex justify-between">
                                  <span>사주 궁합</span>
                                  <span className="font-mono">
                                    {Math.round((basePair.saju.score_1_to_2 + basePair.saju.score_2_to_1) / 2)}점
                                  </span>
                                </div>
                                <div className="text-xs text-ink-faint flex justify-between">
                                  <span>주는 기운</span>
                                  <span className="font-mono text-ink-soft">{isM1First ? basePair.saju.score_1_to_2 : basePair.saju.score_2_to_1}점</span>
                                </div>
                                <div className="text-xs text-ink-faint flex justify-between">
                                  <span>받는 기운</span>
                                  <span className="font-mono text-ink-soft">{isM1First ? basePair.saju.score_2_to_1 : basePair.saju.score_1_to_2}점</span>
                                </div>
                              </div>
                              {/* Ziwei */}
                              <div className="bg-sunken p-2.5 rounded-xl text-xs space-y-1">
                                <div className="font-semibold text-ink flex justify-between">
                                  <span>자미두수</span>
                                  <span className="font-mono">
                                    {Math.round((basePair.ziwei.score_1_to_2 + basePair.ziwei.score_2_to_1) / 2)}점
                                  </span>
                                </div>
                                <div className="text-xs text-ink-faint flex justify-between">
                                  <span>주는 기운</span>
                                  <span className="font-mono text-ink-soft">{isM1First ? basePair.ziwei.score_1_to_2 : basePair.ziwei.score_2_to_1}점</span>
                                </div>
                                <div className="text-xs text-ink-faint flex justify-between">
                                  <span>받는 기운</span>
                                  <span className="font-mono text-ink-soft">{isM1First ? basePair.ziwei.score_2_to_1 : basePair.ziwei.score_1_to_2}점</span>
                                </div>
                              </div>
                              {/* MBTI */}
                              {isMbtiRegistered(selectedMember) && isMbtiRegistered(other.rawMember) ? (
                                <div className="bg-sunken p-2.5 rounded-xl text-xs space-y-1">
                                  <div className="font-semibold text-ink flex justify-between">
                                    <span>MBTI 성향</span>
                                    <span className="font-mono">
                                      {Math.round((basePair.mbti.score_1_to_2 + basePair.mbti.score_2_to_1) / 2)}점
                                    </span>
                                  </div>
                                  <div className="text-xs text-ink-faint flex justify-between">
                                    <span>주는 기운</span>
                                    <span className="font-mono text-ink-soft">{isM1First ? basePair.mbti.score_1_to_2 : basePair.mbti.score_2_to_1}점</span>
                                  </div>
                                  <div className="text-xs text-ink-faint flex justify-between">
                                    <span>받는 기운</span>
                                    <span className="font-mono text-ink-soft">{isM1First ? basePair.mbti.score_2_to_1 : basePair.mbti.score_1_to_2}점</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-sunken p-2.5 rounded-xl text-xs space-y-1">
                                  <div className="font-semibold text-ink-soft flex justify-between">
                                    <span>MBTI 성향</span>
                                    <span className="text-ink-faint font-normal">미등록</span>
                                  </div>
                                  <div className="text-xs text-ink-faint leading-tight">
                                    {!isMbtiRegistered(selectedMember) && !isMbtiRegistered(other.rawMember)
                                      ? "두 사람 모두 MBTI 미등록"
                                      : !isMbtiRegistered(selectedMember)
                                      ? `${selectedMember.nickname}님 MBTI 미등록`
                                      : `${other.nickname}님 MBTI 미등록`}
                                  </div>
                                </div>
                              )}
                              {/* Zodiac */}
                              <div className="bg-sunken p-2.5 rounded-xl text-xs space-y-1">
                                <div className="font-semibold text-ink flex justify-between">
                                  <span>별자리 조화</span>
                                  <span className="font-mono">
                                    {Math.round((basePair.zodiac.score_1_to_2 + basePair.zodiac.score_2_to_1) / 2)}점
                                  </span>
                                </div>
                                <div className="text-xs text-ink-faint flex justify-between">
                                  <span>주는 기운</span>
                                  <span className="font-mono text-ink-soft">{isM1First ? basePair.zodiac.score_1_to_2 : basePair.zodiac.score_2_to_1}점</span>
                                </div>
                                <div className="text-xs text-ink-faint flex justify-between">
                                  <span>받는 기운</span>
                                  <span className="font-mono text-ink-soft">{isM1First ? basePair.zodiac.score_2_to_1 : basePair.zodiac.score_1_to_2}점</span>
                                </div>
                              </div>
                            </div>

                            {/* 4-Area Detailed Accordion/Disclosure */}
                            <details className="mt-1 group bg-sunken rounded-xl p-2.5">
                              <summary className="text-xs font-semibold text-ink-soft hover:text-ink cursor-pointer list-none flex items-center justify-between select-none">
                                <span className="flex items-center gap-1">
                                  <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                                  <span>4대 영역별 상세 해설</span>
                                </span>
                              </summary>
                              <div className="grid grid-cols-1 gap-2.5 mt-2 pt-2">
                                {/* Saju desc */}
                                <div className="space-y-0.5 text-left">
                                  <div className="font-semibold text-xs text-ink flex items-center gap-1">
                                    <span>사주 궁합</span>
                                    <span className="font-mono text-ink-soft">{Math.round((basePair.saju.score_1_to_2 + basePair.saju.score_2_to_1) / 2)}점</span>
                                  </div>
                                  <p className="text-ink-soft text-xs leading-relaxed whitespace-pre-wrap">{basePair.saju.description}</p>
                                </div>
                                {/* Ziwei desc */}
                                <div className="space-y-0.5 text-left">
                                  <div className="font-semibold text-xs text-ink flex items-center gap-1">
                                    <span>자미두수 궁합</span>
                                    <span className="font-mono text-ink-soft">{Math.round((basePair.ziwei.score_1_to_2 + basePair.ziwei.score_2_to_1) / 2)}점</span>
                                  </div>
                                  <p className="text-ink-soft text-xs leading-relaxed whitespace-pre-wrap">{basePair.ziwei.description}</p>
                                </div>
                                {/* Mbti desc */}
                                <div className="space-y-0.5 text-left">
                                  <div className="font-semibold text-xs text-ink flex items-center gap-1">
                                    <span>MBTI 성향 궁합</span>
                                    {isMbtiRegistered(selectedMember) && isMbtiRegistered(other.rawMember) ? (
                                      <span className="font-mono text-ink-soft">{Math.round((basePair.mbti.score_1_to_2 + basePair.mbti.score_2_to_1) / 2)}점</span>
                                    ) : (
                                      <span className="text-ink-faint font-normal text-xs">미등록</span>
                                    )}
                                  </div>
                                  {isMbtiRegistered(selectedMember) && isMbtiRegistered(other.rawMember) ? (
                                    <p className="text-ink-soft text-xs leading-relaxed whitespace-pre-wrap">{basePair.mbti.description}</p>
                                  ) : (
                                    <p className="text-ink-faint text-xs leading-relaxed whitespace-pre-wrap">
                                      {!isMbtiRegistered(selectedMember) && !isMbtiRegistered(other.rawMember)
                                        ? "두 사람 모두 MBTI를 등록하지 않아 성향 궁합을 볼 수 없어요."
                                        : !isMbtiRegistered(selectedMember)
                                        ? `${selectedMember.nickname}님이 MBTI를 등록하지 않아 성향 궁합을 볼 수 없어요.`
                                        : `${other.nickname}님이 MBTI를 등록하지 않아 성향 궁합을 볼 수 없어요.`}
                                    </p>
                                  )}
                                </div>
                                {/* Zodiac desc */}
                                <div className="space-y-0.5 text-left">
                                  <div className="font-semibold text-xs text-ink flex items-center gap-1">
                                    <span>별자리 조화</span>
                                    <span className="font-mono text-ink-soft">{Math.round((basePair.zodiac.score_1_to_2 + basePair.zodiac.score_2_to_1) / 2)}점</span>
                                  </div>
                                  <p className="text-ink-soft text-xs leading-relaxed whitespace-pre-wrap">{basePair.zodiac.description}</p>
                                </div>
                              </div>
                            </details>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-sunken p-4 rounded-xl text-center space-y-2.5 mt-1">
                        <div className="flex items-center justify-center space-x-1.5 text-ink text-xs font-semibold">
                          <Lock className="w-3.5 h-3.5 text-ink-faint" />
                          <span>1:1 상세 해설이 잠겨 있어요</span>
                        </div>
                        <p className="text-xs text-ink-soft leading-relaxed">
                          두 분의 4대 영역 종합 해설과 사주·자미두수·MBTI·별자리 1:1 처방은 모임 전체 궁합 보고서 또는 비밀 인연 등급 해독권을 등록하면 볼 수 있어요.
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
                          className="px-4 py-2 bg-surface hover:bg-line text-ink rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                        >
                          해금 안내 보기
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            {nodes.filter((n) => n.id !== selectedNodeId).length > 0 &&
             lines.length === 0 && (
              <div className="text-center py-6 text-xs text-ink-faint">
                선택한 필터에 해당하는 인연이 없어요. 다른 필터를 선택해 보세요.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-2 pt-3 border-t border-line w-full">
          <div className="flex flex-wrap justify-center items-center gap-x-3.5 gap-y-1.5 text-[11px] text-ink-soft">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style={{ backgroundColor: "#B3382C" }} />
              <span className="font-semibold text-seal">90점 이상 (환상 시너지)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style={{ backgroundColor: "#2D6A4F" }} />
              <span className="font-medium text-ink">75–89점 (상생 케미)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block opacity-75" style={{ backgroundColor: "#4A4E69" }} />
              <span>50–74점 (조화)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block opacity-50" style={{ backgroundColor: "#8D99AE" }} />
              <span>50점 미만 (보완 필요)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
