import { IBook } from "./book.schema";

export interface ITransactionBase {
  memberId: number;
  bookId: number;
}

export interface ITransaction extends ITransactionBase {
  id: number;
  dateOfIssue: Date;
  dueDate: Date;
}
