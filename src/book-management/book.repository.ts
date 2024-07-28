import { IRepository } from "../core/repository";
import { IBook } from "../models/book.model";
import { BookSchema, BookSchemaBase, IBookBase } from "../models/book.schema";
import { WhereExpression } from "../database/oldDbHandlingUtilities/dbTypes";
import { IPageRequest, IPagedResponse } from "../core/pagination";
import { MySQLConnectionFactory } from "../database/oldDbHandlingUtilities/connectionFactory";
import { getMysqlQuery } from "../libs/oldDbHandlingLibs/mysql-query-handler";
import { ResultSetHeader } from "mysql2";

export type SearchObject = {
  matchedItem: IBook;
  whereClause: WhereExpression<IBook>;
};

export class BookRepository implements IRepository<IBookBase, IBook> {
  constructor(private readonly dbConnFactory: MySQLConnectionFactory) {}

  private getByIdWhereClause(bookId: number): WhereExpression<IBook> {
    return {
      id: {
        op: "EQUALS",
        value: bookId,
      },
    };
  }

  async create(newBookdata: IBookBase): Promise<IBook | undefined> {
    let validatedData = BookSchemaBase.parse(newBookdata);
    validatedData = {
      ...validatedData,
      availableNumOfCopies: validatedData.totalNumOfCopies,
    } as IBook;
    // Generation of queries:
    const insertQuery = getMysqlQuery("insert", "Books", {
      row: validatedData,
    })!;
    const selectQuery = getMysqlQuery("select", "Books", {
      where: { isbnNo: { op: "EQUALS", value: validatedData.isbnNo } },
    })!;
    // Execution of queries:
    const poolConnection = await this.dbConnFactory.acquirePoolConnection();
    try {
      const result = await poolConnection.query<ResultSetHeader>(
        insertQuery.query,
        insertQuery.values
      );
      if (!result.insertId) throw new Error("Book not added");
      const createdBook = (
        (await poolConnection.query(
          selectQuery.query,
          selectQuery.values
        )) as IBook[]
      )[0];
      return createdBook;
    } catch (err) {
      if (err instanceof Error) throw new Error(err.message);
    } finally {
      await poolConnection.release();
    }
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
    // Generation of queries:
    const updateWhereClause = this.getByIdWhereClause(bookId);
    const updateQuery = getMysqlQuery("update", "Books", {
      row: updatedData,
      where: updateWhereClause,
    })!;
    // Execution of queries:
    const poolConnection = await this.dbConnFactory.acquirePoolConnection();
    try {
      await poolConnection.query(updateQuery.query, updateQuery.values);
      return updatedData;
    } catch (err) {
      if (err instanceof Error) throw new Error(err.message);
    } finally {
      await poolConnection.release();
    }
  }

  async delete(bookId: number): Promise<IBook | undefined> {
    const deletedBook = await this.getById(bookId);
    // Generation of queries:
    const deleteWhereClause: WhereExpression<IBook> =
      this.getByIdWhereClause(bookId);
    const deleteQuery = getMysqlQuery("delete", "Books", {
      where: deleteWhereClause,
    })!;

    // Execution of queries:
    const poolConnection = await this.dbConnFactory.acquirePoolConnection();
    try {
      await poolConnection.query(deleteQuery.query, deleteQuery.values);
      return deletedBook;
    } catch (err) {
      if (err instanceof Error) throw new Error(err.message);
    } finally {
      await poolConnection.release();
    }
  }

  async getById(bookId: number): Promise<IBook | undefined> {
    // Generation of queries:
    const selectWhereClause = this.getByIdWhereClause(bookId);
    const selectQuery = getMysqlQuery("select", "Books", {
      where: selectWhereClause,
    })!;
    // Execution of queries:
    const poolConnection = await this.dbConnFactory.acquirePoolConnection();
    try {
      const selectedBook = (
        (await poolConnection.query(
          selectQuery.query,
          selectQuery.values
        )) as IBook[]
      )[0];
      if (!selectedBook) throw new Error("Book not found");
      return selectedBook;
    } catch (err) {
      if (err instanceof Error) throw new Error(err.message);
    } finally {
      await poolConnection.release();
    }
  }

  async list(params: IPageRequest): Promise<IPagedResponse<IBook> | undefined> {
    let filteredBooks: IBook[];
    let searchWhereClause: WhereExpression<IBook> | undefined;
    if (params.search) {
      const search = params.search.toLowerCase();
      searchWhereClause = {
        OR: [
          {
            title: {
              op: "CONTAINS",
              value: search,
            },
          },
          {
            isbnNo: {
              op: "CONTAINS",
              value: search,
            },
          },
        ],
      };
    }
    // Generation of queries:
    const selectQuery = getMysqlQuery("select", "Books", {
      where: searchWhereClause,
      pagination: { offset: params.offset, limit: params.limit },
    })!;
    // Execution of queries:
    const poolConnection = await this.dbConnFactory.acquirePoolConnection();
    try {
      filteredBooks = (await poolConnection.query(
        selectQuery.query,
        selectQuery.values
      )) as IBook[];
      if (filteredBooks.length === 0)
        throw new Error("No books found matching the criteria");
      const countQuery = getMysqlQuery("count", "Books", {
        where: searchWhereClause,
      })!;
      const totalMatchedBooks = (await poolConnection.query(
        countQuery.query,
        countQuery.values
      )) as { count: number }[];
      return {
        items: filteredBooks,
        pagination: {
          offset: params.offset,
          limit: params.limit,
          total: totalMatchedBooks[0].count,
        },
      };
    } catch (err) {
      if (err instanceof Error) throw new Error(err.message);
    } finally {
      await poolConnection.release();
    }
  }
}
