import { IBook, IBookBase } from "../models/book.model";
import { IMember, IMemberBase } from "../models/member.model";
import { ITransaction, ITransactionBase } from "../models/transaction.model";

export type BookStatus = "issued" | "returned";

export type Models = IBook | IMember | ITransaction;
export type BaseModels = IBookBase | IMemberBase | ITransactionBase;
