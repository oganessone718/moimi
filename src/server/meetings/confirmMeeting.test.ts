import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";

import * as schema from "../../lib/db/schema.ts";
import type { Db } from "../../lib/db/index.ts";
import { createMeeting } from "./createMeeting.ts";
import { confirmMeeting } from "./confirmMeeting.ts";

const MIGRATION = readFileSync("drizzle/0000_init.sql", "utf8");

test("confirmMeeting: 틀린 PIN 거부, 맞으면 확정·마감", async () => {
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
  const [place] = await db
    .select()
    .from(schema.places)
    .where(eq(schema.places.meetingId, meetingId));

  const wrong = await confirmMeeting(db, { shareToken, adminPin: "0000" });
  assert.equal(wrong.ok, false);

  const ok = await confirmMeeting(db, {
    shareToken,
    adminPin: "1234",
    dateOptionId: opt.id,
    placeId: place.id,
  });
  assert.equal(ok.ok, true);

  const [m] = await db
    .select()
    .from(schema.meetings)
    .where(eq(schema.meetings.id, meetingId));
  assert.equal(m.status, "CONFIRMED");
  assert.equal(m.confirmedSlotId, opt.id);
  assert.equal(m.confirmedPlaceId, place.id);
});
