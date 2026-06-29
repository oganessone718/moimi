# 외부 셋업 체크리스트 (사람이 직접 수행)

> 코드는 준비됐지만 **외부 계정·도메인·실제 폰**이 필요한 항목 모음.
> 이게 끝나야 **S-1 PoC ①②③**(카톡 인앱 브라우저 / Supabase↔카카오 OAuth / Kakao 키·쿼터)을 실제로 검증할 수 있다.
> 값은 모두 `.env.local`(커밋 금지)에 채운다. 템플릿: [`.env.example`](../.env.example).

체크 순서는 의존성 순. ☐ 를 ☑ 로 바꿔가며 진행.

---

## 1. Supabase 프로젝트 ☐
1. ☐ https://supabase.com 에서 프로젝트 생성 (region: **Northeast Asia (Seoul) `ap-northeast-2`** 권장 — 한국 타겟)
2. ☐ Project Settings → API
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` 키 → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ 서버 전용, 절대 클라이언트 노출 금지)
3. ☐ Project Settings → Database → Connection string
   - **앱 런타임**: `Transaction` 풀러(포트 6543) URI → `DATABASE_URL` (`prepare:false` 이미 코드 반영, `src/lib/db/index.ts`)
   - **마이그레이션(S1 `pnpm db:migrate`)**: 직결(포트 5432) URI — 풀러로는 DDL 제약. 마이그레이션 시에만 임시 사용.

## 2. Kakao Developers 앱 ☐
1. ☐ https://developers.kakao.com → 애플리케이션 추가
2. ☐ **앱 키** 확인
   - JavaScript 키 → `NEXT_PUBLIC_KAKAO_JS_KEY` (지도/공유 SDK용, S4·S5)
   - REST API 키 → `KAKAO_REST_API_KEY` (Local 장소검색/중간지점, S8)
3. ☐ **플랫폼 → Web** 사이트 도메인 등록: `http://localhost:3000`, 배포 도메인(아래 4에서 확정)
4. ☐ **카카오 로그인** 활성화 (S9에서 실제 사용, PoC ②에서 연동 확인)
   - Redirect URI: `https://<배포도메인>/auth/callback`, 로컬은 `http://localhost:3000/auth/callback`
   - 동의항목: 닉네임/프로필 (이메일은 검수 필요 — 선택)
5. ☐ **카카오 공유(Kakao Link)**: 메시지 템플릿은 기본 템플릿으로 시작 가능. 커스텀 템플릿은 도구에서 생성(승인 불필요, S4에서 확인).
6. ☐ **Kakao Local API 쿼터** 확인: 키워드/카테고리 검색 일 쿼터 한도 메모 (부록 A 미확인 항목 — 중간지점 기능 설계 영향)

> ⚠️ PoC ②의 핵심: Supabase Auth는 Kakao를 **공식 OAuth provider로 지원하지 않을 수 있음**(부록 A). 두 경로 중 택1을 PoC에서 확정:
> - (A) Supabase Auth Custom OAuth / 또는 Kakao를 OIDC로 연결
> - (B) Auth.js(NextAuth) Kakao provider 폴백 (PLAN §9 리스크 완화)
> 로그인은 **선택 기능(S9)** 이라 크리티컬 패스 아님 — 막히면 구글만으로도 v1 진행 가능.

## 3. Supabase ↔ 소셜 로그인 provider ☐
1. ☐ Supabase → Authentication → Providers → **Google** 활성화 (Google Cloud OAuth 클라이언트 발급 → client id/secret 입력)
2. ☐ **Kakao**: 위 2-4 경로(A/B) 결정에 따라 설정. PoC ②에서 인앱 브라우저 리다이렉트까지 실제 폰으로 확인.
3. ☐ Authentication → URL Configuration: Site URL + Redirect URLs에 로컬·배포 도메인 등록.

## 4. Vercel 배포 + 도메인 ☐
1. ☐ Vercel에 이 repo 연결 (Framework: Next.js 자동감지)
2. ☐ Environment Variables에 `.env.local` 값 등록 (Production/Preview 분리)
   - ⚠️ `secure` 쿠키는 https에서만 — 배포(https) 환경에서 PoC④ 쿠키 동작 확인
3. ☐ 배포 도메인 확정 후 **1~3의 도메인 등록란에 역반영** (Kakao 플랫폼/Redirect, Supabase Redirect URLs)
4. ☐ `NEXT_PUBLIC_SITE_URL` 을 배포 도메인으로 갱신

## 5. ADMIN_SESSION_SECRET ☐
- ☐ `openssl rand -base64 32` 로 생성 → `.env.local` 및 Vercel 양쪽에 설정 (PoC④ TTL 서명 쿠키 서명키)

---

## S-1 PoC 실제 검증 (위 완료 후, 폰 필요)
배포 URL을 **카카오톡으로 자신에게 전송 → 카톡 인앱 브라우저로 열어서** 확인:
- ☐ ① 인앱 브라우저에서 localStorage/쿠키 **지속성** (앱 재진입 후에도 유지되는지)
- ☐ ① Supabase OAuth 리다이렉트가 **인앱 브라우저에서 성공**하는지 (루프/차단 없는지) → 실패 시 "외부 브라우저로 열기" 유도 필요 여부 판단
- ☐ ② 카카오 로그인 → Supabase 세션 수립까지 end-to-end
- ☐ ③ 카카오맵 표시 / 공유 / Local 검색이 등록 도메인에서 동작
- ☐ ④ 배포(https)에서 관리자 PIN 입력 → TTL 서명 쿠키 발급·만료 동작 (코드/단위테스트는 통과 상태)

> 결과는 `docs/DECISIONS.md`의 "S-1 PoC 결과" 섹션에 기록한다.
