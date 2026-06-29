import { test } from "node:test";
import assert from "node:assert/strict";

import { hashPin, verifyPin } from "./pin.ts";
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "./adminSession.ts";
import {
  backoffDelayMs,
  checkLockout,
  recordFailure,
  INITIAL_LOCKOUT,
  MAX_FREE_ATTEMPTS,
  MAX_DELAY_MS,
} from "./lockout.ts";
import {
  authenticateAdmin,
  DEFAULT_TTL_MS,
} from "./authenticateAdmin.ts";

// ---------- PIN 해시 ----------
test("hashPin: 같은 PIN이라도 솔트로 매번 다른 해시", () => {
  const a = hashPin("1234");
  const b = hashPin("1234");
  assert.notEqual(a, b);
  assert.ok(a.startsWith("scrypt$"));
});

test("verifyPin: 올바른 PIN 통과, 틀린 PIN 거부", () => {
  const stored = hashPin("4827");
  assert.equal(verifyPin("4827", stored), true);
  assert.equal(verifyPin("4828", stored), false);
  assert.equal(verifyPin("", stored), false);
});

test("verifyPin: 깨진 저장 포맷은 거부 (throw 없이 false)", () => {
  assert.equal(verifyPin("1234", "garbage"), false);
  assert.equal(verifyPin("1234", "scrypt$1$2$3"), false);
  assert.equal(verifyPin("1234", ""), false);
});

test("verifyPin: 유니코드 정규화(NFKC) 일관", () => {
  // 전각 숫자 vs 반각 숫자 — NFKC로 동일 취급
  const stored = hashPin("1234");
  assert.equal(verifyPin("１２３４", stored), true);
});

// ---------- TTL 서명 토큰 ----------
const SECRET = "test-secret-please-use-32B-in-prod";

test("admin 토큰: 발급 후 검증 성공, 페이로드 복원", () => {
  const exp = 1_000_000 + DEFAULT_TTL_MS;
  const token = createAdminSessionToken({ meetingId: "m1", exp }, SECRET);
  const session = verifyAdminSessionToken(token, SECRET, 1_000_000);
  assert.deepEqual(session, { meetingId: "m1", exp });
});

test("admin 토큰: 만료되면 null", () => {
  const now = 1_000_000;
  const token = createAdminSessionToken(
    { meetingId: "m1", exp: now + 10 },
    SECRET,
  );
  assert.equal(verifyAdminSessionToken(token, SECRET, now + 11), null);
});

test("admin 토큰: 다른 시크릿이면 null", () => {
  const token = createAdminSessionToken(
    { meetingId: "m1", exp: 9_999_999_999_999 },
    SECRET,
  );
  assert.equal(verifyAdminSessionToken(token, "other-secret", 0), null);
});

test("admin 토큰: 페이로드 위변조 시 null", () => {
  const exp = 9_999_999_999_999;
  const token = createAdminSessionToken({ meetingId: "m1", exp }, SECRET);
  const tampered = createAdminSessionToken({ meetingId: "EVIL", exp }, SECRET)
    .split(".")[0]
    .concat(".", token.split(".")[1]); // 다른 페이로드 + 원래 서명
  assert.equal(verifyAdminSessionToken(tampered, SECRET, 0), null);
});

test("admin 토큰: 형식 깨짐은 null", () => {
  assert.equal(verifyAdminSessionToken("no-dot", SECRET, 0), null);
  assert.equal(verifyAdminSessionToken(".sig", SECRET, 0), null);
  assert.equal(verifyAdminSessionToken("payload.", SECRET, 0), null);
});

// ---------- 백오프/잠금 ----------
test("backoff: 무료 시도까지 0, 이후 지수 증가, 상한 적용", () => {
  assert.equal(backoffDelayMs(0), 0);
  assert.equal(backoffDelayMs(MAX_FREE_ATTEMPTS - 1), 0);
  assert.equal(backoffDelayMs(MAX_FREE_ATTEMPTS), 1_000);
  assert.equal(backoffDelayMs(MAX_FREE_ATTEMPTS + 1), 2_000);
  assert.equal(backoffDelayMs(MAX_FREE_ATTEMPTS + 2), 4_000);
  assert.equal(backoffDelayMs(MAX_FREE_ATTEMPTS + 100), MAX_DELAY_MS);
});

test("checkLockout: 지연 중이면 locked + 남은시간, 지나면 해제", () => {
  const state = recordFailure(
    { failedAttempts: MAX_FREE_ATTEMPTS, lastFailedAt: null },
    1_000,
  );
  // failedAttempts=6 → delay 2000ms
  const locked = checkLockout(state, 1_500); // 500ms 경과
  assert.equal(locked.locked, true);
  assert.equal(locked.retryAfterMs, 1_500);

  const freed = checkLockout(state, 1_000 + 2_000 + 1);
  assert.equal(freed.locked, false);
});

// ---------- 오케스트레이션 ----------
test("authenticateAdmin: 올바른 PIN → ok + 검증 가능한 토큰", () => {
  const pinHash = hashPin("1234");
  const now = 1_000_000;
  const r = authenticateAdmin({
    pin: "1234",
    pinHash,
    lockout: INITIAL_LOCKOUT,
    secret: SECRET,
    meetingId: "m1",
    now,
  });
  assert.equal(r.status, "ok");
  if (r.status === "ok") {
    assert.equal(r.expiresAt, now + DEFAULT_TTL_MS);
    const session = verifyAdminSessionToken(r.token, SECRET, now);
    assert.equal(session?.meetingId, "m1");
  }
});

test("authenticateAdmin: 틀린 PIN → wrong_pin + 실패 누적", () => {
  const pinHash = hashPin("1234");
  const r = authenticateAdmin({
    pin: "9999",
    pinHash,
    lockout: { failedAttempts: 2, lastFailedAt: 100 },
    secret: SECRET,
    meetingId: "m1",
    now: 500,
  });
  assert.equal(r.status, "wrong_pin");
  if (r.status === "wrong_pin") {
    assert.equal(r.nextLockout.failedAttempts, 3);
    assert.equal(r.nextLockout.lastFailedAt, 500);
  }
});

test("authenticateAdmin: 잠금 중이면 PIN 맞아도 locked (검증 자체를 차단)", () => {
  const pinHash = hashPin("1234");
  const now = 1_000;
  const r = authenticateAdmin({
    pin: "1234", // 올바른 PIN이라도
    pinHash,
    lockout: { failedAttempts: MAX_FREE_ATTEMPTS + 1, lastFailedAt: now }, // delay 2000ms
    secret: SECRET,
    meetingId: "m1",
    now: now + 100,
  });
  assert.equal(r.status, "locked");
  if (r.status === "locked") assert.ok(r.retryAfterMs > 0);
});
