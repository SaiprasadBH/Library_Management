import { afterAll, beforeAll, describe, test } from "vitest";
import { MySQLAdapter } from "./dbAdapter";
import { AppEnvs } from "../core/read-env";
import { SimpleWhereExpression } from "./dbTypes";
import { IBook } from "../models/book.schema";
import { MySqlQueryGenerator } from "../libs/mysql-query-generator";
//import "dotenv/config";

describe("mysql db adpter tests", () => {
  let mySQLAdapter: MySQLAdapter;

  beforeAll(async () => {
    mySQLAdapter = new MySQLAdapter({
      dbURL: AppEnvs.DATABASE_URL,
    });
  });

  afterAll(() => {
    mySQLAdapter.shutdown();
  });

  test("run a select on books table", async () => {
    const simpleWhereParam: SimpleWhereExpression<IBook> = {
      author: {
        op: "CONTAINS",
        value: "Sudha Murthy",
      },
    };

    const [selectAuthor, data] = MySqlQueryGenerator.generateSelectSql<IBook>(
      "books",
      {
        fieldsToSelect: ["author", "title"],
        where: simpleWhereParam,
        offset: 0,
        limit: 10,
      }
    );
    const selectQueryResult = await mySQLAdapter.runQuery(selectAuthor, data);
    // console.table(selectQueryResult);
  });
});
