import { asc, eq } from "drizzle-orm";
import type { Db } from "../../lib/db/index.ts";
import { meetings, dateOptions, places } from "../../lib/db/schema.ts";

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
