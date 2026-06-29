import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// PIN 해시/검증. 관리자 PIN(Meeting.adminPin)·게스트 응답 PIN(Participant.editPin) 공용.
// scrypt(메모리-하드 KDF) + 랜덤 솔트 + timing-safe 비교.
// 저장 포맷: scrypt$<N>$<r>$<p>$<saltBase64>$<hashBase64>

const KEY_LEN = 32;
const SALT_LEN = 16;
const PARAMS = { N: 16384, r: 8, p: 1 } as const; // 메모리 ≈ 128*N*r ≈ 16MB

export function hashPin(pin: string): string {
  const salt = randomBytes(SALT_LEN);
  const hash = scryptSync(pin.normalize("NFKC"), salt, KEY_LEN, PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString(
    "base64",
  )}$${hash.toString("base64")}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  if (expected.length === 0) return false;
  const actual = scryptSync(pin.normalize("NFKC"), salt, expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
