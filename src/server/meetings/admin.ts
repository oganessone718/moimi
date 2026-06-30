import { and, eq } from "drizzle-orm";
import type { Db } from "../../lib/db/index.ts";
import { meetings, dateOptions, places } from "../../lib/db/schema.ts";

// 관리자 후보 편집/마감 (도메인). 인가는 액션 레이어(TTL 서명 쿠키, PoC④)에서.
// 모든 변경은 meetingId 스코프로 제한.

export async function addDateOption(db: Db, meetingId: string, date: string) {
  await db
    .insert(dateOptions)
    .values({ meetingId, date })
    .onConflictDoNothing(); // unique(meetingId, date)
}

export async function deleteDateOption(db: Db, meetingId: string, optionId: string) {
  await db
    .delete(dateOptions)
    .where(and(eq(dateOptions.id, optionId), eq(dateOptions.meetingId, meetingId)));
}

export async function addPlace(db: Db, meetingId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  await db.insert(places).values({ meetingId, name: trimmed });
}

export async function deletePlace(db: Db, meetingId: string, placeId: string) {
  await db
    .delete(places)
    .where(and(eq(places.id, placeId), eq(places.meetingId, meetingId)));
}

// 마감 토글 (OPEN <-> CLOSED).
export async function setMeetingLocked(db: Db, meetingId: string, locked: boolean) {
  await db
    .update(meetings)
    .set({ status: locked ? "CLOSED" : "OPEN", lastActiveAt: new Date() })
    .where(eq(meetings.id, meetingId));
}

// 최종 확정 (관리자 세션 인가 후). PIN 검증형은 confirmMeeting 참고.
export async function setConfirmed(
  db: Db,
  meetingId: string,
  dateOptionId: string | null,
  placeId: string | null,
) {
  await db
    .update(meetings)
    .set({
      status: "CONFIRMED",
      confirmedSlotId: dateOptionId,
      confirmedPlaceId: placeId,
      lastActiveAt: new Date(),
    })
    .where(eq(meetings.id, meetingId));
}
