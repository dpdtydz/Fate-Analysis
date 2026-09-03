import React, { useRef, useState, useEffect } from "react";
import { X, Printer, Download, Share2, Check, FileText, Loader2 } from "lucide-react";
import { Member, SajuData } from "../types";
import { calculateSaju } from "../utils/saju";
import { shareToKakaoOrClipboard } from "../utils/shareHelper";
import { logAnalyticsEvent } from "../lib/analytics";
import { exportElementToPdf, exportElementToImage } from "../utils/pdfGenerator";
import { getUserPersonalProfile } from "../lib/firebase";
import ZodiacAvatar, { BRANCH_TO_NAME, calculateMemberRole } from "./ZodiacAvatar";

export interface PersonalSajuProfile {
  nickname?: string;
  birth_date?: string;
  birth_time?: string;
  gender?: "male" | "female" | "unknown";
  calendarType?: "solar" | "lunar" | "leap_lunar";
  calendar_type?: "solar" | "lunar" | "leap_lunar";
  mbti?: string;
  saju?: SajuData;
}

interface PdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  member?: Member | null;
  profile?: PersonalSajuProfile | null;
  roomTitle?: string;
  roomCode?: string;
}

export default function PdfReportModal({
  isOpen,
  onClose,
  member,
  profile,
  roomTitle,
  roomCode
}: PdfReportModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadingType, setDownloadingType] = useState<"pdf" | "image" | null>(null);
  const [copiedMsg, setCopiedMsg] = useState("");
  const [fallbackProfile, setFallbackProfile] = useState<PersonalSajuProfile | null>(null);

  useEffect(() => {
    if (isOpen) {
      logAnalyticsEvent({
        eventName: "page_view",
        category: "engagement",
        metadata: { page: "pdf_report_modal", roomCode },
        roomCode
      });

      // If no member or profile provided, try loading saved user profile
      if (!member && !profile) {
        getUserPersonalProfile().then((p) => {
          if (p) setFallbackProfile(p);
        }).catch(() => {});
      }
    }
  }, [isOpen, roomCode, member, profile]);

  if (!isOpen) return null;

  // Resolve saju and personal info
  const mAny = (member || {}) as any;
  const pAny = (profile || fallbackProfile || {}) as any;
  const nickname = mAny.nickname || pAny.nickname || "사주고객";
  const birthDate = mAny.birth_date || mAny.birthDate || pAny.birth_date || pAny.birthDate || "1995-01-01";
  const birthTime = mAny.birth_time || mAny.birthTime || pAny.birth_time || pAny.birthTime || "12:00";
  const gender = mAny.gender || pAny.gender || "unknown";
  const calendarType = mAny.calendarType || mAny.calendar_type || pAny.calendarType || pAny.calendar_type || "solar";
  const mbti = mAny.mbti || pAny.mbti || "미입력";

  // Derive saju data
  let sajuData: SajuData | null = mAny.saju || pAny.saju || null;
  if (!sajuData && birthDate) {
    try {
      sajuData = calculateSaju(birthDate, birthTime, null, gender === "male" || gender === "남성" ? "남성" : "여성");
    } catch (e) {
      console.error("Failed calculating saju for PDF:", e);
    }
  }

  // Element calculations
  const ohaengCount = sajuData?.ohaeng_count || { "목": 2, "화": 2, "토": 2, "금": 1, "수": 1 };
  const totalElem = (ohaengCount["목"] || 0) + (ohaengCount["화"] || 0) + (ohaengCount["토"] || 0) + (ohaengCount["금"] || 0) + (ohaengCount["수"] || 0) || 8;

  const daymasterGan = sajuData?.daymaster?.gan || "무토";
  const daymasterElem = sajuData?.daymaster?.element || "토";

  const GAN_DESCS: Record<string, { nick: string; title: string; desc: string; virtue: string }> = {
    "갑": { nick: "우뚝 솟은 큰 소나무 (갑목)", title: "대림목(大林木)", desc: "굽힘 없는 소신과 진취적인 리더십, 강한 개척 정신으로 새로운 길을 여는 기상입니다.", virtue: "어질 인(仁) - 자애로움과 인자한 포용" },
    "을": { nick: "유연하고 강인한 넝쿨 (을목)", title: "회목(𦇊木)", desc: "어떠한 척박한 환경에서도 유연하게 적응하며 끈질긴 생명력으로 결실을 맺는 미덕입니다.", virtue: "어질 인(仁) - 부드러운 적응력과 유연성" },
    "병": { nick: "천하를 비추는 밝은 태양 (병화)", title: "태양화(太陽火)", desc: "화끈하고 솔직담백하며, 만물을 밝고 따뜻하게 비추는 긍정의 에너지가 넘칩니다.", virtue: "예도 례(禮) - 밝고 정열적인 사교성과 공명정대함" },
    "정": { nick: "어둠을 밝히는 은은한 등불 (정화)", title: "등촉화(燈燭火)", desc: "사려 깊고 섬세한 헌신으로 주변을 묵묵히 밝히며, 깊은 통찰력과 장인 정신을 발휘합니다.", virtue: "예도 례(禮) - 사려 깊은 배려와 따뜻한 온기" },
    "무": { nick: "웅장하고 듬직한 태산 (무토)", title: "광산토(廣山土)", desc: "어떤 풍파에도 흔들리지 않는 묵직한 중용의 미덕과 넓은 포용력으로 중심을 지킵니다.", virtue: "믿을 신(信) - 변치 않는 신뢰와 굳건한 신의" },
    "기": { nick: "만물을 길러내는 비옥한 전원 (기토)", title: "전원토(田園土)", desc: "온화하고 유연하며 모든 기운을 품어 성장시키는 자상함과 뛰어난 관리 능력을 지닙니다.", virtue: "믿을 신(信) - 포용적 수용과 세심한 돌봄" },
    "경": { nick: "단단하고 굳센 무쇠 원석 (경금)", title: "원광금(原鑛金)", desc: "의리가 깊고 결단력이 뛰어나며, 한번 마음먹은 대의는 끝까지 밀고 나가는 뚝심이 있습니다.", virtue: "옳을 의(義) - 결단력과 정의로운 신념" },
    "신": { nick: "예리하게 세공된 보석 (신금)", title: "주옥금(珠玉金)", desc: "정확하고 냉철하며 세련된 미적 감각과 자존감을 지녀 완벽을 추구하는 귀한 기운입니다.", virtue: "옳을 의(義) - 정교한 디테일과 품격 있는 자존감" },
    "임": { nick: "끝없이 흐르는 큰 바다 (임수)", title: "대해수(大海水)", desc: "심오한 지혜와 무한한 수용력을 지녀 모든 지류를 받아들이며 유연하게 흐르는 포용의 미덕입니다.", virtue: "지혜 지(智) - 깊은 통찰과 유연한 임기응변" },
    "계": { nick: "만물을 촉촉이 적시는 단비 (계수)", title: "우로수(雨露水)", desc: "총명하고 다정다감하며 섬세한 감수성과 기민한 직관으로 사람들의 마음을 적십니다.", virtue: "지혜 지(智) - 맑고 순수한 직관과 기획력" },
  };

  const ganKey = daymasterGan[0] || "무";
  const ganInfo = GAN_DESCS[ganKey] || GAN_DESCS["무"];

  // 12지신 수호 영수 및 시그니처 역할
  const rawYearBranch = sajuData?.pillars?.year?.ji || mAny.character_animal || "오";
  const yearBranch = typeof rawYearBranch === "string" && rawYearBranch.length > 0 ? rawYearBranch[0] : "오";
  const rawDayBranch = sajuData?.pillars?.day?.ji || "해";
  const dayBranch = typeof rawDayBranch === "string" && rawDayBranch.length > 0 ? rawDayBranch[0] : "해";
  const zodiacAnimalName = BRANCH_TO_NAME[yearBranch] || BRANCH_TO_NAME[dayBranch] || "동물";
  const signatureRole = calculateMemberRole(member || { saju: sajuData, mbti });

  // 1. Direct PDF File Download Handler
  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    setDownloadingType("pdf");
    try {
      logAnalyticsEvent({
        eventName: "result_capture_click",
        category: "conversion",
        metadata: { method: "direct_pdf", format: "pdf" },
        roomCode
      });

      const res = await exportElementToPdf(printRef.current, {
        filename: `사주명식_정밀감정서_${nickname}_${new Date().toISOString().slice(0, 10)}.pdf`,
        scale: 2,
        backgroundColor: "#FFFFFF",
      });

      if (res.success) {
        setCopiedMsg("PDF 파일이 다운로드되었습니다.");
        setTimeout(() => setCopiedMsg(""), 3500);
      } else {
        alert(res.error || "PDF 생성 중 오류가 발생했습니다. 브라우저 인쇄를 이용해 주세요.");
      }
    } catch (e: any) {
      console.error("PDF Export Error:", e);
      alert("다운로드 중 오류가 발생했습니다: " + (e.message || e));
    } finally {
      setDownloading(false);
      setDownloadingType(null);
    }
  };

  // 2. Browser Print Handler
  const handlePrint = () => {
    logAnalyticsEvent({
      eventName: "result_capture_click",
      category: "conversion",
      metadata: { method: "print", format: "pdf" },
      roomCode
    });
    window.print();
  };

  // 3. PNG Image Download Handler
  const handleDownloadImage = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    setDownloadingType("image");
    try {
      logAnalyticsEvent({
        eventName: "result_capture_click",
        category: "conversion",
        metadata: { method: "canvas_image", format: "png" },
        roomCode
      });

      const res = await exportElementToImage(printRef.current, {
        filename: `사주명식_정밀감정서_${nickname}_${new Date().toISOString().slice(0, 10)}.png`,
        scale: 2,
        backgroundColor: "#FFFFFF",
      });

      if (res.success) {
        setCopiedMsg("이미지(PNG) 파일이 다운로드되었습니다.");
        setTimeout(() => setCopiedMsg(""), 3500);
      } else {
        alert(res.error || "이미지 저장 중 오류가 발생했습니다.");
      }
    } catch (e: any) {
      console.error("Image Export Error:", e);
      alert("다운로드 중 오류가 발생했습니다: " + (e.message || e));
    } finally {
      setDownloading(false);
      setDownloadingType(null);
    }
  };

  // Share
  const handleShare = async () => {
    const res = await shareToKakaoOrClipboard({
      title: `[사주명당] ${nickname}님의 사주명식 리포트`,
      description: `${nickname}님의 사주명식과 오행 분석 감정서를 확인해 보세요.`,
      url: window.location.href
    });
    if (res.success) {
      setCopiedMsg("공유 링크가 클립보드에 복사되었습니다.");
      setTimeout(() => setCopiedMsg(""), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-black/50 overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static print-container">

      {/* Container Box */}
      <div className="bg-surface rounded-xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-lg overflow-hidden print:max-h-none print:shadow-none print:rounded-none">

        {/* Top Control Bar (Hidden on print) */}
        <div className="p-3 sm:p-4 border-b border-line flex items-center justify-between gap-2 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sunken text-ink-soft flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-xs sm:text-sm text-ink">
                사주 명식 감정서
              </h3>
              <p className="text-xs text-ink-faint">
                PDF 저장 및 인쇄용 문서
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* Primary Action: Direct PDF Download */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-3 py-1.5 bg-seal hover:bg-seal-deep disabled:opacity-40 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="PDF 문서를 파일로 직접 다운로드합니다"
              aria-label="PDF 내려받기"
            >
              {downloading && downloadingType === "pdf" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>PDF 생성 중...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF 내려받기</span>
                </>
              )}
            </button>

            {/* Secondary Action: Browser Print */}
            <button
              onClick={handlePrint}
              disabled={downloading}
              className="px-2.5 py-1.5 bg-sunken hover:bg-line text-ink font-semibold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              title="브라우저 인쇄 창을 열어 출력하거나 PDF로 저장합니다"
              aria-label="인쇄하기"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">인쇄하기</span>
            </button>

            {/* Tertiary Action: PNG Image Download */}
            <button
              onClick={handleDownloadImage}
              disabled={downloading}
              className="px-2.5 py-1.5 bg-sunken hover:bg-line disabled:opacity-40 text-ink font-semibold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              title="고화질 이미지(PNG) 파일로 저장합니다"
              aria-label="이미지 저장"
            >
              {downloading && downloadingType === "image" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{downloading && downloadingType === "image" ? "저장 중..." : "이미지 저장"}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 bg-sunken hover:bg-line text-ink-soft rounded-xl transition-colors cursor-pointer"
              title="공유하기"
              aria-label="공유하기"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-ink-faint hover:text-ink rounded-xl hover:bg-sunken transition-colors cursor-pointer ml-1"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Share / Download Alert Toast */}
        {copiedMsg && (
          <div className="bg-sunken text-ink text-xs font-medium px-4 py-2 text-center border-b border-line print:hidden flex items-center justify-center gap-1.5 animate-fade-in">
            <Check className="w-4 h-4 text-ink-soft" />
            <span>{copiedMsg}</span>
          </div>
        )}

        {/* Scrollable Printable Report Canvas */}
        <div className="overflow-y-auto bg-sunken p-4 sm:p-8 space-y-6 print:p-6 print:bg-white print:overflow-visible">

          <div
            ref={printRef}
            id="print-section"
            className="bg-surface p-6 sm:p-10 rounded-xl space-y-7 relative print:p-0"
          >
            {/* Header Stamp and Badge */}
            <div className="border-b border-line pb-5 text-center space-y-2 relative">
              <div className="text-xs text-ink-faint tracking-wide mb-1">
                전통 명리학 감정본
              </div>
              <h1 className="font-serif text-xl sm:text-2xl font-semibold text-ink tracking-tight">
                {nickname} 님의 사주 원국 감정서
              </h1>
              <p className="text-xs text-ink-faint">
                발급 일자: {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })} · {roomTitle ? `소속 모임: ${roomTitle}` : "개인 소장용"}
              </p>

              {/* Hanja Seal (낙관) */}
              <div className="absolute top-0 right-0 w-12 h-12 bg-seal rounded-md items-center justify-center text-white font-serif text-2xl hidden sm:flex select-none pointer-events-none">
                命
              </div>
            </div>

            {/* Profile Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-left">
              <div className="bg-sunken p-3 rounded-xl">
                <span className="text-xs text-ink-faint block">성명 / 닉네임</span>
                <span className="font-semibold text-ink text-sm">{nickname}</span>
              </div>
              <div className="bg-sunken p-3 rounded-xl">
                <span className="text-xs text-ink-faint block">출생 연월일</span>
                <span className="font-semibold text-ink text-sm">{birthDate} ({calendarType === "lunar" ? "음력" : "양력"})</span>
              </div>
              <div className="bg-sunken p-3 rounded-xl">
                <span className="text-xs text-ink-faint block">출생 시각</span>
                <span className="font-semibold text-ink text-sm">{birthTime || "시간 모름"}</span>
              </div>
              <div className="bg-sunken p-3 rounded-xl">
                <span className="text-xs text-ink-faint block">성향(MBTI) / 성별</span>
                <span className="font-semibold text-ink text-sm">{mbti} · {gender === "male" ? "남성" : gender === "female" ? "여성" : "미입력"}</span>
              </div>
            </div>

            {/* Guardian Zodiac & Signature Spirit Card (12지신 수호 영수) */}
            <div className="bg-sunken p-4 rounded-xl flex items-center justify-between gap-4 text-left border border-line/60">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-surface border border-line flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-xs">
                  <ZodiacAvatar
                    branch={yearBranch}
                    element={daymasterElem}
                    size={72}
                    className="object-contain"
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-seal bg-seal/10 px-2 py-0.5 rounded-md">
                      수호 12지신 영수
                    </span>
                    <span className="text-xs font-medium text-ink-faint">
                      {signatureRole.hanja} · {signatureRole.role}
                    </span>
                  </div>
                  <h2 className="font-serif text-base sm:text-lg font-semibold text-ink truncate">
                    {daymasterElem} 기운을 품은 {zodiacAnimalName}의 기상
                  </h2>
                  <p className="text-xs text-ink-soft line-clamp-1 leading-relaxed">
                    {signatureRole.tagline}
                  </p>
                </div>
              </div>
              <div className="hidden sm:block text-right shrink-0">
                <div className="text-xs text-ink-faint font-mono">GUARDIAN ZODIAC</div>
                <div className="text-xs font-semibold text-ink font-serif">{yearBranch}년(연지) {dayBranch}일(일지)</div>
              </div>
            </div>

            {/* 1. Four Pillars (사주팔자 원국표) */}
            <div className="space-y-2.5 text-left">
              <div className="flex items-center gap-1.5 border-b border-line pb-1.5">
                <h3 className="font-semibold text-sm text-ink tracking-tight">
                  1. 사주 원국 4주 8자 (四柱八字)
                </h3>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {/* Hour */}
                <div className="bg-sunken p-2.5 rounded-xl space-y-1">
                  <span className="text-xs text-ink-faint font-medium block">시주(時柱)</span>
                  <div className="text-base font-semibold text-ink font-serif">
                    {sajuData?.pillars?.hour?.gan || "무"}{sajuData?.pillars?.hour?.ji || "진"}
                  </div>
                  <span className="text-xs text-ink-faint block">미래 / 자녀운</span>
                </div>

                {/* Day (Daymaster) */}
                <div className="bg-sunken p-2.5 rounded-xl space-y-1 relative">
                  <span className="text-xs text-ink font-medium block">일주(日柱) 본원</span>
                  <div className="text-base font-semibold text-seal font-serif">
                    {sajuData?.pillars?.day?.gan || "신"}{sajuData?.pillars?.day?.ji || "해"}
                  </div>
                  <span className="text-xs text-ink-soft block">본인 / 배우자운</span>
                </div>

                {/* Month */}
                <div className="bg-sunken p-2.5 rounded-xl space-y-1">
                  <span className="text-xs text-ink-faint font-medium block">월주(月柱)</span>
                  <div className="text-base font-semibold text-ink font-serif">
                    {sajuData?.pillars?.month?.gan || "정"}{sajuData?.pillars?.month?.ji || "묘"}
                  </div>
                  <span className="text-xs text-ink-faint block">청년 / 사회운</span>
                </div>

                {/* Year */}
                <div className="bg-sunken p-2.5 rounded-xl space-y-1">
                  <span className="text-xs text-ink-faint font-medium block">연주(年柱)</span>
                  <div className="text-base font-semibold text-ink font-serif">
                    {sajuData?.pillars?.year?.gan || "경"}{sajuData?.pillars?.year?.ji || "오"}
                  </div>
                  <span className="text-xs text-ink-faint block">초년 / 조상운</span>
                </div>
              </div>
            </div>

            {/* 2. Daymaster & Essence (본원 성정 해설) */}
            <div className="bg-sunken p-4 rounded-xl space-y-3 text-left">
              <div className="flex items-center justify-between gap-2 pb-1">
                <span className="font-semibold text-sm text-ink">
                  일간(日干) 본원 분석: {ganInfo.nick}
                </span>
                <span className="text-xs text-ink-faint font-medium shrink-0">
                  {ganInfo.title}
                </span>
              </div>

              <p className="text-sm text-ink-soft leading-relaxed">
                {ganInfo.desc}
              </p>

              <div className="bg-surface p-3 rounded-xl text-xs text-ink-soft flex items-center justify-between">
                <span><strong className="font-semibold text-ink">핵심 덕목:</strong> {ganInfo.virtue}</span>
                <span className="text-ink font-semibold">오행: {daymasterElem}({daymasterGan})</span>
              </div>
            </div>

            {/* 3. Five Elements Balance (오행 배합 분포 분석) */}
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between border-b border-line pb-1.5">
                <span className="font-semibold text-sm text-ink tracking-tight">
                  2. 음양오행(陰陽五行) 배합 분포
                </span>
                <span className="text-xs text-ink-faint">총 8자 기준</span>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {[
                  { name: "목(木)", count: ohaengCount["목"] || 0, color: "var(--color-wood)" },
                  { name: "화(火)", count: ohaengCount["화"] || 0, color: "var(--color-fire)" },
                  { name: "토(土)", count: ohaengCount["토"] || 0, color: "var(--color-earth)" },
                  { name: "금(金)", count: ohaengCount["금"] || 0, color: "var(--color-metal)" },
                  { name: "수(水)", count: ohaengCount["수"] || 0, color: "var(--color-water)" },
                ].map((item, idx) => {
                  const pct = Math.round((item.count / totalElem) * 100);
                  return (
                    <div key={idx} className="bg-sunken p-2.5 rounded-xl space-y-1">
                      <span className="text-xs font-semibold block" style={{ color: item.color }}>{item.name}</span>
                      <span className="text-sm font-semibold text-ink block">{item.count}개</span>
                      <div className="w-full bg-line h-1.5 rounded-xl overflow-hidden">
                        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                      </div>
                      <span className="text-xs text-ink-faint block">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Life Fortune & Harmony Guide (평생 총평 및 인연 상생 비책) */}
            <div className="bg-sunken p-5 rounded-xl space-y-3.5 text-left">
              <h4 className="font-semibold text-sm text-ink pb-1">
                3. 개운(開運) 및 인연 상생 지침
              </h4>

              <div className="space-y-2.5 text-sm text-ink-soft leading-relaxed">
                <div className="pl-3 border-l-2 border-line">
                  <strong className="text-ink font-semibold block mb-0.5">대인관계와 인연 화합법</strong>
                  {nickname}님은 타고난 신뢰와 뚝심을 바탕으로 사람들과 깊은 유대를 형성합니다. 상대방의 의견을 먼저 충분히 경청한 뒤 나의 기준을 제시하면 갈등 없이 지지 기반을 다질 수 있습니다.
                </div>

                <div className="pl-3 border-l-2 border-line">
                  <strong className="text-ink font-semibold block mb-0.5">개운에 도움이 되는 습관</strong>
                  사주 오행의 순환을 돕기 위해 자연 친화적 소품이나 식물, 은은한 조명을 가까이 두고 차분한 명상과 규칙적인 수면 루틴을 유지하는 것이 도움이 됩니다.
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                [제 2부] 10년 주기 대운(大運) 흐름 & 모임원 1:1 인연 지도 (Page 2)
               ═══════════════════════════════════════════════════════════════ */}
            <div className="page-break my-6 pt-6 border-t-2 border-dashed border-line/80 space-y-5 text-left">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-seal text-white text-[11px] font-bold flex items-center justify-center">2</span>
                  <h3 className="font-serif text-base sm:text-lg font-semibold text-ink">
                    제 2부: 10년 대운(大運) 흐름 &amp; 인연 궁합 지도
                  </h3>
                </div>
                <span className="text-xs text-ink-faint font-mono">PAGE 2 OF 2</span>
              </div>

              {/* 10-Year Daeun Timeline */}
              <div className="bg-sunken p-4 rounded-xl space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-ink">10년 단위 대운(大運) 생애 흐름도</h4>
                  <span className="text-[11px] text-ink-faint">순행/역행 기반 운기 주기</span>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  {[
                    { age: "10대", ganji: "甲子", title: "학문·탐구", elem: "목", status: "길(吉)" },
                    { age: "20대", ganji: "乙丑", title: "사회 진출", elem: "목", status: "평(平)" },
                    { age: "30대", ganji: "丙寅", title: "도약·성취", elem: "화", status: "대길(大吉)" },
                    { age: "40대", ganji: "丁卯", title: "안정·결실", elem: "화", status: "길(吉)" },
                    { age: "50대", ganji: "戊辰", title: "명예·관리", elem: "토", status: "평(平)" },
                  ].map((d, i) => (
                    <div key={i} className="bg-surface p-2.5 rounded-lg border border-line space-y-1">
                      <span className="text-[10px] text-ink-faint block">{d.age}</span>
                      <span className="text-sm font-serif font-semibold text-seal block">{d.ganji}</span>
                      <span className="text-[11px] font-medium text-ink block">{d.title}</span>
                      <span className="text-[10px] text-emerald-600 font-medium block">{d.status}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-ink-soft leading-relaxed pt-1">
                  대운은 10년마다 바뀌는 계절과 같은 큰 환경의 변화입니다. 30대 중반~40대는 화(火)의 온기가 더해져 본인의 잠재력이 꽃피는 상승기운입니다.
                </p>
              </div>

              {/* 1:1 Inyeon Chemistry Map Guide */}
              <div className="bg-sunken p-4 rounded-xl space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-ink">모임 내 상호작용 및 1:1 인연 조화 비책</h4>
                  <span className="text-[11px] text-seal font-semibold">오행 상생(相生) 원리</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-surface rounded-xl border border-line space-y-1.5">
                    <span className="font-semibold text-ink flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      최고의 시너지 파트너: 목(木) &amp; 토(土) 기운
                    </span>
                    <p className="text-ink-soft text-[11px] leading-relaxed">
                      나의 단단한 결단력에 따뜻한 활력을 불어넣어주는 성향입니다. 새로운 프로젝트나 아이디어를 기획할 때 상호보완적 성과를 냅니다.
                    </p>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-line space-y-1.5">
                    <span className="font-semibold text-ink flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      조율이 필요한 파트너: 화(火) &amp; 금(金) 기운
                    </span>
                    <p className="text-ink-soft text-[11px] leading-relaxed">
                      열정과 원칙이 부딪힐 수 있으므로, 대화 시 한 템포 경청하는 완충 규칙을 두면 서로의 추진력을 배가시킬 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Certificate Seal */}
            <div className="pt-4 border-t border-line text-center text-xs text-ink-faint space-y-1">
              <p>본 감정서는 명리학 원전(자평진전·적천수)과 행동심리학 자료를 참고해 작성되었습니다.</p>
              <p className="font-semibold text-ink">인연명당 (Inyeon Myungdang) · All Rights Reserved</p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
