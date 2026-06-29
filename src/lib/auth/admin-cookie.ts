import { cookies } from "next/headers";
import { verifyAdminSessionToken } from "@/server/auth/adminSession";

// 관리자 TTL 서명 쿠키의 Next(next/headers) 연동 레이어.
// 서명/검증 로직은 server/auth 의 순수 함수에 위임하고, 여기서는 쿠키 입출력만 담당.

const COOKIE_PREFIX = "moimi_admin_";

function cookieName(meetingId: string): string {
  return `${COOKIE_PREFIX}${meetingId}`;
}

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET is not set");
  return s;
}

export async function setAdminCookie(
  meetingId: string,
  token: string,
  ttlMs: number,
): Promise<void> {
  const store = await cookies();
  store.set(cookieName(meetingId), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(ttlMs / 1000),
  });
}

// 현재 요청이 해당 모임의 유효한 관리자 세션을 가졌는지.
export async function getAdminSession(meetingId: string) {
  const store = await cookies();
  const token = store.get(cookieName(meetingId))?.value;
  if (!token) return null;
  return verifyAdminSessionToken(token, secret());
}

export async function clearAdminCookie(meetingId: string): Promise<void> {
  const store = await cookies();
  store.delete(cookieName(meetingId));
}
