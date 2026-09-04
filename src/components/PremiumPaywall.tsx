import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ShieldCheck,
  RefreshCw,
  Printer,
  Eye,
  CheckCircle2,
  AlertCircle,
  Share2,
  X
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
        <div id="premium-shop-skeleton" className="space-y-4 text-left">
          <div className="space-y-2">
            <div className="h-6 w-2/3 bg-sunken rounded-xl" />
            <div className="h-4 w-5/6 bg-sunken rounded-xl" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="h-28 bg-sunken rounded-xl" />
            <div className="h-28 bg-sunken rounded-xl" />
          </div>

          <div className="h-32 bg-sunken rounded-xl" />
          <div className="h-11 bg-sunken rounded-xl" />
          <div className="h-40 bg-sunken rounded-xl" />

          <div className="flex items-center justify-center gap-2 pt-2 text-xs text-ink-faint">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>상점 정보를 불러오는 중입니다</span>
          </div>
        </div>
      );
    }

    return (
      <div id="premium-shop-container" className={`${inline || isModal ? "p-0" : "bg-surface border border-line p-5 sm:p-6 rounded-xl"} text-left space-y-5 animate-fade-in relative`}>

      {/* Header */}
      <div className="space-y-1.5">
        <h4 className="font-serif text-lg font-semibold text-ink">
          {titleText || "1회 확인권으로 심층 분석 열람"}
        </h4>
        <p className="text-sm text-ink-soft leading-relaxed">
          {subtitleText || "확인권 1장으로 심층 감정서를 한 번 열람할 수 있어요. 분석된 사주 데이터는 보관되므로 확인권을 다시 사용하면 같은 결과를 언제든 열람할 수 있어요."}
        </p>
      </div>

      {/* Ticket status & invite reward */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Box 1: My Tickets Account */}
        <div className="bg-sunken rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">내 확인권</span>
            <span className="text-xs font-mono text-ink-soft">총 {totalTickets}장</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center">
            <div className="bg-surface p-2 rounded-lg">
              <span className="text-xs text-ink-faint block truncate">PDF</span>
              <span className="text-sm font-semibold font-mono text-ink">{(ticketAccount?.tickets?.pdf || 0)}</span>
            </div>
            <div className="bg-surface p-2 rounded-lg">
              <span className="text-xs text-ink-faint block truncate">비밀 인연</span>
              <span className="text-sm font-semibold font-mono text-ink">{(ticketAccount?.tickets?.secret || 0)}</span>
            </div>
            <div className="bg-surface p-2 rounded-lg">
              <span className="text-xs text-ink-faint block truncate">그룹 오행</span>
              <span className="text-sm font-semibold font-mono text-ink">{(ticketAccount?.tickets?.group || 0)}</span>
            </div>
            <div className="bg-surface p-2 rounded-lg">
              <span className="text-xs text-ink-faint block truncate">올패스</span>
              <span className="text-sm font-semibold font-mono text-ink">{(ticketAccount?.tickets?.all || 0)}</span>
            </div>
          </div>

          <p className="text-xs text-ink-faint leading-relaxed">
            확인권 1장을 사용하면 해당 분석이 열리고, 모임 데이터는 계속 보관됩니다.
          </p>
        </div>

        {/* Box 2: Invite & Earn */}
        <div className="bg-sunken rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">친구 초대</span>
              <span className="text-xs text-ink-faint">초대한 친구 {ticketAccount?.invitedCount || 0}명</span>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              내 링크로 친구가 참여할 때마다 확인권 1장이 지급됩니다.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyInviteLink}
            className="w-full py-2.5 px-3 bg-surface hover:bg-line text-ink text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copiedInvite ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>초대 링크가 복사되었습니다</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>초대 링크 복사</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Coupon redemption */}
      <div className="bg-sunken rounded-xl p-4 sm:p-5 space-y-3">
        <div className="space-y-1">
          <span className="text-sm font-semibold text-ink block">쿠폰 등록</span>
          <span className="text-xs text-ink-soft block">
            발급받은 쿠폰 번호를 입력하면 해당 확인권이 충전됩니다.
          </span>
        </div>

        {/* Input Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleApplyCoupon(); }} className="flex flex-col sm:flex-row gap-2">
          <input
            ref={couponInputRef}
            type="text"
            value={couponInput}
            onChange={(e) => {
              setCouponInput(e.target.value);
              setCouponErrorMsg("");
              setCouponSuccessMsg("");
            }}
            placeholder="쿠폰 번호 입력"
            maxLength={20}
            className="flex-1 min-w-0 px-4 py-2.5 bg-surface rounded-xl text-sm text-ink font-mono uppercase placeholder:normal-case placeholder:font-sans placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-ink"
          />
          <button
            type="submit"
            disabled={couponLoading}
            className="py-2.5 px-5 bg-seal hover:bg-seal-deep disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            {couponLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>확인 중</span>
              </>
            ) : (
              <span>쿠폰 등록</span>
            )}
          </button>
        </form>

        {/* Error Feedback */}
        {couponErrorMsg && (
          <p className="text-xs text-seal font-medium flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{couponErrorMsg}</span>
          </p>
        )}

        {/* Success Feedback */}
        {couponSuccessMsg && (
          <p className="text-xs text-ink font-medium bg-surface p-3 rounded-xl flex items-center gap-1.5 animate-fade-in">
            <Check className="w-4 h-4 text-ink-soft shrink-0" />
            <span>{couponSuccessMsg}</span>
          </p>
        )}
      </div>

      {/* Preparation Notice (When Payment is OFF) */}
      {!isPaymentEnabled && (
        <div className="bg-sunken rounded-xl p-5 space-y-1.5 text-center">
          <h4 className="text-sm font-semibold text-ink">
            결제 기능은 준비 중입니다
          </h4>
          <p className="text-xs text-ink-soft leading-relaxed max-w-lg mx-auto">
            {paymentNotice || "지금은 관리자 발급 쿠폰과 친구 초대 보상으로 확인권이 지급됩니다. 쿠폰이 있다면 위에서 등록해 주세요."}
          </p>
        </div>
      )}

      {/* Ticket packages (Only shown when Payment is ON) */}
      {isPaymentEnabled && (
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-sm font-semibold text-ink block">확인권 충전</span>
            <span className="text-xs text-ink-soft block">
              간편결제(카카오·토스·카드)로 원하는 수량을 충전할 수 있습니다.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Option 1: 1 Ticket */}
            <div className="bg-sunken rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-medium text-ink-soft">단건 충전 · 1회권</span>
                <div className="mt-1.5">
                  <span className="text-lg font-semibold text-ink">₩1,900</span>
                  <span className="text-xs text-ink-faint ml-1">/ 1장</span>
                </div>
                <p className="text-xs text-ink-soft mt-1 leading-relaxed">원하는 분석 결과 1회 열람</p>
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
                className="w-full py-2.5 bg-surface hover:bg-line text-ink text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                ₩1,900 결제
              </button>
            </div>

            {/* Option 2: 3 Tickets */}
            <div className="bg-sunken rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-medium text-seal">3회권 · 가장 많이 선택</span>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-lg font-semibold text-ink">₩3,900</span>
                  <span className="text-xs text-ink-faint line-through">₩5,700</span>
                </div>
                <p className="text-xs text-ink-soft mt-1 leading-relaxed">장당 ₩1,300</p>
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
                className="w-full py-2.5 bg-seal hover:bg-seal-deep text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                ₩3,900 결제
              </button>
            </div>

            {/* Option 3: 5 Tickets */}
            <div className="bg-sunken rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-medium text-ink-soft">5회권</span>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-lg font-semibold text-ink">₩5,900</span>
                  <span className="text-xs text-ink-faint line-through">₩9,500</span>
                </div>
                <p className="text-xs text-ink-soft mt-1 leading-relaxed">장당 ₩1,180</p>
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
                className="w-full py-2.5 bg-surface hover:bg-line text-ink text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                ₩5,900 결제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 내 보유 혜택 & 해금 현황 요약 대시보드 */}
      <div className="bg-sunken rounded-xl p-3.5 space-y-2 border border-line/60">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-seal" />
            내 보유 혜택 & 해금 현황
          </span>
          <span className="text-[11px] text-ink-faint">
            총 확인권 {totalTickets}장
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className={`p-2 rounded-lg border text-xs ${isPdfUnlocked ? 'bg-surface border-seal/40 text-seal font-semibold' : 'bg-surface/50 border-line text-ink-soft'}`}>
            <div className="text-[11px] truncate">📑 PDF 감정서</div>
            <div className="text-[10px] mt-0.5 font-medium">{isPdfUnlocked ? "해금 완료" : `잔여 ${pdfTickets}장`}</div>
          </div>
          <div className={`p-2 rounded-lg border text-xs ${isSecretUnlocked ? 'bg-surface border-seal/40 text-seal font-semibold' : 'bg-surface/50 border-line text-ink-soft'}`}>
            <div className="text-[11px] truncate">🔮 비밀 인연</div>
            <div className="text-[10px] mt-0.5 font-medium">{isSecretUnlocked ? "해금 완료" : `잔여 ${secretTickets}장`}</div>
          </div>
          <div className={`p-2 rounded-lg border text-xs ${isGroupUnlocked ? 'bg-surface border-seal/40 text-seal font-semibold' : 'bg-surface/50 border-line text-ink-soft'}`}>
            <div className="text-[11px] truncate">👥 그룹 총평</div>
            <div className="text-[10px] mt-0.5 font-medium">{isGroupUnlocked ? "해금 완료" : `잔여 ${groupTickets}장`}</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-sunken p-1 rounded-xl gap-1 text-xs">
        <button
          id="tab-pdf-btn"
          type="button"
          onClick={() => setActiveTab("pdf")}
          className={`flex-1 py-2.5 px-2 rounded-lg transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "pdf"
              ? "bg-surface text-ink font-semibold"
              : "text-ink-soft hover:text-ink font-medium"
          }`}
        >
          <span>PDF 리포트</span>
          {isPdfUnlocked && <Check className="w-3.5 h-3.5 text-seal shrink-0" />}
        </button>
        <button
          id="tab-secret-btn"
          type="button"
          onClick={() => setActiveTab("secret")}
          className={`flex-1 py-2.5 px-2 rounded-lg transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "secret"
              ? "bg-surface text-ink font-semibold"
              : "text-ink-soft hover:text-ink font-medium"
          }`}
        >
          <span>비밀 인연</span>
          {isSecretUnlocked && <Check className="w-3.5 h-3.5 text-seal shrink-0" />}
        </button>
        <button
          id="tab-group-btn"
          type="button"
          onClick={() => setActiveTab("group")}
          className={`flex-1 py-2.5 px-2 rounded-lg transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "group"
              ? "bg-surface text-ink font-semibold"
              : "text-ink-soft hover:text-ink font-medium"
          }`}
        >
          <span>그룹 오행</span>
          {isGroupUnlocked && <Check className="w-3.5 h-3.5 text-seal shrink-0" />}
        </button>
      </div>

      {/* Tab 1: PDF Deep Report */}
      {activeTab === "pdf" && (
        <div className="space-y-3 animate-fade-in">
          <div className="bg-sunken rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1">
                <span className="text-xs text-ink-faint block">
                  소장용 리포트{isPaymentEnabled && " · ₩2,900"}
                </span>
                <h5 className="text-[15px] font-semibold text-ink leading-snug">심층 사주 리포트 PDF 소장</h5>
              </div>
              <span className="text-xs text-ink-soft bg-surface px-2.5 py-1 rounded-lg shrink-0">
                보유 {(ticketAccount?.tickets?.pdf || 0)}장
              </span>
            </div>

            <p className="text-sm text-ink-soft leading-relaxed">
              사주 원국의 오행 배합과 십신 구성을 풀이해 한지 테마 PDF로 저장할 수 있어요.
            </p>

            <ul className="text-sm text-ink-soft space-y-2 pt-3 border-t border-line">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-ink-faint shrink-0 mt-0.5" />
                <span>나와 인연 간의 사주 원국 비교 분석서</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-ink-faint shrink-0 mt-0.5" />
                <span>출력과 보관에 맞춘 한지 레이아웃</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            {isPdfUnlocked ? (
              <div className="bg-sunken rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Check className="w-5 h-5 text-seal shrink-0" />
                  <div>
                    <span className="text-sm font-semibold text-ink block">리포트가 열려 있어요</span>
                    <span className="text-xs text-ink-soft">PDF 소장본을 언제든 내려받을 수 있습니다.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPdfReportModalOpen(true)}
                  className="w-full sm:w-auto py-3 px-5 bg-seal hover:bg-seal-deep text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Printer className="w-4 h-4" />
                  <span>리포트 열기</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                {pdfTickets > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleConsumeTicket("pdf")}
                    disabled={ticketLoading}
                    className="flex-1 py-3 px-4 bg-seal hover:bg-seal-deep disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-4 h-4 shrink-0" />
                    <span>확인권 1장으로 PDF 열람 (잔여 {pdfTickets}장)</span>
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
                      className="flex-1 py-3 px-4 bg-seal hover:bg-seal-deep text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>₩2,900 결제하고 열람</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => focusCouponInput("PDF2026")}
                      className="py-3 px-4 bg-sunken hover:bg-line text-ink text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      쿠폰·초대로 받기
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => focusCouponInput("PDF2026")}
                    className="flex-1 py-3 px-4 bg-seal hover:bg-seal-deep text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>쿠폰 등록하고 확인권 받기</span>
                  </button>
                )}
              </div>
            )}

            {/* Direct Feedback Below PDF Action Button */}
            {ticketSuccessMsg && (
              <p className="text-xs text-ink font-medium bg-sunken p-3 rounded-xl flex items-center gap-1.5 animate-fade-in">
                <Check className="w-4 h-4 text-ink-soft shrink-0" />
                <span>{ticketSuccessMsg}</span>
              </p>
            )}
            {ticketErrorMsg && (
              <p className="text-xs text-seal font-medium bg-sunken p-3 rounded-xl flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{ticketErrorMsg}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Secret Compatibility */}
      {activeTab === "secret" && (
        <div className="space-y-3 animate-fade-in">
          <div className="bg-sunken rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1">
                <span className="text-xs text-ink-faint block">
                  1:1 심층 궁합{isPaymentEnabled && " · ₩1,900"}
                </span>
                <h5 className="text-[15px] font-semibold text-ink leading-snug">구성원 1:1 인연 등급·기질 상성 풀이</h5>
              </div>
              <span className="text-xs text-ink-soft bg-surface px-2.5 py-1 rounded-lg shrink-0">
                보유 {(ticketAccount?.tickets?.secret || 0)}장
              </span>
            </div>

            <p className="text-sm text-ink-soft leading-relaxed">
              1:1 궁합 등급(S~F)과 내면의 기질 상성을 다이어그램으로 풀이합니다.
            </p>

            <ul className="text-sm text-ink-soft space-y-2 pt-3 border-t border-line">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-ink-faint shrink-0 mt-0.5" />
                <span>모임 안에서 가장 조화로운 조합(S등급) 확인</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-ink-faint shrink-0 mt-0.5" />
                <span>오행 충·합에 기반한 성향 상성 풀이</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            {isSecretUnlocked || isPremium ? (
              <div className="bg-sunken rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-seal shrink-0" />
                  <div>
                    <span className="text-sm font-semibold text-ink block">이미 해금 완료된 콘텐츠예요</span>
                    <span className="text-xs text-ink-soft">1:1 비밀 인연 등급과 성향 상성 궤적을 평생 무제한 열람할 수 있습니다.</span>
                  </div>
                </div>
                <span className="px-3.5 py-1.5 bg-surface text-ink text-xs font-semibold rounded-lg shrink-0 border border-line">
                  평생 무료 열람 중
                </span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                {secretTickets > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleConsumeTicket("secret")}
                    disabled={ticketLoading}
                    className="flex-1 py-3 px-4 bg-seal hover:bg-seal-deep disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>확인권 1장으로 열람 (잔여 {secretTickets}장)</span>
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
                      className="flex-1 py-3 px-4 bg-seal hover:bg-seal-deep text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>₩1,900 결제하고 열람</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => focusCouponInput("SECRET2026")}
                      className="py-3 px-4 bg-sunken hover:bg-line text-ink text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      쿠폰·초대로 받기
                    </button>
                  </>
                ) : (
                <button
                  type="button"
                  onClick={() => focusCouponInput("SECRET2026")}
                  className="flex-1 py-3 px-4 bg-seal hover:bg-seal-deep text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>쿠폰 등록하고 확인권 받기</span>
                </button>
              )}
            </div>
            )}

            {/* Direct Feedback Below Secret Action Button */}
            {ticketSuccessMsg && (
              <p className="text-xs text-ink font-medium bg-sunken p-3 rounded-xl flex items-center gap-1.5 animate-fade-in">
                <Check className="w-4 h-4 text-ink-soft shrink-0" />
                <span>{ticketSuccessMsg}</span>
              </p>
            )}
            {ticketErrorMsg && (
              <p className="text-xs text-seal font-medium bg-sunken p-3 rounded-xl flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{ticketErrorMsg}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Group Analysis */}
      {activeTab === "group" && (
        <div className="space-y-3 animate-fade-in">
          <div className="bg-sunken rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1">
                <span className="text-xs text-ink-faint block">
                  소모임 맞춤{isPaymentEnabled && " · ₩3,900"}
                </span>
                <h5 className="text-[15px] font-semibold text-ink leading-snug">모임 전체 오행 상생 궁합 보고서</h5>
              </div>
              <span className="text-xs text-ink-soft bg-surface px-2.5 py-1 rounded-lg shrink-0">
                보유 {(ticketAccount?.tickets?.group || 0)}장
              </span>
            </div>

            <p className="text-sm text-ink-soft leading-relaxed">
              구성원 전체의 오행(목·화·토·금·수) 분포와 순환 흐름을 한눈에 보여주고, 모임에 맞는 처방을 제안합니다.
            </p>

            <ul className="text-sm text-ink-soft space-y-2 pt-3 border-t border-line">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-ink-faint shrink-0 mt-0.5" />
                <span>모임 전체 오행 분포와 부족·과다 기운 처방</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-ink-faint shrink-0 mt-0.5" />
                <span>참여자 간 1:1 전수 궁합 종합 리포트</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            {isGroupUnlocked || isPremium ? (
              <div className="bg-sunken rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-seal shrink-0" />
                  <div>
                    <span className="text-sm font-semibold text-ink block">이미 해금 완료된 콘텐츠예요</span>
                    <span className="text-xs text-ink-soft">모임 전체 오행 분포와 1:1 전수 궁합 총괄 리포트를 평생 무제한 열람할 수 있습니다.</span>
                  </div>
                </div>
                <span className="px-3.5 py-1.5 bg-surface text-ink text-xs font-semibold rounded-lg shrink-0 border border-line">
                  평생 무료 열람 중
                </span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                {groupTickets > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleConsumeTicket("group")}
                    disabled={ticketLoading}
                    className="flex-1 py-3 px-4 bg-seal hover:bg-seal-deep disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>확인권 1장으로 열람 (잔여 {groupTickets}장)</span>
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
                      className="flex-1 py-3 px-4 bg-seal hover:bg-seal-deep text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>₩3,900 결제하고 열람</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => focusCouponInput("GROUP2026")}
                      className="py-3 px-4 bg-sunken hover:bg-line text-ink text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      쿠폰·초대로 받기
                    </button>
                  </>
                ) : (
                <button
                  type="button"
                  onClick={() => focusCouponInput("GROUP2026")}
                  className="flex-1 py-3 px-4 bg-seal hover:bg-seal-deep text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>쿠폰 등록하고 확인권 받기</span>
                </button>
              )}
            </div>
            )}

            {/* Direct Feedback Below Group Action Button */}
            {ticketSuccessMsg && (
              <p className="text-xs text-ink font-medium bg-sunken p-3 rounded-xl flex items-center gap-1.5 animate-fade-in">
                <Check className="w-4 h-4 text-ink-soft shrink-0" />
                <span>{ticketSuccessMsg}</span>
              </p>
            )}
            {ticketErrorMsg && (
              <p className="text-xs text-seal font-medium bg-sunken p-3 rounded-xl flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{ticketErrorMsg}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* COLLAPSIBLE PREVIEW SECTION */}
      <div className="bg-sunken rounded-xl overflow-hidden">
        <button
          id="toggle-preview-btn"
          type="button"
          onClick={() => setShowSamplePreview(!showSamplePreview)}
          className="w-full flex items-center justify-between p-4 text-left text-xs font-semibold text-ink hover:bg-line transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-ink-soft" />
            <span>심층 리포트 샘플 미리보기</span>
          </div>
          <span className="text-xs text-ink-faint font-medium">
            {showSamplePreview ? "접기" : "펼치기"}
          </span>
        </button>

        {showSamplePreview && (
          <div className="px-4 pb-4 space-y-3 text-left animate-fade-in text-xs leading-relaxed max-h-[300px] overflow-y-auto">

            {/* Header Mock */}
            <div className="text-center pb-2.5 border-b border-line">
              <span className="text-xs text-ink-faint block">
                샘플 · 홍길동 님의 사주명리 감정서
              </span>
              <h6 className="font-serif text-sm font-semibold text-ink mt-1.5">
                일간 갑목(甲木)의 대림목(大林木) 기운과 10년 대운
              </h6>
            </div>

            {/* SPECIAL RELATIONSHIP PRESCRIPTION */}
            <div className="space-y-2 bg-surface p-3 rounded-xl">
              <span className="text-xs font-semibold text-ink block">관계 상생 처방 (심층 리포트 전용)</span>

              <div className="space-y-1.5 text-xs text-ink-soft">
                <p className="leading-relaxed">
                  <strong className="text-ink block mb-0.5">예상 갈등 요인 · 금목상쟁(金木相爭)</strong>
                  상대의 금(金) 기운이 나의 목(木) 기운을 지나치게 눌러 상처를 입기 쉽습니다.
                </p>

                <p className="leading-relaxed">
                  <strong className="text-ink block mb-0.5">상생 제안 · 수(水) 기운 매개</strong>
                  물(水) 기운이 두 기운의 긴장을 풀어 줍니다. 물가나 조용한 카페에서 대화 시간을 가져 보세요.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Secure Guarantee Guidance */}
      <p className="text-center text-xs text-ink-faint flex items-center justify-center gap-1.5 pt-2 border-t border-line">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span>확인권 사용 후에도 사주 분석 데이터는 계정에 보관됩니다.</span>
      </p>

    </div>
    );
  };

  // Interactive Checkout Modal Component
  const renderCheckoutModal = () => {
    if (!checkoutProduct) return null;

    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/50 animate-fade-in text-left">
        <div className="bg-surface rounded-xl shadow-lg max-w-md w-full overflow-hidden text-left relative">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <div>
              <h4 className="text-[15px] font-semibold text-ink">주문서</h4>
              <span className="text-xs text-ink-faint">결제 정보는 암호화되어 처리됩니다</span>
            </div>
            <button
              type="button"
              onClick={() => !isProcessingPayment && setCheckoutProduct(null)}
              disabled={isProcessingPayment}
              className="p-2 text-ink-faint hover:text-ink rounded-xl hover:bg-sunken transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 text-sm">
            {/* Product Summary Box */}
            <div className="bg-sunken rounded-xl p-4 space-y-2.5">
              <div>
                <span className="text-xs text-ink-faint block">
                  주문 상품{checkoutProduct.badge ? ` · ${checkoutProduct.badge}` : ""}
                </span>
                <h5 className="text-sm font-semibold text-ink mt-1">{checkoutProduct.title}</h5>
              </div>

              <div className="border-t border-line pt-2 flex justify-between items-baseline">
                <span className="text-xs text-ink-soft">충전 수량</span>
                <span className="text-sm font-semibold text-ink">확인권 {checkoutProduct.ticketCount}장</span>
              </div>

              <div className="border-t border-line pt-2 flex justify-between items-baseline">
                <span className="text-xs text-ink-soft">결제 금액 (VAT 포함)</span>
                <div className="text-right">
                  {checkoutProduct.originalPrice && (
                    <span className="text-xs text-ink-faint line-through mr-1.5">
                      ₩{checkoutProduct.originalPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="text-lg font-semibold text-ink">
                    ₩{checkoutProduct.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-ink block">결제 수단</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("kakaopay")}
                  className={`p-3 rounded-xl text-xs transition-colors cursor-pointer text-center ${
                    paymentMethod === "kakaopay"
                      ? "bg-seal text-white font-semibold"
                      : "bg-sunken hover:bg-line text-ink-soft font-medium"
                  }`}
                >
                  카카오페이
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("tosspay")}
                  className={`p-3 rounded-xl text-xs transition-colors cursor-pointer text-center ${
                    paymentMethod === "tosspay"
                      ? "bg-seal text-white font-semibold"
                      : "bg-sunken hover:bg-line text-ink-soft font-medium"
                  }`}
                >
                  토스페이
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("naverpay")}
                  className={`p-3 rounded-xl text-xs transition-colors cursor-pointer text-center ${
                    paymentMethod === "naverpay"
                      ? "bg-seal text-white font-semibold"
                      : "bg-sunken hover:bg-line text-ink-soft font-medium"
                  }`}
                >
                  네이버페이
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`p-3 rounded-xl text-xs transition-colors cursor-pointer text-center ${
                    paymentMethod === "card"
                      ? "bg-seal text-white font-semibold"
                      : "bg-sunken hover:bg-line text-ink-soft font-medium"
                  }`}
                >
                  신용·체크카드
                </button>
              </div>
            </div>

            {/* Legal Notice */}
            <p className="text-xs text-ink-faint leading-relaxed">
              구매 즉시 확인권이 계정에 지급되며, 사용 전 7일 이내 환불할 수 있습니다. (전자상거래법 준수)
            </p>

            {/* Pay Button */}
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isProcessingPayment}
              className="w-full py-3 bg-seal hover:bg-seal-deep disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isProcessingPayment ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>결제 승인 요청 중</span>
                </>
              ) : (
                <span>₩{checkoutProduct.price.toLocaleString()} 결제하기</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Payment Success Confirmation Modal
  const renderPaymentSuccessModal = () => {
    if (!paymentSuccessData) return null;

    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 animate-fade-in text-left">
        <div className="bg-surface rounded-xl shadow-lg max-w-sm w-full p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-sunken text-seal flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h4 className="font-serif text-lg font-semibold text-ink">결제가 완료되었어요</h4>
            <p className="text-sm text-ink-soft leading-relaxed">
              <strong>{paymentSuccessData.title}</strong> 결제가 승인되어 확인권 <strong>{paymentSuccessData.count}장</strong>이 충전되었습니다.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPaymentSuccessData(null)}
            className="w-full py-3 bg-seal hover:bg-seal-deep text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    );
  };

  if (isModal) {
    const modalContent = (
      <div
        id="premium-paywall-portal-overlay"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/50 overflow-y-auto cursor-pointer"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose?.();
          }
        }}
      >
        <div className="bg-surface rounded-xl shadow-lg max-w-2xl md:max-w-3xl w-full relative max-h-[92vh] flex flex-col overflow-hidden text-left cursor-default my-auto">
          {/* Modal Sticky Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-line bg-surface shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-seal text-white font-serif flex items-center justify-center text-sm">
                緣
              </div>
              <span className="font-serif text-lg font-semibold text-ink">
                인연 상점
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-ink-faint hover:text-ink rounded-xl hover:bg-sunken transition-colors cursor-pointer shrink-0"
              aria-label="상점 닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-4 sm:p-6 md:p-7 overflow-y-auto space-y-5 flex-1">
            {renderInner()}
          </div>

          {/* Bottom Close Footer Bar */}
          <div className="px-4 py-3 bg-surface border-t border-line shrink-0 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-sunken hover:bg-line text-ink text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              닫기
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
