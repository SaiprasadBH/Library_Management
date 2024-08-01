import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { AppEnvs } from "../src/core/read-env";
import { members, books, transactions } from "./schema";

export interface IDrizzleAdapter {
  getStandaloneConnection: () => Promise<
    MySql2Database<Record<string, unknown>>
  >;
  getPoolConnection: () => Promise<MySql2Database<Record<string, unknown>>>;
}

export class DrizzleAdapter implements IDrizzleAdapter {
  private standaloneConnection: ReturnType<typeof drizzle> | undefined;
  private poolConnection: ReturnType<typeof drizzle> | undefined;
  private dbUrl: string | undefined;

  constructor(dbUrl: string) {
    this.dbUrl = dbUrl;
  }

  async getStandaloneConnection() {
    if (!this.standaloneConnection) {
      const databaseUrl = this.dbUrl;
      const connection = await mysql.createConnection({
        uri: databaseUrl,
      });
      this.standaloneConnection = drizzle(connection);
    }
    return this.standaloneConnection;
  }

  async getPoolConnection() {
    if (!this.poolConnection) {
      const databaseUrl = this.dbUrl;
      const pool = mysql.createPool({
        uri: databaseUrl,
      });
      this.poolConnection = drizzle(pool);
    }
    return this.poolConnection;
  }
}

const drizzleAdapter = new DrizzleAdapter(AppEnvs.DATABASE_URL);
export { drizzleAdapter, members, books, transactions };
