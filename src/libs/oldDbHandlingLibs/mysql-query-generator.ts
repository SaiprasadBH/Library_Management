import {
  ColumnData,
  RowData,
  WhereParam,
  SimpleWhereExpression,
  WhereExpression,
  AndWhereExpression,
  OrWhereExpression,
  PreparedStatement,
  WhereParamValue,
} from "../../database/oldDbHandlingUtilities/dbTypes";
import { QueryConfig } from "../../database/oldDbHandlingUtilities/query-config.type";
import { LibraryDataset } from "../../database/library.dataset";

const generateWhereClauseSql = <Model>(
  whereParams: WhereExpression<Model>
): PreparedStatement<Model> => {
  const queryObject: PreparedStatement<Model> = { query: "", values: [] };
  const processSimpleExp = (exp: SimpleWhereExpression<Model>) => {
    const whereQuery = Object.entries(exp)
      .map(([key, opts]) => {
        const columnName = `\`${key}\``;
        const paramValue = opts as WhereParamValue<Model>;
        let value = paramValue.value;
        let operator = "";
        if (value === null) {
          if (paramValue.op === "EQUALS") {
            operator = " IS ";
          } else {
            operator = " IS NOT ";
          }
        } else if (Array.isArray(paramValue.value)) {
          value = paramValue.value;
          if (paramValue.op === "IN" || paramValue.op === "NOT_IN") {
            operator = paramValue.op === "IN" ? " IN " : " NOT IN ";
            queryObject.values.push(...value);
            const placeholders = value.map(() => "?").join(", ");

            return `${columnName}${operator}(${placeholders})`;
          }
        } else if (typeof value === "object" && "tableName" in value) {
          const { query: nestedQuery, values: nestedData } = generateSelectSql(
            value.tableName as keyof LibraryDataset,
            value as QueryConfig<LibraryDataset[keyof LibraryDataset]>
          );
          operator = paramValue.op === "IN" ? " IN " : " NOT IN ";
          queryObject.values.push(
            ...(nestedData as ColumnData<Model, keyof Model>[])
          );

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
        queryObject.values.push(value as ColumnData<Model, keyof Model>);

        return `${columnName}${operator}?`;
      })
      .join(" AND ");
    return whereQuery;
  };
  const whKeys = Object.keys(whereParams);

  if (whKeys.includes("AND")) {
    //it's an AndWhereExpression
    const andClause = (whereParams as AndWhereExpression<Model>).AND.map(
      (exp) => {
        const { query, values } = generateWhereClauseSql(exp);
        queryObject.values.push(...values);
        return query;
      }
    )
      .filter((c) => c)
      .join(" AND ");
    queryObject.query += andClause ? `(${andClause})` : "";
    return queryObject;
  } else if (whKeys.includes("OR")) {
    //it's an OrWhereExpression
    const orClause = (whereParams as OrWhereExpression<Model>).OR.map((exp) => {
      const { query, values } = generateWhereClauseSql(exp);
      queryObject.values.push(...values);
      return query;
    })
      .filter((c) => c)
      .join(" OR ");
    queryObject.query += orClause ? `(${orClause})` : "";
    return queryObject;
  } else {
    //it's a SimpleWhereExpression
    const simpleClause = processSimpleExp(
      whereParams as SimpleWhereExpression<Model>
    );
    queryObject.query += simpleClause ? `(${simpleClause})` : "";
    return queryObject;
  }
};

const appendWhereClause = <Model>(
  queryObject: PreparedStatement<Model>,
  where: WhereExpression<Model>
): PreparedStatement<Model> => {
  if (Object.keys(where).length !== 0) {
    const { query, values } = generateWhereClauseSql<Model>(where);
    queryObject.query += ` WHERE ${query}`;
    queryObject.values.push(...values);
  }
  return queryObject;
};

const generateInsertSql = <
  ModelName extends keyof LibraryDataset,
  Model extends LibraryDataset[ModelName],
>(
  tableName: ModelName,
  row: RowData<Model>
): PreparedStatement<Model> => {
  let columns = "";
  let values = "";
  const queryObject: PreparedStatement<Model> = {
    query: "",
    values: [],
  };
  Object.entries(row).forEach(([key, data]) => {
    const value = data as ColumnData<Model, keyof Model>;
    if (columns) columns += ", ";
    columns += `\`${key}\``;

    if (values) values += ", ";
    values += "?";
    queryObject.values.push(value);
  });

  queryObject.query += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values})`;

  return queryObject;
};

const generateUpdateSql = <
  ModelName extends keyof LibraryDataset,
  Model extends LibraryDataset[ModelName],
>(
  tableName: ModelName,
  row: RowData<Model>,
  where: WhereExpression<Model>
): PreparedStatement<Model> => {
  let queryObject: PreparedStatement<Model> = { query: "", values: [] };
  const setClause = Object.entries(row)
    .map(([key, newValue]) => {
      queryObject.values.push(newValue as ColumnData<Model, keyof Model>);
      const columnName = `\`${key}\``;
      return `${columnName} = ?`;
    })
    .join(", ");

  queryObject.query += `UPDATE ${tableName} SET ${setClause}`;

  queryObject = appendWhereClause(queryObject, where);

  return queryObject;
};

const generateDeleteSql = <
  ModelName extends keyof LibraryDataset,
  Model extends LibraryDataset[ModelName],
>(
  tableName: ModelName,
  where: WhereExpression<Model>
): PreparedStatement<Model> => {
  let queryObject: PreparedStatement<Model> = {
    query: `DELETE FROM ${tableName}`,
    values: [],
  };
  queryObject = appendWhereClause(queryObject, where);
  return queryObject;
};

const sanitizeFields = (field: string) => {
  let sanitisedField = String(field);
  sanitisedField = sanitisedField.startsWith("`")
    ? sanitisedField
    : "`" + sanitisedField;
  sanitisedField += sanitisedField.endsWith("`") ? sanitisedField : "`";
  return sanitisedField;
};

const generateSelectSql = <
  ModelName extends keyof LibraryDataset,
  Model extends LibraryDataset[ModelName],
>(
  tableName: ModelName,
  selectConfig?: QueryConfig<Model>
): PreparedStatement<Model> => {
  let queryObject: PreparedStatement<Model> = {
    query: `SELECT * FROM \`${tableName}\``,
    values: [],
  };
  if (selectConfig) {
    if (selectConfig.fieldsToSelect) {
      const fieldsToSelect = selectConfig.fieldsToSelect.map((field) =>
        sanitizeFields(field as string)
      );

      queryObject.query = `SELECT ${fieldsToSelect.join(", ")} FROM \`${tableName}\``;
    }
    if (selectConfig.where) {
      queryObject = appendWhereClause(queryObject, selectConfig.where);
    }
    if (selectConfig.pagination?.limit) {
      queryObject.query += ` LIMIT ?`;
      queryObject.values.push(
        selectConfig.pagination.limit as ColumnData<Model, keyof Model>
      );
    }
    if (selectConfig.pagination?.offset) {
      queryObject.query += ` OFFSET ?`;
      queryObject.values.push(
        selectConfig.pagination.offset as ColumnData<Model, keyof Model>
      );
    }
  }
  return queryObject;
};

const generateCountSql = <
  ModelName extends keyof LibraryDataset,
  Model extends LibraryDataset[ModelName],
>(
  tableName: ModelName,
  where?: WhereExpression<Model>
): PreparedStatement<Model> => {
  let queryObject: PreparedStatement<Model> = {
    query: `SELECT COUNT(*) AS \`count\` FROM ${tableName}`,
    values: [],
  };

  if (where) {
    queryObject = appendWhereClause(queryObject, where);
  }

  return queryObject;
};

export const MySqlQueryGenerator = {
  generateWhereClauseSql,
  generateInsertSql,
  generateUpdateSql,
  generateDeleteSql,
  generateSelectSql,
  generateCountSql,
};
