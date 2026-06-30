import { and, eq } from "drizzle-orm";
import type { Db } from "../../lib/db/index.ts";
import {
  meetings,
  participants,
  dateVotes,
  placeVotes,
} from "../../lib/db/schema.ts";
import { hashPin, verifyPin } from "../auth/pin.ts";

// 게스트 응답 제출(S3). 본인 재식별 = 닉네임 + (선택)PIN 서버 검증(D6, When2meet식).
// editPin 미설정 참가자는 동명 덮어쓰기 허용(트레이드오프), 설정 시 PIN 일치 필수.

export type SubmitResponseInput = {
  shareToken: string;
  nickname: string;
  editPin?: string | null;
  guestKey?: string | null;
  dateVotes: { dateOptionId: string; vote: "YES" | "MAYBE" | "NO" }[];
  placeLikes: string[];
};

export type SubmitResponseResult =
  | { ok: true; participantId: string }
  | { ok: false; reason: "pin_mismatch" | "not_found" | "closed" };

export async function submitResponse(
  db: Db,
  input: SubmitResponseInput,
): Promise<SubmitResponseResult> {
  const nickname = input.nickname.trim();
  if (!nickname) throw new Error("nickname is required");

  const [meeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.shareToken, input.shareToken));
  if (!meeting) return { ok: false, reason: "not_found" };
  if (meeting.status !== "OPEN") return { ok: false, reason: "closed" };

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(participants)
      .where(
        and(
          eq(participants.meetingId, meeting.id),
          eq(participants.displayName, nickname),
        ),
      );

    let participantId: string;
    if (existing) {
      if (existing.editPinHash) {
        if (!input.editPin || !verifyPin(input.editPin, existing.editPinHash)) {
          return { ok: false as const, reason: "pin_mismatch" as const };
        }
      }
      participantId = existing.id;
      await tx
        .update(participants)
        .set({
          submitted: true,
          submittedAt: new Date(),
          guestKey: input.guestKey ?? existing.guestKey,
        })
        .where(eq(participants.id, participantId));
      await tx.delete(dateVotes).where(eq(dateVotes.participantId, participantId));
      await tx.delete(placeVotes).where(eq(placeVotes.participantId, participantId));
    } else {
      const [p] = await tx
        .insert(participants)
        .values({
          meetingId: meeting.id,
          displayName: nickname,
          editPinHash: input.editPin ? hashPin(input.editPin) : null,
          guestKey: input.guestKey ?? null,
          submitted: true,
          submittedAt: new Date(),
        })
        .returning();
      participantId = p.id;
    }

    if (input.dateVotes.length > 0) {
      await tx
        .insert(dateVotes)
        .values(
          input.dateVotes.map((v) => ({
            dateOptionId: v.dateOptionId,
            participantId,
            vote: v.vote,
          })),
        );
    }
    if (input.placeLikes.length > 0) {
      await tx
        .insert(placeVotes)
        .values(input.placeLikes.map((placeId) => ({ placeId, participantId })));
    }

    return { ok: true as const, participantId };
  });
}
