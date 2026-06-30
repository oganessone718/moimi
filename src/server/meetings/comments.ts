import { and, asc, eq } from "drizzle-orm";
import type { Db } from "../../lib/db/index.ts";
import { meetings, participants, comments } from "../../lib/db/schema.ts";

// 날짜/장소 댓글. 작성자 식별은 닉네임 find-or-create(캐주얼 — PIN 비요구).

export type CommentRow = {
  id: string;
  target: "DATE" | "PLACE";
  targetId: string;
  body: string;
  who: string;
};

export async function getComments(db: Db, meetingId: string): Promise<CommentRow[]> {
  return db
    .select({
      id: comments.id,
      target: comments.target,
      targetId: comments.targetId,
      body: comments.body,
      who: participants.displayName,
    })
    .from(comments)
    .innerJoin(participants, eq(comments.participantId, participants.id))
    .where(eq(comments.meetingId, meetingId))
    .orderBy(asc(comments.createdAt));
}

export type AddCommentInput = {
  shareToken: string;
  nickname: string;
  target: "DATE" | "PLACE";
  targetId: string;
  body: string;
};

export async function addComment(
  db: Db,
  input: AddCommentInput,
): Promise<{ ok: boolean }> {
  const body = input.body.trim();
  const nickname = input.nickname.trim();
  if (!body || !nickname) return { ok: false };

  const [meeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.shareToken, input.shareToken));
  if (!meeting) return { ok: false };

  let [p] = await db
    .select()
    .from(participants)
    .where(
      and(
        eq(participants.meetingId, meeting.id),
        eq(participants.displayName, nickname),
      ),
    );
  if (!p) {
    [p] = await db
      .insert(participants)
      .values({ meetingId: meeting.id, displayName: nickname })
      .returning();
  }

  await db.insert(comments).values({
    meetingId: meeting.id,
    participantId: p.id,
    target: input.target,
    targetId: input.targetId,
    body,
  });
  return { ok: true };
}
