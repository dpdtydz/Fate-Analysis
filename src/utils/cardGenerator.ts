import { Member, PairAnalysis } from "../types";
import { getMemberNickname, getMemberElement } from "./memberHelper";
import { getMemberZodiacSrc } from "../components/ZodiacAvatar";
import { calculateMemberSals, calculateGroupAwards } from "./shinsalCalculator";

interface GenerateChemistryCardParams {
  roomTitle: string;
  groupScore: number;
  members: Member[];
  m1: Member;
  m2: Member;
  pairScore?: number;
  pairLabel?: string;
  pairDesc?: string;
}

// Helper to safely draw rounded rectangle on any canvas context
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

// Pre-load image with promise
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Generates a dedicated 1080x1920 Instagram Story PNG card using Pure Canvas 2D.
 * Completely immune to html2canvas DOM parsing errors or blank SVGs.
 */
export async function generateDedicatedChemistryCard({
  roomTitle,
  groupScore,
  members,
  m1,
  m2,
  pairScore = 96,
  pairLabel,
  pairDesc,
}: GenerateChemistryCardParams): Promise<{ dataUrl: string; blob: Blob }> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D canvas context");

  const elem1 = getMemberElement(m1) || "화";
  const elem2 = getMemberElement(m2) || "토";
  const sals1 = calculateMemberSals(m1);
  const sals2 = calculateMemberSals(m2);

  const hash = (m1.id + m2.id).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

  // 6 Categories calculation (Realistic, calibrated distribution)
  const isTalkGenerating = (elem1 === "목" && elem2 === "화") || (elem1 === "화" && elem2 === "목") || elem1 === "화" || elem2 === "화";
  const tikitakaScore = Math.min(94, Math.max(48, Math.round(pairScore + (isTalkGenerating ? 4 : -5) + ((hash % 7) - 3))));

  const hasActiveSal = sals1.yeokmaCount + sals2.yeokmaCount + sals1.dohwaCount + sals2.dohwaCount > 0;
  const alcoholScore = Math.min(94, Math.max(46, Math.round(pairScore * 0.96 + (hasActiveSal ? 5 : -4) + (((hash * 3) % 7) - 3))));

  const hasTravelSal = sals1.sals.includes("역마살") || sals2.sals.includes("역마살");
  const travelScore = Math.min(93, Math.max(45, Math.round(pairScore * 0.93 + (hasTravelSal ? 4 : -5) + (((hash * 7) % 7) - 3))));

  const hasEarthOrWater = elem1 === "토" || elem2 === "토" || elem1 === "수" || elem2 === "수";
  const healingScore = Math.min(95, Math.max(48, Math.round(pairScore * 0.95 + (hasEarthOrWater ? 4 : -4) + (((hash * 11) % 7) - 3))));

  const hasMetalOrGold = elem1 === "금" || elem2 === "금" || elem1 === "토" || elem2 === "토";
  const businessScore = Math.min(94, Math.max(44, Math.round(pairScore * 0.94 + (hasMetalOrGold ? 4 : -5) + (((hash * 13) % 7) - 3))));

  const safetyScore = Math.min(88, Math.max(42, Math.round(pairScore * 0.82 - ((hash * 17) % 9))));

  const categories = [
    {
      icon: "💬",
      title: "대화 티키타카",
      score: tikitakaScore,
      color: "#F43F5E",
      desc: tikitakaScore >= 86
        ? "생각의 속도가 비슷해 말 한마디로도 통하는 사이"
        : tikitakaScore >= 72
        ? "말이 끊이지 않고 자연스럽게 이어지는 대화 흐름"
        : tikitakaScore >= 58
        ? "필요한 순간에 명쾌하게 소통하는 담백한 사이"
        : "서로의 대화 템포와 표현 방식을 맞춰가는 중인 사이",
    },
    {
      icon: "⚡",
      title: "모임 텐션 & 분위기",
      score: alcoholScore,
      color: "#F97316",
      desc: alcoholScore >= 86
        ? "함께 있는 것만으로도 모임 분위기를 끌어올리는 시너지"
        : alcoholScore >= 72
        ? "서로의 페이스를 편안하게 존중하며 즐기는 호흡"
        : alcoholScore >= 58
        ? "과하지 않게 은은한 즐거움을 나누는 차분한 무드"
        : "조용하고 정적인 환경에서 더 편안함을 느끼는 조합",
    },
    {
      icon: "✈️",
      title: "여행 & 일상 호흡",
      score: travelScore,
      color: "#06B6D4",
      desc: travelScore >= 85
        ? "돌발 변수가 생겨도 함께 웃으며 유쾌하게 넘기는 메이트"
        : travelScore >= 70
        ? "취향과 동선을 자연스럽게 배려하며 맞춰가는 편안함"
        : travelScore >= 56
        ? "사전에 계획과 역할을 조율하면 깔끔하게 어울릴 조합"
        : "각자의 개인 시간과 독립적인 휴식을 보장해야 할 동행",
    },
    {
      icon: "🌿",
      title: "감정 공감 & 멘탈 케어",
      score: healingScore,
      color: "#10B981",
      desc: healingScore >= 86
        ? "속 깊은 이야기까지 안심하고 털어놓을 수 있는 안식처"
        : healingScore >= 72
        ? "진심 어린 경청과 공감으로 서로에게 힘이 되어주는 관계"
        : healingScore >= 58
        ? "서로의 감정선을 존중하며 묵묵히 곁을 지켜주는 사이"
        : "감정적인 의존보다는 적절한 거리감 유지가 편한 사이",
    },
    {
      icon: "💼",
      title: "현실 시너지 & 협업",
      score: businessScore,
      color: "#EAB308",
      desc: businessScore >= 85
        ? "기획과 실행의 균형이 뛰어나 확실한 결실을 맺는 파트너"
        : businessScore >= 70
        ? "역할 분담이 명확할 때 최고의 성과를 내는 콤비"
        : businessScore >= 56
        ? "서로의 전문 영역을 인정하고 존중할 때 시너지가 나는 사이"
        : "금전이나 공동 과제 시 명확한 룰과 문서화가 필요한 관계",
    },
    {
      icon: "💡",
      title: "관계 팁 & 배려 포인트",
      score: safetyScore,
      color: "#8B5CF6",
      desc: (elem1 === "화" && elem2 === "수") || (elem1 === "수" && elem2 === "화")
        ? "피곤할 땐 즉답을 피하고 한 템포 쉬어가는 대화가 좋아요"
        : (elem1 === "금" && elem2 === "목") || (elem1 === "목" && elem2 === "금")
        ? "직설적인 피드백보다는 따뜻한 인정 한마디가 최고의 처방"
        : safetyScore < 60
        ? "서로의 호의가 간섭으로 느껴지지 않도록 경계를 존중하기"
        : "상대방만의 고유한 템포와 개인 시간을 편안하게 존중해 주기",
    },
  ];

  // Load avatar images in parallel
  const src1 = getMemberZodiacSrc(m1) || "/zodiac/zodiac_tiger_item_sunglasses.png";
  const src2 = getMemberZodiacSrc(m2) || "/zodiac/zodiac_tiger_item_sunglasses.png";
  const [avatar1, avatar2] = await Promise.all([loadImage(src1), loadImage(src2)]);

  // 1. Draw Deep Cosmic Background
  const bgGrad = ctx.createRadialGradient(540, 200, 100, 540, 960, 1100);
  bgGrad.addColorStop(0, "#1F152B");
  bgGrad.addColorStop(0.5, "#0D0F1A");
  bgGrad.addColorStop(1, "#05060A");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1920);

  // Decorative Orbit Rings
  ctx.save();
  ctx.strokeStyle = "rgba(244, 63, 94, 0.15)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.arc(540, 420, 260, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.setLineDash([4, 8]);
  ctx.beginPath();
  ctx.arc(540, 420, 360, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 2. Top Story Segments Indicator
  const segW = (1080 - 120 - 5 * 10) / 6;
  for (let i = 0; i < 6; i++) {
    const sx = 60 + i * (segW + 10);
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    drawRoundRect(ctx, sx, 45, segW, 6, 3);
    ctx.fill();
  }

  // 3. Top Header Branding
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`●  ${roomTitle} · ${members.length}인`, 60, 100);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(244, 63, 94, 0.9)";
  ctx.font = "800 24px monospace";
  ctx.fillText("INYEON CHEMISTRY", 1020, 100);

  // 4. Headline & Title Badge
  ctx.fillStyle = "rgba(244, 63, 94, 0.18)";
  ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 60, 135, 340, 48, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FDA4AF";
  ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("✨ 너랑 나의 사주 팩폭 케미", 230, 168);

  // Big Names Headline
  ctx.textAlign = "left";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 46px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  const nick1 = getMemberNickname(m1);
  const nick2 = getMemberNickname(m2);
  ctx.fillText(`${nick1}  ×  ${nick2}`, 60, 245);

  ctx.textAlign = "right";
  ctx.fillStyle = "#F43F5E";
  ctx.font = "900 52px -apple-system, BlinkMacSystemFont, 'Pretendard', monospace";
  ctx.fillText(`${pairScore}점`, 1020, 245);

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.font = "600 24px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  const titleQuote = pairLabel || "오행과 성향이 완벽히 맞물리는 모임의 특급 시너지 엔진!";
  ctx.fillText(`"${titleQuote}"`, 60, 290);

  // 5. Main Card Container (Pure White Aesthetic Card)
  const cardX = 60;
  const cardY = 325;
  const cardW = 960;
  const cardH = 1380;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 15;
  ctx.fillStyle = "#FFFFFF";
  drawRoundRect(ctx, cardX, cardY, cardW, cardH, 40);
  ctx.fill();
  ctx.restore();

  // Top Section of Card: Avatars Face-off
  // Member A Avatar (Left)
  const avCenterY = cardY + 165;
  const avRadius = 80;

  // Av 1 Circle
  ctx.save();
  ctx.strokeStyle = "#F43F5E";
  ctx.lineWidth = 6;
  ctx.fillStyle = "#FFF1F2";
  ctx.beginPath();
  ctx.arc(cardX + 220, avCenterY, avRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.clip();
  if (avatar1) {
    ctx.drawImage(avatar1, cardX + 220 - avRadius + 5, avCenterY - avRadius + 5, (avRadius - 5) * 2, (avRadius - 5) * 2);
  }
  ctx.restore();

  // Member A Nickname & Element Pill
  ctx.fillStyle = "#1E293B";
  ctx.font = "900 32px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(nick1, cardX + 220, avCenterY + 125);

  ctx.fillStyle = "#F1F5F9";
  drawRoundRect(ctx, cardX + 220 - 65, avCenterY + 145, 130, 36, 18);
  ctx.fill();
  ctx.fillStyle = "#475569";
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.fillText(`${elem1} 기운`, cardX + 220, avCenterY + 171);

  // Center Score Heart Badge
  ctx.fillStyle = "#FFF1F2";
  ctx.strokeStyle = "#FECDD3";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cardX + cardW / 2, avCenterY, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#E11D48";
  ctx.font = "900 36px -apple-system, BlinkMacSystemFont, 'Pretendard', monospace";
  ctx.textAlign = "center";
  ctx.fillText(`${pairScore}점`, cardX + cardW / 2, avCenterY + 8);

  ctx.fillStyle = "#BE123C";
  ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.fillText("상생 케미", cardX + cardW / 2, avCenterY + 34);

  // Member B Avatar (Right)
  ctx.save();
  ctx.strokeStyle = "#F59E0B";
  ctx.lineWidth = 6;
  ctx.fillStyle = "#FEF3C7";
  ctx.beginPath();
  ctx.arc(cardX + cardW - 220, avCenterY, avRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.clip();
  if (avatar2) {
    ctx.drawImage(avatar2, cardX + cardW - 220 - avRadius + 5, avCenterY - avRadius + 5, (avRadius - 5) * 2, (avRadius - 5) * 2);
  }
  ctx.restore();

  // Member B Nickname & Element Pill
  ctx.fillStyle = "#1E293B";
  ctx.font = "900 32px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(nick2, cardX + cardW - 220, avCenterY + 125);

  ctx.fillStyle = "#F1F5F9";
  drawRoundRect(ctx, cardX + cardW - 220 - 65, avCenterY + 145, 130, 36, 18);
  ctx.fill();
  ctx.fillStyle = "#475569";
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.fillText(`${elem2} 기운`, cardX + cardW - 220, avCenterY + 171);

  // Thin Separator Line
  ctx.strokeStyle = "#F1F5F9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + 40, cardY + 395);
  ctx.lineTo(cardX + cardW - 40, cardY + 395);
  ctx.stroke();

  // 6 Categories Section
  const startCatY = cardY + 425;
  const itemH = 145;

  categories.forEach((cat, idx) => {
    const itemY = startCatY + idx * (itemH + 12);

    // Box Background
    ctx.fillStyle = "#F8FAFC";
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, cardX + 40, itemY, cardW - 80, itemH, 20);
    ctx.fill();
    ctx.stroke();

    // Category Title with Emoji Icon
    ctx.textAlign = "left";
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
    ctx.fillText(`${cat.icon}  ${cat.title}`, cardX + 65, itemY + 42);

    // Category Score %
    ctx.textAlign = "right";
    ctx.fillStyle = cat.color;
    ctx.font = "900 28px monospace";
    ctx.fillText(`${cat.score}%`, cardX + cardW - 65, itemY + 42);

    // Progress Track
    const barX = cardX + 65;
    const barY = itemY + 62;
    const barW = cardW - 130;
    const barH = 14;

    ctx.fillStyle = "#E2E8F0";
    drawRoundRect(ctx, barX, barY, barW, barH, 7);
    ctx.fill();

    // Progress Bar Fill
    const fillW = (barW * Math.min(100, cat.score)) / 100;
    ctx.fillStyle = cat.color;
    drawRoundRect(ctx, barX, barY, fillW, barH, 7);
    ctx.fill();

    // AI Wit Comment
    ctx.textAlign = "left";
    ctx.fillStyle = "#475569";
    ctx.font = "500 21px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
    ctx.fillText(cat.desc, cardX + 65, itemY + 115);
  });

  // 6. Bottom Story Tag Banner
  const botY = 1735;
  ctx.fillStyle = "rgba(244, 63, 94, 0.22)";
  ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
  ctx.lineWidth = 2;
  drawRoundRect(ctx, 60, botY, 960, 75, 37);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#FECDD3";
  ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.fillText(`🏷️  @${nick2} 우리 사주 조합 점수 실시간 확인 ✨ (${pairScore}점)`, 540, botY + 47);

  // Footer Watermark
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "500 20px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("緣 인연사주 1:1 케미스트리", 60, 1855);

  ctx.textAlign = "right";
  ctx.font = "500 20px monospace";
  ctx.fillText("inyeons.com", 1020, 1855);

  // Convert to DataUrl and Blob
  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), "image/png");
  });

  return { dataUrl, blob };
}

export interface GenerateGroupCardParams {
  roomTitle: string;
  groupScore: number;
  members: Member[];
  atmosphere?: string;
}

/**
 * Generates a dedicated 1080x1920 Instagram Story / Group Card PNG using Pure Canvas 2D.
 * Group-Centric layout: All members constellation orbit, overall group harmony score, 3 MVP awards.
 */
export async function generateDedicatedGroupCard({
  roomTitle,
  groupScore,
  members,
  atmosphere,
}: GenerateGroupCardParams): Promise<{ dataUrl: string; blob: Blob }> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D canvas context");

  // Preload member avatar images
  const memberAvatarMap = new Map<string, HTMLImageElement | null>();
  await Promise.all(
    members.map(async (m) => {
      const src = getMemberZodiacSrc(m);
      if (src) {
        const img = await loadImage(src);
        memberAvatarMap.set(m.id, img);
      }
    })
  );

  // 1. Cosmic Background & Nebulae
  ctx.fillStyle = "#06080E";
  ctx.fillRect(0, 0, 1080, 1920);

  // Deep Nebulae Glows
  const g1 = ctx.createRadialGradient(540, 240, 0, 540, 240, 650);
  g1.addColorStop(0, "rgba(244, 63, 94, 0.22)");
  g1.addColorStop(0.6, "rgba(244, 63, 94, 0.05)");
  g1.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, 1080, 700);

  const g2 = ctx.createRadialGradient(540, 750, 0, 540, 750, 550);
  g2.addColorStop(0, "rgba(99, 102, 241, 0.18)");
  g2.addColorStop(0.7, "rgba(59, 130, 246, 0.04)");
  g2.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 400, 1080, 700);

  const g3 = ctx.createRadialGradient(540, 1400, 0, 540, 1400, 700);
  g3.addColorStop(0, "rgba(245, 158, 11, 0.12)");
  g3.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = g3;
  ctx.fillRect(0, 1100, 1080, 820);

  // Stars
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  for (let i = 0; i < 65; i++) {
    const sx = (i * 137.5) % 1080;
    const sy = (i * 293.7) % 1920;
    const sr = (i % 3) + 1;
    ctx.beginPath();
    ctx.arc(sx, sy, sr * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Top Header Pill
  const pillY = 95;
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 330, pillY, 420, 44, 22);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#FDA4AF";
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.fillText("✨ INYEON SAJU · 모임 종합 궁합", 540, pillY + 29);

  // Room Title
  const cleanTitle = (roomTitle || "우리 모임").trim();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 44px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.fillText(`"${cleanTitle}"`, 540, 195);

  // Big Group Score
  ctx.fillStyle = "#FF5A36";
  ctx.font = "900 96px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.fillText(`${groupScore}`, 505, 305);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 40px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.fillText("점", 575, 305);

  // Score Subtitle & Atmosphere
  const scoreLabel =
    groupScore >= 92
      ? "🌟 천생연분 시너지 (모임 화합도 최상급)"
      : groupScore >= 82
      ? "✨ 상생화합 시너지 (황금 밸런스)"
      : "💫 서로를 채워주는 보완형 시너지";
  ctx.fillStyle = "#FDE047";
  ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.fillText(scoreLabel, 540, 355);

  const cleanAtmosphere = atmosphere || "서로의 기운을 보완하며 함께할수록 시너지가 폭발하는 인연";
  ctx.fillStyle = "#94A3B8";
  ctx.font = "500 21px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.fillText(cleanAtmosphere, 540, 395);

  // 3. Center: Member Constellation Orbit Card
  const orbitCardY = 435;
  const orbitCardH = 610;
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 60, orbitCardY, 960, orbitCardH, 28);
  ctx.fill();
  ctx.stroke();

  // Orbit Card Header
  ctx.fillStyle = "#E2E8F0";
  ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`🌌 모임 인연 오행 성좌도 (${members.length}명의 기운 궤도)`, 95, orbitCardY + 45);

  // Orbit Center & Circles
  const orbitCenterX = 540;
  const orbitCenterY = orbitCardY + 335;
  const orbitR = 195;

  // Background Orbit Rings
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.arc(orbitCenterX, orbitCenterY, orbitR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(orbitCenterX, orbitCenterY, 110, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]); // Reset dash

  // Calculate member positions on the orbit
  const mCount = members.length;
  const memberPositions: { x: number; y: number; member: Member }[] = [];
  for (let i = 0; i < mCount; i++) {
    const angle = (i * 2 * Math.PI) / mCount - Math.PI / 2;
    const px = orbitCenterX + Math.cos(angle) * orbitR;
    const py = orbitCenterY + Math.sin(angle) * orbitR;
    memberPositions.push({ x: px, y: py, member: members[i] });
  }

  // Draw connecting constellation lines between all members
  ctx.strokeStyle = "rgba(244, 63, 94, 0.25)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < memberPositions.length; i++) {
    for (let j = i + 1; j < memberPositions.length; j++) {
      ctx.beginPath();
      ctx.moveTo(memberPositions[i].x, memberPositions[i].y);
      ctx.lineTo(memberPositions[j].x, memberPositions[j].y);
      ctx.stroke();
    }
  }

  // Center Glowing Emblem
  const centerGrad = ctx.createRadialGradient(orbitCenterX, orbitCenterY, 0, orbitCenterX, orbitCenterY, 55);
  centerGrad.addColorStop(0, "#FF5A36");
  centerGrad.addColorStop(1, "#BE185D");
  ctx.fillStyle = centerGrad;
  ctx.beginPath();
  ctx.arc(orbitCenterX, orbitCenterY, 48, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#FFFFFF";
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 17px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.fillText("모임 화합", orbitCenterX, orbitCenterY - 4);
  ctx.font = "900 22px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.fillText(`${groupScore}%`, orbitCenterX, orbitCenterY + 20);

  // Draw Member Nodes on Orbit
  const elemColors: Record<string, string> = {
    목: "#10B981",
    화: "#F43F5E",
    토: "#F59E0B",
    금: "#E2E8F0",
    수: "#3B82F6",
  };

  memberPositions.forEach(({ x, y, member }) => {
    const elem = getMemberElement(member) || "목";
    const elemColor = elemColors[elem] || "#F43F5E";
    const avatarImg = memberAvatarMap.get(member.id);
    const nodeR = 38;

    // Outer glow ring
    ctx.fillStyle = "rgba(6, 8, 14, 0.95)";
    ctx.beginPath();
    ctx.arc(x, y, nodeR + 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, nodeR, 0, Math.PI * 2);
    ctx.clip();

    if (avatarImg) {
      ctx.drawImage(avatarImg, x - nodeR, y - nodeR, nodeR * 2, nodeR * 2);
    } else {
      ctx.fillStyle = elemColor;
      ctx.fillRect(x - nodeR, y - nodeR, nodeR * 2, nodeR * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 24px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(getMemberNickname(member).slice(0, 1), x, y + 8);
    }
    ctx.restore();

    // Element border ring
    ctx.strokeStyle = elemColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(x, y, nodeR, 0, Math.PI * 2);
    ctx.stroke();

    // Member Nickname Badge below
    const nick = getMemberNickname(member);
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, x - 54, y + nodeR + 4, 108, 28, 14);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
    const displayNick = nick.length > 5 ? nick.slice(0, 4) + ".." : nick;
    ctx.fillText(displayNick, x, y + nodeR + 23);
  });

  // 4. Bottom Section: 모임 3대 MVP 어워즈
  const awardsY = 1075;
  ctx.textAlign = "left";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.fillText("🏆 모임 공식 3대 MVP 어워즈", 65, awardsY);

  const awardsResult = calculateGroupAwards(members);
  const topAwards = [
    {
      emoji: "🌸",
      title: "분위기 메이커 · 호감도 1위",
      winner: awardsResult.dohwaKing.winner,
      score: awardsResult.dohwaKing.score,
      tagline: "특유의 밝고 유쾌한 에너지로 모임에 온기를 불어넣는 사람",
      color: "#F43F5E",
    },
    {
      emoji: "🐎",
      title: "행동대장 · 추진력 1위",
      winner: awardsResult.yeokmaKing.winner,
      score: awardsResult.yeokmaKing.score,
      tagline: "모임의 약속과 새로운 시도에 가장 먼저 불을 지피는 추진력",
      color: "#3B82F6",
    },
    {
      emoji: "💰",
      title: "현실적 조율자 · 복덩이 1위",
      winner: awardsResult.wealthKing.winner,
      score: awardsResult.wealthKing.score,
      tagline: "균형 잡힌 현실 감각과 세심한 실속으로 모임을 지탱하는 기운",
      color: "#F59E0B",
    },
  ];

  const cardW = 960;
  const itemH = 175;
  topAwards.forEach((item, idx) => {
    const itemY = awardsY + 25 + idx * (itemH + 16);
    const cardX = 60;

    // Card Glass Background
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, cardX, itemY, cardW, itemH, 20);
    ctx.fill();
    ctx.stroke();

    // Emoji Circle
    const iconR = 36;
    const iconX = cardX + 55;
    const iconY = itemY + itemH / 2;
    ctx.fillStyle = `${item.color}22`;
    ctx.strokeStyle = `${item.color}55`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(iconX, iconY, iconR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "34px sans-serif";
    ctx.fillText(item.emoji, iconX, iconY + 12);

    // Award Title
    ctx.textAlign = "left";
    ctx.fillStyle = item.color;
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
    ctx.fillText(item.title, cardX + 115, itemY + 45);

    // Winner Name
    const wNick = getMemberNickname(item.winner);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 30px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
    ctx.fillText(`${wNick} 님`, cardX + 115, itemY + 86);

    // Tagline
    ctx.fillStyle = "#94A3B8";
    ctx.font = "500 20px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
    ctx.fillText(`"${item.tagline}"`, cardX + 115, itemY + 124);

    // Right Winner Avatar & Score
    const wImg = memberAvatarMap.get(item.winner.id);
    const wR = 36;
    const wX = cardX + cardW - 75;
    const wY = itemY + itemH / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(wX, wY, wR, 0, Math.PI * 2);
    ctx.clip();
    if (wImg) {
      ctx.drawImage(wImg, wX - wR, wY - wR, wR * 2, wR * 2);
    } else {
      ctx.fillStyle = item.color;
      ctx.fillRect(wX - wR, wY - wR, wR * 2, wR * 2);
    }
    ctx.restore();

    ctx.strokeStyle = item.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(wX, wY, wR, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 5. Bottom Story Tag Banner
  const botY = 1715;
  ctx.fillStyle = "rgba(244, 63, 94, 0.22)";
  ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
  ctx.lineWidth = 2;
  drawRoundRect(ctx, 60, botY, 960, 75, 37);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#FECDD3";
  ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.fillText(`🏷️  우리 모임 종합 화합 점수 ${groupScore}점 ✨ #인연사주 #모임케미`, 540, botY + 47);

  // Footer Watermark
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "500 20px -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("緣 인연사주 모임 종합 분석", 60, 1845);

  ctx.textAlign = "right";
  ctx.font = "500 20px monospace";
  ctx.fillText("inyeons.com", 1020, 1845);

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), "image/png");
  });

  return { dataUrl, blob };
}
