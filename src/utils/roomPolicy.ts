/**
 * 방 보관 정책 예외
 *
 * 기본 정책: 방은 생성 후 30일이 지나면 만료되어 입장이 막힌다
 * (`expire_at`을 CreateView에서 저장하고, RoomView/GroupView가 검사한다).
 *
 * 아래 목록에 있는 방은 그 제약을 받지 않는다. 운영상 계속 열어두어야 하는
 * 방(시연용, 장기 운영 모임 등)을 위한 장치다.
 *
 * 예외 방에서는 푸터의 "30일 뒤 자동 삭제" 안내도 숨긴다 —
 * 적용되지 않는 정책을 안내하면 사용자가 잘못 알게 되기 때문이다.
 *
 * 주의: 이 목록은 "입장 만료"만 면제한다. 실제 데이터 삭제 배치는
 * 현재 코드베이스에 존재하지 않으므로(수동 더미 정리만 있음) 별도 영향은 없다.
 */
const NO_EXPIRE_ROOM_CODES = ["5KCU74"];

/** 방 코드를 정규화한다 (URL 대소문자 차이를 흡수) */
function normalize(code?: string | null): string {
  return (code || "").trim().toUpperCase();
}

/** 이 방이 30일 만료 제약을 면제받는가 */
export function isNoExpireRoom(code?: string | null): boolean {
  const c = normalize(code);
  return c !== "" && NO_EXPIRE_ROOM_CODES.includes(c);
}

/**
 * 현재 URL 해시에서 방 코드를 추출한다.
 * Footer처럼 라우팅 밖에 있는 컴포넌트가 방 맥락을 알아야 할 때 쓴다.
 *
 * App.tsx의 라우팅과 같은 형태를 따른다 — 방 경로는 전부 `/room/{6자리}`로
 * 시작하고 뒤에 /join, /group, /me/{id}가 붙는다.
 * 예: "#/room/5KCU74", "#/room/5KCU74/group", "#/room/5KCU74/me/abc"
 */
export function getRoomCodeFromHash(hash?: string): string | null {
  const h = hash ?? (typeof window !== "undefined" ? window.location.hash : "");
  const m = h.match(/#\/room\/([A-Za-z0-9]{6})(?:[/?#]|$)/);
  return m ? m[1] : null;
}

/** 지금 보고 있는 화면이 만료 면제 방인가 */
export function isViewingNoExpireRoom(hash?: string): boolean {
  return isNoExpireRoom(getRoomCodeFromHash(hash));
}
