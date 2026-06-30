import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";

import * as schema from "../../lib/db/schema.ts";
import type { Db } from "../../lib/db/index.ts";
import { createMeeting } from "./createMeeting.ts";
import { verifyPin } from "../auth/pin.ts";

const MIGRATION = readFileSync("drizzle/0000_init.sql", "utf8");

async function freshDb() {
  const client = new PGlite();
  await client.exec(MIGRATION);
  return drizzle(client, { schema, casing: "snake_case" });
}

test("createMeeting: 모임+날짜+장소 저장, shareToken·adminPin 해시", async () => {
  const db = await freshDb();
  const res = await createMeeting(db as unknown as Db, {
    title: "이번 주 동아리 모임",
    type: "DATE_PLACE",
    dates: ["2026-07-01", "2026-07-02", "2026-07-01"], // 중복 제거 확인
    places: [{ name: "연남동 감자집" }, { name: "" }], // 빈 이름 무시
    adminPin: "1234",
  });

  assert.equal(res.shareToken.length, 22); // 128bit base64url

  const [m] = await db
    .select()
    .from(schema.meetings)
    .where(eq(schema.meetings.id, res.meetingId));
  assert.equal(m.title, "이번 주 동아리 모임");
  assert.equal(m.type, "DATE_PLACE");
  assert.equal(m.status, "OPEN");
  assert.ok(m.adminPinHash && verifyPin("1234", m.adminPinHash));

  const dOpts = await db
    .select()
    .from(schema.dateOptions)
    .where(eq(schema.dateOptions.meetingId, res.meetingId));
  assert.equal(dOpts.length, 2); // 중복 제거

  const pls = await db
    .select()
    .from(schema.places)
    .where(eq(schema.places.meetingId, res.meetingId));
  assert.equal(pls.length, 1); // 빈 이름 제외
  assert.equal(pls[0].name, "연남동 감자집");
});

test("createMeeting: 무가입인데 adminPin 없으면 거부", async () => {
  const db = await freshDb();
  await assert.rejects(() =>
    createMeeting(db as unknown as Db, {
      title: "x",
      type: "DATE",
      dates: [],
      places: [],
      adminPin: null,
    }),
  );
});
