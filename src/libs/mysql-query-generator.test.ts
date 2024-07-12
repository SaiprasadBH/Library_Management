import { test, expect } from "vitest";
import { MySqlQueryGenerator } from "./mysql-query-generator";
import {
  WhereExpression,
  ColumnSet,
  SimpleWhereExpression,
  OrWhereExpression,
  AndWhereExpression,
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
    const simpleWhere: string =
      MySqlQueryGenerator.generateWhereClauseSql<IBook>(simpleWhereParam);

    expect(simpleWhere).toEqual('(`author` LIKE "%Sudha moorthy%")');
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
    expect(
      MySqlQueryGenerator.generateWhereClauseSql<IBook>(OrWhereExpressionParam)
    ).toEqual(
      '((`author` LIKE "%Sudha moorthy%") OR (`totalNumOfCopies` >= 10))'
    );
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
    expect(
      MySqlQueryGenerator.generateWhereClauseSql<IBook>(
        andWhereExpressionParams
      )
    ).toEqual(
      '((`author` LIKE "%Sudha moorthy%") AND (`totalNumOfCopies` >= 10))'
    );
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
    expect(
      MySqlQueryGenerator.generateWhereClauseSql(WhereExpressionParam)
    ).toEqual(
      '(((`author` LIKE "%Sudha moorthy%") OR (`totalNumOfCopies` >= 10)) AND (`publisher` LIKE "%Penguin UK%"))'
    );
  });

  test("select query test", () => {
    const whereParam: WhereExpression<IBook> = {
      author: {
        op: "CONTAINS",
        value: "Sudha moorthy",
      },
    };
    const selectAuthor = MySqlQueryGenerator.generateSelectSql<IBook>(
      "books_table",
      {
        fieldsToSelect: ["author", "title"],
        where: whereParam,
        limit: 100,
        offset: 0,
      }
    );
    expect(selectAuthor).toEqual(
      'SELECT `author`, `title` FROM `books_table` WHERE (`author` LIKE "%Sudha moorthy%") LIMIT 100 OFFSET 0'
    );
  });
});
