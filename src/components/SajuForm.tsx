import React, { useState, useEffect, useMemo } from "react";
import { calculateSaju, daymasterMap, getDynamicCharacter } from "../utils/saju";
import { Member } from "../types";
import { KOREAN_CITIES } from "@orrery/core";
import { Lunar } from "lunar-javascript";

const KOREAN_CITIES_MODIFIED = KOREAN_CITIES.map((city) => {
  if (city.region === "전라남도" || city.region === "광주광역시") {
    return {
      ...city,
      region: "전남광주통합특별시",
    };
  }
  return city;
});

const REGIONS = Array.from(new Set(KOREAN_CITIES_MODIFIED.map((c) => c.region)));

function findCityAndRegion(cityName?: string, regionName?: string): { region: string; city: string } {
  if (regionName && cityName) {
    const exact = KOREAN_CITIES_MODIFIED.find((c) => c.region === regionName && c.name === cityName);
    if (exact) return { region: exact.region, city: exact.name };
  }
  if (cityName) {
    const match = KOREAN_CITIES_MODIFIED.find((c) => c.name === cityName);
    if (match) return { region: match.region, city: match.name };
  }
  if (regionName) {
    const matchRegion = KOREAN_CITIES_MODIFIED.find((c) => c.region === regionName);
    if (matchRegion) return { region: matchRegion.region, city: matchRegion.name };
  }
  return { region: "서울특별시", city: "서울" };
}

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
    birthplace_region?: string;
    birthplace_city?: string;
  }) => void;
  submitButtonText?: string;
  initialNickname?: string;
  initialGender?: "남성" | "여성";
  initialBirthDate?: string;
  initialBirthTime?: string | null;
  initialMbti?: string | null;
  initialBirthplaceCity?: string | null;
  initialBirthplaceRegion?: string | null;
}

/** 선택 버튼 그룹의 공통 스타일 (design.md: 활성=먹, 무보더) */
const chipBase = "py-2.5 text-sm rounded-lg transition-colors cursor-pointer";
const chipOn = "bg-ink text-white font-semibold";
const chipOff = "bg-surface text-ink-soft hover:text-ink";

/** 입력창 공통 스타일 (무보더, 오류 시에만 인주 링) */
const inputBase = "bg-sunken rounded-xl text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1";
const inputOk = "focus:ring-ink";
const inputErr = "ring-1 ring-seal focus:ring-seal";

export default function SajuForm({
  onSubmit,
  submitButtonText = "참여하기",
  initialNickname = "",
  initialGender = "여성",
  initialBirthDate = "",
  initialBirthTime = null,
  initialMbti = null,
  initialBirthplaceCity = null,
  initialBirthplaceRegion = null,
}: SajuFormProps) {
  const initialLoc = findCityAndRegion(initialBirthplaceCity || undefined, initialBirthplaceRegion || undefined);
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
  const [selectedRegion, setSelectedRegion] = useState(initialLoc.region);
  const [birthplaceCity, setBirthplaceCity] = useState(initialLoc.city);

  // Calendar Type: solar, lunar_normal (평달), lunar_leap (윤달)
  const [calendarType, setCalendarType] = useState<"solar" | "lunar_normal" | "lunar_leap">("solar");

  // Individual Field Errors
  const [yearError, setYearError] = useState("");
  const [monthError, setMonthError] = useState("");
  const [dayError, setDayError] = useState("");
  const [hourError, setHourError] = useState("");
  const [minError, setMinError] = useState("");

  // Helper validation functions
  const validateYear = (val: string) => {
    if (!val.trim()) {
      setYearError("년도를 입력해 주세요.");
      return;
    }
    const y = parseInt(val, 10);
    if (isNaN(y) || y < 1900 || y > 2030) {
      setYearError("년도는 1900 ~ 2030 사이로 입력해 주세요.");
    } else {
      setYearError("");
    }
  };

  const validateMonth = (val: string) => {
    if (!val.trim()) {
      setMonthError("월을 입력해 주세요.");
      return;
    }
    const m = parseInt(val, 10);
    if (isNaN(m) || m < 1 || m > 12) {
      setMonthError("월은 1 ~ 12 사이의 숫자를 입력해 주세요.");
    } else {
      setMonthError("");
    }
  };

  const validateDay = (val: string, yStr: string, mStr: string) => {
    if (!val.trim()) {
      setDayError("일을 입력해 주세요.");
      return;
    }
    const d = parseInt(val, 10);
    if (isNaN(d) || d < 1 || d > 31) {
      setDayError("일은 1 ~ 31 사이의 숫자를 입력해 주세요.");
      return;
    }
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);

    if (calendarType === "solar") {
      let maxDays = 31;
      const parsedMonth = isNaN(m) ? 0 : m;
      if (parsedMonth >= 1 && parsedMonth <= 12) {
        const parsedYear = (isNaN(y) || y < 1900 || y > 2030) ? 2000 : y;
        maxDays = new Date(parsedYear, parsedMonth, 0).getDate();
      }

      if (d > maxDays) {
        const mLabel = parsedMonth ? `${parsedMonth}월은` : "해당 월은";
        const yLabel = (!isNaN(y) && y >= 1900 && y <= 2030) ? `${y}년 ` : "";
        setDayError(`${yLabel}${mLabel} 최대 ${maxDays}일까지 존재합니다.`);
      } else {
        setDayError("");
      }
    } else {
      if (!isNaN(y) && !isNaN(m) && y >= 1900 && y <= 2030 && m >= 1 && m <= 12) {
        try {
          const lunarMonth = calendarType === "lunar_leap" ? -m : m;
          // Verify if this lunar date can be instantiated
          Lunar.fromYmd(y, lunarMonth, d);
          setDayError("");
        } catch (e: any) {
          setDayError("해당 음력 날짜가 존재하지 않습니다.");
        }
      } else {
        setDayError("");
      }
    }
  };

  const validateHour = (val: string) => {
    if (!knowTime) {
      setHourError("");
      return;
    }
    if (!val.trim()) {
      setHourError("태어난 시를 입력해 주세요.");
      return;
    }
    const h = parseInt(val, 10);
    if (isNaN(h) || h < 0 || h > 23) {
      setHourError("시는 0 ~ 23 사이의 숫자를 입력해 주세요.");
    } else {
      setHourError("");
    }
  };

  const validateMin = (val: string) => {
    if (!knowTime) {
      setMinError("");
      return;
    }
    if (!val.trim()) {
      setMinError("");
      return;
    }
    const minVal = parseInt(val, 10);
    if (isNaN(minVal) || minVal < 0 || minVal > 59) {
      setMinError("분은 0 ~ 59 사이의 숫자를 입력해 주세요.");
    } else {
      setMinError("");
    }
  };

  // Run dynamic validations
  useEffect(() => {
    if (birthYear) {
      validateYear(birthYear);
    } else {
      setYearError("");
    }
  }, [birthYear]);

  useEffect(() => {
    if (birthMonth) {
      validateMonth(birthMonth);
    } else {
      setMonthError("");
    }
  }, [birthMonth]);

  useEffect(() => {
    if (birthDay) {
      validateDay(birthDay, birthYear, birthMonth);
    } else {
      setDayError("");
    }
  }, [birthDay, birthYear, birthMonth, calendarType]);

  useEffect(() => {
    if (knowTime) {
      if (birthHour) {
        validateHour(birthHour);
      }
      if (birthMin) {
        validateMin(birthMin);
      }
    } else {
      setHourError("");
      setMinError("");
    }
  }, [birthHour, birthMin, knowTime]);

  // MBTI States
  const [useMbti, setUseMbti] = useState(false);
  const [mbtiLetter1, setMbtiLetter1] = useState("E");
  const [mbtiLetter2, setMbtiLetter2] = useState("S");
  const [mbtiLetter3, setMbtiLetter3] = useState("T");
  const [mbtiLetter4, setMbtiLetter4] = useState("J");

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const region = e.target.value;
    setSelectedRegion(region);
    const citiesForRegion = KOREAN_CITIES_MODIFIED.filter((c) => c.region === region);
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
    } else {
      // Default Birthdate Set strictly to standard reference value (1995-01-01)
      setBirthYear("1995");
      setBirthMonth("1");
      setBirthDay("1");
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
    if (initialBirthplaceCity || initialBirthplaceRegion) {
      const loc = findCityAndRegion(initialBirthplaceCity || undefined, initialBirthplaceRegion || undefined);
      setSelectedRegion(loc.region);
      setBirthplaceCity(loc.city);
    }
  }, [initialBirthplaceCity, initialBirthplaceRegion]);

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

  // Converted Live Solar Date Display for Lunar choice
  const convertedSolarText = useMemo(() => {
    if (calendarType === "solar") return "";
    const y = parseInt(birthYear, 10);
    const m = parseInt(birthMonth, 10);
    const d = parseInt(birthDay, 10);
    if (isNaN(y) || isNaN(m) || isNaN(d) || y < 1900 || y > 2030 || m < 1 || m > 12 || d < 1 || d > 31) {
      return "";
    }
    try {
      const lunarMonth = calendarType === "lunar_leap" ? -m : m;
      const lunarObj = Lunar.fromYmd(y, lunarMonth, d);
      const solarObj = lunarObj.getSolar();
      return `양력 ${solarObj.getYear()}년 ${solarObj.getMonth()}월 ${solarObj.getDay()}일`;
    } catch (e) {
      return "유효하지 않은 음력 날짜입니다.";
    }
  }, [calendarType, birthYear, birthMonth, birthDay]);

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

    // Verify day validity depending on Solar vs Lunar
    if (calendarType === "solar") {
      const maxDays = new Date(y, m, 0).getDate();
      if (d > maxDays) {
        setError(`${y}년 ${m}월은 최대 ${maxDays}일까지 존재합니다. 날짜를 확인해 주세요.`);
        return;
      }
    } else {
      try {
        const lunarMonth = calendarType === "lunar_leap" ? -m : m;
        Lunar.fromYmd(y, lunarMonth, d);
      } catch (e) {
        setError("입력하신 음력 날짜는 존재하지 않습니다. 날짜를 다시 확인해 주세요.");
        return;
      }
    }

    // Final compiled solar date conversion
    let compiledDate = `${y}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
    if (calendarType !== "solar") {
      try {
        const lunarMonth = calendarType === "lunar_leap" ? -m : m;
        const lunarObj = Lunar.fromYmd(y, lunarMonth, d);
        const solarObj = lunarObj.getSolar();
        compiledDate = `${solarObj.getYear()}-${solarObj.getMonth().toString().padStart(2, "0")}-${solarObj.getDay().toString().padStart(2, "0")}`;
      } catch (err) {
        setError("음력 날짜를 양력으로 변환하는 도중 오류가 발생했습니다.");
        return;
      }
    }

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
      const selectedCityObj = KOREAN_CITIES_MODIFIED.find(
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
        birthplace_region: selectedRegion,
        birthplace_city: birthplaceCity,
      });
    } catch (err: any) {
      console.error(err);
      setError("사주 만세력 계산 오류가 발생했습니다. 입력 정보를 다시 확인해 주세요.");
    }
  };

  return (
    <form id="saju-form" onSubmit={handleSubmit} className="space-y-6 bg-surface border border-line p-5 sm:p-6 rounded-xl">
      <div>
        <h3 className="font-serif text-lg font-semibold text-ink">사주 정보 입력</h3>
        <p className="text-xs text-ink-faint mt-1">태어난 날을 기준으로 만세력을 계산합니다.</p>
      </div>

      {/* Nickname */}
      <div className="space-y-1.5 text-left">
        <label className="block text-xs font-medium text-ink-soft">이름 (별명)</label>
        <input
          id="nickname-input"
          type="text"
          maxLength={10}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="예: 홍길동, 지우"
          className={`w-full px-4 py-3 ${inputBase} ${inputOk}`}
        />
      </div>

      {/* Gender */}
      <div className="space-y-1.5 text-left">
        <label className="block text-xs font-medium text-ink-soft">성별</label>
        <div className="grid grid-cols-2 gap-1 bg-sunken p-1 rounded-xl">
          <button
            id="gender-female-btn"
            type="button"
            onClick={() => setGender("여성")}
            className={`${chipBase} ${gender === "여성" ? chipOn : chipOff}`}
          >
            여성
          </button>
          <button
            id="gender-male-btn"
            type="button"
            onClick={() => setGender("남성")}
            className={`${chipBase} ${gender === "남성" ? chipOn : chipOff}`}
          >
            남성
          </button>
        </div>
      </div>

      {/* Calendar Type */}
      <div className="space-y-1.5 text-left">
        <label className="block text-xs font-medium text-ink-soft">양력 / 음력</label>
        <div className="grid grid-cols-3 gap-1 bg-sunken p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setCalendarType("solar")}
            className={`${chipBase} ${calendarType === "solar" ? chipOn : chipOff}`}
          >
            양력
          </button>
          <button
            type="button"
            onClick={() => setCalendarType("lunar_normal")}
            className={`${chipBase} ${calendarType === "lunar_normal" ? chipOn : chipOff}`}
          >
            음력 평달
          </button>
          <button
            type="button"
            onClick={() => setCalendarType("lunar_leap")}
            className={`${chipBase} ${calendarType === "lunar_leap" ? chipOn : chipOff}`}
          >
            음력 윤달
          </button>
        </div>
      </div>

      {/* Birth Date */}
      <div className="space-y-1.5 text-left">
        <div className="flex justify-between items-center gap-2">
          <label className="block text-xs font-medium text-ink-soft">
            {calendarType === "solar" ? "생년월일 (양력)" : `생년월일 (음력 ${calendarType === "lunar_leap" ? "윤달" : "평달"})`}
          </label>
          {convertedSolarText && (
            <span className="text-xs font-medium text-ink">{convertedSolarText}</span>
          )}
        </div>
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
              className={`w-full text-center pr-6 pl-2 py-3 ${inputBase} ${yearError ? inputErr : inputOk}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint pointer-events-none">년</span>
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
              placeholder="1"
              className={`w-full text-center pr-6 pl-2 py-3 ${inputBase} ${monthError ? inputErr : inputOk}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint pointer-events-none">월</span>
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
              placeholder="1"
              className={`w-full text-center pr-6 pl-2 py-3 ${inputBase} ${dayError ? inputErr : inputOk}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint pointer-events-none">일</span>
          </div>
        </div>
        {(yearError || monthError || dayError) && (
          <div className="space-y-1 mt-1.5 pl-1">
            {yearError && <p className="text-xs text-seal font-medium leading-normal">{yearError}</p>}
            {monthError && <p className="text-xs text-seal font-medium leading-normal">{monthError}</p>}
            {dayError && <p className="text-xs text-seal font-medium leading-normal">{dayError}</p>}
          </div>
        )}
      </div>

      {/* Birth Place / Timezone Correction */}
      <div className="space-y-1.5 text-left">
        <label className="block text-xs font-medium text-ink-soft">출생 지역</label>
        <div className="grid grid-cols-2 gap-2">
          {/* Region Select (시/도) */}
          <select
            id="birthplace-region-select"
            value={selectedRegion}
            onChange={handleRegionChange}
            className={`w-full px-3 py-3 ${inputBase} ${inputOk} cursor-pointer`}
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
            className={`w-full px-3 py-3 ${inputBase} ${inputOk} cursor-pointer`}
          >
            {KOREAN_CITIES_MODIFIED.filter((c) => c.region === selectedRegion).map((city) => {
              const isMetropolitan = city.region.endsWith("특별시") || city.region.endsWith("광역시") || city.region.endsWith("특별자치시");
              const displayName = isMetropolitan ? `${city.name} 전역` : `${city.name}시/군`;
              return (
                <option key={`${city.region}-${city.name}`} value={city.name}>
                  {displayName}
                </option>
              );
            })}
          </select>
        </div>
        <p className="text-xs text-ink-faint">출생지의 경도로 태양시를 보정해 계산합니다.</p>
      </div>

      {/* Birth Time Toggle + Selection */}
      <div className="space-y-2 text-left">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-ink-soft">출생 시각</label>
          <label className="flex items-center space-x-1.5 cursor-pointer select-none">
            <input
              id="know-time-check"
              type="checkbox"
              checked={knowTime}
              onChange={(e) => setKnowTime(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-ink cursor-pointer"
            />
            <span className="text-xs text-ink-soft">태어난 시각을 압니다</span>
          </label>
        </div>

        {knowTime ? (
          <div>
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
                  className={`w-full text-center pr-6 pl-2 py-3 ${inputBase} ${hourError ? inputErr : inputOk}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint pointer-events-none">시</span>
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
                  className={`w-full text-center pr-6 pl-2 py-3 ${inputBase} ${minError ? inputErr : inputOk}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint pointer-events-none">분</span>
              </div>
            </div>
            {(hourError || minError) && (
              <div className="space-y-1 mt-1.5 pl-1">
                {hourError && <p className="text-xs text-seal font-medium leading-normal">{hourError}</p>}
                {minError && <p className="text-xs text-seal font-medium leading-normal">{minError}</p>}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-ink-faint bg-sunken p-3 rounded-xl leading-relaxed">
            시각을 모르면 연·월·일 세 기둥으로 분석합니다. 시각까지 입력하면 더 정밀해집니다.
          </p>
        )}
      </div>

      {/* MBTI Selection Option */}
      <div className="space-y-2 text-left bg-sunken p-4 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-ink">MBTI 함께 보기</span>
            <span className="text-xs text-ink-faint ml-1.5">선택</span>
          </div>
          <button
            type="button"
            onClick={() => setUseMbti(!useMbti)}
            aria-label="MBTI 함께 보기"
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              useMbti ? "bg-ink" : "bg-line"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out ${
                useMbti ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {useMbti && (
          <div className="grid grid-cols-2 gap-2 pt-1.5">
            {([
              { label: "에너지", a: "E", b: "I", aDesc: "외향", bDesc: "내향", value: mbtiLetter1, set: setMbtiLetter1, idA: "mbti-e-btn", idB: "mbti-i-btn" },
              { label: "인식", a: "S", b: "N", aDesc: "감각", bDesc: "직관", value: mbtiLetter2, set: setMbtiLetter2, idA: "mbti-s-btn", idB: "mbti-n-btn" },
              { label: "판단", a: "T", b: "F", aDesc: "사고", bDesc: "감정", value: mbtiLetter3, set: setMbtiLetter3, idA: "mbti-t-btn", idB: "mbti-f-btn" },
              { label: "생활", a: "J", b: "P", aDesc: "계획", bDesc: "자율", value: mbtiLetter4, set: setMbtiLetter4, idA: "mbti-j-btn", idB: "mbti-p-btn" },
            ] as const).map((row) => (
              <div key={row.label} className="flex flex-col space-y-1">
                <span className="text-xs text-ink-faint">{row.label}</span>
                <div className="flex rounded-lg overflow-hidden bg-surface text-sm text-center">
                  <button
                    id={row.idA}
                    type="button"
                    onClick={() => row.set(row.a)}
                    className={`flex-1 py-2 transition-colors cursor-pointer ${
                      row.value === row.a ? "bg-ink text-white font-semibold" : "text-ink-faint hover:text-ink"
                    }`}
                  >
                    {row.a} {row.aDesc}
                  </button>
                  <button
                    id={row.idB}
                    type="button"
                    onClick={() => row.set(row.b)}
                    className={`flex-1 py-2 transition-colors cursor-pointer ${
                      row.value === row.b ? "bg-ink text-white font-semibold" : "text-ink-faint hover:text-ink"
                    }`}
                  >
                    {row.b} {row.bDesc}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-seal bg-sunken p-3 rounded-xl font-medium text-center">
          {error}
        </p>
      )}

      {(() => {
        const isSubmitDisabled = !!(
          yearError ||
          monthError ||
          dayError ||
          hourError ||
          minError ||
          !nickname.trim() ||
          !birthYear ||
          !birthMonth ||
          !birthDay ||
          (knowTime && !birthHour)
        );

        return (
          <button
            id="submit-saju-btn"
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm text-center transition-colors ${
              isSubmitDisabled
                ? "bg-line text-ink-faint cursor-not-allowed"
                : "bg-seal text-white hover:bg-seal-deep cursor-pointer"
            }`}
          >
            {submitButtonText}
          </button>
        );
      })()}

      <div className="pt-4 border-t border-line text-xs text-ink-faint leading-relaxed">
        <p>
          내가 알던 띠와 다른 동물이 나올 수 있습니다. 본질 성향은 태어난 해가 아니라
          <strong className="text-ink-soft"> 태어난 날(일간·일지)</strong>의 기운으로 읽기 때문입니다.
        </p>
      </div>
    </form>
  );
}
