export type ColumnData = string | number | boolean | null;
export type ColumnSet = Record<string, ColumnData>;

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

export type WhereParamValue =
  | StringOperatorParam
  | NumberOperatorParam
  | BooleanOperatorParam;

export type PageOption = {
  offset?: number;
  limit?: number;
};

export type WhereExpression<CompleteModel> =
  | SimpleWhereExpression<CompleteModel>
  | OrWhereExpression<CompleteModel>
  | AndWhereExpression<CompleteModel>;

export type SimpleWhereExpression<CompleteModel> = {
  [key in keyof Partial<CompleteModel>]: WhereParamValue;
};

export type OrWhereExpression<CompleteModel> = {
  OR: WhereExpression<CompleteModel>[];
};
export type AndWhereExpression<CompleteModel> = {
  AND: WhereExpression<CompleteModel>[];
};
