import { Room, Member } from "../types";

export interface RecentRoomItem {
  code: string;
  title: string;
  role: "owner" | "member" | "guest";
  memberCount?: number;
  lastVisitedAt: number;
}

export interface CachedRoomSnapshot {
  room: Room;
  cachedAt: number;
}

const STORAGE_KEYS = {
  RECENT_ROOMS: "saju_room_history_v2",
  CACHED_ROOM_PREFIX: "saju_cached_room_",
  MY_PROFILE: "saju_my_personal_profile"
};

/**
 * Save room to recent list
 */
export function recordRecentRoom(code: string, title: string, role: "owner" | "member" | "guest" = "member", memberCount?: number): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT_ROOMS);
    let list: RecentRoomItem[] = raw ? JSON.parse(raw) : [];

    // Filter out existing to unshift to top
    list = list.filter(item => item.code !== code);

    list.unshift({
      code,
      title: title || `모임방 #${code}`,
      role,
      memberCount: memberCount || 1,
      lastVisitedAt: Date.now()
    });

    // Limit to 15 items
    if (list.length > 15) {
      list = list.slice(0, 15);
    }

    localStorage.setItem(STORAGE_KEYS.RECENT_ROOMS, JSON.stringify(list));
  } catch (e) {
    console.warn("Failed to record recent room to localStorage:", e);
  }
}

/**
 * Get all recent rooms sorted by most recent
 */
export function getRecentRooms(): RecentRoomItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT_ROOMS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/**
 * Remove a single room from recent list
 */
export function removeRecentRoom(code: string): RecentRoomItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT_ROOMS);
    if (!raw) return [];
    let list: RecentRoomItem[] = JSON.parse(raw);
    list = list.filter(item => item.code !== code);
    localStorage.setItem(STORAGE_KEYS.RECENT_ROOMS, JSON.stringify(list));
    localStorage.removeItem(`${STORAGE_KEYS.CACHED_ROOM_PREFIX}${code}`);
    return list;
  } catch (e) {
    return [];
  }
}

/**
 * Clear all recent room records
 */
export function clearAllRecentRooms(): void {
  try {
    const rooms = getRecentRooms();
    rooms.forEach(r => {
      localStorage.removeItem(`${STORAGE_KEYS.CACHED_ROOM_PREFIX}${r.code}`);
    });
    localStorage.removeItem(STORAGE_KEYS.RECENT_ROOMS);
  } catch (e) {
    console.warn("Failed to clear recent rooms:", e);
  }
}

/**
 * Cache full room snapshot for offline resilience
 */
export function cacheRoomSnapshot(room: Room): void {
  if (!room || !room.code) return;
  try {
    const snapshot: CachedRoomSnapshot = {
      room,
      cachedAt: Date.now()
    };
    localStorage.setItem(`${STORAGE_KEYS.CACHED_ROOM_PREFIX}${room.code}`, JSON.stringify(snapshot));
    // Also ensure recent room list has updated memberCount and title
    recordRecentRoom(room.code, room.title, "member", room.members?.length || 1);
  } catch (e) {
    console.warn("Failed to cache room snapshot:", e);
  }
}

/**
 * Retrieve cached room snapshot if network fails
 */
export function getCachedRoomSnapshot(code: string): CachedRoomSnapshot | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.CACHED_ROOM_PREFIX}${code}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Get cached personal saju profile
 */
export function getRecentPersonalProfile(): any | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MY_PROFILE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}
