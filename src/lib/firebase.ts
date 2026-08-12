import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBDxMgEkCLcYU3X--nJH4JYwnWrsgqljyA",
  authDomain: "gen-lang-client-0768788170.firebaseapp.com",
  projectId: "gen-lang-client-0768788170",
  storageBucket: "gen-lang-client-0768788170.firebasestorage.app",
  messagingSenderId: "291785267663",
  appId: "1:291785267663:web:7311b08fb9ea630a0f5aba"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-87874d9b-de7d-42c6-9ce0-5a2d8b3fb609");
export const auth = getAuth(app);

// Sign in anonymously with robust local fallback if restricted on server
export async function getAnonymousUser(): Promise<any> {
  if (auth.currentUser) return auth.currentUser;
  
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (error: any) {
    console.warn("Firebase anonymous sign-in failed; falling back to a client-side guest UID:", error);
    
    // Let's generate a stable guest UID stored in localStorage so it persists across refreshes
    let guestUid = localStorage.getItem("saju_fallback_guest_uid");
    if (!guestUid) {
      guestUid = "guest_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      localStorage.setItem("saju_fallback_guest_uid", guestUid);
    }
    
    return {
      uid: guestUid,
      isAnonymous: true,
      displayName: "익명 방문자 (로컬)",
    };
  }
}

// Google Sign-In Function
export async function signInWithGoogle(): Promise<any> {
  const provider = new GoogleAuthProvider();
  try {
    const cred = await signInWithPopup(auth, provider);
    return cred.user;
  } catch (error) {
    console.error("Google Sign-In failed:", error);
    throw error;
  }
}

// Google Sign-Out Function
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Google Sign-Out failed:", error);
    throw error;
  }
}

// Save room code to physical localStorage history to let user preserve list of rooms they opened or joined
export function saveRoomToHistory(code: string, role: "owner" | "member", title: string): void {
  try {
    const historyStr = localStorage.getItem("saju_room_history_v2");
    let history: Array<{ code: string; role: "owner" | "member"; title: string; updatedAt: number }> = [];
    if (historyStr) {
      history = JSON.parse(historyStr);
    }
    
    // Remove if already exists to put it first (recency)
    history = history.filter((item) => item.code !== code);
    
    history.unshift({
      code,
      role,
      title,
      updatedAt: Date.now()
    });
    
    // Max 20 history items
    if (history.length > 20) {
      history = history.slice(0, 20);
    }
    
    localStorage.setItem("saju_room_history_v2", JSON.stringify(history));
  } catch (e) {
    console.warn("Error saving room history:", e);
  }

  // Sync to Firestore if authenticated
  if (auth.currentUser && !auth.currentUser.isAnonymous) {
    setDoc(doc(db, "users", auth.currentUser.uid, "joined_rooms", code), {
      code,
      role,
      title,
      updatedAt: Date.now()
    }).catch(e => console.error("Error syncing room history to Firestore:", e));
  }
}

export function getRoomHistory(): Array<{ code: string; role: "owner" | "member"; title: string; updatedAt: number }> {
  try {
    const historyStr = localStorage.getItem("saju_room_history_v2");
    if (!historyStr) return [];
    return JSON.parse(historyStr);
  } catch (e) {
    return [];
  }
}

// Remove room code from physical localStorage history and optionally Firestore joined_rooms
export async function removeRoomFromHistory(code: string): Promise<void> {
  try {
    const historyStr = localStorage.getItem("saju_room_history_v2");
    if (historyStr) {
      let history: Array<{ code: string; role: "owner" | "member"; title: string; updatedAt: number }> = JSON.parse(historyStr);
      history = history.filter((item) => item.code !== code);
      localStorage.setItem("saju_room_history_v2", JSON.stringify(history));
    }
    // Also remove the specific room member ID cache to clear state
    localStorage.removeItem(`saju_member_id_${code}`);
  } catch (e) {
    console.warn("Error removing room from local history:", e);
  }

  if (auth.currentUser && !auth.currentUser.isAnonymous) {
    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "joined_rooms", code));
    } catch (e) {
      console.error("Error removing room from Firestore history:", e);
    }
  }
}

// Clear all local room and member cache to solve browser caching and synchronization issues
export function clearAllLocalCache(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith("saju_") || 
        key === "saju_room_history_v2" || 
        key === "saju_fallback_guest_uid"
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (e) {
    console.warn("Error clearing local cache:", e);
  }
}

// Check if user has premium subscription activated
export async function checkPremiumStatus(uid?: string): Promise<boolean> {
  const targetUid = uid || auth.currentUser?.uid;
  const isAuth = !!auth.currentUser;

  // 1. If we have a authenticated session, query Firestore first as the source of truth
  if (targetUid && !targetUid.startsWith("guest_") && isAuth) {
    try {
      const userSnap = await getDoc(doc(db, "users", targetUid));
      if (userSnap.exists()) {
        const data = userSnap.data();
        let isPremiumActive = false;
        if (data.isPremium === true) {
          isPremiumActive = true;
        } else if (data.premiumUntil) {
          const expires = new Date(data.premiumUntil).getTime();
          if (expires > Date.now()) {
            isPremiumActive = true;
          }
        }

        // Sync local storage state to match cloud authority!
        if (isPremiumActive) {
          localStorage.setItem("saju_premium_unlocked_local", "true");
        } else {
          localStorage.removeItem("saju_premium_unlocked_local");
        }
        return isPremiumActive;
      }
    } catch (err: any) {
      console.log("Firestore premium status check error:", err.message || err);
    }
  }

  // 2. Fallback to local storage override for guest or offline testing
  if (localStorage.getItem("saju_premium_unlocked_local") === "true") {
    return true;
  }

  return false;
}

// Check if specific product is unlocked (or if global premium is active)
export async function checkProductUnlock(productType: "pdf" | "secret" | "group", uid?: string): Promise<boolean> {
  const targetUid = uid || auth.currentUser?.uid;
  const isAuth = !!auth.currentUser;

  // 1. If we have an authenticated session, query Firestore first as the source of truth
  if (targetUid && !targetUid.startsWith("guest_") && isAuth) {
    try {
      const userSnap = await getDoc(doc(db, "users", targetUid));
      if (userSnap.exists()) {
        const data = userSnap.data();
        
        // Check global premium status in cloud
        let isGlobalPremium = false;
        if (data.isPremium === true) {
          isGlobalPremium = true;
        } else if (data.premiumUntil) {
          const expires = new Date(data.premiumUntil).getTime();
          if (expires > Date.now()) {
            isGlobalPremium = true;
          }
        }

        // Check specific product unlock in cloud
        let isProductUnlocked = false;
        if (data.unlockedProducts && Array.isArray(data.unlockedProducts)) {
          if (data.unlockedProducts.includes(productType)) {
            isProductUnlocked = true;
          }
        }

        const isFullyUnlocked = isGlobalPremium || isProductUnlocked;

        // Sync local storage state to match cloud authority!
        if (isFullyUnlocked) {
          localStorage.setItem(`saju_unlocked_${productType}`, "true");
          if (isGlobalPremium) {
            localStorage.setItem("saju_premium_unlocked_local", "true");
          }
        } else {
          localStorage.removeItem(`saju_unlocked_${productType}`);
          if (!isGlobalPremium) {
            localStorage.removeItem("saju_premium_unlocked_local");
          }
        }

        return isFullyUnlocked;
      }
    } catch (err: any) {
      console.log("Firestore product unlock check error:", err.message || err);
    }
  }

  // 2. Fallback to global premium local check
  const isMasterPremium = localStorage.getItem("saju_premium_unlocked_local") === "true";
  if (isMasterPremium) return true;

  // 3. Fallback check for product-specific local storage override
  try {
    const localUnlocked = localStorage.getItem(`saju_unlocked_${productType}`);
    if (localUnlocked === "true") return true;
  } catch (e) {}

  return false;
}

// Activate premium trial simulation (supports instant 7-day trial or specific product purchase)
export async function activatePremiumSimulation(
  uid?: string,
  productType?: "pdf" | "secret" | "group",
  couponCode?: string
): Promise<boolean> {
  if (productType) {
    localStorage.setItem(`saju_unlocked_${productType}`, "true");
  } else {
    localStorage.setItem("saju_premium_unlocked_local", "true");
  }

  const targetUid = uid || auth.currentUser?.uid;
  if (targetUid && !targetUid.startsWith("guest_") && auth.currentUser) {
    try {
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // +7 days
      const userDocRef = doc(db, "users", targetUid);
      const userSnap = await getDoc(userDocRef);
      
      let currentUnlocked: string[] = [];
      let appliedCoupons: string[] = [];
      let couponUnlocks: Record<string, string> = {};
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        currentUnlocked = userData.unlockedProducts || [];
        appliedCoupons = userData.appliedCoupons || [];
        couponUnlocks = userData.couponUnlocks || {};
      }

      const updateData: any = {
        updatedAt: Date.now()
      };

      if (couponCode) {
        const cleanCoupon = couponCode.trim().toUpperCase();
        if (!appliedCoupons.includes(cleanCoupon)) {
          appliedCoupons.push(cleanCoupon);
        }
        couponUnlocks[cleanCoupon] = productType || "all";
        updateData.appliedCoupons = appliedCoupons;
        updateData.couponUnlocks = couponUnlocks;
      }

      if (productType) {
        if (!currentUnlocked.includes(productType)) {
          currentUnlocked.push(productType);
        }
        updateData.unlockedProducts = currentUnlocked;
      } else {
        updateData.isPremium = true;
        updateData.premiumUntil = new Date(expiresAt).toISOString();
        updateData.premiumTrialStartedAt = new Date().toISOString();
        updateData.subscriptionStatus = "trialing";
      }

      await setDoc(userDocRef, updateData, { merge: true });
      return true;
    } catch (err) {
      console.error("Failed to persist premium simulation in Firestore:", err);
    }
  }
  return true;
}

// Deactivate premium status for testing/simulation purposes
export async function deactivatePremiumSimulation(uid?: string): Promise<boolean> {
  localStorage.removeItem("saju_premium_unlocked_local");
  localStorage.removeItem("saju_unlocked_pdf");
  localStorage.removeItem("saju_unlocked_secret");
  localStorage.removeItem("saju_unlocked_group");

  const targetUid = uid || auth.currentUser?.uid;
  if (targetUid && !targetUid.startsWith("guest_") && auth.currentUser) {
    try {
      await setDoc(doc(db, "users", targetUid), {
        isPremium: false,
        premiumUntil: null,
        unlockedProducts: [],
        subscriptionStatus: "inactive",
        updatedAt: Date.now()
      }, { merge: true });
      return true;
    } catch (err) {
      console.error("Failed to deactivate premium status in Firestore:", err);
    }
  }
  return true;
}

// Deactivate a single premium product simulation for testing/simulation purposes
export async function deactivateProductSimulation(uid?: string, productType?: "pdf" | "secret" | "group"): Promise<boolean> {
  if (!productType) {
    return deactivatePremiumSimulation(uid);
  }
  
  localStorage.removeItem(`saju_unlocked_${productType}`);

  const targetUid = uid || auth.currentUser?.uid;
  if (targetUid && !targetUid.startsWith("guest_") && auth.currentUser) {
    try {
      const userDocRef = doc(db, "users", targetUid);
      const userSnap = await getDoc(userDocRef);
      let currentUnlocked: string[] = [];
      if (userSnap.exists()) {
        currentUnlocked = userSnap.data().unlockedProducts || [];
      }
      currentUnlocked = currentUnlocked.filter(p => p !== productType);
      await setDoc(userDocRef, {
        unlockedProducts: currentUnlocked,
        updatedAt: Date.now()
      }, { merge: true });
      return true;
    } catch (err) {
      console.error("Failed to deactivate product simulation in Firestore:", err);
    }
  }
  return true;
}

