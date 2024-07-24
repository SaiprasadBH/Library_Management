import { BookStatus } from "../core/types";
export interface ITransactionBase {
  memberId: number;
  bookId: number;
}

export interface ITransaction extends ITransactionBase {
  id: number;
  bookStatus: BookStatus;
  dateOfIssue: string;
  dueDate: string;
}
