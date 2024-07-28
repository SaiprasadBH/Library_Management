import { BookRepository } from "../book-management/book.repository";
import { IRepository } from "../core/repository";
import { MemberRepository } from "../member-management/member.repository";
import { ITransaction, ITransactionBase } from "../models/transaction.model";
import { ITransactionBaseSchema } from "../models/transaction.schema";
import { IBook } from "../models/book.schema";
import { MySQLConnectionFactory } from "../database/oldDbHandlingUtilities/connectionFactory";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getMysqlQuery } from "../libs/oldDbHandlingLibs/mysql-query-handler";
import { WhereExpression } from "../database/oldDbHandlingUtilities/dbTypes";
import { IPagedResponse, IPageRequest } from "../core/pagination";

export class TransactionRepository
  implements Omit<IRepository<ITransactionBase, ITransaction>, "update">
{
  constructor(private readonly dbConnFactory: MySQLConnectionFactory) {}
  private bookRepo: BookRepository = new BookRepository(this.dbConnFactory);
  private memberRepo: MemberRepository = new MemberRepository(
    this.dbConnFactory
  );

  async create(data: ITransactionBase): Promise<ITransaction | undefined> {
    const validatedData = ITransactionBaseSchema.parse(data);
    let book = await this.bookRepo.getById(validatedData.bookId);
    if (!book || book.availableNumOfCopies <= 0) {
      throw new Error("The book is not available or has no available copies.");
    }

    const updatedBook: IBook = {
      ...book,
      availableNumOfCopies: book.availableNumOfCopies - 1,
    };

    const newTransaction: Omit<ITransaction, "id"> = {
      ...validatedData,
      bookStatus: "issued",
      dateOfIssue: new Date().toDateString(),
      dueDate: new Date(
        new Date().setDate(new Date().getDate() + 14)
      ).toDateString(),
    };
    // Generation of queries:
    const insertQuery = getMysqlQuery("insert", "Transactions", {
      row: newTransaction,
    })!;
    const updateWhereClause = this.getByIdWhereClause(book.id);
    const updateQuery = getMysqlQuery("update", "Books", {
      row: updatedBook,
      where: updateWhereClause as WhereExpression<IBook>,
    })!;

    // Execution of queries:
    const poolTransaction =
      await this.dbConnFactory.acquireTransactionPoolConnection();
    try {
      // const BookUpdated = await this.bookRepo.update(book.id, updatedBook);
      const BookUpdated = (await poolTransaction.query<RowDataPacket[]>(
        updateQuery.query,
        updateQuery.values
      )) as IBook[];
      if (BookUpdated) {
        const result = await poolTransaction.query<ResultSetHeader>(
          insertQuery.query,
          insertQuery.values
        );
        if (!result) throw new Error("Transaction not created");
        await poolTransaction.commit();
        const createdTransaction = await this.getById(result.insertId);
        return createdTransaction;
      }
    } catch (err) {
      if (err instanceof Error) {
        await poolTransaction.rollback();
        throw new Error(err.message);
      }
    } finally {
      await poolTransaction.release();
    }
  }

  async delete(id: number): Promise<ITransaction | undefined> {
    const transaction = await this.getById(id);
    if (transaction) {
      if (transaction.bookStatus === "returned") {
        throw new Error("This book has already been returned.");
      }

      let book = await this.bookRepo.getById(transaction.bookId);
      if (!book) {
        throw new Error("Book not found.");
      }
      const updatedBook: IBook = {
        ...book,
        availableNumOfCopies: book.availableNumOfCopies + 1,
      };

      transaction.bookStatus = "returned";

      // Generation of queries:
      const updateWhereClause = this.getByIdWhereClause(id);
      const updateQuery = getMysqlQuery("update", "Transactions", {
        row: { bookStatus: transaction.bookStatus },
        where: updateWhereClause,
      })!;
      const bookUpdateWhereClause = this.getByIdWhereClause(book.id);
      const bookUpdateQuery = getMysqlQuery("update", "Books", {
        row: updatedBook,
        where: bookUpdateWhereClause as WhereExpression<IBook>,
      })!;

      // Execution of queries:
      const poolTransaction =
        await this.dbConnFactory.acquireTransactionPoolConnection();
      try {
        await poolTransaction.query(
          bookUpdateQuery.query,
          bookUpdateQuery.values
        );
        await poolTransaction.query(updateQuery.query, updateQuery.values);
        await poolTransaction.commit();
        return transaction;
      } catch (err) {
        if (err instanceof Error) {
          await poolTransaction.rollback();
          throw new Error(err.message);
        }
      } finally {
        await poolTransaction.release();
      }
    } else {
      throw new Error(
        "Transaction not found. Please enter correct transaction ID."
      );
    }
  }

  async list(
    params: IPageRequest
  ): Promise<IPagedResponse<ITransaction> | undefined> {
    let filteredTransactions: ITransaction[];
    let searchWhereClause: WhereExpression<ITransaction> | undefined;
    if (params.search) {
      const search = params.search.toLowerCase();
      searchWhereClause = {
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
    // Generation of queries:
    const selectQuery = getMysqlQuery("select", "Transactions", {
      where: searchWhereClause,
      pagination: { offset: params.offset, limit: params.limit },
    })!;
    // Execution of queries:
    const poolConnection =
      await this.dbConnFactory.acquireTransactionPoolConnection();
    try {
      filteredTransactions = (await poolConnection.query(
        selectQuery.query,
        selectQuery.values
      )) as ITransaction[];
      if (filteredTransactions.length === 0)
        throw new Error("No Transaction found matching the criteria");
      const countQuery = getMysqlQuery("count", "Transactions", {
        where: searchWhereClause,
      })!;
      const totalMatchedTransactions = (await poolConnection.query(
        countQuery.query,
        countQuery.values
      )) as { count: number }[];
      return {
        items: filteredTransactions,
        pagination: {
          offset: params.offset,
          limit: params.limit,
          total: totalMatchedTransactions[0].count,
        },
      };
    } catch (err) {
      if (err instanceof Error) throw new Error(err.message);
    } finally {
      await poolConnection.release();
    }
  }

  // Helper functions

  private getByIdWhereClause(
    transactionId: number
  ): WhereExpression<ITransaction> {
    return {
      id: {
        op: "EQUALS",
        value: transactionId,
      },
    };
  }

  async getById(transactionId: number): Promise<ITransaction | undefined> {
    // Generation of queries:
    const selectWhereClause = this.getByIdWhereClause(transactionId);
    const selectQuery = getMysqlQuery("select", "Transactions", {
      where: selectWhereClause,
    })!;
    // Execution of queries:
    const poolConnection = await this.dbConnFactory.acquirePoolConnection();
    try {
      const selectedTransaction = (
        (await poolConnection.query(
          selectQuery.query,
          selectQuery.values
        )) as ITransaction[]
      )[0];
      if (!selectedTransaction)
        throw new Error(
          "Transaction not found. Please enter correct transaction ID."
        );
      return selectedTransaction;
    } catch (err) {
      if (err instanceof Error) throw new Error(err.message);
    } finally {
      await poolConnection.release();
    }
  }
}
