import { IRepository } from "../core/repository";
import { IBook } from "../models/book.model";
import { BookSchema, BookSchemaBase, IBookBase } from "../models/book.schema";
import { IPageRequest, IPagedResponse } from "../core/pagination";
import {
  drizzleAdapter,
  books,
  IDrizzleAdapter,
} from "../../drizzle-mysql2-orm/drizzleMysqlAdapter";
import { eq, like, sql } from "drizzle-orm";

export class BookRepository implements IRepository<IBookBase, IBook> {
  constructor(private readonly dbConnFactory: IDrizzleAdapter) {}

  async create(newBookdata: IBookBase): Promise<IBook | undefined> {
    let validatedData: Partial<IBook> = BookSchemaBase.parse(newBookdata);
    validatedData = {
      id: 0,
      ...validatedData,
      availableNumOfCopies: validatedData.totalNumOfCopies,
    };

    const db = await this.dbConnFactory.getPoolConnection();
    const [insertedBook] = await db
      .insert(books)
      .values(validatedData as IBook);
    const resultedBook = await this.getById(insertedBook.insertId);

    return resultedBook;
  }

  async update(bookId: number, data: IBookBase): Promise<IBook | undefined> {
    let validatedData: Partial<IBook>;
    if (Object.keys(data).includes("id"))
      validatedData = BookSchema.parse(data);
    else validatedData = BookSchemaBase.parse(data);

    const oldData = (await this.getById(bookId))!;
    const newData = {
      ...oldData,
      ...validatedData,
    };
    const updatedData: IBook = {
      ...newData,
      availableNumOfCopies:
        newData.totalNumOfCopies -
        (oldData.totalNumOfCopies - newData.availableNumOfCopies),
    };

    const db = await this.dbConnFactory.getPoolConnection();
    await db.update(books).set(updatedData).where(eq(books.id, bookId));

    return updatedData;
  }

  async delete(bookId: number): Promise<IBook | undefined> {
    const deletedBook = await this.getById(bookId);

    const db = await this.dbConnFactory.getPoolConnection();
    await db.delete(books).where(eq(books.id, bookId));

    return deletedBook;
  }

  async getById(bookId: number): Promise<IBook | undefined> {
    const db = await this.dbConnFactory.getPoolConnection();
    const [selectedBook] = await db
      .select()
      .from(books)
      .where(eq(books.id, bookId));

    if (!selectedBook) throw new Error("Book not found");
    return selectedBook;
  }

  async list(params: IPageRequest): Promise<IPagedResponse<IBook> | undefined> {
    const db = await this.dbConnFactory.getPoolConnection();
    let searchWhereClause;

    if (params.search) {
      const search = `%${params.search.toLowerCase()}%`;
      searchWhereClause = sql`${books.title} LIKE ${search} OR ${books.isbnNo} LIKE ${search}`;
    }

    const items = await db
      .select()
      .from(books)
      .where(searchWhereClause)
      .offset(params.offset)
      .limit(params.limit);

    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(books)
      .where(searchWhereClause);

    return {
      items,
      pagination: {
        offset: params.offset,
        limit: params.limit,
        total,
      },
    };
  }
}
