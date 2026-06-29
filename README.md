# 모이미 (moimi)

> "언제 + 어디서"를 한 번에 정하는, 가입 없이 카톡으로 쓰는 모임 약속 서비스.
> 신규 B2C 프로젝트 (기존 프로토타입에서 개념만 계승해 밑바닥부터 재구축). 포트폴리오용.
> ⚠️ 작업명 "모이미" — 네이밍 미확정([docs/DECISIONS.md](docs/DECISIONS.md) 참고).

## 상태
기획·디자인 방향 확정, **구현 착수 직전**. UI는 별도 디자인 트랙 진행 중.

## 문서 (여기부터)
| 문서 | 용도 |
|------|------|
| [KICKOFF.md](KICKOFF.md) | 새 Claude Code 세션 시작용 프롬프트 (설정/백엔드 트랙) |
| [docs/PLAN.md](docs/PLAN.md) | 구현 플랜 — 기능·아키텍처·데이터 모델·로드맵(S-1~S10) |
| [docs/DECISIONS.md](docs/DECISIONS.md) | 확정/미확정 결정 로그 |
| [docs/SETUP.md](docs/SETUP.md) | 외부 셋업 체크리스트 (Supabase/Kakao/Vercel — 사람이 수행) |
| [docs/DESIGN_BRIEF.md](docs/DESIGN_BRIEF.md) | 디자인 방향 (캐주얼·플레이풀, 화면 스펙) |
| [docs/braintrust-report.md](docs/braintrust-report.md) | 4-AI 다각도 검증 |
| [docs/prompts/](docs/prompts/) | Claude Design용 프롬프트 (디자인 시스템·화면) |

## 스택 (예정)
Next.js 16 · Supabase(Postgres/Auth/Realtime) · Drizzle ORM · Kakao SDK(로그인/맵/공유) · Resend · Vercel

## 작업 규칙
- 이 repo는 **oganessone718@gmail.com**으로 작업 (git local config 설정됨).
- 두 트랙: **디자인**(claude.ai, `docs/prompts/`) · **셋업·백엔드**(Claude Code, `KICKOFF.md`).
