# KICKOFF — 새 Claude Code 세션 시작 프롬프트

> `~/moimi`에서 새 Claude Code 세션을 연 뒤, 아래 블록을 그대로 첫 메시지로 붙여넣으세요.
> (UI는 별도 디자인 트랙(Claude Design)에서 진행 중 — 이 세션은 **UI 외 셋업/인프라/백엔드** 중심.)

---

```
이 repo(~/moimi)는 "모이미(moimi)"라는 신규 B2C 서비스 프로젝트야. 빈 git repo에서 시작한다.

## 먼저 읽어
docs/ 아래 문서로 전체 맥락을 복원해줘:
- docs/PLAN.md          — 구현 플랜 (기능·아키텍처·데이터 모델·로드맵 S-1~S10)
- docs/DECISIONS.md     — 확정/미확정 결정 (네이밍·로그인·스택·MVP·git identity)
- docs/DESIGN_BRIEF.md  — 디자인 방향 (UI는 별도 트랙)
- docs/braintrust-report.md — 다각도 검증 결과
- docs/prompts/         — Claude Design용 프롬프트 (참고만, 이 세션 작업 아님)

## 핵심 컨텍스트 (요약)
- 기존 프로토타입에서 개념만 계승한 신규 재구축. 포트폴리오용, 수익화 없음, 한국 B2C 바이럴.
- 차별점: 장소+날짜/시간 동시 조율 + 카톡 공유 + (부가)중간지점 추천.
- 진입: URL 무가입(When2meet식). 관리자 = 로그인 또는 PIN(+TTL 서명 쿠키). 게스트 = 닉네임+선택 PIN 서버 검증.
- 스택: Next.js 16 + Supabase(Postgres/Auth/Realtime) + Drizzle + Kakao SDK + Resend + Vercel.

## 작업 규칙
- 이 repo의 git identity는 oganessone718@gmail.com (이미 local config 설정됨). 지정 계정 외로 커밋하지 마.
- 네이밍 "모이미"는 작업명(미확정). 코드/설정에선 'moimi'를 식별자로 쓰되, 사용자 노출 텍스트는 추후 변경 가능하게.
- UI 화면 구현은 이 세션의 일이 아니야 (디자인 트랙에서 진행). 이 세션은 셋업/인프라/백엔드 중심.
- 이 프로젝트의 AGENTS.md/CLAUDE.md가 아직 없으면, 작업 규칙을 먼저 합의해 만들자.

## 첫 작업
PLAN.md의 로드맵(S-1 PoC / S0 스캐폴드 / S1 데이터모델) 중 어디부터 시작할지 나랑 정하고 싶어.
각 단계의 선후관계·리스크를 짚고, 첫 세션에서 할 범위를 제안해줘. (UI 제외)
특히 S-1 PoC(카톡 인앱 브라우저, Supabase↔카카오 OAuth, 서버액션 PIN+TTL 쿠키)가
왜 0순위인지 검토하고, 바로 착수할지 S0 스캐폴드부터 할지 의견 줘.
```

---

## 메모
- 이 KICKOFF는 "설정/백엔드" 트랙용. 디자인 트랙은 `docs/prompts/`를 Claude Design(claude.ai 등)에 사용.
- 첫 세션에서 정할 것들: 첫 작업 범위(S-1/S0/S1), 네이밍 확정 여부, AGENTS.md 규칙.
