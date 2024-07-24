// this layer needs to be initialized in the main.interactor.
import mysql from "mysql2/promise";
import "dotenv/config";
import { DBConfig } from "./dbTypes";

interface Adapter {
  shutdown: () => Promise<void>;
  runQuery: (
    query: string,
    data: unknown[]
  ) => Promise<mysql.QueryResult | undefined>;
}

export class MySQLAdapter implements Adapter {
  private pool: mysql.Pool;

  constructor(config: DBConfig) {
    this.pool = mysql.createPool(config.dbURL);
  }

  async shutdown() {
    return this.pool.end();
  }

  async runQuery(
    query: string,
    data: unknown[]
  ): Promise<mysql.QueryResult | undefined> {
    let connection: mysql.PoolConnection | null = null;
    try {
      const connection = await this.pool.getConnection();
      const [result] = await connection.query(query, data);
      return result;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    } finally {
      if (connection) {
        this.pool.releaseConnection(connection);
      }
    }
  }
}
