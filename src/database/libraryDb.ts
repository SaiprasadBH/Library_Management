import mysql from "mysql2/promise";
import { ColumnSet, WhereExpression } from "./dbTypes";
import { MySqlQueryGenerator } from "../libs/mysql-query-generator";
import { MySQLAdapter } from "./dbAdapter";
import { QueryConfig } from "../libs/query-config.type";

interface IDatabase {
  insert<T>(
    tableName: string,
    data: ColumnSet<T>
  ): Promise<mysql.QueryResult | null>;
  select<T>(
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

export class MySQLDatabase implements IDatabase {
  constructor(private readonly adapter: MySQLAdapter) {}

  async insert<T>(
    tableName: string,
    data: ColumnSet<T>
  ): Promise<mysql.QueryResult | null> {
    const [query, values] = MySqlQueryGenerator.generateInsertSql(
      tableName,
      data
    );
    const results = await this.adapter.runQuery(query, values);
    if (results) {
      return results;
    }
    return null;
  }

  async select<T>(
    tableName: string,
    queryConfig?: QueryConfig<T>
  ): Promise<mysql.QueryResult | null> {
    const [query, values] = MySqlQueryGenerator.generateSelectSql(
      tableName,
      queryConfig
    );
    const results = await this.adapter.runQuery(query, values);
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
    const [query, values] = MySqlQueryGenerator.generateUpdateSql(
      tableName,
      data,
      where
    );
    const results = await this.adapter.runQuery(query, values);
    if (results) {
      return results;
    }
    return null;
  }

  async delete<T>(
    tableName: string,
    where: WhereExpression<T>
  ): Promise<mysql.QueryResult | null> {
    const [query, values] = MySqlQueryGenerator.generateDeleteSql(
      tableName,
      where
    );
    const results = await this.adapter.runQuery(query, values);
    if (results) {
      return results;
    }
    return null;
  }
}
