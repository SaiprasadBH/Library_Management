import { QueryConfig } from "./query-config.type";

export type ColumnData<T, K extends keyof T> = T[K];
export type RowData<T> = { [K in keyof Partial<T>]: ColumnData<T, K> };

export type StringOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "STARTS_WITH"
  | "NOT_STARTS_WITH"
  | "ENDS_WITH"
  | "NOT_ENDS_WITH"
  | "CONTAINS"
  | "NOT_CONTAINS";

export type NumberOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "GREATER_THAN"
  | "GREATER_THAN_EQUALS"
  | "LESSER_THAN"
  | "LESSER_THAN_EQUALS";

export type BooleanOperator = "EQUALS" | "NOT_EQUALS";

export type VectorOperator = "IN" | "NOT_IN";

export type StringOperatorParam = {
  op: StringOperator;
  value: string | null;
};

export type NumberOperatorParam = {
  op: NumberOperator;
  value: number | null;
};

export type BooleanOperatorParam = {
  op: BooleanOperator;
  value: boolean | null;
};

export type VectorOperatorParam<CompleteModel> = {
  op: VectorOperator;
  value:
    | ColumnData<CompleteModel, keyof CompleteModel>[]
    | NestedQuery<CompleteModel>;
};

export type PageOption = {
  offset?: number;
  limit?: number;
};

export type WhereParamValue<CompleteModel> =
  | StringOperatorParam
  | NumberOperatorParam
  | BooleanOperatorParam
  | VectorOperatorParam<CompleteModel>;

export type WhereParam<Model, Key extends keyof Model> = {
  op: Model[Key] extends number
    ? NumberOperator | VectorOperator
    : Model[Key] extends string
      ? StringOperator | VectorOperator
      : BooleanOperator;
  value: Model[Key] | Array<Model[Key]> | NestedQuery<Model> | null;
};

export type SimpleWhereExpression<CompleteModel> = {
  [key in keyof Partial<CompleteModel>]: WhereParamValue<CompleteModel>;
};

export type OrWhereExpression<CompleteModel> = {
  OR: WhereExpression<CompleteModel>[];
};

export type AndWhereExpression<CompleteModel> = {
  AND: WhereExpression<CompleteModel>[];
};

export type WhereExpression<CompleteModel> =
  | SimpleWhereExpression<CompleteModel>
  | OrWhereExpression<CompleteModel>
  | AndWhereExpression<CompleteModel>;

export interface PreparedStatement<CompleteModel> {
  query: string;
  values: ColumnData<CompleteModel, keyof CompleteModel>[];
}

export interface NestedQuery<CompleteModel> extends QueryConfig<CompleteModel> {
  tableName: string;
  // fieldsToSelect?: Array<keyof Partial<CompleteModel>>;
  // where: WhereExpression<CompleteModel>;
  // offset?: number;
  // limit?: number;
}

/**
 * This is the config object that must be passed to create the MySQLAdapter.
 */
export interface DBConfig {
  // The complete url to the database with user_name, password, host, port and database name.
  dbURL: string;
}

export type QueryTypes = "select" | "insert" | "update" | "delete" | "count";
