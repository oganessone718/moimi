import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Db = ReturnType<typeof drizzle<typeof schema>>;

let _db: Db | null = null;

// 지연 초기화: 모듈 import 시 연결하지 않는다(빌드/SSR 안전).
// 실제 쿼리 시점에 DATABASE_URL 검증. Supabase pooler(pgbouncer)에서는 prepare:false 필요.
export function getDb(): Db {
  if (_db) return _db;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const client = postgres(connectionString, { prepare: false });
  _db = drizzle(client, { schema, casing: "snake_case" });
  return _db;
}
