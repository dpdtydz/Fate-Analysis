import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "firebase/firestore";

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
    
    if (email?.toLowerCase() === "lhs41977@gmail.com") {
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
   - 내담자가 읽고 "아, 내가 지금 당장 회사에서 이렇게 행동하고, 이런 인간을 손절하고, 돈을 이렇게 묶어야겠구나!"라고 무릎을 탁 칠 만큼 실전적이고 직설적인 3대 행동 강령(DO)과 치명적 지뢰밭(DON'T)을 명쾌하게 처방하십시오.
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

  app.use(express.json());

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

  // Reusable helper function to generate personal Saju & MBTI analysis using Gemini 3.5 Flash
  async function generatePersonalAnalysisForMember(member: any): Promise<any> {
    const ai = getGeminiClient();
    const zodiac = getWesternZodiac(member.birth_date);
    
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
        ohaeng_count: ohaengCountText,
        sipseong_strength: sipseongStrengthText,
        ming_gong_stars: mingGongStars,
        ming_gong_ganzi: mingGongGanzhi
      }
    };

    const prompt = `
${FLUENT_KOREAN_SYSTEM_GUIDELINE}

당신은 대한민국에서 가장 영험하고 통찰력 깊은 사주명리학 대가이자 동서양 점성학(자미두수·황도12궁), 그리고 현대 심리학적 분석(MBTI)의 대가입니다.
상대방의 사주원국과 명반을 펼쳐놓고 마주 앉아, 상대방이 살아오며 남몰래 삼켰던 눈물과 갈망, 겉으로 보이는 모습과 속에서 실제로 움직이는 마음의 이중성, 그리고 돈과 일, 사랑에서 벌어지는 구체적인 현실 장면들을 **소름 돋게 정확하고 술술 읽히는 입체적 인생 드라마 서사**로 풀어내십시오.

## 대상자 핵심 정보:
${JSON.stringify(enrichedMemberInfo, null, 2)}

## 핵심 작성 원칙 (절대적 기준):
1. **타이틀 / 한 줄 직관적 비유 (Metaphor):**
   - 교과서적 수식어(예: "성실하고 온화한 사람")는 100% 금지합니다.
   - 첫 문장만 읽어도 무릎을 탁 치게 만드는 감각적인 비유를 제시하십시오. (예: "센 불에 빠르게 구워 낸, 첫 입부터 강한 음식입니다.", "바위틈을 뚫고 솟아난 소나무처럼 겉은 꼿꼿한 선비이나 속은 타협 없는 칼날입니다.")
2. **겉과 속의 이중주 (사주 천간/일간/명궁 vs 지지/지장간/신궁의 입체 해설):**
   - **겉(첫인상과 행동):** 걸음걸이, 눈매, 말투, 결정 속도, 가만히 있어도 뿜어져 나오는 인상 ("생각보다 몸이 먼저 나가고, 하고 싶은 일이 생기면 준비가 다 되기 전에 이미 시작해 놓습니다").
   - **속(내면과 방어기제):** 혼자 있을 때 드는 생각, 무의식적 불안, 최악의 경우를 먼저 계산하는 버릇, 남몰래 지고 있는 짐 ("힘들다는 말을 잘 하지 않고 혼자 버티다가 한계에 닿아서야 티가 납니다").
   - **교차 통찰:** "이 둘을 겹쳐 보면 사람이 보입니다. 남들은 적극적이고 거침없는 사람으로 보지만, 실제로는 혼자 감당하는 데 익숙해서 힘들다는 말을 마지막까지 꺼내지 않는 사람입니다."
3. **재물과 돈의 실전 장면:**
   - 돈이 실제로 벌리고 불어나는 구체적 장면(직장 실무, 전문 기술, 온라인/해외, 비대면 등)을 짚으십시오.
   - 돈이 새어 나가는 구멍(피로를 참다가 병원비나 홧김 보상 비용으로 빠져나가는 자리 등)을 정확히 명시하십시오.
4. **직업과 성취:**
   - 어떤 험지나 문제 앞에서 존재감이 드러나는지, 일을 대충 하는 태도에 얼마나 예민한지 묘사하고, 잘 맞는 구체적 업종/직무를 제시하십시오.
5. **연애와 인연의 현실 장면:**
   - 어디서 만나는지 (직장 협업, 취미, 활동 등), 왜 부딪치는지 (결정 속도 차이, 감정 표현 방식), 오래 가려면 무엇을 합의해야 하는지 명시하십시오.
6. **건강과 쉼터:**
   - 지칠 때 신호가 가장 먼저 오는 부위(장/소화, 어깨/관절, 수면 등)와 진짜 충전이 일어나는 회복 방식을 짚으십시오.
7. **지금 당장 할 일을 하나만 고른다면:**
   - 뜬구름 잡는 다짐이 아닌, 오늘 당장 취해야 할 원 포인트 돌파구를 단도직입적으로 처방하십시오.
8. **문체 규칙:**
   - 모호한 추측형(~일 수도 있습니다) 대신, 확신에 찬 단호한 어조(~합니다, ~입니다, ~겁니다, ~않습니다)를 유지하십시오.
   - 모든 MBTI 코드는 대문자 영문(ENFP, INTJ 등)으로만 표기하십시오.
   - 어려운 한자어나 외래 점성술 용어는 쓰지 말고 쉬운 한글로 풀어 쓰십시오.
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
        wealth: {
          type: Type.OBJECT,
          properties: {
            earning: { type: Type.STRING, description: "The realistic scenes where money is made (practical skills, salary, online, etc.)" },
            leak: { type: Type.STRING, description: "Where money leaks out (fatigue, secret burdens, sudden spending, etc.)" }
          },
          required: ["earning", "leak"]
        },
        career: {
          type: Type.OBJECT,
          properties: {
            strength: { type: Type.STRING, description: "Work style, intolerance for laziness, proving talent in difficult competitions" },
            recommended_fields: { type: Type.STRING, description: "Specific industries and job titles that suit this chart" }
          },
          required: ["strength", "recommended_fields"]
        },
        love: {
          type: Type.OBJECT,
          properties: {
            meeting_scene: { type: Type.STRING, description: "Where they actually meet their partner (colleagues, working together, events, etc.)" },
            friction_point: { type: Type.STRING, description: "Why they clash (decision speed, communication) and key to long-lasting relationship" }
          },
          required: ["meeting_scene", "friction_point"]
        },
        health: {
          type: Type.OBJECT,
          properties: {
            signal: { type: Type.STRING, description: "The first organ/body area that gives a warning signal when exhausted" },
            recovery: { type: Type.STRING, description: "The exact lifestyle habit and environment needed for real recovery" }
          },
          required: ["signal", "recovery"]
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
        }
      },
      required: ["headline", "character_desc", "duality", "wealth", "career", "love", "health", "one_action", "four_areas", "keywords"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.15,
      }
    });

    return JSON.parse(response.text!.trim());
  }


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

    let saju1to2 = getHashScore(id1, id2, 11, 70, 94);
    let saju2to1 = getHashScore(id1, id2, 33, 70, 94);
    let sajuLabel = "온화하고 편안한 상생 조합";
    let sajuDesc = "";

    if (isGeneratingSupport) {
      saju1to2 = getHashScore(id1, id2, 17, 85, 98);
      saju2to1 = getHashScore(id1, id2, 41, 80, 95);
      sajuLabel = "오행상생의 창조적 파트너";
      sajuDesc = `${nick1}님은 ${nick2}님에게 ${saju1to2}점, ${nick2}님은 ${nick1}님에게 ${saju2to1}점. ${g1}의 기운이 ${g2}을 부드럽게 북돋아 주어, ${nick1}님의 발상과 추진력이 ${nick2}님의 결실로 자연스럽게 연결되는 훌륭한 상생 궁합입니다.`;
    } else if (isReceivingSupport) {
      saju1to2 = getHashScore(id1, id2, 23, 80, 95);
      saju2to1 = getHashScore(id1, id2, 59, 85, 98);
      sajuLabel = "상생과 든든한 조력 기류";
      sajuDesc = `${nick1}님은 ${nick2}님에게 ${saju1to2}점, ${nick2}님은 ${nick1}님에게 ${saju2to1}점. ${g2}의 포근한 기운이 ${g1}을 든든하게 받쳐주어, 서로 깊은 정서적 안정감과 굳건한 신뢰를 형성하는 관계입니다.`;
    } else if (elem1 === elem2) {
      saju1to2 = getHashScore(id1, id2, 15, 78, 93);
      saju2to1 = getHashScore(id1, id2, 45, 78, 93);
      sajuLabel = "거울을 보듯 통하는 소울 조합";
      sajuDesc = `${nick1}님은 ${nick2}님에게 ${saju1to2}점, ${nick2}님은 ${nick1}님에게 ${saju2to1}점. 서로 같은 '${elem1}'의 오행 본질을 지녀 말하지 않아도 서로의 생각과 감정을 직관적으로 이해하는 소울메이트 기운입니다.`;
    } else if (isClash) {
      saju1to2 = getHashScore(id1, id2, 19, 65, 82);
      saju2to1 = getHashScore(id1, id2, 37, 65, 82);
      sajuLabel = "긴장 속에서 꽃피는 혁신 조합";
      sajuDesc = `${nick1}님은 ${nick2}님에게 ${saju1to2}점, ${nick2}님은 ${nick1}님에게 ${saju2to1}점. ${g1}과 ${g2}의 기운이 긴장감 있는 텐션을 형성하나, 서로의 사각지대를 예리하게 보완해 주는 강력한 발전적 계기가 됩니다.`;
    } else {
      saju1to2 = getHashScore(id1, id2, 21, 75, 89);
      saju2to1 = getHashScore(id1, id2, 51, 75, 89);
      sajuLabel = "온화하고 편안한 상생 조합";
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
    const ziwei1to2 = getHashScore(id1, id2, 44, 72, 94);
    const ziwei2to1 = getHashScore(id1, id2, 88, 72, 94);
    const ziweiDesc = `${nick1}님은 ${nick2}님에게 ${ziwei1to2}점, ${nick2}님은 ${nick1}님에게 ${ziwei2to1}점. ${nick1}님의 명궁 기저에 깃든 ${zStar1.name}(${zStar1.desc})과 ${nick2}님의 ${zStar2.name}(${zStar2.desc})이 서로의 기량을 돋보이게 하는 조화로운 별자리 인연입니다.`;

    // MBTI
    const mbti1 = (m1.mbti || "").trim().toUpperCase();
    const mbti2 = (m2.mbti || "").trim().toUpperCase();
    let mbti1to2 = 78;
    let mbti2to1 = 78;
    let mbtiDesc = "";
    if (mbti1.length === 4 && mbti2.length === 4) {
      let matchCount = 0;
      for (let k = 0; k < 4; k++) {
        if (mbti1[k] === mbti2[k]) matchCount++;
      }
      mbti1to2 = 70 + matchCount * 6 + getHashScore(id1, id2, 9, 0, 5);
      mbti2to1 = 70 + matchCount * 6 + getHashScore(id1, id2, 19, 0, 5);
      mbtiDesc = `${nick1}님은 ${nick2}님에게 ${mbti1to2}점, ${nick2}님은 ${nick1}님에게 ${mbti2to1}점. ${mbti1} 성향의 ${nick1}님과 ${mbti2} 성향의 ${nick2}님이 만나 일상의 의사소통과 협업에서 서로의 시각을 넓혀주는 이상적인 성향 조화를 보여줍니다.`;
    } else {
      mbti1to2 = getHashScore(id1, id2, 12, 72, 86);
      mbti2to1 = getHashScore(id1, id2, 24, 72, 86);
      mbtiDesc = `${nick1}님은 ${nick2}님에게 ${mbti1to2}점, ${nick2}님은 ${nick1}님에게 ${mbti2to1}점. 서로의 타고난 개성과 라이프스타일을 편견 없이 수용하며 자연스럽게 녹아드는 유연한 관계입니다.`;
    }

    // Zodiac
    const z1 = getWesternZodiac(m1.birth_date);
    const z2 = getWesternZodiac(m2.birth_date);
    const zName1 = typeof z1 === "object" && (z1 as any)?.name ? (z1 as any).name : String(z1 || "별자리");
    const zName2 = typeof z2 === "object" && (z2 as any)?.name ? (z2 as any).name : String(z2 || "별자리");
    const zodiac1to2 = getHashScore(id1, id2, 29, 72, 95);
    const zodiac2to1 = getHashScore(id1, id2, 69, 72, 95);
    const zodiacDesc = `${nick1}님은 ${nick2}님에게 ${zodiac1to2}점, ${nick2}님은 ${nick1}님에게 ${zodiac2to1}점. ${zName1}의 감성과 ${zName2}의 에너지가 만나 새로운 활력을 일으키며 대화의 깊이를 더해주는 긍정적 성좌 조합입니다.`;

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

  app.post("/api/analyze", async (req, res) => {

    try {
      let { room_title, members } = req.body;
      if (!members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ error: "분석할 멤버 정보가 없습니다." });
      }

      // Safeguard: Limit the maximum number of members to analyze to 16 to prevent token overflow and Gemini response timeout
      if (members.length > 16) {
        members = members.slice(0, 16);
      }

      const ai = getGeminiClient();
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." });
      }

      // Step 1: Ensure EVERY member has a personal_analysis (generate lazily if missing in parallel using gemini-3.5-flash)
      const personalMap: Record<string, any> = {};
      
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
            ohaeng_count: ohaengCountText,
            sipseong_strength: sipseongStrengthText,
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

## 핵심 가이드라인 (스토리텔링 극대화, 입체적 인간관계 통찰):
1. **생생한 현실 시나리오 기반의 1:1 관계 스토리텔링:**
   - "서로 상극이라 안 맞습니다" 같은 무미건조한 판정은 엄격히 배제하십시오.
   - "처음에는 서로의 속도를 이해하기 어려워 A님이 B님의 신중함을 답답해하거나, B님이 A님의 추진력에 깜짝 놀라 뒤로 물러설 수 있습니다. 그러나 대화가 깊어지는 순간 서로가 자신에게 없는 가장 결정적인 퍼즐 조각임을 깨닫게 되는 반전의 앙상블입니다."와 같이 살아 숨 쉬는 서사로 묘사하십시오.
   - 함께 식사를 하거나, 여행을 떠나거나, 공동의 프로젝트를 할 때 벌어질 수 있는 구체적인 케미스트리를 짚어주십시오.
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
              temperature: 0.15,
            }
          });

          const text = response.text!.trim();
          const parsed = JSON.parse(text);

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
          if (attempts >= maxAttempts) throw innerErr;
          await sleep(2000 * attempts);
        }
      }

      return res.json(finalResult);
    } catch (error: any) {
      console.error("Analysis generation error:", error);
      res.status(500).json({ error: formatGeminiError(error) });
    }
  });

  app.post("/api/horoscope", async (req, res) => {
    try {
      const { member } = req.body;
      if (!member) {
        return res.status(400).json({ error: "멤버 정보가 누락되었습니다." });
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

당신은 대한민국 최고의 사주명리학 대가이자 동서양 점성학, 자미두수, 그리고 현대 심리학적 성향 분석(MBTI)의 대가입니다.
사용자 '${member.nickname}'님을 위해 지극히 현실적이고 구체적이며, 일상에서 즉시 와닿고 행동에 옮길 수 있는 최고 수준의 오늘의운세, 주간운세, 월간운세, 연간운세 해설서를 일괄 작성해 주십시오.

## 대상자 핵심 정보:
- 이름/별명: ${member.nickname}
- 성별: ${member.gender === "male" ? "남성" : "여성"}
- 생년월일시: ${member.birth_date} ${member.birth_time || "출생시모름"}
- 현대 성향심리: ${member.mbti || "미입력"}
- 서양 황도 백자리: ${zodiac}
- 명리학 일주: ${dayPillarDetail} (${dmGan}일간, 오행 기운: ${dmElem})
- 오행 구성 비율: ${member.saju?.ohaeng_count ? JSON.stringify(member.saju.ohaeng_count) : "기본 구성"}
- 오늘의 확정된 천간지지 일진 점수: ${deterministicTodayScore}점 (today.score 필드에 반드시 ${deterministicTodayScore}를 기재하십시오)

## 작성 지침 (현실성, 실전 개운 처방, fluent-korean 및 퀄리티 극대화):
1. **fluent-korean 원칙 100% 준수 (자연스러운 한국어, 조사/어미 완전 유지, 번역투 배제):**
   - 모든 문장은 온전한 주어-서술어 호응을 갖추고, 명사형 종결이나 단답식 나열을 금하며 정중하고 자연스러운 한국어 문장으로 서술하십시오.
2. **극도의 현실성과 즉시 와닿는 조언 (추상적인 이론이나 미사여구 중심의 가벼운 해설 전면 금지):**
   - 사주 일주론, 별자리 기류, MBTI 성향을 깊이 있게 융합하여 서술하되, 절대 "금수 기운이 맑아 지혜가 솟구칩니다" 처럼 추상적이고 모호하게 얼버무리지 마십시오.
   - "천생연분을 만날 수 있는 운명적인 흐름이 강하니 오늘 미팅이나 소개팅이 있다면 절대 미루지 말고 가십시오", "오후 2시경 약속 장소로 향하는 도중에 예상치 못한 호감을 지닌 인연과 대화를 나눌 기회가 생깁니다" 처럼 사용자가 즉시 체감하고 실행할 수 있는 현실적이고 구체적인 시나리오와 대처 행동을 가이드하십시오.
3. **연애, 연인, 소셜 파트너십의 비중 대폭 강화:**
   - 만남, 소개팅, 썸, 연애, 부부/연인 관계의 로맨틱한 기류를 다채롭게 서술하고, 대화 스타일이나 행운의 처방 등을 행동 중심으로 작성하십시오.
4. **적정 분량 및 가독성 최적화 지침 (초필수):**
   - 오늘의 전체적인 운세 해설('today.summary')은 사주 일주론, 황도 백자리, MBTI 성향을 한데 녹여내어, 오늘 마주할 운명학적 기류 분석, 상황적 시나리오, 그리고 직접적인 개운 행동 지침까지 유기적으로 연결된 **3개의 문단 (줄바꿈 \n\n 2번 사용, 공백 포함 350~500자 내외)**으로 풍성하게 작성해 주십시오.
   - 주간, 월간, 연간의 세부 분석 필드들은 각각 **단 하나의 알차고 풍성한 문단 (공백 포함 150~250자 내외)**으로 명확하고 구체적으로 작성하십시오. 과도한 중복 생성이나 너무 길어져서 발생하는 응답 시간 초과와 JSON 짤림 문제를 예방하기 위한 절대 기준입니다.
5. **구체적인 개운(開運) 처방전:**
   - 행운의 아이템(코디 색상, 숫자, 방향, 최고의 시간대)을 명확하게 명시하십시오.
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
            }
          });

          finalResult = JSON.parse(response.text!.trim());
          if (finalResult?.today) {
            finalResult.today.score = deterministicTodayScore;
          }
          break;
        } catch (innerErr) {
          console.warn(`Horoscope attempt ${attempts} failed:`, innerErr);
          if (attempts >= maxAttempts) throw innerErr;
          await sleep(2000 * attempts);
        }
      }

      res.json(finalResult);
    } catch (error: any) {
      console.error("Horoscope generation error:", error);
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
