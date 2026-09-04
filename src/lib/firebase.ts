import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  getDocs,
  updateDoc, 
  increment,
  runTransaction,
  arrayUnion,
  addDoc,
  collection
} from "firebase/firestore";
import { 
  getAuth, 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  linkWithPopup,
  updateProfile,
  deleteUser,
  User
} from "firebase/auth";
import { UserMembershipInfo } from "../types";

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

// 🔍 Check user membership tier and capability permissions
export function getUserMembershipInfo(user: User | null = auth.currentUser): UserMembershipInfo {
  if (!user || user.isAnonymous) {
    return {
      tier: "guest",
      isSocialVerified: false,
      isEmailOnly: false,
      isGuest: true,
      canCreateRoom: false,
      canUseCoupon: false,
      canAccessShop: false,
      label: "게스트 (미로그인)",
      email: null,
      displayName: "방문자"
    };
  }

  // Check if Google provider is linked
  const isGoogle = user.providerData.some(p => p.providerId === "google.com");

  if (isGoogle) {
    return {
      tier: "social_verified",
      isSocialVerified: true,
      isEmailOnly: false,
      isGuest: false,
      canCreateRoom: true,
      canUseCoupon: true,
      canAccessShop: true,
      label: "정회원 (Google 연동)",
      email: user.email,
      displayName: user.displayName || user.email?.split("@")[0] || "정회원"
    };
  }

  const isInternalVirtual = Boolean(user.email?.endsWith("@saju.internal") || user.email?.endsWith("@saju-auth.com"));
  const displayEmail = isInternalVirtual ? null : user.email;
  const displayNick = user.displayName || (isInternalVirtual ? "일반회원" : user.email?.split("@")[0]) || "일반회원";

  // Otherwise, username/password regular member (restricted privileges, no email collected)
  return {
    tier: "regular_email",
    isSocialVerified: false,
    isEmailOnly: true,
    isGuest: false,
    canCreateRoom: false,  // ❌ Cannot create rooms (Only join existing rooms)
    canUseCoupon: false,   // ❌ Cannot use coupons (Anti-abuse)
    canAccessShop: false,  // ❌ Cannot access paid shop directly
    label: "일반회원 (아이디 가입)",
    email: displayEmail,
    displayName: displayNick
  };
}

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

// Google Sign-In Function (Full Member by default)
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  try {
    const cred = await signInWithPopup(auth, provider);
    
    // Save/Update user profile in Firestore
    if (cred.user) {
      await setDoc(doc(db, "users", cred.user.uid), {
        email: cred.user.email,
        displayName: cred.user.displayName,
        provider: "google.com",
        isSocialVerified: true,
        lastLoginAt: new Date().toISOString()
      }, { merge: true });
    }
    
    return cred.user;
  } catch (error) {
    console.error("Google Sign-In failed:", error);
    throw error;
  }
}

// Convert Korean/English username into a safe, deterministic internal identifier
export function usernameToVirtualEmail(username: string): string {
  const clean = username.trim().toLowerCase();
  const bytes = new TextEncoder().encode(clean);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
  return `u_${hex}@saju-auth.com`;
}

// Normalize identifier: if it contains '@', treat as legacy email; otherwise, convert username
export function normalizeAuthIdentifier(idOrEmail: string): string {
  const trimmed = idOrEmail.trim();
  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }
  return usernameToVirtualEmail(trimmed);
}

// Username & Password Sign-Up (Zero Personal Email Collection)
export async function signUpWithUsername(username: string, pass: string, nickname?: string): Promise<User> {
  try {
    const cleanId = username.trim();
    const virtualEmail = usernameToVirtualEmail(cleanId);
    const cred = await createUserWithEmailAndPassword(auth, virtualEmail, pass);
    
    const display = nickname?.trim() || cleanId;
    if (cred.user) {
      await updateProfile(cred.user, {
        displayName: display
      });
      
      await setDoc(doc(db, "users", cred.user.uid), {
        username: cleanId,
        displayName: display,
        provider: "password",
        isSocialVerified: false,
        membershipTier: "regular_email",
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      }, { merge: true });
    }

    return cred.user;
  } catch (error: any) {
    console.error("Username sign-up failed:", error);
    throw error;
  }
}

// Username & Password Sign-In (Supports both new @saju-auth.com and legacy @saju.internal)
export async function signInWithUsername(usernameOrEmail: string, pass: string): Promise<User> {
  const trimmed = usernameOrEmail.trim();
  const cleanIdentifier = normalizeAuthIdentifier(trimmed);

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanIdentifier, pass);
    if (cred.user) {
      await setDoc(doc(db, "users", cred.user.uid), {
        lastLoginAt: new Date().toISOString()
      }, { merge: true });
    }
    return cred.user;
  } catch (error: any) {
    // If not found and not a raw email, try legacy internal domain fallback
    if (!trimmed.includes("@") && (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential")) {
      try {
        const bytes = new TextEncoder().encode(trimmed.toLowerCase());
        const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
        const legacyInternal = `u_${hex}@saju.internal`;
        const legacyCred = await signInWithEmailAndPassword(auth, legacyInternal, pass);
        return legacyCred.user;
      } catch (e2) {
        // ignore fallback error and throw original
      }
    }
    console.error("Username sign-in failed:", error);
    throw error;
  }
}

// Global Admin Authority Validator
export function isAdminUser(user: User | null | undefined): boolean {
  if (!user || user.isAnonymous) return false;
  return user.email?.toLowerCase() === "lhs41977@gmail.com";
}

// Delete User Account (회원 탈퇴 및 개인정보 파기)
export async function deleteUserAccount(): Promise<{ success: boolean; message: string }> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("로그인된 사용자가 없습니다.");
  }
  const uid = user.uid;

  try {
    // 1. Delete Firestore user records and subcollections
    try {
      const joinedRoomsSnap = await getDocs(collection(db, "users", uid, "joined_rooms"));
      for (const d of joinedRoomsSnap.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
    } catch (e) {
      console.warn("Firestore joined_rooms cleanup during account deletion:", e);
    }

    try {
      await deleteDoc(doc(db, "users", uid));
      await deleteDoc(doc(db, "user_tickets", uid));
    } catch (e) {
      console.warn("Firestore data cleanup during account deletion:", e);
    }

    // 2. Completely wipe all local session, storage, and memory caches
    clearAllSessionAndLocalData();

    // 3. Delete Firebase Auth User
    try {
      await deleteUser(user);
    } catch (authErr: any) {
      if (authErr.code === "auth/requires-recent-login") {
        await signOut(auth);
        return {
          success: true,
          message: "계정 데이터가 안전하게 삭제되었으며 보안을 위해 로그아웃되었습니다."
        };
      }
      throw authErr;
    }

    return {
      success: true,
      message: "회원 탈퇴 및 개인정보 삭제가 정상적으로 완료되었습니다."
    };
  } catch (error: any) {
    console.error("Account deletion failed:", error);
    throw new Error("회원 탈퇴 처리 중 오류가 발생했습니다: " + (error.message || error));
  }
}

// Email & Password Sign-Up (Backward Compatibility)
export async function signUpWithEmail(email: string, pass: string, nickname?: string): Promise<User> {
  return signUpWithUsername(email, pass, nickname);
}

// Email & Password Sign-In (Backward Compatibility)
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  return signInWithUsername(email, pass);
}

// Upgrade existing Email account by Linking with Google SNS (Account Linking)
export async function linkCurrentAccountWithGoogle(): Promise<{ success: boolean; user: User; message: string }> {
  if (!auth.currentUser) {
    throw new Error("로그인된 사용자가 없습니다. 먼저 로그인해 주세요.");
  }

  const provider = new GoogleAuthProvider();
  try {
    const result = await linkWithPopup(auth.currentUser, provider);
    
    // Update user record in Firestore to reflect social verification
    await setDoc(doc(db, "users", result.user.uid), {
      isSocialVerified: true,
      membershipTier: "social_verified",
      upgradedToSocialAt: new Date().toISOString(),
      email: result.user.email,
      displayName: result.user.displayName || result.user.email?.split("@")[0]
    }, { merge: true });

    return {
      success: true,
      user: result.user,
      message: "🎉 Google SNS 계정 연동 완료! 정회원으로 승급되어 방 개설 및 쿠폰 혜택이 즉시 해금되었습니다."
    };
  } catch (error: any) {
    console.error("Google Account Linking failed:", error);
    
    // If the Google account is already used by another auth credential
    if (error.code === "auth/credential-already-in-use") {
      throw new Error("해당 Google 계정은 이미 가입되어 있습니다. 기존 Google 계정으로 로그인해 주세요.");
    }
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Google 로그인 팝업창이 닫혔습니다. 다시 시도해 주세요.");
    }
    throw new Error("Google 연동 중 오류가 발생했습니다: " + (error.message || error));
  }
}

// Friendly Error Message Converter for Firebase Authentication
export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return "알 수 없는 가입/로그인 오류가 발생했습니다.";
  
  const code = error.code || error.message || "";
  
  if (code.includes("auth/operation-not-allowed")) {
    return "이메일/비밀번호 혹은 Google 로그인 방식이 Firebase 프로젝트 관리자 설정에서 비활성화되어 있습니다. 관리자 콘솔(Authentication -> Sign-in method)에서 활성화 처리가 필요합니다. (auth/operation-not-allowed)";
  }
  if (code.includes("auth/email-already-in-use") || code.includes("email-already-in-use")) {
    return "이미 가입되어 사용 중인 아이디 또는 이메일 주소입니다. 다른 아이디를 입력하거나 로그인 화면을 이용해 주세요.";
  }
  if (code.includes("auth/weak-password") || code.includes("weak-password")) {
    return "비밀번호 보안 수준이 취약합니다. 영문 및 숫자를 조합하여 최소 6자리 이상으로 더 안전하게 입력해 주세요.";
  }
  if (code.includes("auth/invalid-email") || code.includes("invalid-email")) {
    return "아이디 또는 이메일의 입력 형식이 올바르지 않습니다. 영문, 숫자로 구성된 정확한 정보를 입력해 주세요.";
  }
  if (
    code.includes("auth/wrong-password") || 
    code.includes("auth/user-not-found") || 
    code.includes("auth/invalid-credential") ||
    code.includes("wrong-password") ||
    code.includes("user-not-found") ||
    code.includes("invalid-credential")
  ) {
    return "입력하신 아이디(이메일) 또는 비밀번호가 일치하지 않습니다. 다시 정확하게 확인 후 로그인해 주세요.";
  }
  if (code.includes("auth/network-request-failed") || code.includes("network-request-failed")) {
    return "네트워크 전송 실패: 인터넷 연결 상태가 원활하지 않습니다. Wi-Fi 또는 셀룰러 환경을 확인하고 다시 시도해 주세요.";
  }
  if (code.includes("auth/popup-closed-by-user") || code.includes("popup-closed-by-user")) {
    return "구글 로그인 팝업 창이 완료되기 전에 유저에 의해 닫혔습니다. 인증을 마칠 때까지 팝업을 닫지 말아주세요.";
  }
  if (code.includes("auth/popup-blocked") || code.includes("popup-blocked")) {
    return "웹 브라우저의 팝업 창이 차단되어 로그인 화면을 열지 못했습니다. 주소창 주변의 팝업 차단 허용 설정을 확인해 주세요.";
  }
  if (code.includes("auth/user-disabled") || code.includes("user-disabled")) {
    return "보안 및 서비스 관리 정책에 의해 비활성화(정지) 처리된 계정입니다. 고객지원이나 관리자에게 문의 바랍니다.";
  }
  if (code.includes("auth/too-many-requests") || code.includes("too-many-requests")) {
    return "단시간에 너무 많은 로그인 시도가 감지되어 보안상 계정이 일시 잠금되었습니다. 수 분 후 다시 시도해 주세요.";
  }
  if (code.includes("auth/credential-already-in-use") || code.includes("credential-already-in-use")) {
    return "해당 SNS 계정(Google)은 이미 다른 인연사주 계정에 연결되어 가입되어 있습니다. 기존 SNS 계정으로 로그인해 주세요.";
  }

  const rawMsg = error.message || String(error);
  return `가입/로그인 오류가 발생했습니다: ${rawMsg} (오류코드: ${code || "UNKNOWN"})`;
}

// Wipe and reset all local session, cache, and state
export function clearAllSessionAndLocalData(): void {
  try {
    // 1. Remove all saju-related entries from localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("saju_") ||
          key.includes("saju") ||
          key.includes("ticket") ||
          key.includes("profile") ||
          key.includes("member_id") ||
          key.includes("horoscope"))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    });

    // Explicit known keys for 100% thoroughness
    const explicitKeys = [
      "saju_my_personal_profile",
      "saju_my_profile",
      "saju_room_history_v2",
      "saju_fallback_guest_uid",
      "saju_premium_unlocked_local",
      "saju_unlocked_pdf",
      "saju_unlocked_secret",
      "saju_unlocked_group",
      "saju_unlocked_personal_report",
      "saju_ticket_count",
      "saju_user_tier",
      "saju_nickname",
      "saju_analytics_cache",
      "saju_survey_submitted",
      "saju_survey_last_seen"
    ];
    explicitKeys.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    });

    // 2. Clear all sessionStorage keys
    try {
      sessionStorage.clear();
    } catch (e) {}

    // 3. Dispatch a custom window event for real-time reactivity in mounted UI components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("saju_session_cleared"));
    }
  } catch (e) {
    console.warn("Failed to clear session and local storage data:", e);
  }
}

// Sign-Out Function (cleanses session immediately)
export async function signOutUser(): Promise<void> {
  try {
    clearAllSessionAndLocalData();
    await signOut(auth);
  } catch (error) {
    console.error("Sign-Out failed:", error);
    throw error;
  }
}

export interface PersonalSajuProfile {
  nickname: string;
  gender: "남성" | "여성";
  birth_date: string;
  birth_time: string | null;
  saju: any;
  character_emoji: string;
  character_animal: string;
  character_color: string;
  mbti?: string | null;
  birthplace_region?: string | null;
  birthplace_city?: string | null;
  updatedAt?: number;
  ownerUid?: string | null;
}

// Save User Personal Saju Profile (Local & Cloud Sync)
export function saveUserPersonalProfile(profile: PersonalSajuProfile): void {
  try {
    const currentUid = auth.currentUser && !auth.currentUser.isAnonymous ? auth.currentUser.uid : null;
    const payload: PersonalSajuProfile = {
      ...profile,
      ownerUid: currentUid,
      updatedAt: Date.now()
    };
    localStorage.setItem("saju_my_personal_profile", JSON.stringify(payload));
    
    // If user is authenticated, also sync to Firestore
    if (currentUid) {
      swrCache.invalidate(`profile_${currentUid}`);
      setDoc(doc(db, "users", currentUid), {
        personalProfile: payload,
        updatedAt: Date.now()
      }, { merge: true }).catch((err) => console.debug("Error saving personal profile to firestore:", err));
    }
  } catch (err) {
    console.error("Failed to save personal profile:", err);
  }
}

// Get User Personal Saju Profile (Local & Cloud Sync via SWR Cache)
export async function getUserPersonalProfile(): Promise<PersonalSajuProfile | null> {
  try {
    const currentUid = auth.currentUser && !auth.currentUser.isAnonymous ? auth.currentUser.uid : null;

    // 1. Try Firestore with SWR cache if user is logged in
    if (currentUid) {
      return await swrCache.get(`profile_${currentUid}`, async () => {
        const userSnap = await getDoc(doc(db, "users", currentUid));
        if (userSnap.exists() && userSnap.data()?.personalProfile) {
          const firestoreProfile = userSnap.data().personalProfile as PersonalSajuProfile;
          localStorage.setItem("saju_my_personal_profile", JSON.stringify(firestoreProfile));
          return firestoreProfile;
        }
        localStorage.removeItem("saju_my_personal_profile");
        return null;
      }, 60 * 1000);
    }

    // 2. Fallback to localStorage ONLY for unauthenticated guest session
    const localStr = localStorage.getItem("saju_my_personal_profile");
    if (localStr) {
      const parsed = JSON.parse(localStr);
      if (parsed.ownerUid && parsed.ownerUid !== currentUid) {
        localStorage.removeItem("saju_my_personal_profile");
        return null;
      }
      return parsed;
    }
  } catch (err) {
    console.error("Error reading personal saju profile:", err);
  }
  return null;
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
  clearAllSessionAndLocalData();
}

// Check if user has premium subscription activated
export async function checkPremiumStatus(uid?: string): Promise<boolean> {
  const targetUid = uid || auth.currentUser?.uid;
  const isAuth = !!auth.currentUser;

  // 1. If we have an authenticated session, query Firestore first as the strict source of truth
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
      } else {
        // User doc not found in Firestore -> definitively NOT premium
        localStorage.removeItem("saju_premium_unlocked_local");
        return false;
      }
    } catch (err: any) {
      console.log("Firestore premium status check error:", err.message || err);
      // On error for authenticated user, do not assume unlocked
      return false;
    }
  }

  // 2. Fallback to local storage override ONLY for unauthenticated guest or offline testing
  if (!isAuth && localStorage.getItem("saju_premium_unlocked_local") === "true") {
    return true;
  }

  return false;
}

// Check if specific product is unlocked (or if global premium is active)
export async function checkProductUnlock(productType: "pdf" | "secret" | "group" | "personal_report", uid?: string): Promise<boolean> {
  const targetUid = uid || auth.currentUser?.uid;
  const isAuth = !!auth.currentUser;

  // 1. If we have an authenticated session, query Firestore first as the strict source of truth
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
          if (productType === "personal_report" || productType === "pdf") {
            isProductUnlocked = data.unlockedProducts.includes("personal_report") || data.unlockedProducts.includes("pdf");
          } else if (data.unlockedProducts.includes(productType)) {
            isProductUnlocked = true;
          }
        }

        const isFullyUnlocked = isGlobalPremium || isProductUnlocked;

        // Sync local storage state to match cloud authority!
        if (isFullyUnlocked) {
          localStorage.setItem(`saju_unlocked_${productType}`, "true");
          if (productType === "personal_report" || productType === "pdf") {
            localStorage.setItem("saju_unlocked_personal_report", "true");
            localStorage.setItem("saju_unlocked_pdf", "true");
          }
          if (isGlobalPremium) {
            localStorage.setItem("saju_premium_unlocked_local", "true");
          }
        } else {
          localStorage.removeItem(`saju_unlocked_${productType}`);
          if (productType === "personal_report" || productType === "pdf") {
            localStorage.removeItem("saju_unlocked_personal_report");
            localStorage.removeItem("saju_unlocked_pdf");
          }
          if (!isGlobalPremium) {
            localStorage.removeItem("saju_premium_unlocked_local");
          }
        }

        return isFullyUnlocked;
      } else {
        // Document does not exist in cloud -> strictly NOT unlocked
        localStorage.removeItem(`saju_unlocked_${productType}`);
        localStorage.removeItem("saju_premium_unlocked_local");
        return false;
      }
    } catch (err: any) {
      console.log("Firestore product unlock check error:", err.message || err);
      return false;
    }
  }

  // 2. Fallback check ONLY for non-authenticated guest mode
  if (!isAuth) {
    const isMasterPremium = localStorage.getItem("saju_premium_unlocked_local") === "true";
    if (isMasterPremium) return true;
    try {
      if (productType === "personal_report" || productType === "pdf") {
        const local1 = localStorage.getItem("saju_unlocked_personal_report") === "true";
        const local2 = localStorage.getItem("saju_unlocked_pdf") === "true";
        if (local1 || local2) return true;
      } else {
        const localUnlocked = localStorage.getItem(`saju_unlocked_${productType}`);
        if (localUnlocked === "true") return true;
      }
    } catch (e) {}
  }

  return false;
}

// Activate premium trial simulation (supports instant 7-day trial or specific product purchase)
export async function activatePremiumSimulation(
  uid?: string,
  productType?: "pdf" | "secret" | "group" | "personal_report",
  couponCode?: string
): Promise<boolean> {
  if (productType) {
    localStorage.setItem(`saju_unlocked_${productType}`, "true");
    if (productType === "personal_report" || productType === "pdf") {
      localStorage.setItem("saju_unlocked_personal_report", "true");
      localStorage.setItem("saju_unlocked_pdf", "true");
    }
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
        const normType = (productType === "personal_report" || productType === "pdf") ? "pdf" : productType;
        if (!currentUnlocked.includes(normType)) {
          currentUnlocked.push(normType);
        }
        if (normType === "pdf") {
          if (!currentUnlocked.includes("personal_report")) {
            currentUnlocked.push("personal_report");
          }
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

// Global Built-in Promo Coupons (fallback & instant demo)
export const BUILT_IN_PROMO_COUPONS: Record<string, { productType: "all" | "pdf" | "secret" | "group"; name: string; campaignSource: string }> = {
  "INYEON2026": { productType: "all", name: "인연 명당 전체 올패스 프리미엄", campaignSource: "기본 내장 프로모션 (인연명당)" },
  "WELCOME2026": { productType: "all", name: "신규 환영 전체 올패스 프리미엄", campaignSource: "신규 가입 환영 이벤트" },
  "BETA2026": { productType: "all", name: "오픈 베타 특별 체험권", campaignSource: "오픈베타 기념 프로모션" },
  "FATE2026": { productType: "all", name: "운명 상생 마스터 패스", campaignSource: "운명 상생 캠페인" },
  "PDF2026": { productType: "pdf", name: "AI 심층 리포트 PDF 소장권", campaignSource: "PDF 소장본 체험 배포" },
  "SECRET2026": { productType: "secret", name: "비밀 인연·속마음 상성 해독권", campaignSource: "비밀인연 출시 기념" },
  "GROUP2026": { productType: "group", name: "그룹 오행 총괄 분석서", campaignSource: "그룹오행 런칭 이벤트" },
  "VIPFREE": { productType: "all", name: "VIP 무료 초대권", campaignSource: "VIP 특별 초대 채널" },
};

// Helper to strip undefined values recursively before writing to Firestore
export function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as any;
  }
  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const key of Object.keys(obj as any)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleaned[key] = cleanUndefined(val);
      }
    }
    return cleaned;
  }
  return obj;
}

// Redeem Coupon Function (Atomic Transaction, Strict 1-Per-User, Limited Max Quantity Verification)
export async function redeemCoupon(couponCode: string): Promise<{ success: boolean; message: string; productType?: "all" | "pdf" | "secret" | "group" }> {
  const cleanCode = couponCode.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, message: "쿠폰 코드를 입력해 주세요." };
  }

  // 1. Get current user ID
  let currentUser = auth.currentUser;
  if (!currentUser) {
    try {
      currentUser = await getAnonymousUser();
    } catch (e) {
      console.debug("Anonymous auth fallback on coupon:", e);
    }
  }
  const currentUid = currentUser?.uid || 
                     localStorage.getItem("saju_fallback_guest_uid") || 
                     ("guest_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now());

  if (!auth.currentUser && currentUser && !currentUser.uid.startsWith("guest_")) {
    localStorage.setItem("saju_fallback_guest_uid", currentUser.uid);
  } else if (!auth.currentUser && !localStorage.getItem("saju_fallback_guest_uid")) {
    localStorage.setItem("saju_fallback_guest_uid", currentUid);
  }

  // 2. Check if the user has ALREADY redeemed this coupon locally or in user record
  const userDocRef = doc(db, "users", currentUid);
  let userSnap = null;
  try {
    userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const userAppliedCoupons: string[] = userData.appliedCoupons || [];
      if (userAppliedCoupons.includes(cleanCode)) {
        return {
          success: false,
          message: "이미 등록하여 사용 중인 쿠폰입니다. (동일한 쿠폰은 1인당 1회만 등록 가능합니다)"
        };
      }
    }
  } catch (e) {
    console.warn("User applied coupons check note:", e);
  }

  // 3. Check Built-in Promo codes (1-Per-User enforced)
  if (BUILT_IN_PROMO_COUPONS[cleanCode]) {
    const promo = BUILT_IN_PROMO_COUPONS[cleanCode];
    if (promo.productType === "all") {
      await activatePremiumSimulation(currentUid, undefined, cleanCode);
    } else {
      await activatePremiumSimulation(currentUid, promo.productType, cleanCode);
    }
    
    // Award 1 single-use ticket with structured audit trace
    await addTicketsToUser(
      promo.productType, 
      1, 
      `프로모션 쿠폰 [${cleanCode}] 등록 (${promo.name})`, 
      currentUid, 
      "promotion", 
      cleanCode
    );

    // Also write to users collection to prevent duplicate registration
    try {
      await setDoc(userDocRef, {
        appliedCoupons: arrayUnion(cleanCode),
        couponHistory: arrayUnion({
          code: cleanCode,
          productType: promo.productType,
          redeemedAt: new Date().toISOString(),
          campaignSource: promo.campaignSource
        }),
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.warn("User appliedCoupons record error for promo:", e);
    }

    return {
      success: true,
      productType: promo.productType,
      message: `🎉 프로모션 쿠폰 [${cleanCode}] 등록 완료! (${promo.name} 혜택이 적용되었습니다)`
    };
  }

  // 4. Atomic Firestore Transaction for Limited-Quantity Coupons (e.g. 20 Unique Users limit)
  try {
    const couponRef = doc(db, "coupons", cleanCode);

    const transactionResult = await runTransaction(db, async (transaction) => {
      const couponDoc = await transaction.get(couponRef);

      if (!couponDoc.exists()) {
        throw new Error("존재하지 않거나 만료된 쿠폰 번호입니다. 코드를 다시 확인해 주세요.");
      }

      const couponData = couponDoc.data();

      // Check if coupon is active
      if (couponData.isActive === false) {
        throw new Error("사용이 일시 중지되었거나 비활성화된 쿠폰입니다.");
      }

      // Check user-level uniqueness (Has this UID already redeemed this coupon?)
      const usedUsers: string[] = couponData.usedUsers || [];
      if (usedUsers.includes(currentUid)) {
        throw new Error("이미 등록하여 사용 중인 쿠폰입니다. (동일한 쿠폰은 1인당 1회만 등록 가능합니다)");
      }

      // Check max unique quota (e.g. 20 users)
      const currentUses = Number(couponData.usedCount || usedUsers.length || 0);
      const maxUses = Number(couponData.maxUses || 1);

      if (currentUses >= maxUses) {
        throw new Error(`준비된 선착순 수량(${maxUses}명 한정)이 모두 소진되어 마감된 쿠폰입니다.`);
      }

      // Read user document within transaction
      const userDocInTx = await transaction.get(userDocRef);
      if (userDocInTx.exists()) {
        const uData = userDocInTx.data();
        if ((uData.appliedCoupons || []).includes(cleanCode)) {
          throw new Error("이미 등록하여 사용 중인 쿠폰입니다. (동일한 쿠폰은 1인당 1회만 등록 가능합니다)");
        }
      }

      // Read user_tickets/{uid} document within transaction
      const ticketDocRef = doc(db, "user_tickets", currentUid);
      const ticketDocInTx = await transaction.get(ticketDocRef);
      
      let ticketAccount: UserTicketAccount;
      if (ticketDocInTx.exists()) {
        ticketAccount = ticketDocInTx.data() as UserTicketAccount;
      } else {
        const referralCode = "REF-" + currentUid.slice(0, 5).toUpperCase();
        ticketAccount = {
          userUid: currentUid,
          userEmail: currentUser?.email || null,
          referralCode,
          invitedCount: 0,
          tickets: { pdf: 0, secret: 0, group: 0, all: 0 },
          consumedHistory: [],
          userTier: "free",
          updatedAt: new Date().toISOString()
        };
      }

      const pType = couponData.productType || "all";

      // Add the ticket
      ticketAccount.tickets[pType] = (ticketAccount.tickets[pType] || 0) + 1;
      ticketAccount.userTier = "coupon";
      ticketAccount.updatedAt = new Date().toISOString();

      if (!ticketAccount.grantHistory) ticketAccount.grantHistory = [];
      ticketAccount.grantHistory.unshift({
        id: "GRANT-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toISOString(),
        sourceType: "coupon",
        couponCode: cleanCode,
        productType: pType,
        amount: 1,
        reason: `쿠폰 [${cleanCode}] 등록 (${couponData.campaignSource || "일반 발급"})`
      });

      const redemptionDetail = {
        uid: currentUid,
        redeemedAt: new Date().toISOString(),
        productType: pType,
        userEmail: currentUser?.email || (currentUid.startsWith("guest_") ? "게스트" : "익명회원"),
        campaignSource: couponData.campaignSource || "일반 발급"
      };

      // Atomic updates with audit detail
      transaction.update(couponRef, {
        usedCount: currentUses + 1,
        usedUsers: arrayUnion(currentUid),
        usedDetails: arrayUnion(redemptionDetail),
        lastUsedAt: new Date().toISOString()
      });

      transaction.set(userDocRef, {
        appliedCoupons: arrayUnion(cleanCode),
        couponHistory: arrayUnion({
          code: cleanCode,
          productType: pType,
          redeemedAt: new Date().toISOString(),
          campaignSource: couponData.campaignSource || "일반 발급"
        }),
        updatedAt: Date.now()
      }, { merge: true });

      // Save user ticket account securely inside transaction
      const cleanedTicketAccount = cleanUndefined(ticketAccount);
      transaction.set(ticketDocRef, cleanedTicketAccount, { merge: true });

      return {
        productType: pType,
        campaignSource: couponData.campaignSource || "일반 발급",
        maxUses: maxUses,
        remainingUses: maxUses - (currentUses + 1),
        ticketAccount
      };
    });

    const productType: "all" | "pdf" | "secret" | "group" = transactionResult.productType;
    if (productType === "all") {
      await activatePremiumSimulation(currentUid, undefined, cleanCode);
    } else {
      await activatePremiumSimulation(currentUid, productType, cleanCode);
    }

    // Sync local storage ticket cache immediately after successful commit
    const finalAccount = transactionResult.ticketAccount;
    localStorage.setItem(`saju_ticket_account_${currentUid}`, JSON.stringify(finalAccount));
    const total = (finalAccount.tickets.pdf || 0) + 
                  (finalAccount.tickets.secret || 0) + 
                  (finalAccount.tickets.group || 0) + 
                  (finalAccount.tickets.all || 0);
    localStorage.setItem("saju_ticket_count", String(total));

    const productLabel = 
      productType === "pdf" ? "AI 심층 리포트 PDF 소장권" :
      productType === "secret" ? "비밀 인연·속마음 상성 해독권" :
      productType === "group" ? "그룹 오행 총괄 분석서" : "전체 프리미엄 올패스";

    return {
      success: true,
      productType,
      message: `🎉 쿠폰 [${cleanCode}] 등록 성공! [${productLabel}] 혜택이 지급되었습니다. (남은 잔여 수량: ${transactionResult.remainingUses}개)`
    };
  } catch (err: any) {
    console.error("Firestore coupon transaction error:", err);
    let errMsg = err.message || "쿠폰 확인 중 오류가 발생했습니다.";
    if (typeof errMsg === "string") {
      if (errMsg.includes("Transaction failed:")) {
        const parts = errMsg.split("Transaction failed:");
        errMsg = parts[parts.length - 1].trim();
      }
      if (errMsg.includes("Error:")) {
        const parts = errMsg.split("Error:");
        errMsg = parts[parts.length - 1].trim();
      }
    }
    return {
      success: false,
      message: errMsg
    };
  }
}

// 🛠️ Admin / System Helper: Create or Seed Limited Quantity Coupons
export async function createOrUpdateCoupon(
  code: string, 
  maxUses: number = 20, 
  productType: "all" | "pdf" | "secret" | "group" = "all",
  description: string = "오픈 기념 한정 쿠폰",
  campaignSource: string = "관리자 직접발급"
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanCode = code.trim().toUpperCase();
    const couponRef = doc(db, "coupons", cleanCode);
    
    await setDoc(couponRef, {
      code: cleanCode,
      maxUses: Number(maxUses),
      usedCount: 0,
      usedUsers: [],
      usedDetails: [],
      productType,
      description,
      campaignSource: campaignSource.trim() || "관리자 직접발급",
      isActive: true,
      createdAt: new Date().toISOString()
    }, { merge: true });

    return {
      success: true,
      message: `쿠폰 [${cleanCode}]이 ${maxUses}명 한정으로 생성되었습니다. (유입 출처: ${campaignSource})`
    };
  } catch (err: any) {
    return {
      success: false,
      message: "쿠폰 생성 실패: " + (err.message || err)
    };
  }
}

// ==========================================
// 🎟️ SINGLE-USE TICKETS & INVITATION REWARDS
// ==========================================

import { User, Room, Member, UserTicketAccount, TicketProductType, TicketConsumptionRecord } from "../types";
import { swrCache } from "./swrCache";

export async function getUserTicketAccount(targetUid?: string): Promise<UserTicketAccount> {
  const uid = targetUid || 
              auth.currentUser?.uid || 
              localStorage.getItem("saju_fallback_guest_uid") || 
              ("guest_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now());

  if (!localStorage.getItem("saju_fallback_guest_uid")) {
    localStorage.setItem("saju_fallback_guest_uid", uid);
  }

  // Check Firestore first with SWR cache
  try {
    return await swrCache.get(`ticket_${uid}`, async () => {
      const ticketDocRef = doc(db, "user_tickets", uid);
      const snap = await getDoc(ticketDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserTicketAccount;
        
        // Update email if empty or changed
        const currentEmail = auth.currentUser?.email;
        if (currentEmail && data.userEmail !== currentEmail) {
          data.userEmail = currentEmail;
          await setDoc(ticketDocRef, { userEmail: currentEmail }, { merge: true });
        }

        // Sync local storage ticket cache
        const totalTickets = (data.tickets.pdf || 0) + (data.tickets.secret || 0) + (data.tickets.group || 0) + (data.tickets.all || 0);
        localStorage.setItem("saju_ticket_count", String(totalTickets));
        localStorage.setItem("saju_user_tier", data.userTier || "free");
        return data;
      }

      // Initialize new ticket account (Zero default tickets unless earned via coupon or referral)
      const localSaved = localStorage.getItem(`saju_ticket_account_${uid}`);
      if (localSaved) {
        try {
          return JSON.parse(localSaved) as UserTicketAccount;
        } catch (e) {}
      }

      const initialAccount: UserTicketAccount = {
        uid,
        userEmail: auth.currentUser?.email || undefined,
        userTier: "free",
        tickets: { pdf: 0, secret: 0, group: 0, all: 0 },
        consumedTickets: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await setDoc(ticketDocRef, initialAccount, { merge: true });
      return initialAccount;
    }, 30 * 1000);
  } catch (err) {
    console.debug("Failed reading user_tickets from Firestore, using local fallback:", err);
  }

  // Initialize new ticket account (Zero default tickets unless earned via coupon or referral)
  const localSaved = localStorage.getItem(`saju_ticket_account_${uid}`);
  if (localSaved) {
    try {
      return JSON.parse(localSaved);
    } catch {}
  }

  const referralCode = "REF-" + uid.slice(0, 5).toUpperCase();
  const initialAccount: UserTicketAccount = {
    userUid: uid,
    userEmail: auth.currentUser?.email || null,
    referralCode,
    invitedCount: 0,
    tickets: {
      pdf: 0,
      secret: 0,
      group: 0,
      all: 0
    },
    consumedHistory: [],
    userTier: "free",
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, "user_tickets", uid), initialAccount, { merge: true });
  } catch (e) {
    console.debug("Failed saving initial user_tickets to Firestore:", e);
  }

  localStorage.setItem(`saju_ticket_account_${uid}`, JSON.stringify(initialAccount));
  localStorage.setItem("saju_ticket_count", "0");
  return initialAccount;
}

export async function consumeSingleUseTicket(
  productType: TicketProductType,
  context?: { roomCode?: string; pairKey?: string; label?: string },
  targetUid?: string
): Promise<{ success: boolean; message: string; remainingTickets: number; alreadyUnlocked?: boolean }> {
  const account = await getUserTicketAccount(targetUid);
  const remaining = (account.tickets.pdf || 0) + (account.tickets.secret || 0) + (account.tickets.group || 0) + (account.tickets.all || 0);

  // 1. Idempotency Guard: Check if the user has ALREADY unlocked this product
  const normType = productType === "pdf" ? "personal_report" : productType;
  const isAlreadyUnlocked = 
    localStorage.getItem(`saju_unlocked_${productType}`) === "true" ||
    localStorage.getItem(`saju_unlocked_${normType}`) === "true" ||
    localStorage.getItem("saju_premium_unlocked_local") === "true";

  if (isAlreadyUnlocked) {
    // Ensure cloud sync without deducting tickets
    try {
      await activatePremiumSimulation(account.userUid, normType as any);
    } catch (e) {}

    return {
      success: true,
      alreadyUnlocked: true,
      message: `✓ 이미 해금 완료된 콘텐츠입니다. 확인권 차감 없이 바로 열람합니다. (잔여 확인권: ${remaining}장)`,
      remainingTickets: remaining
    };
  }

  const currentSpecific = account.tickets[productType] || 0;
  const currentAll = account.tickets.all || 0;

  if (currentSpecific <= 0 && currentAll <= 0) {
    return {
      success: false,
      message: "보유하신 1회 확인권이 없습니다. 친구를 초대하거나 쿠폰을 등록해 티켓을 충전해 주세요!",
      remainingTickets: 0
    };
  }

  // Deduct from specific first, then all
  if (currentSpecific > 0) {
    account.tickets[productType] = currentSpecific - 1;
  } else {
    account.tickets.all = currentAll - 1;
  }

  const record: TicketConsumptionRecord = {
    timestamp: new Date().toISOString(),
    productType,
    roomCode: context?.roomCode,
    pairKey: context?.pairKey,
    label: context?.label || `${productType.toUpperCase()} 1회 확인권 소모`
  };

  account.consumedHistory = [record, ...(account.consumedHistory || [])];
  account.userTier = "coupon"; // Elevated to coupon/trial user
  account.updatedAt = new Date().toISOString();

  // Save to Firestore user_tickets
  try {
    swrCache.invalidate(`ticket_${account.userUid}`);
    await setDoc(doc(db, "user_tickets", account.userUid), cleanUndefined(account), { merge: true });
  } catch (e) {
    console.debug("Firestore update user_tickets skip:", e);
  }

  // CRITICAL: Synchronize permanent unlock in Firestore users collection so checkProductUnlock recognizes it!
  try {
    await activatePremiumSimulation(account.userUid, normType as any);
  } catch (e) {
    console.debug("Failed to sync activatePremiumSimulation on consume ticket:", e);
  }

  localStorage.setItem(`saju_ticket_account_${account.userUid}`, JSON.stringify(account));
  localStorage.setItem(`saju_unlocked_${productType}`, "true");
  if (productType === "pdf") {
    localStorage.setItem("saju_unlocked_personal_report", "true");
  }
  localStorage.setItem("saju_user_tier", "coupon");

  const newRemaining = (account.tickets.pdf || 0) + (account.tickets.secret || 0) + (account.tickets.group || 0) + (account.tickets.all || 0);
  localStorage.setItem("saju_ticket_count", String(newRemaining));

  return {
    success: true,
    message: `🎫 1회 확인권 1장을 소모하여 ${record.label}을(를) 확인합니다! (남은 확인권: ${newRemaining}장)`,
    remainingTickets: newRemaining
  };
}

export async function addTicketsToUser(
  productType: TicketProductType,
  count: number,
  reason: string,
  targetUid?: string,
  sourceType: "coupon" | "referral" | "manual_admin" | "promotion" | "system" = "system",
  couponCode?: string,
  adminUid?: string
): Promise<UserTicketAccount> {
  const account = await getUserTicketAccount(targetUid);
  account.tickets[productType] = (account.tickets[productType] || 0) + count;
  account.userTier = "coupon";
  account.updatedAt = new Date().toISOString();

  if (!account.grantHistory) account.grantHistory = [];
  account.grantHistory.unshift({
    id: "GRANT-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    sourceType,
    couponCode: couponCode || undefined,
    productType,
    amount: count,
    reason,
    adminUid: adminUid || undefined
  });

  try {
    await setDoc(doc(db, "user_tickets", account.userUid), cleanUndefined(account), { merge: true });
  } catch (e) {
    console.debug("Firestore add tickets skip:", e);
  }

  localStorage.setItem(`saju_ticket_account_${account.userUid}`, JSON.stringify(account));
  const total = (account.tickets.pdf || 0) + (account.tickets.secret || 0) + (account.tickets.group || 0) + (account.tickets.all || 0);
  localStorage.setItem("saju_ticket_count", String(total));

  return account;
}

/**
 * Fetches all user ticket accounts from Firestore user_tickets collection.
 */
export async function fetchAllUserTicketAccounts(): Promise<UserTicketAccount[]> {
  try {
    const snap = await getDocs(collection(db, "user_tickets"));
    const accounts: UserTicketAccount[] = [];
    snap.forEach((d) => {
      const data = d.data() as UserTicketAccount;
      accounts.push({
        ...data,
        userUid: d.id,
        tickets: {
          pdf: Number(data.tickets?.pdf || 0),
          secret: Number(data.tickets?.secret || 0),
          group: Number(data.tickets?.group || 0),
          all: Number(data.tickets?.all || 0),
        },
        grantHistory: Array.isArray(data.grantHistory) ? data.grantHistory : [],
        consumedHistory: Array.isArray(data.consumedHistory) ? data.consumedHistory : []
      });
    });
    return accounts.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  } catch (err) {
    console.error("Failed fetching all user tickets:", err);
    return [];
  }
}

/**
 * Directly adjust tickets for any specific user UID in Firestore
 */
export async function adjustUserTicketsInDb(
  targetUid: string,
  productType: "pdf" | "secret" | "group" | "all",
  delta: number,
  reason: string = "관리자 수동 조정"
): Promise<{ success: boolean; message: string; newBalance?: number }> {
  if (!targetUid) return { success: false, message: "사용자 UID가 누락되었습니다." };

  try {
    const ticketDocRef = doc(db, "user_tickets", targetUid);
    const snap = await getDoc(ticketDocRef);

    let account: UserTicketAccount;
    if (snap.exists()) {
      account = snap.data() as UserTicketAccount;
    } else {
      account = {
        userUid: targetUid,
        referralCode: "REF-" + targetUid.slice(0, 5).toUpperCase(),
        invitedCount: 0,
        tickets: { pdf: 0, secret: 0, group: 0, all: 0 },
        grantHistory: [],
        consumedHistory: [],
        userTier: "free",
        updatedAt: new Date().toISOString()
      };
    }

    if (!account.tickets) {
      account.tickets = { pdf: 0, secret: 0, group: 0, all: 0 };
    }
    if (!account.grantHistory) account.grantHistory = [];
    if (!account.consumedHistory) account.consumedHistory = [];

    const currentCount = Number(account.tickets[productType] || 0);
    const newCount = Math.max(0, currentCount + delta);
    account.tickets[productType] = newCount;
    account.updatedAt = new Date().toISOString();

    const currentAdminUid = auth.currentUser?.uid || "ADMIN_CONSOLE";

    if (delta > 0) {
      account.grantHistory.unshift({
        id: "ADMIN_GRANT-" + Date.now(),
        timestamp: new Date().toISOString(),
        sourceType: "manual_admin",
        productType,
        amount: delta,
        reason: `${reason} (+${delta}장 -> 잔여 ${newCount}장)`,
        adminUid: currentAdminUid
      });
    } else {
      account.consumedHistory.unshift({
        productType,
        roomCode: "ADMIN",
        timestamp: new Date().toISOString(),
        label: `${reason} (${delta}장 차감 -> 잔여 ${newCount}장)`
      });
    }

    await setDoc(ticketDocRef, account, { merge: true });

    // If current logged-in user matches targetUid, update local storage too
    if (auth.currentUser?.uid === targetUid) {
      localStorage.setItem(`saju_ticket_account_${targetUid}`, JSON.stringify(account));
      const total = (account.tickets.pdf || 0) + (account.tickets.secret || 0) + (account.tickets.group || 0) + (account.tickets.all || 0);
      localStorage.setItem("saju_ticket_count", String(total));
    }

    return {
      success: true,
      message: `UID(${targetUid.slice(0, 8)}...)의 [${productType.toUpperCase()}] 티켓이 ${newCount}장으로 업데이트되었습니다.`,
      newBalance: newCount
    };
  } catch (err: any) {
    console.error("Failed adjusting user tickets in DB:", err);
    return {
      success: false,
      message: "티켓 조정 실패: " + (err.message || err)
    };
  }
}

/**
 * Completely resets a user account to zero (both in Firestore and localStorage).
 * Wipes out all tickets, unlocked products, applied coupons, and premium status.
 */
export async function resetUserAccountToZero(targetUid?: string): Promise<{ success: boolean; message: string }> {
  const uid = targetUid || auth.currentUser?.uid || localStorage.getItem("saju_fallback_guest_uid");
  if (!uid) {
    return { success: false, message: "초기화할 사용자 계정을 찾을 수 없습니다." };
  }

  try {
    // 1. Reset Firestore user_tickets/{uid} document (Guaranteed)
    const ticketDocRef = doc(db, "user_tickets", uid);
    const zeroAccount: UserTicketAccount = {
      userUid: uid,
      referralCode: "REF-" + uid.slice(0, 5).toUpperCase(),
      invitedCount: 0,
      tickets: {
        pdf: 0,
        secret: 0,
        group: 0,
        all: 0
      },
      consumedHistory: [],
      userTier: "free",
      updatedAt: new Date().toISOString()
    };
    await setDoc(ticketDocRef, zeroAccount);

    // 2. Reset Firestore users/{uid} document (Wrapped safely)
    try {
      const userDocRef = doc(db, "users", uid);
      await setDoc(userDocRef, {
        isPremium: false,
        premiumUntil: null,
        unlockedProducts: [],
        appliedCoupons: [],
        couponUnlocks: {},
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.debug("users doc reset skipped:", e);
    }

    // 3. Clear all related localStorage keys
    localStorage.removeItem("saju_premium_unlocked_local");
    localStorage.removeItem("saju_unlocked_pdf");
    localStorage.removeItem("saju_unlocked_secret");
    localStorage.removeItem("saju_unlocked_group");
    localStorage.removeItem("saju_unlocked_personal_report");
    localStorage.removeItem("saju_ticket_count");
    localStorage.removeItem("saju_user_tier");
    localStorage.removeItem(`saju_ticket_account_${uid}`);
    localStorage.setItem("saju_ticket_count", "0");
    localStorage.setItem("saju_user_tier", "free");

    return {
      success: true,
      message: `계정(${uid.slice(0, 8)}...)의 티켓(0장) 및 해금 내역이 클라우드 DB와 로컬에서 0건으로 초기화되었습니다.`
    };
  } catch (err: any) {
    console.error("Failed resetting user account to zero:", err);
    return {
      success: false,
      message: "계정 초기화 실패: " + (err.message || err)
    };
  }
}

/**
 * Permanently deletes a user ticket account document from Firestore user_tickets collection.
 */
export async function deleteUserTicketAccountFromDb(targetUid: string): Promise<{ success: boolean; message: string }> {
  if (!targetUid) return { success: false, message: "사용자 UID가 없습니다." };
  try {
    await deleteDoc(doc(db, "user_tickets", targetUid));
    return {
      success: true,
      message: `UID(${targetUid.slice(0, 8)}...) 티켓 레코드가 Firestore에서 완전히 삭제되었습니다.`
    };
  } catch (err: any) {
    console.error("Failed deleting user ticket doc:", err);
    return {
      success: false,
      message: "티켓 레코드 삭제 실패: " + (err.message || err)
    };
  }
}

/**
 * Batch resets ALL user ticket accounts in Firestore to 0 tickets.
 */
export async function resetAllUserAccountsToZero(): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const snap = await getDocs(collection(db, "user_tickets"));
    let resetCount = 0;
    
    for (const d of snap.docs) {
      const uid = d.id;
      const data = d.data() as UserTicketAccount;
      const zeroAccount: UserTicketAccount = {
        ...data,
        userUid: uid,
        tickets: { pdf: 0, secret: 0, group: 0, all: 0 },
        userTier: "free",
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, "user_tickets", uid), zeroAccount);
      resetCount++;
    }

    // Clear local storage for current user too
    localStorage.removeItem("saju_premium_unlocked_local");
    localStorage.removeItem("saju_unlocked_pdf");
    localStorage.removeItem("saju_unlocked_secret");
    localStorage.removeItem("saju_unlocked_group");
    localStorage.removeItem("saju_ticket_count");
    localStorage.setItem("saju_ticket_count", "0");
    localStorage.setItem("saju_user_tier", "free");

    return {
      success: true,
      message: `총 ${resetCount}개 계정의 Firestore 보유 티켓을 0장으로 일괄 초기화 완료하였습니다.`,
      count: resetCount
    };
  } catch (err: any) {
    console.error("Failed batch reset of all user accounts:", err);
    return {
      success: false,
      message: "전체 초기화 실패: " + (err.message || err),
      count: 0
    };
  }
}

/**
 * Retrieves real-time raw DB state for debugging and inspection.
 */
export async function getRealtimeAccountDebugInfo(targetUid?: string): Promise<{
  uid: string;
  email: string | null;
  firestoreUserDoc: any;
  firestoreTicketDoc: any;
  localStorageState: Record<string, string | null>;
}> {
  const uid = targetUid || auth.currentUser?.uid || localStorage.getItem("saju_fallback_guest_uid") || "unknown";
  const email = auth.currentUser?.email || null;

  let firestoreUserDoc: any = null;
  let firestoreTicketDoc: any = null;

  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (userSnap.exists()) {
      firestoreUserDoc = userSnap.data();
    }
  } catch (e) {
    firestoreUserDoc = { error: String(e) };
  }

  try {
    const ticketSnap = await getDoc(doc(db, "user_tickets", uid));
    if (ticketSnap.exists()) {
      firestoreTicketDoc = ticketSnap.data();
    }
  } catch (e) {
    firestoreTicketDoc = { error: String(e) };
  }

  const localStorageState = {
    saju_premium_unlocked_local: localStorage.getItem("saju_premium_unlocked_local"),
    saju_unlocked_pdf: localStorage.getItem("saju_unlocked_pdf"),
    saju_unlocked_secret: localStorage.getItem("saju_unlocked_secret"),
    saju_unlocked_group: localStorage.getItem("saju_unlocked_group"),
    saju_ticket_count: localStorage.getItem("saju_ticket_count"),
    saju_user_tier: localStorage.getItem("saju_user_tier"),
  };

  return {
    uid,
    email,
    firestoreUserDoc,
    firestoreTicketDoc,
    localStorageState
  };
}

export async function processReferralReward(referrerId: string): Promise<boolean> {
  if (!referrerId) return false;
  const currentUid = auth.currentUser?.uid || localStorage.getItem("saju_fallback_guest_uid");
  if (referrerId === currentUid) return false; // Cannot refer self

  const referralKey = `saju_referred_by_${referrerId}`;
  if (localStorage.getItem(referralKey)) {
    return false; // Already processed
  }

  try {
    // Reward the referrer: +1 all ticket
    const referrerAccount = await getUserTicketAccount(referrerId);
    referrerAccount.invitedCount = (referrerAccount.invitedCount || 0) + 1;
    referrerAccount.tickets.all = (referrerAccount.tickets.all || 0) + 1;
    referrerAccount.updatedAt = new Date().toISOString();
    if (!referrerAccount.grantHistory) referrerAccount.grantHistory = [];
    referrerAccount.grantHistory.unshift({
      id: "REF_REWARD-" + Date.now(),
      timestamp: new Date().toISOString(),
      sourceType: "referral",
      productType: "all",
      amount: 1,
      reason: `친구 초대 성공 보상 (피초대자: ${currentUid?.slice(0, 8)}...)`
    });

    await setDoc(doc(db, "user_tickets", referrerId), cleanUndefined(referrerAccount), { merge: true });

    // Also reward current user with +1 Welcome ticket
    await addTicketsToUser(
      "all", 
      1, 
      `친구 초대 링크 접속 보너스 (초대자: ${referrerId.slice(0, 8)}...)`,
      undefined,
      "referral"
    );

    localStorage.setItem(referralKey, "true");
    return true;
  } catch (err) {
    console.debug("Referral reward error:", err);
    return false;
  }
}

// ==========================================
// 📊 TELEMETRY & ANALYTICS EVENT LOGGING
// ==========================================

export async function logAnalyticsEvent(
  eventName: string,
  category: "navigation" | "monetization" | "saju_view" | "viral" | "survey" | "system" = "navigation",
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const user = auth.currentUser;
    const uid = user?.uid || localStorage.getItem("saju_fallback_guest_uid") || "guest_anon";
    const tier = (localStorage.getItem("saju_user_tier") || "free") as UserTierType;
    const email = user?.email || null;

    const eventPayload = sanitizeFirestoreData({
      eventName,
      category,
      userTier: tier,
      userUid: uid,
      userEmail: email,
      metadata,
      timestamp: new Date().toISOString(),
    });

    // 1. Save to local storage buffer (fast & offline safe)
    try {
      const existing = localStorage.getItem("saju_analytics_cache");
      let list: any[] = existing ? JSON.parse(existing) : [];
      list.unshift(eventPayload);
      if (list.length > 50) list = list.slice(0, 50);
      localStorage.setItem("saju_analytics_cache", JSON.stringify(list));
    } catch (e) {}

    // 2. Persist to Firestore analytics_events collection
    try {
      await addDoc(collection(db, "analytics_events"), eventPayload);
    } catch (e) {
      console.debug("Analytics firestore log skipped:", e);
    }
  } catch (err) {
    console.debug("logAnalyticsEvent error:", err);
  }
}

/**
 * Recursively strips undefined values in an object or array before sending to Firestore,
 * preventing 'Unsupported field value: undefined' errors.
 */
export function sanitizeFirestoreData<T extends Record<string, any>>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => 
      (item !== null && typeof item === "object") ? sanitizeFirestoreData(item) : (item === undefined ? null : item)
    ) as any;
  }

  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === undefined) {
      continue; // completely exclude undefined properties
    }
    if (val !== null && typeof val === "object") {
      result[key] = sanitizeFirestoreData(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

// ==========================================
// ⚙️ SYSTEM PAYMENT SETTINGS (ON/OFF)
// ==========================================

export interface SystemPaymentSettings {
  isPaymentEnabled: boolean; // default false (오픈 준비 중, 쿠폰 전용 모드)
  noticeMessage?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export async function getSystemPaymentSettings(): Promise<SystemPaymentSettings> {
  try {
    const docRef = doc(db, "system_settings", "payment");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as SystemPaymentSettings;
      localStorage.setItem("saju_payment_enabled", data.isPaymentEnabled ? "true" : "false");
      return data;
    }
  } catch (e) {
    console.debug("getSystemPaymentSettings firestore fetch failed, using local/fallback:", e);
  }

  const localVal = localStorage.getItem("saju_payment_enabled");
  return {
    isPaymentEnabled: localVal === "true", // default false (오픈 준비 중)
    noticeMessage: "현재 실제 결제 기능은 정식 오픈 준비 중입니다. 관리자 프로모션 쿠폰 또는 친구 초대를 통해 1회 확인권을 발급받아 이용하실 수 있습니다.",
  };
}

export async function updateSystemPaymentSettings(settings: Partial<SystemPaymentSettings>): Promise<void> {
  const user = auth.currentUser;
  const payload: SystemPaymentSettings = {
    isPaymentEnabled: settings.isPaymentEnabled ?? false,
    noticeMessage: settings.noticeMessage || "현재 실제 결제 기능은 정식 오픈 준비 중입니다. 관리자 프로모션 쿠폰 또는 친구 초대를 통해 1회 확인권을 발급받아 이용하실 수 있습니다.",
    updatedAt: new Date().toISOString(),
    updatedBy: user?.email || user?.uid || "admin",
  };

  localStorage.setItem("saju_payment_enabled", payload.isPaymentEnabled ? "true" : "false");

  try {
    const docRef = doc(db, "system_settings", "payment");
    await setDoc(docRef, sanitizeFirestoreData(payload), { merge: true });
  } catch (e) {
    console.error("updateSystemPaymentSettings firestore update failed:", e);
  }
}


