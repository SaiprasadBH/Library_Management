import { BookRepository } from "../book-management/book.repository";
import { IPageRequest, IPagedResponse } from "../core/pagination";
import { IRepository } from "../core/repository";
import { Database } from "../database/db";
import { LibraryDataset } from "../database/library.dataset";
import { MemberRepository } from "../member-management/member.repository";
import { ITransaction, ITransactionBase } from "../models/transaction.model";

export class TransactionRepository
  implements IRepository<ITransactionBase, ITransaction>
{
  constructor(private readonly db: Database<LibraryDataset>) {}
  private bookRepo: BookRepository = new BookRepository(this.db);
  private memberRepo: MemberRepository = new MemberRepository(this.db);

  async create(data: ITransactionBase): Promise<ITransaction> {
    const transactions = this.db.table("transactions");
    const book = await this.bookRepo.getById(data.bookId);

    if (!book || book.availableNumOfCopies <= 0) {
      throw new Error("The book is not available or has no available copies.");
    }

    const newTransaction = {
      ...data,
      id:
        transactions.length > 0
          ? transactions[transactions.length - 1].id + 1
          : 1,
      dateOfIssue: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 14)),
    };
    const newBook = await this.bookRepo.update(
      book.id,
      book,
      book.availableNumOfCopies - 1
    );
    transactions.push(newTransaction);
    await this.db.save();
    return newTransaction;
  }

  async delete(id: number): Promise<ITransaction | null> {
    const transactions = this.db.table("transactions");
    const index = transactions.findIndex((trxn) => trxn.id === id);
    if (index !== -1) {
      const book = await this.bookRepo.getById(transactions[index].bookId);
      if (!book || book.availableNumOfCopies >= book.totalNumOfCopies) {
        throw new Error(
          "This book was not issued. Please enter correct book ID."
        );
      }
      const newBook = await this.bookRepo.update(
        book.id,
        book,
        book.availableNumOfCopies + 1
      );
      const [deletedTransaction] = transactions.splice(index, 1);
      await this.db.save();
      return deletedTransaction;
    } else {
      throw new Error(
        "The book borrow record not found.\n Please enter correct member ID and book ID."
      );
    }
  }

  // Not Required
  update(id: number, data: ITransactionBase): Promise<ITransaction | null> {
    throw new Error("Method not implemented.");
  }
  // Not Required
  getById(id: number): Promise<ITransaction | null> {
    throw new Error("Method not implemented.");
  }
  // Not Required
  list(params: IPageRequest): Promise<IPagedResponse<ITransaction>> {
    throw new Error("Method not implemented.");
  }

  async reset() {
    const members = this.db.table("transactions");
    members.length = 0;
    await this.db.save();
  }
}
