import { describe, test, expect, beforeEach } from "vitest";
import { MemberRepository } from "./member.repository";
import { IMemberBase, IMember } from "../models/member.schema";

describe("MemberRepository", () => {
  let repository: MemberRepository;

  beforeEach(() => {
    repository = new MemberRepository();
  });

  test("Creating a new member", () => {
    const memberData: IMemberBase = {
      name: "John Doe",
      age: 30,
      phoneNumber: "1234567890",
      address: "123 Main Canada",
    };
    const newMember = repository.create(memberData);
    expect(newMember).toEqual({ id: 1, ...memberData });
  });

  test("Updating a existing member's details", () => {
    const memberData: IMemberBase = {
      name: "John Doe",
      age: 30,
      phoneNumber: "1234567890",
      address: "123 Main Canada",
    };
    repository.create(memberData);

    const updatedData: IMemberBase = {
      name: "John Doe",
      age: 35,
      phoneNumber: "9876543210",
      address: "456 Delhi India",
    };
    const updatedMember = repository.update(1, updatedData);
    expect(updatedMember).toEqual({ id: 1, ...updatedData });
  });

  test("should return null when updating a non-existing member", () => {
    const updatedData: IMemberBase = {
      name: "John Smith",
      age: 35,
      phoneNumber: "0987654321",
      address: "456 Elm St",
    };
    const updatedMember = repository.update(999, updatedData);
    expect(updatedMember).toBeNull();
  });

  test("Deleting a member", () => {
    const memberData: IMemberBase = {
      name: "John Doe",
      age: 30,
      phoneNumber: "1234567890",
      address: "123 Main St",
    };
    repository.create(memberData);

    const deletedMember = repository.delete(1);
    expect(deletedMember).toEqual({ id: 1, ...memberData });
  });

  test("should get a member by id", () => {
    const memberData: IMemberBase = {
      name: "John Doe",
      age: 30,
      phoneNumber: "1234567890",
      address: "123 Main St",
    };
    repository.create(memberData);

    const member = repository.getById(1);
    expect(member).toEqual({ id: 1, ...memberData });
  });

  test("List the books with pagination", () => {
    const membersData: IMemberBase[] = [
      {
        name: "John Doe",
        age: 30,
        phoneNumber: "1234567890",
        address: "123 Main St",
      },
      {
        name: "Jane Doe",
        age: 25,
        phoneNumber: "0987654321",
        address: "456 Elm St",
      },
      {
        name: "Jim Doe",
        age: 35,
        phoneNumber: "1112223333",
        address: "789 Oak St",
      },
    ];

    membersData.forEach((data) => repository.create(data));

    const params = { offset: 0, limit: 2 };
    const response = repository.list(params);

    expect(response.items).toEqual([
      { id: 1, ...membersData[0] },
      { id: 2, ...membersData[1] },
    ]);
    expect(response.pagination).toEqual({
      offset: 0,
      limit: 2,
      total: 3,
    });
  });

  test("List the books with pagination", () => {
    const membersData: IMemberBase[] = [
      {
        name: "John Doe",
        age: 30,
        phoneNumber: "1234567890",
        address: "123 Main St",
      },
      {
        name: "Jane Doe",
        age: 25,
        phoneNumber: "0987654321",
        address: "456 Elm St",
      },
      {
        name: "Jim Doe",
        age: 35,
        phoneNumber: "1112223333",
        address: "789 Oak St",
      },
    ];

    membersData.forEach((data) => repository.create(data));

    const params = { offset: 0, limit: 2, search: "Jane" };
    const response = repository.list(params);

    expect(response.items).toEqual([{ id: 2, ...membersData[1] }]);
    expect(response.pagination).toEqual({
      offset: 0,
      limit: 2,
      total: 1,
    });
  });
});
