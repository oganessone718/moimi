import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// moimi 데이터 모델 (PLAN §5). 컬럼은 TS camelCase → DB snake_case (drizzle casing 설정).
// 모든 시각은 UTC 저장(timestamptz). 시간대 표시는 viewer/Meeting.timezone 변환.

// ---------- enums ----------
// 디자인(CreateWizard) 기준 3종: 날짜+장소 / 날짜만 / 장소만.
// 시간(time-of-day) 조율은 type이 아니라 meetings.withTime 토글로 분리(MVP off, v1.1).
export const meetingType = pgEnum("meeting_type", ["DATE", "PLACE", "DATE_PLACE"]);
export const meetingStatus = pgEnum("meeting_status", [
  "OPEN",
  "CLOSED",
  "CONFIRMED",
]);
export const voteValue = pgEnum("vote_value", ["YES", "MAYBE", "NO"]);
export const commentTarget = pgEnum("comment_target", ["DATE", "PLACE"]);

const ts = () => timestamp({ withTimezone: true });

// ---------- profiles ----------
// 로그인 사용자(S9). id 는 Supabase auth.users.id 와 1:1 (가입 시 트리거로 생성).
// 지금은 독립 테이블 — auth.users FK 는 S9에서 연결. provider 는 비-enum(D12).
export const profiles = pgTable("profiles", {
  id: uuid().primaryKey().defaultRandom(),
  email: text(),
  displayName: text(),
  avatarUrl: text(),
  provider: text(), // 'kakao' | 'google' | ... (확장형, enum으로 잠그지 않음 — D12)
  createdAt: ts().defaultNow().notNull(),
});

// ---------- meetings ----------
export const meetings = pgTable(
  "meetings",
  {
    id: uuid().primaryKey().defaultRandom(),
    // 무가입 생성이면 null. 로그인 생성/연결 시 소유자.
    ownerUserId: uuid().references(() => profiles.id, { onDelete: "set null" }),
    // 무가입 생성 시 필수(관리자 인증). scrypt 해시 저장. 로그인 생성 시 선택.
    adminPinHash: text(),
    title: text().notNull(),
    description: text(),
    type: meetingType().notNull(),
    status: meetingStatus().notNull().default("OPEN"),
    // v1은 'Asia/Seoul' 고정, v1.1에서 IANA 가변.
    timezone: text().notNull().default("Asia/Seoul"),
    // 게스트 진입 토큰. 128bit 랜덤(base64url), 추측 불가.
    shareToken: text().notNull(),
    allowGuestAddPlace: boolean().notNull().default(true),
    anonymousVote: boolean().notNull().default(false),
    deadline: ts(),
    // 비활성 TTL 자동 만료/삭제용.
    lastActiveAt: ts().defaultNow().notNull(),
    expiresAt: ts(),
    // 확정된 날짜옵션/장소. 순환 FK 회피 위해 제약 없이 id 참조만(애플리케이션 보장).
    confirmedSlotId: uuid(),
    confirmedPlaceId: uuid(),
    createdAt: ts().defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("meetings_share_token_uq").on(t.shareToken),
    index("meetings_owner_idx").on(t.ownerUserId),
    index("meetings_expires_idx").on(t.expiresAt),
  ],
);

// ---------- participants ----------
export const participants = pgTable(
  "participants",
  {
    id: uuid().primaryKey().defaultRandom(),
    meetingId: uuid()
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    // 게스트면 null. 로그인/merge 시 연결.
    userId: uuid().references(() => profiles.id, { onDelete: "set null" }),
    displayName: text().notNull(),
    // 게스트 본인 식별(localStorage 매칭, best-effort).
    guestKey: text(),
    // 선택 응답 PIN. scrypt 해시. 재식별 SSOT(닉네임+PIN 서버 검증).
    editPinHash: text(),
    departureLat: doublePrecision(),
    departureLng: doublePrecision(),
    departureLabel: text(),
    submitted: boolean().notNull().default(false),
    submittedAt: ts(),
    createdAt: ts().defaultNow().notNull(),
  },
  (t) => [
    index("participants_meeting_idx").on(t.meetingId),
    // 한 모임 내 동일 guestKey 중복 방지(설정된 경우에만).
    uniqueIndex("participants_meeting_guestkey_uq")
      .on(t.meetingId, t.guestKey)
      .where(sql`${t.guestKey} is not null`),
  ],
);

// ---------- date options ----------
export const dateOptions = pgTable(
  "date_options",
  {
    id: uuid().primaryKey().defaultRandom(),
    meetingId: uuid()
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    date: date().notNull(),
  },
  (t) => [
    index("date_options_meeting_idx").on(t.meetingId),
    uniqueIndex("date_options_meeting_date_uq").on(t.meetingId, t.date),
  ],
);

// 참고: 시간(time-of-day) 조율은 MVP 제외(D14). v1.1에서 TimeAvailability 테이블을
// 마이그레이션으로 다시 추가하고 디자인의 AvailabilityGrid를 포팅한다.

// ---------- date votes ----------
export const dateVotes = pgTable(
  "date_votes",
  {
    id: uuid().primaryKey().defaultRandom(),
    dateOptionId: uuid()
      .notNull()
      .references(() => dateOptions.id, { onDelete: "cascade" }),
    participantId: uuid()
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    vote: voteValue().notNull(),
    createdAt: ts().defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("date_votes_option_participant_uq").on(
      t.dateOptionId,
      t.participantId,
    ),
  ],
);

// ---------- places ----------
export const places = pgTable(
  "places",
  {
    id: uuid().primaryKey().defaultRandom(),
    meetingId: uuid()
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    name: text().notNull(),
    address: text(),
    lat: doublePrecision(),
    lng: doublePrecision(),
    category: text(),
    link: text(),
    ogImage: text(),
    ogColor: text(),
    ogEmoji: text(),
    addedByParticipantId: uuid().references(() => participants.id, {
      onDelete: "set null",
    }),
    createdAt: ts().defaultNow().notNull(),
  },
  (t) => [index("places_meeting_idx").on(t.meetingId)],
);

// ---------- place votes ----------
export const placeVotes = pgTable(
  "place_votes",
  {
    id: uuid().primaryKey().defaultRandom(),
    placeId: uuid()
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    participantId: uuid()
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    createdAt: ts().defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("place_votes_place_participant_uq").on(
      t.placeId,
      t.participantId,
    ),
  ],
);

// ---------- comments ----------
// 날짜/장소 댓글 통합. target+targetId 다형 참조(FK 없음 — 애플리케이션 보장).
export const comments = pgTable(
  "comments",
  {
    id: uuid().primaryKey().defaultRandom(),
    meetingId: uuid()
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    participantId: uuid()
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    target: commentTarget().notNull(),
    targetId: uuid().notNull(),
    body: text().notNull(),
    createdAt: ts().defaultNow().notNull(),
  },
  (t) => [index("comments_meeting_idx").on(t.meetingId)],
);

// ---------- feedback ----------
export const feedback = pgTable("feedback", {
  id: uuid().primaryKey().defaultRandom(),
  type: text().notNull(),
  title: text(),
  body: text().notNull(),
  status: text().notNull().default("OPEN"),
  reporterUserId: uuid().references(() => profiles.id, {
    onDelete: "set null",
  }),
  createdAt: ts().defaultNow().notNull(),
});
