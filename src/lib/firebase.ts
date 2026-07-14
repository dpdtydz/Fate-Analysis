import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {

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
  // 1. Check local storage override first (supports instant trial simulation for all users)
  if (localStorage.getItem("saju_premium_unlocked_local") === "true") {
    return true;
  }

  const targetUid = uid || auth.currentUser?.uid;
  if (!targetUid || targetUid.startsWith("guest_") || !auth.currentUser) return false;

  try {
    const userSnap = await getDoc(doc(db, "users", targetUid));
    if (userSnap.exists()) {
      const data = userSnap.data();
      if (data.isPremium === true) {
        return true;
      }
      // Check if trial is active
      if (data.premiumUntil) {
        const expires = new Date(data.premiumUntil).getTime();
        if (expires > Date.now()) {
          return true;
        }
      }
    }
  } catch (err: any) {
    console.log("No custom premium status document found in Firestore (normal for guest/new users):", err.message || err);
  }

  return false;
}

// Check if specific product is unlocked (or if global premium is active)
export async function checkProductUnlock(productType: "pdf" | "secret" | "group", uid?: string): Promise<boolean> {
  // If master premium is unlocked, all products are unlocked!
  const isMasterPremium = await checkPremiumStatus(uid);
  if (isMasterPremium) return true;

  // Otherwise check product-specific local storage override
  try {
    const localUnlocked = localStorage.getItem(`saju_unlocked_${productType}`);
    if (localUnlocked === "true") return true;
  } catch (e) {}

  const targetUid = uid || auth.currentUser?.uid;
  if (!targetUid || targetUid.startsWith("guest_") || !auth.currentUser) return false;

  try {
    const userSnap = await getDoc(doc(db, "users", targetUid));
    if (userSnap.exists()) {
      const data = userSnap.data();
      if (data.unlockedProducts && Array.isArray(data.unlockedProducts)) {
        if (data.unlockedProducts.includes(productType)) {
          return true;
        }
      }
    }
  } catch (err: any) {
    console.log("No custom product unlock document found in Firestore (normal for guest/new users):", err.message || err);
  }

  return false;
}

// Activate premium trial simulation (supports instant 7-day trial or specific product purchase)
export async function activatePremiumSimulation(uid?: string, productType?: "pdf" | "secret" | "group"): Promise<boolean> {
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
      if (userSnap.exists()) {
        currentUnlocked = userSnap.data().unlockedProducts || [];
      }

      if (productType) {
        if (!currentUnlocked.includes(productType)) {
          currentUnlocked.push(productType);
        }
        await setDoc(userDocRef, {
          unlockedProducts: currentUnlocked,
          updatedAt: Date.now()
        }, { merge: true });
      } else {
        await setDoc(userDocRef, {
          isPremium: true,
          premiumUntil: new Date(expiresAt).toISOString(),
          premiumTrialStartedAt: new Date().toISOString(),
          subscriptionStatus: "trialing",
          updatedAt: Date.now()
        }, { merge: true });
      }
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

