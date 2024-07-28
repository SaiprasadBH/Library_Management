import { test, expect, describe } from "vitest";
import { MySqlQueryGenerator } from "./mysql-query-generator";
import {
  WhereExpression,
  RowData,
  SimpleWhereExpression,
  OrWhereExpression,
  AndWhereExpression,
  PreparedStatement,
  NestedQuery,
} from "../../database/oldDbHandlingUtilities/dbTypes";
import { IBook } from "../../models/book.schema";
import { IMemberBase } from "../../models/member.schema";
import { QueryConfig } from "../../database/oldDbHandlingUtilities/query-config.type";

describe("second set of tests", () => {
  test("simple where expression generation tests", () => {
    const simpleWhereParam: SimpleWhereExpression<IBook> = {
      author: {
        op: "CONTAINS",
        value: "Sudha moorthy",
      },
    };
    const { query, values } =
      MySqlQueryGenerator.generateWhereClauseSql<IBook>(simpleWhereParam);

    expect(query).toEqual("(`author` LIKE ?)");
    expect(values).toEqual(["%Sudha moorthy%"]);
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

    const { query, values } = MySqlQueryGenerator.generateWhereClauseSql<IBook>(
      OrWhereExpressionParam
    );
    expect(query).toEqual("((`author` LIKE ?) OR (`totalNumOfCopies` >= ?))");
    expect(values).toEqual(["%Sudha moorthy%", 10]);
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

    const { query, values } = MySqlQueryGenerator.generateWhereClauseSql<IBook>(
      andWhereExpressionParams
    );
    expect(query).toEqual("((`author` LIKE ?) AND (`totalNumOfCopies` >= ?))");
    expect(values).toEqual(["%Sudha moorthy%", 10]);
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
    const { query, values } =
      MySqlQueryGenerator.generateWhereClauseSql(WhereExpressionParam);
    expect(query).toEqual(
      "(((`author` LIKE ?) OR (`totalNumOfCopies` >= ?)) AND (`publisher` LIKE ?))"
    );
    expect(values).toEqual(["%Sudha moorthy%", 10, "%Penguin UK%"]);
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

    const { query, values } =
      MySqlQueryGenerator.generateWhereClauseSql(whereExpression);
    // console.log("\nNested where clause: \n", sql);

    expect(query).toBe(
      "(`id` IN (SELECT `id` FROM `books` WHERE (`author` = ?)))"
    );
    expect(values).toEqual(["John Doe"]);
  });

  test("generate sql where clause for IN operator on array", () => {
    const whereExpression: SimpleWhereExpression<IBook> = {
      id: {
        op: "IN",
        value: [1, 2, 3],
      },
    };

    const { query, values } =
      MySqlQueryGenerator.generateWhereClauseSql(whereExpression);
    // console.log("\nNested where clause: \n", sql);
    // console.log(data);
    expect(query).toBe("(`id` IN (?, ?, ?))");
    expect(values).toEqual([1, 2, 3]);

    // const {query:selectSQL, values:selectData} = MySqlQueryGenerator.generateSelectSql(
    //   "books",
    //   {
    //     fieldsToSelect: ["author", "title"],
    //     where: whereExpression,
    //     limit: 100,
    //     offset: 0,
    //   }
    // );
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
    const { query, values } = MySqlQueryGenerator.generateSelectSql("Books", {
      fieldsToSelect: ["author", "title"],
      where: whereParam,
      pagination: { limit: 100, offset: 0 },
    });
    expect(query).toEqual(
      "SELECT `author`, `title` FROM `Books` WHERE (`author` LIKE ?) LIMIT ?"
    );
    expect(values).toEqual(["%Sudha moorthy%", 100]);
  });
});
