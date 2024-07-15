import { MySQLAdapter } from "./dbAdapter";
import { MySqlQueryGenerator } from "../libs/mysql-query-generator";
import { ColumnSet, WhereExpression } from "./dbTypes";
import mysql from "mysql2/promise";
import { QueryConfig } from "../libs/query-config.type";
import { isBuffer } from "util";

interface IDatabase {
  create<T>(
    tableName: string,
    data: ColumnSet<T>
  ): Promise<mysql.QueryResult | null>;
  read<T>(
    tableName: string,
    queryConfig?: QueryConfig<T>
  ): Promise<mysql.QueryResult | null>;
  update<T>(
    tableName: string,
    data: ColumnSet<T>,
    where: WhereExpression<T>
  ): Promise<mysql.QueryResult | null>;
  delete<T>(
    tableName: string,
    where: WhereExpression<T>
  ): Promise<mysql.QueryResult | null>;
}

export class LibraryDb implements IDatabase {
  constructor(private readonly adapter: MySQLAdapter) {}

  async create<T>(
    tableName: string,
    data: ColumnSet<T>
  ): Promise<mysql.QueryResult | null> {
    const query = MySqlQueryGenerator.generateInsertSql(tableName, data);
    const results = await this.adapter.runQuery(query);
    if (results) {
      return results;
    }
    return null;
  }

  async read<T>(
    tableName: string,
    queryConfig?: QueryConfig<T>
  ): Promise<mysql.QueryResult | null> {
    const query = MySqlQueryGenerator.generateSelectSql(tableName, queryConfig);
    console.log(query);
    const results = await this.adapter.runQuery(query);
    if (results) {
      return results;
    }
    return null;
  }

  async update<T>(
    tableName: string,
    data: ColumnSet<T>,
    where: WhereExpression<T>
  ): Promise<mysql.QueryResult | null> {
    const query = MySqlQueryGenerator.generateUpdateSql(tableName, data, where);
    const results = await this.adapter.runQuery(query);
    if (results) {
      return results;
    }
    return null;
  }

  async delete<T>(
    tableName: string,
    where: WhereExpression<T>
  ): Promise<mysql.QueryResult | null> {
    const query = MySqlQueryGenerator.generateDeleteSql(tableName, where);
    const results = await this.adapter.runQuery(query);
    if (results) {
      return results;
    }
    return null;
  }
}
