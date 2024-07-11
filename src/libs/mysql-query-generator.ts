import {
  AndWhereExpression,
  OrWhereExpression,
  SimpleWhereExpression,
  ColumnSet,
  WhereExpression,
  WhereParamValue,
} from "../database/dbTypes";

const generateWhereClauseSql = <T>(whereParams: WhereExpression<T>): string => {
  const processSimpleExp = (exp: SimpleWhereExpression<T>) => {
    const whereQuery = Object.entries(exp)
      .map(([key, opts]) => {
        const columnName = `\`${key}\``;
        const paramValue: WhereParamValue = opts as WhereParamValue;
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
        return `${columnName} ${operator} ${value}`;
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
const generateInsertSql = (tableName: string, row: ColumnSet): string => {
  const columns = Object.keys(row)
    .map((key) => `\`${key}\``)
    .join(", ");
  const values = Object.values(row)
    .map((value) => {
      if (typeof value === "string") {
        return `"${value}"`;
      } else {
        return `${value}`;
      }
    })
    .join(", ");

  const sql = `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values})`;

  return sql;
};

const generateUpdateSql = <T>(
  tableName: string,
  row: ColumnSet,
  where: WhereExpression<T>
): string => {
  let sql = `UPDATE \`${tableName}\` SET `;

  const setClauses = Object.entries(row).map(([key, value]) => {
    if (typeof value === "string") {
      return `\`${key}\` = "${value}"`;
    } else {
      return `\`${key}\` = ${value}`;
    }
  });

  sql += setClauses.join(", ");

  const whereClause = generateWhereClauseSql(where);
  if (whereClause) {
    sql += ` WHERE ${whereClause}`;
  } else {
    throw new Error("WHERE condition for UPDATE missing");
  }

  return sql;
};

const generateDeleteSql = <T>(
  tableName: string,
  where: WhereExpression<T>
): string => {
  let sql = `DELETE FROM \`${tableName}\``;
  const whereClause = generateWhereClauseSql<T>(where);
  if (whereClause) {
    sql += ` WHERE ${whereClause}`;
  }

  return sql;
};

const generateSelectSql = <T>(
  tableName: string,
  columns: Array<keyof Partial<T>>,
  where: WhereExpression<T>,
  offset: number,
  limit: number
): string => {
  const sanitizedColumns = columns?.map((column) => {
    //TODO need to modify here to check if there's only a trailing backtick
    return (column as string).startsWith("`")
      ? column
      : "`" + (column as string) + "`";
  });
  let sql = `SELECT`;
  let columnString;
  if (columns.length > 0) {
    columnString = sanitizedColumns.join(",");
  } else {
    columnString = "*";
  }
  sql += ` ${columnString} FROM \`${tableName}\``;

  const whereClause = generateWhereClauseSql(where);
  if (whereClause) {
    sql += ` WHERE ${whereClause} `;
  }

  sql += ` LIMIT ${limit} OFFSET ${offset}`;
  return sql;
};
const generateCountSql = <T>(
  tableName: string,
  where: WhereExpression<T>
): string => {
  let sql = `SELECT COUNT(*) FROM \`${tableName}\``;
  const whereClause = generateWhereClauseSql(where);
  if (whereClause) {
    sql += ` WHERE ${whereClause} `;
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
