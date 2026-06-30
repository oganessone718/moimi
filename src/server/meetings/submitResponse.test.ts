import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";

import * as schema from "../../lib/db/schema.ts";
import type { Db } from "../../lib/db/index.ts";
import { createMeeting } from "./createMeeting.ts";
import { submitResponse } from "./submitResponse.ts";

const MIGRATION = readFileSync("drizzle/0000_init.sql", "utf8");

async function setup() {
  const client = new PGlite();
  await client.exec(MIGRATION);
  const db = drizzle(client, { schema, casing: "snake_case" }) as unknown as Db;
  const { shareToken, meetingId } = await createMeeting(db, {
    title: "모임",
    type: "DATE_PLACE",
    dates: ["2026-07-01", "2026-07-02"],
    places: [{ name: "감자집" }],
    adminPin: "1234",
  });
  const opts = await db
    .select()
    .from(schema.dateOptions)
    .where(eq(schema.dateOptions.meetingId, meetingId));
  const pls = await db
    .select()
    .from(schema.places)
    .where(eq(schema.places.meetingId, meetingId));
  return { db, shareToken, meetingId, opts, pls };
}

test("submitResponse: 신규 게스트 응답 저장(투표·좋아요)", async () => {
  const { db, shareToken, opts, pls } = await setup();
  const res = await submitResponse(db, {
    shareToken,
    nickname: "민지",
    dateVotes: [{ dateOptionId: opts[0].id, vote: "YES" }],
    placeLikes: [pls[0].id],
  });
  assert.equal(res.ok, true);

  const votes = await db.select().from(schema.dateVotes);
  const pv = await db.select().from(schema.placeVotes);
  assert.equal(votes.length, 1);
  assert.equal(votes[0].vote, "YES");
  assert.equal(pv.length, 1);
});

test("submitResponse: 같은 닉네임 재제출 시 덮어쓰기(PIN 미설정)", async () => {
  const { db, shareToken, opts } = await setup();
  await submitResponse(db, {
    shareToken,
    nickname: "민지",
    dateVotes: [{ dateOptionId: opts[0].id, vote: "YES" }],
    placeLikes: [],
  });
  await submitResponse(db, {
    shareToken,
    nickname: "민지",
    dateVotes: [
      { dateOptionId: opts[0].id, vote: "NO" },
      { dateOptionId: opts[1].id, vote: "YES" },
    ],
    placeLikes: [],
  });
  const parts = await db.select().from(schema.participants);
  const votes = await db.select().from(schema.dateVotes);
  assert.equal(parts.length, 1); // 동일 참가자
  assert.equal(votes.length, 2); // 이전 투표 대체
});

test("submitResponse: PIN 보호 닉네임 — 틀린 PIN 거부, 맞으면 통과", async () => {
  const { db, shareToken, opts } = await setup();
  await submitResponse(db, {
    shareToken,
    nickname: "현우",
    editPin: "5678",
    dateVotes: [{ dateOptionId: opts[0].id, vote: "YES" }],
    placeLikes: [],
  });
  const wrong = await submitResponse(db, {
    shareToken,
    nickname: "현우",
    editPin: "0000",
    dateVotes: [{ dateOptionId: opts[0].id, vote: "NO" }],
    placeLikes: [],
  });
  assert.equal(wrong.ok, false);
  if (!wrong.ok) assert.equal(wrong.reason, "pin_mismatch");

  const right = await submitResponse(db, {
    shareToken,
    nickname: "현우",
    editPin: "5678",
    dateVotes: [{ dateOptionId: opts[0].id, vote: "MAYBE" }],
    placeLikes: [],
  });
  assert.equal(right.ok, true);
});
