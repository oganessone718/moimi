import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";

import * as schema from "../../lib/db/schema.ts";
import type { Db } from "../../lib/db/index.ts";
import { createMeeting } from "./createMeeting.ts";
import { addComment, getComments } from "./comments.ts";

const MIGRATION = readFileSync("drizzle/0000_init.sql", "utf8");

test("comments: 추가/조회, 닉네임 find-or-create", async () => {
  const client = new PGlite();
  await client.exec(MIGRATION);
  const db = drizzle(client, { schema, casing: "snake_case" }) as unknown as Db;
  const { shareToken, meetingId } = await createMeeting(db, {
    title: "모임",
    type: "DATE_PLACE",
    dates: ["2026-07-01"],
    places: [{ name: "A" }],
    adminPin: "1234",
  });
  const [opt] = await db
    .select()
    .from(schema.dateOptions)
    .where(eq(schema.dateOptions.meetingId, meetingId));

  await addComment(db, {
    shareToken,
    nickname: "민지",
    target: "DATE",
    targetId: opt.id,
    body: "토요일 좋아요",
  });
  await addComment(db, {
    shareToken,
    nickname: "민지",
    target: "DATE",
    targetId: opt.id,
    body: "아니면 일요일도",
  });

  const list = await getComments(db, meetingId);
  assert.equal(list.length, 2);
  assert.equal(list[0].who, "민지");

  // 같은 닉네임 → 참가자 1명만
  const parts = await db.select().from(schema.participants);
  assert.equal(parts.length, 1);

  // 빈 본문 무시
  const r = await addComment(db, {
    shareToken,
    nickname: "현우",
    target: "DATE",
    targetId: opt.id,
    body: "   ",
  });
  assert.equal(r.ok, false);
});
