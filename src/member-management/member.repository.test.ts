import { describe, test, expect, beforeEach, beforeAll } from "vitest";
import { MemberRepository } from "./member.repository";
import { IMemberBase, IMember } from "../models/member.schema";
import { Database, JsonAdapter } from "../database/db";
import { faker } from "@faker-js/faker";

function createMemberObject() {
  return {
    name: faker.person.fullName(),
    age: faker.datatype.number({ min: 18, max: 80 }),
    phoneNumber: faker.phone.number("##########"),
    address: faker.address.streetAddress(),
  };
}

describe("MemberRepository", () => {
  const db = new Database("database-test-files/db.json", JsonAdapter);
  const repository: MemberRepository = new MemberRepository(db);

  beforeAll(async () => {
    await repository.reset();
    const membersData: IMemberBase[] = faker.helpers.multiple(
      createMemberObject,
      {
        count: 5,
      }
    );
    await Promise.all(membersData.map((data) => repository.create(data)));
  });

  beforeEach(() => {});

  test("Creating a new member", async () => {
    const memberData: IMemberBase = {
      name: "John Doe",
      age: 30,
      phoneNumber: "1234567890",
      address: "123 Main Canada",
    };
    const newMember = await repository.create(memberData);
    expect(newMember).toEqual({ id: 6, ...memberData });
    expect(db.table("members")).toContainEqual(newMember);
  });

  test("Updating a existing member's details", async () => {
    const memberData: IMemberBase = {
      name: "John Doe",
      age: 30,
      phoneNumber: "1234567890",
      address: "123 Main Canada",
    };
    await repository.create(memberData);

    const updatedData: IMemberBase = {
      name: "John Doe",
      age: 35,
      phoneNumber: "9876543210",
      address: "456 Delhi India",
    };
    const updatedMember = await repository.update(1, updatedData);
    expect(updatedMember).toEqual({ id: 1, ...updatedData });
    expect(db.table("members")).toContainEqual(updatedMember);
  });

  test("should return null when updating a non-existing member", async () => {
    const updatedData: IMemberBase = {
      name: "John Smith",
      age: 35,
      phoneNumber: "0987654321",
      address: "456 Elm St",
    };
    const updatedMember = await repository.update(999, updatedData);
    expect(updatedMember).toBeNull();
  });

  test("Deleting a member", async () => {
    const member = await repository.getById(1);
    const deletedMember = await repository.delete(1);
    expect(deletedMember).toEqual({ id: 1, ...member });
    expect(db.table("members")).not.toContainEqual(deletedMember);
  });

  test("List the books with pagination", async () => {
    const params = { offset: 0, limit: 2 };
    const response = await repository.list(params);

    expect(response.items).toEqual([
      { ...(await repository.getById(2)) },
      { ...(await repository.getById(3)) },
    ]);
    expect(response.pagination).toEqual({
      offset: 0,
      limit: 2,
      total: 6,
    });
  });

  test("search the books with pagination", async () => {
    const user = await repository.getById(2);
    const params = { offset: 0, limit: 2, search: user?.name };
    const response = await repository.list(params);

    expect(response.items).toEqual([{ ...(await repository.getById(2)) }]);
    expect(response.pagination).toEqual({
      offset: 0,
      limit: 2,
      total: 1,
    });
  });
});
