import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getMysqlQuery } from "./mysql-query-handler";
import { QueryTypes } from "../../database/oldDbHandlingUtilities/dbTypes";
import { QueryConfig } from "../../database/oldDbHandlingUtilities/query-config.type";
import { IBook } from "../../models/book.model";

describe("getMysqlQuery", () => {
  it("should generate a SELECT query when queryType is select", () => {
    const tableName = "Books";
    const queryType: QueryTypes = "select";
    const queryConfig: QueryConfig<IBook> = {
      where: {
        id: {
          op: "EQUALS",
          value: 1,
        },
      },
    };

    const result = getMysqlQuery(queryType, tableName, queryConfig);

    expect(result).toBeDefined();
    expect(result?.query).toContain("SELECT");
  });

  it("should return undefined for an invalid query type", () => {
    const tableName = "Books";
    const queryType = "invalid" as QueryTypes;

    expect(() => getMysqlQuery(queryType, tableName)).toThrowError(
      "Invalid QueryType"
    );
  });
});
