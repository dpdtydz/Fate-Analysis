import React, { useRef, useState, useEffect } from "react";
import { X, Printer, Download, Share2, Check, Sparkles, ShieldCheck, FileText, Award, Loader2 } from "lucide-react";
import { Member, SajuData } from "../types";
import { calculateSaju } from "../utils/saju";
import { shareToKakaoOrClipboard } from "../utils/shareHelper";
import { logAnalyticsEvent } from "../lib/analytics";
import { exportElementToPdf, exportElementToImage } from "../utils/pdfGenerator";
import { getUserPersonalProfile } from "../lib/firebase";

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
        backgroundColor: "#FCFAF6",
      });

      if (res.success) {
        setCopiedMsg("📄 PDF 파일이 성공적으로 다운로드되었습니다!");
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
        backgroundColor: "#FCFAF6",
      });

      if (res.success) {
        setCopiedMsg("🖼️ 고화질 이미지(PNG)가 다운로드되었습니다!");
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
      title: `[사주명당] ${nickname}님의 AI 심층 사주명식 리포트`,
      description: `${nickname}님의 정밀 사주명식과 오행 분석 감정서를 확인해 보세요! ☯`,
      url: window.location.href
    });
    if (res.success) {
      setCopiedMsg("공유 링크가 클립보드에 복사되었습니다!");
      setTimeout(() => setCopiedMsg(""), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static print-container">
      
      {/* Container Box */}
      <div className="bg-[#FCFAF6] border border-[#E7E1D6] rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="p-3 sm:p-4 bg-white border-b border-[#E7E1D6] flex items-center justify-between gap-2 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-black text-xs sm:text-sm text-[#2C3E50]">
                AI 심층 사주 명식 감정서 & PDF 소장본
              </h3>
              <p className="text-[10px] text-[#5C5046]">
                고품격 전통 한지 테마 · PDF 파일 저장 및 영구 보관용
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* Primary Action: Direct PDF Download */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-3 py-1.5 bg-[#C0392B] hover:bg-[#A93226] disabled:opacity-50 text-white font-serif font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
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
                  <Download className="w-3.5 h-3.5 text-amber-200" />
                  <span>PDF 내려받기</span>
                </>
              )}
            </button>

            {/* Secondary Action: Browser Print */}
            <button
              onClick={handlePrint}
              disabled={downloading}
              className="px-2.5 py-1.5 bg-[#FAF4EB] hover:bg-[#F3E8D5] text-[#7A3E2D] border border-[#E2D2B8] font-serif font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer active:scale-95"
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
              className="px-2.5 py-1.5 bg-[#2C3E50] hover:bg-[#1A252F] disabled:opacity-50 text-white font-serif font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer active:scale-95"
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
              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl transition cursor-pointer"
              title="공유하기"
              aria-label="공유하기"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition cursor-pointer ml-1"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Share / Download Alert Toast */}
        {copiedMsg && (
          <div className="bg-emerald-50 text-emerald-900 text-xs font-bold px-4 py-2 text-center border-b border-emerald-200 print:hidden flex items-center justify-center gap-1.5 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{copiedMsg}</span>
          </div>
        )}

        {/* Scrollable Printable Report Canvas */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-6 print:p-6 print:overflow-visible">
          
          <div 
            ref={printRef} 
            id="print-section"
            className="bg-[#FCFAF6] border-2 border-[#D4AF37]/50 p-6 sm:p-10 rounded-2xl space-y-7 shadow-xs relative print:border-none print:p-0 print:shadow-none font-serif"
            style={{
              backgroundImage: "radial-gradient(#EFE9DF 1px, transparent 1px)",
              backgroundSize: "24px 24px"
            }}
          >
            {/* Header Stamp and Badge */}
            <div className="border-b-2 border-[#C0392B]/80 pb-5 text-center space-y-2 relative">
              <div className="inline-block border border-[#C0392B] px-3 py-0.5 rounded-full text-[10px] font-bold text-[#C0392B] tracking-widest uppercase mb-1">
                전통 명리학 정통 감정본 (正統 命理學 鑑定本)
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#2C3E50] tracking-tight">
                {nickname} 님의 사주 원국 심층 감정서
              </h1>
              <p className="text-xs text-[#5C5046] tracking-wider">
                발급 일자: {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })} · {roomTitle ? `소속 모임: ${roomTitle}` : "개인 소장용"}
              </p>

              {/* Decorative Hanja Seal */}
              <div className="absolute top-0 right-0 w-12 h-12 border-2 border-red-700 rounded-lg flex items-center justify-center text-red-700 font-black text-xs leading-none rotate-6 opacity-75 hidden sm:flex select-none pointer-events-none">
                인연<br />명당
              </div>
            </div>

            {/* Profile Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-left">
              <div className="bg-white/90 p-3 rounded-xl border border-[#E7E1D6]">
                <span className="text-[10px] text-[#5C5046] block font-sans">성명 / 닉네임</span>
                <span className="font-bold text-[#2C3E50] text-sm">{nickname}</span>
              </div>
              <div className="bg-white/90 p-3 rounded-xl border border-[#E7E1D6]">
                <span className="text-[10px] text-[#5C5046] block font-sans">출생 연월일</span>
                <span className="font-bold text-[#2C3E50] text-sm">{birthDate} ({calendarType === "lunar" ? "음력" : "양력"})</span>
              </div>
              <div className="bg-white/90 p-3 rounded-xl border border-[#E7E1D6]">
                <span className="text-[10px] text-[#5C5046] block font-sans">출생 시각</span>
                <span className="font-bold text-[#2C3E50] text-sm">{birthTime || "시간 모름"}</span>
              </div>
              <div className="bg-white/90 p-3 rounded-xl border border-[#E7E1D6]">
                <span className="text-[10px] text-[#5C5046] block font-sans">성향(MBTI) / 성별</span>
                <span className="font-bold text-[#C0392B] text-sm">{mbti} · {gender === "male" ? "남성" : gender === "female" ? "여성" : "미입력"}</span>
              </div>
            </div>

            {/* 1. Four Pillars (사주팔자 원국표) */}
            <div className="space-y-2.5 text-left">
              <div className="flex items-center gap-1.5 border-b border-[#E7E1D6] pb-1.5">
                <span className="text-sm">📜</span>
                <h3 className="font-bold text-xs text-[#2C3E50] tracking-tight uppercase">
                  1. 사주 원국 4주 8자 (四柱八字 原局)
                </h3>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {/* Hour */}
                <div className="bg-white p-2.5 rounded-xl border border-[#E7E1D6] space-y-1">
                  <span className="text-[10px] text-[#5C5046] font-bold block">시주(時柱)</span>
                  <div className="text-base font-black text-amber-900 font-serif">
                    {sajuData?.pillars?.hour?.gan || "무"}{sajuData?.pillars?.hour?.ji || "진"}
                  </div>
                  <span className="text-[9px] text-[#5C5046] block">미래 / 자녀운</span>
                </div>

                {/* Day (Daymaster) */}
                <div className="bg-amber-50/80 p-2.5 rounded-xl border-2 border-amber-300 space-y-1 relative">
                  <span className="text-[10px] text-amber-900 font-bold block">일주(日柱) ★본원</span>
                  <div className="text-base font-black text-[#C0392B] font-serif">
                    {sajuData?.pillars?.day?.gan || "신"}{sajuData?.pillars?.day?.ji || "해"}
                  </div>
                  <span className="text-[9px] font-bold text-amber-800 block">본인 / 배우자운</span>
                </div>

                {/* Month */}
                <div className="bg-white p-2.5 rounded-xl border border-[#E7E1D6] space-y-1">
                  <span className="text-[10px] text-[#5C5046] font-bold block">월주(月柱)</span>
                  <div className="text-base font-black text-amber-900 font-serif">
                    {sajuData?.pillars?.month?.gan || "정"}{sajuData?.pillars?.month?.ji || "묘"}
                  </div>
                  <span className="text-[9px] text-[#5C5046] block">청년 / 사회운</span>
                </div>

                {/* Year */}
                <div className="bg-white p-2.5 rounded-xl border border-[#E7E1D6] space-y-1">
                  <span className="text-[10px] text-[#5C5046] font-bold block">연주(年柱)</span>
                  <div className="text-base font-black text-amber-900 font-serif">
                    {sajuData?.pillars?.year?.gan || "경"}{sajuData?.pillars?.year?.ji || "오"}
                  </div>
                  <span className="text-[9px] text-[#5C5046] block">초년 / 조상운</span>
                </div>
              </div>
            </div>

            {/* 2. Daymaster & Essence (본원 성정 해설) */}
            <div className="bg-white p-4.5 rounded-2xl border border-[#E7E1D6] space-y-3 text-left shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#F4EFE6] pb-2">
                <span className="font-bold text-xs text-[#C0392B] flex items-center gap-1.5">
                  <span>💎</span>
                  <span>일간(日干) 본원 분석: {ganInfo.nick}</span>
                </span>
                <span className="text-[10px] bg-amber-50 text-amber-900 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                  {ganInfo.title}
                </span>
              </div>

              <p className="text-xs text-[#4A3E31] leading-relaxed">
                {ganInfo.desc}
              </p>

              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EFE9DF] text-[11px] text-[#5A4D41] flex items-center justify-between">
                <span><strong>핵심 덕목:</strong> {ganInfo.virtue}</span>
                <span className="text-[#C0392B] font-bold">오행: {daymasterElem}({daymasterGan})</span>
              </div>
            </div>

            {/* 3. Five Elements Balance (오행 배합 분포 분석) */}
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between border-b border-[#E7E1D6] pb-1.5">
                <span className="font-bold text-xs text-[#2C3E50] tracking-tight uppercase flex items-center gap-1">
                  <span>☯️</span>
                  <span>2. 음양오행(陰陽五行) 배합 분포</span>
                </span>
                <span className="text-[10px] text-[#5C5046]">총 8글자 완벽 배합</span>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {[
                  { name: "목(木)", count: ohaengCount["목"] || 0, color: "bg-emerald-500", text: "text-emerald-800", bg: "bg-emerald-50" },
                  { name: "화(火)", count: ohaengCount["화"] || 0, color: "bg-rose-500", text: "text-rose-800", bg: "bg-rose-50" },
                  { name: "토(土)", count: ohaengCount["토"] || 0, color: "bg-amber-500", text: "text-amber-800", bg: "bg-amber-50" },
                  { name: "금(金)", count: ohaengCount["금"] || 0, color: "bg-slate-500", text: "text-slate-800", bg: "bg-slate-50" },
                  { name: "수(水)", count: ohaengCount["수"] || 0, color: "bg-blue-500", text: "text-blue-800", bg: "bg-blue-50" },
                ].map((item, idx) => {
                  const pct = Math.round((item.count / totalElem) * 100);
                  return (
                    <div key={idx} className={`${item.bg} p-2.5 rounded-xl border border-[#E7E1D6] space-y-1`}>
                      <span className={`text-[10px] font-bold block ${item.text}`}>{item.name}</span>
                      <span className="text-sm font-black text-[#2C3E50] block font-mono">{item.count}개</span>
                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[8.5px] text-[#5C5046] block font-mono">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Life Fortune & Harmony Guide (평생 총평 및 인연 상생 비책) */}
            <div className="bg-white p-5 rounded-2xl border border-[#E7E1D6] space-y-3.5 text-left shadow-2xs">
              <h4 className="font-bold text-xs text-[#2C3E50] border-b border-[#F4EFE6] pb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C0392B]" />
                <span>3. 운명 개운(開運) 및 인연 상생 지침</span>
              </h4>

              <div className="space-y-2.5 text-xs text-[#4A3E31] leading-relaxed">
                <div className="pl-3 border-l-2 border-[#C0392B]">
                  <strong className="text-[#C0392B] block mb-0.5">🌟 대인관계 & 인연 화합법</strong>
                  {nickname}님은 타고난 신뢰와 뚝심을 바탕으로 사람들과 깊은 유대를 형성합니다. 상대방의 의견을 5분간 먼저 온전히 경청한 뒤 나의 기준을 제시하면 갈등 없이 최상의 지지 기반을 다지게 됩니다.
                </div>

                <div className="pl-3 border-l-2 border-amber-500">
                  <strong className="text-amber-900 block mb-0.5">🌿 행운을 부르는 개운 아이템</strong>
                  사주 오행의 순환을 촉진하기 위해 자연 친화적 소품이나 식물, 은은한 조명을 가까이 두고 차분한 명상과 규칙적인 수면 루틴을 유지하는 것이 대길합니다.
                </div>
              </div>
            </div>

            {/* Footer Certificate Seal */}
            <div className="pt-4 border-t border-[#E7E1D6] text-center text-[10px] text-[#5C5046] space-y-1">
              <p>본 감정서는 정통 명리학 원전(자평진전·적천수)과 현대 행동심리학 데이터를 융합하여 정밀 발급되었습니다.</p>
              <p className="font-bold text-[#C0392B]">인연명당 (Inyeon Myungdang) · All Rights Reserved</p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
