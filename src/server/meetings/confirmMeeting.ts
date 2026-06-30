import { eq } from "drizzle-orm";
import type { Db } from "../../lib/db/index.ts";
import { meetings } from "../../lib/db/schema.ts";
import { verifyPin } from "../auth/pin.ts";

// 주최자 확정(S6 일부). 관리자 PIN 검증 후 최종 날짜/장소 확정 + 마감.
// 참고: 전체 관리자 세션(TTL 쿠키·백오프 — PoC④)은 관리자 모드 UI와 함께 후속 연결.

export type ConfirmMeetingInput = {
  shareToken: string;
  adminPin: string;
  dateOptionId?: string | null;
  placeId?: string | null;
};

export type ConfirmMeetingResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "pin_mismatch" | "no_admin_pin" };

export async function confirmMeeting(
  db: Db,
  input: ConfirmMeetingInput,
): Promise<ConfirmMeetingResult> {
  const [meeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.shareToken, input.shareToken));
  if (!meeting) return { ok: false, reason: "not_found" };
  if (!meeting.adminPinHash) return { ok: false, reason: "no_admin_pin" };
  if (!verifyPin(input.adminPin, meeting.adminPinHash)) {
    return { ok: false, reason: "pin_mismatch" };
  }

  await db
    .update(meetings)
    .set({
      status: "CONFIRMED",
      confirmedSlotId: input.dateOptionId ?? null,
      confirmedPlaceId: input.placeId ?? null,
      lastActiveAt: new Date(),
    })
    .where(eq(meetings.id, meeting.id));

  return { ok: true };
}
