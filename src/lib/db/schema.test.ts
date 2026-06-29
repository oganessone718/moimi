import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";

import * as schema from "./schema.ts";
import { generateShareToken } from "../tokens.ts";

// 생성된 마이그레이션을 인메모리 Postgres(pglite)에 적용해 제약을 실제로 검증.
const MIGRATION = readFileSync("drizzle/0000_init.sql", "utf8");

async function freshDb() {
  const client = new PGlite();
  await client.exec(MIGRATION);
  return drizzle(client, { schema, casing: "snake_case" });
}

async function newMeeting(db: Awaited<ReturnType<typeof freshDb>>) {
  const [m] = await db
    .insert(schema.meetings)
    .values({ title: "모임", type: "DATE_PLACE", shareToken: generateShareToken() })
    .returning();
  return m;
}

test("기본값: status=OPEN, timezone=Asia/Seoul, 불리언 기본값", async () => {
  const db = await freshDb();
  const m = await newMeeting(db);
  assert.equal(m.status, "OPEN");
  assert.equal(m.timezone, "Asia/Seoul");
  assert.equal(m.allowGuestAddPlace, true);
  assert.equal(m.anonymousVote, false);
  assert.ok(m.createdAt instanceof Date);
});

test("중복 투표 차단: (dateOption, participant) unique", async () => {
  const db = await freshDb();
  const m = await newMeeting(db);
  const [p] = await db
    .insert(schema.participants)
    .values({ meetingId: m.id, displayName: "가" })
    .returning();
  const [d] = await db
    .insert(schema.dateOptions)
    .values({ meetingId: m.id, date: "2026-07-01" })
    .returning();

  await db
    .insert(schema.dateVotes)
    .values({ dateOptionId: d.id, participantId: p.id, vote: "YES" });

  await assert.rejects(() =>
    db
      .insert(schema.dateVotes)
      .values({ dateOptionId: d.id, participantId: p.id, vote: "NO" }),
  );
});

test("FK cascade: 모임 삭제 시 자식(참가자/날짜/투표) 삭제", async () => {
  const db = await freshDb();
  const m = await newMeeting(db);
  const [p] = await db
    .insert(schema.participants)
    .values({ meetingId: m.id, displayName: "가" })
    .returning();
  const [d] = await db
    .insert(schema.dateOptions)
    .values({ meetingId: m.id, date: "2026-07-01" })
    .returning();
  await db
    .insert(schema.dateVotes)
    .values({ dateOptionId: d.id, participantId: p.id, vote: "YES" });

  await db.delete(schema.meetings).where(eq(schema.meetings.id, m.id));

  const ps = await db
    .select()
    .from(schema.participants)
    .where(eq(schema.participants.meetingId, m.id));
  const dv = await db.select().from(schema.dateVotes);
  assert.equal(ps.length, 0);
  assert.equal(dv.length, 0);
});

test("guestKey 부분 unique: 같은 모임 동일 guestKey 차단, null은 다중 허용", async () => {
  const db = await freshDb();
  const m = await newMeeting(db);
  await db
    .insert(schema.participants)
    .values({ meetingId: m.id, displayName: "가", guestKey: "k1" });

  await assert.rejects(() =>
    db
      .insert(schema.participants)
      .values({ meetingId: m.id, displayName: "나", guestKey: "k1" }),
  );

  // guestKey null 은 여러 명 허용(부분 인덱스라 null 제외)
  await db
    .insert(schema.participants)
    .values({ meetingId: m.id, displayName: "다" });
  await db
    .insert(schema.participants)
    .values({ meetingId: m.id, displayName: "라" });
});
