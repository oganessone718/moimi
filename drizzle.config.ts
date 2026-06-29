import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // TS는 camelCase, DB 컬럼은 snake_case (PLAN §5: owner_user_id 등)
  casing: "snake_case",
});
