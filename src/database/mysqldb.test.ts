import { afterAll, beforeAll, describe, test } from "vitest";
import { MySQLAdapter, MySQLDatabase } from "./mysqldb";
import { AppEnvs } from "../core/read-env";
import { SimpleWhereExpression } from "./dbTypes";
import { IBook, IBookBase } from "../models/book.schema";
import { MySqlQueryGenerator } from "../libs/mysql-query-generator";
import "dotenv/config";
import { config } from "dotenv";
import { IMember } from "../models/member.model";

describe("MySQL database adapter tests", () => {
  let mySQLAdapter: MySQLAdapter;
  beforeAll(async () => {
    mySQLAdapter = new MySQLAdapter({
      dbURL: AppEnvs.DATABASE_URL,
    });
    await mySQLAdapter.load();
  });

  test("run a select on books table", async () => {
    const simpleWhereParam: SimpleWhereExpression<IBook> = {
      author: {
        op: "CONTAINS",
        value: "Sudha murthy",
      },
    };

    const selectAuthor = MySqlQueryGenerator.generateSelectSql<IBook>("books", {
      fieldsToSelect: ["title"],
      where: simpleWhereParam,
      offset: 0,
      limit: 10,
    });
    const selectQueryResult = await mySQLAdapter.runQuery(selectAuthor);
    console.log(selectQueryResult);
  });
  afterAll(() => {
    mySQLAdapter.shutdown();
  });
});

describe("MySQL database class tests", () => {
  let mySQLAdapter: MySQLAdapter = new MySQLAdapter({
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
    await mySQLAdapter.load();

    const bookResult = await db.select<IBook>(
      "books",
      ["title", "availableNumOfCopies"],
      authAndPublisher,
      0,
      15
    );
    console.table(bookResult);

    const memberResult = await db.select<IMember>(
      "members",
      ["name", "age", "phoneNumber"],
      {},
      0,
      15
    );
    console.table(memberResult);

    await mySQLAdapter.shutdown();
  });

  // test("Insert API of database layer", async () => {
  //   await mySQLAdapter.load();

  //   const test_book: IBookBase = {
  //     title: "Wake up and live life",
  //     author: "John Doe",
  //     isbnNo: "123-456-789",
  //     publisher: "Penguin",
  //     totalNumOfCopies: 20,
  //   };

  //   const bookResult = await db.insert<IBook>("books", test_book);
  //   console.table(bookResult);

  //   const memberResult = await db.insert<IMember>("members", {});
  //   console.table(memberResult);

  //   await mySQLAdapter.shutdown();
  // });
});
