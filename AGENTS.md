# AGENTS.md — 모이미(moimi) 작업 규칙

> 신규 B2C 서비스. 전체 맥락은 `docs/PLAN.md`·`docs/DECISIONS.md`로 복원한다.
> 이 문서는 **이 repo에서 일하는 에이전트/개발자의 규칙**만 담는다. (사용자 글로벌 규칙 `~/.claude/CLAUDE.md`를 상속하며 중복하지 않는다.)

## 프로젝트 성격
- 기존 프로토타입에서 **개념만 계승한 신규 재구축**. 이전 코드/자산 재사용 금지.
- **포트폴리오용**, 수익화 없음, 한국 B2C 바이럴. 솔로 개발.

## 절대 규칙
1. **git identity**: 이 repo는 `oganessone718@gmail.com`으로만 커밋한다. 지정 계정 외(회사/타 계정)로 커밋 금지. (local config 설정 완료)
2. **프라이빗 의존성 금지**: npm은 공개 레지스트리(`registry.npmjs.org`)만 사용한다(repo `.npmrc`로 고정). 프라이빗/내부 레지스트리·패키지·API·인증을 들이지 않는다.
3. **시크릿**: 키/토큰은 `.env.local`에만. 커밋 금지(`.gitignore` 포함). 문서엔 placeholder만.

## 네이밍
- "모이미"는 **작업명(미확정)**. 코드/설정/식별자는 `moimi`를 쓴다.
- **사용자 노출 텍스트는 추후 변경 가능하게** 한다(하드코딩 산재 금지, 표기는 한 곳에서).

## 스택 (DECISIONS D7)
- Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui
- Supabase (Postgres / Auth / Realtime) + Drizzle ORM
- Kakao SDK (로그인/맵/공유) + Resend(v1.1) + Vercel
- 패키지 매니저: **pnpm**

## 디렉토리 구조 (PLAN §4.4)
```
src/app/(marketing)        랜딩
src/app/(app)/meetings/new 폴 생성
src/app/(app)/meetings/[id] 주최자 관리
src/app/(app)/m/[shareToken] 게스트 응답(무가입 진입점)
src/components/{map,poll,share}
src/lib/{db,auth,kakao,geo}
src/server                 도메인 로직(투표 집계·확정 등)
```

## 트랙 분리
- **이 repo 세션 = 셋업/인프라/백엔드 중심.** UI 화면 구현은 **디자인 트랙**(`docs/prompts/` → Claude Design)에서 진행.
- shadcn 컴포넌트 대량 설치·화면 마크업은 디자인 트랙 산출물과 합류할 때 한다.

## 보안 설계 원칙 (PLAN §2.1, §4.3)
- 게스트/관리자(무가입) 경로의 1차 방어선은 **서버 액션 검증**(shareToken·PIN 직접 검증). RLS에 의존하지 않는다.
- RLS는 **로그인 사용자 대시보드 한정**(`owner_user_id = auth.uid()`).
- `shareToken`은 **128bit 랜덤**. PIN은 **해시 저장 + 백오프·잠금**. 비활성 모임은 **TTL 만료**.

## 작업 방식
- 로드맵은 `docs/PLAN.md` §8 (S-1 ~ S10). 단계 완료조건을 검증 기준으로 삼는다.
- 변경은 요청으로 추적 가능한 라인만. 추측성 코드·미요청 기능 금지(글로벌 규칙 상속).
