import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  Crown, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw, 
  Printer, 
  Eye, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Smile,
  Users,
  Ticket,
  KeyRound,
  Gift,
  Share2,
  Copy,
  UserPlus,
  X,
  CreditCard,
  Wallet,
  CheckCheck
} from "lucide-react";
import { 
  auth, 
  checkPremiumStatus, 
  checkProductUnlock, 
  activatePremiumSimulation, 
  deactivatePremiumSimulation, 
  deactivateProductSimulation, 
  redeemCoupon, 
  getUserTicketAccount, 
  consumeSingleUseTicket, 
  addTicketsToUser, 
  getUserMembershipInfo,
  getSystemPaymentSettings
} from "../lib/firebase";
import { UserTicketAccount, TicketProductType } from "../types";
import { logAnalyticsEvent } from "../lib/analytics";
import UpgradeToSocialModal from "./UpgradeToSocialModal";
import AuthModal from "./AuthModal";
import PdfReportModal from "./PdfReportModal";

interface PremiumPaywallProps {
  onStatusChange?: (isPremium: boolean) => void;
  inline?: boolean;
  titleText?: string;
  subtitleText?: string;
  memberCount?: number;
  initialTab?: "pdf" | "secret" | "group";
  isModal?: boolean;
  onClose?: () => void;
  roomCode?: string;
  pairKey?: string;
}

export default function PremiumPaywall({ 
  onStatusChange, 
  inline = false, 
  titleText, 
  subtitleText, 
  memberCount,
  initialTab,
  isModal = false,
  onClose,
  roomCode,
  pairKey
}: PremiumPaywallProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [isPdfUnlocked, setIsPdfUnlocked] = useState(false);
  const [isSecretUnlocked, setIsSecretUnlocked] = useState(false);
  const [isGroupUnlocked, setIsGroupUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activating, setActivating] = useState(false);
  const [message, setMessage] = useState("");
  
  // Ticket Account States
  const [ticketAccount, setTicketAccount] = useState<UserTicketAccount | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Interactive Shop States
  const [activeTab, setActiveTab] = useState<"pdf" | "secret" | "group">(initialTab || (memberCount !== undefined ? "group" : "pdf"));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [showSamplePreview, setShowSamplePreview] = useState(true);

  // Coupon States
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponSuccessMsg, setCouponSuccessMsg] = useState("");
  const [couponErrorMsg, setCouponErrorMsg] = useState("");
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState("");
  const [ticketErrorMsg, setTicketErrorMsg] = useState("");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPdfReportModalOpen, setIsPdfReportModalOpen] = useState(false);
  const couponInputRef = useRef<HTMLInputElement>(null);

  const membership = getUserMembershipInfo(auth.currentUser);

  // Master account checker (strictly used only if needed)
  const isMaster = auth.currentUser?.email?.toLowerCase() === "lhs41977@gmail.com";

  // System Payment ON/OFF State (Default: false, Preparation mode)
  const [isPaymentEnabled, setIsPaymentEnabled] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState("");

  // Checkout & Payment Modal States
  const [checkoutProduct, setCheckoutProduct] = useState<{
    id: string;
    title: string;
    price: number;
    originalPrice?: number;
    type: TicketProductType;
    ticketCount: number;
    badge?: string;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"kakaopay" | "tosspay" | "naverpay" | "card">("kakaopay");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{ title: string; count: number } | null>(null);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isModal) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isModal]);

  const syncUnlockStates = async () => {
    const status = await checkPremiumStatus();
    setIsPremium(status);
    const pdfStatus = await checkProductUnlock("pdf");
    const secretStatus = await checkProductUnlock("secret");
    const groupStatus = await checkProductUnlock("group");
    setIsPdfUnlocked(status || pdfStatus);
    setIsSecretUnlocked(status || secretStatus);
    setIsGroupUnlocked(status || groupStatus);
    
    // Fetch Ticket Account
    try {
      const acc = await getUserTicketAccount();
      setTicketAccount(acc);
    } catch (e) {
      console.debug("Failed loading ticket account:", e);
    }

    // Fetch System Payment Settings (ON/OFF)
    try {
      const payConfig = await getSystemPaymentSettings();
      setIsPaymentEnabled(payConfig.isPaymentEnabled);
      if (payConfig.noticeMessage) setPaymentNotice(payConfig.noticeMessage);
    } catch (e) {
      console.debug("Failed loading payment settings:", e);
    }

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

  // Handle Coupon Submit
  const handleApplyCoupon = async (codeToUse?: string) => {
    const targetCode = (codeToUse || couponInput).trim().toUpperCase();
    if (!targetCode) {
      setCouponErrorMsg("쿠폰 번호(코드)를 입력해 주세요.");
      return;
    }

    // Gate by Membership: Regular email user must upgrade to social
    if (membership.isEmailOnly) {
      setIsUpgradeModalOpen(true);
      return;
    }

    if (membership.isGuest) {
      setIsAuthModalOpen(true);
      return;
    }

    setCouponLoading(true);
    setCouponErrorMsg("");
    setCouponSuccessMsg("");

    try {
      const res = await redeemCoupon(targetCode);
      if (res.success) {
        setCouponSuccessMsg(res.message);
        setCouponInput("");
        logAnalyticsEvent({
          eventName: "unlock_coupon",
          category: "conversion",
          metadata: { couponCode: targetCode, productType: res.productType },
          roomCode
        });
        await syncUnlockStates();
      } else {
        setCouponErrorMsg(res.message);
      }
    } catch (e: any) {
      setCouponErrorMsg("쿠폰 적용 중 오류가 발생했습니다: " + (e.message || e));
    } finally {
      setCouponLoading(false);
    }
  };

  // Consume 1 Single-Use Ticket
  const handleConsumeTicket = async (type: TicketProductType) => {
    setTicketLoading(true);
    setTicketErrorMsg("");
    setTicketSuccessMsg("");

    try {
      const res = await consumeSingleUseTicket(type, {
        roomCode,
        pairKey,
        label: type === "pdf" ? "AI 심층 리포트 PDF" : type === "secret" ? "비밀 인연·속마음 상성" : "그룹 오행 총괄 분석"
      });

      if (res.success) {
        setTicketSuccessMsg(res.message);
        if (type === "pdf") {
          setIsPdfReportModalOpen(true);
        }
        logAnalyticsEvent({
          eventName: "ticket_consumed",
          category: "conversion",
          metadata: { productType: type, remainingTickets: res.remainingTickets, roomCode, pairKey },
          roomCode
        });
        await syncUnlockStates();
      } else {
        setTicketErrorMsg(res.message);
      }
    } catch (e: any) {
      setTicketErrorMsg("티켓 소모 처리 중 오류가 발생했습니다: " + (e.message || e));
    } finally {
      setTicketLoading(false);
    }
  };

  // Copy Referral Invite Link
  const handleCopyInviteLink = () => {
    const uid = auth.currentUser?.uid || localStorage.getItem("saju_fallback_guest_uid") || "guest";
    const inviteUrl = `${window.location.origin}${window.location.pathname}#/?ref=${encodeURIComponent(uid)}`;
    
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedInvite(true);
      logAnalyticsEvent({
        eventName: "invite_shared",
        category: "viral",
        metadata: { inviteUrl },
        roomCode
      });
      setTimeout(() => setCopiedInvite(false), 2500);
    });
  };

  const handleInitiatePurchase = (product: {
    id: string;
    title: string;
    price: number;
    originalPrice?: number;
    type: TicketProductType;
    ticketCount: number;
    badge?: string;
  }) => {
    if (membership.isGuest) {
      setIsAuthModalOpen(true);
      return;
    }
    setCheckoutProduct(product);
  };

  const handleConfirmPayment = async () => {
    if (!checkoutProduct) return;
    setIsProcessingPayment(true);
    try {
      // 1. Simulate secure payment gateway handshake
      await new Promise((r) => setTimeout(r, 900));

      const methodLabel =
        paymentMethod === "kakaopay"
          ? "카카오페이"
          : paymentMethod === "tosspay"
          ? "토스페이"
          : paymentMethod === "naverpay"
          ? "네이버페이"
          : "신용/체크카드";

      // 2. Add tickets to user account in Firestore
      await addTicketsToUser(
        checkoutProduct.type,
        checkoutProduct.ticketCount,
        `온라인 결제 (${methodLabel})`
      );

      // 3. Log analytics
      logAnalyticsEvent({
        eventName: "purchase_completed",
        category: "monetization",
        metadata: {
          item_id: checkoutProduct.id,
          item_name: checkoutProduct.title,
          value: checkoutProduct.price,
          currency: "KRW",
          payment_type: paymentMethod,
        }
      });

      // 4. Update states & show feedback
      await syncUnlockStates();
      setPaymentSuccessData({
        title: checkoutProduct.title,
        count: checkoutProduct.ticketCount,
      });
      setCheckoutProduct(null);
    } catch (err: any) {
      console.error("Payment error:", err);
      alert(err.message || "결제 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const focusCouponInput = (suggestedCode?: string) => {
    if (suggestedCode) {
      setCouponInput(suggestedCode);
    }
    couponInputRef.current?.focus();
    couponInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Remaining Tickets Calculations
  const pdfTickets = (ticketAccount?.tickets?.pdf || 0) + (ticketAccount?.tickets?.all || 0);
  const secretTickets = (ticketAccount?.tickets?.secret || 0) + (ticketAccount?.tickets?.all || 0);
  const groupTickets = (ticketAccount?.tickets?.group || 0) + (ticketAccount?.tickets?.all || 0);
  const totalTickets = (ticketAccount?.tickets?.pdf || 0) + (ticketAccount?.tickets?.secret || 0) + (ticketAccount?.tickets?.group || 0) + (ticketAccount?.tickets?.all || 0);

  const renderInner = () => {
    if (checking) {
      return (
        <div id="premium-shop-skeleton" className="space-y-5 animate-pulse text-left">
          {/* 1. Header Skeleton */}
          <div className="space-y-2">
            <div className="h-5 w-44 bg-[#DFD8CD] rounded-md" /> {/* Eyebrow badge */}
            <div className="h-7 w-3/4 bg-[#E5DFD5] rounded-lg" /> {/* Title */}
            <div className="space-y-1.5 pt-1">
              <div className="h-3.5 w-full bg-[#EFEBE4] rounded" />
              <div className="h-3.5 w-5/6 bg-[#EFEBE4] rounded" />
            </div>
          </div>

          {/* 2. Dual Card Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Box 1: My Tickets Account Skeleton */}
            <div className="bg-[#FAF6ED]/80 border-2 border-[#E8E0D0]/50 rounded-2xl p-4 space-y-3 shadow-3xs">
              <div className="flex items-center justify-between">
                <div className="h-4.5 w-28 bg-[#DFD8CD] rounded" />
                <div className="h-5 w-20 bg-[#E5DFD5] rounded-full" />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="h-11 bg-white/60 rounded-xl border border-[#E8E0D0]/40" />
                <div className="h-11 bg-white/60 rounded-xl border border-[#E8E0D0]/40" />
                <div className="h-11 bg-white/60 rounded-xl border border-[#E8E0D0]/40" />
              </div>
              <div className="h-3 w-11/12 bg-[#EFEBE4] rounded" />
            </div>

            {/* Box 2: Invite & Earn Skeleton */}
            <div className="bg-[#FAF6ED]/80 border-2 border-[#E8E0D0]/50 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-3xs">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-4.5 w-36 bg-[#DFD8CD] rounded" />
                  <div className="h-4 w-12 bg-[#EFEBE4] rounded" />
                </div>
                <div className="h-3 w-full bg-[#EFEBE4] rounded" />
              </div>
              <div className="h-8.5 w-full bg-[#E5DFD5] rounded-xl mt-2" />
            </div>
          </div>

          {/* 3. Coupon redemption Skeleton */}
          <div className="bg-[#FAF6ED]/80 border-2 border-[#E8E0D0]/60 rounded-2xl p-4.5 space-y-3.5 shadow-3xs">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5 flex-1">
                <div className="h-4.5 w-40 bg-[#DFD8CD] rounded" />
                <div className="h-3 w-3/4 bg-[#EFEBE4] rounded" />
              </div>
              <div className="h-5 w-24 bg-[#EFEBE4] rounded-full" />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <div className="h-9.5 flex-1 bg-white border border-[#DFD8CD] rounded-xl" />
              <div className="h-9.5 w-full sm:w-44 bg-[#E5DFD5] rounded-xl" />
            </div>
          </div>

          {/* 4. Tab Navigation Skeleton */}
          <div className="grid grid-cols-3 gap-1.5 bg-[#FAF6ED]/50 border border-[#E8E0D0]/60 p-1 rounded-xl">
            <div className="h-9.5 bg-[#C0392B]/10 rounded-lg" />
            <div className="h-9.5 bg-white/40 rounded-lg" />
            <div className="h-9.5 bg-white/40 rounded-lg" />
          </div>

          {/* 5. Tab Content Skeleton */}
          <div className="bg-[#FAF6ED]/40 border border-[#E8E0D0]/40 rounded-xl p-5 space-y-3.5">
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-2 flex-1">
                <div className="h-3.5 w-16 bg-[#DFD8CD] rounded" />
                <div className="h-4 w-2/3 bg-[#E5DFD5] rounded" />
              </div>
              <div className="h-6.5 w-24 bg-[#EFEBE4] rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-3.5 w-full bg-[#EFEBE4] rounded" />
              <div className="h-3.5 w-5/6 bg-[#EFEBE4] rounded" />
            </div>
            <div className="border-t border-dashed border-[#E8E0D0]/60 my-3 pt-3 space-y-2">
              <div className="h-3.5 w-4/5 bg-[#EFEBE4] rounded" />
              <div className="h-3.5 w-3/4 bg-[#EFEBE4] rounded" />
            </div>
          </div>

          {/* Center text indicating background loading is happening */}
          <div className="flex items-center justify-center gap-2 pt-2 text-xs text-[#5C5046]/70">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C0392B]" />
            <span>인연 상점 정보를 안전하게 불러오는 중입니다...</span>
          </div>
        </div>
      );
    }

    return (
      <div id="premium-shop-container" className={`${inline || isModal ? "p-0" : "bg-[#FFFDF9]/95 border border-[#E7E1D6] p-5.5 sm:p-6.5 rounded-[26px] shadow-md"} text-left space-y-4.5 animate-fade-in relative`}>
      
      {/* Premium Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-[#FDF3F1] border border-[#C0392B]/20 text-[9px] font-bold text-[#C0392B] rounded-md font-serif uppercase tracking-wider">
          <Gift className="w-3 h-3 text-[#C0392B]" />
          <span>1회 확인권 & 친구 초대 보상 센터</span>
        </div>
        <h4 className="font-serif text-base sm:text-lg font-black text-[#2C3E50] tracking-tight">
          {titleText || "👑 프리미엄 사주 상생 리포트 1회 확인권 해금"}
        </h4>
        <p className="text-[11px] text-[#5C5046] leading-relaxed font-medium">
          {subtitleText || "1회 확인권을 소모하여 단발성으로 심층 감정서를 열람할 수 있습니다. 이미 분석된 사주 데이터는 안전하게 보존되어 언제든 다시 확인권을 사용하시면 동일한 고품질 결과를 즉시 재열람할 수 있습니다."}
        </p>
      </div>

      {/* 🎟️ TICKET STATUS & INVITE REWARD DUAL CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* Box 1: My Tickets Account */}
        <div className="bg-gradient-to-br from-[#FFFDF9] to-[#FAF8F5] border-2 border-[#C0392B]/20 rounded-2xl p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-[#C0392B]" />
              <span className="font-serif font-black text-xs text-[#2C3E50]">내 보유 1회 확인권</span>
            </div>
            <span className="text-xs font-mono font-black text-[#C0392B] bg-[#FFFDF9] px-2 py-0.5 rounded-full border border-[#C0392B]/20 shadow-3xs">
              총 {totalTickets}장 보유
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
            <div className="bg-[#FFFDF9] p-1.5 rounded-xl border border-[#E7E1D6]">
              <span className="text-[#5C5046] block text-[8px] truncate">📄 PDF소장</span>
              <span className="font-extrabold text-[#2C3E50] font-mono text-[11px]">{(ticketAccount?.tickets?.pdf || 0)}장</span>
            </div>
            <div className="bg-[#FFFDF9] p-1.5 rounded-xl border border-[#E7E1D6]">
              <span className="text-[#5C5046] block text-[8px] truncate">🔒 비밀인연</span>
              <span className="font-extrabold text-[#2C3E50] font-mono text-[11px]">{(ticketAccount?.tickets?.secret || 0)}장</span>
            </div>
            <div className="bg-[#FFFDF9] p-1.5 rounded-xl border border-[#E7E1D6]">
              <span className="text-[#5C5046] block text-[8px] truncate">👥 그룹오행</span>
              <span className="font-extrabold text-[#2C3E50] font-mono text-[11px]">{(ticketAccount?.tickets?.group || 0)}장</span>
            </div>
            <div className="bg-[#FFF8EC] p-1.5 rounded-xl border border-amber-300">
              <span className="text-amber-800 block font-semibold text-[8px] truncate">🌟 올패스</span>
              <span className="font-extrabold text-amber-900 font-mono text-[11px]">{(ticketAccount?.tickets?.all || 0)}장</span>
            </div>
          </div>

          <p className="text-[9.5px] text-[#5C5046] leading-tight">
            * 1회 소모 시 해당 분석 결과가 해금되며, 모임방 데이터는 영구 보관됩니다.
          </p>
        </div>

        {/* Box 2: Invite & Earn Free Tickets */}
        <div className="bg-gradient-to-br from-[#F1F5F9] to-[#E2E8F0] border-2 border-[#1E293B]/20 rounded-2xl p-4 space-y-2.5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-[#1E293B]" />
                <span className="font-serif font-black text-xs text-[#1E293B]">친구 초대하고 무료 티켓 받기</span>
              </div>
              <span className="text-[9px] font-extrabold text-[#1E293B] bg-[#1E293B]/10 px-1.5 py-0.5 rounded">
                초대한 친구: {ticketAccount?.invitedCount || 0}명
              </span>
            </div>
            <p className="text-[9.5px] text-[#475569] mt-1 leading-snug">
              내 링크로 친구가 참여할 때마다 <strong>1회 확인권 +1장</strong>이 즉시 지급됩니다!
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyInviteLink}
            className="w-full py-2 px-3 bg-[#1E293B] hover:bg-[#0F172A] text-white font-serif font-extrabold text-[11px] rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            {copiedInvite ? (
              <>
                <Check className="w-3.5 h-3.5 text-white animate-bounce" />
                <span>초대 링크 복사 완료!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>내 친구 초대 링크 복사하기</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* 🎫 HIGHLIGHTED COUPON REDEMPTION CARD */}
      <div className="bg-gradient-to-br from-[#FFFDF9] via-[#FAF8F5] to-[#EFE9DF] border-2 border-[#E7E1D6] rounded-2xl p-4.5 sm:p-5 space-y-3.5 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-[#C0392B] text-white flex items-center justify-center text-sm shadow-3xs">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif font-extrabold text-xs sm:text-sm text-[#2C3E50] block">
                쿠폰 번호 등록 & 티켓 충전
              </span>
              <span className="text-[9.5px] text-[#5C5046] font-medium block">
                발급받으신 쿠폰 코드를 입력하시면 해당 1회 확인권이 즉시 충전됩니다.
              </span>
            </div>
          </div>
          <span className="text-[8.5px] font-black bg-[#FDF3F1] text-[#C0392B] px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 border border-[#C0392B]/20">
            무결제 쿠폰 전용
          </span>
        </div>

        {/* Input Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleApplyCoupon(); }} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <KeyRound className="w-4 h-4 text-[#C0392B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={couponInputRef}
              type="text"
              value={couponInput}
              onChange={(e) => {
                setCouponInput(e.target.value);
                setCouponErrorMsg("");
                setCouponSuccessMsg("");
              }}
              placeholder="전달받으신 쿠폰 번호를 입력하세요"
              maxLength={20}
              className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-[#E7E1D6] rounded-xl text-xs font-bold text-[#2C3E50] uppercase placeholder:normal-case placeholder:font-normal focus:outline-none focus:border-[#C0392B] focus:ring-2 focus:ring-[#C0392B]/10 transition-all shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={couponLoading}
            className="py-2.5 px-5 bg-gradient-to-r from-[#C0392B] to-[#962D22] hover:from-[#A93226] hover:to-[#7E2419] text-white font-serif font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            {couponLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>검증 중...</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>쿠폰 등록하여 티켓 받기</span>
              </>
            )}
          </button>
        </form>

        {/* Error Feedback */}
        {couponErrorMsg && (
          <div className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-xl flex items-center gap-1.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{couponErrorMsg}</span>
          </div>
        )}

        {/* Success Feedback */}
        {couponSuccessMsg && (
          <div className="text-[10.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 animate-fade-in shadow-xs">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 animate-bounce" />
            <span>{couponSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* 🚧 Preparation Notice Banner (When Payment is OFF) */}
      {!isPaymentEnabled && (
        <div className="bg-[#FAF7F2] border border-[#E0D8CC] rounded-3xl p-5 sm:p-6 space-y-2 text-center shadow-xs">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/90 text-amber-900 border border-amber-300/80 rounded-full text-xs font-bold font-serif">
            <span>🚧 실제 결제 시스템 정식 오픈 준비 중</span>
          </div>
          <h4 className="font-serif font-black text-sm sm:text-base text-[#2C3E50] mt-1">
            현재는 관리자 발급 쿠폰 및 친구 초대 보상으로 1회 확인권이 지급됩니다
          </h4>
          <p className="text-xs text-[#5C5046] leading-relaxed max-w-lg mx-auto">
            {paymentNotice || "보다 안정적이고 완벽한 서비스 제공을 위해 전자결제 심사 및 연동 준비 중입니다. 발급받으신 프로모션 쿠폰을 아래에 등록하시거나 친구를 초대하여 1회 확인권을 무료로 충전하여 이용하세요!"}
          </p>
        </div>
      )}

      {/* 💳 INSTANT PURCHASE TICKET PACKAGES (Only shown when Payment is ON) */}
      {isPaymentEnabled && (
        <div className="bg-gradient-to-br from-[#FFFDF9] via-[#FAF8F5] to-[#F5EFE6] border-2 border-amber-300/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center text-sm shadow-3xs">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="font-serif font-extrabold text-sm text-[#2C3E50] block">
                  1회 확인권 즉시 충전 패키지
                </span>
                <span className="text-[10px] text-[#5C5046] font-medium block">
                  원하는 수량만큼 간편결제(카카오·토스·카드)로 즉시 충전하여 바로 이용하세요.
                </span>
              </div>
            </div>
            <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full border border-amber-300">
              ⚡ 즉시 충전 & 평생 보관
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Option 1: 1 Ticket */}
            <div className="bg-white border border-[#E7E1D6] hover:border-[#C0392B] rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all shadow-3xs hover:shadow-xs">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10.5px] font-bold text-[#5C5046]">단건 충전</span>
                  <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">1회권</span>
                </div>
                <div className="mt-1.5">
                  <span className="text-lg font-serif font-black text-[#2C3E50]">₩1,900</span>
                  <span className="text-[10px] text-[#8C7E74] ml-1 font-sans">/ 1장</span>
                </div>
                <p className="text-[9.5px] text-[#6A5E53] mt-1 leading-snug">원하는 감정 결과 1회 즉시 열람</p>
              </div>
              <button
                type="button"
                onClick={() => handleInitiatePurchase({
                  id: "pkg_1",
                  title: "1회 확인권 1장",
                  price: 1900,
                  type: "all",
                  ticketCount: 1,
                })}
                className="w-full py-2.5 bg-[#FAF6EE] hover:bg-[#C0392B] text-[#C0392B] hover:text-white font-serif font-bold text-xs rounded-xl transition active:scale-95 border border-[#C0392B]/20 flex items-center justify-center gap-1 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>₩1,900 결제하기</span>
              </button>
            </div>

            {/* Option 2: 3 Tickets (Best Seller) */}
            <div className="bg-gradient-to-b from-[#FFFDF9] to-[#FDF4F2] border-2 border-[#C0392B] rounded-2xl p-4 flex flex-col justify-between space-y-3 relative shadow-xs">
              <div className="absolute -top-2.5 right-3 bg-[#C0392B] text-white text-[8.5px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                🔥 베스트 (31% 할인)
              </div>
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10.5px] font-bold text-[#C0392B]">인기 패키지</span>
                  <span className="text-[9px] bg-[#C0392B]/10 text-[#C0392B] px-1.5 py-0.5 rounded font-bold">3회권</span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-lg font-serif font-black text-[#C0392B]">₩3,900</span>
                  <span className="text-xs text-gray-400 line-through">₩5,700</span>
                </div>
                <p className="text-[9.5px] text-[#6A5E53] mt-1 leading-snug">장당 ₩1,300 (소모임·단짝 추천)</p>
              </div>
              <button
                type="button"
                onClick={() => handleInitiatePurchase({
                  id: "pkg_3",
                  title: "1회 확인권 3장 패키지",
                  price: 3900,
                  originalPrice: 5700,
                  type: "all",
                  ticketCount: 3,
                  badge: "인기 3회권"
                })}
                className="w-full py-2.5 bg-[#C0392B] hover:bg-[#A93226] text-white font-serif font-extrabold text-xs rounded-xl transition active:scale-95 shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>₩3,900 결제하기</span>
              </button>
            </div>

            {/* Option 3: 5 Tickets (Best Value) */}
            <div className="bg-white border border-[#E7E1D6] hover:border-[#C0392B] rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all shadow-3xs hover:shadow-xs">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10.5px] font-bold text-[#5C5046]">실속 패키지</span>
                  <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">5회권</span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-lg font-serif font-black text-[#2C3E50]">₩5,900</span>
                  <span className="text-xs text-gray-400 line-through">₩9,500</span>
                </div>
                <p className="text-[9.5px] text-[#6A5E53] mt-1 leading-snug">장당 ₩1,180 (38% 최대 할인)</p>
              </div>
              <button
                type="button"
                onClick={() => handleInitiatePurchase({
                  id: "pkg_5",
                  title: "1회 확인권 5장 실속 패키지",
                  price: 5900,
                  originalPrice: 9500,
                  type: "all",
                  ticketCount: 5,
                  badge: "실속 5회권"
                })}
                className="w-full py-2.5 bg-[#FAF6EE] hover:bg-[#C0392B] text-[#C0392B] hover:text-white font-serif font-bold text-xs rounded-xl transition active:scale-95 border border-[#C0392B]/20 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>₩5,900 결제하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="grid grid-cols-3 gap-1.5 bg-[#FAF8F5] border border-[#E8E0D0] p-1 rounded-2xl shadow-xs">
        <button
          id="tab-pdf-btn"
          type="button"
          onClick={() => setActiveTab("pdf")}
          className={`py-3 text-xs font-bold rounded-xl transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "pdf"
              ? "bg-[#C0392B] text-white shadow-xs font-serif tracking-tight"
              : "text-[#5C5046] hover:text-[#C0392B] hover:bg-white/60"
          }`}
        >
          <span>📄 PDF 심층 리포트</span>
          {isPdfUnlocked && <span className="text-[9px] bg-[#C0392B] text-white px-1.5 py-0.5 rounded-full font-bold">✓</span>}
        </button>
        <button
          id="tab-secret-btn"
          type="button"
          onClick={() => setActiveTab("secret")}
          className={`py-3 text-xs font-bold rounded-xl transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "secret"
              ? "bg-[#C0392B] text-white shadow-xs font-serif tracking-tight"
              : "text-[#5C5046] hover:text-[#C0392B] hover:bg-white/60"
          }`}
        >
          <span>🔒 비밀 인연·상성</span>
          {isSecretUnlocked && <span className="text-[9px] bg-[#C0392B] text-white px-1.5 py-0.5 rounded-full font-bold">✓</span>}
        </button>
        <button
          id="tab-group-btn"
          type="button"
          onClick={() => setActiveTab("group")}
          className={`py-3 text-xs font-bold rounded-xl transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "group"
              ? "bg-[#C0392B] text-white shadow-xs font-serif tracking-tight"
              : "text-[#5C5046] hover:text-[#C0392B] hover:bg-white/60"
          }`}
        >
          <span>👥 그룹 오행 분석</span>
          {isGroupUnlocked && <span className="text-[9px] bg-[#C0392B] text-white px-1.5 py-0.5 rounded-full font-bold">✓</span>}
        </button>
      </div>

      {/* Tab 1: PDF Deep Report */}
      {activeTab === "pdf" && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-gradient-to-b from-[#FDFCF9] to-[#FAF7F2] border border-[#E7E1D6] rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-[#FDF3F1] text-[#C0392B] font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wider">소장용 리포트</span>
                  {isPaymentEnabled && <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">₩2,900</span>}
                </div>
                <h5 className="font-serif font-black text-base text-[#2C3E50] mt-2 leading-snug">상세 AI 심층 사주 매칭 리포트 소장 & PDF 다운로드권</h5>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-[#C0392B] bg-[#FDF3F1] px-2.5 py-1 rounded-lg border border-[#C0392B]/20">
                  보유 티켓: {(ticketAccount?.tickets?.pdf || 0)}장
                </span>
              </div>
            </div>
            
            <p className="text-xs text-[#5C4D41] leading-relaxed">
              사주 원국 오행 배합 분석, 조후 및 조율 십신 정밀 비평과 평생의 운명 코드를 감정하여 고품격 전통 한지 테마 PDF 파일로 영구 소장할 수 있습니다.
            </p>
            
            <div className="border-t border-dashed border-[#EFE9DF] my-3 pt-3">
              <ul className="text-xs text-[#4A3E31] space-y-2.5 pl-0.5">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" /> 
                  <span>나와 소중한 인연 간의 사주 원국 정밀 비교 분석서</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" /> 
                  <span>출력 및 보관에 최적화된 고품격 전통 한지 레이아웃</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-2">
            {isPdfUnlocked ? (
              <div className="space-y-2">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-serif font-black text-xs sm:text-sm text-emerald-950 block">AI 심층 사주 매칭 리포트 해금 완료!</span>
                      <span className="text-[11px] text-emerald-800">언제든 원하시는 만큼 PDF 소장본을 다운로드 및 인쇄하실 수 있습니다.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPdfReportModalOpen(true)}
                    className="w-full sm:w-auto py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-serif font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Printer className="w-4 h-4 text-white" />
                    <span>📥 리포트 열기 & PDF 다운로드</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                {pdfTickets > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleConsumeTicket("pdf")}
                    disabled={ticketLoading}
                    className="flex-1 py-3.5 px-4 bg-gradient-to-r from-[#C0392B] to-[#962D22] hover:from-[#A93226] hover:to-[#7E2419] text-white font-serif font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-4 h-4 text-[#FFFDF9] shrink-0" />
                    <span>🎫 보유 1회 확인권으로 즉시 생성 & 다운로드 (잔여 {pdfTickets}장)</span>
                  </button>
                ) : isPaymentEnabled ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleInitiatePurchase({
                        id: "item_pdf",
                        title: "AI 심층 사주 매칭 리포트 PDF 다운로드권",
                        price: 2900,
                        type: "pdf",
                        ticketCount: 1,
                      })}
                      className="flex-1 py-3.5 px-4 bg-gradient-to-r from-[#C0392B] to-[#962D22] hover:from-[#A93226] hover:to-[#7E2419] text-white font-serif font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-4 h-4 text-[#FFFDF9] shrink-0" />
                      <span>💳 ₩2,900 즉시 결제하여 PDF 해금하기</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => focusCouponInput("PDF2026")}
                      className="py-3.5 px-4 bg-[#FAF8F5] hover:bg-[#F2ECE0] text-[#5C5046] border border-[#E7E1D6] font-serif font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Ticket className="w-4 h-4 text-[#C0392B] shrink-0" />
                      <span>쿠폰/친구초대</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => focusCouponInput("PDF2026")}
                    className="flex-1 py-3.5 px-4 bg-gradient-to-r from-[#C0392B] to-[#962D22] hover:from-[#A93226] hover:to-[#7E2419] text-white font-serif font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Ticket className="w-4 h-4 text-[#FFFDF9] shrink-0" />
                    <span>🎟️ 쿠폰 등록 & 친구 초대로 1회 확인권 받기</span>
                  </button>
                )}
              </div>
            )}

            {/* Direct Feedback Below PDF Action Button */}
            {ticketSuccessMsg && (
              <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 animate-fade-in shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 animate-bounce" />
                <span>{ticketSuccessMsg}</span>
              </div>
            )}
            {ticketErrorMsg && (
              <div className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-xl flex items-center gap-1.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{ticketErrorMsg}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Secret Compatibility */}
      {activeTab === "secret" && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-gradient-to-b from-[#FDFCF9] to-[#FAF7F2] border border-[#E7E1D6] rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-red-100 text-red-800 font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wider">1:1 심층 케미</span>
                  {isPaymentEnabled && <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">₩1,900</span>}
                </div>
                <h5 className="font-serif font-black text-base text-[#2C3E50] mt-2 leading-snug">모임 구성원 1:1 심층 인연 등급 & 기질 상성 해독권</h5>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-[#C0392B] bg-[#FDF3F1] px-2.5 py-1 rounded-lg border border-[#C0392B]/20">
                  보유 티켓: {(ticketAccount?.tickets?.secret || 0)}장
                </span>
              </div>
            </div>
            
            <p className="text-xs text-[#5C4D41] leading-relaxed">
              1:1 케미스트리 서열 등급(S, A, B, C, D, F)과 내면의 기질 상성 지도를 다이어그램으로 완전 분석합니다.
            </p>
            
            <div className="border-t border-dashed border-[#EFE9DF] my-3 pt-3">
              <ul className="text-xs text-[#4A3E31] space-y-2.5 pl-0.5">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" /> 
                  <span>모임 내 가장 조화로운 운명적 짝꿍(S등급 조합) 즉시 확인</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" /> 
                  <span>단순 겉궁합을 넘어선 오행 충/합 기반 심층 성향 궤적도</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              {secretTickets > 0 ? (
                <button
                  type="button"
                  onClick={() => handleConsumeTicket("secret")}
                  disabled={ticketLoading}
                  className="flex-1 py-3.5 px-4 bg-gradient-to-r from-[#C0392B] to-[#962D22] hover:from-[#A93226] hover:to-[#7E2419] text-white font-serif font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-4 h-4 text-[#FFFDF9] shrink-0" />
                  <span>🎫 보유 1회 확인권으로 1:1 심층 인연 열람하기 (잔여 {secretTickets}장)</span>
                </button>
              ) : isPaymentEnabled ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleInitiatePurchase({
                      id: "item_secret",
                      title: "1:1 심층 인연 등급 & 기질 상성 해독권",
                      price: 1900,
                      type: "secret",
                      ticketCount: 1,
                    })}
                    className="flex-1 py-3.5 px-4 bg-gradient-to-r from-[#C0392B] to-[#962D22] hover:from-[#A93226] hover:to-[#7E2419] text-white font-serif font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4 text-[#FFFDF9] shrink-0" />
                    <span>💳 ₩1,900 즉시 결제하여 1:1 케미 해금</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => focusCouponInput("SECRET2026")}
                    className="py-3.5 px-4 bg-[#FAF8F5] hover:bg-[#F2ECE0] text-[#5C5046] border border-[#E7E1D6] font-serif font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Ticket className="w-4 h-4 text-[#C0392B] shrink-0" />
                    <span>쿠폰/친구초대</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => focusCouponInput("SECRET2026")}
                  className="flex-1 py-3.5 px-4 bg-gradient-to-r from-[#C0392B] to-[#962D22] hover:from-[#A93226] hover:to-[#7E2419] text-white font-serif font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Ticket className="w-4 h-4 text-[#FFFDF9] shrink-0" />
                  <span>🎟️ 쿠폰 등록 & 친구 초대로 1회 확인권 받기</span>
                </button>
              )}
            </div>

            {/* Direct Feedback Below Secret Action Button */}
            {ticketSuccessMsg && (
              <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 animate-fade-in shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 animate-bounce" />
                <span>{ticketSuccessMsg}</span>
              </div>
            )}
            {ticketErrorMsg && (
              <div className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-xl flex items-center gap-1.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{ticketErrorMsg}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Group Analysis */}
      {activeTab === "group" && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-gradient-to-b from-[#FDFCF9] to-[#FAF7F2] border border-[#E7E1D6] rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-[#C0392B]/10 text-[#C0392B] font-extrabold px-2.5 py-0.5 rounded border border-[#C0392B]/20 uppercase tracking-wider">소모임 맞춤형</span>
                  {isPaymentEnabled && <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">₩3,900</span>}
                </div>
                <h5 className="font-serif font-black text-base text-[#2C3E50] mt-2 leading-snug">모임 전체 인원의 오행 상생 궁합 총괄 보고서</h5>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-[#C0392B] bg-[#FDF3F1] px-2.5 py-1 rounded-lg border border-[#C0392B]/20">
                  보유 티켓: {(ticketAccount?.tickets?.group || 0)}장
                </span>
              </div>
            </div>
            
            <p className="text-xs text-[#5C4D41] leading-relaxed">
              모든 구성원의 오행(목, 화, 토, 금, 수)이 조화를 이루는지 한눈에 보여주는 순환 에너지 분포와 최적의 그룹 처방을 제공합니다.
            </p>

            <div className="border-t border-dashed border-[#EFE9DF] my-3 pt-3">
              <ul className="text-xs text-[#4A3E31] space-y-2.5 pl-0.5">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" /> 
                  <span>모임 전체 오행 분포도 및 부족/과다 기운 처방</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" /> 
                  <span>모든 참여자 간 1:1 전수 매칭 케미스트리 종합 리포트</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              {groupTickets > 0 ? (
                <button
                  type="button"
                  onClick={() => handleConsumeTicket("group")}
                  disabled={ticketLoading}
                  className="flex-1 py-3.5 px-4 bg-[#C0392B] hover:bg-[#A93226] text-white font-serif font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Users className="w-4 h-4 text-[#FFFDF9] shrink-0" />
                  <span>🎫 보유 1회 확인권으로 그룹 오행 열람하기 (잔여 {groupTickets}장)</span>
                </button>
              ) : isPaymentEnabled ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleInitiatePurchase({
                      id: "item_group",
                      title: "모임 전체 인원 오행 상생 궁합 총괄 보고서",
                      price: 3900,
                      type: "group",
                      ticketCount: 1,
                    })}
                    className="flex-1 py-3.5 px-4 bg-gradient-to-r from-[#C0392B] to-[#962D22] hover:from-[#A93226] hover:to-[#7E2419] text-white font-serif font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4 text-[#FFFDF9] shrink-0" />
                    <span>💳 ₩3,900 즉시 결제하여 그룹오행 해금</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => focusCouponInput("GROUP2026")}
                    className="py-3.5 px-4 bg-[#FAF8F5] hover:bg-[#F2ECE0] text-[#5C5046] border border-[#E7E1D6] font-serif font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Ticket className="w-4 h-4 text-[#C0392B] shrink-0" />
                    <span>쿠폰/친구초대</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => focusCouponInput("GROUP2026")}
                  className="flex-1 py-3.5 px-4 bg-gradient-to-r from-[#C0392B] to-[#962D22] hover:from-[#A93226] hover:to-[#7E2419] text-white font-serif font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Ticket className="w-4 h-4 text-[#FFFDF9] shrink-0" />
                  <span>🎟️ 쿠폰 등록 & 친구 초대로 1회 확인권 받기</span>
                </button>
              )}
            </div>

            {/* Direct Feedback Below Group Action Button */}
            {ticketSuccessMsg && (
              <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 animate-fade-in shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 animate-bounce" />
                <span>{ticketSuccessMsg}</span>
              </div>
            )}
            {ticketErrorMsg && (
              <div className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-xl flex items-center gap-1.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{ticketErrorMsg}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COLLAPSIBLE PREVIEW SECTION */}
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
          <span className="text-[10px] text-[#5C5046]">
            {showSamplePreview ? "▲ 닫기" : "▼ 펼쳐서 샘플 확인"}
          </span>
        </button>

        {showSamplePreview && (
          <div className="p-4 space-y-4 text-left animate-fade-in text-xs leading-relaxed max-h-[300px] overflow-y-auto scrollbar-thin">
            
            {/* Header Mock */}
            <div className="text-center pb-2.5 border-b border-dashed border-[#E8E0D0]">
              <span className="font-serif text-[10px] text-[#C0392B] bg-[#FDF3F1] px-2 py-0.5 rounded border border-[#C0392B]/20 font-bold inline-block">
                [샘플 예시] 홍길동 님의 평생 사주명리 보배 감정서
              </span>
              <h6 className="font-serif font-extrabold text-sm text-[#2C3E50] mt-1.5">
                일간 갑목(甲木)의 대림목(大林木) 기운과 10년 대운
              </h6>
            </div>

            {/* SPECIAL RELATIONSHIP PRESCRIPTION */}
            <div className="space-y-2 bg-emerald-50/40 border border-emerald-200/70 p-3 rounded-xl">
              <div className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-200" />
                <span className="text-[10px] font-bold text-emerald-800 block">🩹 [프리미엄 전용] 관계 극복 상생 처방전</span>
              </div>
              
              <div className="space-y-1.5 text-[10px] text-emerald-950">
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100 font-semibold">
                  <span className="text-amber-700 font-bold block mb-0.5">⚠️ 예측 갈등 요인: 금목상쟁(金木相爭)</span>
                  상대방의 칼날 같은 금(金)기운이 나의 목(木)기운을 과도하게 벌목하여 상처를 입기 쉽습니다.
                </div>
                
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100 font-semibold">
                  <span className="text-emerald-700 font-bold block mb-0.5">💡 상생 치유책: 수(水)기운 오행 매개 요법</span>
                  불협화음을 정화시키는 <strong>물(水)기운</strong>이 정답입니다. 함께 물가나 조용한 카페에서 티타임을 가지며 대화의 윤활유를 채우세요.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Secure Guarantee Guidance */}
      <div className="text-center text-[10.5px] text-[#5C5046] font-medium flex items-center justify-center gap-1.5 pt-2 border-t border-[#EFE9DF]">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>인연 명당은 1회 확인권 소모 후에도 사주 원국 분석 데이터를 안전하게 보관합니다.</span>
      </div>

    </div>
    );
  };

  // 💳 Interactive Checkout Modal Component
  const renderCheckoutModal = () => {
    if (!checkoutProduct) return null;

    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-left">
        <div className="bg-[#FAF7F2] border-2 border-amber-400/80 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-left animate-scale-up relative">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E0D0] bg-[#FCFAF7]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 font-serif font-bold text-sm">
                💳
              </div>
              <div>
                <h4 className="font-serif font-extrabold text-sm text-[#2C3E50]">안전 간편결제 주문서</h4>
                <span className="text-[10px] text-[#5C5046]">SSL 256-bit 보안 암호화 결제</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => !isProcessingPayment && setCheckoutProduct(null)}
              disabled={isProcessingPayment}
              className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 text-xs">
            {/* Product Summary Box */}
            <div className="bg-white border border-[#E7E1D6] rounded-2xl p-4 space-y-2.5 shadow-2xs">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[10px] font-bold text-[#C0392B] bg-[#FDF3F1] px-2 py-0.5 rounded">주문 상품</span>
                  <h5 className="font-serif font-black text-sm text-[#2C3E50] mt-1">{checkoutProduct.title}</h5>
                </div>
                {checkoutProduct.badge && (
                  <span className="text-[9px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full shrink-0">
                    {checkoutProduct.badge}
                  </span>
                )}
              </div>

              <div className="border-t border-dashed border-stone-200 pt-2 flex justify-between items-baseline">
                <span className="text-[11px] text-[#5C5046] font-medium">충전 티켓 수량</span>
                <span className="font-serif font-extrabold text-xs text-[#2C3E50]">1회 확인권 {checkoutProduct.ticketCount}장</span>
              </div>

              <div className="border-t border-stone-200 pt-2 flex justify-between items-baseline">
                <span className="text-xs font-bold text-[#2C3E50]">최종 결제 금액 (VAT 포함)</span>
                <div className="text-right">
                  {checkoutProduct.originalPrice && (
                    <span className="text-[10px] text-gray-400 line-through mr-1.5">
                      ₩{checkoutProduct.originalPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="text-lg font-serif font-black text-[#C0392B]">
                    ₩{checkoutProduct.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-[#2C3E50] block">결제 수단 선택</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("kakaopay")}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    paymentMethod === "kakaopay"
                      ? "bg-[#FEE500]/20 border-[#FEE500] text-[#3C1E1E] shadow-2xs font-extrabold ring-1 ring-[#FEE500]"
                      : "bg-white border-stone-200 hover:bg-stone-50 text-stone-700"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FEE500] inline-block border border-amber-600/30" />
                    카카오페이
                  </span>
                  <span className="text-[10px] font-mono text-amber-900">간편결제</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("tosspay")}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    paymentMethod === "tosspay"
                      ? "bg-blue-50 border-blue-400 text-blue-900 shadow-2xs font-extrabold ring-1 ring-blue-400"
                      : "bg-white border-stone-200 hover:bg-stone-50 text-stone-700"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    토스페이
                  </span>
                  <span className="text-[10px] font-mono text-blue-900">원클릭</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("naverpay")}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    paymentMethod === "naverpay"
                      ? "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-2xs font-extrabold ring-1 ring-emerald-400"
                      : "bg-white border-stone-200 hover:bg-stone-50 text-stone-700"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    네이버페이
                  </span>
                  <span className="text-[10px] font-mono text-emerald-900">포인트</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    paymentMethod === "card"
                      ? "bg-stone-100 border-stone-400 text-stone-900 shadow-2xs font-extrabold ring-1 ring-stone-400"
                      : "bg-white border-stone-200 hover:bg-stone-50 text-stone-700"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-stone-600" />
                    신용/체크카드
                  </span>
                  <span className="text-[10px] font-mono text-stone-600">모든 카드</span>
                </button>
              </div>
            </div>

            {/* Legal Notice */}
            <p className="text-[9px] text-stone-500 leading-snug">
              구매 즉시 디지털 확인권이 계정에 지급되며, 사용 전 7일 이내 환불 가능합니다. (전자상거래법 준수)
            </p>

            {/* Pay Button */}
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isProcessingPayment}
              className="w-full py-3.5 bg-gradient-to-r from-[#C0392B] to-[#962D22] hover:from-[#A93226] hover:to-[#7E2419] text-white font-serif font-black text-sm rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              {isProcessingPayment ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>안전 결제 승인 요청 중...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>₩{checkoutProduct.price.toLocaleString()} 안전 결제하기</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 🎉 Payment Success Confirmation Modal
  const renderPaymentSuccessModal = () => {
    if (!paymentSuccessData) return null;

    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-left">
        <div className="bg-[#FAF7F2] border-2 border-emerald-400 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-scale-up">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="font-serif font-black text-base text-[#2C3E50]">결제가 정상 완료되었습니다!</h4>
            <p className="text-xs text-[#5C5046]">
              <strong>{paymentSuccessData.title}</strong> 결제가 승인되어 1회 확인권 <strong>{paymentSuccessData.count}장</strong>이 즉시 충전되었습니다.
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs font-bold text-emerald-900">
            ✨ 지금 바로 원하시는 사주 분석을 해금하여 열람하세요!
          </div>

          <button
            type="button"
            onClick={() => setPaymentSuccessData(null)}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-serif font-bold text-xs rounded-xl shadow-xs transition active:scale-98 cursor-pointer"
          >
            확인 및 상점으로 돌아가기
          </button>
        </div>
      </div>
    );
  };

  if (isModal) {
    const modalContent = (
      <div 
        id="premium-paywall-portal-overlay"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto cursor-pointer"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose?.();
          }
        }}
      >
        <div className="bg-[#FAF7F2] border-2 border-amber-400 rounded-3xl shadow-2xl max-w-2xl md:max-w-3xl w-full relative max-h-[92vh] flex flex-col overflow-hidden text-left animate-scale-up cursor-default my-auto">
          {/* Modal Sticky Header with highly visible Close Button */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#E8E0D0] bg-[#FCFAF7] shrink-0 sticky top-0 z-30 shadow-2xs">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 font-serif text-sm font-bold shadow-2xs">
                緣
              </div>
              <div>
                <span className="font-serif font-bold text-sm sm:text-base text-[#2C3E50] block">
                  인연 상점 (1회 확인권 & 쿠폰)
                </span>
                <span className="text-[10px] text-[#5C5046] font-medium hidden sm:block">
                  사주 상생 해법과 맞춤형 프리미엄 1회권 관리
                </span>
              </div>
            </div>
            
            {/* Highly Prominent Close Button for Mobile & Desktop */}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-red-500 hover:text-white text-[#2C3E50] border border-stone-300 hover:border-red-600 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0"
              aria-label="상점 닫기"
            >
              <X className="w-4 h-4" />
              <span>닫기</span>
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-4 sm:p-6 md:p-7 overflow-y-auto space-y-5 flex-1">
            {renderInner()}
          </div>

          {/* Bottom Mobile-friendly Close Footer Bar */}
          <div className="px-4 py-3 bg-[#FCFAF7] border-t border-[#E8E0D0] shrink-0 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#1E293B] hover:bg-[#0F172A] text-white font-serif font-bold text-xs rounded-xl shadow-xs transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>상점 창 닫기</span>
            </button>
          </div>
        </div>
      </div>
    );

    if (typeof document !== "undefined") {
      return createPortal(
        <>
          {modalContent}
          {renderCheckoutModal()}
          {renderPaymentSuccessModal()}
          <UpgradeToSocialModal
            isOpen={isUpgradeModalOpen}
            onClose={() => setIsUpgradeModalOpen(false)}
            triggerReason="use_coupon"
            onSuccess={() => {
              syncUnlockStates();
            }}
          />
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onSuccess={() => {
              syncUnlockStates();
            }}
          />
          <PdfReportModal
            isOpen={isPdfReportModalOpen}
            onClose={() => setIsPdfReportModalOpen(false)}
            roomCode={roomCode}
          />
        </>,
        document.body
      );
    }
    return (
      <>
        {modalContent}
        {renderCheckoutModal()}
        {renderPaymentSuccessModal()}
        <UpgradeToSocialModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          triggerReason="use_coupon"
          onSuccess={() => {
            syncUnlockStates();
          }}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => {
            syncUnlockStates();
          }}
        />
        <PdfReportModal
          isOpen={isPdfReportModalOpen}
          onClose={() => setIsPdfReportModalOpen(false)}
          roomCode={roomCode}
        />
      </>
    );
  }

  return (
    <>
      {renderInner()}
      {renderCheckoutModal()}
      {renderPaymentSuccessModal()}
      <UpgradeToSocialModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        triggerReason="use_coupon"
        onSuccess={() => {
          syncUnlockStates();
        }}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          syncUnlockStates();
        }}
      />
      <PdfReportModal
        isOpen={isPdfReportModalOpen}
        onClose={() => setIsPdfReportModalOpen(false)}
        roomCode={roomCode}
      />
    </>
  );
}
