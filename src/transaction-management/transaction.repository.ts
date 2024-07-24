import { BookRepository } from "../book-management/book.repository";
import { IRepository } from "../core/repository";
import { MySqlConnectionFactory } from "../database/dbConnection";
import { MemberRepository } from "../member-management/member.repository";
import { ITransaction, ITransactionBase } from "../models/transaction.model";
import { ITransactionBaseSchema } from "../models/transaction.schema";
import { MySqlQueryGenerator } from "../libs/mysql-query-generator";
import { QueryResult } from "mysql2";
import mysql from "mysql2/promise";
import { WhereExpression } from "../database/dbTypes";
import { IBook } from "../models/book.schema";

export class TransactionRepository
  implements IRepository<ITransactionBase, ITransaction>
{
  private bookRepo: BookRepository;
  private memberRepo: MemberRepository;

  constructor(private readonly dbConnectionFactory: MySqlConnectionFactory) {
    this.bookRepo = new BookRepository(this.dbConnectionFactory);
    this.memberRepo = new MemberRepository(this.dbConnectionFactory);
  }

  async create(data: ITransactionBase): Promise<ITransaction> {
    const validatedData = ITransactionBaseSchema.parse(data);
    const connection =
      await this.dbConnectionFactory.acquireTransactionPoolConnection();

    try {
      const book = await this.bookRepo.getById(validatedData.bookId);

      if (!book || book.availableNumOfCopies <= 0) {
        throw new Error(
          "The book is not available or has no available copies."
        );
      }

      const newTransaction: Omit<ITransaction, "id"> = {
        ...validatedData,
        bookStatus: "issued",
        dateOfIssue: new Date().toDateString(),
        dueDate: new Date(
          new Date().setDate(new Date().getDate() + 14)
        ).toDateString(),
      };

      await connection.initialize();

      const [query, values] =
        MySqlQueryGenerator.generateInsertSql<ITransaction>(
          "transactions",
          newTransaction
        );

      const result = (await connection.query<QueryResult>(
        query,
        values
      )) as mysql.ResultSetHeader;

      if (result.insertId) {
        const updatedBook = await this.bookRepo.update(
          book.id,
          book,
          book.availableNumOfCopies - 1
        );

        if (!updatedBook) {
          throw new Error("Book update failed after issuing book.");
        }
      }
      await connection.commit();
      const newTrxn = await this.getById(result.insertId);
      return newTrxn;
    } catch (e) {
      await connection.rollback();
      throw new Error((e as Error).message);
    } finally {
      connection.release();
    }
  }

  async returnBook(id: number): Promise<ITransaction> {
    const connection =
      await this.dbConnectionFactory.acquireTransactionPoolConnection();

    try {
      const transaction = await this.getById(id);

      if (!transaction) {
        throw new Error(
          "Transaction not found. Please enter correct transaction ID."
        );
      }

      if (transaction.bookStatus === "returned") {
        throw new Error("This book has already been returned.");
      }

      const book = await this.bookRepo.getById(transaction.bookId);

      if (!book) {
        throw new Error("Book not found.");
      }

      const updatedTransaction: ITransaction = {
        ...transaction,
        bookStatus: "returned",
      };

      const whereCondition: WhereExpression<ITransaction> = {
        id: {
          op: "EQUALS",
          value: id,
        },
      };

      const [query, values] =
        MySqlQueryGenerator.generateUpdateSql<ITransaction>(
          "transactions",
          updatedTransaction,
          whereCondition
        );

      const result = (await connection.query(
        query,
        values
      )) as mysql.RowDataPacket;

      if (result.affectedRows > 0) {
        const updatedBook = await this.bookRepo.update(
          book.id,
          book,
          book.availableNumOfCopies + 1
        );

        if (!updatedBook) {
          throw new Error("Book update failed after returning book.");
        }
      }
      await connection.commit();
      return updatedTransaction;
    } catch (e) {
      await connection.rollback();
      throw new Error((e as Error).message);
    } finally {
      await connection.release();
    }
  }

  async getById(id: number): Promise<ITransaction> {
    const connection =
      await this.dbConnectionFactory.acquireStandaloneConnection();

    const whereCondition: WhereExpression<ITransaction> = {
      id: {
        op: "EQUALS",
        value: id,
      },
    };
    try {
      await connection.initialize();
      const [query, values] = MySqlQueryGenerator.generateSelectSql(
        "transactions",
        {
          where: whereCondition,
          limit: 1,
        }
      );

      const result = (await connection.query<QueryResult>(
        query,
        values
      )) as mysql.RowDataPacket;

      if (result.length > 0) {
        return result[0];
      } else {
        throw new Error(
          "Transaction not found. Please enter correct transaction ID."
        );
      }
    } catch (e) {
      throw new Error(
        "Transaction not found. Please enter correct transaction ID."
      );
    } finally {
      await connection.close();
    }
  }

  async list(searchText?: string): Promise<ITransaction[]> {
    const connection = await this.dbConnectionFactory.acquirePoolConnection();
    let whereCondition: WhereExpression<ITransaction> | undefined;

    if (searchText) {
      const search = Number(searchText);
      whereCondition = {
        OR: [
          {
            bookId: {
              op: "EQUALS",
              value: search,
            },
          },
          {
            memberId: {
              op: "EQUALS",
              value: search,
            },
          },
        ],
      };
    }

    try {
      await connection.initialize();
      const [query, values] = MySqlQueryGenerator.generateSelectSql(
        "transactions",
        {
          where: whereCondition,
          limit: 5,
          offset: 0,
        }
      );
      const result = (await connection.query<QueryResult>(
        query,
        values
      )) as mysql.RowDataPacket[];
      if (result.length > 0) {
        return result as ITransaction[];
      } else {
        throw new Error("Not a members found matching the criteria");
      }
    } catch (e) {
      throw new Error(" No members found matching the criteria");
    } finally {
      await connection.release();
    }
  }

  //////////////////////////////////////////
  // Not Required
  update(id: number, data: ITransactionBase): Promise<ITransaction | null> {
    throw new Error("Method not implemented.");
  }

  delete(id: number): Promise<ITransaction | null> {
    throw new Error("Method not implemented.");
  }
}
