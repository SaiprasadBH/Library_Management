import { IPageRequest, IPagedResponse } from "../core/pagination";
import { IRepository } from "../core/repository";
import {
  IMember,
  IMemberBase,
  MemberBaseSchema,
} from "../models/member.schema";
import { Database } from "../database/db";
import { LibraryDataset } from "../database/library.dataset";

export class MemberRepository implements IRepository<IMemberBase, IMember> {
  private tableName: string = "members";

  constructor(private readonly db: Database<LibraryDataset>) {}

  async create(data: IMemberBase): Promise<IMember> {
    const validatedData = MemberBaseSchema.parse(data);
    const members = this.db.table("members");

    const newMember: IMember = {
      ...validatedData,
      id: members.length + 1,
    };
    members.push(newMember);
    await this.db.save();
    return newMember;
  }

  async update(id: number, data: IMemberBase): Promise<IMember | null> {
    const members = this.db.table("members");
    const index = members.findIndex((member) => member.id === id);
    if (index !== -1) {
      const parsedData = MemberBaseSchema.parse(data);

      const updatedMember = {
        ...members[index],
        ...parsedData,
      };
      members[index] = updatedMember;
      await this.db.save();
      return updatedMember;
    }
    return null;
  }

  async delete(id: number): Promise<IMember | null> {
    const members = this.db.table("members");
    const index = members.findIndex((member) => member.id === id);
    if (index !== -1) {
      const [deletedMember] = members.splice(index, 1);
      await this.db.save();
      return deletedMember;
    }
    return null;
  }

  async getById(id: number): Promise<IMember | null> {
    const members = this.db.table("members");
    const memberFound = members.find((member) => member.id === id);
    return memberFound || null;
  }

  async list(params: IPageRequest): Promise<IPagedResponse<IMember>> {
    const members = this.db.table("members");
    const search = params.search?.toLowerCase();
    const filteredMembers = search
      ? members.filter(
          (b) =>
            b.name.toLowerCase().includes(search) ||
            b.phoneNumber.includes(search)
        )
      : members;
    return {
      items: filteredMembers.slice(params.offset, params.limit + params.offset),
      pagination: {
        offset: params.offset,
        limit: params.limit,
        total: filteredMembers.length,
      },
    };
  }
  async reset() {
    const members = this.db.table("members");
    members.length = 0;
    await this.db.save();
  }
}
