import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import rateLimit from "express-rate-limit";
import { PILLAR_PROFILES } from "./src/utils/sajuSynthesis";

dotenv.config();

// Firebase server configuration matching client for database operations
const firebaseConfig = {
  apiKey: "AIzaSyBDxMgEkCLcYU3X--nJH4JYwnWrsgqljyA",
  authDomain: "gen-lang-client-0768788170.firebaseapp.com",
  projectId: "gen-lang-client-0768788170",
  storageBucket: "gen-lang-client-0768788170.firebasestorage.app",
  messagingSenderId: "291785267663",
  appId: "1:291785267663:web:7311b08fb9ea630a0f5aba"
};

const serverFbApp = initializeApp(firebaseConfig, "inyeons-server-admin");
const serverDb = getFirestore(serverFbApp, "ai-studio-87874d9b-de7d-42c6-9ce0-5a2d8b3fb609");

// Middleware to strictly verify caller's Firebase ID Token and enforce 'lhs41977@gmail.com' master admin role
async function checkAdmin(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "인증 정보(ID Token)가 누락되었거나 유효하지 않습니다." });
    }
    const idToken = authHeader.split("Bearer ")[1];
    
    // Server-side verification utilizing Google Identity Toolkit API (highly reliable, no external dependencies needed)
    const apiKey = firebaseConfig.apiKey;
    const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });
    
    if (!verifyRes.ok) {
      return res.status(401).json({ error: "서버가 관리자 토큰 검증에 실패했습니다. 유효하지 않은 세션입니다." });
    }
    
    const verifyData: any = await verifyRes.json();
    const email = verifyData.users?.[0]?.email;
    const masterAdmin = (process.env.ADMIN_EMAIL || "lhs41977@gmail.com").toLowerCase();
    if (email?.toLowerCase() === masterAdmin) {
      req.adminEmail = email;
      req.adminUid = verifyData.users?.[0]?.localId;
      next();
    } else {
      return res.status(403).json({ error: "이 작업을 수행할 최고 관리자(admin) 권한이 없습니다." });
    }
  } catch (error) {
    console.error("[SERVER checkAdmin ERROR]:", error);
    return res.status(500).json({ error: "관리자 신원 검증 도중 서버 내부 오류가 발생했습니다." });
  }
}

// Fluent Korean Guideline with Deep Storytelling & Insight

function getDayPillarInsight(pillarGanzi: string) {
  if (!pillarGanzi) return { metaphor: "미지의 원석", keywords: ["잠재력", "신비"] };
  const profile = (PILLAR_PROFILES as Record<string, any>)[pillarGanzi];
  if (profile) {
    return {
      pillar: pillarGanzi,
      metaphor: profile.metaphor || "고유한 자연의 물상",
      keywords: profile.keywords || ["개성", "기운"],
      nature: profile.nature || ""
    };
  }
  return { pillar: pillarGanzi, metaphor: "고유한 개성의 결정체", keywords: ["자기다움"] };
}

function getSeasonInsight(birthDate: string, monthJi?: string) {
  const parts = (birthDate || "").split("-");
  const month = parts.length >= 2 ? parseInt(parts[1], 10) : null;
  const ji = monthJi || "";

  if (["인", "묘", "진"].includes(ji) || (month !== null && month >= 3 && month <= 5)) {
    return { season: "봄 (생동과 기획)", climate: "새싹이 움트고 위로 뻗어나가는 성장 기운", advice: "시작하는 힘은 탁월하나 마무리의 호흡을 가다듬어야 함" };
  }
  if (["사", "오", "미"].includes(ji) || (month !== null && month >= 6 && month <= 8)) {
    return { season: "여름 (열정과 확산)", climate: "뜨거운 태양과 화려한 개화의 기운", advice: "열정이 넘쳐 에너지가 조기 방전되지 않도록 쉼표가 필요함" };
  }
  if (["신", "유", "술"].includes(ji) || (month !== null && month >= 9 && month <= 11)) {
    return { season: "가을 (결실과 숙살)", climate: "열매를 맺고 불필요한 것을 쳐내는 냉철함", advice: "기준이 명확하고 결단력이 뛰어나나 유연성을 잃지 말아야 함" };
  }
  if (["해", "자", "축"].includes(ji) || (month !== null && (month === 12 || month === 1 || month === 2))) {
    return { season: "겨울 (응축과 지혜)", climate: "씨앗을 품고 깊이 사색하는 냉기", advice: "내면의 사색과 전략이 깊으나 행동으로 표출하는 온기가 필요함" };
  }
  return { season: "조화의 계절", climate: "온화한 중용", advice: "균형 감각 유지" };
}

function getOhaengBalanceDetail(ohaengCount?: Record<string, number>) {
  if (!ohaengCount) return { dominant: [], lacking: [], summary: "오행 정보 미확인" };
  const dominant: string[] = [];
  const lacking: string[] = [];
  for (const [elem, count] of Object.entries(ohaengCount)) {
    if (count >= 3) dominant.push(elem);
    if (count === 0) lacking.push(elem);
  }
  return {
    dominant: dominant.length ? dominant : ["고른 분포"],
    lacking: lacking.length ? lacking : ["결핍 없음"],
    summary: `${dominant.length ? `지배적 오행: [${dominant.join(", ")}], ` : ""}${lacking.length ? `결핍 오행: [${lacking.join(", ")}]` : "오행 균형 완만"}`
  };
}

function computeInterplayHints(m1: any, m2: any) {
  const g1 = m1.saju?.daymaster?.gan || "";
  const g2 = m2.saju?.daymaster?.gan || "";
  const elem1 = m1.saju?.daymaster?.element || "";
  const elem2 = m2.saju?.daymaster?.element || "";

  // Heavenly Stems Combination (천간합)
  const stems = [g1, g2].sort().join("");
  const isStemHarmony = ["기갑", "갑기", "경을", "을경", "병신", "신병", "임정", "정임", "계무", "무계"].includes(stems);

  // Five Elements Interaction
  const generatingMap: Record<string, string> = { "목": "화", "화": "토", "토": "금", "금": "수", "수": "목" };
  const controllingMap: Record<string, string> = { "목": "토", "토": "수", "수": "화", "화": "금", "금": "목" };

  let elementRelation = "중립적 조화";
  if (generatingMap[elem1] === elem2) {
    elementRelation = `${m1.nickname}(${elem1})이 ${m2.nickname}(${elem2})을 생(生)해주는 일방적 지원 및 양육 구조`;
  } else if (generatingMap[elem2] === elem1) {
    elementRelation = `${m2.nickname}(${elem2})이 ${m1.nickname}(${elem1})을 포근하게 받쳐주는 든든한 상생 구조`;
  } else if (controllingMap[elem1] === elem2) {
    elementRelation = `${m1.nickname}이 ${m2.nickname}의 방향을 리드하거나 통제하려는 극(剋)의 텐션`;
  } else if (controllingMap[elem2] === elem1) {
    elementRelation = `${m2.nickname}이 ${m1.nickname}에게 긴장감과 자극을 주는 극(剋)의 텐션`;
  } else if (elem1 === elem2 && elem1) {
    elementRelation = `동일한 '${elem1}' 오행으로 거울을 보듯 즉각 공감하는 비견 구조`;
  }

  // Complementary Elements
  const o1 = m1.saju?.ohaeng_count || {};
  const o2 = m2.saju?.ohaeng_count || {};
  const complementary: string[] = [];
  for (const el of ["목", "화", "토", "금", "수"]) {
    if ((o1[el] || 0) === 0 && (o2[el] || 0) >= 2) {
      complementary.push(`${m1.nickname}에게 부족한 '${el}'을 ${m2.nickname}이 채워줌`);
    }
    if ((o2[el] || 0) === 0 && (o1[el] || 0) >= 2) {
      complementary.push(`${m2.nickname}에게 부족한 '${el}'을 ${m1.nickname}이 채워줌`);
    }
  }

  // MBTI dynamics
  const mb1 = (m1.mbti || "").toUpperCase();
  const mb2 = (m2.mbti || "").toUpperCase();
  let mbtiDynamics = "상호 보완적";
  if (mb1.length === 4 && mb2.length === 4) {
    if (mb1 === mb2) mbtiDynamics = `동일한 ${mb1} 유형으로 직관적 공감대 완벽`;
    else if (mb1[0] !== mb2[0] && mb1.slice(1) === mb2.slice(1)) mbtiDynamics = `에너지 방향(E/I)만 다른 환상의 페이스메이커`;
    else if (mb1[3] !== mb2[3] && mb1.slice(0, 3) === mb2.slice(0, 3)) mbtiDynamics = `판단과 실행(J/P)의 완벽한 분업 시너지`;
  }

  return {
    stemRelation: isStemHarmony ? `천간합(${g1}-${g2})으로 영혼이 강하게 끌리는 운명적 자석 궁합` : "자연스러운 기운의 만남",
    elementRelation,
    complementary: complementary.length ? complementary.join(", ") : "상호 안정적 오행 교류",
    mbtiDynamics
  };
}

const FLUENT_KOREAN_SYSTEM_GUIDELINE = `
## [신점·명리학 대가의 몰입감 넘치는 입체 스토리텔링 절대 원칙]
(기계적 단어 나열 및 사전식 백과사전 해설 100% 엄금)

1. **사전식 단어 풀이 절대 금지 & 한 편의 인생 드라마 서사화:**
   - "목(木)은 나무라 곧고 어질다", "신금(辛金)은 보석이라 예민하다"와 같은 뻔하고 원론적인 사주 용어 풀이를 엄격히 금지합니다.
   - 사주의 기운을 **사용자가 살아오며 겪었을 법한 구체적인 감정의 결, 혼자만의 고민, 사람 사이에서 느꼈을 미묘한 외로움이나 열정의 순간**으로 치환하여 한 편의 드라마를 보듯 술술 읽히는 서사로 엮어내십시오.
   - "겉으로는 누구보다 차분하고 빈틈없어 보이지만, 사실 마음속에는 아무도 눈치채지 못할 만큼 뜨거운 불꽃을 품고 계시는군요"와 같이 내면을 꿰뚫어 보는 통찰력 넘치는 구어체 서술을 펼치십시오.

2. **신점·명리학 대가의 온화하고 영험한 상담 호흡:**
   - 기계가 찍어낸 분석 보고서가 아니라, 평생 수많은 인간 군상을 꿰뚫어 본 백발의 대가가 찻잔을 건네며 비밀스런 운명의 궤적을 짚어주듯 정중하고 따뜻하게 서술하십시오 (~하셨을 것입니다, ~하는 순간 진짜 날개를 펼치게 됩니다).
   - 필수 조사('은/는', '이/가', '을/를', '에게', '으로')를 완벽히 유지하며, 단문 나열 대신 유려한 복문과 감각적인 은유(한겨울 얼어붙은 호수, 새벽 안개를 뚫고 비치는 햇살 등)를 적극 채택하십시오.

3. **입체적 3단계 심층 통찰 구조:**
   - ① **[타고난 그릇의 비밀]**: 나조차 외면했던 본능적 기질과 결핍
   - ② **[현실에서 부딪히는 삶과 관계의 파도]**: 왜 그동안 특정한 사람이나 상황 앞에서 에너지가 닳거나 답답했는지
   - ③ **[운명을 내 편으로 만드는 구체적 개운법]**: 말버릇, 마음가짐, 나를 살리는 결정적 인연의 태도

4. **"그래서 뭐 어쩌라고?"에 대한 명쾌한 현실 처방전 필수 (Actionable & Punchy):**
   - "내실을 다져라", "조급해하지 마라"와 같은 두루뭉술한 덕담이나 뜬구름 잡는 철학적 문장은 100% 엄격히 금지합니다.
   - 내담자가 읽고 지금 당장 무엇을 하고 무엇을 멈춰야 하는지 알 수 있도록, 구체적인 행동 지침(DO)과 피해야 할 것(DON'T)을 담담하게 짚어주십시오.
`;

function getWesternZodiac(birthDate: string): string {
  if (!birthDate) return "알 수 없음";
  const parts = birthDate.split('-');
  if (parts.length < 3) return "알 수 없음";
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "양자리 (Aries)";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "황소자리 (Taurus)";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return "쌍둥이자리 (Gemini)";
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return "게자리 (Cancer)";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "사자자리 (Leo)";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "처녀자리 (Virgo)";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "천칭자리 (Libra)";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 22)) return "전갈자리 (Scorpio)";
  if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return "사수자리 (Sagittarius)";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "염소자리 (Capricorn)";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "물병자리 (Aquarius)";
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "물고기자리 (Pisces)";

  return "알 수 없음";
}

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  // Cloud Run 등 PaaS는 PORT를 주입한다. 로컬 개발은 기존대로 3000.
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  app.use((req, res, next) => {
    console.log(`[REQUEST LOGGER] ${req.method} ${req.url}`);
    next();
  });

  // Robust Global CORS Middleware (resolves CORS-related fetch failures on any hosting/sandbox origin)
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-goog-api-key");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    
    // Handle OPTIONS preflight requests immediately
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  // Initialize Gemini AI client
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    return new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  const formatGeminiError = (error: any): string => {
    if (!error) return "오류가 발생했습니다.";
    
    const errStr = typeof error === "string" ? error : (error.message || String(error));
    const lowerStr = errStr.toLowerCase();
    
    // Check for quota / limit / spend cap / 429
    if (
      lowerStr.includes("resource_exhausted") ||
      lowerStr.includes("spending cap") ||
      lowerStr.includes("quota") ||
      lowerStr.includes("429") ||
      lowerStr.includes("limit exceeded")
    ) {
      return "AI 서비스 사용량 한도 초과: 현재 무료 체험용 AI 분석 사용량이 금월 한도를 초과했습니다. 관리자 페이지에서 보유하신 API 키가 만료되었거나 AI Studio 한도 설정(Spend Cap)에 도달했을 수 있습니다. 잠시 후 다시 시도하시거나 관리자에게 문의해 주세요.";
    }
    
    // Check for invalid API Key / authentication
    if (
      lowerStr.includes("api_key_invalid") ||
      lowerStr.includes("api key is invalid") ||
      lowerStr.includes("unauthorized") ||
      lowerStr.includes("permission_denied") ||
      lowerStr.includes("key not found")
    ) {
      return "AI 인증 오류: 설정된 Gemini API 키가 올바르지 않거나 권한이 없습니다. 관리자에게 문의하여 유효한 API 키가 등록되어 있는지 확인해 주세요.";
    }

    // Try parsing if the message is a stringified JSON object
    try {
      const parsed = JSON.parse(errStr);
      if (parsed.error) {
        const msg = parsed.error.message || "";
        const msgLower = msg.toLowerCase();
        
        if (
          msgLower.includes("api_key_invalid") ||
          msgLower.includes("unauthorized") ||
          msgLower.includes("permission_denied")
        ) {
          return "AI 인증 오류: 설정된 Gemini API 키가 올바르지 않거나 권한이 없습니다. 관리자에게 문의하여 유효한 API 키가 등록되어 있는지 확인해 주세요.";
        }
        
        return msg || "AI 분석 도중 오류가 발생했습니다.";
      }
    } catch (e) {
      // Not a JSON string, ignore
    }

    return errStr || "AI 분석 도중 예상치 못한 오류가 발생했습니다.";
  };


  app.get("/api/list-models", async (req, res) => {
    try {
      const ai = getGeminiClient();
      const models = await ai.models.list();
      res.json(models);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  // Admin APIs: Safe Server-Authoritative Operations (Check credentials first, execute DB mutations on server)
  
  // 1. Fetch entire rooms list for authorized admin
  app.get("/api/admin/rooms", checkAdmin, async (req, res) => {
    try {
      const roomsRef = collection(serverDb, "rooms");
      const querySnapshot = await getDocs(roomsRef);
      const rooms: any[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        rooms.push({
          code: docSnap.id,
          title: data.title || "인연 사주방",
          owner_uid: data.owner_uid || "",
          created_at: data.created_at || "",
          expire_at: data.expire_at || "",
          isStaging: data.isStaging || false
        });
      });
      res.json(rooms);
    } catch (error) {
      console.error("[SERVER admin GET rooms ERROR]:", error);
      res.status(500).json({ error: "데이터베이스에서 인연방 전체 목록을 동기화하지 못했습니다." });
    }
  });

  // 2. Safely delete room document with admin re-verification
  app.delete("/api/admin/rooms/:code", checkAdmin, async (req, res) => {
    try {
      const { code } = req.params;
      if (!code) {
        return res.status(400).json({ error: "삭제할 인연방의 6자리 코드가 명시되지 않았습니다." });
      }
      const roomRef = doc(serverDb, "rooms", code);
      await deleteDoc(roomRef);
      res.json({ success: true, message: `인연방 [${code}]이(가) 데이터베이스에서 영구 소멸되었습니다.` });
    } catch (error) {
      console.error(`[SERVER admin DELETE room ${req.params.code} ERROR]:`, error);
      res.status(500).json({ error: "서버가 대상 인연방을 데이터베이스에서 폭파(삭제)하는 데 실패했습니다." });
    }
  });

  // 3. Batch staging/dummy rooms cleaner action (wipes "테스트", "Backdoor" or similar dummy titles)
  app.post("/api/admin/clean-dummy-rooms", checkAdmin, async (req, res) => {
    try {
      const roomsRef = collection(serverDb, "rooms");
      const querySnapshot = await getDocs(roomsRef);
      
      let cleanedCount = 0;
      const dummyKeywords = ["테스트", "test", "backdoor", "백도어", "Backdoor", "dummy", "더미", "임시방", "백도어방"];
      
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const title = (data.title || "").toLowerCase();
        const code = docSnap.id;
        
        const isDummy = dummyKeywords.some(kw => title.includes(kw)) || code.toLowerCase().includes("test");
        
        if (isDummy) {
          await deleteDoc(doc(serverDb, "rooms", code));
          cleanedCount++;
        }
      }
      
      res.json({ 
        success: true, 
        message: `더미 및 테스트용 인연방 총 ${cleanedCount}개가 데이터베이스에서 영구적으로 격리 및 소멸 정리되었습니다.`,
        cleanedCount 
      });
    } catch (error) {
      console.error("[SERVER clean-dummy-rooms ERROR]:", error);
      res.status(500).json({ error: "개발용 더미 방 데이터를 일괄 자동 청소하는 작업 중 오류가 발생했습니다." });
    }
  });

  // =========================================================================
  // AI Circuit Breaker (서킷 브레이커: 장애/429 폭주 감지 및 폴백 안전장치)
  // =========================================================================
  type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

  class GeminiCircuitBreaker {
    private state: CircuitState = "CLOSED";
    private failureCount: number = 0;
    private readonly failureThreshold: number = 3;
    private readonly cooldownMs: number = 60000; // 60s cooldown
    private trippedAt: number = 0;
    private lastError: string = "";
    private tripCount: number = 0;

    public isOpen(): boolean {
      if (this.state === "OPEN") {
        const now = Date.now();
        if (now - this.trippedAt > this.cooldownMs) {
          this.state = "HALF_OPEN";
          console.log("[CIRCUIT BREAKER] Cooldown elapsed. State transitioned from OPEN to HALF_OPEN (probing Gemini).");
          return false;
        }
        return true;
      }
      return false;
    }

    public recordSuccess(): void {
      if (this.state !== "CLOSED") {
        console.log(`[CIRCUIT BREAKER] API call succeeded. Circuit reset from ${this.state} to CLOSED.`);
      }
      this.state = "CLOSED";
      this.failureCount = 0;
      this.lastError = "";
    }

    public recordFailure(error: any): void {
      const errorMsg = String(error?.message || error || "");
      this.lastError = errorMsg;
      this.failureCount++;

      const isQuotaOrOverload =
        errorMsg.includes("429") ||
        errorMsg.includes("RESOURCE_EXHAUSTED") ||
        errorMsg.includes("quota") ||
        errorMsg.includes("Quota") ||
        errorMsg.includes("overloaded") ||
        errorMsg.includes("503") ||
        errorMsg.includes("UNAVAILABLE") ||
        errorMsg.includes("RATE_LIMIT");

      if (isQuotaOrOverload || this.failureCount >= this.failureThreshold) {
        this.state = "OPEN";
        this.trippedAt = Date.now();
        this.tripCount++;
        console.warn(
          `[CIRCUIT BREAKER] TRIPPED TO OPEN! Reason: ${isQuotaOrOverload ? "Quota/Overload detected" : "Consecutive failures threshold reached"}. Failures: ${this.failureCount}. Cooldown: ${this.cooldownMs / 1000}s. Error: ${errorMsg}`
        );
      }
    }

    public getStatus() {
      const now = Date.now();
      const remainingCooldown = this.state === "OPEN" ? Math.max(0, this.cooldownMs - (now - this.trippedAt)) : 0;
      return {
        state: this.state,
        failureCount: this.failureCount,
        tripCount: this.tripCount,
        lastError: this.lastError,
        cooldownRemainingMs: remainingCooldown,
        isAvailable: !this.isOpen(),
      };
    }

    public reset() {
      this.state = "CLOSED";
      this.failureCount = 0;
      this.lastError = "";
      this.trippedAt = 0;
    }
  }

  const geminiCircuitBreaker = new GeminiCircuitBreaker();

  // Endpoint to check circuit breaker status
  app.get("/api/circuit-status", (req, res) => {
    res.json(geminiCircuitBreaker.getStatus());
  });

  // Admin endpoint to manually reset circuit breaker
  app.post("/api/circuit-reset", checkAdmin, (req, res) => {
    geminiCircuitBreaker.reset();
    res.json({ success: true, message: "AI 서킷 브레이커가 정상 리셋되었습니다.", status: geminiCircuitBreaker.getStatus() });
  });

  // Reusable helper function to generate personal Saju & MBTI analysis using Gemini 3.5 Flash
  async function generatePersonalAnalysisForMember(member: any): Promise<any> {
    const ai = getGeminiClient();
    const zodiac = getWesternZodiac(member.birth_date);

    // 대운 파노라마에서 "지금 어느 단계인지" 판별하기 위한 나이.
    //
    // 반드시 "연 나이"(올해 - 태어난 해)여야 한다. 대운의 age는
    // @orrery/core가 `startDate.getFullYear() - birthYear`로 만들고,
    // sajuSynthesis의 season.age도 같은 방식이다. 여기서 만 나이를 쓰면
    // 생일이 안 지난 사용자(약 31%)의 현재 단계가 한 칸 어긋나고,
    // 같은 화면의 "지금 당신은 어떤 시기인가" 섹션과 값이 모순된다.
    //
    // new Date()는 "1990-01-01"을 UTC 자정으로 파싱해 로컬 getter와 어긋나므로
    // 문자열을 직접 쪼갠다 (타임존 의존 제거).
    const currentAge = (() => {
      const birthYear = parseInt(String(member.birth_date || "").split("-")[0], 10);
      if (isNaN(birthYear)) return null;
      const a = new Date().getFullYear() - birthYear;
      // 미래 날짜(오타 등)를 0세로 위장하지 않고 판정 불가로 넘긴다
      return a >= 0 && a < 130 ? a : null;
    })();
    
    let mingGongStars = "알 수 없음";
    let mingGongGanzhi = "알 수 없음";
    if (member.saju?.ziwei?.palaces) {
      const mingGong = Object.values(member.saju.ziwei.palaces).find((p: any) => p.name === "命宮" || p.nameKr === "명궁") as any;
      if (mingGong) {
        mingGongGanzhi = mingGong.ganZhi || "알 수 없음";
        const starsList = mingGong.stars || [];
        if (starsList.length > 0) {
          mingGongStars = starsList.map((s: any) => `${s.nameKr}(밝기:${s.brightnessKr || '무난'}, 화성:${s.siHuaKr || '없음'})`).join(", ");
        } else {
          mingGongStars = "명궁에 배치된 주요 은하수 별 없음";
        }
      }
    }

    const ohaengCountText = member.saju?.ohaeng_count 
      ? Object.entries(member.saju.ohaeng_count).map(([k, v]) => `${k}:${v}개`).join(", ")
      : "정보 없음";

    const sipseongStrengthText = member.saju?.sipseong_strength
      ? Object.entries(member.saju.sipseong_strength).map(([k, v]) => `${k}:${v}%`).join(", ")
      : "정보 없음";

    const enrichedMemberInfo = {
      nickname: member.nickname,
      gender: member.gender,
      birth_date: member.birth_date,
      birth_time: member.birth_time || "모름",
      mbti: member.mbti || "미입력 (현대성향 정보 없음)",
      western_zodiac: zodiac,
      saju_info: {
        daymaster_gan: member.saju?.daymaster?.gan || "알 수 없음",
        daymaster_element: member.saju?.daymaster?.element || "알 수 없음",
        day_pillar_ganzi: member.saju?.pillars?.day ? `${member.saju.pillars.day.gan}${member.saju.pillars.day.ji}` : "알 수 없음",
        day_pillar_insight: getDayPillarInsight(member.saju?.pillars?.day ? `${member.saju.pillars.day.gan}${member.saju.pillars.day.ji}` : ""),
        season_insight: getSeasonInsight(member.birth_date, member.saju?.pillars?.month?.ji),
        ohaeng_count: ohaengCountText,
        ohaeng_balance_insight: getOhaengBalanceDetail(member.saju?.ohaeng_count),
        sipseong_strength: sipseongStrengthText,
        special_sals: member.saju?.special_sals_list || [],
        ming_gong_stars: mingGongStars,
        ming_gong_ganzi: mingGongGanzhi
      },
      // 인생 10단계 파노라마의 실제 근거. 사주에 이미 계산된 10년 주기(대운)를
      // 그대로 넘긴다 — 단계를 지어내지 않고 명리학 데이터를 따른다.
      // 현재 단계 판정은 서버가 확정한다. AI에게 맡기면 두 칸에 true를 넣거나
      // 0개가 되어 "지금" 배지와 인주 한 점 규칙이 깨진다.
      daewoon_cycles: Array.isArray(member.saju?.daewoon)
        ? (() => {
            const cycles = member.saju.daewoon;
            // 마지막 구간은 상한을 열어 100세 이상도 현재로 잡힌다
            const currentIdx =
              currentAge === null
                ? -1
                : cycles.findIndex((d: any, i: number) => {
                    const next = cycles[i + 1];
                    return currentAge >= d.age && (!next || currentAge < next.age);
                  });
            return cycles.map((d: any, i: number) => ({
              시작나이: d.age,
              종료나이: cycles[i + 1] ? cycles[i + 1].age - 1 : d.age + 9,
              간지: d.ganzi,
              천간십신: d.stemSipsin,
              지지십신: d.branchSipsin,
              운성: d.unseong,
              현재여부: i === currentIdx
            }));
          })()
        : [],
      current_age: currentAge ?? "생년월일 확인 불가"
    };

    const prompt = `
${FLUENT_KOREAN_SYSTEM_GUIDELINE}

## 어투 — 이 규칙이 아래 모든 지시보다 우선합니다

평생 수많은 사람을 마주해 온 도사가 찻잔을 앞에 두고 조용히 짚어주는 목소리로 씁니다.
확신은 있으나 과장하지 않고, 듣고 싶은 말을 하되 겁주지 않습니다.

- **문장은 '~합니다 / ~입니다'로 통일합니다.** 반말, 감탄사, 느낌표를 쓰지 않습니다.
- "소름 돋게", "무릎을 탁", "팩트폭격", "사이다" 같은 자극적 표현을 쓰지 않습니다.
- 겁주는 말로 끝내지 않습니다. 어려움을 짚으면 반드시 그 다음에 길을 함께 놓습니다.
  (예: "지금까지 혼자 버틴 것이 헛수고가 아닙니다. 다만 이제는 방식을 바꿔야 합니다.")
- 단정하되 단호하지 않습니다. 판결이 아니라 안내입니다.
- 어려운 한자어나 점성술 용어는 쉬운 한글로 풀어 씁니다. MBTI는 대문자 영문으로 표기합니다.

당신은 사주명리학과 자미두수, 그리고 현대 성격 이론(MBTI)을 함께 읽어내는 사람입니다.
상대의 사주를 펼쳐놓고 마주 앉아, 그가 살아온 길과 지금 서 있는 자리, 그리고 앞으로
걸어갈 길을 **하나의 이어진 이야기로** 짚어주십시오.

## 가장 중요한 원칙 — 모든 문단이 이어져야 합니다

이 리포트는 항목별 진단서가 아니라 **한 사람의 인생을 따라 걷는 한 편의 글**입니다.
- 각 문단은 앞 문단을 이어받아 시작합니다. 독립된 항목처럼 따로 서 있으면 실패입니다.
- 재물·연애·직장·건강은 서로 다른 주제가 아니라, **같은 기질이 네 곳에서 다르게
  드러난 모습**입니다. 그 연결을 문장으로 드러내십시오.
- 인생의 단계(대운)를 축으로 삼아, 각 주제가 "지금 이 단계에서는 이렇게 작동합니다"로
  풀리게 하십시오.

## 대상자 심층 명리 및 성향 데이터:
${JSON.stringify(enrichedMemberInfo, null, 2)}

## 💡 [핵심 통찰 엔진 가이드 - 명리학적 단서의 적극적 활용]
제공된 'saju_info'의 다음 요소들을 반드시 문장의 뼈대와 비유의 원천으로 삼으십시오:
1. **60갑자 일주 물상 (day_pillar_insight):** 
   - 메타포(상징 비유)와 키워드를 살려 이 사람만의 독보적인 기질을 묘사하십시오. (예: 갑자일주라면 '차가운 겨울 물 위에 떠 있는 푸른 고목'의 외로움과 도도함)
2. **계절 조후 (season_insight):**
   - 태어난 계절의 온도와 습도가 이 사람의 감정선과 에너지 완급 조절에 미치는 영향을 문맥에 녹여내십시오.
3. **오행의 불균형과 결핍 (ohaeng_balance_insight):**
   - 넘치는 오행에서 나오는 과열된 충동, 그리고 0개인 결핍 오행을 무의식적으로 갈망하거나 회피하는 방어기제를 적시하십시오.
4. **신살 및 특수 기운 (special_sals):**
   - 도화살, 역마살, 화개살, 백호살, 괴강살 등이 있다면 이 사람의 끼, 이동성, 고독한 사색, 결단력의 극단성으로 세련되게 치환하십시오.

## 🔍 [일상 마이크로 시나리오 & 그림자 자아(Shadow Self) 묘사 지침]
- **관념적 서술을 지양하고 생생한 일상의 순간을 포착하십시오:**
  - **일할 때:** 마감 직전 압박을 받을 때 어떻게 반응하는가? 세부사항에 집착하는가, 큰 그림만 그리고 넘기는가?
  - **소통할 때:** 카톡이나 메신저에서 답장을 보내는 리듬, 읽씹하거나 단답형이 튀어나오는 무의식적 이유.
  - **밤에 혼자 누웠을 때:** 불을 끄고 침대에 누웠을 때 머릿속을 맴도는 생각의 꼬리, 아무에게도 들키고 싶지 않은 자책이나 불안.
  - **그림자 자아 (Shadow Self):** 겉으로는 완벽하거나 쿨해 보이지만, 코너에 몰렸을 때 튀어나오는 치졸함이나 회피 성향을 따뜻하고 날카롭게 짚어주십시오.

## 작성 순서 — 이 순서대로 써야 글이 이어집니다

**1) 먼저 인생의 계단(life_stages)을 놓습니다.**
   위 daewoon_cycles는 이 사람의 실제 10년 주기입니다. 이것을 인생의 계단으로 삼습니다.
   - 각 단계에 그 시기를 한마디로 부르는 이름을 붙입니다 (예: "혼자 익히던 시절",
     "이름이 알려지기 시작하는 시기"). 사주 용어를 그대로 쓰지 않습니다.
   - 지나온 단계는 **"그 시기에 이런 일이 있었을 것입니다"**로 짚고, 앞으로 올 단계는
     **"이렇게 흘러갑니다"**로 씁니다. 현재 단계(현재여부: true)를 가장 길게 씁니다.
   - **각 단계의 마지막 문장은 다음 단계로 넘어가는 문장입니다.** 계단을 하나씩
     밟아 올라가듯, 끊기지 않고 이어지게 하십시오.
   - 지나온 단계가 지금의 나를 어떻게 만들었는지 드러내십시오. 과거는 설명이 아니라
     **지금을 이해하는 근거**입니다.

**2) 그 다음 네 갈래를 풉니다 — 재물 · 연애 · 직장 · 건강.**
   이 넷은 별개 주제가 아닙니다. **같은 기질이 네 곳에서 다르게 나타난 것**입니다.
   - 각 갈래는 **현재 단계에서 출발합니다.** "지금 이 시기에는 ~합니다"로 시작하십시오.
   - 각 갈래에는 bridge 문장이 있습니다. 앞 갈래에서 방금 한 이야기를 받아
     이 갈래로 넘어오는 한 문장입니다. (예: "돈이 그렇게 움직이는 사람은
     사람을 만나는 자리에서도 같은 습성이 나옵니다.")
   - 순서는 재물 → 직장 → 연애 → 건강입니다. 화면에 이 순서로 놓이므로,
     각 bridge는 반드시 바로 앞 주제를 받아야 합니다. 순서를 바꾸면 연결이 깨집니다.
   - 구체적 장면으로 쓰십시오. 돈이 벌리는 자리와 새는 구멍, 어디서 만나고 왜
     부딪치는지, 어떤 일에서 존재감이 드러나는지, 지칠 때 어디부터 신호가 오는지.

**3) 마지막에 닫는 말(closing)로 봉합합니다.**
   네 갈래를 한 문단으로 모아, 결국 하나의 이야기였음을 보여주십시오.
   그리고 지금 당장 할 수 있는 한 가지를 남기십시오. 다짐이 아니라 행동입니다.

## ⚠️ 뻔한 일반론 절대 금지 (신뢰도 파괴 방지)
- **누구나 싫어하거나 좋아하는 뻔한 상식을 적지 마십시오.**
  (예: "약속을 안 지키면 싫어합니다", "사소한 단점을 못 참습니다", "억지로 주선된 소개팅을 꺼립니다" 등 금지)
  누구나 싫어하는 당연한 말을 적으면 사용자는 "이건 누구한테나 다 맞는 소리네"라며 신뢰를 잃습니다.
- **반드시 이 사람의 사주 일간(천간 고유 성정)과 오행/십신의 결핍 및 과다에서 나오는 뾰족하고 구체적인 행동 패턴을 쓰십시오.**
  - 갑목: 리더십과 자존심 때문에 총대를 메다 혼자 뒤집어쓰거나, 내 주도권에 간섭당할 때 관계를 단절함
  - 을목: 거절하지 못해 끌려다니다 속앓이 끝에 잠수를 타거나 손익 계산이 안 맞으면 조용히 안전거리를 둠
  - 병화: 겉으로는 화끈하게 다 베풀지만 상대의 리액션이 미지근하거나 나를 1순위로 두지 않으면 서운해짐
  - 정화: 남들은 지나치는 말 한마디나 눈빛의 온도를 밤새 곱씹으며 혼자 서운함을 삭이다 갑자기 돌아섬
  - 무토: 묵묵히 다 받아주다가 상대가 내 선을 넘었다고 판단되는 순간 일체의 기회 없이 문을 닫아버림
  - 기토: 상대를 알뜰히 챙겨주지만 내심 내가 준 만큼 인정과 대우를 받고 싶은 보상 심리가 작동함
  - 경금: 핑계나 애매한 태도를 못 견디며, 감정적 공감보다 사실관계와 의리를 따지다 상처를 줌
  - 신금: 1%의 결점이나 자신만의 엄격한 미적/도덕적 잣대에 어긋나면 순간 정이 떨어지는 까다로움
  - 임수: 대범해 보이지만 진짜 속마음과 치명적인 패는 연인에게조차 끝까지 숨기는 경계심
  - 계수: 상대의 감정을 꿰뚫어 보며 맞추어 주지만, 나를 구속하려 들면 소리 없이 빠져나가는 방어기제

## 🔗 이야기 편과 심층 해설편의 1:1 인과적 완벽 일치
- 앞서 풀어낸 연애, 재물, 직업, 건강의 성향은 하단 심층 해설편의 **사주 일간(daymaster), 자미두수 명궁 주성, 오행 분포**와 반드시 100% 동일한 맥락이어야 합니다.
- 위에서 지적한 연애의 갈등이나 건강의 피로 신호가 아래 명리학적 원국 분석에서 "아, 내 일간의 오행과 이 별 때문이었구나!"로 명쾌하게 입증되도록 인과관계를 철저히 맞추십시오.

## 그 외 원칙

- **한 줄 정의(headline):** 교과서적 수식어("성실하고 온화한 사람")를 쓰지 않습니다.
  감각적인 비유 한 문장으로 이 사람을 그려내십시오.
  (예: "바위틈을 뚫고 자란 소나무처럼, 겉은 꼿꼿하고 속은 물러서지 않는 사람입니다.")
- **겉과 속:** 남들이 보는 모습과 혼자 있을 때의 모습을 각각 짚고, 그 둘을 겹쳐
  이 사람이 실제로 어떤 사람인지 드러내십시오.
- 사주 용어를 풀이하지 않습니다("신금은 보석이라 예민하다" 같은 서술 금지).
  기운을 **살아온 장면과 감정**으로 바꿔 쓰십시오.
`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        headline: {
          type: Type.STRING,
          description: "A sensory, poetic one-line metaphor capturing the person's core essence (e.g. 센 불에 빠르게 구워 낸, 첫 입부터 강한 음식입니다.)"
        },
        character_desc: {
          type: Type.STRING,
          description: "A comprehensive summary narrative synthesizing their eastern/western astrology and MBTI in fluent storytelling style."
        },
        duality: {
          type: Type.OBJECT,
          properties: {
            outer: { type: Type.STRING, description: "First impression, walking speed, decision speed, facial tension, and external behavior" },
            inner: { type: Type.STRING, description: "True inner self, hidden burdens, calculating worst case, loneliness, defense mechanism" },
            contrast: { type: Type.STRING, description: "The profound intersection: what people think they are vs who they actually are alone" }
          },
          required: ["outer", "inner", "contrast"]
        },
        // 인생의 계단 — 대운 10년 주기를 축으로 삼은 파노라마.
        // 이 배열을 먼저 생성해야 이후 네 갈래가 참조할 축이 생긴다.
        life_stages: {
          type: Type.ARRAY,
          description:
            "The person's life as a staircase, one entry per daewoon cycle from daewoon_cycles, in chronological order. Past stages recount what likely happened; the current stage is the longest and most detailed; future stages foretell. Each entry's closing sentence must lead into the next stage so the whole array reads as one continuous walk, never as isolated blocks.",
          items: {
            type: Type.OBJECT,
            properties: {
              age_from: { type: Type.NUMBER, description: "Starting age of this cycle, taken from daewoon_cycles 시작나이" },
              age_to: { type: Type.NUMBER, description: "Ending age (age_from + 9)" },
              title: { type: Type.STRING, description: "A plain-Korean name for this era, no saju jargon (e.g. 혼자 익히던 시절)" },
              is_current: { type: Type.BOOLEAN, description: "True only for the cycle containing the person's current age" },
              narrative: { type: Type.STRING, description: "What this era was/is/will be like, in concrete lived scenes. Past: what likely happened and how it shaped them. Current: longest and most detailed. Future: how it unfolds." },
              link_to_next: { type: Type.STRING, description: "One sentence carrying the reader from this stage into the next. Omit only for the final stage." }
            },
            required: ["age_from", "age_to", "title", "is_current", "narrative"]
          }
        },
        wealth: {
          type: Type.OBJECT,
          properties: {
            bridge: { type: Type.STRING, description: "One sentence connecting from the current life stage into the money theme. Must reference what was just said in life_stages." },
            earning: { type: Type.STRING, description: "Concrete scenes where money is actually made, framed as 'in this current stage, it works like this'" },
            leak: { type: Type.STRING, description: "Where money leaks out, tied to this person's specific temperament rather than generic advice" }
          },
          required: ["bridge", "earning", "leak"]
        },
        love: {
          type: Type.OBJECT,
          properties: {
            bridge: { type: Type.STRING, description: "One sentence connecting from work into relationships — the same temperament showing up in how they let people close. Comes right after the work passage on screen." },
            meeting_scene: { type: Type.STRING, description: "Where they actually meet a partner, in concrete settings" },
            friction_point: { type: Type.STRING, description: "Why they clash and what must be agreed on to last" }
          },
          required: ["bridge", "meeting_scene", "friction_point"]
        },
        career: {
          type: Type.OBJECT,
          properties: {
            bridge: { type: Type.STRING, description: "One sentence connecting from the money theme into work — the same drive showing up in how they handle tasks and colleagues. Comes right after the wealth section on screen." },
            strength: { type: Type.STRING, description: "Where their presence shows, what kind of problem brings out their edge" },
            recommended_fields: { type: Type.STRING, description: "Specific industries and roles that fit" }
          },
          required: ["bridge", "strength", "recommended_fields"]
        },
        health: {
          type: Type.OBJECT,
          properties: {
            bridge: { type: Type.STRING, description: "One sentence connecting from relationships into the body — how carrying people and expectations reaches their health. Comes right after the relationships section on screen." },
            signal: { type: Type.STRING, description: "The first body area that warns them when depleted" },
            recovery: { type: Type.STRING, description: "What actually restores them, specific to this person" }
          },
          required: ["bridge", "signal", "recovery"]
        },
        // 닫는 말 — 네 갈래를 한 문단으로 봉합한다
        closing: {
          type: Type.STRING,
          description:
            "A final paragraph gathering the four themes back into one story, showing they were always the same thread. Ends with one concrete action to take now — an action, not a resolution. Never ends on a warning."
        },
        one_action: {
          type: Type.STRING,
          description: "If you could pick only one thing to do right now, the exact actionable step."
        },
        four_areas: {
          type: Type.OBJECT,
          properties: {
            essence: { type: Type.STRING, description: "Personal essence and core traits (Saju/MBTI integration)" },
            talent: { type: Type.STRING, description: "Potential talents, career fits, and social behaviors" },
            flow: { type: Type.STRING, description: "Current life flow, timing guidance, and key lessons" },
            fortune: { type: Type.STRING, description: "Actionable remedies and customized lucky items/hacks" }
          },
          required: ["essence", "talent", "flow", "fortune"]
        },
        keywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "2-3 custom witty personality keywords"
        },
        // 리포트 최상단에 가장 큰 글씨로 렌더되는 문장이다.
        // 반드시 '~합니다/~입니다' 존댓말. 반말 예시를 넣으면 그 톤이 그대로 나온다.
        punchy_quote: {
          type: Type.STRING,
          description:
            "The single sentence shown largest at the very top of the report. Names what this person quietly carries, in the calm voice of an elder reading their chart — polite Korean ending in ~합니다/~입니다, never casual speech, never an exclamation mark. It sees through the facade without accusing. (e.g. 겉으로는 아무렇지 않은 얼굴을 하고 계시지만, 혼자 있는 시간에는 늘 최악의 경우를 먼저 계산해 두는 분입니다.)"
        },
        tags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "3-4 short hashtags naming this person's traits, calm rather than sensational (e.g. #혼자삭이는편, #기준이높은사람)"
        },
        season_quote: {
          type: Type.STRING,
          description:
            "One sentence on what this current daewoon period asks of them. Polite Korean (~합니다/~입니다), no exclamation marks, no casual speech. Points a direction rather than issuing an order."
        }
      },
      required: [
        "headline",
        "character_desc",
        "duality",
        "life_stages",
        "wealth",
        "love",
        "career",
        "health",
        "closing",
        "one_action",
        "four_areas",
        "keywords",
        "punchy_quote",
        "tags",
        "season_quote"
      ]
    };

    if (geminiCircuitBreaker.isOpen()) {
      throw new Error("Gemini circuit breaker is currently OPEN due to overload or outages.");
    }

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini generation timed out after 15s")), 15000)
      );

      const generatePromise = ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.4,
          topP: 0.92,
          // 출력 상한. v2 스키마(대운 10단계 + bridge 4 + closing)로 응답이 길어졌고
          // 상한이 없으면 한 번의 호출이 예측 불가한 비용을 낸다.
          maxOutputTokens: 16384,
        }
      });

      const response = await Promise.race([generatePromise, timeoutPromise]) as any;

      const parsed = JSON.parse(response.text!.trim());
      geminiCircuitBreaker.recordSuccess();
      return parsed;
    } catch (err) {
      geminiCircuitBreaker.recordFailure(err);
      throw err;
    }
  }

  // Endpoint to generate personal AI analysis using Gemini 3.5 Flash (cached on client/DB after 1-time run)
  // Gemini 호출은 건당 과금이고 이 엔드포인트는 인증이 없다.
  // 스키마 버전을 올리면 전 사용자가 재생성되므로 상한이 없으면 배포 직후
  // 유입 곡선을 그대로 따라가는 과금 스파이크가 생긴다.
  // 서킷 브레이커는 "실패"를 막는 장치이지 "성공하는 비용 폭주"를 막지 못한다.
  const aiGenerationLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20, // IP당 분당 20회 — 테스트 및 새로고침 시 429 차단 방지
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "요청이 잠시 몰렸습니다. 1분 후 다시 시도해 주세요.",
    },
  });

  app.post("/api/personal-analysis", aiGenerationLimiter, async (req, res) => {
    try {
      const { member } = req.body;
      if (!member) {
        return res.status(400).json({ error: "회원 정보가 누락되었습니다." });
      }
      const personalAnalysis = await generatePersonalAnalysisForMember(member);
      res.json({ success: true, personal_analysis: personalAnalysis });
    } catch (err: any) {
      console.error("Personal AI analysis failed:", err);
      res.status(500).json({ error: formatGeminiError(err) });
    }
  });


  function generateRichPairAspects(m1: any, m2: any): any {
    const getHashScore = (str1: string, str2: string, seed: number, min = 68, max = 95) => {
      const combined = [str1, str2].sort().join("");
      let hash = 0;
      for (let i = 0; i < combined.length; i++) {
        hash = combined.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs((hash + seed) % (max - min + 1)) + min;
    };

    const id1 = m1.id || "m1";
    const id2 = m2.id || "m2";
    const nick1 = m1.nickname || "멤버1";
    const nick2 = m2.nickname || "멤버2";

    const g1 = m1.saju?.daymaster?.gan || "갑목";
    const g2 = m2.saju?.daymaster?.gan || "을목";
    const elem1 = m1.saju?.daymaster?.element || "목";
    const elem2 = m2.saju?.daymaster?.element || "목";

    const isGeneratingSupport =
      (elem1 === "목" && elem2 === "화") ||
      (elem1 === "화" && elem2 === "토") ||
      (elem1 === "토" && elem2 === "금") ||
      (elem1 === "금" && elem2 === "수") ||
      (elem1 === "수" && elem2 === "목");

    const isReceivingSupport =
      (elem2 === "목" && elem1 === "화") ||
      (elem2 === "화" && elem1 === "토") ||
      (elem2 === "토" && elem1 === "금") ||
      (elem2 === "금" && elem1 === "수") ||
      (elem2 === "수" && elem1 === "목");

    const isClash =
      (elem1 === "목" && elem2 === "토") ||
      (elem1 === "토" && elem2 === "수") ||
      (elem1 === "수" && elem2 === "화") ||
      (elem1 === "화" && elem2 === "금") ||
      (elem1 === "금" && elem2 === "목") ||
      (elem2 === "목" && elem1 === "토") ||
      (elem2 === "토" && elem1 === "수") ||
      (elem2 === "수" && elem1 === "화") ||
      (elem2 === "화" && elem1 === "금") ||
      (elem2 === "금" && elem1 === "목");

    // Dynamic Saju Score with Wide Variance (58 ~ 98)
    let saju1to2 = getHashScore(id1, id2, 11, 68, 83);
    let saju2to1 = getHashScore(id1, id2, 33, 68, 83);
    let sajuLabel = "담백하고 편안한 상생 조합";
    let sajuDesc = "";

    if (isGeneratingSupport) {
      saju1to2 = getHashScore(id1, id2, 17, 88, 98);
      saju2to1 = getHashScore(id1, id2, 41, 84, 96);
      sajuLabel = "오행상생의 창조적 파트너";
      sajuDesc = `${nick1}님은 ${nick2}님에게 ${saju1to2}점, ${nick2}님은 ${nick1}님에게 ${saju2to1}점. ${g1}의 기운이 ${g2}을 부드럽게 북돋아 주어, ${nick1}님의 발상과 추진력이 ${nick2}님의 결실로 자연스럽게 연결되는 훌륭한 상생 궁합입니다.`;
    } else if (isReceivingSupport) {
      saju1to2 = getHashScore(id1, id2, 23, 84, 96);
      saju2to1 = getHashScore(id1, id2, 59, 88, 98);
      sajuLabel = "상생과 든든한 조력 기류";
      sajuDesc = `${nick1}님은 ${nick2}님에게 ${saju1to2}점, ${nick2}님은 ${nick1}님에게 ${saju2to1}점. ${g2}의 포근한 기운이 ${g1}을 든든하게 받쳐주어, 서로 깊은 정서적 안정감과 굳건한 신뢰를 형성하는 관계입니다.`;
    } else if (elem1 === elem2) {
      saju1to2 = getHashScore(id1, id2, 15, 78, 92);
      saju2to1 = getHashScore(id1, id2, 45, 78, 92);
      sajuLabel = "거울을 보듯 통하는 소울 조합";
      sajuDesc = `${nick1}님은 ${nick2}님에게 ${saju1to2}점, ${nick2}님은 ${nick1}님에게 ${saju2to1}점. 서로 같은 '${elem1}'의 오행 본질을 지녀 말하지 않아도 서로의 생각과 감정을 직관적으로 이해하는 소울메이트 기운입니다.`;
    } else if (isClash) {
      saju1to2 = getHashScore(id1, id2, 19, 58, 69);
      saju2to1 = getHashScore(id1, id2, 37, 58, 69);
      sajuLabel = "긴장 속에서 꽃피는 혁신 조합";
      sajuDesc = `${nick1}님은 ${nick2}님에게 ${saju1to2}점, ${nick2}님은 ${nick1}님에게 ${saju2to1}점. ${g1}과 ${g2}의 기운이 팽팽한 텐션을 형성하나, 서로의 사각지대를 예리하게 짚어주는 지적 자극제 역할을 합니다.`;
    } else {
      saju1to2 = getHashScore(id1, id2, 21, 69, 82);
      saju2to1 = getHashScore(id1, id2, 51, 69, 82);
      sajuLabel = "담백하고 온화한 조율 조합";
      sajuDesc = `${nick1}님은 ${nick2}님에게 ${saju1to2}점, ${nick2}님은 ${nick1}님에게 ${saju2to1}점. 불필요한 마찰 없이 물 흐르듯 잔잔하게 어우러지며 각자의 페이스를 존중해 주는 안정된 인연입니다.`;
    }

    // Ziwei
    const ziweiStars = [
      { name: "자미성", desc: "중심을 잡고 품격을 지켜주는 기상" },
      { name: "천부성", desc: "너그럽고 포근하게 품어주는 안정감" },
      { name: "태양성", desc: "따뜻하고 시원시원한 친화력" },
      { name: "무곡성", desc: "우직하고 의리 있는 성실함" },
      { name: "천기성", desc: "기민하고 번뜩이는 영민함" }
    ];
    const zStar1 = ziweiStars[getHashScore(id1, id2, 3, 0, ziweiStars.length - 1)];
    const zStar2 = ziweiStars[getHashScore(id1, id2, 7, 0, ziweiStars.length - 1)];
    const ziwei1to2 = getHashScore(id1, id2, 44, 68, 95);
    const ziwei2to1 = getHashScore(id1, id2, 88, 68, 95);
    const ziweiDesc = `${nick1}님은 ${nick2}님에게 ${ziwei1to2}점, ${nick2}님은 ${nick1}님에게 ${ziwei2to1}점. ${nick1}님의 명궁 기저에 깃든 ${zStar1.name}(${zStar1.desc})과 ${nick2}님의 ${zStar2.name}(${zStar2.desc})이 서로의 기량을 돋보이게 하는 조화로운 별자리 인연입니다.`;

    // MBTI: Dynamic differentiation based on 4-letter alignment
    const mbti1 = (m1.mbti || "").trim().toUpperCase();
    const mbti2 = (m2.mbti || "").trim().toUpperCase();
    let mbti1to2 = 74;
    let mbti2to1 = 74;
    let mbtiDesc = "";
    if (mbti1.length === 4 && mbti2.length === 4) {
      let matchCount = 0;
      for (let k = 0; k < 4; k++) {
        if (mbti1[k] === mbti2[k]) matchCount++;
      }
      if (matchCount === 4) {
        mbti1to2 = getHashScore(id1, id2, 9, 88, 96);
        mbti2to1 = getHashScore(id1, id2, 19, 88, 96);
        mbtiDesc = `${nick1}님은 ${nick2}님에게 ${mbti1to2}점, ${nick2}님은 ${nick1}님에게 ${mbti2to1}점. 동일한 ${mbti1} 유형으로 생각의 알고리즘이 완벽히 일치하여 눈빛만 봐도 통하는 환상의 싱크로율입니다.`;
      } else if (matchCount >= 2) {
        mbti1to2 = getHashScore(id1, id2, 9, 78, 88);
        mbti2to1 = getHashScore(id1, id2, 19, 78, 88);
        mbtiDesc = `${nick1}님은 ${nick2}님에게 ${mbti1to2}점, ${nick2}님은 ${nick1}님에게 ${mbti2to1}점. ${mbti1}과 ${mbti2}의 건강한 시너지로, 공통점은 나누고 다른 점은 배려하며 협업 효율이 높은 이상적 짝꿍입니다.`;
      } else {
        mbti1to2 = getHashScore(id1, id2, 9, 60, 72);
        mbti2to1 = getHashScore(id1, id2, 19, 60, 72);
        mbtiDesc = `${nick1}님은 ${nick2}님에게 ${mbti1to2}점, ${nick2}님은 ${nick1}님에게 ${mbti2to1}점. ${mbti1}과 ${mbti2}의 극과 극 성향으로 초반 소통의 조율이 필요하나, 서로가 갖지 못한 맹점을 메워주는 보완적 조합입니다.`;
      }
    } else {
      mbti1to2 = getHashScore(id1, id2, 12, 67, 85);
      mbti2to1 = getHashScore(id1, id2, 24, 67, 85);
      mbtiDesc = `${nick1}님은 ${nick2}님에게 ${mbti1to2}점, ${nick2}님은 ${nick1}님에게 ${mbti2to1}점. 서로의 타고난 개성과 라이프스타일을 편견 없이 수용하며 자연스럽게 녹아드는 유연한 관계입니다.`;
    }

    // Zodiac: 4 Element Triplicities (Fire, Earth, Air, Water)
    const z1 = getWesternZodiac(m1.birth_date);
    const z2 = getWesternZodiac(m2.birth_date);
    const zName1 = typeof z1 === "object" && (z1 as any)?.name ? (z1 as any).name : String(z1 || "별자리");
    const zName2 = typeof z2 === "object" && (z2 as any)?.name ? (z2 as any).name : String(z2 || "별자리");

    const getZodiacElement = (name: string): string => {
      if (name.includes("양") || name.includes("사자") || name.includes("사수")) return "불";
      if (name.includes("황소") || name.includes("처녀") || name.includes("염소")) return "흙";
      if (name.includes("쌍둥이") || name.includes("천칭") || name.includes("물병")) return "공기";
      return "물";
    };
    const zElem1 = getZodiacElement(zName1);
    const zElem2 = getZodiacElement(zName2);
    const isZodiacCompatible = (zElem1 === zElem2) ||
      (zElem1 === "불" && zElem2 === "공기") || (zElem1 === "공기" && zElem2 === "불") ||
      (zElem1 === "흙" && zElem2 === "물") || (zElem1 === "물" && zElem2 === "흙");
    const isZodiacClash = (zElem1 === "불" && zElem2 === "물") || (zElem1 === "물" && zElem2 === "불") ||
      (zElem1 === "흙" && zElem2 === "공기") || (zElem1 === "공기" && zElem2 === "흙");

    let zodiac1to2 = getHashScore(id1, id2, 29, 70, 85);
    let zodiac2to1 = getHashScore(id1, id2, 69, 70, 85);
    if (isZodiacCompatible) {
      zodiac1to2 = getHashScore(id1, id2, 29, 86, 97);
      zodiac2to1 = getHashScore(id1, id2, 69, 86, 97);
    } else if (isZodiacClash) {
      zodiac1to2 = getHashScore(id1, id2, 29, 61, 73);
      zodiac2to1 = getHashScore(id1, id2, 69, 61, 73);
    }
    const zodiacDesc = `${nick1}님은 ${nick2}님에게 ${zodiac1to2}점, ${nick2}님은 ${nick1}님에게 ${zodiac2to1}점. ${zName1}(${zElem1})과 ${zName2}(${zElem2})의 성좌 기운이 만나 ${isZodiacCompatible ? '매끄러운 화합과 활력' : isZodiacClash ? '팽팽한 긴장감과 신선한 자극' : '편안하고 담백한 동반'}을 형성합니다.`;

    const overallScore = Math.round((saju1to2 + saju2to1 + ziwei1to2 + ziwei2to1 + mbti1to2 + mbti2to1 + zodiac1to2 + zodiac2to1) / 8);

    return {
      member_id_1: id1,
      member_id_2: id2,
      score: overallScore,
      label: sajuLabel,
      description: `${nick1}님과 ${nick2}님은 서로 다른 개성이 절묘한 균형을 이루며 시너지를 발휘하는 인연입니다. 4대 영역(사주·자미두수·MBTI·별자리)에서 서로의 장점을 지지하고 부족한 점을 보완해 주는 안정된 흐름을 지닙니다.`,
      saju: { score_1_to_2: saju1to2, score_2_to_1: saju2to1, description: sajuDesc },
      ziwei: { score_1_to_2: ziwei1to2, score_2_to_1: ziwei2to1, description: ziweiDesc },
      mbti: { score_1_to_2: mbti1to2, score_2_to_1: mbti2to1, description: mbtiDesc },
      zodiac: { score_1_to_2: zodiac1to2, score_2_to_1: zodiac2to1, description: zodiacDesc },
    };
  }

  // Graceful astrological fallback engine when AI is overloaded or circuit is OPEN
  function synthesizeAstrologicalGroupAnalysis(members: any[], room_title: string, personalMap: Record<string, any>) {
    const fallbackPairs: any[] = [];
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        fallbackPairs.push(generateRichPairAspects(members[i], members[j]));
      }
    }
    const avgScore = Math.round(fallbackPairs.reduce((acc, p) => acc + (p.score || 75), 0) / (fallbackPairs.length || 1));
    return {
      personal: personalMap,
      pairs: fallbackPairs,
      group: {
        overall_score: avgScore,
        title: `${room_title || "우리 모임"}의 화합과 지혜로운 시너지`,
        description: `${members.length}명의 서로 다른 고유 기운이 어우러져 각자의 강점이 돋보이고 부족함을 채워주는 균형 잡힌 인연 공동체입니다.`,
        atmosphere: "서로의 개성을 있는 그대로 존중하며 편안한 유대감과 긍정적 에너지가 흐르는 분위기",
        synergy_tips: "의견 차이가 생길 때는 각자의 성향과 의사결정 방식을 배려하며 조율하면 놀라운 시너지가 일어납니다."
      },
      circuit_breaker: {
        triggered: true,
        message: "현재 AI 트래픽 폭주로 인하여 서킷 브레이커가 가동되었습니다. 초정밀 명리학 및 성좌 연산 엔진으로 즉시 안전하게 분석되었습니다."
      }
    };
  }

  app.post("/api/analyze", async (req, res) => {
    let { room_title, members } = req.body;
    const personalMap: Record<string, any> = {};

    try {
      if (!members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ error: "분석할 멤버 정보가 없습니다." });
      }

      // Safeguard: Limit the maximum number of members to analyze to 16 to prevent token overflow and Gemini response timeout
      if (members.length > 16) {
        members = members.slice(0, 16);
      }

      // Circuit Breaker Fast-Path: If circuit is OPEN due to API exhaustion/outage, return immediately without waiting for timeouts
      if (geminiCircuitBreaker.isOpen()) {
        console.warn("[SERVER /api/analyze] Gemini Circuit Breaker is active (OPEN). Returning instant high-precision astrology engine results.");
        members.forEach((m: any) => {
          personalMap[m.id] = m.personal_analysis || {
            character_desc: `${m.nickname}님의 고유 성향입니다.`,
            four_areas: {
              essence: "사주와 성좌의 균형 잡힌 본질입니다.",
              talent: "주도적이고 섬세한 실전 역량입니다.",
              flow: "새로운 전환과 성장의 흐름에 있습니다.",
              fortune: "긍정적 교류와 여유로운 휴식이 행운을 북돋웁니다."
            },
            keywords: ["신중함", "따뜻함", "추진력"]
          };
        });
        return res.json(synthesizeAstrologicalGroupAnalysis(members, room_title, personalMap));
      }

      const ai = getGeminiClient();
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." });
      }

      // Step 1: Ensure EVERY member has a personal_analysis (generate lazily if missing in parallel using gemini-3.5-flash)
      
      await Promise.all(
        members.map(async (m: any) => {
          if (m.personal_analysis && m.personal_analysis.four_areas && m.personal_analysis.four_areas.essence) {
            personalMap[m.id] = m.personal_analysis;
          } else {
            console.log(`Lazy generating personal analysis for member: ${m.nickname} (${m.id})`);
            try {
              const generated = await generatePersonalAnalysisForMember(m);
              m.personal_analysis = generated;
              personalMap[m.id] = generated;
            } catch (lazyErr) {
              console.error(`Lazy generation failed for ${m.nickname}:`, lazyErr);
              // Fallback placeholder to prevent overall crash
              const fallback = {
                character_desc: `${m.nickname}님의 고유 성향입니다.`,
                four_areas: {
                  essence: "본질 분석 중입니다.",
                  talent: "재능 분석 중입니다.",
                  flow: "흐름 분석 중입니다.",
                  fortune: "생활기운 분석 중입니다."
                },
                keywords: ["신중함", "따뜻함"]
              };
              m.personal_analysis = fallback;
              personalMap[m.id] = fallback;
            }
          }
        })
      );

      const totalPairsCount = (members.length * (members.length - 1)) / 2;
      const isLargeGroup = members.length > 4;
      const pairsGuideline = isLargeGroup ? `
- 현재 모임방 기준 **총 ${totalPairsCount}개의 조합이 있습니다.**
- **[대규모 그룹 최적화 지침 - 극도로 중요]** 출력 토큰 제한(Max Output Token Limit) 초과 및 응답 타임아웃을 방지하기 위해, **'pairs' 배열에는 오직 가장 상징적이거나 특징적인 궁합 4쌍(예: 가장 점수가 높은 환상의 시너지 짝꿍 2쌍, 그리고 가장 충돌이 있거나 서로 조심해야 하는 앙숙/마찰 짝꿍 2쌍)만 선정하여 포함하십시오.**
- 이 4쌍을 제외한 나머지 모든 1:1 조합은 포함하지 마십시오. 시스템 백엔드와 프론트엔드가 자동으로 감지하여 완벽히 백필(Backfill) 및 고품질로 복원하므로, 귀하가 일일이 열거하여 출력할 필요가 전혀 없습니다.
- 선정된 각 1:1 쌍의 설명 및 하위 분야별 설명은 단 1~2문장으로 매우 명확하고 심플하게 요약하여 핵심 위주로만 작성해 주십시오.` : `
- 입력받은 전체 멤버 수가 N명일 때, 가능한 모든 1:1 쌍의 조합의 개수는 정확히 N * (N - 1) / 2 개이며, 현재 모임방 기준 **총 ${totalPairsCount}개의 조합이 있습니다.**
- **'pairs' 배열에 가능한 모든 ${totalPairsCount}개의 모든 조합에 대한 궁합 데이터를 하나도 빠짐없이 포함시켜야 합니다.** 절대로 임의로 일부 최고/최저 궁합만 선별하여 출력하거나 일부를 누락하지 마십시오. 모든 멤버가 서로서로 1:1 궁합 분석을 가질 수 있도록 전수조사하여 배열에 담으십시오.
- 각 1:1 쌍의 설명 및 하위 분야별 설명은 2~3개의 정밀하고 완성도 높은 문장으로 격조 있게 기술해 주십시오.`;

      // Pre-compute interplay hints for pairs to ground Gemini in true astrological & psychological facts
      const pairHints: any[] = [];
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const m1 = members[i];
          const m2 = members[j];
          const hints = computeInterplayHints(m1, m2);
          pairHints.push({
            pair: `${m1.nickname}(${m1.id}) & ${m2.nickname}(${m2.id})`,
            member_id_1: m1.id,
            member_id_2: m2.id,
            saju_stem_relation: hints.stemRelation,
            element_chemistry: hints.elementRelation,
            complementary_elements: hints.complementary,
            mbti_dynamics: hints.mbtiDynamics
          });
        }
      }

      // Enrich members to feed deep celestial & modern aspects into Gemini
      const enrichedMembersInfo = members.map((m: any) => {
        const zodiac = getWesternZodiac(m.birth_date);
        
        let mingGongStars = "알 수 없음";
        let mingGongGanzhi = "알 수 없음";
        if (m.saju?.ziwei?.palaces) {
          const mingGong = Object.values(m.saju.ziwei.palaces).find((p: any) => p.name === "命宮" || p.nameKr === "명궁") as any;
          if (mingGong) {
            mingGongGanzhi = mingGong.ganZhi || "알 수 없음";
            const starsList = mingGong.stars || [];
            if (starsList.length > 0) {
              mingGongStars = starsList.map((s: any) => `${s.nameKr}(밝기:${s.brightnessKr || '무난'}, 화성:${s.siHuaKr || '없음'})`).join(", ");
            } else {
              mingGongStars = "명궁에 배치된 주요 은하수 별 없음";
            }
          }
        }

        const ohaengCountText = m.saju?.ohaeng_count 
          ? Object.entries(m.saju.ohaeng_count).map(([k, v]) => `${k}:${v}개`).join(", ")
          : "정보 없음";

        const sipseongStrengthText = m.saju?.sipseong_strength
          ? Object.entries(m.saju.sipseong_strength).map(([k, v]) => `${k}:${v}%`).join(", ")
          : "정보 없음";

        return {
          id: m.id,
          member_id: m.id,
          nickname: m.nickname,
          gender: m.gender,
          birth_date: m.birth_date,
          birth_time: m.birth_time || "모름",
          mbti: m.mbti || "미입력 (현대성향 정보 없음)",
          western_zodiac: zodiac,
          personal_analysis: personalMap[m.id], // Use the pre-computed or lazily generated personal analysis!
          saju_info: {
            daymaster_gan: m.saju?.daymaster?.gan || "알 수 없음",
            daymaster_element: m.saju?.daymaster?.element || "알 수 없음",
            day_pillar_ganzi: m.saju?.pillars?.day ? `${m.saju.pillars.day.gan}${m.saju.pillars.day.ji}` : "알 수 없음",
            day_pillar_insight: getDayPillarInsight(m.saju?.pillars?.day ? `${m.saju.pillars.day.gan}${m.saju.pillars.day.ji}` : ""),
            season_insight: getSeasonInsight(m.birth_date, m.saju?.pillars?.month?.ji),
            ohaeng_count: ohaengCountText,
            ohaeng_balance_insight: getOhaengBalanceDetail(m.saju?.ohaeng_count),
            sipseong_strength: sipseongStrengthText,
            special_sals: m.saju?.special_sals_list || [],
            ming_gong_stars: mingGongStars,
            ming_gong_ganzi: mingGongGanzhi
          }
        };
      });

      const prompt = `
${FLUENT_KOREAN_SYSTEM_GUIDELINE}

당신은 대한민국에서 가장 영험한 통찰력과 스토리텔링을 지닌 사주명리학·동서양 점성학(자미두수·별자리)·MBTI 심리 분석의 대가입니다.
두 사람이 한 공간에 들어섰을 때 감도는 미묘한 공기의 흐름, 눈빛이 마주치는 순간 일어나는 화학 반응, 그리고 함께 시간을 보내며 겪게 될 현실 속 생생한 에피소드를 **한 편의 몰입감 넘치는 관계 에세이이자 상담록**으로 풀어내십시오.

## [중요] 개인 분석 생략 안내:
각 멤버의 개인 평생 감정서('personal_analysis')는 이미 완벽히 해독되어 각 멤버 정보 내에 탑재되어 제공되었습니다.
따라서 귀하는 개개인의 단순 성향 나열을 반복할 필요가 없으며, 오직 멤버 간 '1:1 개별 인연 궁합 분석(pairs)'과 '전체 그룹 분석(group)'의 역동적인 케미스트리에 집중하십시오.

## 💡 [핵심 관계 팩트 데이터베이스 (Pair Interplay Facts)]:
아래 데이터는 시스템 명리 엔진이 사전에 수학적으로 계산한 두 사람 사이의 천간합, 오행 상생상극, 결핍 보완 및 MBTI 상호작용입니다.
이 팩트들을 1:1 궁합 설명(description) 작성 시 서사의 핵심 씨앗으로 반드시 활용하십시오!
${JSON.stringify(pairHints, null, 2)}

## 핵심 가이드라인 (스토리텔링 극대화, 입체적 인간관계 통찰):
1. **생생한 현실 시나리오 기반의 1:1 관계 스토리텔링:**
   - "서로 상극이라 안 맞습니다" 같은 무미건조한 판정은 엄격히 배제하십시오.
   - "처음에는 서로의 속도를 이해하기 어려워 A님이 B님의 신중함을 답답해하거나, B님이 A님의 추진력에 깜짝 놀라 뒤로 물러설 수 있습니다. 그러나 대화가 깊어지는 순간 서로가 자신에게 없는 가장 결정적인 퍼즐 조각임을 깨닫게 되는 반전의 앙상블입니다."와 같이 살아 숨 쉬는 서사로 묘사하십시오.
   - **구체적인 일상 장면을 포착하십시오:**
     * **여행을 떠났을 때:** 엑셀로 분 단위 계획을 짜는 사람과 발길 닿는 대로 걷는 사람의 완급 조절 케미.
     * **식사나 메뉴를 정할 때:** 서로 배려하다 결국 한 명이 결단 내리거나, 취향이 극과 극이라 새로운 맛집을 개척하는 풍경.
     * **함께 협업하거나 프로젝트를 할 때:** 불씨를 지피는 추진파와 구멍을 메우는 디테일파의 분업 시너지.
2. **갈등 트리거(지뢰 버튼)와 3초 화해 공식:**
   - 두 사람이 부딪칠 수밖에 없는 결정적 이유(예: A님의 침묵을 B님이 무시로 오해하거나, B님의 직설적 비판에 A님이 상처받는 순간)를 짚어주십시오.
   - 갈등이 생겼을 때 바로 풀어낼 수 있는 실전 화해 팁(맛있는 커피 한 잔, 30분 쿨타임 갖기 등)을 전수하십시오.
2. **MBTI 코드 영문 대문자 표기 절대 원칙:** 
   - 모든 MBTI 코드(예: ENFP, INFJ, ESTP, INTJ 등)는 반드시 영문 대문자로만 표기해야 합니다.
3. **소셜/동료 용어 사용 원칙:**
   - '메이트', '파트너', '조합', '단짝', '동료', '인연', '멤버', '시너지 짝꿍' 등의 세련된 친목/소셜 지향적 단어를 채택하십시오.
4. **어려운 한자 노출 금지 & 쉬운 한글 묘사:**
   - 모든 명리학, 자미두수 용어는 100% 쉬운 한글(예: 신금, 해수, 명궁, 목 기운 등)로만 표기하십시오.
5. **멤버 간 1:1 개별 인연 궁합 분석 지침:**
   ${pairsGuideline}
   - 각 영역(saju, ziwei, mbti, zodiac) 및 종합 총합(combined/pairs) 별로:
     - 1번 멤버가 2번 멤버에게 주는 궁합 점수(score_1_to_2)와 2번 멤버가 1번 멤버에게 주는 궁합 점수(score_2_to_1)를 다르고 주관적으로 부여하십시오.
     - 오행의 생극제화, 십이주성, 성향 궁합 등 학술적 근거에 입각하여 깊이 있는 설명(description)을 작성하십시오.
     - **[초필수 표기 규칙]** 각 하위 궁합 영역(saju, ziwei, mbti, zodiac)의 설명 텍스트(description)의 첫 문장 또는 서두에 반드시 "A님은 B님에게 X점, B님은 A님에게 Y점" 형식으로 조사를 붙여 문장으로 명확히 표기하십시오. (예: "김도화님은 혁님에게 90점, 혁님은 김도화님에게 84점.")
   - 4대 분야(saju, ziwei, mbti, zodiac)를 입체적으로 융합한 후, 최종적으로 종합 인연 지수(score), 시너지 타이틀(label), 그리고 전체 종합 궁합 해설(description)을 작성하십시오.
6. **입력 데이터의 고유 식별자(member_id) 원본 유지 절대 원칙:**
   - 'pairs' 내의 'member_id_1'과 'member_id_2'는 무조건 입력 데이터의 멤버 'id' 값과 완벽하게 일치해야 합니다.
7. **[점수 획일화 방지 및 분산 스펙트럼 강제 지침 - 극도로 중요]:**
   - 모든 1:1 쌍에 70~75점대 점수가 천편일률적으로 몰리는 현상(Score Flattening)을 엄격히 금지합니다.
   - 두 사람의 오행 상생/상극(생극제화), 자미두수 주성 조화, MBTI 및 별자리 성향 차이에 따라 58점부터 98점까지 넓고 역동적인 점수 스펙트럼을 부여하십시오:
     * 최상위 환상의 상생 시너지 짝꿍: 90~98점
     * 긍정적 지지와 온화한 화합 짝꿍: 80~88점
     * 보통의 잔잔한 조율 및 상호 존중 짝꿍: 70~79점
     * 극명한 기운 충돌 및 긴장감 속 혁신 짝꿍: 58~69점
   - 점수는 1번->2번, 2번->1번이 상호 비대칭적이어야 하며(예: 한 쪽은 92점, 다른 쪽은 85점), 전체 멤버들의 궁합 목록이 다채롭고 생동감 있게 차별화되어야 합니다.

## 모임 이름: ${room_title || "친목모임"}

## 멤버들의 고도로 구조화된 동서양 4대 분석 데이터 (개인 분석 포함):
${JSON.stringify(enrichedMembersInfo, null, 2)}
`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          pairs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                member_id_1: { type: Type.STRING, description: "The ID of the first member in the pair" },
                member_id_2: { type: Type.STRING, description: "The ID of the second member in the pair" },
                score: { type: Type.INTEGER, description: "Overall combined compatibility score between 0 and 100" },
                label: { type: Type.STRING, description: "A poetic, humorous overall metaphor or label (e.g. 화산과 빙하)" },
                description: { type: Type.STRING, description: "Detailed, entertaining integrated summary of their chemistry across all 4 areas" },
                saju: {
                  type: Type.OBJECT,
                  properties: {
                    score_1_to_2: { type: Type.INTEGER, description: "Saju compatibility score of member 1 towards member 2 (0-100)" },
                    score_2_to_1: { type: Type.INTEGER, description: "Saju compatibility score of member 2 towards member 1 (0-100)" },
                    description: { type: Type.STRING, description: "Detailed analysis of Saju (five elements, stems, branches interaction)" }
                  },
                  required: ["score_1_to_2", "score_2_to_1", "description"]
                },
                ziwei: {
                  type: Type.OBJECT,
                  properties: {
                    score_1_to_2: { type: Type.INTEGER, description: "Ziwei Dusu compatibility score of member 1 towards member 2 (0-100)" },
                    score_2_to_1: { type: Type.INTEGER, description: "Ziwei Dusu compatibility score of member 2 towards member 1 (0-100)" },
                    description: { type: Type.STRING, description: "Detailed analysis of Ziwei Dusu based on palace stars, main stars, and flying stars" }
                  },
                  required: ["score_1_to_2", "score_2_to_1", "description"]
                },
                mbti: {
                  type: Type.OBJECT,
                  properties: {
                    score_1_to_2: { type: Type.INTEGER, description: "MBTI compatibility score of member 1 towards member 2 (0-100)" },
                    score_2_to_1: { type: Type.INTEGER, description: "MBTI compatibility score of member 2 towards member 1 (0-100)" },
                    description: { type: Type.STRING, description: "Modern psychology/MBTI compatibility analysis" }
                  },
                  required: ["score_1_to_2", "score_2_to_1", "description"]
                },
                zodiac: {
                  type: Type.OBJECT,
                  properties: {
                    score_1_to_2: { type: Type.INTEGER, description: "Western Zodiac compatibility score of member 1 towards member 2 (0-100)" },
                    score_2_to_1: { type: Type.INTEGER, description: "Western Zodiac compatibility score of member 2 towards member 1 (0-100)" },
                    description: { type: Type.STRING, description: "Zodiac compatibility analysis based on planetary alignments and elements" }
                  },
                  required: ["score_1_to_2", "score_2_to_1", "description"]
                }
              },
              required: ["member_id_1", "member_id_2", "score", "label", "description", "saju", "ziwei", "mbti", "zodiac"]
            }
          },
          group: {
            type: Type.OBJECT,
            properties: {
              overall_score: { type: Type.INTEGER, description: "Overall chemistry score for the entire group (0-100)" },
              title: { type: Type.STRING, description: "A witty, creative name or title for this group" },
              description: { type: Type.STRING, description: "A comprehensive, entertaining description of the group dynamics" },
              atmosphere: { type: Type.STRING, description: "The general vibe or atmosphere of the group" },
              synergy_tips: { type: Type.STRING, description: "Helpful/funny tips or advice for maximum group synergy" }
            },
            required: ["overall_score", "title", "description", "atmosphere", "synergy_tips"]
          }
        },
        required: ["pairs", "group"]
      };

      let attempts = 0;
      const maxAttempts = 3;
      let finalResult = null;

      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      const modelsToTry = [
        "gemini-3.5-flash", // Prioritize the highly robust and fast 3.5-flash model first to prevent timeouts
        "gemini-3.1-flash-lite"
      ];

      while (attempts < maxAttempts) {
        attempts++;
        const currentModel = modelsToTry[(attempts - 1) % modelsToTry.length];
        try {
          const response = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: responseSchema,
              temperature: 0.4,
              topP: 0.92,
            }
          });

          const text = response.text!.trim();
          const parsed = JSON.parse(text);
          geminiCircuitBreaker.recordSuccess();

          // Robust Self-Healing and mapping for member_ids to prevent fictional/sequential ID mismatches
          const originalMembers = members || [];
          const validIdsSet = new Set(originalMembers.map((m: any) => m.id));

          const mapToValidId = (returnedId: string, indexHint?: number): string => {
            if (!returnedId) return "";
            const cleanId = String(returnedId).trim();
            
            // 1. Check if perfectly valid
            if (validIdsSet.has(cleanId)) return cleanId;

            // 2. Match by nickname
            const matchByNick = originalMembers.find((m: any) => 
              m.nickname && (
                m.nickname.trim().toLowerCase() === cleanId.toLowerCase() ||
                cleanId.toLowerCase().includes(m.nickname.trim().toLowerCase()) ||
                m.nickname.trim().toLowerCase().includes(cleanId.toLowerCase())
              )
            );
            if (matchByNick) return matchByNick.id;

            // 3. Match by index (e.g. member_1, user_2, 1, 2)
            const numMatch = cleanId.match(/\d+/);
            if (numMatch) {
              const idx = parseInt(numMatch[0], 10) - 1;
              if (idx >= 0 && idx < originalMembers.length) {
                return originalMembers[idx].id;
              }
            }

            // 4. Index hint fallback
            if (indexHint !== undefined && indexHint >= 0 && indexHint < originalMembers.length) {
              return originalMembers[indexHint].id;
            }

            return originalMembers[0]?.id || cleanId;
          };

          // Apply self-healing correction to pairs array
          if (Array.isArray(parsed.pairs)) {
            parsed.pairs.forEach((pair: any) => {
              if (pair) {
                pair.member_id_1 = mapToValidId(pair.member_id_1);
                pair.member_id_2 = mapToValidId(pair.member_id_2);
              }
            });
          }

          // Backfill missing pairs (especially important for large groups to prevent Gemini token timeouts)
          const existingPairsSet = new Set<string>();
          if (Array.isArray(parsed.pairs)) {
            parsed.pairs = parsed.pairs.filter((p: any) => p && p.member_id_1 && p.member_id_2);
            parsed.pairs.forEach((pair: any) => {
              const sortedKey = [pair.member_id_1, pair.member_id_2].sort().join("<=>");
              existingPairsSet.add(sortedKey);
            });
          } else {
            parsed.pairs = [];
          }

          // Sanitize existing pairs in case AI returned placeholder or '대조합'
          if (Array.isArray(parsed.pairs)) {
            parsed.pairs.forEach((pair: any) => {
              if (pair) {
                const m1 = originalMembers.find((m: any) => m.id === pair.member_id_1);
                const m2 = originalMembers.find((m: any) => m.id === pair.member_id_2);
                const hasDummy =
                  !pair.saju?.description ||
                  pair.saju.description.trim() === "대조합" ||
                  pair.saju.description.trim().length < 5 ||
                  !pair.ziwei?.description ||
                  pair.ziwei.description.trim() === "대조합";

                if (hasDummy && m1 && m2) {
                  const enriched = generateRichPairAspects(m1, m2);
                  pair.saju = enriched.saju;
                  pair.ziwei = enriched.ziwei;
                  pair.mbti = enriched.mbti;
                  pair.zodiac = enriched.zodiac;
                  if (!pair.description || pair.description.trim() === "대조합" || pair.description.trim().length < 5) {
                    pair.description = enriched.description;
                  }
                  if (!pair.label || pair.label.trim() === "대조합") {
                    pair.label = enriched.label;
                  }
                }
              }
            });
          }

          for (let i = 0; i < originalMembers.length; i++) {
            for (let j = i + 1; j < originalMembers.length; j++) {
              const m1 = originalMembers[i];
              const m2 = originalMembers[j];
              const id1 = m1.id;
              const id2 = m2.id;
              if (id1 === id2) continue;
              const sortedKey = [id1, id2].sort().join("<=>");
              if (!existingPairsSet.has(sortedKey)) {
                parsed.pairs.push(generateRichPairAspects(m1, m2));
                existingPairsSet.add(sortedKey);
              }
            }
          }

          finalResult = {
            personal: personalMap,
            pairs: parsed.pairs,
            group: parsed.group,
          };
          break;
        } catch (innerErr) {
          console.warn(`Attempt ${attempts} failed:`, innerErr);
          geminiCircuitBreaker.recordFailure(innerErr);
          if (attempts >= maxAttempts) throw innerErr;
          await sleep(2000 * attempts);
        }
      }

      return res.json(finalResult);
    } catch (error: any) {
      console.error("Analysis generation error after all retries:", error);
      geminiCircuitBreaker.recordFailure(error);

      // Gracefully recover with high-precision astrological engine to ensure 100% uptime and prevent room crashes
      console.log("[SERVER /api/analyze] Gracefully recovering with high-precision astrological engine.");
      try {
        const fallbackResult = synthesizeAstrologicalGroupAnalysis(members, room_title, personalMap);
        fallbackResult.circuit_breaker.message = "현재 AI 트래픽 폭주 또는 응답 지연이 감지되어 서킷 브레이커가 작동했습니다. 초정밀 명리학 및 성좌 연산 엔진으로 신속하고 안전하게 분석되었습니다.";
        return res.json(fallbackResult);
      } catch (fbErr) {
        console.error("Fallback synthesis also failed:", fbErr);
        res.status(500).json({ error: formatGeminiError(error) });
      }
    }
  });

  app.post("/api/horoscope", async (req, res) => {
    try {
      const { member } = req.body;
      if (!member) {
        return res.status(400).json({ error: "멤버 정보가 누락되었습니다." });
      }

      if (geminiCircuitBreaker.isOpen()) {
        return res.status(429).json({
          error: "현재 인공지능(AI) 사용량이 일시적으로 폭주하여 안전 모드가 작동 중입니다. 잠시 후 다시 시도해 주세요.",
          circuit_breaker: true
        });
      }

      const ai = getGeminiClient();
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." });
      }

      const zodiac = getWesternZodiac(member.birth_date);
      const dmGan = member.saju?.daymaster?.gan || "알 수 없음";
      const dmElem = member.saju?.daymaster?.element || "알 수 없음";
      
      // Calculate unified deterministic today fortune score (matches frontend algorithm)
      const todayObj = new Date();
      const dateStr = todayObj.toISOString().slice(0, 10);
      let seed = 0;
      const cleanGan = dmGan || "갑목";
      const cleanElem = dmElem || "목";
      const combinedStr = cleanGan + cleanElem + dateStr;
      for (let i = 0; i < combinedStr.length; i++) {
        seed = (seed << 5) - seed + combinedStr.charCodeAt(i);
        seed |= 0;
      }
      const deterministicTodayScore = 75 + Math.abs(seed % 24);

      let dayPillarDetail = "알 수 없음";
      if (member.saju?.pillars_detail) {
        const dp = member.saju.pillars_detail.find((p: any) => p.type === "일주");
        if (dp) {
          dayPillarDetail = dp.ganzi;
        }
      }
      if (dayPillarDetail === "알 수 없음" && member.saju?.pillars?.day) {
        dayPillarDetail = `${member.saju.pillars.day.gan}${member.saju.pillars.day.ji}`;
      }

      const prompt = `
${FLUENT_KOREAN_SYSTEM_GUIDELINE}

## 어투 — 이 규칙이 아래 모든 지시보다 우선합니다

평생 수많은 사람을 마주해 온 도사가 찻잔을 앞에 두고 조용히 짚어주는 목소리로 씁니다.
확신은 있으나 과장하지 않고, 듣고 싶은 말을 하되 겁주지 않습니다.

- **문장은 '~합니다 / ~입니다'로 통일합니다.** 반말, 감탄사, 느낌표, 물음표를 쓰지 않습니다.
- "소름 돋게", "무릎을 탁", "팩트폭격", "사이다", "대박" 같은 자극적 표현을 쓰지 않습니다.
- 과장하거나 부풀리지 않습니다. 운이 좋을 때도 들뜨지 않게 중심을 잡아주고, 주의할 때도 불안감을 주지 않고 반드시 유연하게 비껴갈 길을 제시합니다.
- 단정하되 단호하지 않습니다. 판결이 아니라 따뜻하고 명확한 안내입니다.
- 단답형이나 요약형이 아닌, 깊이 있고 정갈하며 풍성한 호흡의 장문으로 씁니다.

## 대상자 핵심 정보:
- 이름/별명: ${member.nickname}
- 성별: ${member.gender === "male" ? "남성" : "여성"}
- 생년월일시: ${member.birth_date} ${member.birth_time || "출생시모름"}
- 현대 성향심리: ${member.mbti || "미입력"}
- 서양 황도 백자리: ${zodiac}
- 명리학 일주: ${dayPillarDetail} (${dmGan}일간, 오행 기운: ${dmElem})
- 오행 구성 비율: ${member.saju?.ohaeng_count ? JSON.stringify(member.saju.ohaeng_count) : "기본 구성"}
- 오늘의 확정된 천간지지 일진 점수: ${deterministicTodayScore}점 (today.score 필드에 반드시 ${deterministicTodayScore}를 기재하십시오)

## 작성 및 분량 지침 (깊이 있는 풍성한 해설):
1. **오늘의 운세 (today):**
   - 'today.summary'는 사주 일주와 오늘의 일진, 기질을 융합하여, 오늘 마주할 전반적 기류, 대인관계와 일터에서의 구체적 장면, 그리고 하루를 편안하고 이롭게 마무리하는 마음가짐까지 세 문단(줄바꿈 \\n\\n 2번 사용, 공백 포함 500~700자)으로 정성스럽게 작성하십시오.
   - 행운 처방(색상, 숫자, 방향, 시간)도 명확하고 단정하게 기재하십시오.

2. **주간 예보 (weekly):**
   - 'weekly.summary': 이번 주 전체를 관통하는 흐름과 주간 완급 조절 지침 (공백 포함 350~500자 내외).
   - 'weekly.love_and_social': 대인관계와 인연에서 주의할 점과 마음을 나누는 방법 (200~300자 내외).
   - 'weekly.wealth_and_job': 업무 추진 및 지출 방어, 실질적 기회에 대한 조언 (200~300자 내외).
   - 'weekly.health_and_energy': 주간 에너지 관리와 컨디션 회복을 위한 지침 (200~300자 내외).
   - 'weekly.daily_flow': 월요일부터 일요일까지 7일간 각 요일의 기류와 실천 팁을 각각 2문장 이상의 온전한 문장으로 작성하십시오.

3. **월간 리포트 (monthly):**
   - 'monthly.summary': 이번 달의 전반적인 운명적 조류와 핵심 과제 (공백 포함 400~600자 내외).
   - 'monthly.key_theme': 이달의 중심 기조를 한마디로 정의하는 문장.
   - 'monthly.opportunities': 이번 달 가장 적극적으로 살려야 할 기회 (250~350자 내외).
   - 'monthly.precautions': 서두르거나 방심할 때 생길 수 있는 문제와 유연한 대처법 (250~350자 내외).
   - 'monthly.weeks_flow': 1주차부터 4주차까지 주차별 흐름을 각각 2~3문장으로 구체적으로 서술하십시오.

4. **연간 대운세 (yearly):**
   - 'yearly.summary': 한 해의 거대한 변곡점과 흐름을 조망하는 깊이 있는 총평 (공백 포함 500~700자 내외).
   - 'yearly.grand_trend': 올 한 해를 이끄는 거시적 기운과 중심 잡기 (300~450자 내외).
   - 'yearly.wealth_flow': 재물 축적과 자산 운용의 방향 (250~350자 내외).
   - 'yearly.career_path': 일과 커리어의 도약 시기와 성취 방법 (250~350자 내외).
   - 'yearly.personal_growth': 내면의 지혜와 마음 수양 과제 (250~350자 내외).
`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          today: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "오늘의 전체적인 운세 상세 통합 해설 (사주, 별자리, MBTI 성향이 한데 녹아들어 간 3개 문단 장문)" },
              score: { type: Type.INTEGER, description: "오늘의 종합 행운 지수 (0-100)" },
              lucky_items: {
                type: Type.OBJECT,
                properties: {
                  color: { type: Type.STRING, description: "행운의 색상 및 이유" },
                  number: { type: Type.STRING, description: "행운의 숫자 및 의미" },
                  direction: { type: Type.STRING, description: "행운의 방향과 개운 팁" },
                  time: { type: Type.STRING, description: "기운이 극대화되는 황금 시간대" }
                },
                required: ["color", "number", "direction", "time"]
              }
            },
            required: ["summary", "score", "lucky_items"]
          },
          weekly: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "이번 주의 전체 행운 요약" },
              score: { type: Type.INTEGER, description: "이번 주 종합 지수 (0-100)" },
              love_and_social: { type: Type.STRING, description: "대인관계 및 소셜 파트너십 운세와 조언" },
              wealth_and_job: { type: Type.STRING, description: "재물 흐름과 직업/학업적 기회 및 처방" },
              health_and_energy: { type: Type.STRING, description: "건강 컨디션 유지 비책과 오행 기운 보강법" },
              daily_flow: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "월요일부터 일요일까지 요일별 한 줄 집중 예보 (총 7개 문자열)"
              }
            },
            required: ["summary", "score", "love_and_social", "wealth_and_job", "health_and_energy", "daily_flow"]
          },
          monthly: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "이번 달의 전체 행운 요약" },
              score: { type: Type.INTEGER, description: "이번 달 종합 지수 (0-100)" },
              key_theme: { type: Type.STRING, description: "이번 달을 관통하는 지배적인 대주제" },
              opportunities: { type: Type.STRING, description: "가장 적극적으로 노려야 할 절호의 우주 기회" },
              precautions: { type: Type.STRING, description: "가장 주의하고 조심해야 할 운명적 함정과 방어책" },
              weeks_flow: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "1주차부터 4주차까지의 주차별 간략 예보 (총 4개 문자열)"
              }
            },
            required: ["summary", "score", "key_theme", "opportunities", "precautions", "weeks_flow"]
          },
          yearly: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "올해의 전체 행운 요약" },
              score: { type: Type.INTEGER, description: "올해의 종합 지수 (0-100)" },
              grand_trend: { type: Type.STRING, description: "올해를 가로지르는 거시적 운명의 소용돌이와 변곡점" },
              wealth_flow: { type: Type.STRING, description: "올해의 재물 기운 축적 흐름과 투자/지출 전략" },
              career_path: { type: Type.STRING, description: "올해의 직업, 승진, 이직 및 비즈니스 성패 비결" },
              personal_growth: { type: Type.STRING, description: "올해 내면의 무한한 지적 성숙과 마음 수양 과제" }
            },
            required: ["summary", "score", "grand_trend", "wealth_flow", "career_path", "personal_growth"]
          }
        },
        required: ["today", "weekly", "monthly", "yearly"]
      };

      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const maxAttempts = 3;
      let attempts = 0;
      let finalResult = null;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: responseSchema,
              temperature: 0.15,
              maxOutputTokens: 8192,
            }
          });

          finalResult = JSON.parse(response.text!.trim());
          geminiCircuitBreaker.recordSuccess();
          if (finalResult?.today) {
            finalResult.today.score = deterministicTodayScore;
          }
          break;
        } catch (innerErr) {
          console.warn(`Horoscope attempt ${attempts} failed:`, innerErr);
          geminiCircuitBreaker.recordFailure(innerErr);
          if (attempts >= maxAttempts) throw innerErr;
          await sleep(2000 * attempts);
        }
      }

      res.json(finalResult);
    } catch (error: any) {
      console.error("Horoscope generation error:", error);
      geminiCircuitBreaker.recordFailure(error);
      res.status(500).json({ error: formatGeminiError(error) });
    }
  });

  // Dynamic OpenGraph Card Image Generator (SVG 1200x630) for KakaoTalk & Social Sharing
  app.get("/api/og", (req, res) => {
    const name = String(req.query.name || "인연사주").slice(0, 20);
    const elem = String(req.query.elem || "금").slice(0, 5);
    const animal = String(req.query.animal || "토끼").slice(0, 10);
    const role = String(req.query.role || "스파크 메이커").slice(0, 20);

    const elemColors: Record<string, { main: string; bg: string; badge: string }> = {
      "목": { main: "#3E7C4F", bg: "#132318", badge: "木 WOOD" },
      "화": { main: "#C24234", bg: "#2B1412", badge: "火 FIRE" },
      "토": { main: "#B07C3F", bg: "#281D12", badge: "土 EARTH" },
      "금": { main: "#EAB308", bg: "#2A2410", badge: "金 METAL" },
      "수": { main: "#3B82F6", bg: "#111C2E", badge: "水 WATER" }
    };

    const cfg = elemColors[elem] || elemColors["금"];

    const animalMap: Record<string, string> = {
      "쥐": "rat", "소": "ox", "호랑이": "tiger", "토끼": "rabbit",
      "용": "dragon", "뱀": "snake", "말": "horse", "양": "sheep",
      "원숭이": "monkey", "닭": "rooster", "개": "dog", "돼지": "pig",
      "rat": "rat", "ox": "ox", "tiger": "tiger", "rabbit": "rabbit",
      "dragon": "dragon", "snake": "snake", "horse": "horse", "sheep": "sheep",
      "monkey": "monkey", "rooster": "rooster", "dog": "dog", "pig": "pig"
    };
    const elemItemMap: Record<string, string> = {
      "목": "bowtie", "화": "sunglasses", "토": "scarf", "금": "glasses", "수": "headphones",
      "wood": "bowtie", "fire": "sunglasses", "earth": "scarf", "metal": "glasses", "water": "headphones"
    };
    const animalKey = animalMap[animal] || "rabbit";
    const itemKey = elemItemMap[elem] || "bowtie";
    const distPng = path.join(process.cwd(), "dist", "zodiac", `zodiac_${animalKey}_item_${itemKey}.png`);
    const publicPng = path.join(process.cwd(), "public", "zodiac", `zodiac_${animalKey}_item_${itemKey}.png`);
    const charPngPath = fs.existsSync(distPng) ? distPng : publicPng;
    let characterImageSvg = `
        <circle cx="920" cy="315" r="160" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" stroke-width="2" />
        <text x="920" y="300" fill="${cfg.main}" font-family="'Noto Serif KR', serif" font-size="64" font-weight="bold" text-anchor="middle">${elem}</text>
        <text x="920" y="360" fill="#F8FAFC" font-family="'Pretendard', sans-serif" font-size="24" text-anchor="middle">${animal}</text>
    `;
    if (fs.existsSync(charPngPath)) {
      const b64 = fs.readFileSync(charPngPath).toString("base64");
      characterImageSvg = `
        <circle cx="920" cy="315" r="170" fill="rgba(255,255,255,0.05)" stroke="${cfg.main}" stroke-width="2" />
        <image href="data:image/png;base64,${b64}" x="780" y="175" width="280" height="280" preserveAspectRatio="xMidYMid meet" />
      `;
    }

    const svg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0B0F17" />
            <stop offset="50%" stop-color="${cfg.bg}" />
            <stop offset="100%" stop-color="#070A0F" />
          </linearGradient>
          <radialGradient id="halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${cfg.main}" stop-opacity="0.35" />
            <stop offset="100%" stop-color="${cfg.main}" stop-opacity="0" />
          </radialGradient>
        </defs>

        <rect width="1200" height="630" fill="url(#bg)" />
        <circle cx="900" cy="315" r="380" fill="url(#halo)" />

        <rect x="60" y="60" width="1080" height="510" rx="24" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" />

        <rect x="100" y="100" width="50" height="50" rx="10" fill="#B91C1C" />
        <text x="125" y="135" fill="#FFFFFF" font-family="'Noto Serif KR', serif" font-size="26" font-weight="bold" text-anchor="middle">命</text>
        <text x="165" y="135" fill="#F8FAFC" font-family="'Pretendard', sans-serif" font-size="24" font-weight="bold" letter-spacing="1">인연사주 · INYEON SAJU</text>

        <rect x="100" y="210" width="160" height="42" rx="12" fill="rgba(255,255,255,0.08)" stroke="${cfg.main}" stroke-width="1.5" />
        <text x="180" y="238" fill="${cfg.main}" font-family="'Pretendard', sans-serif" font-size="18" font-weight="bold" text-anchor="middle">${cfg.badge}</text>

        <text x="100" y="320" fill="#FFFFFF" font-family="'Noto Serif KR', serif" font-size="52" font-weight="bold">${name} 님의 소울 카드</text>
        
        <text x="100" y="390" fill="#94A3B8" font-family="'Pretendard', sans-serif" font-size="28" font-weight="500">
          수호 영수: <tspan fill="#F8FAFC" font-weight="bold">${animal}</tspan>  |  시그니처 역할: <tspan fill="${cfg.main}" font-weight="bold">${role}</tspan>
        </text>

        <text x="100" y="470" fill="#CBD5E1" font-family="'Noto Serif KR', serif" font-size="22" font-style="italic">
          "${elem} 기운을 타고난 ${animal}의 기상으로 모임의 중심을 지킵니다"
        </text>

        ${characterImageSvg}
      </svg>
    `.trim();

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=43200");
    res.send(svg);
  });

  // Custom global error handler to ensure JSON responses for API errors
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("[SERVER GLOBAL ERROR]:", err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(err.status || 500).json({
      error: err.message || "서버 내부 오류가 발생했습니다."
    });
  });

  // WebP content negotiation & static cache control for mobile Safari & KakaoTalk in-app browser
  const staticCacheOptions = {
    index: false,
    maxAge: "30d",
    etag: true,
    lastModified: true,
    setHeaders: (res: any, filePath: string) => {
      if (/\.html$/i.test(filePath)) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      } else if (/\.(webp|png|jpe?g|svg|ico|woff2?|ttf|js|css)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
      }
    }
  };

  // Content negotiation for /zodiac/*.png requests -> transparently serve *.webp if client supports it
  app.get("/zodiac/:file.png", (req, res, next) => {
    const accept = (req.headers["accept"] as string) || "";
    if (accept.includes("image/webp")) {
      const distWebp = path.join(process.cwd(), "dist", "zodiac", `${req.params.file}.webp`);
      const publicWebp = path.join(process.cwd(), "public", "zodiac", `${req.params.file}.webp`);
      const webpPath = fs.existsSync(distWebp) ? distWebp : publicWebp;
      if (fs.existsSync(webpPath)) {
        res.setHeader("Content-Type", "image/webp");
        res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
        res.setHeader("Vary", "Accept");
        return res.sendFile(webpPath);
      }
    }
    next();
  });

  if (process.env.NODE_ENV !== "production") {
    app.use(express.static(path.resolve(process.cwd(), "public"), staticCacheOptions));
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, staticCacheOptions));
    app.get("*", (req, res) => {
      try {
        const indexPath = path.join(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          let html = fs.readFileSync(indexPath, "utf8");
          const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
          const host = req.get("host");
          const baseUrl = `${protocol}://${host}`;
          html = html.replace(/%BASE_URL%/g, baseUrl);

          // Dynamic OG meta tag injection for KakaoTalk & Social Scrapers
          if (req.query.name) {
            const qName = String(req.query.name);
            const qElem = String(req.query.elem || "금");
            const qAnimal = String(req.query.animal || "토끼");
            const qRole = String(req.query.role || "스파크 메이커");
            const ogImgUrl = `${baseUrl}/api/og?name=${encodeURIComponent(qName)}&elem=${encodeURIComponent(qElem)}&animal=${encodeURIComponent(qAnimal)}&role=${encodeURIComponent(qRole)}`;
            const ogTitle = `${qName} 님의 인연사주 소울 카드`;
            const ogDesc = `${qElem} 기운을 품은 ${qAnimal}의 기상 · ${qRole}. 우리들의 궁합과 케미를 확인해 보세요!`;

            html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${ogTitle}"`);
            html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${ogDesc}"`);
            html = html.replace(/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${ogImgUrl}"`);
            html = html.replace(/<meta property="twitter:title" content="[^"]*"/, `<meta property="twitter:title" content="${ogTitle}"`);
            html = html.replace(/<meta property="twitter:description" content="[^"]*"/, `<meta property="twitter:description" content="${ogDesc}"`);
            html = html.replace(/<meta property="twitter:image" content="[^"]*"/, `<meta property="twitter:image" content="${ogImgUrl}"`);
          }

          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
          res.send(html);
        } else {
          res.status(404).send("Not found");
        }
      } catch (err) {
        console.error("Error serving index.html:", err);
        res.status(500).send("Internal server error");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    try {
      const ai = getGeminiClient();
      const models = await ai.models.list();
      console.log("AVAILABLE MODELS:", JSON.stringify(models, null, 2));
    } catch (e) {
      console.error("FAILED TO LIST MODELS:", e);
    }
  });
}

startServer();
