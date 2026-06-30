"use server";

import { getDb } from "@/lib/db";
import {
  createMeeting,
  type CreateMeetingInput,
  type CreateMeetingResult,
} from "./createMeeting";
import {
  submitResponse,
  type SubmitResponseInput,
  type SubmitResponseResult,
} from "./submitResponse";
import {
  confirmMeeting,
  type ConfirmMeetingInput,
  type ConfirmMeetingResult,
} from "./confirmMeeting";
import { eq } from "drizzle-orm";
import { meetings } from "@/lib/db/schema";
import * as admin from "./admin";
import { authenticateAdmin, DEFAULT_TTL_MS } from "@/server/auth/authenticateAdmin";
import { INITIAL_LOCKOUT } from "@/server/auth/lockout";
import { getAdminSession, setAdminCookie } from "@/lib/auth/admin-cookie";

export async function createMeetingAction(
  input: CreateMeetingInput,
): Promise<CreateMeetingResult> {
  return createMeeting(getDb(), input);
}

export async function submitResponseAction(
  input: SubmitResponseInput,
): Promise<SubmitResponseResult> {
  return submitResponse(getDb(), input);
}

export async function confirmMeetingAction(
  input: ConfirmMeetingInput,
): Promise<ConfirmMeetingResult> {
  return confirmMeeting(getDb(), input);
}

// ---------- 관리자 모드 (TTL 서명 쿠키, PoC④) ----------

async function loadMeeting(shareToken: string) {
  const [m] = await getDb()
    .select()
    .from(meetings)
    .where(eq(meetings.shareToken, shareToken));
  return m ?? null;
}

export type AdminAuthResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "no_admin_pin" | "wrong_pin" | "locked" };

export async function verifyAdminPinAction(
  shareToken: string,
  pin: string,
): Promise<AdminAuthResult> {
  const m = await loadMeeting(shareToken);
  if (!m) return { ok: false, reason: "not_found" };
  if (!m.adminPinHash) return { ok: false, reason: "no_admin_pin" };

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");

  // 백오프·잠금 영속화(lockout 상태 컬럼)는 후속 — 지금은 매 시도 INITIAL.
  const r = authenticateAdmin({
    pin,
    pinHash: m.adminPinHash,
    lockout: INITIAL_LOCKOUT,
    secret,
    meetingId: m.id,
  });
  if (r.status === "ok") {
    await setAdminCookie(m.id, r.token, DEFAULT_TTL_MS);
    return { ok: true };
  }
  if (r.status === "locked") return { ok: false, reason: "locked" };
  return { ok: false, reason: "wrong_pin" };
}

async function requireAdmin(shareToken: string) {
  const m = await loadMeeting(shareToken);
  if (!m) return null;
  const session = await getAdminSession(m.id);
  if (!session || session.meetingId !== m.id) return null;
  return m;
}

export async function isAdminAction(shareToken: string): Promise<boolean> {
  return (await requireAdmin(shareToken)) !== null;
}

export async function adminAddDateAction(shareToken: string, date: string) {
  const m = await requireAdmin(shareToken);
  if (!m) throw new Error("unauthorized");
  await admin.addDateOption(getDb(), m.id, date);
}

export async function adminDeleteDateAction(shareToken: string, optionId: string) {
  const m = await requireAdmin(shareToken);
  if (!m) throw new Error("unauthorized");
  await admin.deleteDateOption(getDb(), m.id, optionId);
}

export async function adminAddPlaceAction(shareToken: string, name: string) {
  const m = await requireAdmin(shareToken);
  if (!m) throw new Error("unauthorized");
  await admin.addPlace(getDb(), m.id, name);
}

export async function adminDeletePlaceAction(shareToken: string, placeId: string) {
  const m = await requireAdmin(shareToken);
  if (!m) throw new Error("unauthorized");
  await admin.deletePlace(getDb(), m.id, placeId);
}

export async function adminSetLockAction(shareToken: string, locked: boolean) {
  const m = await requireAdmin(shareToken);
  if (!m) throw new Error("unauthorized");
  await admin.setMeetingLocked(getDb(), m.id, locked);
}

export async function adminConfirmAction(
  shareToken: string,
  dateOptionId: string | null,
  placeId: string | null,
) {
  const m = await requireAdmin(shareToken);
  if (!m) throw new Error("unauthorized");
  await admin.setConfirmed(getDb(), m.id, dateOptionId, placeId);
}
