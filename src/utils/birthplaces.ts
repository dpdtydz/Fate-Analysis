import { KOREAN_CITIES, WORLD_CITIES, City } from "@orrery/core";

export interface OverseasCity {
  name: string;
  country: string;
  lat: number;
  lon: number;
  utcOffset: number; // e.g. -5 for EST, +9 for JST
  standardMeridian: number; // utcOffset * 15
  hasDst?: boolean; // Typically observes DST (Summer time)
}

// 1. 국내 도시 (기존 지역 명칭 수정 반영)
export const KOREAN_CITIES_MODIFIED: City[] = KOREAN_CITIES.map((city) => {
  if (city.region === "전라남도" || city.region === "광주광역시") {
    return {
      ...city,
      region: "전남광주통합특별시",
    };
  }
  return city;
});

export const KOREAN_REGIONS = Array.from(
  new Set(KOREAN_CITIES_MODIFIED.map((c) => c.region || "기타"))
);

// 2. 해외 도시별 타임존 및 표준 자오선 매핑 테이블
const TIMEZONE_MAP: Record<
  string,
  { utcOffset: number; hasDst?: boolean }
> = {
  // 일본
  "도쿄": { utcOffset: 9, hasDst: false },
  "오사카": { utcOffset: 9, hasDst: false },
  "교토": { utcOffset: 9, hasDst: false },
  "후쿠오카": { utcOffset: 9, hasDst: false },
  "삿포로": { utcOffset: 9, hasDst: false },
  "나고야": { utcOffset: 9, hasDst: false },

  // 중국 / 대만 / 홍콩 / 몽골 / 북한
  "베이징": { utcOffset: 8, hasDst: false },
  "상하이": { utcOffset: 8, hasDst: false },
  "광저우": { utcOffset: 8, hasDst: false },
  "선전": { utcOffset: 8, hasDst: false },
  "청두": { utcOffset: 8, hasDst: false },
  "충칭": { utcOffset: 8, hasDst: false },
  "시안": { utcOffset: 8, hasDst: false },
  "홍콩": { utcOffset: 8, hasDst: false },
  "타이베이": { utcOffset: 8, hasDst: false },
  "울란바토르": { utcOffset: 8, hasDst: false },
  "평양": { utcOffset: 9, hasDst: false },

  // 동남아시아
  "방콕": { utcOffset: 7, hasDst: false },
  "하노이": { utcOffset: 7, hasDst: false },
  "호치민": { utcOffset: 7, hasDst: false },
  "다낭": { utcOffset: 7, hasDst: false },
  "자카르타": { utcOffset: 7, hasDst: false },
  "발리": { utcOffset: 8, hasDst: false },
  "싱가포르": { utcOffset: 8, hasDst: false },
  "쿠알라룸푸르": { utcOffset: 8, hasDst: false },
  "마닐라": { utcOffset: 8, hasDst: false },
  "세부": { utcOffset: 8, hasDst: false },
  "양곤": { utcOffset: 6.5, hasDst: false },
  "프놈펜": { utcOffset: 7, hasDst: false },
  "비엔티안": { utcOffset: 7, hasDst: false },

  // 남아시아
  "뉴델리": { utcOffset: 5.5, hasDst: false },
  "뭄바이": { utcOffset: 5.5, hasDst: false },
  "벵갈루루": { utcOffset: 5.5, hasDst: false },
  "다카": { utcOffset: 6, hasDst: false },
  "이슬라마바드": { utcOffset: 5, hasDst: false },
  "카라치": { utcOffset: 5, hasDst: false },
  "카트만두": { utcOffset: 5.75, hasDst: false },
  "콜롬보": { utcOffset: 5.5, hasDst: false },

  // 중앙/서아시아 / 중동
  "아스타나": { utcOffset: 5, hasDst: false },
  "알마티": { utcOffset: 5, hasDst: false },
  "타슈켄트": { utcOffset: 5, hasDst: false },
  "비슈케크": { utcOffset: 6, hasDst: false },
  "두샨베": { utcOffset: 5, hasDst: false },
  "아시가바트": { utcOffset: 5, hasDst: false },
  "테헤란": { utcOffset: 3.5, hasDst: false },
  "바그다드": { utcOffset: 3, hasDst: false },
  "리야드": { utcOffset: 3, hasDst: false },
  "제다": { utcOffset: 3, hasDst: false },
  "두바이": { utcOffset: 4, hasDst: false },
  "아부다비": { utcOffset: 4, hasDst: false },
  "도하": { utcOffset: 3, hasDst: false },
  "쿠웨이트시티": { utcOffset: 3, hasDst: false },
  "앙카라": { utcOffset: 3, hasDst: false },
  "이스탄불": { utcOffset: 3, hasDst: false },
  "텔아비브": { utcOffset: 2, hasDst: true },
  "예루살렘": { utcOffset: 2, hasDst: true },

  // 서유럽
  "런던": { utcOffset: 0, hasDst: true },
  "에든버러": { utcOffset: 0, hasDst: true },
  "맨체스터": { utcOffset: 0, hasDst: true },
  "파리": { utcOffset: 1, hasDst: true },
  "마르세유": { utcOffset: 1, hasDst: true },
  "리옹": { utcOffset: 1, hasDst: true },
  "베를린": { utcOffset: 1, hasDst: true },
  "뮌헨": { utcOffset: 1, hasDst: true },
  "함부르크": { utcOffset: 1, hasDst: true },
  "프랑크푸르트": { utcOffset: 1, hasDst: true },
  "암스테르담": { utcOffset: 1, hasDst: true },
  "브뤼셀": { utcOffset: 1, hasDst: true },
  "룩셈부르크": { utcOffset: 1, hasDst: true },

  // 남/중/북유럽
  "마드리드": { utcOffset: 1, hasDst: true },
  "바르셀로나": { utcOffset: 1, hasDst: true },
  "로마": { utcOffset: 1, hasDst: true },
  "밀라노": { utcOffset: 1, hasDst: true },
  "나폴리": { utcOffset: 1, hasDst: true },
  "리스본": { utcOffset: 0, hasDst: true },
  "아테네": { utcOffset: 2, hasDst: true },
  "빈": { utcOffset: 1, hasDst: true },
  "베른": { utcOffset: 1, hasDst: true },
  "취리히": { utcOffset: 1, hasDst: true },
  "제네바": { utcOffset: 1, hasDst: true },
  "프라하": { utcOffset: 1, hasDst: true },
  "바르샤바": { utcOffset: 1, hasDst: true },
  "크라쿠프": { utcOffset: 1, hasDst: true },
  "부다페스트": { utcOffset: 1, hasDst: true },
  "헬싱키": { utcOffset: 2, hasDst: true },
  "스톡홀름": { utcOffset: 1, hasDst: true },
  "오슬로": { utcOffset: 1, hasDst: true },
  "코펜하겐": { utcOffset: 1, hasDst: true },
  "레이캬비크": { utcOffset: 0, hasDst: false },
  "더블린": { utcOffset: 0, hasDst: true },

  // 동유럽 / 러시아
  "모스크바": { utcOffset: 3, hasDst: false },
  "상트페테르부르크": { utcOffset: 3, hasDst: false },
  "블라디보스토크": { utcOffset: 10, hasDst: false },
  "키이우": { utcOffset: 2, hasDst: true },
  "민스크": { utcOffset: 3, hasDst: false },

  // 북아메리카 (미국)
  "워싱턴 D.C.": { utcOffset: -5, hasDst: true },
  "뉴욕": { utcOffset: -5, hasDst: true },
  "보스턴": { utcOffset: -5, hasDst: true },
  "마이애미": { utcOffset: -5, hasDst: true },
  "애틀랜타": { utcOffset: -5, hasDst: true },
  "시카고": { utcOffset: -6, hasDst: true },
  "휴스턴": { utcOffset: -6, hasDst: true },
  "댈러스": { utcOffset: -6, hasDst: true },
  "덴버": { utcOffset: -7, hasDst: true },
  "로스앤젤레스": { utcOffset: -8, hasDst: true },
  "샌프란시스코": { utcOffset: -8, hasDst: true },
  "시애틀": { utcOffset: -8, hasDst: true },
  "라스베이거스": { utcOffset: -8, hasDst: true },
  "호놀룰루": { utcOffset: -10, hasDst: false },

  // 북아메리카 (캐나다 / 멕시코)
  "오타와": { utcOffset: -5, hasDst: true },
  "토론토": { utcOffset: -5, hasDst: true },
  "몬트리올": { utcOffset: -5, hasDst: true },
  "밴쿠버": { utcOffset: -8, hasDst: true },
  "멕시코시티": { utcOffset: -6, hasDst: false },
  "칸쿤": { utcOffset: -5, hasDst: false },

  // 남아메리카
  "상파울루": { utcOffset: -3, hasDst: false },
  "리우데자네이루": { utcOffset: -3, hasDst: false },
  "브라질리아": { utcOffset: -3, hasDst: false },
  "부에노스아이레스": { utcOffset: -3, hasDst: false },
  "산티아고": { utcOffset: -4, hasDst: true },
  "보고타": { utcOffset: -5, hasDst: false },
  "리마": { utcOffset: -5, hasDst: false },

  // 오세아니아
  "캔버라": { utcOffset: 10, hasDst: true },
  "시드니": { utcOffset: 10, hasDst: true },
  "멜버른": { utcOffset: 10, hasDst: true },
  "브리즈번": { utcOffset: 10, hasDst: false },
  "퍼스": { utcOffset: 8, hasDst: false },
  "웰링턴": { utcOffset: 12, hasDst: true },
  "오클랜드": { utcOffset: 12, hasDst: true },

  // 아프리카
  "카이로": { utcOffset: 2, hasDst: true },
  "요하네스버그": { utcOffset: 2, hasDst: false },
  "케이프타운": { utcOffset: 2, hasDst: false },
  "나이로비": { utcOffset: 3, hasDst: false },
};

const CUSTOM_UTC_CITIES: OverseasCity[] = [
  { name: "UTC-12 (날짜변경선 서쪽)", country: "기타 (표준시 UTC 직접 선택)", lat: 0, lon: -180, utcOffset: -12, standardMeridian: -180 },
  { name: "UTC-11 (미드웨이/사모아)", country: "기타 (표준시 UTC 직접 선택)", lat: -14.2, lon: -165, utcOffset: -11, standardMeridian: -165 },
  { name: "UTC-10 (하와이/호놀룰루)", country: "기타 (표준시 UTC 직접 선택)", lat: 21.3, lon: -150, utcOffset: -10, standardMeridian: -150 },
  { name: "UTC-9 (알래스카)", country: "기타 (표준시 UTC 직접 선택)", lat: 61.2, lon: -135, utcOffset: -9, standardMeridian: -135, hasDst: true },
  { name: "UTC-8 (미국/캐나다 서부 - LA, 밴쿠버)", country: "기타 (표준시 UTC 직접 선택)", lat: 34.0, lon: -120, utcOffset: -8, standardMeridian: -120, hasDst: true },
  { name: "UTC-7 (미국 산악 - 덴버, 피닉스)", country: "기타 (표준시 UTC 직접 선택)", lat: 39.7, lon: -105, utcOffset: -7, standardMeridian: -105, hasDst: true },
  { name: "UTC-6 (미국 중부, 멕시코 - 시카고, 휴스턴)", country: "기타 (표준시 UTC 직접 선택)", lat: 41.8, lon: -90, utcOffset: -6, standardMeridian: -90, hasDst: true },
  { name: "UTC-5 (미국/캐나다 동부 - 뉴욕, 토론토)", country: "기타 (표준시 UTC 직접 선택)", lat: 40.7, lon: -75, utcOffset: -5, standardMeridian: -75, hasDst: true },
  { name: "UTC-4 (칠레, 볼리비아, 대서양)", country: "기타 (표준시 UTC 직접 선택)", lat: -33.4, lon: -60, utcOffset: -4, standardMeridian: -60, hasDst: true },
  { name: "UTC-3 (브라질, 아르헨티나)", country: "기타 (표준시 UTC 직접 선택)", lat: -23.5, lon: -45, utcOffset: -3, standardMeridian: -45 },
  { name: "UTC-2 (대서양 중부)", country: "기타 (표준시 UTC 직접 선택)", lat: 0, lon: -30, utcOffset: -2, standardMeridian: -30 },
  { name: "UTC-1 (카보베르데, 아조레스)", country: "기타 (표준시 UTC 직접 선택)", lat: 14.9, lon: -15, utcOffset: -1, standardMeridian: -15 },
  { name: "UTC+0 (영국 런던, 아일랜드, 포르투갈)", country: "기타 (표준시 UTC 직접 선택)", lat: 51.5, lon: 0, utcOffset: 0, standardMeridian: 0, hasDst: true },
  { name: "UTC+1 (서/중유럽 - 프랑스, 독일, 이탈리아, 스페인)", country: "기타 (표준시 UTC 직접 선택)", lat: 48.8, lon: 15, utcOffset: 1, standardMeridian: 15, hasDst: true },
  { name: "UTC+2 (동유럽, 핀란드, 그리스, 이집트)", country: "기타 (표준시 UTC 직접 선택)", lat: 37.9, lon: 30, utcOffset: 2, standardMeridian: 30, hasDst: true },
  { name: "UTC+3 (러시아 모스크바, 사우디, 터키)", country: "기타 (표준시 UTC 직접 선택)", lat: 55.7, lon: 45, utcOffset: 3, standardMeridian: 45 },
  { name: "UTC+3:30 (이란 테헤란)", country: "기타 (표준시 UTC 직접 선택)", lat: 35.6, lon: 52.5, utcOffset: 3.5, standardMeridian: 52.5 },
  { name: "UTC+4 (UAE 두바이, 코카서스)", country: "기타 (표준시 UTC 직접 선택)", lat: 25.2, lon: 60, utcOffset: 4, standardMeridian: 60 },
  { name: "UTC+4:30 (아프가니스탄)", country: "기타 (표준시 UTC 직접 선택)", lat: 34.5, lon: 67.5, utcOffset: 4.5, standardMeridian: 67.5 },
  { name: "UTC+5 (파키스탄, 우즈베키스탄)", country: "기타 (표준시 UTC 직접 선택)", lat: 33.6, lon: 75, utcOffset: 5, standardMeridian: 75 },
  { name: "UTC+5:30 (인도, 스리랑카)", country: "기타 (표준시 UTC 직접 선택)", lat: 28.6, lon: 82.5, utcOffset: 5.5, standardMeridian: 82.5 },
  { name: "UTC+5:45 (네팔)", country: "기타 (표준시 UTC 직접 선택)", lat: 27.7, lon: 86.25, utcOffset: 5.75, standardMeridian: 86.25 },
  { name: "UTC+6 (방글라데시, 카자흐스탄)", country: "기타 (표준시 UTC 직접 선택)", lat: 23.8, lon: 90, utcOffset: 6, standardMeridian: 90 },
  { name: "UTC+6:30 (미얀마)", country: "기타 (표준시 UTC 직접 선택)", lat: 16.8, lon: 97.5, utcOffset: 6.5, standardMeridian: 97.5 },
  { name: "UTC+7 (태국 방콕, 베트남, 인도네시아)", country: "기타 (표준시 UTC 직접 선택)", lat: 13.7, lon: 105, utcOffset: 7, standardMeridian: 105 },
  { name: "UTC+8 (중국, 홍콩, 대만, 싱가포르, 서호주)", country: "기타 (표준시 UTC 직접 선택)", lat: 39.9, lon: 120, utcOffset: 8, standardMeridian: 120 },
  { name: "UTC+9 (일본, 동티모르)", country: "기타 (표준시 UTC 직접 선택)", lat: 35.6, lon: 135, utcOffset: 9, standardMeridian: 135 },
  { name: "UTC+9:30 (호주 중부 - 애들레이드, 다윈)", country: "기타 (표준시 UTC 직접 선택)", lat: -34.9, lon: 142.5, utcOffset: 9.5, standardMeridian: 142.5, hasDst: true },
  { name: "UTC+10 (호주 동부 - 시드니, 괌)", country: "기타 (표준시 UTC 직접 선택)", lat: -33.8, lon: 150, utcOffset: 10, standardMeridian: 150, hasDst: true },
  { name: "UTC+11 (솔로몬 제도, 바누아투)", country: "기타 (표준시 UTC 직접 선택)", lat: -9.4, lon: 165, utcOffset: 11, standardMeridian: 165 },
  { name: "UTC+12 (뉴질랜드, 피지)", country: "기타 (표준시 UTC 직접 선택)", lat: -36.8, lon: 180, utcOffset: 12, standardMeridian: 180, hasDst: true },
  { name: "UTC+13 (사모아, 통가)", country: "기타 (표준시 UTC 직접 선택)", lat: -13.8, lon: 195, utcOffset: 13, standardMeridian: 195 },
  { name: "UTC+14 (키리바시)", country: "기타 (표준시 UTC 직접 선택)", lat: 1.8, lon: 210, utcOffset: 14, standardMeridian: 210 },
];

// 3. 글로벌 해외 도시 통합 목록 생성
export const OVERSEAS_CITIES: OverseasCity[] = [
  ...WORLD_CITIES.map((c) => {
    const tz = TIMEZONE_MAP[c.name] || {
      utcOffset: Math.round(c.lon / 15),
      hasDst: false,
    };
    return {
      name: c.name,
      country: c.country || "기타 국가",
      lat: c.lat,
      lon: c.lon,
      utcOffset: tz.utcOffset,
      standardMeridian: tz.utcOffset * 15,
      hasDst: !!tz.hasDst,
    };
  }),
  ...CUSTOM_UTC_CITIES,
];

// 주요 추천 국가 (상단 우선 배치)
const POPULAR_COUNTRIES = [
  "미국",
  "일본",
  "중국",
  "캐나다",
  "호주",
  "영국",
  "프랑스",
  "독일",
  "베트남",
  "태국",
  "싱가포르",
  "필리핀",
  "대만",
  "뉴질랜드",
];

const OTHER_CUSTOM_COUNTRY = "기타 (표준시 UTC 직접 선택)";

// 정렬된 해외 국가 목록 (인기 국가 상단 -> 나머지 가나다순 -> 기타 표준시 직접 선택 맨 끝)
export const OVERSEAS_COUNTRIES = (() => {
  const allCountries = Array.from(new Set(OVERSEAS_CITIES.map((c) => c.country))).filter(
    (c) => c !== OTHER_CUSTOM_COUNTRY
  );
  const popular = POPULAR_COUNTRIES.filter((c) => allCountries.includes(c));
  const others = allCountries.filter((c) => !popular.includes(c)).sort((a, b) => a.localeCompare(b, "ko"));
  return [...popular, ...others, OTHER_CUSTOM_COUNTRY];
})();

/**
 * 주어진 국가/지역과 도시명으로 위치 정보(국내/해외 통합) 탐색
 */
export function findLocation(
  regionOrCountry?: string,
  cityName?: string
): {
  isOverseas: boolean;
  countryOrRegion: string;
  city: string;
  matchedCityObj?: {
    name: string;
    country?: string;
    lat: number;
    lon: number;
    standardMeridian?: number;
    hasDst?: boolean;
    isOverseas?: boolean;
  };
} {
  // 1. 해외 도시인지 확인
  if (regionOrCountry && OVERSEAS_COUNTRIES.includes(regionOrCountry)) {
    const citiesInCountry = OVERSEAS_CITIES.filter((c) => c.country === regionOrCountry);
    const matched = citiesInCountry.find((c) => c.name === cityName || c.name.includes(cityName || "")) || citiesInCountry[0];
    if (matched) {
      return {
        isOverseas: true,
        countryOrRegion: regionOrCountry,
        city: matched.name,
        matchedCityObj: { ...matched, isOverseas: true },
      };
    }
  }

  // 2. 도시명으로 해외 도시 검색
  if (cityName) {
    const overseasMatch = OVERSEAS_CITIES.find(
      (c) => c.name === cityName || (cityName.length >= 2 && c.name.includes(cityName))
    );
    if (overseasMatch) {
      return {
        isOverseas: true,
        countryOrRegion: overseasMatch.country,
        city: overseasMatch.name,
        matchedCityObj: { ...overseasMatch, isOverseas: true },
      };
    }
  }

  // 3. 국내 도시 탐색
  if (regionOrCountry) {
    const matchedRegion = KOREAN_REGIONS.find((r) => r.includes(regionOrCountry) || regionOrCountry.includes(r));
    if (matchedRegion) {
      const matchedCity = KOREAN_CITIES_MODIFIED.find(
        (c) => c.region === matchedRegion && (cityName ? c.name.includes(cityName) || cityName.includes(c.name) : true)
      );
      if (matchedCity) {
        return {
          isOverseas: false,
          countryOrRegion: matchedRegion,
          city: matchedCity.name,
          matchedCityObj: {
            name: matchedCity.name,
            lat: matchedCity.lat,
            lon: matchedCity.lon,
            standardMeridian: 135.0,
            isOverseas: false,
          },
        };
      }
      return {
        isOverseas: false,
        countryOrRegion: matchedRegion,
        city: "서울",
      };
    }
  }

  // 기본값 (서울)
  return {
    isOverseas: false,
    countryOrRegion: "서울특별시",
    city: "서울",
    matchedCityObj: {
      name: "서울",
      lat: 37.5665,
      lon: 126.978,
      standardMeridian: 135.0,
      isOverseas: false,
    },
  };
}
