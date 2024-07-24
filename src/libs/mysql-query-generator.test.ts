import { test, expect } from "vitest";
import { MySqlQueryGenerator } from "./mysql-query-generator";
import {
  WhereExpression,
  ColumnSet,
  SimpleWhereExpression,
  OrWhereExpression,
  AndWhereExpression,
  NestedQuery,
} from "../database/dbTypes";
import { describe } from "node:test";
import { IBook } from "../models/book.schema";

describe("second set of tests", () => {
  test("simple where expression generation tests", () => {
    const simpleWhereParam: SimpleWhereExpression<IBook> = {
      author: {
        op: "CONTAINS",
        value: "Sudha moorthy",
      },
    };
    const [simpleWhere, data]: [string, unknown[]] =
      MySqlQueryGenerator.generateWhereClauseSql<IBook>(simpleWhereParam);

    expect(simpleWhere).toEqual("(`author` LIKE ?)");
    expect(data).toEqual(["%Sudha moorthy%"]);
  });

  test("OrWhereExpression test", () => {
    const OrWhereExpressionParam: OrWhereExpression<IBook> = {
      OR: [
        {
          author: {
            op: "CONTAINS",
            value: "Sudha moorthy",
          },
        },
        {
          totalNumOfCopies: {
            op: "GREATER_THAN_EQUALS",
            value: 10,
          },
        },
      ],
    };

    const [query, data] = MySqlQueryGenerator.generateWhereClauseSql<IBook>(
      OrWhereExpressionParam
    );
    expect(query).toEqual("((`author` LIKE ?) OR (`totalNumOfCopies` >= ?))");
    expect(data).toEqual(["%Sudha moorthy%", 10]);
  });

  test("AndWhereExpression test", () => {
    const andWhereExpressionParams: AndWhereExpression<IBook> = {
      AND: [
        {
          author: {
            op: "CONTAINS",
            value: "Sudha moorthy",
          },
        },
        {
          totalNumOfCopies: {
            op: "GREATER_THAN_EQUALS",
            value: 10,
          },
        },
      ],
    };

    const [query, data] = MySqlQueryGenerator.generateWhereClauseSql<IBook>(
      andWhereExpressionParams
    );
    expect(query).toEqual("((`author` LIKE ?) AND (`totalNumOfCopies` >= ?))");
    expect(data).toEqual(["%Sudha moorthy%", 10]);
  });

  test("Nested OR and And Where Clauses test", () => {
    const WhereExpressionParam: WhereExpression<IBook> = {
      AND: [
        {
          OR: [
            {
              author: {
                op: "CONTAINS",
                value: "Sudha moorthy",
              },
            },
            {
              totalNumOfCopies: {
                op: "GREATER_THAN_EQUALS",
                value: 10,
              },
            },
          ],
        },
        {
          publisher: {
            op: "CONTAINS",
            value: "Penguin UK",
          },
        },
      ],
    };
    const [query, data] =
      MySqlQueryGenerator.generateWhereClauseSql(WhereExpressionParam);
    expect(query).toEqual(
      "(((`author` LIKE ?) OR (`totalNumOfCopies` >= ?)) AND (`publisher` LIKE ?))"
    );
    expect(data).toEqual(["%Sudha moorthy%", 10, "%Penguin UK%"]);
  });

  test("generate correct SQL for nested queries", () => {
    const nestedQuery: NestedQuery<IBook> = {
      tableName: "books",
      fieldsToSelect: ["id"],
      where: {
        author: { op: "EQUALS", value: "John Doe" },
      },
    };

    const whereExpression: SimpleWhereExpression<IBook> = {
      id: {
        op: "IN",
        value: nestedQuery,
      },
    };

    const [sql, data] =
      MySqlQueryGenerator.generateWhereClauseSql(whereExpression);
    // console.log("\nNested where clause: \n", sql);

    expect(sql).toBe(
      "(`id` IN (SELECT `id` FROM `books` WHERE (`author` = ?)))"
    );
    expect(data).toEqual(["John Doe"]);
  });

  test("generate sql where clause for IN operator on array", () => {
    const whereExpression: SimpleWhereExpression<IBook> = {
      id: {
        op: "IN",
        value: [1, 2, 3],
      },
    };

    const [sql, data] =
      MySqlQueryGenerator.generateWhereClauseSql(whereExpression);
    // console.log("\nNested where clause: \n", sql);
    // console.log(data);
    expect(sql).toBe("(`id` IN (?, ?, ?))");
    expect(data).toEqual([1, 2, 3]);

    const [selectSQL, selectData] =
      MySqlQueryGenerator.generateSelectSql<IBook>("books_table", {
        fieldsToSelect: ["author", "title"],
        where: whereExpression,
        limit: 100,
        offset: 0,
      });
    // console.log(selectSQL);
    // console.log(selectData);
  });

  test("select query test", () => {
    const whereParam: WhereExpression<IBook> = {
      author: {
        op: "CONTAINS",
        value: "Sudha moorthy",
      },
    };
    const [selectAuthor, data] = MySqlQueryGenerator.generateSelectSql<IBook>(
      "books_table",
      {
        fieldsToSelect: ["author", "title"],
        where: whereParam,
        limit: 100,
        offset: 0,
      }
    );
    expect(selectAuthor).toEqual(
      "SELECT `author`, `title` FROM `books_table` WHERE (`author` LIKE ?) LIMIT 100 OFFSET 0"
    );
    expect(data).toEqual(["%Sudha moorthy%"]);
  });
});
