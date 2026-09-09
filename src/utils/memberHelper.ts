import { Member } from "../types";

/**
 * Member 사주 데이터 안전 추출 헬퍼 (Null-safe)
 */
export function getMemberGan(member?: Member | null): string {
  if (!member?.saju?.daymaster?.gan) return "갑";
  const g = member.saju.daymaster.gan;
  return g.length > 1 ? g[0] : g;
}

export function getMemberJi(member?: Member | null): string {
  if (!member?.saju?.pillars?.day?.ji) return "자";
  const j = member.saju.pillars.day.ji;
  return j.length > 1 ? j[0] : j;
}

export function getMemberYearJi(member?: Member | null): string {
  if (!member?.saju?.pillars?.year?.ji) return "자";
  const yj = member.saju.pillars.year.ji;
  return yj.length > 1 ? yj[0] : yj;
}

export function getMemberElement(member?: Member | null): string {
  const elem = member?.saju?.daymaster?.element;
  if (!elem) return "금";
  if (elem === "木" || elem === "wood") return "목";
  if (elem === "火" || elem === "fire") return "화";
  if (elem === "土" || elem === "earth") return "토";
  if (elem === "金" || elem === "metal") return "금";
  if (elem === "水" || elem === "water") return "수";
  return elem;
}

export function getMemberNickname(member?: Member | null, fallback = "익명"): string {
  return member?.nickname?.trim() || fallback;
}

export function getMemberMbti(member?: Member | null): string {
  const m = member?.mbti;
  return m && m !== "미입력" ? String(m).toUpperCase() : "";
}
