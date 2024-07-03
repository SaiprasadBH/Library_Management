import { IPageRequest, IPagedResponse } from "../core/pagination";
import { IRepository } from "../core/repository";
import {
  IMember,
  IMemberBase,
  MemberBaseSchema,
} from "../models/member.schema";

export class MemberRepository implements IRepository<IMemberBase, IMember> {
  members: IMember[] = [];
  create(data: IMemberBase): IMember {
    const parsedData = MemberBaseSchema.parse(data);

    const newMember: IMember = {
      ...parsedData,
      id: this.members.length + 1,
    };
    this.members.push(newMember);
    return newMember;
  }

  update(id: number, data: IMemberBase): IMember | null {
    const index = this.members.findIndex((member) => member.id === id);
    if (index !== -1) {
      const parsedData = MemberBaseSchema.parse(data);

      const updatedMember = {
        ...this.members[index],
        ...parsedData,
      };
      this.members[index] = updatedMember;
      return updatedMember;
    }
    return null;
  }

  delete(id: number): IMember | null {
    const index = this.members.findIndex((member) => member.id === id);
    if (index !== -1) {
      const [deletedMember] = this.members.splice(index, 1);
      return deletedMember;
    }
    return null;
  }

  getById(id: number): IMember | null {
    const memberFound = this.members.find((member) => member.id === id);
    return memberFound || null;
  }

  list(params: IPageRequest): IPagedResponse<IMember> {
    const search = params.search?.toLowerCase();
    const filteredMembers = search
      ? this.members.filter(
          (b) =>
            b.name.toLowerCase().includes(search) ||
            b.phoneNumber.includes(search)
        )
      : this.members;
    return {
      items: filteredMembers.slice(params.offset, params.limit + params.offset),
      pagination: {
        offset: params.offset,
        limit: params.limit,
        total: filteredMembers.length,
      },
    };
  }
}
