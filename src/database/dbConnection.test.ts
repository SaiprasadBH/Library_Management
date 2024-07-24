import { describe, expect, test } from "vitest";
import mysql from "mysql2/promise";
import {
  MySqlStandaloneConnection,
  MySqlPoolConnection,
  MySqlTransactionConnection,
  MySqlTransactionPoolConnection,
} from "./dbConnection";

describe.skip("Testing db connection abstraction classes", () => {
  test("MySqlStandaloneConnection", async () => {
    const connectionString = `mysql://user:user_password@localhost:3306/library_db`;

    const connection = new MySqlStandaloneConnection(connectionString);

    await connection.initialize();

    const [result] = (await connection.query(
      "SELECT COUNT(*) AS count FROM books WHERE totalNumOfCopies > ?",
      [5]
    )) as mysql.RowDataPacket[];
    expect(result).toEqual({ count: 146 });

    await connection.close();
  });

  test("MySqlPoolConnection", async () => {
    const pool = mysql.createPool("");

    const connection = new MySqlPoolConnection(pool);
    await connection.initialize();

    try {
      const [result] = (await connection.query(
        "SELECT 1 + 1 AS sum",
        []
      )) as mysql.RowDataPacket[];
      expect(result).toEqual(2);
    } finally {
      await connection.release();
    }
  });
});
