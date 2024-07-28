import { IRepository } from "../core/repository";
import {
  IMember,
  IMemberBase,
  MemberBaseSchema,
} from "../models/member.schema";
import { MySQLConnectionFactory } from "../database/oldDbHandlingUtilities/connectionFactory";
import { ResultSetHeader } from "mysql2/promise";
import { getMysqlQuery } from "../libs/oldDbHandlingLibs/mysql-query-handler";
import { WhereExpression } from "../database/oldDbHandlingUtilities/dbTypes";
import { IPagedResponse, IPageRequest } from "../core/pagination";

export class MemberRepository implements IRepository<IMemberBase, IMember> {
  constructor(private readonly dbConnFactory: MySQLConnectionFactory) {}

  private getByIdWhereClause(bookId: number): WhereExpression<IMember> {
    return {
      id: {
        op: "EQUALS",
        value: bookId,
      },
    };
  }

  async create(data: IMemberBase): Promise<IMember | undefined> {
    const validatedData = MemberBaseSchema.parse(data);
    // Generation of queries:
    const insertQuery = getMysqlQuery("insert", "Members", {
      row: validatedData,
    })!;
    const selectQuery = getMysqlQuery("select", "Members", {
      where: {
        phoneNumber: { op: "EQUALS", value: validatedData.phoneNumber },
      },
    })!;
    // Execution of queries:
    const poolConnection = await this.dbConnFactory.acquirePoolConnection();
    try {
      const result = await poolConnection.query<ResultSetHeader>(
        insertQuery.query,
        insertQuery.values
      );
      if (!result.insertId) throw new Error("Member not added");
      const newMember = (
        (await poolConnection.query(
          selectQuery.query,
          selectQuery.values
        )) as IMember[]
      )[0];

      return newMember;
    } catch (err) {
      if (err instanceof Error) throw new Error(err.message);
    } finally {
      await poolConnection.release();
    }
  }

  async update(
    MemberId: number,
    data: IMemberBase
  ): Promise<IMember | undefined> {
    const validatedData = MemberBaseSchema.parse(data);
    // Generation of queries:
    const updateWhereClause = this.getByIdWhereClause(MemberId);
    const updateQuery = getMysqlQuery("update", "Members", {
      row: validatedData,
      where: updateWhereClause,
    })!;
    // Execution of queries:

    const poolConnection = await this.dbConnFactory.acquirePoolConnection();
    try {
      const oldMember = (await this.getById(MemberId))!;
      const updatedMember = { ...oldMember, ...validatedData };
      await poolConnection.query(updateQuery.query, updateQuery.values);
      return updatedMember;
    } catch (err) {
      if (err instanceof Error) throw new Error(err.message);
    } finally {
      await poolConnection.release();
    }
  }

  async delete(memberId: number): Promise<IMember | undefined> {
    const deletedMember = await this.getById(memberId);
    // Generation of queries:
    const deleteWhereClause: WhereExpression<IMember> =
      this.getByIdWhereClause(memberId);
    const deleteQuery = getMysqlQuery("delete", "Members", {
      where: deleteWhereClause,
    })!;

    // Execution of queries:
    const poolConnection = await this.dbConnFactory.acquirePoolConnection();
    try {
      await poolConnection.query(deleteQuery.query, deleteQuery.values);
      return deletedMember;
    } catch (err) {
      if (err instanceof Error) throw new Error(err.message);
    } finally {
      await poolConnection.release();
    }
  }

  async getById(memberId: number): Promise<IMember | undefined> {
    // Generation of queries:
    const selectWhereClause = this.getByIdWhereClause(memberId);
    const selectQuery = getMysqlQuery("select", "Members", {
      where: selectWhereClause,
    })!;
    // Execution of queries:
    const poolConnection = await this.dbConnFactory.acquirePoolConnection();
    try {
      const selectedMember = (
        (await poolConnection.query(
          selectQuery.query,
          selectQuery.values
        )) as IMember[]
      )[0];
      if (!selectedMember) throw new Error("Member not found");
      return selectedMember;
    } catch (err) {
      if (err instanceof Error) throw new Error(err.message);
    } finally {
      await poolConnection.release();
    }
  }
  async list(
    params: IPageRequest
  ): Promise<IPagedResponse<IMember> | undefined> {
    let filteredIMembers: IMember[];
    let searchWhereClause: WhereExpression<IMember> | undefined;
    if (params.search) {
      const search = params.search.toLowerCase();
      searchWhereClause = {
        OR: [
          {
            name: {
              op: "CONTAINS",
              value: search,
            },
          },
          {
            phoneNumber: {
              op: "CONTAINS",
              value: search,
            },
          },
        ],
      };
    }
    // Generation of queries:
    const selectQuery = getMysqlQuery("select", "Members", {
      where: searchWhereClause,
      pagination: { offset: params.offset, limit: params.limit },
    })!;
    // Execution of queries:
    const poolConnection = await this.dbConnFactory.acquirePoolConnection();
    try {
      filteredIMembers = (await poolConnection.query(
        selectQuery.query,
        selectQuery.values
      )) as IMember[];
      if (filteredIMembers.length === 0)
        throw new Error("No members found matching the criteria");
      const countQuery = getMysqlQuery("count", "Members", {
        where: searchWhereClause,
      })!;
      const totalMatchedMembers = (await poolConnection.query(
        countQuery.query,
        countQuery.values
      )) as { count: number }[];
      return {
        items: filteredIMembers,
        pagination: {
          offset: params.offset,
          limit: params.limit,
          total: totalMatchedMembers[0].count,
        },
      };
    } catch (err) {
      if (err instanceof Error) throw new Error(err.message);
    } finally {
      await poolConnection.release();
    }
  }

  // async reset() {
  //   const members = this.db.table("members");
  //   members.length = 0;
  //   await this.db.save();
  // }
}
