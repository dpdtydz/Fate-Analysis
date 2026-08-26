import { db, auth, sanitizeFirestoreData } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import { UserTierType } from "../types";

export type AnalyticsEventName =
  | "page_view"
  | "create_room"
  | "join_room"
  | "tab_switch"
  | "subtab_switch"
  | "shop_tab_switch"
  | "card_expand"
  | "card_collapse"
  | "filter_change"
  | "remedy_view"
  | "member_profile_click"
  | "saju_detail_modal_open"
  | "chemistry_guide_open"
  | "view_saju"
  | "view_pair_detail"
  | "open_shop_modal"
  | "click_locked_feature"
  | "lock_preview_click"
  | "ticket_consumed"
  | "ticket_earned"
  | "invite_shared"
  | "invite_converted"
  | "unlock_coupon"
  | "result_capture_click"
  | "copy_room_code"
  | "share_room_link"
  | "share_link"
  | "survey_open"
  | "survey_submit";

export interface AnalyticsPayload {
  eventName: AnalyticsEventName | string;
  category?: "traffic" | "conversion" | "engagement" | "viral" | "retention" | "ui_nav" | "saju_view" | "monetization" | "survey" | "system" | "navigation";
  userTier?: UserTierType;
  metadata?: Record<string, any>;
  roomCode?: string;
}

// Get or calculate current client-side tier
export function getLocalUserTier(): UserTierType {
  const isPaid = localStorage.getItem("saju_premium_unlocked_local") === "true" ||
                 localStorage.getItem("saju_user_tier") === "paid";
  if (isPaid) return "paid";

  const hasCouponOrTicket = localStorage.getItem("saju_user_tier") === "coupon" ||
                           localStorage.getItem("saju_unlocked_pdf") === "true" ||
                           localStorage.getItem("saju_unlocked_secret") === "true" ||
                           localStorage.getItem("saju_unlocked_group") === "true" ||
                           parseInt(localStorage.getItem("saju_ticket_count") || "0") > 0;
  if (hasCouponOrTicket) return "coupon";

  return "free";
}

/**
 * Log analytics event to Firestore with user tier segmentation (non-blocking, dual signature support)
 */
export async function logAnalyticsEvent(
  arg1: AnalyticsPayload | AnalyticsEventName | string,
  categoryOrTier?: string,
  extraMetadata?: Record<string, any>
): Promise<void> {
  try {
    let eventName: string;
    let category: string = "engagement";
    let metadata: Record<string, any> = {};
    let roomCode: string | null = null;

    if (typeof arg1 === "object" && arg1 !== null) {
      eventName = arg1.eventName;
      category = arg1.category || "engagement";
      metadata = arg1.metadata || {};
      roomCode = arg1.roomCode || null;
    } else {
      eventName = String(arg1);
      if (categoryOrTier) category = categoryOrTier;
      if (extraMetadata) metadata = extraMetadata;
      if (metadata.roomCode) roomCode = metadata.roomCode;
    }

    const user = auth.currentUser;
    const tier = getLocalUserTier();
    const uid = user?.uid || localStorage.getItem("saju_fallback_guest_uid") || "guest_anon";
    
    const eventData = sanitizeFirestoreData({
      eventName,
      category,
      userTier: tier,
      metadata,
      roomCode: roomCode || metadata.roomCode || null,
      userUid: uid,
      userEmail: user?.email || null,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      path: typeof window !== "undefined" ? window.location.hash || window.location.pathname : null,
    });

    // 1. Buffer into local storage cache
    try {
      const existing = localStorage.getItem("saju_analytics_cache");
      let list: any[] = existing ? JSON.parse(existing) : [];
      list.unshift(eventData);
      if (list.length > 100) list = list.slice(0, 100);
      localStorage.setItem("saju_analytics_cache", JSON.stringify(list));
    } catch (e) {}

    // 2. Fire and forget to Firestore analytics_events collection
    addDoc(collection(db, "analytics_events"), eventData).catch((err) => {
      console.debug("[Analytics Log Silent Skip]:", err);
    });
  } catch (e) {
    console.debug("[Analytics Log Error]:", e);
  }
}
