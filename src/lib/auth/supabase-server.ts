import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 서버(Server Component / Route Handler / Server Action)용 Supabase 클라이언트.
// 로그인 사용자(소유자 대시보드 등) 경로에서 사용. 게스트/PIN 경로는 서버 액션 검증을 따로 둔다.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component에서 호출 시 set 불가 — 세션 갱신은 middleware가 담당.
          }
        },
      },
    },
  );
}
