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
      (btn) => btn.textContent?.includes("인연 상점") || btn.textContent?.includes("상점 열기") || btn.textContent?.includes("쿠폰 · 상점")
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
      <div id="google-adsense-container" className={`w-full my-4 p-1 bg-surface border border-line rounded-xl text-center overflow-hidden relative ${className}`}>
        {/* Adsense Spec Compliant Label */}
        <div className="absolute top-1 left-2 text-xs text-ink-faint uppercase tracking-widest pointer-events-none select-none">
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
        className={`bg-surface border border-line hover:border-ink-faint rounded-xl p-4 cursor-pointer transition-colors text-left ${className}`}
      >
        <div className="flex items-center justify-between pb-2 mb-2.5">
          <span className="text-xs text-ink-faint uppercase tracking-widest">Sponsor</span>
        </div>

        <h4 className="text-sm font-semibold text-ink leading-snug">
          궁합 리포트 전체 열람권
        </h4>
        <p className="text-xs text-ink-soft leading-relaxed mt-1">
          1:1 속궁합, 십성 대운 분석, 모임 오행 네트워크를 한 번의 구매로 모두 볼 수 있습니다.
        </p>

        <div className="mt-3 pt-2.5 flex items-center justify-between text-xs">
          <span className="text-ink-faint">구매 시 광고가 사라집니다.</span>
          <span className="font-semibold text-seal">상점 가기</span>
        </div>
      </div>
    );
  }

  if (layout === "inline") {
    return (
      <div
        onClick={triggerPremiumShop}
        className={`bg-surface border border-line hover:border-ink-faint rounded-xl p-3 cursor-pointer transition-colors flex items-center justify-between text-left gap-3 ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xs bg-sunken text-ink-faint px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
            AD
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink truncate">
              궁합 리포트 평생 열람권
            </p>
            <p className="text-xs text-ink-faint truncate">
              광고 없이 프리미엄 해설서를 볼 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default Horizontal Banner Layout
  return (
    <div
      onClick={triggerPremiumShop}
      className={`bg-surface border border-line hover:border-ink-faint rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-colors text-left gap-3 ${className}`}
    >
      <div className="min-w-0">
        <span className="text-xs text-ink-faint uppercase tracking-widest">Sponsor</span>
        <h4 className="text-sm font-semibold text-ink mt-0.5">
          광고 없이 보는 인연사주
        </h4>
        <p className="text-xs text-ink-soft mt-0.5 truncate">
          프리미엄으로 전환하면 광고가 사라지고 십성 대운이 열립니다.
        </p>
      </div>
      <span className="px-3 py-2 bg-sunken text-ink rounded-xl text-xs font-semibold shrink-0">
        상점 가기
      </span>
    </div>
  );
}
