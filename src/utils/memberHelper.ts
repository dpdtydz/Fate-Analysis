import { Member } from "../types";

/**
 * Member 사주 데이터 안전 추출 헬퍼 (Null-safe)
 */
export function getMemberGan(member?: Member | null): string {
  if (!member?.saju?.daymaster?.gan) return "갑";
  const g = member.saju.daymaster.gan;
  return g.length > 1 ? g[0] : g;
}

export function getMemberJi(member?: Member | null): string {
  if (!member?.saju?.pillars?.day?.ji) return "자";
  const j = member.saju.pillars.day.ji;
  return j.length > 1 ? j[0] : j;
}

export function getMemberYearJi(member?: Member | null): string {
  if (!member?.saju?.pillars?.year?.ji) return "자";
  const yj = member.saju.pillars.year.ji;
  return yj.length > 1 ? yj[0] : yj;
}

export function getMemberElement(member?: Member | null): string {
  const elem = member?.saju?.daymaster?.element;
  if (!elem) return "금";
  if (elem === "木" || elem === "wood") return "목";
  if (elem === "火" || elem === "fire") return "화";
  if (elem === "土" || elem === "earth") return "토";
  if (elem === "金" || elem === "metal") return "금";
  if (elem === "水" || elem === "water") return "수";
  return elem;
}

export function getMemberNickname(member?: Member | null, fallback = "익명"): string {
  return member?.nickname?.trim() || fallback;
}

export function getMemberMbti(member?: Member | null): string {
  const m = member?.mbti;
  return m && m !== "미입력" ? String(m).toUpperCase() : "";
}

/**
 * 모임 내에서 현재 로그인한 회원(본인 / ME)을 다각도로 자동 식별
 * 1. 방 전용 로컬스토리지 ID (`saju_member_id_${roomCode}`)
 * 2. Firebase Auth 로그인 UID (`member.user_uid === auth.currentUser.uid`)
 * 3. 중앙 프로필 닉네임 일치 (`saju_user_profile`)
 * 4. 다른 방 세션 키 탐색
 */
export function findMyMember(members: Member[] = [], roomCode?: string): Member | null {
  if (!members || members.length === 0) return null;

  // 1. 방 전용 localStorage ID 확인
  if (roomCode) {
    try {
      const storedId =
        localStorage.getItem(`saju_member_id_${roomCode}`) ||
        localStorage.getItem(`room_${roomCode}_member_id`);
      if (storedId) {
        const found = members.find((m) => m.id === storedId);
        if (found) return found;
      }
    } catch (_) {}
  }

  // 2. Firebase Auth 로그인 UID 확인
  try {
    const user = (window as any)?.__FIREBASE_AUTH__?.currentUser || null;
    if (user && !user.isAnonymous) {
      const found = members.find((m) => m.user_uid && m.user_uid === user.uid);
      if (found) return found;
    }
  } catch (_) {}

  // 3. 중앙 프로필(saju_user_profile) 닉네임 확인
  try {
    const rawProfile = localStorage.getItem("saju_user_profile");
    if (rawProfile) {
      const profile = JSON.parse(rawProfile);
      if (profile?.nickname) {
        const targetNick = profile.nickname.trim().toLowerCase();
        const found = members.find((m) => (m.nickname || "").trim().toLowerCase() === targetNick);
        if (found) return found;
      }
    }
  } catch (_) {}

  // 4. 로컬스토리지 전역 키에서 saju_member_id_ 탐색
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("saju_member_id_") || key.endsWith("_member_id"))) {
        const val = localStorage.getItem(key);
        if (val) {
          const found = members.find((m) => m.id === val);
          if (found) return found;
        }
      }
    }
  } catch (_) {}

  return null;
}

/**
 * 멤버 목록을 한국어 가나다 순으로 정렬하는 헬퍼
 */
export function sortMembersAlphabetical(members: Member[]): Member[] {
  return [...members].sort((a, b) => {
    const nickA = (a.nickname || "").trim();
    const nickB = (b.nickname || "").trim();
    return nickA.localeCompare(nickB, "ko");
  });
}

