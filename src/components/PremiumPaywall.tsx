import React, { useState, useEffect } from "react";
import { 
  Crown, 
  Check, 
  Sparkles, 
  ExternalLink, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw, 
  Printer, 
  Eye, 
  Download, 
  CreditCard, 
  Lock, 
  Unlock, 
  Heart, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Smile,
  Coins,
  Users,
  Mail,
  Copy
} from "lucide-react";
import { auth, checkPremiumStatus, checkProductUnlock, activatePremiumSimulation, deactivatePremiumSimulation, deactivateProductSimulation } from "../lib/firebase";

interface PremiumPaywallProps {
  onStatusChange?: (isPremium: boolean) => void;
  inline?: boolean;
  titleText?: string;
  subtitleText?: string;
  memberCount?: number;
  initialTab?: "pdf" | "secret" | "group";
  isModal?: boolean;
  onClose?: () => void;
}

export default function PremiumPaywall({ 
  onStatusChange, 
  inline = false, 
  titleText, 
  subtitleText, 
  memberCount,
  initialTab,
  isModal = false,
  onClose
}: PremiumPaywallProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [isPdfUnlocked, setIsPdfUnlocked] = useState(false);
  const [isSecretUnlocked, setIsSecretUnlocked] = useState(false);
  const [isGroupUnlocked, setIsGroupUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activating, setActivating] = useState(false);
  const [message, setMessage] = useState("");
  
  // Interactive Shop States
  const [activeTab, setActiveTab] = useState<"pdf" | "secret" | "group">(initialTab || (memberCount !== undefined ? "group" : "pdf"));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [groupSize, setGroupSize] = useState<number>(memberCount || 10); // Default 10 members or actual member count
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "kakaopay" | "tosspay">("kakaopay");
  const [paymentStep, setPaymentStep] = useState<"idle" | "processing" | "success">("idle");
  const [showSamplePreview, setShowSamplePreview] = useState(true);
  const [billingEmail, setBillingEmail] = useState("lhs41977@gmail.com");
  const [copied, setCopied] = useState(false);
  const [receiptNo, setReceiptNo] = useState("");

  // Default checkout url
  const checkoutUrl = "https://connectfate.lemonsqueezy.com/checkout/buy/7de4acc2-8394-4b3b-a997-4bf79069a24f";

  const syncUnlockStates = async () => {
    const status = await checkPremiumStatus();
    setIsPremium(status);
    const pdfStatus = await checkProductUnlock("pdf");
    const secretStatus = await checkProductUnlock("secret");
    const groupStatus = await checkProductUnlock("group");
    setIsPdfUnlocked(status || pdfStatus);
    setIsSecretUnlocked(status || secretStatus);
    setIsGroupUnlocked(status || groupStatus);
    setChecking(false);
    if (onStatusChange) onStatusChange(status || pdfStatus || secretStatus || groupStatus);
  };

  useEffect(() => {
    syncUnlockStates();

    const unsubscribe = auth.onAuthStateChanged(() => {
      syncUnlockStates();
    });

    return () => unsubscribe();
  }, [onStatusChange]);

  // Handle Lemon Squeezy Overlay JS Initialization & Success Message Listener
  useEffect(() => {
    // 1. Initial scanning of the DOM for lemon.js links
    if (typeof (window as any).createLemonSqueezy === "function") {
      try {
        (window as any).createLemonSqueezy();
      } catch (err) {
        console.warn("Lemon Squeezy initialization failed:", err);
      }
    }

    // 2. Setup standard event handler if window.LemonSqueezy exists
    if ((window as any).LemonSqueezy) {
      try {
        (window as any).LemonSqueezy.Setup({
          eventHandler: async (event: any) => {
            console.log("Lemon Squeezy Setup eventHandler called:", event);
            if (event.event === "Checkout.Success") {
              console.log("Checkout successful via eventHandler!");
              await handleCheckoutSuccess();
            }
          }
        });
      } catch (err) {
        console.warn("LemonSqueezy.Setup failed:", err);
      }
    }

    // 3. PostMessage listener fallback for iframes/overlays
    const handleMessage = async (e: MessageEvent) => {
      if (e.data && e.data.event === "Checkout.Success") {
        console.log("Checkout successful via window.postMessage!");
        await handleCheckoutSuccess();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onStatusChange]);

  // Re-scan DOM when tab switches to ensure newly rendered buttons are binded by lemon.js
  useEffect(() => {
    if (typeof (window as any).createLemonSqueezy === "function") {
      setTimeout(() => {
        try {
          (window as any).createLemonSqueezy();
        } catch (err) {
          console.warn("createLemonSqueezy on tab switch failed:", err);
        }
      }, 100);
    }
  }, [activeTab]);

  // Sync groupSize with memberCount dynamically if provided
  useEffect(() => {
    if (memberCount !== undefined) {
      setGroupSize(memberCount);
    }
  }, [memberCount]);

  const handleCheckoutSuccess = async () => {
    try {
      await activatePremiumSimulation(undefined, activeTab);
      await syncUnlockStates();
      setMessage("🎉 결제가 정상적으로 처리되어 실시간 프리미엄 기능이 완전히 해금되었습니다! 쾌적하게 서비스를 즐겨보세요.");
    } catch (err) {
      console.error("Failed to activate premium after checkout:", err);
      alert("결제는 완료되었으나 등급 동기화에 난조가 발생했습니다. '원클릭 데모해금' 버튼을 클릭해 즉시 수동 해제할 수 있습니다.");
    }
  };

  // Pricing calculator based on group size (과금구간 설정)
  const calculateGroupPrice = (size: number) => {
    if (size <= 10) return { original: 6900, current: 4900, discount: "소규모 친목 실속 특가!" };
    if (size <= 20) return { original: 9900, current: 6900, discount: "30% 단체 우대 특가!" };
    if (size <= 30) return { original: 14900, current: 9900, discount: "대규모 친목 프리패스!" };
    return { original: 19900, current: 14900, discount: "초대형 무제한 정복 패스!" };
  };

  const currentGroupPrice = calculateGroupPrice(groupSize);

  const getProductDetails = (tab: "pdf" | "secret" | "group", size: number) => {
    switch (tab) {
      case "pdf":
        return {
          title: "📄 상세 AI 심층 사주 매칭 리포트 소장 & PDF 다운로드",
          desc: "사주 원국 오행 배합 분석, 조후 및 조율 십신 정밀 비평과 평생의 운명 코드를 감정하여 오프라인 인쇄에 최적화된 고품격 한지 테마 PDF 파일로 영구 소장할 수 있는 다운로드 라이선스입니다.",
          price: 1900,
          originalPrice: 2900,
        };
      case "secret":
        return {
          title: "🔒 모임 구성원 비밀 인연 등급 & 속마음 상성 해독권",
          desc: "겉으로 드러나지 않는 모임 멤버들의 은밀한 내면 지향과 심층적 역학 관계를 해독합니다. 비밀 인연 서열 등급(S, A, B, C, D, F)과 내면의 속궁합 상성 지도를 다이어그램으로 완전 분석하여 대시보드에 영구 개방합니다.",
          price: 2900,
          originalPrice: 3900,
        };
      case "group":
      default:
        if (size <= 10) {
          return {
            title: "👥 모임 전체 인원의 오행 상생 궁합 총괄 보고서(10명 이하)",
            desc: "가족, 스타트업 소팀, 소규모 단짝 친구(10명 이하) 모임의 오행 흐름을 조율하고, 1:1 전수 정밀 매칭 및 궁합 텍스트 처방전을 제한 없이 무제한으로 열람할 수 있는 실속형 그룹 해금 패스입니다.",
            price: 4900,
            originalPrice: 6900,
          };
        } else if (size <= 20) {
          return {
            title: "👥 모임 전체 인원의 오행 상생 궁합 총괄 보고서(20명 이하)",
            desc: "소규모 동호회, 회사 팀 단위 모임(11~20명 이하)을 위한 우대 패스입니다. 전체 오행의 불균형을 극복할 보완책 and 물(水)/나무(木) 등 필요 오행 매개 솔루션을 정밀 텍스트와 처방 지도로 일괄 해제합니다.",
            price: 6900,
            originalPrice: 9900,
          };
        } else if (size <= 30) {
          return {
            title: "👥 모임 전체 인원의 오행 상생 궁합 총괄 보고서(30명 이하)",
            desc: "대규모 친목 연합, 프로젝트 태스크포스(21~30명 이하)를 위한 프리미엄 전문 라이선스입니다. 그룹 내 리더십 조화와 트러블메이커 예방, 원만한 소통을 위한 중재자 역할 분석을 완벽하게 활성화합니다.",
            price: 9900,
            originalPrice: 14900,
          };
        } else {
          return {
            title: "👥 모임 전체 인원의 오행 상생 궁합 총괄 보고서(40명 이상)",
            desc: "초대형 단톡방, 대규모 비즈니스 커뮤니티(31명 이상)를 위한 비제한 그룹 요금 패스입니다. 인원 제한이 없는 완전 해제 버전으로, 그룹 내 전수의 오행 충합 인연 궤도와 다차원 융합 종합 점수를 전면 개방합니다.",
            price: 14900,
            originalPrice: 19900,
          };
        }
    }
  };

  const currentProduct = getProductDetails(activeTab, groupSize);

  const handleOpenPayment = () => {
    const randReceipt = "RECP-" + Math.floor(10000000 + Math.random() * 90000000);
    setReceiptNo(randReceipt);
    setPaymentStep("idle");
    setIsPaymentModalOpen(true);
  };

  const handleStartPayment = async () => {
    setPaymentStep("processing");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    try {
      await activatePremiumSimulation(undefined, activeTab);
      await syncUnlockStates();
      setPaymentStep("success");
      setMessage(`🎉 프리미엄 상품(${activeTab === "pdf" ? "PDF 심층 리포트" : activeTab === "secret" ? "비밀 인연·상성" : "그룹 오행 분석"}) 결제 및 기능 해금이 완료되었습니다!`);
    } catch (e) {
      console.error(e);
      setPaymentStep("idle");
      alert("결제 처리 중 통신 오류가 발생했습니다. 다시 시도해 주세요.");
    }
  };

  const handleSimulateActivate = async (productType?: "pdf" | "secret" | "group") => {
    const targetType = productType || activeTab;
    setActivating(true);
    setMessage("");

    // Check if currently unlocked
    const isCurrentlyUnlocked = 
      targetType === "pdf" ? isPdfUnlocked :
      targetType === "secret" ? isSecretUnlocked :
      targetType === "group" ? isGroupUnlocked : false;

    try {
      if (isCurrentlyUnlocked) {
        if (isPremium) {
          localStorage.removeItem("saju_premium_unlocked_local");
          if (targetType !== "pdf") localStorage.setItem("saju_unlocked_pdf", "true");
          if (targetType !== "secret") localStorage.setItem("saju_unlocked_secret", "true");
          if (targetType !== "group") localStorage.setItem("saju_unlocked_group", "true");
        }
        await deactivateProductSimulation(undefined, targetType);
        await syncUnlockStates();
        setMessage(`🔓 [${targetType === "pdf" ? "PDF 심층 리포트" : targetType === "secret" ? "비밀 인연·상성" : "그룹 오행 분석"}] 기능의 시뮬레이션 해금이 취소되어 다시 잠금 처리되었습니다.`);
      } else {
        await activatePremiumSimulation(undefined, targetType);
        await syncUnlockStates();
        setMessage(`🎉 7일 무료체험 시뮬레이션이 즉시 활성화되어 [${targetType === "pdf" ? "PDF 심층 리포트" : targetType === "secret" ? "비밀 인연·상성" : "그룹 오행 분석"}] 기능이 성공적으로 해금되었습니다!`);
      }
    } catch (e) {
      console.error(e);
      setMessage("시뮬레이션 처리 중 오류가 발생했습니다.");
    } finally {
      setActivating(false);
    }
  };

  const handleDeactivate = async () => {
    setActivating(true);
    setMessage("");
    try {
      await deactivatePremiumSimulation();
      await syncUnlockStates();
      setMessage("일반 회원 모드로 성공적으로 리셋되었습니다.");
    } catch (e) {
      console.error(e);
    } finally {
      setActivating(false);
    }
  };

  const renderInner = () => {
    if (checking) {
      return (
        <div id="premium-checking-loader" className="flex items-center justify-center py-8 text-xs text-[#8C7B6E]">
          <RefreshCw className="w-4 h-4 animate-spin mr-1.5 text-[#C0392B]" />
          구독 등급 및 안전 결제 세션 조회 중...
        </div>
      );
    }

    if (isPremium) {
      return (
        <div className="space-y-4 w-full">
          <div id="premium-active-badge-card" className="bg-[#FDFAF2] border border-amber-300 rounded-[22px] p-5 text-left space-y-4 shadow-sm relative overflow-hidden animate-fade-in w-full">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-6 -mt-6 pointer-events-none" />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded-full bg-amber-100 text-amber-700 animate-pulse">
                  <Crown className="w-4 h-4 fill-amber-500 text-amber-600" />
                </span>
                <span className="text-xs font-serif font-black text-amber-900 tracking-tight">
                  평생 패스 / 프리미엄 멤버십 라이선스 활성화됨
                </span>
              </div>
              <button
                id="deactivate-premium-btn"
                onClick={handleDeactivate}
                className="text-[9px] text-[#A69B8F] hover:text-[#C0392B] border border-[#E8E0D0] px-2 py-1 rounded bg-white hover:bg-red-50 transition font-medium cursor-pointer"
                title="일반 모드 테스트를 위해 프리미엄을 비활성화합니다"
              >
                🔌 테스트용 일반모드 리셋
              </button>
            </div>
            
            <div className="text-xs text-[#5A4D41] leading-relaxed space-y-2 relative z-10">
              <p className="font-semibold text-amber-950">
                ✨ <strong className="text-[#C0392B]">Premium 등급이 완전하게 열렸습니다!</strong>
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] text-amber-900/90 font-medium bg-white/60 p-3 rounded-xl border border-amber-200/50">
                <li className="flex items-center gap-1.5">✓ 1:1 전수 인연 궁합 완벽 개방</li>
                <li className="flex items-center gap-1.5">✓ 개인 사주명식 상세 해독서</li>
                <li className="flex items-center gap-1.5">✓ 자미두수 대운 10년 종합 분석</li>
                <li className="flex items-center gap-1.5">✓ 광고 제거 & 무제한 인연방</li>
              </ul>
            </div>

            {message && (
              <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 p-2.5 rounded-lg font-bold">
                {message}
              </div>
            )}
          </div>

          {/* Recommended Pricing Quick Trigger (Sandbox Console) */}
          <div className="flex flex-col bg-amber-50/50 border border-amber-100 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-emerald-600" />
                <span className="text-[10.5px] text-amber-950 font-extrabold leading-relaxed">
                  💻 가상 테스트용 원클릭 데모 해금 (클릭 시 온/오프 토글)
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {(isPdfUnlocked || isSecretUnlocked || isGroupUnlocked || isPremium) && (
                  <button
                    type="button"
                    onClick={handleDeactivate}
                    disabled={activating}
                    className="text-[9px] text-[#C0392B] border border-red-200 bg-white hover:bg-red-50 px-2 py-0.5 rounded font-bold cursor-pointer transition-all"
                    title="모든 해금 상태를 잠금 상태로 초기화합니다"
                  >
                    🔌 전체 초기화
                  </button>
                )}
                <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded-md">
                  SANDBOX ONLY
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* PDF Unlock Button */}
              <button
                id="quick-demo-pdf-unlock-btn"
                type="button"
                onClick={() => handleSimulateActivate("pdf")}
                disabled={activating}
                className={`text-[10px] font-extrabold px-3 py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1 border transition-all ${
                  isPdfUnlocked
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                    : "bg-white border-amber-200 text-[#C0392B] hover:bg-amber-100/40 hover:scale-[1.01]"
                }`}
              >
                {activating ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : isPdfUnlocked ? (
                  <>🔓 PDF 해금됨 (다시 잠금)</>
                ) : (
                  <>
                    <Unlock className="w-3 h-3" />
                    <span>📄 PDF 리포트 해금</span>
                  </>
                )}
              </button>

              {/* Secret Unlock Button */}
              <button
                id="quick-demo-secret-unlock-btn"
                type="button"
                onClick={() => handleSimulateActivate("secret")}
                disabled={activating}
                className={`text-[10px] font-extrabold px-3 py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1 border transition-all ${
                  isSecretUnlocked
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                    : "bg-white border-amber-200 text-[#C0392B] hover:bg-amber-100/40 hover:scale-[1.01]"
                }`}
              >
                {activating ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : isSecretUnlocked ? (
                  <>🔓 비밀인연 해금됨 (다시 잠금)</>
                ) : (
                  <>
                    <Unlock className="w-3 h-3" />
                    <span>🔒 비밀 인연·상성 해금</span>
                  </>
                )}
              </button>

              {/* Group Unlock Button */}
              <button
                id="quick-demo-group-unlock-btn"
                type="button"
                onClick={() => handleSimulateActivate("group")}
                disabled={activating}
                className={`text-[10px] font-extrabold px-3 py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1 border transition-all ${
                  isGroupUnlocked
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                    : "bg-white border-amber-200 text-[#C0392B] hover:bg-amber-100/40 hover:scale-[1.01]"
                }`}
              >
                {activating ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : isGroupUnlocked ? (
                  <>🔓 그룹오행 해금됨 (다시 잠금)</>
                ) : (
                  <>
                    <Unlock className="w-3 h-3" />
                    <span>👥 그룹 오행 해금</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div id="premium-shop-container" className={`${inline || isModal ? "p-0" : "bg-white/95 border border-amber-300 p-5.5 sm:p-6.5 rounded-[26px] shadow-md"} text-left space-y-4 animate-fade-in relative`}>
      
      {/* Premium Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-700 rounded-md font-serif uppercase tracking-wider">
          <Crown className="w-3 h-3 fill-amber-500 text-amber-600" />
          <span>인연 명당 프리미엄 숍</span>
        </div>
        <h4 className="font-serif text-base font-black text-[#2C3E50] tracking-tight">
          {titleText || "👑 프리미엄 상생 해법 & 인연 리포트 해금"}
        </h4>
        <p className="text-[11px] text-[#8C7B6E] leading-relaxed font-medium">
          {subtitleText || "모임 인원과 사주 설문 분석 결과를 기반으로 한 최고의 유료 혜택들을 가상 결제 시뮬레이션으로 지금 즉시 경험해 보세요."}
        </p>
      </div>

      {/* Pricing and Tab Options */}
      <div className="grid grid-cols-3 gap-1.5 bg-[#FAF8F5] border border-[#E8E0D0] p-1 rounded-xl shadow-xs">
        <button
          id="tab-pdf-btn"
          type="button"
          onClick={() => setActiveTab("pdf")}
          className={`py-2.5 text-[10.5px] font-bold rounded-lg transition-all text-center cursor-pointer ${
            activeTab === "pdf"
              ? "bg-[#C0392B] text-white shadow-xs font-serif tracking-tight"
              : "text-[#8C7B6E] hover:text-[#C0392B] hover:bg-white/60"
          }`}
        >
          📄 PDF 심층 리포트
        </button>
        <button
          id="tab-secret-btn"
          type="button"
          onClick={() => setActiveTab("secret")}
          className={`py-2.5 text-[10.5px] font-bold rounded-lg transition-all text-center cursor-pointer ${
            activeTab === "secret"
              ? "bg-[#C0392B] text-white shadow-xs font-serif tracking-tight"
              : "text-[#8C7B6E] hover:text-[#C0392B] hover:bg-white/60"
          }`}
        >
          🔒 비밀 인연·상성
        </button>
        <button
          id="tab-group-btn"
          type="button"
          onClick={() => setActiveTab("group")}
          className={`py-2.5 text-[10.5px] font-bold rounded-lg transition-all text-center cursor-pointer ${
            activeTab === "group"
              ? "bg-[#C0392B] text-white shadow-xs font-serif tracking-tight"
              : "text-[#8C7B6E] hover:text-[#C0392B] hover:bg-white/60"
          }`}
        >
          👥 그룹 오행 분석
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "pdf" && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-gradient-to-b from-[#FDFCF9] to-[#FAF7F2] border border-amber-200/80 rounded-xl p-5 space-y-3.5 shadow-xs">
            <div className="flex justify-between items-start gap-2">
              <div>
                <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">인기 소장 품목</span>
                <h5 className="font-serif font-black text-sm text-[#2C3E50] mt-1.5 leading-snug">상세 AI 심층 사주 매칭 리포트 소장 & PDF 다운로드권</h5>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-gray-400 line-through block">2,900원</span>
                <span className="text-sm font-serif font-black text-[#C0392B]">특별가 1,900원</span>
              </div>
            </div>
            
            <p className="text-[11px] text-[#5C4D41] leading-relaxed">
              사주 원국 오행 배합 분석, 조후 및 조율 십신 정밀 비평과 평생의 운명 코드를 감정하여, 오프라인 인쇄/인쇄 최적화 한지 테마 PDF 파일로 영구 소장할 수 있습니다.
            </p>
            
            <div className="border-t border-dashed border-amber-200/60 my-3 pt-3">
              <ul className="text-[11px] text-[#4A3E31] space-y-2 pl-0.5">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" /> 
                  <span>나와 소중한 인연 간의 사주 원국 정밀 비교 분석서</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" /> 
                  <span>출력 및 보관에 최적화된 고품격 전통 한지 레이아웃</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" /> 
                  <span>스마트폰/PC 어디서나 평생 접근 가능한 고유 다운로드 URL 제공</span>
                </li>
              </ul>
            </div>
          </div>
          
          {isPdfUnlocked ? (
            <div className="flex items-center justify-center space-x-2 w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-serif font-extrabold text-xs tracking-widest rounded-xl shadow-md transition-all text-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-100 inline mr-1 animate-bounce" />
              <span>🎉 AI 심층 리포트 PDF 상품이 해금되었습니다!</span>
            </div>
          ) : (
            <button
              id="buy-pdf-btn"
              type="button"
              onClick={handleOpenPayment}
              className="flex items-center justify-center space-x-2 w-full py-4 bg-gradient-to-r from-[#2C3E50] to-[#1A252F] text-[#FAF7F2] hover:from-[#1A252F] hover:to-[#111A24] font-serif font-extrabold text-xs tracking-widest rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer text-center"
            >
              <Printer className="w-4 h-4 text-amber-400 inline mr-1" />
              <span>AI 심층 리포트 PDF 즉시 소장하기 (1,900원)</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FAF7F2]/80 inline ml-1" />
            </button>
          )}
        </div>
      )}

      {activeTab === "secret" && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-gradient-to-b from-[#FDFCF9] to-[#FAF7F2] border border-amber-200/80 rounded-xl p-5 space-y-3.5 shadow-xs">
            <div className="flex justify-between items-start gap-2">
              <div>
                <span className="text-[9px] bg-red-100 text-red-800 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">은밀한 속궁합</span>
                <h5 className="font-serif font-black text-sm text-[#2C3E50] mt-1.5 leading-snug">모임 구성원 비밀 인연 등급 & 속마음 상성 해독권</h5>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-gray-400 line-through block">3,900원</span>
                <span className="text-sm font-serif font-black text-[#C0392B]">특별가 2,900원</span>
              </div>
            </div>
            
            <p className="text-[11px] text-[#5C4D41] leading-relaxed">
              겉으로 드러나지 않는 모임 멤버들의 은밀한 내면 지향과 심층적 역학 관계를 해독합니다. 비밀 인연 서열 등급(S, A, B, C, D, F)과 내면의 속궁합 상성 지도를 다이어그램으로 완전 분석합니다.
            </p>
            
            <div className="border-t border-dashed border-amber-200/60 my-3 pt-3">
              <ul className="text-[11px] text-[#4A3E31] space-y-2 pl-0.5">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" /> 
                  <span>모임 내 가장 조화로운 운명적 짝꿍(S등급 조합) 즉시 확인</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" /> 
                  <span>단순 겉궁합을 넘어선 오행 충/합 기반 은밀한 속마음 궤적도</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" /> 
                  <span>성향 충돌을 영리하게 예방하는 맞춤형 비밀 완충 수칙</span>
                </li>
              </ul>
            </div>
          </div>
          
          {isSecretUnlocked ? (
            <div className="flex items-center justify-center space-x-2 w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-serif font-extrabold text-xs tracking-widest rounded-xl shadow-md transition-all text-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-100 inline mr-1 animate-bounce" />
              <span>🎉 비밀 인연 등급 & 상성 상품이 해금되었습니다!</span>
            </div>
          ) : (
            <button
              id="buy-secret-btn"
              type="button"
              onClick={handleOpenPayment}
              className="flex items-center justify-center space-x-2 w-full py-4 bg-gradient-to-r from-amber-600 to-[#C0392B] hover:from-[#C0392B] hover:to-[#962D22] text-white font-serif font-extrabold text-xs tracking-widest rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer text-center"
            >
              <Lock className="w-4 h-4 fill-white text-amber-300 inline mr-1" />
              <span>비밀 인연 등급 & 상성 정밀 분석 (2,900원)</span>
              <ArrowRight className="w-3.5 h-3.5 text-white/80 inline ml-1" />
            </button>
          )}
        </div>
      )}

      {activeTab === "group" && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-gradient-to-b from-[#FDFCF9] to-[#FAF7F2] border border-amber-200/80 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex justify-between items-start gap-2">
              <div>
                <span className="text-[9px] bg-[#C0392B]/10 text-[#C0392B] font-extrabold px-2 py-0.5 rounded border border-[#C0392B]/20 uppercase tracking-wider">소모임 맞춤형</span>
                <h5 className="font-serif font-black text-sm text-[#2C3E50] mt-1.5 leading-snug">모임 전체 인원의 오행 상생 궁합 총괄 보고서</h5>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-gray-400 line-through block">최대 19,900원</span>
                <span className="text-sm font-serif font-black text-[#C0392B]">인원 맞춤 할인</span>
              </div>
            </div>
            
            <p className="text-[11px] text-[#5C4D41] leading-relaxed">
              소중한 모임의 규모에 비례해 합리적으로 이용할 수 있는 유연 요금 패스입니다. 전체 인원의 오행(목, 화, 토, 금, 수)이 조화를 이루는지 한눈에 보여주는 순환 에너지 분포와 최적의 그룹 처방을 제공합니다.
            </p>

            {/* Interactive Group Size Calculator - Tier-based Selection Cards */}
            <div className="bg-white border border-[#E8E0D0] p-4 rounded-xl space-y-3.5 shadow-3xs">
              <div className="text-[11px] font-bold text-[#5A4D41] flex justify-between items-center">
                <span>
                  {memberCount !== undefined 
                    ? `👥 이 모임 참여자 수 (${memberCount}명) 자동 감지됨` 
                    : "👥 모임 활동 인원수 과금 구간 선택"}
                </span>
                <span className="text-[#C0392B] text-[10px] font-bold bg-red-50 border border-red-200/50 px-2 py-0.5 rounded-full">
                  {groupSize <= 10 ? "1~10명 구간" : groupSize <= 20 ? "11~20명 구간" : groupSize <= 30 ? "21~30명 구간" : "31명 이상 무제한"}
                </span>
              </div>

              {memberCount !== undefined && (
                <div className="bg-amber-50/50 border border-amber-200/60 p-2.5 rounded-lg text-[10px] text-amber-900 leading-normal font-medium">
                  💡 현재 모임방의 총 참여 인원 <strong>{memberCount}명</strong>에 맞추어 10명 단위의 요금 구간이 자동으로 적용되었습니다. (별도 선택 불필요)
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 10, range: "1 ~ 10명", name: "소규모 친목 모임", price: "4,900원", label: "소규모" },
                  { id: 20, range: "11 ~ 20명", name: "정기 친목 동호회", price: "6,900원", label: "중규모" },
                  { id: 30, range: "21 ~ 30명", name: "대규모 연합 단체", price: "9,900원", label: "대규모" },
                  { id: 40, range: "31명 이상", name: "초대형 단톡방 (무제한)", price: "14,900원", label: "초대형 무제한" }
                ].map((tier) => {
                  const isSelected = (tier.id === 10 && groupSize <= 10) ||
                                     (tier.id === 20 && groupSize > 10 && groupSize <= 20) ||
                                     (tier.id === 30 && groupSize > 20 && groupSize <= 30) ||
                                     (tier.id === 40 && groupSize > 30);
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      disabled={memberCount !== undefined}
                      onClick={() => setGroupSize(tier.id)}
                      className={`text-left p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                        memberCount !== undefined ? "cursor-default" : "cursor-pointer"
                      } ${
                        isSelected
                          ? "bg-amber-50/40 border-[#C0392B] ring-1 ring-[#C0392B] shadow-3xs"
                          : memberCount !== undefined
                            ? "bg-gray-50/20 border-gray-100 opacity-40"
                            : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/30"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-serif font-extrabold ${isSelected ? "text-[#C0392B]" : "text-[#2C3E50]"}`}>
                          {tier.range}
                        </span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? "border-[#C0392B] bg-[#C0392B]" : "border-gray-300"
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <div className="text-[9px] text-[#8C7B6E] font-medium mt-1 leading-snug">
                        {tier.name}
                      </div>
                      <div className="text-[11px] font-bold font-mono text-gray-900 mt-2">
                        {tier.price}
                      </div>
                      {isSelected && memberCount !== undefined && (
                        <div className="absolute top-0 right-0 bg-[#C0392B] text-white text-[7px] font-black px-1.5 py-0.5 rounded-bl">
                          자동 적용
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center text-[9.5px] text-[#8C7B6E] bg-[#FAF8F5] px-3 py-2 rounded-lg border border-[#E8E0D0]/50">
                <span className="font-bold text-[#5A4D41]">구간 특별 혜택:</span>
                <span className="bg-amber-50 text-[#C0392B] font-extrabold px-2.5 py-0.5 rounded border border-amber-200 shadow-3xs text-[9.5px]">
                  {currentGroupPrice.discount}
                </span>
              </div>
              
              <div className="flex justify-between items-center border-t border-[#FAF0DE] pt-3 mt-2 text-xs">
                <span className="font-serif font-bold text-[#2C3E50]">최종 맞춤형 결제 금액:</span>
                <span className="font-serif font-black text-[#C0392B] text-sm">
                  <span className="text-[10.5px] text-gray-400 line-through font-normal mr-2">{currentGroupPrice.original}원</span>
                  {currentGroupPrice.current}원
                </span>
              </div>
            </div>
          </div>
          
          {isGroupUnlocked ? (
            <div className="flex items-center justify-center space-x-2 w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-serif font-extrabold text-xs tracking-widest rounded-xl shadow-md transition-all text-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-100 inline mr-1 animate-bounce" />
              <span>🎉 그룹 오행 분석 상품이 해금되었습니다!</span>
            </div>
          ) : (
            <button
              id="buy-group-report-btn"
              type="button"
              onClick={handleOpenPayment}
              className="flex items-center justify-center space-x-2 w-full py-4 bg-[#C0392B] hover:bg-[#A93226] text-white font-serif font-extrabold text-xs tracking-widest rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer text-center"
            >
              <Users className="w-4 h-4 inline mr-1" />
              <span>오행 상생 총괄 분석서 발급 ({currentGroupPrice.current}원)</span>
              <ArrowRight className="w-3.5 h-3.5 text-white/80 inline ml-1" />
            </button>
          )}
        </div>
      )}

      {/* Recommended Pricing Quick Trigger */}
      <div className="flex flex-col bg-amber-50/50 border border-amber-100 rounded-2xl p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Smile className="w-4 h-4 text-emerald-600" />
            <span className="text-[10.5px] text-amber-950 font-extrabold leading-relaxed">
              💻 가상 테스트용 원클릭 데모 해금 (클릭 시 온/오프 토글)
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {(isPdfUnlocked || isSecretUnlocked || isGroupUnlocked || isPremium) && (
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={activating}
                className="text-[9px] text-[#C0392B] border border-red-200 bg-white hover:bg-red-50 px-2 py-0.5 rounded font-bold cursor-pointer transition-all"
                title="모든 해금 상태를 잠금 상태로 초기화합니다"
              >
                🔌 전체 초기화
              </button>
            )}
            <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded-md">
              SANDBOX ONLY
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* PDF Unlock Button */}
          <button
            id="quick-demo-pdf-unlock-btn"
            type="button"
            onClick={() => handleSimulateActivate("pdf")}
            disabled={activating}
            className={`text-[10px] font-extrabold px-3 py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1 border transition-all ${
              isPdfUnlocked
                ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                : "bg-white border-amber-200 text-[#C0392B] hover:bg-amber-100/40 hover:scale-[1.01]"
            }`}
          >
            {activating ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : isPdfUnlocked ? (
              <>🔓 PDF 해금됨 (다시 잠금)</>
            ) : (
              <>
                <Unlock className="w-3 h-3" />
                <span>📄 PDF 리포트 해금</span>
              </>
            )}
          </button>

          {/* Secret Unlock Button */}
          <button
            id="quick-demo-secret-unlock-btn"
            type="button"
            onClick={() => handleSimulateActivate("secret")}
            disabled={activating}
            className={`text-[10px] font-extrabold px-3 py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1 border transition-all ${
              isSecretUnlocked
                ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                : "bg-white border-amber-200 text-[#C0392B] hover:bg-amber-100/40 hover:scale-[1.01]"
            }`}
          >
            {activating ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : isSecretUnlocked ? (
              <>🔓 비밀인연 해금됨 (다시 잠금)</>
            ) : (
              <>
                <Unlock className="w-3 h-3" />
                <span>🔒 비밀 인연·상성 해금</span>
              </>
            )}
          </button>

          {/* Group Unlock Button */}
          <button
            id="quick-demo-group-unlock-btn"
            type="button"
            onClick={() => handleSimulateActivate("group")}
            disabled={activating}
            className={`text-[10px] font-extrabold px-3 py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1 border transition-all ${
              isGroupUnlocked
                ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                : "bg-white border-amber-200 text-[#C0392B] hover:bg-amber-100/40 hover:scale-[1.01]"
            }`}
          >
            {activating ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : isGroupUnlocked ? (
              <>🔓 그룹오행 해금됨 (다시 잠금)</>
            ) : (
              <>
                <Unlock className="w-3 h-3" />
                <span>👥 그룹 오행 해금</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* COLLAPSIBLE PREVIEW SECTION (Addresses Response #5: "심층 리포트일 경우 어떻게 나오는지 상세페이지/샘플 미리보기 필요") */}
      <div className="border border-[#E8E0D0] rounded-xl overflow-hidden bg-[#FAF8F5]/40">
        <button
          id="toggle-preview-btn"
          type="button"
          onClick={() => setShowSamplePreview(!showSamplePreview)}
          className="w-full flex items-center justify-between p-3.5 bg-[#FAF8F5] hover:bg-[#FAF8F5]/80 text-left text-[11px] font-extrabold text-[#5A4D41] border-b border-[#E8E0D0] transition duration-150 cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-[#C0392B]" />
            <span>🔎 프리미엄 심층 리포트 & 처방전 실제 화면 샘플 미리보기</span>
          </div>
          <span className="text-[10px] text-[#8C7B6E]">
            {showSamplePreview ? "▲ 닫기" : "▼ 펼쳐서 샘플 확인"}
          </span>
        </button>

        {showSamplePreview && (
          <div className="p-4 space-y-4 text-left animate-fade-in text-xs leading-relaxed max-h-[350px] overflow-y-auto scrollbar-thin">
            
            {/* Header Mock */}
            <div className="text-center pb-2.5 border-b border-dashed border-[#E8E0D0]">
              <span className="font-serif text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-bold inline-block">
                [샘플 예시] 홍길동 님의 평생 사주명리 보배 감정서
              </span>
              <h6 className="font-serif font-extrabold text-sm text-[#2C3E50] mt-1.5">
                일간 갑목(甲木)의 대림목(大林木) 기운과 10년 대운
              </h6>
            </div>

            {/* Sample Saju Box */}
            <div className="grid grid-cols-4 gap-1.5 text-center bg-white p-2 rounded-lg border border-[#E8E0D0]">
              <div className="bg-[#FAF8F5] p-1.5 rounded">
                <div className="text-[8px] text-[#8C7B6E] font-bold">시간</div>
                <div className="font-serif text-xs font-bold text-emerald-700">庚 (편관)</div>
                <div className="font-serif text-xs font-bold text-gray-700">午 (상관)</div>
              </div>
              <div className="bg-[#FAF8F5] p-1.5 rounded border border-[#C0392B]/30">
                <div className="text-[8px] text-[#C0392B] font-extrabold">일간</div>
                <div className="font-serif text-xs font-bold text-emerald-700">甲 (일주)</div>
                <div className="font-serif text-xs font-bold text-gray-700">寅 (비견)</div>
              </div>
              <div className="bg-[#FAF8F5] p-1.5 rounded">
                <div className="text-[8px] text-[#8C7B6E] font-bold">월간</div>
                <div className="font-serif text-xs font-bold text-emerald-700">丙 (식신)</div>
                <div className="font-serif text-xs font-bold text-gray-700">子 (정인)</div>
              </div>
              <div className="bg-[#FAF8F5] p-1.5 rounded">
                <div className="text-[8px] text-[#8C7B6E] font-bold">년간</div>
                <div className="font-serif text-xs font-bold text-emerald-700">己 (정재)</div>
                <div className="font-serif text-xs font-bold text-gray-700">巳 (식신)</div>
              </div>
            </div>

            {/* Sample Interpretation */}
            <div className="space-y-1 bg-white p-3 border border-[#E8E0D0]/50 rounded-xl">
              <span className="text-[10px] font-bold text-[#C0392B] block">☯️ 사주 오행의 균형 조율</span>
              <p className="text-[10px] text-[#5A4D41] leading-relaxed">
                귀하의 사주는 푸르른 거목을 상징하는 <strong>갑인(甲寅) 일주</strong>로, 주관이 굳세고 자립심이 출중합니다. 목(木)과 화(火)의 추진 기운이 아주 활달하여 추진력은 단연 1등이나, 상대적으로 금(金)기운과 수(水)기운이 마를 수 있으니 한 템포 경청하는 지혜가 중요합니다.
              </p>
            </div>

            {/* SPECIAL RELATIONSHIP PRESCRIPTION (Addresses Response #3: "궁합이 좋지 않을 경우의 상생 솔루션/처방전") */}
            <div className="space-y-2 bg-emerald-50/40 border border-emerald-200/70 p-3 rounded-xl">
              <div className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-200" />
                <span className="text-[10px] font-bold text-emerald-800 block">🩹 [프리미엄 전용] 관계 극복 상생 처방전</span>
              </div>
              
              <div className="space-y-1.5 text-[10px] text-emerald-950">
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100 font-semibold">
                  <span className="text-amber-700 font-bold block mb-0.5">⚠️ 예측 갈등 요인: 금목상쟁(金木相爭)</span>
                  상대방의 칼날 같은 금(金)기운(칼같이 논리적 피드백)이 나의 목(木)기운(성장하려는 자존심)을 과도하게 벌목하여 상처를 입기 쉽습니다.
                </div>
                
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100 font-semibold">
                  <span className="text-emerald-700 font-bold block mb-0.5">💡 상생 치유책: 수(水)기운 오행 매개 요법</span>
                  불협화음을 정화시키는 <strong>물(水)기운</strong>이 정답입니다. 함께 물가나 조용한 카페에서 티타임을 가지며, 회의 전 서로의 장점을 딱 1가지씩만 먼저 칭찬한 뒤 의견을 교환하십시오. 대화의 윤활유 역할을 해줍니다.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Secure PG Trust Seal */}
      <div className="text-center text-[10px] text-[#8C7B6E] font-medium flex items-center justify-center gap-1 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>본 시스템은 Lemon Squeezy 공식 가상 보안 결제 샌드박스로 가동 중입니다.</span>
      </div>

      {/* ====================================
          PG PAYMENT SIMULATION OVERLAY MODAL
         ==================================== */}
      {isPaymentModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsPaymentModalOpen(false);
            }
          }}
        >
          <div className="w-full max-w-md bg-[#FAF7F2] border-2 border-[#C0392B] rounded-[24px] shadow-2xl overflow-hidden text-left relative animate-scale-up cursor-default">
            
            {/* Header */}
            <div className="bg-[#C0392B] text-[#FAF7F2] p-4 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 fill-amber-300 text-amber-500" />
                <span className="font-serif font-black text-xs tracking-wider">가상 보안 결제창 (Sandbox PG)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-[#FAF7F2] hover:text-white font-extrabold text-xs cursor-pointer bg-white/10 px-2.5 py-1 rounded"
              >
                닫기
              </button>
            </div>

            {/* Body */}
            <div className="p-5.5 space-y-4.5">
              
              {paymentStep === "idle" && (
                <div className="space-y-4.5 animate-fade-in">
                  {/* Product Confirmation Info Card */}
                  <div className="bg-white border border-[#E8E0D0] p-4 rounded-xl space-y-2.5">
                    <div className="text-[9px] text-[#C0392B] font-black uppercase tracking-wider bg-red-50 border border-red-100 px-2 py-0.5 rounded-md inline-block">
                      결제 승인 대상 품목
                    </div>
                    <div className="font-serif text-[13px] font-black text-[#2C3E50] leading-snug">
                      {currentProduct.title}
                    </div>
                    <div className="text-[10px] text-[#5A4D41] leading-relaxed bg-[#FAF8F5] p-2.5 rounded-lg border border-[#FAF0DE] font-medium">
                      {currentProduct.desc}
                    </div>
                    
                    <div className="flex justify-between items-center border-t border-[#FAF0DE] pt-3.5 mt-2 text-xs">
                      <span className="text-[10px] text-[#8C7B6E] font-bold">실결제 예정금액</span>
                      <span className="font-serif font-black text-[#C0392B] text-base flex items-center gap-1.5">
                        <span className="text-[10.5px] text-gray-400 line-through font-normal">
                          {currentProduct.originalPrice.toLocaleString()}원
                        </span>
                        <span>{currentProduct.price.toLocaleString()} 원</span>
                      </span>
                    </div>
                  </div>

                  {/* Billing Email Input Field */}
                  <div className="space-y-1.5">
                    <label htmlFor="billing-email-field" className="text-[10px] font-extrabold text-[#5A4D41] flex justify-between items-center">
                      <span>📩 결과 보고서 및 결제 영수증 수신 이메일</span>
                      <span className="text-[9px] text-[#C0392B] font-bold">*필수 입력</span>
                    </label>
                    <input
                      id="billing-email-field"
                      type="email"
                      value={billingEmail}
                      onChange={(e) => setBillingEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E8E0D0] rounded-lg focus:outline-none focus:border-[#C0392B] focus:ring-1 focus:ring-[#C0392B] text-[#2C3E50] font-medium"
                    />
                    <p className="text-[9.5px] text-[#8C7B6E]">
                      입력하신 이메일 주소로 디지털 영수증 및 발급 보고서 보관용 링크가 즉시 자동 전송됩니다.
                    </p>
                  </div>
                  
                  {/* Select Payment Method */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-[#5A4D41] block">💳 간편 가상 결제수단 선택</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("kakaopay")}
                        className={`py-2 text-[10px] font-extrabold rounded-lg border text-center transition-all cursor-pointer ${
                          paymentMethod === "kakaopay"
                            ? "border-[#FFE500] bg-[#FFE500] text-[#1A1A1C] shadow-2xs"
                            : "border-[#E8E0D0] bg-white text-[#8C7B6E] hover:border-[#FFE500]/50"
                        }`}
                      >
                        카카오페이
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("tosspay")}
                        className={`py-2 text-[10px] font-extrabold rounded-lg border text-center transition-all cursor-pointer ${
                          paymentMethod === "tosspay"
                            ? "border-blue-500 bg-blue-500 text-white shadow-2xs"
                            : "border-[#E8E0D0] bg-white text-[#8C7B6E] hover:border-blue-500/50"
                        }`}
                      >
                        토스페이
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("credit")}
                        className={`py-2 text-[10px] font-extrabold rounded-lg border text-center transition-all cursor-pointer ${
                          paymentMethod === "credit"
                            ? "border-[#2C3E50] bg-[#2C3E50] text-white shadow-2xs"
                            : "border-[#E8E0D0] bg-white text-[#8C7B6E] hover:border-[#2C3E50]/50"
                        }`}
                      >
                        신용카드
                      </button>
                    </div>
                  </div>

                  {/* Sandboxed Demo Warning */}
                  <div className="bg-amber-50 border border-amber-200/60 rounded-lg p-3 flex gap-2.5 text-[10px] leading-relaxed text-amber-950 font-semibold shadow-3xs">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      본 창은 안전 가상 PG 시뮬레이터입니다. 실제 수수료나 요금이 부과되지 않으며, 승인 즉시 모든 프리미엄 잠금이 영구 개방 및 동기화 처리됩니다.
                    </span>
                  </div>

                  {/* Submit button */}
                  <button
                    id="submit-payment-btn"
                    onClick={() => {
                      if (!billingEmail || !billingEmail.includes("@")) {
                        alert("올바른 이메일 주소를 입력해 주세요.");
                        return;
                      }
                      handleStartPayment();
                    }}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-serif font-black tracking-widest rounded-xl transition duration-200 cursor-pointer shadow-md"
                  >
                    가상 보안 결제 승인하기
                  </button>
                </div>
              )}

              {paymentStep === "processing" && (
                <div className="py-10 text-center space-y-4 animate-fade-in">
                  <RefreshCw className="w-10 h-10 animate-spin mx-auto text-[#C0392B]" />
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-[#2C3E50]">가상 결제 정보 대조 및 세션 동기화 중...</p>
                    <p className="text-[10px] text-[#8C7B6E]">보안 샌드박스망과 이메일 수신 서버를 인증하는 중입니다.</p>
                  </div>
                </div>
              )}

              {paymentStep === "success" && (
                <div className="space-y-4.5 animate-fade-in">
                  
                  {/* Success Title */}
                  <div className="text-center space-y-2">
                    <CheckCircle2 className="w-11 h-11 mx-auto text-emerald-600 animate-bounce" />
                    <div className="space-y-1">
                      <p className="text-[14px] font-serif font-black text-emerald-950">🎉 결제 승인 및 프리미엄 해금 완료!</p>
                      <p className="text-[10.5px] text-emerald-800 font-medium">모든 페이지의 제한 영역이 영구적으로 자동 해제되었습니다.</p>
                    </div>
                  </div>

                  {/* HIGH-FIDELITY DIGITAL EMAIL RECEIPT MOCKUP */}
                  <div className="bg-white border-2 border-dashed border-[#D6CCBC] rounded-xl p-4 space-y-3 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-[#C0392B] text-white text-[7.5px] font-bold px-2 py-0.5 rounded-bl uppercase tracking-wider">
                      sandbox-receipt
                    </div>
                    
                    <div className="flex items-center gap-1 text-[#C0392B] font-extrabold text-[10px]">
                      <Mail className="w-3.5 h-3.5" />
                      <span>이메일 디지털 영수증 (Invoice Email)</span>
                    </div>

                    <div className="border-t border-[#E8E0D0] pt-2.5 text-[10px] space-y-2 text-[#5A4D41]">
                      <div className="grid grid-cols-3 gap-1">
                        <span className="font-bold">영수증 번호:</span>
                        <span className="col-span-2 font-mono text-gray-900 font-medium">{receiptNo}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="font-bold">수신 이메일:</span>
                        <span className="col-span-2 text-gray-900 font-bold underline">{billingEmail}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="font-bold">결제 상품명:</span>
                        <span className="col-span-2 text-gray-900 font-extrabold leading-snug">{currentProduct.title}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="font-bold">결제 금액:</span>
                        <span className="col-span-2 text-[#C0392B] font-serif font-black">{currentProduct.price.toLocaleString()}원 (VAT 포함)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="font-bold">결제 수단:</span>
                        <span className="col-span-2 text-gray-900 font-medium">
                          {paymentMethod === "kakaopay" ? "카카오페이 (가상)" : paymentMethod === "tosspay" ? "토스페이 (가상)" : "신용카드 (가상)"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="font-bold">결제 승인일:</span>
                        <span className="col-span-2 text-gray-900 font-medium">
                          {new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} (KST)
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-[#E8E0D0] pt-2 mt-1 text-[9px] text-[#8C7B6E] leading-normal font-medium bg-[#FAF8F5] p-2 rounded">
                      🚀 <strong>안내:</strong> 해당 모임의 모든 오행 인연 궤도와 잠금 영역이 풀렸습니다. 이제 즉시 원형 네트워크 원본, 수평 오행 처방 대시보드를 자유롭게 확인하고 간직하실 수 있습니다!
                    </div>

                    {/* Copy receipt trigger button */}
                    <button
                      type="button"
                      onClick={() => {
                        const receiptText = `[인연 명당 영수증]\n번호: ${receiptNo}\n이메일: ${billingEmail}\n상품: ${currentProduct.title}\n금액: ${currentProduct.price.toLocaleString()}원\n승인일: ${new Date().toLocaleString()}`;
                        navigator.clipboard.writeText(receiptText);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="w-full py-1.5 border border-[#D6CCBC] hover:bg-[#FAF8F5] rounded-lg text-[9px] text-[#5A4D41] font-bold flex items-center justify-center gap-1 transition duration-150 cursor-pointer"
                    >
                      <Copy className="w-3 h-3 text-[#C0392B]" />
                      <span>{copied ? "✓ 영수증 클립보드에 복사 완료!" : "영수증 텍스트 복사하기"}</span>
                    </button>
                  </div>
                  
                  <button
                    id="close-success-modal-btn"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-serif font-black tracking-widest rounded-xl transition duration-200 cursor-pointer text-center shadow-md"
                  >
                    확인하고 대시보드 열람하기
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
    );
  };

  if (isModal) {
    return (
      <div 
        className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs overflow-y-auto cursor-pointer"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose?.();
          }
        }}
      >
        <div className="bg-[#FAF7F2] border border-amber-300 p-6 rounded-[28px] shadow-2xl max-w-md w-full relative max-h-[85vh] overflow-y-auto space-y-4 text-left animate-scale-up cursor-default">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-[#8C7B6E] hover:text-[#C0392B] p-2 rounded-full hover:bg-amber-100/30 cursor-pointer text-xs font-bold transition-all z-50 flex items-center gap-1"
          >
            <span>✕</span>
            <span>닫기</span>
          </button>
          {renderInner()}
        </div>
      </div>
    );
  }

  return renderInner();
}
