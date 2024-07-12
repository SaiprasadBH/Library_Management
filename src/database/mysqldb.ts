import mysql from "mysql2/promise";
import "dotenv/config";
import { ColumnSet, WhereExpression } from "./dbTypes";
import { MySqlQueryGenerator } from "../libs/mysql-query-generator";
import { AppEnvs } from "../core/read-env";

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
    this.pool = mysql.createPool(this.config.dbURL);
    this.connection = await this.pool.getConnection();
  }
  async shutdown() {
    this.connection?.release();
    this.pool?.end();
    this.connection = null;
    this.pool = null;
  }
  async runQuery(query: string): Promise<mysql.QueryResult> {
    if (this.connection) {
      const [result] = await this.connection?.query(query);
      return result;
    } else {
      throw new Error(
        "Database connection not available,need to load database first"
      );
    }
  }
}

export class MySQLDatabase {
  private mySQLAdapter: MySQLAdapter;

  constructor(mySQLAdapter: MySQLAdapter) {
    this.mySQLAdapter = mySQLAdapter;
  }

  async select<T>(
    tableName: string,
    fieldsToSelect: Array<keyof Partial<T>>,
    where: WhereExpression<T>,
    offset: number,
    limit: number
  ): Promise<mysql.QueryResult> {
    const selectQuery = MySqlQueryGenerator.generateSelectSql<T>(tableName, {
      fieldsToSelect,
      where,
      offset,
      limit,
    });
    const result = await this.mySQLAdapter.runQuery(selectQuery);

    return result;
  }

  async insert<T>(tableName: string, row: T): Promise<mysql.QueryResult> {
    const insertQuery = MySqlQueryGenerator.generateInsertSql<T>(
      tableName,
      row as ColumnSet<T>
    );
    const result = await this.mySQLAdapter.runQuery(insertQuery);

    return result;
  }
  async delete<T>(
    tableName: string,
    where: WhereExpression<T>
  ): Promise<mysql.QueryResult> {
    const deleteQuery = MySqlQueryGenerator.generateDeleteSql<T>(
      tableName,
      where
    );
    const result = await this.mySQLAdapter.runQuery(deleteQuery);

    return result;
  }
}
