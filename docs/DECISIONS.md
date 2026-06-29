# 결정 로그 (Decisions)

> 모이미(moimi) 프로젝트의 확정·미확정 결정 모음. 새 세션은 이 문서로 맥락을 복원한다.
> 원본 논의: 기획 세션(2026-06-21~24). 상세는 `PLAN.md`, `braintrust-report.md`.

---

## ✅ 확정된 결정

| # | 결정 | 내용 | 근거 |
|---|------|------|------|
| D1 | 프로젝트 성격 | 기존 프로토타입을 외부 범용 **B2C 서비스로 밑바닥부터 재구축**. 코드 재사용 X, 개념만 계승 | Director |
| D2 | 목적 | **취업 포트폴리오용**. 수익화 없음(추후 광고 슬롯 자리만) | Director |
| D3 | 타겟 | 한국 사용자, 개인/친구/소모임. **무료·바이럴** | Director |
| D4 | 차별점 | **장소 + 날짜/시간 동시 조율** + 출발지→중간지점 추천(부가) + **카톡 네이티브 공유** | 시장조사: 경쟁 7개 중 6개가 "시간만" |
| D5 | 진입 방식 | **URL 베이스 무가입 (When2meet 모델)**. 로그인은 선택적 보상 | Director (전환율) |
| D6 | 신원/권한 | **단일 링크(shareToken)**. 관리자 = 로그인 **또는** 관리자 PIN(+TTL 서명 쿠키). 게스트 = **When2meet식 닉네임+선택 PIN 서버 검증**(localStorage는 편의 레이어) | Braintrust 카톡 인앱 브라우저 리스크 해소 |
| D7 | 스택 | **Next.js 16 + Supabase(Postgres/Auth/Realtime) + Drizzle ORM + Kakao SDK(로그인/맵/공유) + Resend + Vercel** | 한국 B2C·1인 개발 적합 (전원 동의). ⚠️ 2026-06-30 스캐폴드 시 `create-next-app@latest`가 Next 16(React 19.2/Tailwind 4) 설치 → "15"에서 16으로 갱신 |
| D8 | 지도 | **카카오** (로그인·공유와 1-SDK 통합). 네이버는 백업 | 셋업 간단·중간지점 검색 API |
| D9 | MVP 범위 | **타임존(F8) 제거→v1.1**. 출발지(F6) **옵셔널·부가**. 중간지점은 MVP 유지(Director). ~~시간조율(F7) 유지~~ → **F7도 v1.1로** (디자인 reconcile, D14) | Braintrust P0 + Director + 디자인 |
| D10 | 비주얼 톤 | **캐주얼·플레이풀** (밝고 둥글고 친근, 이모지·마이크로 인터랙션) | Director |
| D11 | git identity | 이 repo(`~/moimi`)는 **oganessone718@gmail.com**으로 작업. git local config 설정 완료 | Director |
| D12 | 소셜 로그인 범위 | **v1은 카카오만.** 구글 등은 v1.1에 provider 추가형으로 확장. 확장 조건: 제네릭 `signInWithProvider(provider)`·DB provider 비-enum(text/Supabase identities)·merge는 provider 아닌 user id 기준·로그인 UI는 provider 목록 렌더. 난이도는 카카오↔Supabase(PoC②)에 있고 구글은 네이티브라 trivial | Director (2026-06-30) |
| D13 | RLS 활성화 시점 | **S1에서 RLS 미적용 → S9(로그인)로 연기.** RLS는 PLAN §4.3대로 로그인 대시보드(`owner_user_id = auth.uid()`) 한정인데 그건 auth 컨텍스트(S9) 필요. 게스트 경로는 서버액션 검증이 1차 방어선이라, 지금 RLS를 켜면 서버액션(postgres.js 직결) 경로를 막는 footgun. S9에서 auth 클라이언트 경로와 함께 활성화 | 2026-06-30 |
| D14 | 디자인 reconcile | Claude Design "moimi" UI 킷(Landing/CreateWizard/게스트응답/Results/Confirmed) 기준 정렬: ① **모임 유형 3종** {DATE, PLACE, DATE_PLACE}. ② **시간(time-of-day) 조율 MVP 완전 제외→v1.1** (Director 재확인 2026-06-30): `meetings.withTime`·`TimeAvailability` 테이블을 MVP 스키마에서 **제거**, v1.1에서 마이그레이션으로 재추가 + 디자인 AvailabilityGrid 포팅. ③ **관리자 PIN 4자리**(완화책=PoC④ 백오프·잠금). ④ 중간지점(F6) 결과 화면 유지. ⑤ 도메인 후보 `moimi.app`/`moimi.kr`. ⑥ ICS=v1.1. 스키마·마이그레이션 반영 완료 | Director(디자인) + 2026-06-30 |

---

## ⏳ 미확정 / 열린 결정

### 네이밍 (작업명: 모이미 / moimi)
이름 확정 안 됨. 현재 작업명 **모이미(moimi)** = 모이다(gather) + "-미"(친근 코인드 네임).

| 후보 | 유래 | 강점 | 약점 |
|------|------|------|------|
| **모이미 / 모이디** | 모이다 + 미/디 | 고유성↑(검색·도메인), 캐주얼·마스코트화 | 직관성 中(태그라인 필요), "새 모이" 동음 약간 |
| Manna | 만나다 펀 | 직관 ◎ | 검색 중복 심함, 종교 함의, 동사화 모호 |
| 언제어디 | 언제+어디 | 차별점(시간+장소) 직설, SEO | 약간 김 |
| 때곳 | 때+곳 순우리말 | 초고유·짧음 | 발음/직관 약함 |
| 콕 | 콕 찍다 | 동사화·어감 ◎ | 약속 의미 설명 필요 |

- **다음 액션(보류 중)**: 후보들 도메인·앱스토어·인스타 핸들·검색 충돌 **웹 확인** 후 확정.
- 코인드 네임(모이미/모이디)은 도메인 비어 있을 확률 높음 → 확인되면 결정 쉬움.

### S-1 PoC 결과 (구현 전 선검증 필요 — 아키텍처 블로커)
`PLAN.md` 부록 A 참고.
- ✅ **④ 서버액션 PIN+TTL 서명 쿠키 패턴 검증 완료** (2026-06-30): scrypt PIN 해시·HMAC TTL 토큰·지수 백오프 잠금 순수 함수 + 14개 단위테스트 통과. 코드: `src/server/auth/*`, `src/lib/auth/admin-cookie.ts`.
- ⏳ **①②③ 미검증** (외부 계정·도메인·실제 폰 필요): 카톡 인앱 브라우저 거동, Supabase↔카카오 OAuth, Kakao 키·쿼터. → 절차는 [`SETUP.md`](SETUP.md). 배포 후 폰으로 검증하고 이 섹션에 결과 기록.

### 첫 구현 작업 범위 — 확정 (2026-06-30)
**얇은 수직 슬라이스**로 결정. S-1은 "S0보다 먼저"가 아니라 "S2~S10보다 먼저"이며, ①②③ PoC는 최소 스캐폴드+배포가 전제임을 확인.
- 완료: AGENTS.md 작업규칙, 공개 레지스트리 `.npmrc`, S0-minimal 스캐폴드(Next16+TS+Tailwind+Drizzle+Supabase 배선, 빌드 통과), PoC④, `SETUP.md`.
- ✅ **S1 데이터 모델 완료** (2026-06-30): `src/lib/db/schema.ts` 10개 테이블(profiles/meetings/participants/dateOptions/timeAvailabilities/dateVotes/places/placeVotes/comments/feedback) + enum·FK(cascade/set null)·unique·부분 unique(guestKey)·check. 마이그레이션 `drizzle/0000_init.sql` 생성. shareToken/guestKey 헬퍼(`src/lib/tokens.ts`). **pglite로 제약 실제 검증**(중복투표·cascade·부분unique·check) — 전체 21개 테스트 통과. RLS는 D13대로 S9 연기.
- 다음: 외부 셋업(SETUP.md) → 배포 후 ①②③ PoC → 마이그레이션 적용(`pnpm db:migrate`) → **S2 폴 생성**(무가입+관리자 PIN, shareToken 발급).

---

## Braintrust 검증 반영 (2026-06-21, 4 AI)
상세 `braintrust-report.md`. 핵심 반영:
- P0 MVP 축소(타임존 제거, 출발지 옵셔널)
- P1 S-1 PoC 0순위 (카카오 3종 + Supabase + 인앱 브라우저)
- P2 게스트=서버 액션 검증 / RLS는 로그인 대시보드 한정 / 관리자=TTL 서명 쿠키
- P3 PIN 백오프·잠금, shareToken 128bit, 모임 TTL
- P4(부분) 게스트 식별 localStorage 단독 탈피(When2meet식 서버 검증)
- Drizzle "RLS 친화" 문구 정정
