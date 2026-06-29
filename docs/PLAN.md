# Implementation Plan: 모이미(moimi) — 모임 약속 서비스

> 🔖 **이 repo(`~/moimi`)는 신규 프로젝트입니다.** 기존 프로토타입에서 **개념만 계승해 밑바닥부터 재구축**. 이전 코드는 참조/수정 대상이 아님.
> 작업명: **모이미(moimi)** — 네이밍 미확정(`DECISIONS.md` 참고).
> git identity: 이 repo는 **oganessone718@gmail.com**으로 작업.
>
> 작성일: 2026-06-21 (Braintrust 반영 완료)
> Status: 설계 확정 직전 (구현 착수 가능). 미확정: 네이밍, S-1 PoC 결과.
> 핸드오프 경로: 본 문서 → (디자인: DESIGN_BRIEF + prompts) → (Claude Code 구현)

---

## 0. 한 줄 정의

> **"언제 + 어디서"를 한 폴에서 동시에 정하는, 가입 없이 카톡으로 쓰는 모임 약속 서비스.**

기존 서비스(When2meet·Doodle·Calendly 등)는 전부 "시간만" 정한다. 모이미는 **날짜·시간·장소를 한 번에 조율**하고, **각자 출발지로 중간지점까지 추천**한다. 한국 사용자 대상으로 **카카오 로그인/지도/공유** 3종을 네이티브로 묶는다.

---

## 1. 기존 프로토타입 정리 (As-Is)

### 1.1 기술 스택
| 영역 | 기존 |
|------|------|
| 프레임워크 | Next.js 15.5 (App Router) + React 19 + TypeScript |
| ORM/DB | Prisma 7 + PostgreSQL 16 (K8s sidecar) |
| UI | 자체 디자인 시스템 + Tailwind 4 + Radix |
| 인증 | 기존 통합 세션 |
| 배포 | 쿠버네티스 + CI (내부 인프라) |
| npm | 프라이빗 레지스트리 |

### 1.2 재사용 가능한 자산 (외부 의존성 없음) ✅
- **도메인 모델**: `Event`(DATE / PLACE / DATE_PLACE) · `EventMember` · `CandidateDate` · `DateVote`(YES/MAYBE/NO) · `EventPlace` · `PlaceLike` · 날짜/장소 댓글 · `Feedback`
- **유스케이스**: 이벤트 CRUD, 날짜 투표, 장소 추가/좋아요, 마감/재개, 결과 확정/취소, URL 메타데이터 파싱(og-parse)
- → 이 도메인 **개념/플로우는 검증된 자산**. 단 코드는 재사용하지 않고 **개념만 계승**해 재설계한다 (Director 결정).

### 1.3 기존 환경에 강결합되어 버려야 할 부분 ❌
| 영역 | 기존 | 외부 전환 |
|------|------|-----------|
| 인증 | 기존 통합 세션 | 소셜로그인(카카오·구글) + 게스트 |
| 사용자/그룹 | 기존 사용자 디렉토리 | 가입 기반 + 초대/공유 토큰 |
| UI | 기존 디자인 시스템 | 자체 디자인 시스템 (Tailwind + shadcn/ui) |
| GNB | 기존 통합 네비 | 자체 랜딩/네비 |
| 배포 | 기존 내부 인프라 | Vercel + 커스텀 도메인 |

### 1.4 기존의 구조적 한계 (외부 서비스가 되려면 메워야 할 것)
- **멀티유저 소유권 없음**: 단일 조직 가정. 누구나 자기 모임을 만들고 소유하는 개념 부재.
- **게스트 참여 없음**: 전원 로그인 필수. 외부에선 치명적.
- **타임존 처리 없음**: 단일 TZ 가정.
- **시간(time-of-day) 조율 없음**: 날짜 단위만. "7시 이후 가능" 같은 시간 조율 불가.
- **알림/공유 없음**: 카톡 공유·이메일 알림 미구현.
- **지도 시각화 없음**: 장소는 링크/메타데이터만. 지도 위 후보 비교·중간지점 없음.

---

## 2. 비전 & 포지셔닝 (To-Be)

| 항목 | 결정 |
|------|------|
| 타겟 | **B2C 무료·바이럴** (개인/친구/소모임). |
| 수익화 | **없음** (포트폴리오 목적). 추후 광고 슬롯 자리만 확보, 결제 미도입. |
| 차별점 | **장소 + 날짜/시간 동시 조율** + **출발지→중간지점 추천** + **카톡 네이티브 공유** |
| 진입 방식 | **URL 베이스 무가입 (When2meet 모델)** — 로그인은 강제하지 않음 |
| 시장 갭 | 경쟁 7개 중 6개가 "시간만" 조율. 장소 투표는 사실상 공백 — 실재하는 니치. |
| 핵심 지표 | 폴 생성 → 카톡 공유 → 게스트 응답 전환율 (바이럴 루프) |

> ⚠️ 검증 과제: 강자들이 "시간 전용"을 고수하는 게 의도적 선택일 가능성(캘린더 API 매핑·UX 단순성). 차별점이 유효해도 "왜 아무도 안 했나"를 데모/피드백으로 검증할 것.

### 2.1 로그인 / 신원 정책 (핵심 설계 원칙)

> **원칙: 생성도 참여도 무가입 가능. 로그인은 강제가 아니라 "귀찮음을 줄여주는 선택적 보상".**
> 조율 도구에서 로그인 강제는 전환율 최대의 적 — 카톡으로 링크 받은 사람이 "가입하라"는 순간 이탈한다. 핵심 기능(카카오 공유·지도·중간지점·투표)은 모두 로그인이 불필요하다.

**링크는 하나(`shareToken`)만 발급한다. 관리자/일반멤버 링크를 분리하지 않는다.** 같은 모임 페이지에서 관리자 권한은 **로그인(소유자 계정) 또는 관리자 PIN 입력**으로 획득한다.

| 신원 단계 | 진입 | 가능한 것 | 본인/권한 식별 |
|---|---|---|---|
| **익명 게스트** (기본, When2meet 모델) | URL + 닉네임 (+ 선택 응답 PIN) | 투표/응답, 본인 응답 수정 | **닉네임 + 선택 PIN을 서버에서 검증** (재식별의 SSOT). localStorage/쿠키는 "이 기기에서 기억" 편의 레이어일 뿐 |
| **관리자** (무가입) | 같은 URL에서 "관리자" + **PIN 입력** | 마감/확정/장소관리 | **관리자 PIN**(`Meeting.adminPin`, 해시) 검증 후 **TTL 서명 쿠키**로 권한 세션 유지 |
| **관리자** (로그인) | 카카오/구글 로그인 = 소유자 | 위 + **내 모임 대시보드·기기 동기화·알림** | `Meeting.ownerUserId` 일치 |

> **게스트 식별 = When2meet 방식 (Braintrust 카톡 인앱 브라우저 리스크 해소)**
> 카톡 웹뷰는 localStorage가 휘발될 수 있다. 따라서 본인 재식별의 **진짜 근거는 "닉네임 + (선택)PIN의 서버 검증"**이고, localStorage/쿠키는 편의 레이어로만 둔다. 저장소가 날아가도 닉네임+PIN으로 본인 응답을 다시 찾는다.
> 트레이드오프: PIN은 **선택**이므로, PIN 미설정 시 동명이면 누구나 덮어쓰기 가능(When2meet 동일). 캐주얼 모임엔 허용 가능한 단순성. 강제 PIN은 마찰↑이라 채택 안 함.

**무가입의 3대 난제와 해법**
1. **관리자 인증** → 별도 관리 링크 없음. 무가입 생성 시 **관리자 PIN 필수 설정**(로그인 생성 시엔 계정이 권한, PIN 선택). 관리하려면 같은 링크에서 PIN 입력 → 서버 검증 → **TTL 서명 쿠키**로 권한 유지(매 액션 재입력 불필요). 분실 대비 **로그인으로 소유권 연결 권장**(+선택적 이메일 PIN 복구).
2. **응답 수정/사칭** → 닉네임+선택 PIN을 서버 검증해 본인 응답 매칭. localStorage는 자동 인식 편의용. PIN 미설정 시 동명 덮어쓰기 가능(위 트레이드오프).
3. **어뷰징** → 생성 rate limit + `shareToken` 추측 불가성(**128bit 랜덤**) + PIN 시도 **백오프·잠금**(무차별 대입 방지). 필요 시 캡차.

**로그인 연결(merge)**: 게스트/PIN 관리자로 활동 후 나중에 로그인하면 그 기기의 활동·PIN으로 관리하던 모임을 계정에 자동 연결 → "로그인하니 내가 만든 게 다 모여 있네" 경험.

> 결정 (2026-06-21): **단일 링크.** 관리자 = **로그인 또는 관리자 PIN(+TTL 서명 쿠키)**. 게스트 식별 = **When2meet식 닉네임+선택 PIN 서버 검증**(localStorage는 편의). 관리자 PIN과 응답 PIN은 별개.

---

## 3. 기능 명세

### 3.1 MVP (v1) — Director 확정
| # | 기능 | 설명 |
|---|------|------|
| F1 | **장소 + 날짜/시간 동시 조율** | 핵심 차별점. 한 폴에서 날짜·시간·장소 후보를 함께 제안·투표 |
| F2 | **무가입 게스트 참여 (기본 진입)** | URL+닉네임만으로 응답. 생성도 무가입 가능. 바이럴 핵심 (§2.1) |
| F3 | **선택적 소셜 로그인** | **v1은 카카오만** (구글 등은 v1.1, provider 추가형으로 확장). 강제 아님 — 내 모임 대시보드·동기화·알림·닉네임 자동 등 보상 |
| F4 | **카톡 공유 (자동 멘트)** | "○○ 모임 일정 정해요! 👉 [링크]" 자동 생성, Kakao Share SDK |
| F5 | **지도 위 장소 후보 시각화** | 후보 장소들을 지도 마커로 한눈에. 카카오맵 |
| F6 | **출발지 → 중간지점 추천 (부가기능)** | **출발지 입력은 옵셔널** — 입력한 사람들의 centroid 계산 → 주변 장소 카테고리 추천. 미입력해도 폴 정상 동작. 당신이 원한 차별 부가기능 |
| ~~F7~~ | ~~**시간대 조율**~~ → **v1.1** | "7시 이후 가능" 식 시간 범위. **디자인 reconcile로 MVP 제외**(D14): `meetings.withTime` 토글 off 기본, UI는 토글 보존 |
| F9 | **모바일/웹 반응형** | 모바일 우선 설계 (카톡으로 들어오므로 모바일 트래픽 다수) |

> ~~F8 타임존 처리~~ → **v1.1로 제외** (한국 단일 타겟이라 전원 KST, 글로벌 조율 전까진 불필요 — Braintrust 만장일치).
> ~~F7 시간대 조율~~ → **v1.1로 제외** (디자인 `HAS_TIME=false`. MVP는 날짜+장소만. 코드/스키마는 토글로 보존 — D14).

### 3.2 패스트팔로우 (v1.1)
- **시간대 조율(F7)** — `withTime` 토글 켜면 활성화. 날짜별 가용 시간 범위(AvailabilityGrid) + 시간 히트맵 집계. 스키마(TimeAvailability)·디자인 컴포넌트는 이미 존재.
- **구글 로그인 추가** — provider 목록에 추가(Supabase 네이티브라 trivial). 카카오 연동(PoC②)이 본질적 난이도, 구글은 거의 공짜.
- **타임존 처리** (F8 강등) — UTC 저장 + IANA tz, 글로벌 조율 시 활성화
- 이메일 알림 (초대·마감임박·확정) — Resend + SPF/DKIM/DMARC
- 캘린더 연동: Google/Outlook free/busy 조회, 확정 후 ICS 다운로드/이벤트 생성
- 실시간 투표 현황 (Supabase Realtime)

### 3.3 추후 (v2+)
- 광고 슬롯
- 반복 모임 템플릿
- 다국어(i18n)

---

## 4. 기술 아키텍처

### 4.1 확정 스택 (밑바닥부터 재구축 기준 최선)
```
Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui   ← 모바일 우선 반응형 (스캐폴드 시 16 설치, 2026-06-30)
Supabase (PostgreSQL + Auth + Realtime)                       ← 소셜로그인·실시간·게스트 한 플랫폼
Drizzle ORM                                                   ← 모던·타입세이프·RLS 친화
Kakao SDK (Login + Map + Share)                               ← 한국형 1-SDK 통합
Resend (이메일, v1.1)                                          ← Next.js DX, 영구 무료 티어
Vercel                                                        ← 무료 배포, Next.js 최적
결제 ✗ (포폴, 광고 슬롯 자리만)
```

### 4.2 기술 선택 근거
- **Supabase**: 카카오·구글 OAuth 네이티브 지원, Realtime 내장(실시간 투표), anon 키로 게스트 처리, 무료 티어 넉넉. 인증·DB·실시간을 한 곳에서 → 솔로 개발/포폴에 최적.
- **Drizzle ORM**: 2026 모던 스택, 타입세이프, **Edge 친화 + SQL 가시성**, 포폴 신선도 ↑. (정정: "RLS 친화"는 과장 — RLS는 DB 레이어 정책이라 ORM과 직교. Drizzle 채택 근거는 RLS가 아니라 Edge·경량·SQL 투명성. Prisma도 무방하나 본 프로젝트는 Drizzle 채택.)
- **지도 = 카카오 (네이버 대비)**:
  | | Kakao Map | Naver Maps |
  |---|---|---|
  | 로그인·공유와 통합 | ◎ (1 SDK 생태계) | △ |
  | 무료 쿼터/셋업 | ◎ 간단 | △ NCP 결제수단 등록 필요 |
  | 장소 카테고리 검색(중간지점) | ◎ 키워드/카테고리 API | ○ |
  | 최근 API 안정성 | ○ | △ 변동 이슈 |

  → **카카오 채택**. (네이버는 og-parse가 이미 쓰던 자산이라 백업 옵션으로만 명시)
- **인증 흐름**: 주최자/로그인 사용자는 Supabase Auth(카카오/구글). 게스트는 **이벤트 공유 토큰 + 닉네임**으로 익명 참여, 응답은 브라우저 로컬 식별자(또는 매직링크)로 본인 응답 수정 가능.

### 4.3 멀티테넌시 / 데이터 격리 (B2C 경량)
B2B형 무거운 멀티테넌시 불필요. **격리는 계층 분리** (Braintrust 절충안 반영 — 게스트 경로에서 RLS만 의존하지 않음):
- **게스트/관리자 경로(무가입) = 서버 액션 검증이 1차 방어선**: Next.js 서버 액션에서 `shareToken` 유효성·PIN을 직접 검증하고, 검증 통과분만 DB 접근. RLS로 PIN을 표현하기 어렵기 때문. 관리자는 PIN 검증 후 **TTL 서명 쿠키**로 세션 유지.
- **RLS는 로그인 사용자 대시보드에 한정 적용**: `owner_user_id = auth.uid()`로 "내 모임" 조회를 DB 레이어에서 격리.
- `shareToken`은 **128bit 랜덤**, 추측 불가. 비활성 모임은 **TTL 자동 만료/삭제**(Rallly 방식)로 잔존 데이터·유출면 축소.

### 4.4 디렉토리 구조 (재설계 초안)
```
/src
  /app
    /(marketing)        # 랜딩 페이지
    /(app)
      /meetings
        /new            # 폴 생성 (스텝 위저드)
        /[id]           # 주최자 관리 뷰
      /m/[shareToken]   # 게스트 응답 뷰 (무가입 진입점)
      /api              # route handlers (또는 server actions)
  /components
    /map                # 카카오맵 래퍼, 마커, 중간지점
    /poll               # 날짜/시간/장소 투표 UI
    /share              # 카톡 공유 버튼
  /lib
    /db                 # Drizzle schema + client
    /auth               # Supabase auth helpers
    /kakao              # Kakao SDK 래퍼 (map/share/login)
    /geo                # centroid·중간지점 계산
  /server               # 도메인 로직 (투표 집계, 확정 등)
```

---

## 5. 데이터 모델 (재설계)

> 기존 개념(Event/Member/Vote/Place) 계승 + 게스트·시간·출발지·타임존 신규.

```
User (Supabase auth.users + profiles)
  - id, email, displayName, avatarUrl, provider(kakao/google)

Meeting                          # 기존 Event 계승
  - id
  - ownerUserId (nullable — 무가입 생성이면 null)
  - adminPin (nullable, 해시 저장 — 무가입 생성 시 필수, 관리자 인증용) ★신규
  - title, description
  - type: DATE | PLACE | DATE_PLACE          ★디자인 reconcile(D14): 3종으로 단순화
  - status: OPEN | CLOSED | CONFIRMED
  - timezone (IANA, v1.1 — v1은 "Asia/Seoul" 고정)
  - shareToken (게스트 참여용, 128bit 랜덤) ★128bit
  - allowGuestAddPlace, anonymousVote
  - deadline
  - lastActiveAt, expiresAt (비활성 TTL 자동 만료/삭제용) ★신규
  - confirmedSlotId, confirmedPlaceId
  - createdAt

Participant                      # 기존 EventMember 계승 + 게스트
  - id, meetingId
  - userId (nullable — 게스트면 null)
  - displayName
  - guestKey (nullable — 게스트 본인 식별/수정용, localStorage 매칭)
  - editPin (nullable, 해시 저장 — 선택 PIN) ★신규
  - departureLat, departureLng, departureLabel (nullable, 출발지)
  - submitted, submittedAt

DateOption                       # 후보 날짜
  - id, meetingId, date

TimeAvailability                 # ⏸ v1.1 (MVP 제외 — D14). v1.1에서 마이그레이션으로 추가
  - id, participantId, dateOptionId
  - startMinUtc, endMinUtc (또는 가용 시간 범위)

DateVote                         # 기존 계승
  - id, dateOptionId, participantId
  - vote: YES | MAYBE | NO
  - (dateOptionId, participantId) unique

Place                            # 기존 EventPlace 계승
  - id, meetingId
  - name, address, lat, lng, category
  - link, ogImage, ogColor, ogEmoji
  - addedByParticipantId

PlaceVote                        # 기존 PlaceLike 계승
  - id, placeId, participantId
  - (placeId, participantId) unique

Comment                          # 날짜/장소 댓글 통합
  - id, meetingId, participantId
  - target: DATE | PLACE, targetId
  - body

Feedback                         # 기존 계승
  - id, type, title, body, status, reporterUserId
```

**핵심 신규 설계 포인트**
1. **게스트/소유권 (§2.1)**: 링크는 `shareToken` 하나. 관리자 = 로그인(`ownerUserId`) 또는 `adminPin`(해시). 게스트 응답은 `guestKey`(localStorage) + 선택 `editPin`(해시)로 본인 수정. 로그인 시 `userId`로 승격·merge.
2. **시간 조율**: `TimeAvailability`로 날짜별 가용 시간 범위. 모든 시각 UTC 분(min) 저장, 표시 시 `Meeting.timezone` 또는 viewer TZ 변환.
3. **출발지/중간지점**: `Participant.departure*` → 서버에서 centroid 계산 → 카카오 카테고리 검색으로 주변 후보 제안.
4. **타임존**: 저장은 항상 UTC + IANA id. 오프셋 저장 금지(DST 버그 방지).

---

## 6. 핵심 사용자 플로우

```
[주최자] 폴 생성 — 무가입이면 관리자 PIN 설정(필수), 로그인이면 계정이 권한(PIN 선택)
   → 단일 링크(shareToken) 발급 → 카톡 공유 버튼 (자동 멘트 + 링크)
        ↓
[게스트] 카톡 링크 클릭 → /m/[shareToken] → 닉네임 입력(무가입) + (선택 응답 PIN)
   → 날짜/시간 투표(YES/MAYBE/NO + 가용 시간) + 장소 좋아요 + (출발지 입력)
   → 제출 (guestKey/응답 PIN로 나중에 수정 가능)
        ↓
[지도] 장소 후보 마커 + 참가자 출발지 → 중간지점/주변 추천 표시
        ↓
[주최자] 같은 링크에서 로그인 또는 관리자 PIN 입력 → 관리 모드 → 실시간 집계 → 마감 → 확정
   → (v1.1) 확정 이메일 + ICS
        ↓
[선택] 언제든 카카오/구글 로그인 → 게스트 활동 merge → 내 모임 대시보드·알림
```

---

## 7. 외부 연동 명세

| 연동 | 용도 | 비고 |
|------|------|------|
| Supabase Auth | 카카오·구글 로그인 | OAuth provider 설정, redirect URL |
| Supabase Postgres | 메인 DB | Drizzle 마이그레이션 |
| Supabase Realtime | 실시간 투표 현황 | v1.1 (v1은 polling 가능) |
| Kakao JS SDK — Login | 카카오 로그인 (Supabase 연동) | Kakao Developers 앱 등록 |
| Kakao Map SDK | 장소 마커/지도 | JS 키, 도메인 등록 |
| Kakao Local API | 키워드/카테고리 장소검색(중간지점 주변) | REST 키 |
| Kakao Share SDK | 카톡 공유 + 자동 멘트 | 템플릿 메시지 |
| Resend | 이메일 알림 (v1.1) | SPF/DKIM/DMARC DNS 설정 |
| Vercel | 호스팅 | 커스텀 도메인 |

---

## 8. 구현 로드맵 (Step)

> 본 Plan 확정 후 `workflow-impl`로 단계별 구현.

| Step | 내용 | 검증 기준 |
|------|------|-----------|
| **S-1 (PoC, 0순위)** | 부록 A 미확인 항목 선검증: ① **카톡 인앱 브라우저**에서 Supabase Auth(카카오) 리다이렉트·localStorage 거동, ② Kakao 로그인↔Supabase 연동, ③ Kakao Map/Share/Local API 키·쿼터·도메인, ④ 서버 액션 PIN 검증+TTL 쿠키 패턴 | 인앱 브라우저에서 로그인·응답 식별 동작 확인, 차단 요소 문서화 |
| **S0** | 프로젝트 스캐폴드 (Next.js+TS+Tailwind+shadcn, Supabase, Drizzle) | 빈 앱 Vercel 배포 성공 |
| **S1** ✅ | 데이터 모델(adminPin/guestKey/editPin/shareToken 128bit/TTL 포함) + 마이그레이션 + 토큰 헬퍼 | ✅ 완료(2026-06-30): `schema.ts` 10테이블·`drizzle/0000_init.sql`·pglite 제약테스트 통과. **RLS는 S9로 연기**(D13) — 서버액션 검증은 S2~, 로그인 한정 RLS는 auth 컨텍스트 필요 |
| **S2** | 폴 생성 위저드 (무가입+관리자 PIN, 날짜/시간/장소 후보) + 단일 shareToken 발급 | 무가입 생성·저장·조회 |
| **S3** | 게스트 응답 (`/m/[shareToken]`, **When2meet식 닉네임+선택 PIN 서버 검증**, 투표) | 인앱 브라우저 포함 응답 제출/수정 동작 |
| **S4** | 카톡 공유 (자동 멘트) | 공유 링크로 게스트 진입 |
| **S5** | 지도 시각화 (카카오맵, 장소 마커) | 후보 장소 지도 표시 |
| **S6** | 주최자 관리(로그인/관리자 PIN+TTL 쿠키) + 결과 확정 + 반응형 | PIN 인증·확정 플로우, 모바일 검증 |
| **S7** | 시간대 조율 ("7시 이후" 범위, 타임존 제외) | 시간 범위 응답·집계 |
| **S8 (부가)** | 출발지 입력(옵셔널) → 중간지점/주변 추천 | centroid + 카카오 검색, 미입력 시 정상 동작 |
| **S9** | **선택 소셜 로그인**(v1 카카오만, provider 확장형) + 내 모임 대시보드 + 게스트 merge | 로그인→내 모임 조회·연결 동작. 제네릭 `signInWithProvider`·provider는 비-enum·merge는 user id 기준 |
| **S10** (v1.1) | 타임존 + 이메일 알림 + 실시간 + 캘린더 | 알림 발송, 실시간 갱신 |

> 순서 원칙: **S-1 PoC로 인앱 브라우저·연동 블로커를 먼저 제거**(0순위) → 무가입 핵심 경로(S2~S6)를 데모 가능 상태로 → 시간조율/중간지점(S7·S8 부가) → 로그인(S9)을 선택적으로 얹는다.

---

## 9. 리스크 & 완화

| 리스크 | 영향 | 완화 |
|--------|------|------|
| **카톡 인앱 브라우저** (localStorage 휘발, OAuth 리다이렉트 루프) ⚠️최우선 | 핵심 진입로(카톡)에서 식별·로그인 실패 | **S-1 PoC 0순위 검증.** 게스트 식별을 localStorage 비의존(닉네임+PIN 서버 검증)으로 설계. 필요 시 외부 브라우저 열기 유도 |
| 카카오 로그인 ↔ Supabase Auth 연동 난이도 | 인증 막힘 | 로그인이 선택 기능(S9)이라 **크리티컬 패스에서 제외**. 막히면 Auth.js 카카오 provider 폴백, 최악엔 구글만 |
| 게스트/관리자 RLS 설계 복잡 (shareToken + 서버측 PIN 검증) | 보안/UX | S1에서 토큰 스코프 RLS + 서버 액션 PIN 검증 PoC 우선 (가장 중요한 선행) |
| 관리자 PIN 분실 → 관리 불가 | 모임 방치 | 로그인으로 소유권 연결 권장 + 선택적 이메일 PIN 복구. PIN 무차별 대입 방지 rate limit |
| 중간지점 UX 모호 (출발지 입력 귀찮음) | 기능 사장 | 선택 기능으로, 입력 안 해도 폴 동작 |
| "시간 전용이 의도적"일 가능성 | PMF 미스 | v1 빠르게 출시 후 실제 사용 피드백으로 검증 |
| 카카오 API 쿼터/도메인 제약 | 지도/공유 제한 | 무료 쿼터 한도 확인, 도메인 등록 |
| 솔로/포폴 범위 과대 | 미완성 | MVP 9개 → 필요 시 S6~S8 일부 v1.1로 후퇴 |

---

## 10. 다음 단계 (핸드오프)

1. **본 Plan Director 검토/승인** (또는 Braintrust 다각도 검증)
2. **Claude AI 상세화**: 화면 와이어프레임, 상세 스펙, RLS 정책 초안, 카카오/Supabase 셋업 가이드 구체화
3. **Claude Code 구현**: `workflow-impl`로 S0부터 단계별 구현 + AI-First TDD

---

## 부록 A. 미확인 항목 (S-1 PoC에서 구현 전 선검증 — 아키텍처 블로커)
- **카톡 인앱 브라우저 거동** (최우선): localStorage/쿠키 지속성, Supabase OAuth 리다이렉트 성공 여부, 외부 브라우저 유도 필요성
- Supabase Auth의 카카오 provider 공식 지원 범위 / 설정 절차
- Kakao Local API(중간지점 검색) 무료 쿼터 한도 (일/월)
- Kakao Share 커스텀 템플릿 승인 필요 여부 + 도메인 등록
- 서버 액션 PIN 검증 + TTL 서명 쿠키 권한 세션 패턴 (Next.js)
- 비활성 모임 TTL 자동 만료/삭제 구현 방식 (Supabase cron / pg_cron)

## 부록 B. Braintrust 검증 반영 이력 (2026-06-21)
4개 AI(OpenAI·Anthropic·Google·Moonshot) 검증 → 보고서 `docs/braintrust-report.md`. 반영:
- **P0** MVP 축소: 타임존(F8) v1.1 강등, 출발지(F6) 옵셔널·부가 (중간지점은 Director 결정으로 MVP 유지)
- **P1** S-1 PoC를 0순위로 신설 (카카오 3종 + Supabase Auth + 인앱 브라우저)
- **P2** 게스트=서버 액션 검증, RLS는 로그인 대시보드 한정, 관리자=TTL 서명 쿠키
- **P3** PIN 백오프·잠금, shareToken 128bit, 모임 TTL을 S1 완료조건에 포함
- **P4(부분)** 게스트 식별을 localStorage 단독 탈피 → When2meet식 닉네임+PIN 서버 검증 (매직링크 대신 Director 선택)
- Drizzle "RLS 친화" 문구 정정
