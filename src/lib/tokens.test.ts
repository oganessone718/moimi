import { test } from "node:test";
import assert from "node:assert/strict";

import { generateShareToken, generateGuestKey } from "./tokens.ts";

test("shareToken: 128bit → base64url 22자, charset 안전", () => {
  const t = generateShareToken();
  assert.equal(t.length, 22); // 16바이트 base64url(패딩 없음) = 22자
  assert.match(t, /^[A-Za-z0-9_-]+$/); // URL-safe, '+' '/' '=' 없음
});

test("shareToken/guestKey: 충돌 없음 (1000개 유일)", () => {
  const set = new Set<string>();
  for (let i = 0; i < 1000; i++) {
    set.add(generateShareToken());
    set.add(generateGuestKey());
  }
  assert.equal(set.size, 2000);
});
