import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { AppEnvs } from "../src/core/read-env";

export async function migrateDb() {
  const databaseUrl = AppEnvs.DATABASE_URL;
  const migrationsPath = `${__dirname}/migration`;
  const migrationClient = await mysql.createConnection({
    uri: databaseUrl,
    multipleStatements: true,
  });

  await migrate(drizzle(migrationClient), {
    migrationsFolder: migrationsPath,
  });

  await migrationClient.end();
}

migrateDb();
