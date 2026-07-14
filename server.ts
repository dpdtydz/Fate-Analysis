import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

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
  const PORT = 3000;

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

  app.get("/api/list-models", async (req, res) => {
    try {
      const ai = getGeminiClient();
      const models = await ai.models.list();
      res.json(models);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.post("/api/analyze", async (req, res) => {

    try {
      const { room_title, members } = req.body;
      if (!members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ error: "분석할 멤버 정보가 없습니다." });
      }

      const ai = getGeminiClient();
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." });
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
당신은 대한민국 최고의 사주명리학 대가이자 동서양 점성학, 자미두수 수리학, 그리고 현대 심리학적 분석(MBTI)의 대가입니다.
사용자들이 모인 모임방의 멤버 데이터를 기반으로, 지극히 현실성 있고 공신력 있으며 일관성 있는 융합 총합운세 감정서(동서양 4대 영역 통합 우주 평생 감정서)를 작성하십시오.

## 핵심 가이드라인 (공신력, 현실성 및 표기 형식 극대화):
1. **MBTI 코드 영문 대문자 표기 절대 원칙 (초필수):** 
   - 모든 MBTI 코드(예: ENFP, INFJ, ESTP, INTJ 등)는 반드시 영문 대문자로만 표기해야 합니다.
   - **어떤 상황에서도 한글 음차(예: '이엔에프피', '인프피', '인티제', '엣티제', '엔에프', '엔에프피' 등)로 한글로 풀어 쓰는 행위를 절대 금지합니다.** 텍스트의 모든 부분에서 MBTI는 무조건 'ENFP', 'INFJ' 등 4글자의 영문 대문자로 직접 작성하십시오.
   - 본질(essence), 재능(talent), 흐름(flow), 생활기운(fortune) 및 요약문(character_desc) 등 결과물의 모든 문자열 속에서 영어 알파벳 대문자로 고정 표기하십시오.

2. **동서양 4대 영역의 완벽한 '입체적 융합' (단순 나열/열거 전면 금지):**
   - 각 멤버의 감정서는 아래 4가지 기운을 내재하고 있습니다:
     1) 동양 사주명리 (일간의 오행, 일주의 성정, 십성 비율, 신살/귀인 등)
     2) 서양 황도 12궁 별자리 (생일 기준 별자리의 지배성 및 기운)
     3) 천상 자미두수 (명궁 위치, 명궁에 배치된 주요 주성 및 길성/살성 기운)
     4) 현대 성향심리 MBTI (E/I, S/N, T/F, J/P 코드 성향)
   - **[매우 중요] 단순 나열식 문단 작성 절대 금지:** 
     - "사주는 이렇습니다. 별자리는 이렇고, 자미두수는 이렇고, MBTI는 이렇습니다"와 같이 단순히 항목별로 나누어 기계적으로 나열하지 마시고, 이 네 요소를 하나의 통합된 흐름으로 유기적이고 설득력 있게 엮어내어 들려주십시오.

3. **일관성 보장:**
   - 동일한 인물 정보에 대해서는 늘 일관되고 깊이 있는 성정과 분석 결과를 유지하십시오.

4. **형식:** 반드시 지정된 JSON Schema 구조를 완벽히 준수하는 JSON 형식으로만 응답해야 합니다.

5. **멤버 간 1:1 개별 인연 궁합 분석 지침 (자미두수, MBTI, 별자리, 사주 및 총합) [극도로 중요]:**
   - 입력받은 전체 멤버 수가 N명일 때, 가능한 모든 1:1 쌍의 조합의 개수는 정확히 N * (N - 1) / 2 개입니다.
   - **반드시 이 모든 N * (N - 1) / 2 개의 모든 조합에 대한 궁합 데이터를 하나도 빠짐없이 'pairs' 배열에 포함시켜야 합니다.** 절대로 임의로 일부 최고/최저 궁합만 선별하여 출력하지 마십시오. 모든 멤버가 서로서로 1:1 궁합 분석을 가질 수 있도록 전수조사하여 배열에 담으십시오.
   - 각 영역(saju, ziwei, mbti, zodiac) 및 종합 총합(combined/pairs) 별로:
     - 1번 멤버가 2번 멤버에게 주는 궁합 점수(score_1_to_2)와 2번 멤버가 1번 멤버에게 주는 궁합 점수(score_2_to_1)를 다르고 주관적으로 부여하십시오.
     - 오행의 생극제화, 십이주성, 성향 궁합 등 학술적 근거에 입각하여 상세히 설명(description)을 작성하십시오.
     - **[초필수 표기 규칙]** 각 하위 궁합 영역(saju, ziwei, mbti, zodiac)의 설명 텍스트(description)의 첫 문장 또는 서두에 반드시 "A님은 B님에게 X점, B님은 A님에게 Y점" 형식으로 조사를 붙여 문장으로 명확히 표기하십시오.
       - 예시: "김도화님은 혁님에게 90점, 혁님은 김도화님에게 34점" 과 같이 정확히 '님은', '님에게' 라는 예의 바른 호칭 조사를 사용하여 한글 문장으로 명확히 표현해 주어야 합니다. "김도화 -> 혁 90점" 같은 단순 화살표나 기호는 절대로 사용하지 마십시오.
   - 4대 분야(saju, ziwei, mbti, zodiac)를 따로 깊이 분석한 뒤, 최종적으로 이를 총합하여 예술적이고 아름다운 종합 인연 지수(score), 시너지 타이틀(label), 그리고 전체 종합 궁합 해설(description)을 작성하십시오.

6. **어려운 한자(漢字) 노출 절대 금지 및 순수 한글 표기 원칙 (초필수):**
   - 사주명리학, 자미두수 등의 어려운 학술용어 및 오행/천간/지지 등의 한자(예: 辛金, 亥水, 命宮, 木, 金 등)는 **절대로** 한자로 직접 표기하지 마십시오.
   - 모든 한자 용어는 독자가 직관적이고 편안하게 읽을 수 있도록 **100% 쉬운 한글(예: 신금, 해수, 명궁, 목, 금, 일간 등)로만 표기**하여 작성하십시오.
   - 예시: "辛金 일간이 지지에 亥水 상관을 두어" -> "신금 일간이 지지에 해수 상관을 두어", "木 기운" -> "목 기운", "金 기운" -> "금 기운", "命宮" -> "명궁".

7. **로맨틱/연인 표현 전면 배제 및 소셜/동료 용어 사용 원칙 (초필수):**
   - 사용자들은 연인이 아닌 일반 친목 모임, 비즈니스, 동호회, 스터디 등 다양한 사회적 관계일 수 있습니다.
   - **따라서 '커플', '연인', '사랑', '부부', '남녀 관계' 등의 로맨틱하거나 애정 관계를 암시하는 단어는 절대로 사용하지 마십시오.**
   - 대신 '메이트', '파트너', '조합', '단짝', '동료', '인연', '멤버', '소울메이트', '인생의 동반 기류' 등의 중립적이고 센스 있는 소셜/친목 지향적 호칭과 관계 표현을 사용하십시오. (예: "시너지 커플" 대신 "시너지 메이트" 또는 "찰떡 시너지 조합")

8. **입력 데이터의 고유 식별자(member_id) 원본 유지 절대 원칙 (초필수):**
   - 입력 데이터에 제공된 각 멤버의 고유 식별자인 'member_id' 값을 절대로 가공하거나 임의의 가상 ID(예: "member_1", "1", "2" 등)로 변조하지 마십시오.
   - 출력 JSON 스키마의 'personal' 내 'member_id', 그리고 'pairs' 내 'member_id_1'과 'member_id_2'는 무조건 입력 데이터의 'member_id' 값과 완벽하게 일치해야 합니다.

9. **명품 심층 분석 및 실제 처방전 대량 기술 원칙 (최고 품질 지향 초필수):**
   - 모든 개인 및 궁합 분석 필드('essence', 'talent', 'flow', 'fortune', 'character_desc', 'description', 그리고 각 'saju/ziwei/mbti/zodiac'의 'description' 등)는 **절대로 짧거나 대강 끝내지 마시고, 최소 3~5개의 완성도 높고 격조 있는 긴 문장(공백 포함 250~450자 내외)으로 세밀하게 작성**하여 읽을거리가 아주 풍성한 명품 보고서가 되도록 해 주십시오.
   - 명리학적 천간/지지 오행 분석과 현대 성향심리(MBTI) 가치관을 유기적으로 결합하여, 타고난 기질과 현실 성격의 시너지를 완벽한 한글 서술로 서술하십시오.
   - 1:1 인연 궁합의 각 영역별 해설 및 처방에는 단순 점수 나열에 그치지 않고, 명확한 '갈등 예측 구간(예: 금목상쟁의 의견 대립)'과 이를 해소하기 위한 '구체적인 오행 상생 솔루션 및 처방전(예: 물 기운 매개 요법, 티타임 회동, 부드러운 화법 전환 수칙)'을 설득력 넘치고 생생하게 담아 귀하의 학술적 공신력을 뿜어내십시오.

## 모임 이름: ${room_title || "친목모임"}

## 멤버들의 고도로 구조화된 동서양 4대 분석 데이터:
${JSON.stringify(enrichedMembersInfo, null, 2)}
`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          personal: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                member_id: { type: Type.STRING, description: "The unique ID of the member from the input data" },
                character_desc: { type: Type.STRING, description: "A witty, entertaining summary description of the member's character/personality" },
                four_areas: {
                  type: Type.OBJECT,
                  properties: {
                    essence: { type: Type.STRING, description: "Deep analysis of their essence (본질)" },
                    talent: { type: Type.STRING, description: "Analysis of their talent and potential (재능)" },
                    flow: { type: Type.STRING, description: "Analysis of their fortune/flow (흐름)" },
                    fortune: { type: Type.STRING, description: "Daily life energy analysis (생활기운)" }
                  },
                  required: ["essence", "talent", "flow", "fortune"]
                },
                keywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "2 custom witty personality keywords"
                }
              },
              required: ["member_id", "character_desc", "four_areas", "keywords"]
            }
          },
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
        required: ["personal", "pairs", "group"]
      };

      let attempts = 0;
      const maxAttempts = 3;
      let finalResult = null;

      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

      const modelsToTry = [
        "gemini-3.5-flash",
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

          // Apply self-healing correction to personal array
          if (Array.isArray(parsed.personal)) {
            parsed.personal.forEach((item: any, idx: number) => {
              if (item) {
                item.member_id = mapToValidId(item.member_id, idx);
              }
            });
          }

          // Apply self-healing correction to pairs array
          if (Array.isArray(parsed.pairs)) {
            parsed.pairs.forEach((pair: any) => {
              if (pair) {
                pair.member_id_1 = mapToValidId(pair.member_id_1);
                pair.member_id_2 = mapToValidId(pair.member_id_2);
              }
            });
          }

          // Convert personal array to map structure expected by frontend
          const personalMap: Record<string, any> = {};
          if (Array.isArray(parsed.personal)) {
            parsed.personal.forEach((item: any) => {
              if (item && item.member_id) {
                personalMap[item.member_id] = {
                  character_desc: item.character_desc,
                  four_areas: item.four_areas,
                  keywords: item.keywords,
                };
              }
            });
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
      res.status(500).json({ error: error.message || "오류가 발생했습니다." });
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

## 작성 지침 (현실성, 실전 개운 처방 및 퀄리티 극대화):
1. **극도의 현실성과 즉시 와닿는 조언 (추상적인 이론이나 미사여구 중심의 가벼운 해설 전면 금지):**
   - 사주 일주론, 별자리 기류, MBTI 성향을 깊이 있게 융합하여 서술하되, 절대 "금수 기운이 맑아 지혜가 솟구칩니다" 처럼 추상적이고 모호하게 얼버무리지 마십시오.
   - "천생연분을 만날 수 있는 운명적인 흐름이 강하니 오늘 미팅이나 소개팅이 있다면 절대 미루지 말고 가십시오", "오후 2시경 약속 장소로 향하는 도중에 예상치 못한 호감을 지닌 인연과 대화를 나눌 기회가 생깁니다", "회의나 미팅 시 평소보다 경청의 비중을 높이고 상대의 사소한 요구에 귀기율이면 막혔던 계약이 단숨에 풀립니다" 처럼 **사용자가 즉각 실감하고 행동으로 실행할 수 있는 현실적이고 구체적인 상황과 대처법**을 아낌없이 기재하십시오.
2. **연애, 연인, 소셜 파트너십의 비중 대폭 강화:**
   - 만남, 소개팅, 썸, 연애, 부부/연인 관계의 로맨틱한 운명의 흐름과 애정운을 아주 흥미진진하고 구체적으로 다루십시오. (예: 오늘 호감을 사기 좋은 구체적인 옷 스타일, 인연을 만날 최적의 명당 장소, 대화를 매끄럽게 이끄는 구체적인 멘트 꿀팁 등)
   - 아울러, 회사 동료나 상사와의 갈등 해결, 비즈니스 영업 등 일상의 인간관계망을 승리로 이끌 행동 가이드를 실천 가능한 언어로 적어주십시오.
3. **풍성하고 신뢰성 높은 대량의 구체적 분량 (핵심 지침):**
   - 오늘의 운세 해설('today.summary'), 주간의 각 영역, 월간 및 연간의 각 영역은 줄바꿈(\\n\\n)을 2번 사용하여 **정확히 3개 문단(최소 6~8문장 이상, 400자 이상)**의 고품격 장문으로 작성해 주십시오.
   - 'today.summary'는 별도의 세부 항목 분할 없이 사주 일주론, 황도 백자리, MBTI 성향을 한데 녹여내어, 오늘 마주할 운명학적 기류 분석, 상황적 시나리오(연애/대인관계 등), 그리고 직접적인 개운 행동 지침까지 유기적으로 연결된 하나의 완벽한 스토리로 만들어 주십시오.
   - 각 영역의 문단 구조:
     - 1번째 문단: 명리/별자리/MBTI가 융합된 운명학적 기류 분석과 내면의 변화
     - 2번째 문단: 마주치게 될 구체적인 상황적 시나리오(인물, 대인관계, 돌발 만남, 미팅/소개팅, 연애 상황 등) 예시와 묘사
     - 3번째 문단: 이 기운을 나에게 가장 유리하게 끌어다 쓸 수 있는 실질적인 처방 및 직접적인 행동 지침(대화법, 기가 막힌 처방, 옷 스타일 팁, 액션 아이템 등)
   - 대충 쓴 짧은 문장이나 무성의한 반복 문장, 추상적인 문장은 결코 허용되지 않습니다.
4. **구체적인 개운(開運) 처방전:**
   - 매일의 운세에는 오행을 활용한 아주 명확한 '행운의 아이템(코디 색상, 특별한 의미의 숫자, 이동할 방향, 최고의 개운 시간대와 그 시간에 해야 할 실제 행동 지침)'을 제시해 주십시오.
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

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.15,
        }
      });

      const parsed = JSON.parse(response.text!.trim());
      res.json(parsed);
    } catch (error: any) {
      console.error("Horoscope generation error:", error);
      res.status(500).json({ error: error.message || "운세를 생성하는 도중 오류가 발생했습니다." });
    }
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

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      try {
        const indexPath = path.join(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          let html = fs.readFileSync(indexPath, "utf8");
          const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
          const host = req.get("host");
          const baseUrl = `${protocol}://${host}`;
          html = html.replace(/%BASE_URL%/g, baseUrl);
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
