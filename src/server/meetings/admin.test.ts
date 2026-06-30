import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";

import * as schema from "../../lib/db/schema.ts";
import type { Db } from "../../lib/db/index.ts";
import { createMeeting } from "./createMeeting.ts";
import {
  addDateOption,
  deleteDateOption,
  addPlace,
  deletePlace,
  setMeetingLocked,
} from "./admin.ts";

const MIGRATION = readFileSync("drizzle/0000_init.sql", "utf8");

test("admin: 후보 추가/삭제(중복 무시), 마감 토글", async () => {
  const client = new PGlite();
  await client.exec(MIGRATION);
  const db = drizzle(client, { schema, casing: "snake_case" }) as unknown as Db;
  const { meetingId } = await createMeeting(db, {
    title: "모임",
    type: "DATE_PLACE",
    dates: ["2026-07-01"],
    places: [],
    adminPin: "1234",
  });

  await addDateOption(db, meetingId, "2026-07-02");
  await addDateOption(db, meetingId, "2026-07-01"); // 중복 → 무시
  let opts = await db
    .select()
    .from(schema.dateOptions)
    .where(eq(schema.dateOptions.meetingId, meetingId));
  assert.equal(opts.length, 2);

  await deleteDateOption(db, meetingId, opts[0].id);
  opts = await db
    .select()
    .from(schema.dateOptions)
    .where(eq(schema.dateOptions.meetingId, meetingId));
  assert.equal(opts.length, 1);

  await addPlace(db, meetingId, "감자집");
  await addPlace(db, meetingId, "   "); // 공백 → 무시
  let pls = await db
    .select()
    .from(schema.places)
    .where(eq(schema.places.meetingId, meetingId));
  assert.equal(pls.length, 1);
  await deletePlace(db, meetingId, pls[0].id);
  pls = await db
    .select()
    .from(schema.places)
    .where(eq(schema.places.meetingId, meetingId));
  assert.equal(pls.length, 0);

  await setMeetingLocked(db, meetingId, true);
  let [m] = await db.select().from(schema.meetings).where(eq(schema.meetings.id, meetingId));
  assert.equal(m.status, "CLOSED");
  await setMeetingLocked(db, meetingId, false);
  [m] = await db.select().from(schema.meetings).where(eq(schema.meetings.id, meetingId));
  assert.equal(m.status, "OPEN");
});
