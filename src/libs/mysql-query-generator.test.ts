import { describe, test, expect } from "vitest";
import { MySqlQueryGenerator } from "./mysql-query-generator";
import {
  AndWhereExpression,
  OrWhereExpression,
  SimpleWhereExpression,
  WhereExpression,
} from "../database/dbTypes";
import { IMemberBase } from "../models/member.model";
import { QueryConfig } from "./query-config.type";
import { IBook } from "../models/book.schema";

describe("Test SQL generator for Books Database", () => {
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
      {
        fieldsToSelect: ["author", "title"],
        where: whereParam,
        offset: 0,
        limit: 10,
      }
    );
    expect(selectAuthor).toEqual(
      'SELECT `author`,`title` FROM `books_table` WHERE (`author`  LIKE  "%Sudha moorthy%")  LIMIT 100 OFFSET 0'
    );
  });
});

describe("Test SQL generator for Member Database", () => {
  test("should generate a INSERT SQL statement", () => {
    const tableName = "users";
    const row: IMemberBase = {
      name: "Tejas",
      age: 21,
      phoneNumber: "9123456789",
      address: "Mangalore, Karnataka",
    };
    const expectedSql = `INSERT INTO \`users\` (\`name\`, \`age\`, \`phoneNumber\`, \`address\`) VALUES ("Tejas", 21, "9123456789", "Mangalore, Karnataka")`;

    const sql = MySqlQueryGenerator.generateInsertSql<IMemberBase>(
      tableName,
      row
    );
    expect(sql.trim()).toBe(expectedSql);
  });

  test("should generate a UPDATE SQL statement", () => {
    const tableName = "users";
    const row: Partial<IMemberBase> = {
      name: "Tejas Prabhu",
      address: "Mangalore, DK, Karnataka",
    };
    const where: WhereExpression<IMemberBase> = {
      phoneNumber: { op: "EQUALS", value: "9123456789" },
    };
    const expectedSql = `UPDATE users SET \`name\` = "Tejas Prabhu", \`address\` = "Mangalore, DK, Karnataka" WHERE (\`phoneNumber\` = "9123456789")`;

    const sql = MySqlQueryGenerator.generateUpdateSql(tableName, row, where);
    expect(sql.trim()).toBe(expectedSql);
  });

  test("should generate a DELETE SQL statement", () => {
    const tableName = "users";
    const where: WhereExpression<IMemberBase> = {
      name: { op: "EQUALS", value: "Tejas" },
      phoneNumber: { op: "EQUALS", value: "9123456789" },
    };
    const expectedSql =
      'DELETE FROM users WHERE (`name` = "Tejas" AND `phoneNumber` = "9123456789")';

    const sql = MySqlQueryGenerator.generateDeleteSql(tableName, where);
    expect(sql.trim()).toBe(expectedSql);
  });

  test("should generate a SELECT SQL statement", () => {
    const tableName = "users";
    const fieldsToSelect: Array<keyof Partial<IMemberBase>> = ["name", "age"];
    const where: WhereExpression<IMemberBase> = {};
    const offset = 0;
    const limit = 5;
    const expectedSql = "SELECT `name`, `age` FROM `users` LIMIT 5";
    const selectConfig: QueryConfig<IMemberBase> = {
      fieldsToSelect,
      where,
      offset,
      limit,
    };

    const sql = MySqlQueryGenerator.generateSelectSql<IMemberBase>(
      tableName,
      selectConfig
    );
    expect(sql.trim()).toBe(expectedSql);
  });

  test("should generate a COUNT SQL statement", () => {
    const tableName = "users";
    const where: WhereExpression<IMemberBase> = {};
    const expectedSql = `SELECT COUNT(*) AS \`count\` FROM users`;

    const sql = MySqlQueryGenerator.generateCountSql<IMemberBase>(
      tableName,
      where
    );
    expect(sql.trim()).toBe(expectedSql);
  });
});
