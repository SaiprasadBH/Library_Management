import mysql from "mysql2/promise";
import "dotenv/config";

/**
 * This config object must be passed to create the SQLDBManager
 */

interface DBConfig {
  dbURL: string;
}

export class MySQLAdapter {
  private pool: mysql.Pool | null = null;
  private connection: mysql.PoolConnection | null = null;
  constructor(private readonly config: DBConfig) {}
  async load() {
    this.pool = await mysql.createPool(this.config.dbURL);
    this.connection = await this.pool.getConnection();
  }
  async shutdown() {
    this.connection?.release();
    this.pool?.end();
    this.connection = null;
    this.pool = null;
  }
  async runQuery(query: string): Promise<unknown> {
    if (this.connection) {
      return await this.connection?.query(query);
    } else {
      throw new Error(
        "Database connection not available,need to load database first"
      );
    }
  }
}
