import { describe, test, expect, beforeEach, beforeAll } from "vitest";
import { MemberRepository } from "./member.repository";
import { IMemberBase, IMember } from "../models/member.schema";
import { Database, JsonAdapter } from "../database/db";
import { faker } from "@faker-js/faker";
import { LibraryDataset } from "../database/library.dataset";

function createMemberObject() {
  return {
    name: faker.person.fullName(),
    age: faker.number.int({ min: 18, max: 80 }),
    phoneNumber: faker.string.numeric(10),
    address: faker.location.city(),
  };
}

describe("MemberRepository", () => {
  let repository: MemberRepository;
  let db: Database<LibraryDataset>;

  beforeAll(() => {
    db = new Database<LibraryDataset>(
      "database-test-files/db.json",
      JsonAdapter<LibraryDataset>()
    );
    repository = new MemberRepository(db);
  });

  beforeEach(async () => {
    await repository.reset();
    const membersData: IMemberBase[] = faker.helpers.multiple(
      createMemberObject,
      {
        count: 5,
      }
    );
    await Promise.all(membersData.map((data) => repository.create(data)));
  });

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

  test("Updating an existing member's details", async () => {
    const memberData: IMemberBase = {
      name: "John Doe",
      age: 30,
      phoneNumber: "1234567890",
      address: "123 Main Canada",
    };
    const createdMember = await repository.create(memberData);

    const updatedData: IMemberBase = {
      name: "John Doe",
      age: 35,
      phoneNumber: "9876543210",
      address: "456 Delhi India",
    };
    const updatedMember = await repository.update(
      createdMember.id,
      updatedData
    );
    expect(updatedMember).toEqual({ id: createdMember.id, ...updatedData });
    expect(db.table("members")).toContainEqual(updatedMember);
  });

  test("Deleting a member", async () => {
    const member = await repository.getById(1);
    const deletedMember = await repository.delete(1);
    expect(deletedMember).toEqual(member);
    expect(db.table("members")).not.toContainEqual(deletedMember);
  });

  test("Retrieving a member by ID that exists", async () => {
    const member = await repository.getById(2);
    expect(member).toBeDefined();
    expect(member?.id).toBe(2);
  });

  test("Retrieving a member by ID that does not exist", async () => {
    const member = await repository.getById(999);
    expect(member).toBeNull();
  });

  test("Listing all members", async () => {
    const members = await repository.list();
    expect(members.length).toBe(5);
  });

  test("Listing members with a search term", async () => {
    const memberData: IMemberBase = {
      name: "Unique Name",
      age: 40,
      phoneNumber: "1234509876",
      address: "789 Unique City",
    };
    await repository.create(memberData);

    const members = await repository.list("Unique Name");
    expect(members.length).toBe(1);
    expect(members[0].name).toBe("Unique Name");
  });
});
