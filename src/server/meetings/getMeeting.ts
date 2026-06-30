import { asc, eq, inArray } from "drizzle-orm";
import type { Db } from "../../lib/db/index.ts";
import {
  meetings,
  dateOptions,
  places,
  dateVotes,
  placeVotes,
  participants,
} from "../../lib/db/schema.ts";

// shareToken으로 모임 + 날짜후보 + 장소후보 조회. 없으면 null.
export async function getMeetingByShareToken(db: Db, shareToken: string) {
  const [meeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.shareToken, shareToken));
  if (!meeting) return null;

  const [opts, pls] = await Promise.all([
    db
      .select()
      .from(dateOptions)
      .where(eq(dateOptions.meetingId, meeting.id))
      .orderBy(asc(dateOptions.date)),
    db.select().from(places).where(eq(places.meetingId, meeting.id)),
  ]);

  return { meeting, dateOptions: opts, places: pls };
}

// 결과 집계. 소규모 폴이라 표 전체를 읽어 JS에서 집계(단순·충분).
export async function getResults(db: Db, shareToken: string) {
  const base = await getMeetingByShareToken(db, shareToken);
  if (!base) return null;

  const optionIds = base.dateOptions.map((o) => o.id);
  const placeIds = base.places.map((p) => p.id);

  const [dVotes, pVotes, parts] = await Promise.all([
    optionIds.length
      ? db.select().from(dateVotes).where(inArray(dateVotes.dateOptionId, optionIds))
      : Promise.resolve([]),
    placeIds.length
      ? db.select().from(placeVotes).where(inArray(placeVotes.placeId, placeIds))
      : Promise.resolve([]),
    db.select().from(participants).where(eq(participants.meetingId, base.meeting.id)),
  ]);

  const dateResults = base.dateOptions
    .map((o) => {
      const vs = dVotes.filter((v) => v.dateOptionId === o.id);
      const yes = vs.filter((v) => v.vote === "YES").length;
      const maybe = vs.filter((v) => v.vote === "MAYBE").length;
      const no = vs.filter((v) => v.vote === "NO").length;
      return { id: o.id, date: o.date, yes, maybe, no, score: yes * 2 + maybe };
    })
    .sort((a, b) => b.score - a.score);

  const placeResults = base.places
    .map((p) => ({
      id: p.id,
      name: p.name,
      likes: pVotes.filter((v) => v.placeId === p.id).length,
    }))
    .sort((a, b) => b.likes - a.likes);

  return {
    meeting: base.meeting,
    dateResults,
    placeResults,
    submittedCount: parts.filter((p) => p.submitted).length,
    total: parts.length,
  };
}
