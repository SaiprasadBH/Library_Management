import {
  ColumnData,
  ColumnSet,
  WhereParamValue,
  SimpleWhereExpression,
  WhereExpression,
  AndWhereExpression,
  OrWhereExpression,
  NestedQuery,
  WhereParam,
} from "../database/dbTypes";
import { QueryConfig } from "./query-config.type";

const generateWhereClauseSql = <T>(
  whereParams: WhereExpression<T>
): [string, unknown[]] => {
  const data: unknown[] = [];
  const processSimpleExp = (exp: SimpleWhereExpression<T>) => {
    const whereQuery = Object.entries(exp)
      .map(([key, opts]) => {
        const columnName = `\`${key}\``;
        const paramValue = opts as WhereParam<T, keyof T>;
        let value =
          typeof paramValue.value === "string"
            ? `${paramValue.value}`
            : paramValue.value;
        let operator = "";

        if (value === null) {
          operator = paramValue.op === "EQUALS" ? " IS " : " IS NOT ";
        } else if (Array.isArray(value)) {
          if (paramValue.op === "IN" || paramValue.op === "NOT_IN") {
            operator = paramValue.op === "IN" ? " IN " : " NOT IN ";
            data.push(...value);
            const placeholders = value.map(() => "?").join(", ");

            return `${columnName}${operator}(${placeholders})`;
          }
        } else if (typeof value === "object" && "tableName" in value) {
          const [nestedQuery, nestedData] = generateSelectSql(
            value.tableName,
            value
          );
          operator = paramValue.op === "IN" ? " IN " : " NOT IN ";
          data.push(...nestedData);

          return `${columnName}${operator}(${nestedQuery})`;
        } else {
          switch (paramValue.op) {
            case "EQUALS":
              operator = " = ";
              break;

            case "NOT_EQUALS":
              operator = " != ";
              break;

            case "STARTS_WITH":
              operator = " LIKE ";
              value = `${value}%`;
              break;

            case "NOT_STARTS_WITH":
              operator = " NOT LIKE ";
              value = `${value}%`;
              break;

            case "ENDS_WITH":
              operator = " LIKE ";
              value = `%${value}`;
              break;

            case "NOT_ENDS_WITH":
              operator = " NOT LIKE ";
              value = `%${value}`;
              break;

            case "CONTAINS":
              operator = " LIKE ";
              value = `%${value}%`;
              break;

            case "NOT_CONTAINS":
              operator = " NOT LIKE ";
              value = `%${value}%`;
              break;

            case "GREATER_THAN":
              operator = " > ";
              break;

            case "GREATER_THAN_EQUALS":
              operator = " >= ";
              break;

            case "LESSER_THAN":
              operator = " < ";
              break;

            case "LESSER_THAN_EQUALS":
              operator = " <= ";
              break;
          }
        }
        if (typeof value === "string") {
          data.push(`${value}`);
        } else {
          data.push(value);
        }
        return `${columnName}${operator}?`;
      })
      .join(" AND ");
    return whereQuery;
  };
  const whKeys = Object.keys(whereParams);

  if (whKeys.includes("AND")) {
    //it's an AndWhereExpression
    const andClause = (whereParams as AndWhereExpression<T>).AND.map((exp) => {
      const [query, queryData] = generateWhereClauseSql(exp);
      data.push(...queryData);
      return query;
    })
      .filter((c) => c)
      .join(" AND ");
    return [`(${andClause})`, data];
  } else if (whKeys.includes("OR")) {
    //it's an OrWhereExpression
    const orClause = (whereParams as OrWhereExpression<T>).OR.map((exp) => {
      const [query, queryData] = generateWhereClauseSql(exp);
      data.push(...queryData);
      return query;
    })
      .filter((c) => c)
      .join(" OR ");
    return [`(${orClause})`, data];
  } else {
    //it's a SimpleWhereExpression
    const simpleClause = processSimpleExp(
      whereParams as SimpleWhereExpression<T>
    );
    return [`(${simpleClause})`, data];
  }
};

const generateInsertSql = <Model>(
  tableName: string,
  row: ColumnSet<Model>
): [string, unknown[]] => {
  const columns: string[] = [];
  const placeholders: string[] = [];
  const values: unknown[] = [];

  Object.entries(row).forEach(([key, value]) => {
    columns.push(`\`${key}\``);
    placeholders.push("?");
    values.push(value);
  });

  const sql = `INSERT INTO \`${tableName}\` (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
  return [sql, values];
};

const generateUpdateSql = <Model>(
  tableName: string,
  row: ColumnSet<Model>,
  where: WhereExpression<Model>
): [string, unknown[]] => {
  const setClause = Object.entries(row)
    .map(([key, newValue]) => {
      return `\`${key}\` = ?`;
    })
    .join(", ");

  const values = Object.values(row);
  let sql = `UPDATE ${tableName} SET ${setClause}`;

  if (Object.keys(where).length !== 0) {
    const [whereClause, whereData] = generateWhereClauseSql<Model>(where);
    sql += ` WHERE ${whereClause}`;
    values.push(...whereData);
  }
  return [sql, values];
};

const generateDeleteSql = <Model>(
  tableName: string,
  where: WhereExpression<Model>
): [string, unknown[]] => {
  let sql = `DELETE FROM ${tableName}`;
  const values: unknown[] = [];

  if (Object.keys(where).length !== 0) {
    const [whereClause, whereData] = generateWhereClauseSql<Model>(where);
    sql += ` WHERE ${whereClause}`;
    values.push(...whereData);
  }
  return [sql, values];
};

const sanitizeFields = (field: string) => {
  let sanitisedField = String(field);
  sanitisedField = sanitisedField.startsWith("`")
    ? sanitisedField
    : "`" + sanitisedField;
  sanitisedField += sanitisedField.endsWith("`") ? sanitisedField : "`";
  return sanitisedField;
};

const generateSelectSql = <Model>(
  tableName: string,
  selectConfig?: QueryConfig<Model>
): [string, unknown[]] => {
  let sql: string = `SELECT * FROM \`${tableName}\``;
  const values: unknown[] = [];
  if (selectConfig) {
    if (selectConfig.fieldsToSelect) {
      const fieldsToSelect = selectConfig.fieldsToSelect.map((field) =>
        sanitizeFields(field as string)
      );
      sql = `SELECT ${fieldsToSelect.join(", ")} FROM \`${tableName}\``;
    }
    if (selectConfig.where && Object.keys(selectConfig.where).length !== 0) {
      const [whereClause, whereData] = generateWhereClauseSql(
        selectConfig.where
      );
      sql += ` WHERE ${whereClause}`;
      values.push(...whereData);
    }
    if (selectConfig.limit !== undefined) sql += ` LIMIT ${selectConfig.limit}`;
    if (selectConfig.offset !== undefined)
      sql += ` OFFSET ${selectConfig.offset}`;
  }
  return [sql, values];
};

const generateCountSql = <Model>(
  tableName: string,
  where?: WhereExpression<Model>
): [string, unknown[]] => {
  let sql = `SELECT COUNT(*) AS \`count\` FROM ${tableName}`;
  const values: unknown[] = [];

  if (where && Object.keys(where).length !== 0) {
    const [whereClause, whereData] = generateWhereClauseSql(where);
    sql += ` WHERE ${whereClause}`;
    values.push(...whereData);
  }
  return [sql, values];
};

export const MySqlQueryGenerator = {
  generateWhereClauseSql,
  generateInsertSql,
  generateUpdateSql,
  generateDeleteSql,
  generateSelectSql,
  generateCountSql,
};
