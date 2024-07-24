import { afterAll, beforeAll, describe, test } from "vitest";
import { MySQLDatabase } from "./libraryDb";
import { AppEnvs } from "../core/read-env";
import { SimpleWhereExpression } from "./dbTypes";
import { IBook, IBookBase } from "../models/book.schema";
import { MySqlQueryGenerator } from "../libs/mysql-query-generator";
import "dotenv/config";
import { config } from "dotenv";
import { IMember } from "../models/member.model";
import { MySQLAdapter } from "./dbAdapter";

describe("MySQL database adapter tests", () => {
  let mySQLAdapter: MySQLAdapter;
  beforeAll(async () => {
    mySQLAdapter = new MySQLAdapter({
      dbURL: AppEnvs.DATABASE_URL,
    });
  });

  test("run a select on books table", async () => {
    const simpleWhereParam: SimpleWhereExpression<IBook> = {
      author: {
        op: "CONTAINS",
        value: "Sudha murthy",
      },
    };

    const [selectAuthor, data] = MySqlQueryGenerator.generateSelectSql<IBook>(
      "books",
      {
        fieldsToSelect: ["title"],
        where: simpleWhereParam,
        offset: 0,
        limit: 10,
      }
    );
    const selectQueryResult = await mySQLAdapter.runQuery(selectAuthor, data);
    // console.log(selectQueryResult);
  });
  afterAll(() => {
    mySQLAdapter.shutdown();
  });
});

describe("MySQL database class tests", () => {
  let mySQLAdapter: MySQLAdapter;
  mySQLAdapter = new MySQLAdapter({
    dbURL: AppEnvs.DATABASE_URL,
  });
  const db: MySQLDatabase = new MySQLDatabase(mySQLAdapter);

  const authAndPublisher: SimpleWhereExpression<IBook> = {
    author: {
      op: "CONTAINS",
      value: "Sudha Murthy",
    },
    publisher: {
      op: "EQUALS",
      value: "Penguin UK",
    },
  };
  test("Select API of database layer", async () => {
    const bookResult = await db.select<IBook>("books", {
      fieldsToSelect: ["title", "availableNumOfCopies"],
      where: authAndPublisher,
      offset: 0,
      limit: 15,
    });
    // console.table(bookResult);
  });

  test("Insert API of database layer", async () => {
    const test_book: Omit<IBook, "id"> = {
      title: "Wake up and live life",
      author: "John Doe",
      genre: "Sci-fi",
      isbnNo: "123456789abcd",
      publisher: "Penguin",
      numOfPages: 200,
      totalNumOfCopies: 20,
      availableNumOfCopies: 20,
    };
    const bookTitleAndAuthor: SimpleWhereExpression<IBook> = {
      title: {
        value: "Wake up and live life",
        op: "EQUALS",
      },
      author: {
        value: "John Doe",
        op: "EQUALS",
      },
    };

    const bookResult = await db.insert<IBook>("books", test_book);
    // console.table(bookResult);

    const selectedBook = await db.select<IBook>("books", {
      limit: 10,
      offset: 0,
    });
    // console.log(selectedBook);

    const updatedBook = await db.update<IBook>(
      "books",
      test_book,
      bookTitleAndAuthor
    );
    // console.table(updatedBook);

    const bookDeleteResult = await db.delete<IBook>(
      "books",
      bookTitleAndAuthor
    );
    // console.table(bookDeleteResult);
  });
});
