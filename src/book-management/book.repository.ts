// import { IPageRequest, IPagedResponse } from "../core/pagination";
import { IRepository } from "../core/repository";
import { IBook } from "../models/book.model";
import { BookSchemaBase, IBookBase } from "../models/book.schema";
import { Database } from "../database/db";
import { LibraryDataset } from "../database/library.dataset";

export class BookRepository implements IRepository<IBookBase, IBook> {
  constructor(private readonly db: Database<LibraryDataset>) {}

  async create(data: IBookBase): Promise<IBook> {
    // Validate data
    const validatedData = BookSchemaBase.parse(data);

    const books = this.db.table("books");
    const book: IBook = {
      ...validatedData,
      id: books.length + 1,
      availableNumOfCopies: validatedData.totalNumOfCopies,
    };
    books.push(book);
    await this.db.save();
    return book;
  }

  async update(
    id: number,
    data: IBookBase,
    availableNumOfCopies?: number
  ): Promise<IBook> {
    const books = this.db.table("books");
    const index = books.findIndex((b) => b.id === id);

    // Validate data
    const validatedData = BookSchemaBase.parse(data);

    const updatedBook: IBook = {
      ...books[index],
      ...validatedData,
      availableNumOfCopies:
        availableNumOfCopies !== undefined
          ? availableNumOfCopies
          : validatedData.totalNumOfCopies -
            (books[index].totalNumOfCopies - books[index].availableNumOfCopies),
    };
    books[index] = updatedBook;
    await this.db.save();
    return updatedBook;
  }

  async delete(id: number): Promise<IBook | null> {
    const books = this.db.table("books");
    const index = books.findIndex((b) => b.id === id);
    if (index !== -1) {
      const [deletedBook] = books.splice(index, 1);
      await this.db.save();
      return deletedBook;
    }
    return null;
  }

  async getById(id: number): Promise<IBook | null> {
    const books = this.db.table("books");
    const book = books.find((b) => b.id === id);
    return book || null;
  }

  async list(searchText?: string): Promise<IBook[]> {
    const books = this.db.table("books");
    const search = searchText?.toLowerCase();
    const filteredBooks = search
      ? books.filter(
          (b) =>
            b.title.toLowerCase().includes(search) ||
            b.isbnNo.toLowerCase().includes(search)
        )
      : books;
    return filteredBooks;
  }

  async reset() {
    const books = this.db.table("books");
    books.length = 0;
    await this.db.save();
  }
}
