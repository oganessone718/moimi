import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Supabase pooler(pgbouncer, transaction mode)에서는 prepared statement 비활성 필요.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema, casing: "snake_case" });
