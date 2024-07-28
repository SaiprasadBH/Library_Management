import { describe, test, expect, beforeEach, beforeAll } from "vitest";
import { MemberRepository } from "./member.repository";
import { IMemberBase, IMember } from "../models/member.schema";
import { faker } from "@faker-js/faker";
import { LibraryDataset } from "../database/library.dataset";
import { AppEnvs } from "../core/read-env";
import mysql from "mysql2/promise";
import { MySQLConnectionFactory } from "../database/oldDbHandlingUtilities/connectionFactory";

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
  let connectionFactory: MySQLConnectionFactory;

  beforeAll(() => {
    connectionFactory = new MySQLConnectionFactory(AppEnvs.DATABASE_URL);
    repository = new MemberRepository(connectionFactory);
  });

  beforeAll(async () => {
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
      name: "Jane Smith",
      age: 40,
      phoneNumber: "9899999210",
      address: "456 Elm Street",
    };
    const newMember = (await repository.create(memberData))!;
    expect(newMember).toEqual({ id: newMember.id, ...memberData });
    await repository.delete(newMember.id);
  }, 5000);

  // Updating a member
  test("Updating an existing member's details", async () => {
    const memberData: IMemberBase = {
      name: "John Doe",
      age: 35,
      phoneNumber: "9898967890",
      address: "789 Maple Street",
    };
    const createdMember = (await repository.create(memberData))!;

    const updatedData: IMemberBase = {
      name: "John Doe",
      age: 40,
      phoneNumber: "9000113210",
      address: "456 Oak Street",
    };
    const updatedMember = await repository.update(
      createdMember.id,
      updatedData
    );
    expect(updatedMember).toEqual({ id: createdMember.id, ...updatedData });
  }, 5000);

  // Deleting a member
  test("Deleting a member", async () => {
    const memberData: IMemberBase = {
      name: "John Doe",
      age: 35,
      phoneNumber: "9898967890",
      address: "789 Maple Street",
    };
    const createdMember = (await repository.create(memberData))!;
    const member = await repository.getById(createdMember.id);
    const deletedMember = await repository.delete(createdMember.id);
    expect(deletedMember).toEqual(createdMember);
  }, 5000);

  // Retrieving a member by ID
  test("Retrieving a member by ID that exists", async () => {
    const member = await repository.getById(37);
    expect(member).toBeDefined();
    expect(member?.id).toBe(37);
  }, 5000);

  test("Retrieving a member by ID that does not exist", async () => {
    expect(async () => await repository.getById(999)).rejects.toThrowError();
  }, 5000);

  test("Listing all members", async () => {
    const members = await repository.list({ offset: 0, limit: 5 });
    expect(members?.items.length).toBe(5);
  }, 5000);

  // Searching member with search term
  test("Listing members with a search term", async () => {
    const memberData: IMemberBase = {
      name: "Unique Name",
      age: 40,
      phoneNumber: "1234509876",
      address: "789 Unique City",
    };
    const createdMember = await repository.create(memberData);

    const members = await repository.list({
      search: "Unique Name",
      offset: 0,
      limit: 5,
    });
    expect(members?.items[0].name).toBe("Unique Name");
  }, 5000);
});
