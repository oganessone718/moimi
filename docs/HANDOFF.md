# HANDOFF — 모이미(moimi) 작업 인계

> 다른 세션/컴퓨터에서 **콜드로 이어가기** 위한 현재 상태 요약.
> 최초 맥락은 `KICKOFF.md`, 결정은 `DECISIONS.md`, 플랜은 `PLAN.md`. 이 문서는 "지금 어디까지 됐고 다음 뭐냐".
> 최종 갱신: 2026-06-30.

## 0. 한 줄
"언제+어디서"를 한 폼에서 정하고 가입 없이 카톡 링크로 투표하는 B2C 모임 약속 서비스. 포트폴리오용. 작업명 moimi(미확정).

## 1. 리포 / 브랜치
- GitHub: `git@github.com:oganessone718/moimi.git` (개인 계정)
- 작업 브랜치: **`claude/optimistic-keller-2e7440`** (푸시됨). `main`은 베이스만.
- git identity는 **반드시 `oganessone718@gmail.com`** (사내 계정 금지 — D11). 클론 후 `git config user.email`/`user.name` 재설정.

## 2. 새 환경에서 이어가기
```bash
git clone git@github.com:oganessone718/moimi.git && cd moimi
git checkout claude/optimistic-keller-2e7440
pnpm install
git config user.email oganessone718@gmail.com
git config user.name oganessone718
# (셋업 단계) cp .env.example .env.local  → Supabase/Kakao 값 채움
```
검증: `pnpm test`(node --test + pglite) · `pnpm exec tsc --noEmit` · `pnpm lint` · `pnpm build`.
DB 없이도 빌드/테스트/UI 동작. 실데이터는 Supabase 연결 후.

## 3. 스택 (확정 — D7)
Next.js **16** (App Router) + TS + Tailwind v4 · Supabase(Postgres/Auth/Realtime) · Drizzle ORM · Kakao SDK · Resend(v1.1) · Vercel · 패키지매니저 **pnpm**.

## 4. 지금까지 구현 (전부 커밋·푸시, 테스트 29개 통과)
### 화면 (App Router)
- `/` — Landing(마케팅, 반응형) · `src/app/(marketing)/`
- `/meetings/new` — 생성 위저드 5스텝(기본/날짜/장소/옵션·PIN/공유) · `src/app/(app)/meetings/new/`
- `/m/[shareToken]` — 게스트 응답(닉네임 게이트 → 날짜[리스트/캘린더]·장소 투표 → 제출, 댓글, **관리자 모드**) · `GuestResponse.tsx`
- `/m/[shareToken]/results` — 집계/랭킹(읽기전용 RSC)
- `/m/[shareToken]/confirmed` — 확정 카드
- `src/app/not-found.tsx` — 404
- `(app)` 셸: 모바일 full-bleed → 데스크탑 중앙 패널(반응형) · `app-shell.module.css`

### 디자인 시스템
- 토큰 전부 `src/app/globals.css`(인디고 팔레트·투표 신호등·Pretendard·spacing/radius/shadow/motion + reduced-motion 가드)
- 컴포넌트 `src/components/`: ui(Button/Input/Switch/PinInput/StepIndicator/Badge) · people(Avatar/NicknameChip) · vote(VoteCell/DateCandidateCard) · place(PlaceCard) · share(ShareButton)

### 백엔드 (도메인 함수 + "use server" 액션, 전부 pglite 테스트)
- `src/lib/db/index.ts` — `getDb()` **지연 초기화**(import 부작용 X, 쿼리 시 DATABASE_URL 검증), `Db` 타입 export
- `src/lib/db/schema.ts` — 9 테이블(profiles/meetings/participants/dateOptions/dateVotes/places/placeVotes/comments/feedback). `drizzle/0000_init.sql` 마이그레이션
- `src/server/auth/` — PoC④: scrypt PIN(`pin.ts`)·HMAC TTL 토큰(`adminSession.ts`)·백오프 잠금(`lockout.ts`)·`authenticateAdmin.ts`. 쿠키 레이어 `src/lib/auth/admin-cookie.ts`
- `src/server/meetings/` — `createMeeting`(S2)·`submitResponse`(S3)·`getMeeting`/`getResults`·`confirmMeeting`·`admin`·`comments`. 래퍼 `actions.ts`
- `src/lib/tokens.ts` — shareToken/guestKey(128bit base64url)

## 5. 키/셋업 대기 (외부 API 키 필요 — 미구현, 의도적 제외)
- 카톡 공유(S4)·카카오맵(S5)·중간지점 F6·소셜 로그인(S9) → **Kakao SDK/REST 키**. (ShareButton kakao는 현재 스텁)
- 라이브 DB → **Supabase 프로젝트 + `DATABASE_URL`**. 스키마/마이그레이션/액션 준비 완료, 연결만.
- 이메일(Resend)·실시간(Realtime)·타임존 → **v1.1**
- 셋업 절차: `docs/SETUP.md`. 연결 후 `pnpm db:migrate`로 스키마 적용.

## 6. 남은 비키(non-key) 작업 (선택)
- 결과 화면 캘린더 히트맵·참가자 목록(ParticipantList) 표시 — 같은 데이터 대체 시각화
- 관리자 PIN 백오프·잠금 **영속화**(lockout 상태 컬럼 — 현재 매 시도 INITIAL)
- 시간(time-of-day) 조율은 **MVP 제외→v1.1**(D14). TimeAvailability/withTime 제거됨, v1.1에서 마이그레이션 재추가 + AvailabilityGrid 포팅

## 7. 꼭 알아야 할 규칙/함정
- **디자인 소스**: Claude Design 프로젝트(킷 `ui_kits/moimi` + "Moimi Responsive"). 시각 SSOT. 기획↔디자인 충돌 시 디자인 기준 reconcile 후 DECISIONS 기록.
- **결정 로그** `DECISIONS.md` D1~D14 핵심: D6 신원(단일 shareToken·관리자=PIN/로그인·게스트=닉네임+선택PIN), D9/D14(시간 v1.1), D12(소셜 v1 카카오만·provider 확장형), D13(RLS는 S9로 연기 — 게스트는 서버액션 검증 1차).
- **테스트 컨벤션**: `node --test` + pglite. 테스트로 로드되는 도메인 모듈은 **`@/` 별칭 금지, 상대경로 `.ts` 확장자**(Node 타입스트리핑 한계). "use server"·클라이언트는 `@/` OK. tsconfig `allowImportingTsExtensions: true`.
- **빌드 경고** "multiple lockfiles": worktree가 메인 체크아웃 하위라 Next 루트 추론. 무해(일반 클론선 안 뜸). 거슬리면 `next.config.ts`에 `outputFileTracingRoot` 지정.
- **공개 레지스트리 고정**: repo `.npmrc` = `registry.npmjs.org`. 사내 패키지·레지스트리 금지.
- 시크릿은 `.env.local`만(커밋 금지). `ADMIN_SESSION_SECRET`은 관리자 TTL 쿠키 서명용(`openssl rand -base64 32`).

## 8. 추천 다음 순서
1. **Supabase 셋업** → `.env.local` → `pnpm db:migrate` → `pnpm dev`로 전 플로우 실데이터 확인.
2. **Kakao 키** → 카톡 공유(S4)·카카오맵(S5) 연결.
3. (선택) 결과 캘린더 히트맵, 관리자 lockout 영속화.
4. Vercel 배포 → 도메인 등록 → **S-1 PoC ①②③**(카톡 인앱·OAuth·Kakao 쿼터) 실폰 검증 → DECISIONS "S-1 PoC 결과"에 기록.
