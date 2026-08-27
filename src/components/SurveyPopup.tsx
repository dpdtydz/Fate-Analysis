import React, { useState, useEffect } from "react";
import { db, auth, sanitizeFirestoreData } from "../lib/firebase";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { MessageSquare, X, Check, ArrowRight, Loader2, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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

export default function SurveyPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [config, setConfig] = useState<SurveyConfig | null>(null);
  
  // Form state: questionId -> string (for text/radio) or string[] (for checkbox)
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const fetchSurveyConfig = async () => {
      try {
        const configRef = doc(db, "survey_config", "global");
        const docSnap = await getDoc(configRef);
        
        let surveyConfig: SurveyConfig;

        if (docSnap.exists()) {
          surveyConfig = docSnap.data() as SurveyConfig;
        } else {
          // If config does not exist, use default questions matching user requirements
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
                  "지불 의향 없음 (기본 무료 기능만 이용)"
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
        }

        setConfig(surveyConfig);

        // Check if user already submitted in this browser
        const isSubmitted = localStorage.getItem("saju_survey_submitted") === "true";
        setSubmitted(isSubmitted);

        // Auto trigger open after 3 seconds if active and not submitted and not seen today
        if (surveyConfig.active && !isSubmitted) {
          const lastSeen = localStorage.getItem("saju_survey_last_seen");
          const now = Date.now();
          const ONE_DAY = 24 * 60 * 60 * 1000;
          const alreadySeenToday = lastSeen && (now - parseInt(lastSeen, 10) < ONE_DAY);

          if (!alreadySeenToday) {
            const timer = setTimeout(() => {
              setIsOpen(true);
              localStorage.setItem("saju_survey_last_seen", Date.now().toString());
            }, 3000);
            return () => clearTimeout(timer);
          }
        }
      } catch (err) {
        console.warn("Using default survey configuration due to a temporary connection/permission lag:", err);
        
        const defaultSurveyConfig: SurveyConfig = {
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
                "지불 의향 없음 (기본 무료 기능만 이용)"
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
        
        setConfig(defaultSurveyConfig);
        
        const isSubmitted = localStorage.getItem("saju_survey_submitted") === "true";
        setSubmitted(isSubmitted);

        if (!isSubmitted) {
          const lastSeen = localStorage.getItem("saju_survey_last_seen");
          const now = Date.now();
          const ONE_DAY = 24 * 60 * 60 * 1000;
          const alreadySeenToday = lastSeen && (now - parseInt(lastSeen, 10) < ONE_DAY);

          if (!alreadySeenToday) {
            const timer = setTimeout(() => {
              setIsOpen(true);
              localStorage.setItem("saju_survey_last_seen", Date.now().toString());
            }, 3000);
            return () => clearTimeout(timer);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSurveyConfig();
  }, []);

  // Completely hide popup and floating badge if already submitted and not currently open
  if (submitted && !isOpen) {
    return null;
  }

  if (loading || !config || !config.active) {
    return null;
  }

  // Handle radio / text changes
  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    setFormError("");
  };

  // Handle checkbox changes
  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    const currentList = (answers[questionId] as string[]) || [];
    let updatedList: string[];
    if (checked) {
      updatedList = [...currentList, option];
    } else {
      updatedList = currentList.filter((item) => item !== option);
    }
    handleAnswerChange(questionId, updatedList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Validate required questions
    for (const q of config.questions) {
      if (q.required) {
        const ans = answers[q.id];
        if (!ans || (Array.isArray(ans) && ans.length === 0) || (typeof ans === "string" && !ans.trim())) {
          setFormError(`필수 질문에 답변해 주세요: "${q.title.substring(0, 20)}..."`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      // Save response to Firestore
      const user = auth.currentUser;
      const surveyPayload = sanitizeFirestoreData({
        answers,
        submittedAt: new Date().toISOString(),
        userEmail: user?.email || null,
        userUid: user?.uid || null,
        nickname: user?.displayName || localStorage.getItem("saju_nickname") || "익명 참가자"
      });
      await addDoc(collection(db, "survey_responses"), surveyPayload);

      // Mark as submitted locally
      localStorage.setItem("saju_survey_submitted", "true");
      setSubmitted(true);
      
      // Delay to show success screen, then close
      setTimeout(() => {
        setIsOpen(false);
        setIsMinimized(true);
      }, 3000);
    } catch (err) {
      console.error("Error submitting survey:", err);
      setFormError("의견을 제출하는 도중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating feedback badge at bottom right */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-auto">
        <AnimatePresence>
          {(!isOpen || isMinimized) && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              type="button"
              onClick={() => {
                setIsOpen(true);
                setIsMinimized(false);
              }}
              className="flex items-center space-x-2 bg-surface text-ink font-semibold text-xs px-4 py-3 rounded-xl shadow-lg transition-colors duration-200 cursor-pointer hover:bg-sunken"
            >
              <MessageSquare className="w-4 h-4 text-ink-soft" />
              <span>{submitted ? "보낸 의견 보기" : "의견 보내기"}</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Survey Modal Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[90] flex items-center justify-center p-4 cursor-pointer"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsOpen(false);
                setIsMinimized(true);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-surface w-full max-w-md rounded-xl shadow-lg overflow-hidden relative flex flex-col max-h-[90vh] cursor-default"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(true);
                }}
                className="absolute top-4 right-4 p-1 rounded-xl text-ink-faint hover:text-ink hover:bg-sunken transition-colors duration-150 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-grow space-y-5">
                {!submitted ? (
                  <>
                    {/* Header */}
                    <div className="text-center space-y-1 pb-4">
                      <h3 className="font-serif text-lg font-semibold text-ink">인연사주 사용성 설문</h3>
                      <p className="text-xs text-ink-soft leading-relaxed">
                        서비스 개선 방향과 유료 정책 검토에 참고할 의견을 남겨 주세요.
                      </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5 text-left">
                      {config.questions.map((q, index) => (
                        <div key={q.id} className="space-y-2.5">
                          <label className="block text-xs font-semibold text-ink leading-relaxed">
                            <span className="text-ink-faint mr-1">{index + 1}.</span>
                            {q.title}
                            {q.required && <span className="text-seal ml-1">*</span>}
                          </label>

                          {/* TEXT question */}
                          {q.type === "text" && (
                            <textarea
                              rows={3}
                              value={answers[q.id] || ""}
                              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                              placeholder="여기에 자유롭게 작성해 주세요."
                              className="w-full px-4 py-3 bg-sunken rounded-xl focus:outline-none focus:ring-1 focus:ring-ink text-xs text-ink placeholder:text-ink-faint resize-none"
                            />
                          )}

                          {/* RADIO question */}
                          {q.type === "radio" && (
                            <div className="space-y-1.5">
                              {q.options.map((option) => (
                                <label
                                  key={option}
                                  className={`flex items-start p-3 rounded-xl cursor-pointer transition-colors text-xs leading-relaxed space-x-2.5 ${
                                    answers[q.id] === option ? "bg-ink text-white" : "bg-sunken text-ink-soft hover:bg-line"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={q.id}
                                    value={option}
                                    checked={answers[q.id] === option}
                                    onChange={() => handleAnswerChange(q.id, option)}
                                    className="mt-0.5 accent-ink"
                                  />
                                  <span>{option}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {/* CHECKBOX question */}
                          {q.type === "checkbox" && (
                            <div className="space-y-1.5">
                              {q.options.map((option) => {
                                const isChecked = (answers[q.id] as string[] || []).includes(option);
                                return (
                                  <label
                                    key={option}
                                    className={`flex items-start p-3 rounded-xl cursor-pointer transition-colors text-xs leading-relaxed space-x-2.5 ${
                                      isChecked ? "bg-ink text-white" : "bg-sunken text-ink-soft hover:bg-line"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      value={option}
                                      checked={isChecked}
                                      onChange={(e) => handleCheckboxChange(q.id, option, e.target.checked)}
                                      className="mt-0.5 accent-ink"
                                    />
                                    <span>{option}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}

                      {formError && (
                        <p className="text-xs text-seal font-medium text-center bg-sunken p-3 rounded-xl">
                          {formError}
                        </p>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-seal hover:bg-seal-deep disabled:opacity-40 text-white rounded-xl font-semibold text-sm flex items-center justify-center space-x-1.5 transition-colors duration-200 cursor-pointer"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>제출 중...</span>
                          </>
                        ) : (
                          <>
                            <span>의견 보내기</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                ) : (
                  /* Thank You Success Screen */
                  <div className="py-8 text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-sunken text-ink-soft">
                      <Award className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-serif text-lg font-semibold text-ink">설문이 제출되었습니다</h3>
                      <p className="text-xs text-ink-soft leading-loose">
                        보내주신 의견은 유료 정책과 기능 개선을 검토할 때 참고합니다.<br />
                        <span className="font-semibold text-ink">lhs41977@gmail.com</span>로 전달되었습니다.
                      </p>
                    </div>
                    <div className="bg-sunken p-4 rounded-xl text-left">
                      <h4 className="text-xs font-semibold text-ink pb-1.5 mb-1 flex items-center">
                        <Check className="w-3 h-3 mr-1 text-ink-soft" />
                        <span>참여해 주셔서 감사합니다</span>
                      </h4>
                      <p className="text-xs text-ink-soft leading-relaxed">
                        의견은 안전하게 기록되었습니다. 더 나은 사주 궁합 분석으로 보답하겠습니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        setIsMinimized(true);
                      }}
                      className="px-6 py-2.5 bg-sunken hover:bg-line text-ink text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      닫기
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
