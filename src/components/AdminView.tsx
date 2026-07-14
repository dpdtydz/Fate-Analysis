import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { 
  Settings, ToggleLeft, ToggleRight, Save, Plus, Trash2, 
  Download, Copy, RefreshCw, Check, ArrowLeft, Users, FileText, CheckSquare, Edit3
} from "lucide-react";
import { motion } from "motion/react";

interface Question {
  id: string;
  type: "text" | "radio" | "checkbox";
  title: string;
  options: string[];
  required: boolean;
}

interface SurveyConfig {
  active: boolean;
  questions: Question[];
}

interface SurveyResponse {
  id: string;
  answers: Record<string, any>;
  submittedAt: string;
  userEmail: string | null;
  userUid: string | null;
  nickname: string | null;
}

export default function AdminView() {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<SurveyConfig | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch admin configurations and survey responses
  const loadAdminData = async () => {
    setLoading(true);
    setActionMessage("");
    try {
      // 1. Load config
      const configRef = doc(db, "survey_config", "global");
      const docSnap = await getDoc(configRef);
      let surveyConfig: SurveyConfig;

      if (docSnap.exists()) {
        surveyConfig = docSnap.data() as SurveyConfig;
      } else {
        // Initialize default
        surveyConfig = {
          active: true,
          questions: [
            {
              id: "q1",
              type: "checkbox",
              title: "인연사주 앱에서 앞으로 가장 보완되거나 추가되었으면 하는 기능은 무엇인가요? (복수 선택 가능)",
              options: [
                "더 세밀하고 상세한 개인 사주/만세력 풀이 정보 제공",
                "실시간 채팅 및 사주 방 내부 소통 기능 추가",
                "사주 오행 어울림 기반의 AI 추천 매칭 및 관계 해설 강화",
                "일일 사주 운세 알림 및 나와 타인과의 실시간 흐름 비교",
                "방 인원 제한 확장 및 대규모 모임(50인 이상) 최적화"
              ],
              required: true
            },
            {
              id: "q2",
              type: "radio",
              title: "앞으로 도입될 프리미엄 유료 기능 중, 비용을 지불할 의향이 가장 높은 항목은 무엇인가요?",
              options: [
                "상세한 AI 심층 사주 매칭 리포트 개별 저장/PDF 다운로드 (건당 1,900원)",
                "모임 전체 인원의 오행 상생 궁합 총괄 분석서 발급 (건당 4,900원)",
                "광고 제거 및 무제한 인연방 개설 가능한 프리미엄 멤버십 (월 2,900원)",
                "모임 구성원 간 비밀 인연 등급 및 상성 정밀 분석 (건당 2,900원)",
                "과금 의향 없음 (기본 무료 기능만 이용)"
              ],
              required: true
            },
            {
              id: "q3",
              type: "text",
              title: "인연사주 서비스에 아쉽거나 응원하고 싶으신 의견을 편하게 적어주세요!",
              options: [],
              required: false
            }
          ]
        };
        await setDoc(configRef, surveyConfig);
      }
      setConfig(surveyConfig);

      // 2. Load responses
      const resSnap = await getDocs(collection(db, "survey_responses"));
      const list: SurveyResponse[] = [];
      resSnap.forEach((docSnap) => {
        list.push({
          id: docSnap.id,
          ...docSnap.data()
        } as SurveyResponse);
      });
      
      // Sort responses by submit date desc
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setResponses(list);
    } catch (e) {
      console.error("Admin data loading error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.email?.toLowerCase() === "lhs41977@gmail.com") {
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  // Save config to Firestore
  const handleSaveConfig = async () => {
    if (!config) return;
    setSaving(true);
    setActionMessage("");
    try {
      await setDoc(doc(db, "survey_config", "global"), config);
      setActionMessage("설문 설정이 성공적으로 저장되었습니다!");
      setTimeout(() => setActionMessage(""), 3000);
    } catch (err) {
      console.error("Error saving survey config:", err);
      setActionMessage("설정 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // Add a new question to configuration
  const handleAddQuestion = () => {
    if (!config) return;
    const newQ: Question = {
      id: "q_" + Date.now(),
      type: "radio",
      title: "새로운 질문 제목을 입력해 주세요.",
      options: ["옵션 A", "옵션 B"],
      required: false
    };
    setConfig({
      ...config,
      questions: [...config.questions, newQ]
    });
  };

  // Remove a question from configuration
  const handleRemoveQuestion = (qId: string) => {
    if (!config) return;
    setConfig({
      ...config,
      questions: config.questions.filter(q => q.id !== qId)
    });
  };

  // Edit question properties
  const handleEditQuestion = (qId: string, updates: Partial<Question>) => {
    if (!config) return;
    setConfig({
      ...config,
      questions: config.questions.map(q => q.id === qId ? { ...q, ...updates } as Question : q)
    });
  };

  // Export responses to CSV
  const handleExportCSV = () => {
    if (responses.length === 0 || !config) return;
    
    let csvContent = "\uFEFF"; // BOM for Korean Excel compatibility
    
    // Headers
    const headers = ["제출 일시", "이름/닉네임", "구글 이메일"];
    config.questions.forEach((q, idx) => {
      headers.push(`Q${idx + 1}: ${q.title.replace(/"/g, '""')}`);
    });
    csvContent += headers.map(h => `"${h}"`).join(",") + "\n";

    // Rows
    responses.forEach((res) => {
      const row = [
        new Date(res.submittedAt).toLocaleString("ko-KR"),
        res.nickname || "익명",
        res.userEmail || "없음"
      ];

      config.questions.forEach((q) => {
        const val = res.answers[q.id];
        let answerStr = "";
        if (Array.isArray(val)) {
          answerStr = val.join(", ");
        } else if (val) {
          answerStr = String(val);
        }
        row.push(answerStr.replace(/"/g, '""'));
      });

      csvContent += row.map(r => `"${r}"`).join(",") + "\n";
    });

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `InyeonSaju_Survey_Responses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy to clipboard
  const handleCopyToClipboard = () => {
    if (responses.length === 0 || !config) return;

    let text = "=== 인연사주 설문 취합 리포트 ===\n\n";
    responses.forEach((res, idx) => {
      text += `[응답 #${idx + 1}] ${res.nickname || "익명"} (${res.userEmail || "이메일 없음"}) - ${new Date(res.submittedAt).toLocaleString("ko-KR")}\n`;
      config.questions.forEach((q, qIdx) => {
        const val = res.answers[q.id];
        const answerStr = Array.isArray(val) ? val.join(", ") : val || "답변 없음";
        text += `  Q${qIdx + 1}. ${q.title}\n  -> 답변: ${answerStr}\n`;
      });
      text += "\n-----------------------------------\n\n";
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Delete a single response
  const handleDeleteResponse = async (resId: string) => {
    if (!window.confirm("정말로 이 응답을 데이터베이스에서 영구 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "survey_responses", resId));
      setResponses(responses.filter(r => r.id !== resId));
    } catch (e) {
      console.error("Error deleting response:", e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // Render Access Denied
  const isAdminUser = currentUser?.email?.toLowerCase() === "lhs41977@gmail.com";

  if (!loading && !isAdminUser) {
    return (
      <Layout title="인연사주 어드민" showHomeButton>
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-50 border border-red-300 text-red-600 flex items-center justify-center text-3xl font-serif">
            🔒
          </div>
          <div className="space-y-2">
            <h3 className="font-serif text-lg font-bold text-[#2C3E50]">접근 권한이 제안되었습니다</h3>
            <p className="text-xs text-[#8C7B6E] leading-relaxed max-w-xs mx-auto">
              이 공간은 최고 권한을 가진 관리자(<span className="font-semibold text-[#C0392B]">lhs41977@gmail.com</span>) 전용 콘솔입니다.
              구글 로그인을 통해 해당 계정으로 입장해 주세요.
            </p>
          </div>
          <a
            href="#/"
            className="px-6 py-2.5 bg-[#C0392B] text-[#FAF7F2] font-bold text-xs rounded-xl hover:bg-[#A93226] transition cursor-pointer"
          >
            처음으로 돌아가기
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="최고 관리자 콘솔" showHomeButton>
      <div className="space-y-6 text-left pb-12">
        {/* Admin Header */}
        <div className="bg-purple-900 text-[#FAF7F2] p-5 rounded-2xl border-2 border-purple-800 shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5">
              <span className="text-amber-400">👑</span>
              <h2 className="font-serif text-sm font-bold tracking-wider">인연사주 최고 관리 콘솔</h2>
            </div>
            <p className="text-[10px] text-purple-200 font-semibold">
              접속자: {currentUser?.email} (lhs41977@gmail.com)
            </p>
          </div>
          <button
            type="button"
            onClick={loadAdminData}
            className="p-2 bg-purple-800 hover:bg-purple-700 rounded-lg transition text-white cursor-pointer"
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#C0392B] mx-auto" />
            <p className="text-xs text-[#8C7B6E] font-medium animate-pulse">
              데이터베이스와 통신하여 설문 상태를 동기화하는 중...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* 1. ON/OFF Toggle Section */}
            <div className="bg-white border border-[#D6CCBC] p-5 rounded-2xl shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8E0D0] pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-[#2C3E50] flex items-center">
                    <Settings className="w-4 h-4 text-[#C0392B] mr-1.5" />
                    <span>사용성 평가 팝업 활성화 설정</span>
                  </h3>
                  <p className="text-[10px] text-[#8C7B6E]">
                    활성화 시 앱에 접속하는 모든 일반 방문자에게 피드백 이벤트 팝업이 노출됩니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => config && setConfig({ ...config, active: !config.active })}
                  className="focus:outline-none cursor-pointer"
                >
                  {config?.active ? (
                    <ToggleRight className="w-12 h-8 text-emerald-600 transition" />
                  ) : (
                    <ToggleLeft className="w-12 h-8 text-gray-400 transition" />
                  )}
                </button>
              </div>

              {/* Action Message Bar */}
              {actionMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-center text-xs font-bold">
                  {actionMessage}
                </div>
              )}

              {/* 2. Questions customization Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#2C3E50] flex items-center">
                    <Edit3 className="w-3.5 h-3.5 text-[#C0392B] mr-1" />
                    <span>설문 질문 구성 커스터마이징 ({config?.questions.length || 0}개 항목)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-[#2C3E50] hover:bg-[#1A252F] text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>질문 추가</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {config?.questions.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-[#FDFBF7] border border-[#E8E0D0] rounded-xl space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#C0392B] bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                          질문 {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Question Title Edit */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-[#8C7B6E]">질문 제목</label>
                        <input
                          type="text"
                          value={q.title}
                          onChange={(e) => handleEditQuestion(q.id, { title: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-[#E8E0D0] rounded-lg text-xs"
                        />
                      </div>

                      {/* Question Type and Required Settings */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-[#8C7B6E]">질문 유형</label>
                          <select
                            value={q.type}
                            onChange={(e) => handleEditQuestion(q.id, { type: e.target.value as any })}
                            className="w-full px-2 py-1.5 bg-white border border-[#E8E0D0] rounded-lg text-xs"
                          >
                            <option value="radio">객관식 단일 선택 (Radio)</option>
                            <option value="checkbox">객관식 다중 선택 (Checkbox)</option>
                            <option value="text">주관식 서술형 (Text)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-[#8C7B6E]">필수 답변 여부</label>
                          <select
                            value={q.required ? "true" : "false"}
                            onChange={(e) => handleEditQuestion(q.id, { required: e.target.value === "true" })}
                            className="w-full px-2 py-1.5 bg-white border border-[#E8E0D0] rounded-lg text-xs"
                          >
                            <option value="true">필수 (Required)</option>
                            <option value="false">선택 (Optional)</option>
                          </select>
                        </div>
                      </div>

                      {/* Options List (only if radio or checkbox) */}
                      {q.type !== "text" && (
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-[#8C7B6E]">선택지 목록 (쉼표 , 로 구분)</label>
                          <textarea
                            rows={2}
                            value={q.options.join(", ")}
                            onChange={(e) => {
                              const opts = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                              handleEditQuestion(q.id, { options: opts });
                            }}
                            className="w-full p-2 bg-white border border-[#E8E0D0] rounded-lg text-xs font-sans resize-none"
                            placeholder="예: 옵션 1, 옵션 2, 옵션 3"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="w-full py-3 bg-[#C0392B] hover:bg-[#A93226] text-white rounded-xl font-bold text-xs tracking-widest flex items-center justify-center space-x-1 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "설정 저장하는 중..." : "설문 변경사항 저장하기"}</span>
                </button>
              </div>
            </div>

            {/* 3. Survey Results View Section */}
            <div className="bg-[#FCFAF6] border border-[#D6CCBC] p-5 rounded-2xl shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#E8E0D0] pb-3.5 space-y-2 sm:space-y-0">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-[#2C3E50] flex items-center">
                    <Users className="w-4 h-4 text-[#C0392B] mr-1.5" />
                    <span>사용자 제출 피드백 및 통계 ({responses.length}명 응답)</span>
                  </h3>
                  <p className="text-[10px] text-[#8C7B6E]">
                    수집된 의견은 Firestore DB에 암호화 보관되며 아래에서 한눈에 실시간 집계 조회 가능합니다.
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    disabled={responses.length === 0}
                    className="inline-flex items-center space-x-1 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Excel CSV 다운로드</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyToClipboard}
                    disabled={responses.length === 0}
                    className="inline-flex items-center space-x-1 px-3 py-2 bg-[#2C3E50] hover:bg-[#1A252F] disabled:bg-gray-300 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>복사 완료</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>의견 텍스트 복사</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {responses.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8C7B6E] italic">
                  아직 제출된 사용성 설문 답변이 없습니다.
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {responses.map((res, index) => (
                    <div key={res.id} className="bg-white border border-[#E8E0D0] rounded-xl p-4 text-xs space-y-3 relative group">
                      {/* Top bar for response */}
                      <div className="flex items-center justify-between border-b border-[#FCFAF5] pb-2 text-[10px] text-[#8C7B6E]">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-[#C0392B] bg-red-50 px-1.5 py-0.5 rounded">
                            #{responses.length - index}
                          </span>
                          <span className="font-bold text-[#2C3E50]">{res.nickname || "익명"}</span>
                          <span>|</span>
                          <span className="font-mono">{res.userEmail || "비로그인/익명"}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono">{new Date(res.submittedAt).toLocaleString("ko-KR")}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteResponse(res.id)}
                            className="text-gray-400 hover:text-red-600 p-0.5 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            title="응답 영구 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Display Q&A */}
                      <div className="space-y-3 text-left pl-1">
                        {config?.questions.map((q) => {
                          const val = res.answers[q.id];
                          let answerText = "답변 없음";
                          if (Array.isArray(val)) {
                            answerText = val.join(", ");
                          } else if (val) {
                            answerText = String(val);
                          }
                          return (
                            <div key={q.id} className="space-y-1">
                              <p className="text-[10px] font-bold text-[#8C7B6E]">
                                Q. {q.title}
                              </p>
                              <p className="text-xs text-[#2C3E50] bg-[#FCFAF5] p-2 rounded-lg border border-[#E8E0D0]/40 leading-relaxed font-medium">
                                {answerText}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </Layout>
  );
}
