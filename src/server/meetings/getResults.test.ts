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
import { getResults } from "./getMeeting.ts";

const MIGRATION = readFileSync("drizzle/0000_init.sql", "utf8");

test("getResults: 투표 집계·랭킹·제출 인원", async () => {
  const client = new PGlite();
  await client.exec(MIGRATION);
  const db = drizzle(client, { schema, casing: "snake_case" }) as unknown as Db;

  const { shareToken, meetingId } = await createMeeting(db, {
    title: "모임",
    type: "DATE_PLACE",
    dates: ["2026-07-01", "2026-07-02"],
    places: [{ name: "A" }, { name: "B" }],
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
  const d1 = opts.find((o) => o.date === "2026-07-01")!;
  const d2 = opts.find((o) => o.date === "2026-07-02")!;
  const a = pls.find((p) => p.name === "A")!;

  // 민지: d1=YES, d2=MAYBE, A 좋아요 / 현우: d1=YES, A 좋아요
  await submitResponse(db, {
    shareToken,
    nickname: "민지",
    dateVotes: [
      { dateOptionId: d1.id, vote: "YES" },
      { dateOptionId: d2.id, vote: "MAYBE" },
    ],
    placeLikes: [a.id],
  });
  await submitResponse(db, {
    shareToken,
    nickname: "현우",
    dateVotes: [{ dateOptionId: d1.id, vote: "YES" }],
    placeLikes: [a.id],
  });

  const r = await getResults(db, shareToken);
  assert.ok(r);
  assert.equal(r!.submittedCount, 2);
  // d1(YES2 → score4)이 d2(MAYBE1 → score1)보다 상위
  assert.equal(r!.dateResults[0].id, d1.id);
  assert.equal(r!.dateResults[0].yes, 2);
  // 장소 A(2)가 1위
  assert.equal(r!.placeResults[0].name, "A");
  assert.equal(r!.placeResults[0].likes, 2);
});
