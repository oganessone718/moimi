import { randomBytes } from "node:crypto";

// 게스트 진입 토큰. 128bit(16바이트) 랜덤 → base64url 22자. 추측 불가(PLAN §4.3).
export function generateShareToken(): string {
  return randomBytes(16).toString("base64url");
}

// 게스트 본인 식별 키(localStorage 매칭, best-effort). 충돌 회피 위해 128bit.
export function generateGuestKey(): string {
  return randomBytes(16).toString("base64url");
}
