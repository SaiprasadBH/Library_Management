import { IRepository } from "../core/repository";
import { IBook } from "../models/book.model";
import { BookSchemaBase, IBookBase } from "../models/book.schema";
import { MySqlConnectionFactory } from "../database/dbConnection";
import { QueryResult } from "mysql2/promise";
import { WhereExpression } from "../database/dbTypes";
import { MySqlQueryGenerator } from "../libs/mysql-query-generator";
import mysql from "mysql2/promise";
import { IPagedResponse, IPageRequest } from "../core/pagination";

export class BookRepository implements IRepository<IBookBase, IBook> {
  constructor(private readonly dbConnectionFactory: MySqlConnectionFactory) {}

  async create(data: IBookBase): Promise<IBook> {
    const validatedData = BookSchemaBase.parse(data);

    const newBook: Omit<IBook, "id"> = {
      ...validatedData,
      availableNumOfCopies: validatedData.totalNumOfCopies,
    };

    const connection = await this.dbConnectionFactory.acquirePoolConnection();

    try {
      await connection.initialize();
      const [query, values] = MySqlQueryGenerator.generateInsertSql<IBook>(
        "books",
        newBook
      );

      const result = (await connection.query<QueryResult>(
        query,
        values
      )) as mysql.ResultSetHeader;

      const insertId = result.insertId;
      return await this.getById(insertId);
    } catch (e) {
      throw new Error((e as Error).message);
    } finally {
      await connection.release();
    }
  }

  async update(
    id: number,
    data: IBookBase,
    availableNumOfCopies?: number
  ): Promise<IBook> {
    const bookToUpdate = await this.getById(id);
    if (!bookToUpdate) {
      throw new Error("Book not found");
    }

    const validatedData = BookSchemaBase.parse(data);
    const updatedBook: IBook = {
      ...bookToUpdate,
      ...validatedData,
      availableNumOfCopies:
        availableNumOfCopies !== undefined
          ? availableNumOfCopies
          : validatedData.totalNumOfCopies -
            (bookToUpdate.totalNumOfCopies - bookToUpdate.availableNumOfCopies),
    };
    const whereCondition: WhereExpression<IBook> = {
      id: {
        op: "EQUALS",
        value: id,
      },
    };

    const connection = await this.dbConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();
      const [query, values] = MySqlQueryGenerator.generateUpdateSql(
        "books",
        updatedBook,
        whereCondition
      );

      const result = (await connection.query<QueryResult>(
        query,
        values
      )) as mysql.ResultSetHeader;

      if (result.affectedRows > 0) {
        return updatedBook;
      } else {
        throw new Error("Failed to update book");
      }
    } catch (e) {
      throw new Error("Could not update book.");
    } finally {
      await connection.release();
    }
  }

  async delete(id: number): Promise<IBook | null> {
    const bookToDelete = await this.getById(id);
    if (!bookToDelete) {
      throw new Error("Book not found");
    }

    const whereCondition: WhereExpression<IBook> = {
      id: {
        op: "EQUALS",
        value: id,
      },
    };

    const connection = await this.dbConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();
      const [query, values] = MySqlQueryGenerator.generateDeleteSql(
        "books",
        whereCondition
      );

      const result = (await connection.query<QueryResult>(
        query,
        values
      )) as mysql.ResultSetHeader;

      if (result.affectedRows > 0) {
        return bookToDelete;
      } else {
        throw new Error("Failed to delete book");
      }
    } catch (e) {
      throw new Error("Book deletion failed.");
    } finally {
      await connection.release();
    }
  }

  async getById(id: number): Promise<IBook> {
    const connection =
      await this.dbConnectionFactory.acquireStandaloneConnection();

    const whereCondition: WhereExpression<IBook> = {
      id: {
        op: "EQUALS",
        value: id,
      },
    };

    try {
      await connection.initialize();
      const [query, values] = MySqlQueryGenerator.generateSelectSql("books", {
        where: whereCondition,
        limit: 1,
      });

      const result = (await connection.query<QueryResult>(
        query,
        values
      )) as mysql.RowDataPacket;

      if (result.length > 0) {
        return result[0];
      } else {
        throw new Error("Book not found");
      }
    } catch (e) {
      throw new Error("Book not found.");
    } finally {
      await connection.close();
    }
  }

  async list(searchText?: string): Promise<IBook[]> {
    const connection = await this.dbConnectionFactory.acquirePoolConnection();
    let whereCondition: WhereExpression<IBook> | undefined;

    if (searchText) {
      const search = searchText.toLowerCase();
      whereCondition = {
        OR: [
          {
            title: {
              op: "CONTAINS",
              value: search,
            },
          },
          {
            isbnNo: {
              op: "EQUALS",
              value: search,
            },
          },
        ],
      };
    }

    try {
      await connection.initialize();
      const [query, values] = MySqlQueryGenerator.generateSelectSql("books", {
        where: whereCondition,
      });
      const result = (await connection.query<QueryResult>(
        query,
        values
      )) as mysql.RowDataPacket[];

      if (result.length > 0) {
        return result as IBook[];
      } else {
        throw new Error("No books found matching the criteria");
      }
    } catch (e) {
      throw new Error((e as Error).message);
    } finally {
      await connection.release();
    }
  }
}
