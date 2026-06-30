import type { Db } from "../../lib/db/index.ts";
import { meetings, dateOptions, places } from "../../lib/db/schema.ts";
import { hashPin } from "../auth/pin.ts";
import { generateShareToken } from "../../lib/tokens.ts";

// 폴 생성 도메인 로직 (S2). db 주입 — pglite로 테스트 가능, 서버액션이 getDb()로 래핑.

export type CreateMeetingInput = {
  title: string;
  type: "DATE" | "PLACE" | "DATE_PLACE";
  dates: string[]; // 'YYYY-MM-DD'
  places: { name: string; description?: string; link?: string }[];
  adminPin: string | null; // 무가입 생성 시 필수(해시 저장). 로그인 생성이면 null 가능
  ownerUserId?: string | null;
  deadline?: string | null; // ISO date/datetime
  anonymousVote?: boolean;
  allowGuestAddPlace?: boolean;
};

export type CreateMeetingResult = { meetingId: string; shareToken: string };

export async function createMeeting(
  db: Db,
  input: CreateMeetingInput,
): Promise<CreateMeetingResult> {
  const title = input.title.trim();
  if (!title) throw new Error("title is required");
  // 무가입 생성은 관리자 PIN 필수(§2.1). 로그인 소유자면 생략 가능.
  if (!input.ownerUserId && !input.adminPin) {
    throw new Error("adminPin is required for guest-created meetings");
  }

  const shareToken = generateShareToken();
  const adminPinHash = input.adminPin ? hashPin(input.adminPin) : null;

  const [meeting] = await db
    .insert(meetings)
    .values({
      title,
      type: input.type,
      shareToken,
      adminPinHash,
      ownerUserId: input.ownerUserId ?? null,
      deadline: input.deadline ? new Date(input.deadline) : null,
      anonymousVote: input.anonymousVote ?? false,
      allowGuestAddPlace: input.allowGuestAddPlace ?? true,
    })
    .returning();

  const uniqueDates = [...new Set(input.dates)];
  if (uniqueDates.length > 0) {
    await db
      .insert(dateOptions)
      .values(uniqueDates.map((date) => ({ meetingId: meeting.id, date })));
  }

  if (input.places.length > 0) {
    await db.insert(places).values(
      input.places
        .filter((p) => p.name.trim())
        .map((p) => ({
          meetingId: meeting.id,
          name: p.name.trim(),
          link: p.link?.trim() || null,
        })),
    );
  }

  return { meetingId: meeting.id, shareToken };
}
