import { RowData, WhereExpression, QueryTypes } from "./dbTypes";

type ConfigForInsertQuery<Model> = {
  row: RowData<Model>;
};

type ConfigForUpdateQuery<Model> = {
  row: RowData<Model>;
  where: WhereExpression<Model>;
};

type ConfigForDeleteQuery<Model> = {
  where: WhereExpression<Model>;
};

type ConfigForSelectQuery<Model> = {
  fieldsToSelect?: Array<keyof Partial<Model>>;
  where?: WhereExpression<Model>;
  pagination?: { offset?: number; limit: number };
};

type ConfigForCountQuery<Model> = {
  where?: WhereExpression<Model>;
};

export type QueryConfig<
  Model,
  QueryType extends QueryTypes | undefined = undefined,
> = QueryType extends "insert"
  ? ConfigForInsertQuery<Model>
  : QueryType extends "update"
    ? ConfigForUpdateQuery<Model>
    : QueryType extends "delete"
      ? ConfigForDeleteQuery<Model>
      : QueryType extends "select" | undefined
        ? ConfigForSelectQuery<Model>
        : QueryType extends "count"
          ? ConfigForCountQuery<Model>
          : never;
