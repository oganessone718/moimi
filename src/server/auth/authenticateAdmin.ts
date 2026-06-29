import { verifyPin } from "./pin.ts";
import { createAdminSessionToken } from "./adminSession.ts";
import {
  checkLockout,
  recordFailure,
  type LockoutState,
} from "./lockout.ts";

// 관리자 PIN 인증 오케스트레이션 (순수 함수 — DB·쿠키와 분리).
// 호출부(S2 서버 액션)가 DB에서 pinHash·lockout 을 읽어 넣고,
// 결과에 따라 쿠키 발급(ok) / lockout 상태 저장(wrong_pin) / 거부(locked) 한다.

export const DEFAULT_TTL_MS = 4 * 60 * 60 * 1_000; // 4시간

export type AdminAuthResult =
  | { status: "ok"; token: string; expiresAt: number }
  | { status: "wrong_pin"; nextLockout: LockoutState }
  | { status: "locked"; retryAfterMs: number };

export function authenticateAdmin(params: {
  pin: string;
  pinHash: string;
  lockout: LockoutState;
  secret: string;
  meetingId: string;
  ttlMs?: number;
  now?: number;
}): AdminAuthResult {
  const now = params.now ?? Date.now();
  const ttlMs = params.ttlMs ?? DEFAULT_TTL_MS;

  const lock = checkLockout(params.lockout, now);
  if (lock.locked) {
    return { status: "locked", retryAfterMs: lock.retryAfterMs };
  }

  if (!verifyPin(params.pin, params.pinHash)) {
    return {
      status: "wrong_pin",
      nextLockout: recordFailure(params.lockout, now),
    };
  }

  const expiresAt = now + ttlMs;
  const token = createAdminSessionToken(
    { meetingId: params.meetingId, exp: expiresAt },
    params.secret,
  );
  return { status: "ok", token, expiresAt };
}
