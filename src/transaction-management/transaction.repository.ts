import { BookRepository } from "../book-management/book.repository";
import { IRepository } from "../core/repository";
import { Database } from "../database/db";
import { LibraryDataset } from "../database/library.dataset";
import { MemberRepository } from "../member-management/member.repository";
import { ITransaction, ITransactionBase } from "../models/transaction.model";
import { ITransactionBaseSchema } from "../models/transaction.schema";

export class TransactionRepository
  implements IRepository<ITransactionBase, ITransaction>
{
  constructor(private readonly db: Database<LibraryDataset>) {}
  private bookRepo: BookRepository = new BookRepository(this.db);
  private memberRepo: MemberRepository = new MemberRepository(this.db);

  async create(data: ITransactionBase): Promise<ITransaction> {
    const transactions = this.db.table("transactions");
    const validatedData = ITransactionBaseSchema.parse(data);
    const book = await this.bookRepo.getById(validatedData.bookId);

    if (!book || book.availableNumOfCopies <= 0) {
      throw new Error("The book is not available or has no available copies.");
    }

    const newTransaction: ITransaction = {
      ...validatedData,
      id:
        transactions.length > 0
          ? transactions[transactions.length - 1].id + 1
          : 1,
      bookStatus: "issued",
      dateOfIssue: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 14)),
    };
    await this.bookRepo.update(book.id, book, book.availableNumOfCopies - 1);
    transactions.push(newTransaction);
    await this.db.save();
    return newTransaction;
  }

  async delete(id: number): Promise<ITransaction | null> {
    const transactions = this.db.table("transactions");
    const transaction = transactions.find((trxn) => trxn.id === id);
    if (transaction) {
      if (transaction.bookStatus === "returned") {
        throw new Error("This book has already been returned.");
      }

      const book = await this.bookRepo.getById(transaction.bookId);
      if (!book) {
        throw new Error("Book not found.");
      }

      // Mark the transaction as returned and update book availability
      transaction.bookStatus = "returned";
      await this.bookRepo.update(book.id, book, book.availableNumOfCopies + 1);
      await this.db.save();
      return transaction;
    } else {
      throw new Error(
        "Transaction not found. Please enter correct transaction ID."
      );
    }
  }

  // Not Required
  update(id: number, data: ITransactionBase): Promise<ITransaction | null> {
    throw new Error("Method not implemented.");
  }

  async getById(id: number): Promise<ITransaction | null> {
    const transactions = this.db.table("transactions");
    return transactions.find((trxn) => trxn.id === id) || null;
  }

  async list(searchText?: string): Promise<ITransaction[]> {
    const transactions = this.db.table("transactions");
    if (!searchText) {
      return transactions;
    }

    const search = searchText.toLowerCase();
    return transactions.filter(
      (transaction) =>
        transaction.bookId.toString().includes(search) ||
        transaction.memberId.toString().includes(search)
    );
  }

  async reset() {
    const transactions = this.db.table("transactions");
    transactions.length = 0;
    await this.db.save();
  }

  // Helper functions
  async getBookByISBN(isbnNo: string) {
    return this.bookRepo
      .list()
      .then((books) => books.find((book) => book.isbnNo === isbnNo) || null);
  }

  async getMemberByPhoneNumber(phoneNumber: string) {
    return this.memberRepo
      .list()
      .then(
        (members) =>
          members.find((member) => member.phoneNumber === phoneNumber) || null
      );
  }
}
