import React, { useState, useEffect } from "react";
import { calculateSaju, daymasterMap, getDynamicCharacter } from "../utils/saju";
import { Member } from "../types";
import { KOREAN_CITIES } from "@orrery/core";

const REGIONS = Array.from(new Set(KOREAN_CITIES.map((c) => c.region)));

interface SajuFormProps {
  onSubmit: (formData: {
    nickname: string;
    gender: string;
    birth_date: string;
    birth_time: string | null;
    saju: any;
    character_emoji: string;
    character_animal: string;
    character_color: string;
    mbti?: string | null;
  }) => void;
  submitButtonText?: string;
  initialNickname?: string;
  initialGender?: "남성" | "여성";
  initialBirthDate?: string;
  initialBirthTime?: string | null;
  initialMbti?: string | null;
}

export default function SajuForm({
  onSubmit,
  submitButtonText = "참여하기",
  initialNickname = "",
  initialGender = "여성",
  initialBirthDate = "",
  initialBirthTime = null,
  initialMbti = null,
}: SajuFormProps) {
  const [nickname, setNickname] = useState(initialNickname);
  const [gender, setGender] = useState<"남성" | "여성">(initialGender);
  const [birthDate, setBirthDate] = useState(initialBirthDate);
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthTime, setBirthTime] = useState(initialBirthTime || "");
  const [birthHour, setBirthHour] = useState("");
  const [birthMin, setBirthMin] = useState("");
  const [knowTime, setKnowTime] = useState(!!initialBirthTime);
  const [selectedRegion, setSelectedRegion] = useState("서울특별시");
  const [birthplaceCity, setBirthplaceCity] = useState("서울");

  // MBTI States
  const [useMbti, setUseMbti] = useState(false);
  const [mbtiLetter1, setMbtiLetter1] = useState("E");
  const [mbtiLetter2, setMbtiLetter2] = useState("S");
  const [mbtiLetter3, setMbtiLetter3] = useState("T");
  const [mbtiLetter4, setMbtiLetter4] = useState("J");

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const region = e.target.value;
    setSelectedRegion(region);
    const citiesForRegion = KOREAN_CITIES.filter((c) => c.region === region);
    if (citiesForRegion.length > 0) {
      setBirthplaceCity(citiesForRegion[0].name);
    }
  };
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialNickname) setNickname(initialNickname);
  }, [initialNickname]);

  useEffect(() => {
    if (initialGender) setGender(initialGender);
  }, [initialGender]);

  useEffect(() => {
    if (initialBirthDate) {
      setBirthDate(initialBirthDate);
      const parts = initialBirthDate.split("-");
      if (parts.length === 3) {
        setBirthYear(parts[0]);
        setBirthMonth(parseInt(parts[1], 10).toString());
        setBirthDay(parseInt(parts[2], 10).toString());
      }
    }
  }, [initialBirthDate]);

  useEffect(() => {
    if (initialBirthTime) {
      setBirthTime(initialBirthTime);
      const parts = initialBirthTime.split(":");
      if (parts.length === 2) {
        setBirthHour(parseInt(parts[0], 10).toString());
        setBirthMin(parseInt(parts[1], 10).toString());
      }
    } else {
      setBirthTime("");
      setBirthHour("");
      setBirthMin("");
    }
    setKnowTime(!!initialBirthTime);
  }, [initialBirthTime]);

  useEffect(() => {
    if (initialMbti && initialMbti.length === 4) {
      setUseMbti(true);
      setMbtiLetter1(initialMbti[0].toUpperCase());
      setMbtiLetter2(initialMbti[1].toUpperCase());
      setMbtiLetter3(initialMbti[2].toUpperCase());
      setMbtiLetter4(initialMbti[3].toUpperCase());
    } else {
      setUseMbti(false);
    }
  }, [initialMbti]);

  // Keep birthDate in sync when individual parts change
  useEffect(() => {
    if (birthYear && birthMonth && birthDay) {
      const y = parseInt(birthYear, 10);
      const m = parseInt(birthMonth, 10);
      const d = parseInt(birthDay, 10);
      
      if (!isNaN(y) && !isNaN(m) && !isNaN(d) && y >= 1900 && y <= 2030 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        const formattedMonth = m.toString().padStart(2, "0");
        const formattedDay = d.toString().padStart(2, "0");
        setBirthDate(`${y}-${formattedMonth}-${formattedDay}`);
      } else {
        setBirthDate("");
      }
    } else {
      setBirthDate("");
    }
  }, [birthYear, birthMonth, birthDay]);

  // Keep birthTime in sync when individual parts change
  useEffect(() => {
    if (birthHour) {
      const h = parseInt(birthHour, 10);
      const m = birthMin ? parseInt(birthMin, 10) : 0;
      if (!isNaN(h) && h >= 0 && h <= 23 && !isNaN(m) && m >= 0 && m <= 59) {
        const formattedHour = h.toString().padStart(2, "0");
        const formattedMin = m.toString().padStart(2, "0");
        setBirthTime(`${formattedHour}:${formattedMin}`);
      } else {
        setBirthTime("");
      }
    } else {
      setBirthTime("");
    }
  }, [birthHour, birthMin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nickname.trim()) {
      setError("별명을 입력해 주세요.");
      return;
    }

    const y = parseInt(birthYear, 10);
    const m = parseInt(birthMonth, 10);
    const d = parseInt(birthDay, 10);

    if (isNaN(y) || y < 1900 || y > 2030) {
      setError("태어난 년도를 1900 ~ 2030 사이로 정확히 입력해 주세요 (예: 1995).");
      return;
    }
    if (isNaN(m) || m < 1 || m > 12) {
      setError("태어난 월을 1 ~ 12 사이로 입력해 주세요.");
      return;
    }
    if (isNaN(d) || d < 1 || d > 31) {
      setError("태어난 일을 1 ~ 31 사이로 입력해 주세요.");
      return;
    }

    // Verify day validity for given month
    const maxDays = new Date(y, m, 0).getDate();
    if (d > maxDays) {
      setError(`${y}년 ${m}월은 최대 ${maxDays}일까지 존재합니다. 날짜를 확인해 주세요.`);
      return;
    }

    // Final compiled date verification
    const compiledDate = `${y}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;

    let selectedTime: string | null = null;
    if (knowTime) {
      if (!birthHour.trim()) {
        setError("태어난 시를 입력해 주세요.");
        return;
      }
      const h = parseInt(birthHour, 10);
      const minVal = birthMin.trim() ? parseInt(birthMin, 10) : 0;

      if (isNaN(h) || h < 0 || h > 23) {
        setError("태어난 시를 0 ~ 23 사이의 숫자로 정확히 입력해 주세요.");
        return;
      }
      if (isNaN(minVal) || minVal < 0 || minVal > 59) {
        setError("태어난 분을 0 ~ 59 사이의 숫자로 정확히 입력해 주세요.");
        return;
      }
      selectedTime = `${h.toString().padStart(2, "0")}:${minVal.toString().padStart(2, "0")}`;
    }

    try {
      // Calculate deterministic saju with birthplace timezone correction
      const selectedCityObj = KOREAN_CITIES.find(
        (c) => c.region === selectedRegion && c.name === birthplaceCity
      ) || { name: "서울", lat: 37.5665, lon: 126.978 };
      const sajuResult = calculateSaju(compiledDate, selectedTime, selectedCityObj, gender);
      const daymasterChar = sajuResult.daymaster.gan;
      const dayBranchChar = sajuResult.pillars.day.ji;
      const charMeta = getDynamicCharacter(daymasterChar, dayBranchChar);

      onSubmit({
        nickname: nickname.trim(),
        gender,
        birth_date: compiledDate,
        birth_time: selectedTime,
        saju: sajuResult,
        character_emoji: charMeta.emoji,
        character_animal: charMeta.animalName,
        character_color: charMeta.color,
        mbti: useMbti ? `${mbtiLetter1}${mbtiLetter2}${mbtiLetter3}${mbtiLetter4}` : null,
      });
    } catch (err: any) {
      console.error(err);
      setError("사주 만세력 계산 오류가 발생했습니다. 입력 정보를 다시 확인해 주세요.");
    }
  };

  return (
    <form id="saju-form" onSubmit={handleSubmit} className="space-y-5 bg-white/60 backdrop-blur-xs p-5 border border-[#D6CCBC] rounded-2xl shadow-xs">
      <h3 className="font-serif text-sm font-bold text-[#C0392B] border-b border-[#E8E0D0] pb-2 tracking-tight">
        사주 정보 입력 작성
      </h3>

      {/* Nickname */}
      <div className="space-y-1.5 text-left">
        <label className="block text-xs font-semibold text-[#5A4D41] tracking-tight">명식에 올릴 별명</label>
        <input
          id="nickname-input"
          type="text"
          maxLength={10}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="예: 홍길동, 아기사자"
          className="w-full px-3.5 py-2.5 bg-white border border-[#E8E0D0] focus:outline-none focus:ring-2 focus:ring-[#C0392B]/20 focus:border-[#C0392B] rounded-xl text-sm placeholder:text-[#B0A69B] text-[#2C3E50]"
        />
      </div>

      {/* Gender */}
      <div className="space-y-1.5 text-left">
        <label className="block text-xs font-semibold text-[#5A4D41] tracking-tight">성별 (음양 분별)</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            id="gender-female-btn"
            type="button"
            onClick={() => setGender("여성")}
            className={`py-2.5 text-xs font-bold rounded-xl border transition-all duration-200 ${
              gender === "여성"
                ? "bg-[#C0392B] text-white border-transparent shadow-md shadow-[#C0392B]/10"
                : "bg-white text-[#2C3E50] border-[#E8E0D0] hover:bg-[#FAF7F2] hover:border-[#D6CCBC]"
            }`}
          >
            여성
          </button>
          <button
            id="gender-male-btn"
            type="button"
            onClick={() => setGender("남성")}
            className={`py-2.5 text-xs font-bold rounded-xl border transition-all duration-200 ${
              gender === "남성"
                ? "bg-[#C0392B] text-white border-transparent shadow-md shadow-[#C0392B]/10"
                : "bg-white text-[#2C3E50] border-[#E8E0D0] hover:bg-[#FAF7F2] hover:border-[#D6CCBC]"
            }`}
          >
            남성
          </button>
        </div>
      </div>

      {/* Birth Date */}
      <div className="space-y-1.5 text-left">
        <label className="block text-xs font-semibold text-[#5A4D41] tracking-tight">양력 생년월일</label>
        <div className="grid grid-cols-3 gap-2">
          {/* Year Input */}
          <div className="relative">
            <input
              id="birth-year-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={birthYear}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setBirthYear(val);
              }}
              placeholder="1995"
              className="w-full text-center pr-5 pl-2 py-2.5 bg-white border border-[#E8E0D0] focus:outline-none focus:ring-2 focus:ring-[#C0392B]/20 focus:border-[#C0392B] rounded-xl text-sm text-[#2C3E50] font-sans"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#8C7B6E] pointer-events-none">년</span>
          </div>

          {/* Month Input */}
          <div className="relative">
            <input
              id="birth-month-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              value={birthMonth}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setBirthMonth(val);
              }}
              placeholder="5"
              className="w-full text-center pr-5 pl-2 py-2.5 bg-white border border-[#E8E0D0] focus:outline-none focus:ring-2 focus:ring-[#C0392B]/20 focus:border-[#C0392B] rounded-xl text-sm text-[#2C3E50] font-sans"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#8C7B6E] pointer-events-none">월</span>
          </div>

          {/* Day Input */}
          <div className="relative">
            <input
              id="birth-day-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              value={birthDay}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setBirthDay(val);
              }}
              placeholder="15"
              className="w-full text-center pr-5 pl-2 py-2.5 bg-white border border-[#E8E0D0] focus:outline-none focus:ring-2 focus:ring-[#C0392B]/20 focus:border-[#C0392B] rounded-xl text-sm text-[#2C3E50] font-sans"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#8C7B6E] pointer-events-none">일</span>
          </div>
        </div>
      </div>

      {/* Birth Place / Timezone Correction */}
      <div className="space-y-1.5 text-left">
        <label className="block text-xs font-semibold text-[#5A4D41] tracking-tight">태어난 지역 (진태양시 정밀 시간보정)</label>
        <div className="grid grid-cols-2 gap-2">
          {/* Region Select (시/도) */}
          <select
            id="birthplace-region-select"
            value={selectedRegion}
            onChange={handleRegionChange}
            className="w-full px-3 py-2 bg-white border border-[#E8E0D0] focus:outline-none focus:ring-2 focus:ring-[#C0392B]/20 focus:border-[#C0392B] rounded-xl text-xs sm:text-sm text-[#2C3E50] cursor-pointer"
          >
            {REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>

          {/* City Select (시/군/구) */}
          <select
            id="birthplace-city-select"
            value={birthplaceCity}
            onChange={(e) => setBirthplaceCity(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#E8E0D0] focus:outline-none focus:ring-2 focus:ring-[#C0392B]/20 focus:border-[#C0392B] rounded-xl text-xs sm:text-sm text-[#2C3E50] cursor-pointer"
          >
            {KOREAN_CITIES.filter((c) => c.region === selectedRegion).map((city) => {
              const isMetropolitan = city.region.endsWith("특별시") || city.region.endsWith("광역시") || city.region.endsWith("특별자치시");
              const displayName = isMetropolitan ? `${city.name} (전역 대표)` : `${city.name}시/군`;
              return (
                <option key={`${city.region}-${city.name}`} value={city.name}>
                  {displayName} (경도: {city.lon.toFixed(2)}°)
                </option>
              );
            })}
          </select>
        </div>
        <p className="text-[10px] text-[#8C7B6E] leading-relaxed">
          * 실제 태양 위치(진태양시) 기준 시각을 정밀 보정합니다. (선택 지역 경도에 따라 표준시 대비 정밀 시각을 자동 산출)
        </p>
      </div>

      {/* Birth Time Toggle + Selection */}
      <div className="space-y-2 text-left">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-[#5A4D41] tracking-tight">출생 시각 입력</label>
          <label className="flex items-center space-x-1 cursor-pointer select-none">
            <input
              id="know-time-check"
              type="checkbox"
              checked={knowTime}
              onChange={(e) => setKnowTime(e.target.checked)}
              className="w-4 h-4 rounded border-[#E8E0D0] text-[#C0392B] accent-[#C0392B] focus:ring-0"
            />
            <span className="text-[11px] text-[#5A4D41] font-bold">태어난 시각을 압니다</span>
          </label>
        </div>

        {knowTime && (
          <div className="grid grid-cols-2 gap-2">
            {/* Hour Input */}
            <div className="relative">
              <input
                id="birth-hour-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={birthHour}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setBirthHour(val);
                }}
                placeholder="14"
                className="w-full text-center pr-5 pl-2 py-2.5 bg-white border border-[#E8E0D0] focus:outline-none focus:ring-2 focus:ring-[#C0392B]/20 focus:border-[#C0392B] rounded-xl text-sm text-[#2C3E50] font-sans"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#8C7B6E] pointer-events-none">시</span>
            </div>

            {/* Minute Input */}
            <div className="relative">
              <input
                id="birth-minute-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={birthMin}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setBirthMin(val);
                }}
                placeholder="30"
                className="w-full text-center pr-5 pl-2 py-2.5 bg-white border border-[#E8E0D0] focus:outline-none focus:ring-2 focus:ring-[#C0392B]/20 focus:border-[#C0392B] rounded-xl text-sm text-[#2C3E50] font-sans"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#8C7B6E] pointer-events-none">분</span>
            </div>
          </div>
        )}
        {!knowTime && (
          <div className="text-[11px] text-[#8C7B6E] bg-[#FAF8F5]/80 p-3 rounded-xl border border-dashed border-[#E8E0D0] leading-normal">
            * 시각을 모르는 경우, 만세력 계산 시 태어난 날(일주)까지 삼주만으로 수려히 정밀 계산합니다.
          </div>
        )}
      </div>

      {/* MBTI Selection Option */}
      <div className="space-y-2 text-left bg-[#FAF8F5]/80 p-4 rounded-2xl border border-[#E8E0D0]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[#5A4D41] tracking-tight">현대 성향심리 (MBTI)</label>
          <label className="flex items-center space-x-1 cursor-pointer select-none">
            <input
              id="use-mbti-check"
              type="checkbox"
              checked={useMbti}
              onChange={(e) => setUseMbti(e.target.checked)}
              className="w-4 h-4 rounded border-[#E8E0D0] text-[#C0392B] accent-[#C0392B] focus:ring-0"
            />
            <span className="text-[11px] text-[#5A4D41] font-bold">MBTI 정보도 결합</span>
          </label>
        </div>

        {useMbti ? (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-4 gap-2">
              {/* E / I */}
              <div className="flex flex-col space-y-1">
                <span className="text-[9px] font-bold text-[#8C7B6E] text-center">에너지 (E/I)</span>
                <div className="flex rounded-lg overflow-hidden border border-[#E8E0D0] bg-white text-xs text-center font-bold">
                  <button
                    id="mbti-e-btn"
                    type="button"
                    onClick={() => setMbtiLetter1("E")}
                    className={`flex-1 py-1.5 transition-all cursor-pointer ${mbtiLetter1 === "E" ? "bg-[#C0392B] text-white" : "hover:bg-[#FAF7F2] text-[#5A4D41]"}`}
                  >
                    E
                  </button>
                  <button
                    id="mbti-i-btn"
                    type="button"
                    onClick={() => setMbtiLetter1("I")}
                    className={`flex-1 py-1.5 transition-all cursor-pointer ${mbtiLetter1 === "I" ? "bg-[#C0392B] text-white" : "hover:bg-[#FAF7F2] text-[#5A4D41]"}`}
                  >
                    I
                  </button>
                </div>
              </div>

              {/* S / N */}
              <div className="flex flex-col space-y-1">
                <span className="text-[9px] font-bold text-[#8C7B6E] text-center">인식 (S/N)</span>
                <div className="flex rounded-lg overflow-hidden border border-[#E8E0D0] bg-white text-xs text-center font-bold">
                  <button
                    id="mbti-s-btn"
                    type="button"
                    onClick={() => setMbtiLetter2("S")}
                    className={`flex-1 py-1.5 transition-all cursor-pointer ${mbtiLetter2 === "S" ? "bg-[#C0392B] text-white" : "hover:bg-[#FAF7F2] text-[#5A4D41]"}`}
                  >
                    S
                  </button>
                  <button
                    id="mbti-n-btn"
                    type="button"
                    onClick={() => setMbtiLetter2("N")}
                    className={`flex-1 py-1.5 transition-all cursor-pointer ${mbtiLetter2 === "N" ? "bg-[#C0392B] text-white" : "hover:bg-[#FAF7F2] text-[#5A4D41]"}`}
                  >
                    N
                  </button>
                </div>
              </div>

              {/* T / F */}
              <div className="flex flex-col space-y-1">
                <span className="text-[9px] font-bold text-[#8C7B6E] text-center">판단 (T/F)</span>
                <div className="flex rounded-lg overflow-hidden border border-[#E8E0D0] bg-white text-xs text-center font-bold">
                  <button
                    id="mbti-t-btn"
                    type="button"
                    onClick={() => setMbtiLetter3("T")}
                    className={`flex-1 py-1.5 transition-all cursor-pointer ${mbtiLetter3 === "T" ? "bg-[#C0392B] text-white" : "hover:bg-[#FAF7F2] text-[#5A4D41]"}`}
                  >
                    T
                  </button>
                  <button
                    id="mbti-f-btn"
                    type="button"
                    onClick={() => setMbtiLetter3("F")}
                    className={`flex-1 py-1.5 transition-all cursor-pointer ${mbtiLetter3 === "F" ? "bg-[#C0392B] text-white" : "hover:bg-[#FAF7F2] text-[#5A4D41]"}`}
                  >
                    F
                  </button>
                </div>
              </div>

              {/* J / P */}
              <div className="flex flex-col space-y-1">
                <span className="text-[9px] font-bold text-[#8C7B6E] text-center">생활 (J/P)</span>
                <div className="flex rounded-lg overflow-hidden border border-[#E8E0D0] bg-white text-xs text-center font-bold">
                  <button
                    id="mbti-j-btn"
                    type="button"
                    onClick={() => setMbtiLetter4("J")}
                    className={`flex-1 py-1.5 transition-all cursor-pointer ${mbtiLetter4 === "J" ? "bg-[#C0392B] text-white" : "hover:bg-[#FAF7F2] text-[#5A4D41]"}`}
                  >
                    J
                  </button>
                  <button
                    id="mbti-p-btn"
                    type="button"
                    onClick={() => setMbtiLetter4("P")}
                    className={`flex-1 py-1.5 transition-all cursor-pointer ${mbtiLetter4 === "P" ? "bg-[#C0392B] text-white" : "hover:bg-[#FAF7F2] text-[#5A4D41]"}`}
                  >
                    P
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-[#8C7B6E] leading-normal text-center pt-1">
              * 동양 사주명리에 서양 별자리, 천상 자미두수, 그리고 <strong>현대 심리학(MBTI)</strong>을 결합하여 고도로 정합적인 우주 통합 감정서를 도출해 냅니다.
            </p>
          </div>
        ) : (
          <p className="text-[10px] text-[#8C7B6E] leading-normal">
            * MBTI를 결합하지 않을 시, 동양 사주(만세력) + 자미두수 + 서양 황도 별자리 3대 영역을 통합 융합하여 정밀 풀이해 드립니다.
          </p>
        )}
      </div>

      {error && (
        <div className="text-xs text-[#C0392B] bg-[#FDEDEC] p-3 rounded-xl border border-[#FADBD8] font-bold text-center">
          ⚠️ {error}
        </div>
      )}

      <button
        id="submit-saju-btn"
        type="submit"
        className="w-full py-4 bg-[#C0392B] text-white rounded-xl font-serif font-bold text-sm shadow-lg shadow-[#C0392B]/20 hover:bg-[#A93226] active:scale-[0.98] transition-all duration-200 tracking-widest text-center cursor-pointer"
      >
        {submitButtonText}
      </button>

      <div className="mt-4 pt-3 border-t border-[#E8E0D0] text-[11px] text-[#8C7B6E] leading-relaxed space-y-1">
        <p className="font-semibold text-[#5A4D41] flex items-center gap-1">
          💡 왜 내가 알던 띠(동물)와 다른가요?
        </p>
        <p>
          전통 명리학에서 당신의 진짜 본질(나 자신)을 나타내는 것은 태어난 해(년)가 아닌, <strong>태어난 날(일)의 기운</strong>입니다. 본 서비스는 단순한 년도별 띠가 아니라, 당신이 태어난 날인 <strong>일주(천간 색상 + 지지 동물)</strong>를 기준으로 훨씬 정밀하고 특별한 '소울 캐릭터'를 매칭해 드립니다!
        </p>
      </div>
    </form>
  );
}
