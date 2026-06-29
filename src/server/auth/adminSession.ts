import { createHmac, timingSafeEqual } from "node:crypto";

// 관리자 PIN 검증 통과 후 발급하는 TTL 서명 토큰 (쿠키 값으로 저장).
// 형식: <payloadBase64url>.<hmacSha256Base64url>
// 서버만 아는 ADMIN_SESSION_SECRET 으로 서명 → 위변조 불가, 만료(exp) 자체 포함.

export type AdminSession = {
  meetingId: string;
  exp: number; // 만료 시각 (epoch ms)
};

function sign(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

export function createAdminSessionToken(
  session: AdminSession,
  secret: string,
): string {
  const payloadB64 = Buffer.from(JSON.stringify(session), "utf8").toString(
    "base64url",
  );
  return `${payloadB64}.${sign(payloadB64, secret)}`;
}

export function verifyAdminSessionToken(
  token: string,
  secret: string,
  now: number = Date.now(),
): AdminSession | null {
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;

  const payloadB64 = token.slice(0, dot);
  const sig = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(payloadB64, secret));
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) {
    return null;
  }

  let session: AdminSession;
  try {
    session = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as AdminSession;
  } catch {
    return null;
  }

  if (typeof session.meetingId !== "string" || session.meetingId === "") {
    return null;
  }
  if (typeof session.exp !== "number" || session.exp <= now) return null;

  return session;
}
