import React, { useEffect, useState } from "react";
import { Crown, Sparkles, ShieldCheck } from "lucide-react";
import { auth, checkPremiumStatus, checkProductUnlock } from "../lib/firebase";

interface GoogleAdsProps {
  slotId?: string; // Optional custom slot ID
  layout?: "banner" | "card" | "inline";
  className?: string;
  hasContent?: boolean; // Ensure ad only shows when publisher content is present
}

export default function GoogleAds({ slotId, layout = "banner", className = "", hasContent = false }: GoogleAdsProps) {
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [adLoadFailed, setAdLoadFailed] = useState(false);

  // Read Google AdSense Client ID from environment variables, fallback to verified account ID
  const adsenseClientId = (import.meta as any).env?.VITE_ADSENSE_CLIENT_ID || "ca-pub-3424261434469173";
  const adsenseSlotId = slotId || (import.meta as any).env?.VITE_ADSENSE_SLOT_ID || "";

  useEffect(() => {
    // Check if user is premium or has unlocked any premium product to hide ads entirely
    const verifyPremium = async () => {
      try {
        const premium = await checkPremiumStatus();
        const pdfUnlocked = await checkProductUnlock("pdf");
        const secretUnlocked = await checkProductUnlock("secret");
        const groupUnlocked = await checkProductUnlock("group");
        
        setIsPremiumUser(premium || pdfUnlocked || secretUnlocked || groupUnlocked);
      } catch (err) {
        console.error("Failed to check premium status in ads:", err);
      }
    };

    verifyPremium();

    // Re-verify on auth changes
    const unsubscribeAuth = auth.onAuthStateChanged(() => {
      verifyPremium();
    });

    // Re-verify on a fast periodic interval to ensure instant removal when demo unlocked / bought in iframe
    const intervalId = setInterval(verifyPremium, 1000);

    // Also listen to local storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key === "saju_premium_unlocked_local" || e.key.startsWith("saju_unlocked_"))) {
        verifyPremium();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      unsubscribeAuth();
      clearInterval(intervalId);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    // If premium, no publisher content, or no slot ID configured, skip loading AdSense script
    if (isPremiumUser || !hasContent || !adsenseClientId || !adsenseSlotId) return;

    try {
      // Inject Google AdSense Script if not already loaded
      const scriptId = "google-adsense-script";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`;
        script.async = true;
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);
      }

      // Initialize the ad safely after DOM updates
      const timer = setTimeout(() => {
        const uninitializedAds = document.querySelectorAll("ins.adsbygoogle:not([data-adsbygoogle-status])");
        if (uninitializedAds.length > 0) {
          try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          } catch (e) {
            console.warn("Google AdSense push error: ", e);
          }
        }
      }, 200);

      return () => clearTimeout(timer);
    } catch (err) {
      console.warn("Google AdSense load error, fallback to premium promos:", err);
      setAdLoadFailed(true);
    }
  }, [isPremiumUser, hasContent, adsenseClientId, adsenseSlotId]);

  // AdSense Policy: Do NOT render ads on screens without publisher content or for premium users
  if (isPremiumUser || !hasContent) {
    return null;
  }

  // Helper to open the Premium shop by triggering the floating shop buttons
  const triggerPremiumShop = () => {
    const shopButtons = document.querySelectorAll("button");
    const shopBtn = Array.from(shopButtons).find(
      (btn) => btn.textContent?.includes("인연 상점") || btn.textContent?.includes("상점 열기")
    );
    if (shopBtn) {
      (shopBtn as HTMLButtonElement).click();
    } else {
      // Fallback: reload page or open premium tab
      window.location.hash = window.location.hash.includes("/me/") 
        ? window.location.hash // Stay on page, they will see premium sections
        : window.location.hash;
    }
  };

  // If we have actual Google Ads configurations, render the official AdSense tag
  if (adsenseClientId && adsenseSlotId && !adLoadFailed) {
    return (
      <div id="google-adsense-container" className={`w-full my-4 p-1 bg-white/40 border border-gray-200/50 rounded-xl text-center overflow-hidden relative ${className}`}>
        {/* Adsense Spec Compliant Label */}
        <div className="absolute top-1 left-2 text-[8px] text-[#5C5046]/60 uppercase tracking-widest pointer-events-none select-none">
          Sponsor
        </div>
        <div className="pt-4 pb-1">
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={adsenseClientId}
            data-ad-slot={adsenseSlotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    );
  }

  // ==========================================
  // Fallback Aesthetic Native Promotional Banners
  // (In-House Ad Placements to maximize Premium conversions)
  // ==========================================
  if (layout === "card") {
    return (
      <div 
        onClick={triggerPremiumShop}
        className={`bg-gradient-to-br from-[#FAF8F5] via-[#FFFDFB] to-[#F5EFE6] border border-amber-300/60 rounded-2xl p-4 shadow-3xs cursor-pointer hover:border-amber-400 active:scale-[0.99] transition-all text-left relative overflow-hidden group ${className}`}
      >
        {/* Decorative elements */}
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-amber-100/30 rounded-full blur-xl group-hover:bg-amber-100/50 transition-all" />
        
        <div className="flex items-center justify-between border-b border-amber-200/40 pb-2 mb-2.5">
          <span className="text-[8px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm font-extrabold uppercase tracking-widest border border-amber-200">
            Sponsor
          </span>
          <span className="text-[8px] text-[#5C5046] font-medium flex items-center gap-0.5">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> 프리미엄 안심 혜택
          </span>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
            <Crown className="w-5 h-5 fill-amber-400 animate-pulse text-amber-500" />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-amber-950 tracking-tight leading-snug">
              궁합 3단계 완전 해금 👑
            </h4>
            <p className="text-[9px] text-[#5C5046] leading-relaxed mt-1 font-medium">
              1:1 매칭 속궁합, 프리미엄 십성 대운 분석, 그룹 전체 오행 네트워크까지 단 한 번의 평생 해금으로 완벽하게 확인하세요.
            </p>
          </div>
        </div>
        
        <div className="mt-3 pt-2 border-t border-amber-200/40 flex items-center justify-between">
          <span className="text-[9px] text-amber-800 font-bold">
            💡 프리미엄 구매시 평생 광고가 완전 제거됩니다.
          </span>
          <span className="text-[9px] font-extrabold text-amber-700 group-hover:text-amber-800 flex items-center gap-0.5">
            상점 가기 <span className="translate-x-0 group-hover:translate-x-0.5 transition-transform">➔</span>
          </span>
        </div>
      </div>
    );
  }

  if (layout === "inline") {
    return (
      <div 
        onClick={triggerPremiumShop}
        className={`bg-white/80 border border-[#FAF7F2] hover:border-amber-300 rounded-xl p-2.5 shadow-4xs cursor-pointer active:scale-[0.98] transition flex items-center justify-between text-left gap-3 relative overflow-hidden ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[7px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded-xs font-bold uppercase tracking-wider shrink-0 scale-90">
            AD
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-800 truncate">
              📢 커피 한 잔 가격으로 사주명가 인연궁합 평생 해금하기
            </p>
            <p className="text-[8px] text-[#5C5046] truncate">
              광고 없는 명품 프리미엄 해설서로 지인들의 운명을 속 시원히 파헤치세요.
            </p>
          </div>
        </div>
        <div className="flex items-center text-amber-600 shrink-0">
          <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-500 animate-spin-slow" />
        </div>
      </div>
    );
  }

  // Default Horizontal Banner Layout
  return (
    <div 
      onClick={triggerPremiumShop}
      className={`bg-gradient-to-r from-amber-50/70 via-[#FFFDFB]/80 to-amber-50/70 border border-amber-300/40 rounded-2xl p-3 flex items-center justify-between shadow-3xs cursor-pointer hover:border-amber-400/80 active:scale-[0.99] transition-all text-left relative overflow-hidden group ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-100/60 border border-amber-200 text-amber-700 group-hover:bg-amber-200/50 transition">
          <Crown className="w-4 h-4 fill-amber-300 text-amber-600" />
        </div>
        <div>
          <span className="text-[7px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded-xs font-black tracking-widest uppercase scale-75 inline-block mb-0.5">
            SPONSOR
          </span>
          <h4 className="text-[10px] font-black text-[#2C3E50] leading-none">
            광고 없이 깨끗하게 즐기는 인연사주 🔮
          </h4>
          <p className="text-[8px] text-[#5C5046] leading-none mt-1 font-medium">
            프리미엄 멤버십으로 전환하고 모든 광고 제거와 십성 대운을 확인하세요.
          </p>
        </div>
      </div>
      <button className="px-2.5 py-1.5 bg-amber-600 text-white rounded-lg text-[9px] font-black tracking-tight shrink-0 group-hover:bg-amber-700 transition">
        제거하기
      </button>
    </div>
  );
}
