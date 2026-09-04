import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface AnalysisNotificationEvent {
  roomCode: string;
  roomTitle: string;
  timestamp: number;
}

type NotificationCallback = (event: AnalysisNotificationEvent) => void;

class BackgroundAnalysisManager {
  private activeListeners: Map<string, () => void> = new Map();
  private subscribers: Set<NotificationCallback> = new Set();
  private originalTitle: string = document.title || "인연사주 - 우리들의 사용 설명서";
  private titleBlinkInterval: any = null;

  constructor() {
    if (typeof window !== "undefined") {
      // Restore any pending tracking from localStorage
      this.restorePendingTracking();

      // Clear title blink when tab gets focus
      window.addEventListener("focus", () => {
        this.stopTitleBlink();
      });
    }
  }

  // Subscribe to in-app completion events
  public subscribe(callback: NotificationCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Request browser notification permission gently
  public async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }
    if (Notification.permission === "granted") {
      return true;
    }
    if (Notification.permission !== "denied") {
      try {
        const perm = await Notification.requestPermission();
        return perm === "granted";
      } catch {
        return false;
      }
    }
    return false;
  }

  // Start tracking analysis for a specific room
  public startTracking(roomCode: string, roomTitle: string) {
    if (!roomCode || this.activeListeners.has(roomCode)) return;

    // Save tracking state to localStorage so it survives soft navigations
    this.saveTrackingState(roomCode, roomTitle);

    // Request browser notification permission in the background
    this.requestNotificationPermission().catch(() => {});

    console.log(`[BackgroundAnalysis] Started tracking for room: ${roomCode} (${roomTitle})`);

    const analysisRef = doc(db, "rooms", roomCode, "analysis", "result");
    const unsubscribe = onSnapshot(analysisRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        // If analysis is completed with real group data
        if (data && data.status !== "processing" && data.group && typeof data.group.overall_score === "number") {
          console.log(`[BackgroundAnalysis] Analysis completed for room: ${roomCode}!`);
          this.triggerCompletion(roomCode, roomTitle);
          this.stopTracking(roomCode);
        }
      }
    }, (err) => {
      console.warn(`[BackgroundAnalysis] Snapshot error for ${roomCode}:`, err);
    });

    this.activeListeners.set(roomCode, unsubscribe);
  }

  // Stop tracking
  public stopTracking(roomCode: string) {
    const unsub = this.activeListeners.get(roomCode);
    if (unsub) {
      unsub();
      this.activeListeners.delete(roomCode);
    }
    this.removeTrackingState(roomCode);
  }

  // Trigger all notification mechanisms
  private triggerCompletion(roomCode: string, roomTitle: string) {
    const event: AnalysisNotificationEvent = {
      roomCode,
      roomTitle,
      timestamp: Date.now()
    };

    // 1. In-App Subscribers
    this.subscribers.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error("[BackgroundAnalysis] Subscriber error:", err);
      }
    });

    // 2. Play subtle pleasant chime sound
    this.playPleasantChime();

    // 3. Tab title notification if document is hidden
    if (document.hidden) {
      this.startTitleBlink(roomTitle);
    }

    // 4. Web OS Push Notification
    this.showSystemNotification(roomCode, roomTitle);
  }

  // Subtle web audio chime (C5 -> G5 -> C6 harmonic arpeggio)
  private playPleasantChime() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.36);
      });
    } catch {
      // Audio autoplay policy may block in some edge cases; fail silently
    }
  }

  // Tab Title Blink
  private startTitleBlink(roomTitle: string) {
    this.stopTitleBlink();
    let isToggled = false;
    this.titleBlinkInterval = setInterval(() => {
      if (document.hidden) {
        document.title = isToggled 
          ? `(완료!) ${roomTitle} 궁합 완료 ✨` 
          : `인연사주 - 우리들의 사용 설명서`;
        isToggled = !isToggled;
      } else {
        this.stopTitleBlink();
      }
    }, 1200);
  }

  private stopTitleBlink() {
    if (this.titleBlinkInterval) {
      clearInterval(this.titleBlinkInterval);
      this.titleBlinkInterval = null;
      document.title = this.originalTitle;
    }
  }

  // System OS Web Notification
  private showSystemNotification(roomCode: string, roomTitle: string) {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    try {
      const notif = new Notification(`[인연사주] ${roomTitle} 궁합 분석 완료!`, {
        body: "모임 멤버 전원의 1:1 인연과 4대 영역 심층 해설이 완성되었습니다. 터치하여 확인해 보세요!",
        icon: "/favicon.ico",
        tag: `analysis-${roomCode}`,
      });

      notif.onclick = () => {
        window.focus();
        window.location.hash = `#/room/${roomCode}/group`;
        notif.close();
      };
    } catch (e) {
      console.debug("System notification trigger error:", e);
    }
  }

  private saveTrackingState(roomCode: string, roomTitle: string) {
    try {
      const raw = localStorage.getItem("pending_analyses") || "{}";
      const data = JSON.parse(raw);
      data[roomCode] = { roomTitle, startedAt: Date.now() };
      localStorage.setItem("pending_analyses", JSON.stringify(data));
    } catch {}
  }

  private removeTrackingState(roomCode: string) {
    try {
      const raw = localStorage.getItem("pending_analyses") || "{}";
      const data = JSON.parse(raw);
      delete data[roomCode];
      localStorage.setItem("pending_analyses", JSON.stringify(data));
    } catch {}
  }

  private restorePendingTracking() {
    try {
      const raw = localStorage.getItem("pending_analyses");
      if (!raw) return;
      const data = JSON.parse(raw);
      const now = Date.now();
      Object.entries(data).forEach(([code, info]: [string, any]) => {
        // Only restore if within 5 minutes
        if (now - (info.startedAt || 0) < 5 * 60 * 1000) {
          this.startTracking(code, info.roomTitle || "모임");
        } else {
          this.removeTrackingState(code);
        }
      });
    } catch {}
  }
}

export const backgroundAnalysisManager = new BackgroundAnalysisManager();
