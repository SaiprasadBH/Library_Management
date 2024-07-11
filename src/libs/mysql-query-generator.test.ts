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

interface Book {
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  currentCopies: number;
  totalCopies: number;
}

const normalizeWhitespace = (str: string) => str.replace(/\s+/g, " ").trim();

describe("Non-database tests", () => {
  test("Test MySQL query generator - where clause", () => {
    const titleAndCopies: WhereExpression<Book> = {
      OR: [
        {
          title: {
            op: "EQUALS",
            value: "Wake up and live life",
          },
          currentCopies: {
            op: "GREATER_THAN_EQUALS",
            value: 1344,
          },
        },
      ],
    };

    const query = MySqlQueryGenerator.generateWhereClauseSql(titleAndCopies);
    console.log(query);
    expect(normalizeWhitespace(query)).toEqual(
      normalizeWhitespace(
        '((`title` = "Wake up and live life" AND `currentCopies` >= 1344))'
      )
    );
  });

  test("Test MySQL query generator - insert", () => {
    const row: ColumnSet = {
      title: "Wake up and live life",
      author: "John Doe",
      isbn: "123-456-789",
      publisher: "Penguin",
      currentCopies: 10,
      totalCopies: 20,
    };

    const query = MySqlQueryGenerator.generateInsertSql("books", row);
    console.log(query);
    expect(normalizeWhitespace(query)).toEqual(
      normalizeWhitespace(
        'INSERT INTO `books` (`title`, `author`, `isbn`, `publisher`, `currentCopies`, `totalCopies`) VALUES ("Wake up and live life", "John Doe", "123-456-789", "Penguin", 10, 20)'
      )
    );
  });

  test("Test MySQL query generator - update", () => {
    const row: ColumnSet = {
      currentCopies: 12,
      totalCopies: 22,
    };

    const where: WhereExpression<Book> = {
      OR: [
        {
          title: {
            op: "EQUALS",
            value: "Wake up and live life",
          },
        },
      ],
    };

    const query = MySqlQueryGenerator.generateUpdateSql("books", row, where);
    console.log(query);
    expect(normalizeWhitespace(query)).toEqual(
      normalizeWhitespace(
        'UPDATE `books` SET `currentCopies` = 12, `totalCopies` = 22 WHERE ((`title` = "Wake up and live life"))'
      )
    );
  });

  test("Test MySQL query generator - delete", () => {
    const where: WhereExpression<Book> = {
      OR: [
        {
          title: {
            op: "EQUALS",
            value: "Wake up and live life",
          },
          currentCopies: {
            op: "LESSER_THAN",
            value: 5,
          },
        },
      ],
    };

    const query = MySqlQueryGenerator.generateDeleteSql("books", where);
    console.log(query);
    expect(normalizeWhitespace(query)).toEqual(
      normalizeWhitespace(
        'DELETE FROM `books` WHERE ((`title` = "Wake up and live life" AND `currentCopies` < 5))'
      )
    );
  });

  test("Test MySQL query generator - select", () => {
    const where: WhereExpression<Book> = {
      OR: [
        {
          author: {
            op: "EQUALS",
            value: "Bertrand Russel",
          },
        },
      ],
    };

    const query = MySqlQueryGenerator.generateSelectSql<Book>(
      "books",
      [],
      where,
      0,
      10
    );
    console.log(query);
    expect(normalizeWhitespace(query)).toEqual(
      normalizeWhitespace(
        'SELECT * FROM `books` WHERE ((`author` = "Bertrand Russel")) LIMIT 10 OFFSET 0'
      )
    );
  });

  test("Test MySQL query generator - count", () => {
    const where: WhereExpression<Book> = {
      OR: [
        {
          publisher: {
            op: "CONTAINS",
            value: "Peng",
          },
        },
      ],
    };

    const query = MySqlQueryGenerator.generateCountSql("books", where);
    console.log(query);
    expect(normalizeWhitespace(query)).toEqual(
      normalizeWhitespace(
        'SELECT COUNT(*) FROM `books` WHERE ((`publisher` LIKE "%Peng%"))'
      )
    );
  });
});

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

    expect(simpleWhere).toEqual('(`author`  LIKE  "%Sudha moorthy%")');
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
      '((`author`  LIKE  "%Sudha moorthy%") OR (`totalNumOfCopies`  >=  10))'
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
      '((`author`  LIKE  "%Sudha moorthy%") AND (`totalNumOfCopies`  >=  10))'
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
      '(((`author`  LIKE  "%Sudha moorthy%") OR (`totalNumOfCopies`  >=  10)) AND (`publisher`  LIKE  "%Penguin UK%"))'
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
      ["author", "title"],
      whereParam,
      0,
      100
    );
    expect(selectAuthor).toEqual(
      'SELECT `author`,`title` FROM `books_table` WHERE (`author`  LIKE  "%Sudha moorthy%")  LIMIT 100 OFFSET 0'
    );
  });
});
