import React, { useState } from "react";
import { X, UserPlus, Sparkles, Calendar, Clock, AlertCircle } from "lucide-react";
import { calculateSaju, getDynamicCharacter } from "../utils/saju";
import { Member } from "../types";
import { db, auth } from "../lib/firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { Lunar } from "lunar-javascript";

interface AddGuestMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  onMemberAdded: (member: Member) => void;
}

const YEAR_OPTIONS = Array.from({ length: 97 }, (_, i) => 2026 - i);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i);

export default function AddGuestMemberModal({
  isOpen,
  onClose,
  roomCode,
  onMemberAdded,
}: AddGuestMemberModalProps) {
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<"남성" | "여성">("여성");
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);

  const [birthYear, setBirthYear] = useState<number>(1998);
  const [birthMonth, setBirthMonth] = useState<number>(5);
  const [birthDay, setBirthDay] = useState<number>(15);

  const [unknownTime, setUnknownTime] = useState(true);
  const [birthHour, setBirthHour] = useState<number>(12);
  const [birthMinute, setBirthMinute] = useState<number>(0);

  const [useMbti, setUseMbti] = useState(false);
  const [mbti1, setMbti1] = useState("E");
  const [mbti2, setMbti2] = useState("N");
  const [mbti3, setMbti3] = useState("F");
  const [mbti4, setMbti4] = useState("P");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nickname.trim()) {
      setError("멤버 이름(또는 닉네임)을 입력해 주세요.");
      return;
    }

    setLoading(true);

    try {
      // Date compilation with Lunar conversion if needed
      let solarYear = birthYear;
      let solarMonth = birthMonth;
      let solarDay = birthDay;

      if (calendarType === "lunar") {
        try {
          const lunar = Lunar.fromYmd(birthYear, isLeapMonth ? -birthMonth : birthMonth, birthDay);
          const solar = lunar.getSolar();
          solarYear = solar.getYear();
          solarMonth = solar.getMonth();
          solarDay = solar.getDay();
        } catch (lunarErr) {
          setError("유효하지 않은 음력 날짜입니다. 날짜를 다시 확인해 주세요.");
          setLoading(false);
          return;
        }
      }

      const compiledDate = `${solarYear}-${solarMonth.toString().padStart(2, "0")}-${solarDay.toString().padStart(2, "0")}`;
      const selectedTime = unknownTime
        ? null
        : `${birthHour.toString().padStart(2, "0")}:${birthMinute.toString().padStart(2, "0")}`;

      // Calculate Saju
      const defaultCity = { name: "서울", lat: 37.5665, lon: 126.978 };
      const sajuResult = calculateSaju(compiledDate, selectedTime, defaultCity, gender);
      const daymasterChar = sajuResult.daymaster.gan;
      const dayBranchChar = sajuResult.pillars.day.ji;
      const charMeta = getDynamicCharacter(daymasterChar, dayBranchChar);

      const mbti = useMbti ? `${mbti1}${mbti2}${mbti3}${mbti4}` : null;
      const guestMemberId = "member_guest_" + Math.random().toString(36).substring(2, 11);
      const nowStr = new Date().toISOString();

      const memberPayload: any = {
        nickname: nickname.trim(),
        gender,
        birth_date: compiledDate,
        birth_time: selectedTime,
        saju: sajuResult,
        character_emoji: charMeta.emoji,
        character_animal: charMeta.animalName,
        character_color: charMeta.color,
        joined_at: nowStr,
        user_uid: null, // 비회원 지인 표시
        isGuest: true,
        addedBy: auth.currentUser?.uid || "host",
      };
      if (mbti) {
        memberPayload.mbti = mbti;
      }

      // Save to Firestore
      await setDoc(doc(db, "rooms", roomCode, "members", guestMemberId), memberPayload);

      // Invalidate existing cached analysis so group scores refresh
      const cacheRef = doc(db, "rooms", roomCode, "analysis", "result");
      await deleteDoc(cacheRef).catch(() => {});

      const createdMember: Member = {
        id: guestMemberId,
        ...memberPayload,
      };

      onMemberAdded(createdMember);
      onClose();
    } catch (err: any) {
      console.error("Failed to add guest member:", err);
      setError("멤버 추가에 실패했습니다: " + (err.message || "다시 시도해 주세요."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden text-ink max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-seal/10 text-seal flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-base text-ink">비회원 지인 직접 추가</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 font-bold">
                  방장 전용
                </span>
              </div>
              <p className="text-xs text-ink-faint">
                가입 없이 생년월일만으로 모임 궁합에 즉시 포함시킵니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-sunken transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Nickname & Gender */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                이름 또는 닉네임 <span className="text-seal">*</span>
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="예: 지민, 민수, 팀장님, 엄마"
                maxLength={20}
                className="w-full px-3.5 py-2.5 rounded-xl bg-sunken border border-line focus:outline-hidden focus:border-seal text-ink text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                성별 <span className="text-seal">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender("여성")}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                    gender === "여성"
                      ? "bg-rose-500/15 border-rose-500 text-rose-500 shadow-xs"
                      : "bg-sunken border-line text-ink-faint hover:text-ink"
                  }`}
                >
                  여성
                </button>
                <button
                  type="button"
                  onClick={() => setGender("남성")}
                  className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                    gender === "남성"
                      ? "bg-blue-500/15 border-blue-500 text-blue-500 shadow-xs"
                      : "bg-sunken border-line text-ink-faint hover:text-ink"
                  }`}
                >
                  남성
                </button>
              </div>
            </div>
          </div>

          {/* 2. Birthdate & Calendar Type */}
          <div className="space-y-3 pt-1 border-t border-line/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink-soft flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-seal" />
                생년월일 <span className="text-seal">*</span>
              </label>
              <div className="flex items-center gap-1.5 bg-sunken p-0.5 rounded-lg border border-line text-xs">
                <button
                  type="button"
                  onClick={() => setCalendarType("solar")}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    calendarType === "solar"
                      ? "bg-surface text-ink shadow-xs"
                      : "text-ink-faint hover:text-ink"
                  }`}
                >
                  양력
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarType("lunar")}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    calendarType === "lunar"
                      ? "bg-surface text-ink shadow-xs"
                      : "text-ink-faint hover:text-ink"
                  }`}
                >
                  음력
                </button>
              </div>
            </div>

            {calendarType === "lunar" && (
              <label className="flex items-center gap-2 text-xs text-ink-faint cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLeapMonth}
                  onChange={(e) => setIsLeapMonth(e.target.checked)}
                  className="rounded border-line text-seal focus:ring-seal"
                />
                <span>윤달(음력 윤달)인 경우 체크</span>
              </label>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div>
                <select
                  value={birthYear}
                  onChange={(e) => setBirthYear(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl bg-sunken border border-line text-ink text-xs focus:outline-hidden focus:border-seal"
                >
                  {YEAR_OPTIONS.map((y) => (
                    <option key={y} value={y}>
                      {y}년
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl bg-sunken border border-line text-ink text-xs focus:outline-hidden focus:border-seal"
                >
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}월
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={birthDay}
                  onChange={(e) => setBirthDay(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl bg-sunken border border-line text-ink text-xs focus:outline-hidden focus:border-seal"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}일
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. Birth Time */}
          <div className="space-y-2 pt-1 border-t border-line/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink-soft flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-seal" />
                태어난 시간
              </label>
              <label className="flex items-center gap-1.5 text-xs text-ink-faint cursor-pointer">
                <input
                  type="checkbox"
                  checked={unknownTime}
                  onChange={(e) => setUnknownTime(e.target.checked)}
                  className="rounded border-line text-seal focus:ring-seal"
                />
                <span>시간 모름 (권장)</span>
              </label>
            </div>

            {!unknownTime && (
              <div className="grid grid-cols-2 gap-2 animate-fade-in">
                <div>
                  <select
                    value={birthHour}
                    onChange={(e) => setBirthHour(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-xl bg-sunken border border-line text-ink text-xs focus:outline-hidden focus:border-seal"
                  >
                    {HOUR_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {h}시
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={birthMinute}
                    onChange={(e) => setBirthMinute(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-xl bg-sunken border border-line text-ink text-xs focus:outline-hidden focus:border-seal"
                  >
                    {MINUTE_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}분
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 4. MBTI (Optional) */}
          <div className="space-y-2 pt-1 border-t border-line/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink-soft flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                MBTI (선택)
              </label>
              <label className="flex items-center gap-1.5 text-xs text-ink-faint cursor-pointer">
                <input
                  type="checkbox"
                  checked={useMbti}
                  onChange={(e) => setUseMbti(e.target.checked)}
                  className="rounded border-line text-seal focus:ring-seal"
                />
                <span>MBTI 입력하기</span>
              </label>
            </div>

            {useMbti && (
              <div className="grid grid-cols-4 gap-1.5 animate-fade-in">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setMbti1("E")}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${mbti1 === "E" ? "bg-seal/15 border-seal text-seal" : "bg-sunken border-line text-ink-faint"}`}
                  >
                    E
                  </button>
                  <button
                    type="button"
                    onClick={() => setMbti1("I")}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${mbti1 === "I" ? "bg-seal/15 border-seal text-seal" : "bg-sunken border-line text-ink-faint"}`}
                  >
                    I
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setMbti2("N")}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${mbti2 === "N" ? "bg-seal/15 border-seal text-seal" : "bg-sunken border-line text-ink-faint"}`}
                  >
                    N
                  </button>
                  <button
                    type="button"
                    onClick={() => setMbti2("S")}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${mbti2 === "S" ? "bg-seal/15 border-seal text-seal" : "bg-sunken border-line text-ink-faint"}`}
                  >
                    S
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setMbti3("T")}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${mbti3 === "T" ? "bg-seal/15 border-seal text-seal" : "bg-sunken border-line text-ink-faint"}`}
                  >
                    T
                  </button>
                  <button
                    type="button"
                    onClick={() => setMbti3("F")}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${mbti3 === "F" ? "bg-seal/15 border-seal text-seal" : "bg-sunken border-line text-ink-faint"}`}
                  >
                    F
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setMbti4("J")}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${mbti4 === "J" ? "bg-seal/15 border-seal text-seal" : "bg-sunken border-line text-ink-faint"}`}
                  >
                    J
                  </button>
                  <button
                    type="button"
                    onClick={() => setMbti4("P")}
                    className={`py-1.5 text-xs font-bold rounded-lg border ${mbti4 === "P" ? "bg-seal/15 border-seal text-seal" : "bg-sunken border-line text-ink-faint"}`}
                  >
                    P
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-seal hover:bg-seal-hover text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>사주 계산 및 멤버 등록 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>모임 멤버로 즉시 등록하기</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-ink-faint text-center mt-2">
              등록 즉시 모임 오행 분포, 1:1 케미, 인스타 스토리에 반영됩니다.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
