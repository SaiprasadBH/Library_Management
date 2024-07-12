export type ISelect<T> = {
  fieldsToSelect: Array<keyof Partial<T>>;
};
