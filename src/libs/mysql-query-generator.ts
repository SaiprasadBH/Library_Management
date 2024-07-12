import {
  ColumnData,
  ColumnSet,
  WhereParam,
  SimpleWhereExpression,
  WhereExpression,
  AndWhereExpression,
  OrWhereExpression,
} from "../database/dbTypes";
import { QueryConfig } from "./query-config.type";

const generateWhereClauseSql = <T>(whereParams: WhereExpression<T>): string => {
  const processSimpleExp = (exp: SimpleWhereExpression<T>) => {
    const whereQuery = Object.entries(exp)
      .map(([key, opts]) => {
        const columnName = `\`${key}\``;
        const paramValue = opts as WhereParam<T, keyof T>;
        let value = `${paramValue.value}`;
        let operator = "";
        if (paramValue.value === null) {
          if (paramValue.op === "EQUALS") {
            operator = " IS ";
          } else {
            operator = " IS NOT ";
          }
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

        if (typeof paramValue.value === "string") {
          value = `"${value}"`;
        }
        return `${columnName}${operator}${value}`;
      })
      .join(" AND ");
    return whereQuery;
  };
  const whKeys = Object.keys(whereParams);

  if (whKeys.includes("AND")) {
    //it's an AndWhereExpression
    const andClause = (whereParams as AndWhereExpression<T>).AND.map((exp) =>
      generateWhereClauseSql(exp)
    )
      .filter((c) => c)
      .join(" AND ");
    return andClause ? `(${andClause})` : "";
  } else if (whKeys.includes("OR")) {
    //it's an OrWhereExpression
    const orClause = (whereParams as OrWhereExpression<T>).OR.map((exp) =>
      generateWhereClauseSql(exp)
    )
      .filter((c) => c)
      .join(" OR ");
    return orClause ? `(${orClause})` : "";
  } else {
    //it's a SimpleWhereExpression
    const simpleClause = processSimpleExp(
      whereParams as SimpleWhereExpression<T>
    );
    return simpleClause ? `(${simpleClause})` : "";
  }
};

const generateInsertSql = <Model>(
  tableName: string,
  row: ColumnSet<Model>
): string => {
  let columns = "";
  let values = "";

  Object.entries(row).forEach(([key, data]) => {
    const value = data as ColumnData<Model, keyof Model>;
    if (columns) columns += ", ";
    columns += `\`${key}\``;

    if (values) values += ", ";
    if (typeof value === "string") {
      values += `"${value}"`;
    } else {
      values += `${value}`;
    }
  });

  let sql = `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values})`;

  return sql;
};

const generateUpdateSql = <Model>(
  tableName: string,
  row: ColumnSet<Model>,
  where: WhereExpression<Model>
): string => {
  const setClause = Object.entries(row)
    .map(([key, newValue]) => {
      const value = newValue as ColumnData<Model, keyof Model>;
      const columnName = `\`${key}\``;
      let formattedValue =
        typeof value === "string" ? `"${value}"` : `${value}`;
      return `${columnName} = ${formattedValue}`;
    })
    .join(", ");

  let sql = `UPDATE ${tableName} SET ${setClause}`;

  if (Object.keys(where).length !== 0) {
    const whereClause = generateWhereClauseSql<Model>(where);
    sql += ` WHERE ${whereClause}`;
  }

  return sql;
};

const generateDeleteSql = <Model>(
  tableName: string,
  where: WhereExpression<Model>
): string => {
  let sql: string = `DELETE FROM ${tableName}`;
  if (Object.keys(where).length !== 0) {
    const whereClause = generateWhereClauseSql<Model>(where);
    sql += ` WHERE ${whereClause}`;
  }
  return sql;
};

const generateSelectSql = <Model>(
  tableName: string,
  selectConfig?: QueryConfig<Model>
): string => {
  let sql: string = `SELECT * FROM \`${tableName}\``;
  if (selectConfig) {
    if (selectConfig.fieldsToSelect) {
      const fieldsToSelect = selectConfig.fieldsToSelect.map((field) => {
        let sanitisedField = String(field);
        sanitisedField = sanitisedField.startsWith("`")
          ? sanitisedField
          : "`" + sanitisedField;
        sanitisedField += sanitisedField.endsWith("`") ? sanitisedField : "`";
        return sanitisedField;
      });

      sql = `SELECT ${fieldsToSelect.join(", ")} FROM \`${tableName}\``;
    }
    if (selectConfig.where && Object.keys(selectConfig.where).length !== 0) {
      const whereClause = generateWhereClauseSql(selectConfig.where);
      sql += ` WHERE ${whereClause}`;
    }
    if (selectConfig.limit !== undefined) sql += ` LIMIT ${selectConfig.limit}`;
    if (selectConfig.offset !== undefined)
      sql += ` OFFSET ${selectConfig.offset}`;
  }
  return sql;
};

const generateCountSql = <Model>(
  tableName: string,
  where?: WhereExpression<Model>
): string => {
  let sql = `SELECT COUNT(*) AS \`count\` FROM ${tableName}`;

  if (where && Object.keys(where).length !== 0) {
    const whereClause = generateWhereClauseSql(where);
    sql += ` WHERE ${whereClause}`;
  }

  return sql;
};

export const MySqlQueryGenerator = {
  generateWhereClauseSql,
  generateInsertSql,
  generateUpdateSql,
  generateDeleteSql,
  generateSelectSql,
  generateCountSql,
};
