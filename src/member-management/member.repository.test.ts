import { describe, test, expect, beforeEach, beforeAll } from "vitest";
import { MemberRepository } from "./member.repository";
import { IMemberBase, IMember } from "../models/member.schema";
import { Database, JsonAdapter } from "../database/db";
import { faker } from "@faker-js/faker";
import { LibraryDataset } from "../database/library.dataset";
import { AppEnvs } from "../core/read-env";
import { MySqlConnectionFactory } from "../database/dbConnection";
import mysql from "mysql2/promise";

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
  let connectionFactory: MySqlConnectionFactory;

  beforeAll(() => {
    connectionFactory = new MySqlConnectionFactory({
      dbURL: "mysql://user:user_password@localhost:3306/library_db",
    });
    repository = new MemberRepository(connectionFactory);
  });

  // Creating a new member
  test("Creating a new member", async () => {
    const memberData: IMemberBase = {
      name: "Jane Smith",
      age: 40,
      phoneNumber: "9899999210",
      address: "456 Elm Street",
    };
    const newMember = await repository.create(memberData);
    const selectedMember = await repository.getById(newMember.id);
    expect(newMember).toEqual({
      ...selectedMember,
    });
    const deletedMember = await repository.delete(newMember.id);
  });

  // Updating a member
  test("Updating an existing member's details", async () => {
    const memberData: IMemberBase = {
      name: "John Doe",
      age: 35,
      phoneNumber: "9898967890",
      address: "789 Maple Street",
    };
    const createdMember = await repository.create(memberData);

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
    expect(updatedMember).toEqual({
      id: createdMember?.id,
      ...updatedData,
    });

    const deletedMember = await repository.delete(updatedMember.id);
  });

  // Deleting a member
  test("Deleting a member", async () => {
    const memberData: IMemberBase = createMemberObject();
    const createdMember = await repository.create(memberData);
    const deletedMember = await repository.delete(createdMember.id);

    expect(deletedMember).toEqual(createdMember);

    await expect(repository.getById(createdMember.id)).rejects.toThrow(
      "Member not found"
    );
  });

  // Retrieving a member by ID
  test("Retrieving a member by ID that exists", async () => {
    const memberData: IMemberBase = createMemberObject();
    const createdMember = await repository.create(memberData);

    const retrievedMember = await repository.getById(createdMember.id);
    expect(retrievedMember).toEqual(createdMember);

    const deletedMember = await repository.delete(retrievedMember.id);
  });

  test("Retrieving a member by ID that does not exist", async () => {
    await expect(repository.getById(9999)).rejects.toThrow("Member not found");
  });

  // List the members with default limit
  test.skip("Listing all members", async () => {
    const members = await repository.list();
    expect(members.length).toBe(2);
  });

  // Searching member with search term that doesn't match
  test("Listing members with a non-matching search", async () => {
    await expect(repository.list("Non-Existent Name")).rejects.toThrow(
      "No members found matching the criteria"
    );
  });

  // Searching member with search term
  test("Listing members with a search term", async () => {
    // const memberData: IMemberBase = {
    //   name: "Unique Name",
    //   age: 40,
    //   phoneNumber: "1234509876",
    //   address: "789 Unique City",
    // };
    // const createdMember = await repository.create(memberData);

    const members = await repository.list("Unique Name");
    expect(members.length).toBeGreaterThan(0);
    expect(members[0].name).toBe("Unique Name");

    // const deletedMember = await repository.delete(createdMember.id);
  });
});
