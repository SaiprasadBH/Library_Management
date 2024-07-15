import { ColumnSet, WhereExpression } from "../database/dbTypes";

export interface QueryConfig<T> {
  fieldsToSelect?: Array<keyof Partial<T>>;
  row?: ColumnSet<T>;
  where?: WhereExpression<T>;
  offset?: number;
  limit?: number;
}
