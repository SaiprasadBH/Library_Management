import { IPageRequest, IPagedResponse } from "../core/pagination";
import { IRepository } from "../core/repository";
import { IBook } from "../models/book.model";
import { bookSchema, IBookBase } from "../models/book.schema";
import { Database } from "../database/db";

export class BookRepository implements IRepository<IBookBase, IBook> {
  private tableName: string = "books";

  constructor(private readonly db: Database) {}

  async create(data: IBookBase): Promise<IBook> {
    // Validate data
    const validatedData = bookSchema.parse(data);

    const books = this.db.table<IBook>(this.tableName);
    const book: IBook = {
      ...validatedData,
      id: books.length + 1,
      availableNumOfCopies: validatedData.totalNumOfCopies,
    };
    books.push(book);
    await this.db.save();
    return book;
  }

  async update(id: number, data: IBookBase): Promise<IBook | null> {
    const books = this.db.table<IBook>(this.tableName);
    const index = books.findIndex((b) => b.id === id);
    if (index !== -1) {
      // Validate data
      const validatedData = bookSchema.parse(data);

      const updatedBook: IBook = {
        ...books[index],
        ...validatedData,
        availableNumOfCopies:
          validatedData.totalNumOfCopies -
          (books[index].totalNumOfCopies - books[index].availableNumOfCopies),
      };
      books[index] = updatedBook;
      await this.db.save();
      return updatedBook;
    }
    return null;
  }

  async delete(id: number): Promise<IBook | null> {
    const books = this.db.table<IBook>(this.tableName);
    const index = books.findIndex((b) => b.id === id);
    if (index !== -1) {
      const [deletedBook] = books.splice(index, 1);
      await this.db.save();
      return deletedBook;
    }
    return null;
  }

  async getById(id: number): Promise<IBook | null> {
    const books = this.db.table<IBook>(this.tableName);
    const book = books.find((b) => b.id === id);
    return book || null;
  }

  async list(params: IPageRequest): Promise<IPagedResponse<IBook>> {
    const books = this.db.table<IBook>(this.tableName);
    const search = params.search?.toLowerCase();
    const filteredBooks = search
      ? books.filter(
          (b) =>
            b.title.toLowerCase().includes(search) ||
            b.isbnNo.toLowerCase().includes(search)
        )
      : books;
    return {
      items: filteredBooks.slice(params.offset, params.limit + params.offset),
      pagination: {
        offset: params.offset,
        limit: params.limit,
        total: filteredBooks.length,
      },
    };
  }

  async reset() {
    const books = this.db.table<IBook>(this.tableName);
    books.length = 0;
    await this.db.save();
  }
}
