import { IPageRequest, IPagedResponse } from "../core/pagination";
import { IRepository } from "../core/repository";
import { IBook } from "../models/book.model";
import { bookSchema, IBookBase } from "../models/book.schema";

export class BookRepository implements IRepository<IBookBase, IBook> {
  books: IBook[] = [];
  create(data: IBookBase): IBook {
    // Validate data
    const validatedData = bookSchema.parse(data);

    const book: IBook = {
      ...validatedData,
      id: this.books.length + 1,
      availableNumOfCopies: validatedData.totalNumOfCopies,
    };
    this.books.push(book);
    return book;
  }

  update(id: number, data: IBookBase): IBook | null {
    const index = this.books.findIndex((b) => b.id === id);
    if (index !== -1) {
      // Validate data
      const validatedData = bookSchema.parse(data);

      const updatedBook: IBook = {
        ...this.books[index],
        ...validatedData,
        availableNumOfCopies:
          validatedData.totalNumOfCopies -
          (this.books[index].totalNumOfCopies -
            this.books[index].availableNumOfCopies),
      };
      this.books[index] = updatedBook;
      return updatedBook;
    }
    return null;
  }

  delete(id: number): IBook | null {
    const index = this.books.findIndex((b) => b.id === id);
    if (index !== -1) {
      const [deletedBook] = this.books.splice(index, 1);
      return deletedBook;
    }
    return null;
  }

  getById(id: number): IBook | null {
    const book = this.books.find((b) => b.id === id);
    return book || null;
  }

  list(params: IPageRequest): IPagedResponse<IBook> {
    const search = params.search?.toLowerCase();
    const filteredBooks = search
      ? this.books.filter(
          (b) =>
            b.title.toLowerCase().includes(search) ||
            b.isbNo.toLowerCase().includes(search)
        )
      : this.books;
    return {
      items: filteredBooks.slice(params.offset, params.limit + params.offset),
      pagination: {
        offset: params.offset,
        limit: params.limit,
        total: filteredBooks.length,
      },
    };
  }
  reset() {
    this.books.length = 0;
  }
}
