import { IBook } from "../models/book.model";
import { IMember } from "../models/member.schema";
import { ITransaction } from "../models/transaction.model";

export interface MockLibraryDataset {
  books: IBook;
  members: IMember;
  transactions: ITransaction;
}
