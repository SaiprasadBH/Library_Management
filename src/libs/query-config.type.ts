import { ColumnSet, WhereExpression } from "../database/dbTypes";

export interface QueryConfig<T> {
  where?: WhereExpression<T>;
  fieldsToSelect?: Array<keyof Partial<T>>;
  row?: ColumnSet<T>;
  offset?: number;
  limit?: number;
}
