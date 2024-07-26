import { defineConfig } from "drizzle-kit";
import { AppEnvs } from "./src/core/read-env";

export default defineConfig({
  schema: "./drizzle-mysql2-orm/schema.ts",
  out: "./drizzle-mysql2-orm/migration",
  dialect: "mysql",
  dbCredentials: {
    url: AppEnvs.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
