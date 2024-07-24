import { IRepository } from "../core/repository";
import { IMember } from "../models/member.model";
import { MemberBaseSchema, IMemberBase } from "../models/member.schema";
import { MySqlConnectionFactory } from "../database/dbConnection";
import { QueryResult } from "mysql2/promise";
import { WhereExpression } from "../database/dbTypes";
import { MySqlQueryGenerator } from "../libs/mysql-query-generator";
import mysql from "mysql2/promise";

export class MemberRepository implements IRepository<IMemberBase, IMember> {
  constructor(private readonly dbConnectionFactory: MySqlConnectionFactory) {}

  async create(data: IMemberBase): Promise<IMember> {
    const validatedData = MemberBaseSchema.parse(data);

    const newMember: Omit<IMember, "id"> = {
      ...validatedData,
    };

    const connection = await this.dbConnectionFactory.acquirePoolConnection();

    try {
      await connection.initialize();
      const [query, values] = MySqlQueryGenerator.generateInsertSql<IMember>(
        "members",
        newMember
      );
      const result = (await connection.query<QueryResult>(
        query,
        values
      )) as mysql.ResultSetHeader;

      const insertId = result.insertId;
      return await this.getById(insertId);
    } catch (e) {
      throw new Error("Member creation failed.");
    } finally {
      await connection.release();
    }
  }

  async update(id: number, data: IMemberBase): Promise<IMember> {
    const memberToUpdate = await this.getById(id);
    if (!memberToUpdate) {
      throw new Error("Member not found");
    }

    const validatedData = MemberBaseSchema.parse(data);
    const updatedMember: IMember = {
      ...memberToUpdate,
      ...validatedData,
    };

    const whereCondition: WhereExpression<IMember> = {
      id: {
        op: "EQUALS",
        value: id,
      },
    };

    const connection = await this.dbConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();
      const [query, values] = MySqlQueryGenerator.generateUpdateSql(
        "members",
        updatedMember,
        whereCondition
      );

      const result = (await connection.query<QueryResult>(
        query,
        values
      )) as mysql.ResultSetHeader;

      if (result.affectedRows > 0) {
        return updatedMember;
      } else {
        throw new Error("Failed to update member");
      }
    } catch (e) {
      throw new Error("Member creation failed.");
    } finally {
      await connection.release();
    }
  }

  async delete(id: number): Promise<IMember | null> {
    const memberToDelete = await this.getById(id);
    if (!memberToDelete) {
      throw new Error("Member not found");
    }

    const whereCondition: WhereExpression<IMember> = {
      id: {
        op: "EQUALS",
        value: id,
      },
    };

    const connection = await this.dbConnectionFactory.acquirePoolConnection();
    try {
      await connection.initialize();
      const [query, values] = MySqlQueryGenerator.generateDeleteSql(
        "members",
        whereCondition
      );

      const result = (await connection.query<QueryResult>(
        query,
        values
      )) as mysql.ResultSetHeader;

      if (result.affectedRows > 0) {
        return memberToDelete;
      } else {
        throw new Error("Failed to delete member");
      }
    } catch (e) {
      throw new Error("Member creation failed.");
    } finally {
      await connection.release();
    }
  }

  async getById(id: number): Promise<IMember> {
    const connection =
      await this.dbConnectionFactory.acquireStandaloneConnection();

    const whereCondition: WhereExpression<IMember> = {
      id: {
        op: "EQUALS",
        value: id,
      },
    };

    try {
      await connection.initialize();
      const [query, values] = MySqlQueryGenerator.generateSelectSql("members", {
        where: whereCondition,
        limit: 1,
      });

      const result = (await connection.query<QueryResult>(
        query,
        values
      )) as mysql.RowDataPacket;

      if (result.length > 0) {
        return result[0];
      } else {
        throw new Error("Member not found");
      }
    } catch (e) {
      throw new Error("Member not found");
    } finally {
      await connection.close();
    }
  }

  async list(searchText?: string): Promise<IMember[]> {
    const connection = await this.dbConnectionFactory.acquirePoolConnection();
    let whereCondition: WhereExpression<IMember> | undefined;

    if (searchText) {
      const search = searchText.toLowerCase();
      whereCondition = {
        OR: [
          {
            name: {
              op: "CONTAINS",
              value: search,
            },
          },
          {
            phoneNumber: {
              op: "EQUALS",
              value: search,
            },
          },
        ],
      };
    }

    try {
      await connection.initialize();
      const [query, values] = MySqlQueryGenerator.generateSelectSql("members", {
        where: whereCondition,
        limit: 5,
        offset: 0,
      });
      const result = (await connection.query<QueryResult>(
        query,
        values
      )) as mysql.RowDataPacket[];
      if (result.length > 0) {
        return result as IMember[];
      } else {
        throw new Error("Not a members found matching the criteria");
      }
    } catch (e) {
      throw new Error(" No members found matching the criteria");
    } finally {
      await connection.release();
    }
  }
}
