import { Database, JsonAdapter } from "../database/db";
import { LibraryDataset } from "../database/library.dataset";
import { TransactionRepository } from "../transaction-management/transaction.repository";
import { ITransactionBase, ITransaction } from "../models/transaction.model";
import { MemberRepository } from "../member-management/member.repository";
import { BookRepository } from "../book-management/book.repository";
import { beforeAll, describe, expect, test } from "vitest";
import { beforeEach } from "node:test";
import { faker } from "@faker-js/faker";

describe("Testing transactions", () => {
  let db: Database<LibraryDataset>;
  let transactionRepo: TransactionRepository;
  let memberRepo: MemberRepository;
  let bookRepo: BookRepository;

  // Set up the database and repositories before all tests
  beforeAll(() => {
    db = new Database<LibraryDataset>(
      "database-test-files/db.json",
      JsonAdapter<LibraryDataset>()
    );
    transactionRepo = new TransactionRepository(db);
    memberRepo = new MemberRepository(db);
    bookRepo = new BookRepository(db);
  });

  // Clear the database before each test to ensure isolation
  beforeEach(async () => {
    transactionRepo.reset();
    await db.save();
  });

  const testMemberObject = () => {
    return {
      name: faker.person.fullName(),
      age: faker.number.int({ min: 18, max: 80 }),
      phoneNumber: faker.string.alphanumeric(10),
      address: faker.location.city(),
    };
  };

  const testBookObject = () => {
    return {
      title: faker.lorem.words(),
      author: faker.person.fullName(),
      publisher: faker.company.name(),
      genre: faker.lorem.words().split(" "),
      isbnNo: faker.string.alphanumeric(13),
      numOfPages: faker.number.int({ min: 100, max: 1000 }),
      totalNumOfCopies: faker.number.int({ min: 1, max: 50 }),
    };
  };

  test("Creating a transaction: issuing book", async () => {
    const testMember = await memberRepo.create(testMemberObject());
    const testBook = await bookRepo.create(testBookObject());

    const newIssue: ITransactionBase = {
      memberId: testMember.id,
      bookId: testBook.id,
    };
    const transaction: ITransaction = await transactionRepo.create(newIssue);
    expect(transaction.memberId).toBe(testMember.id);
    expect(transaction.bookId).toBe(testBook.id);
    expect(transaction.id).toBeGreaterThan(0);
  });

  test("Deleting a transaction", async () => {
    const testMember = await memberRepo.create(testMemberObject());
    const testBook = await bookRepo.create(testBookObject());

    const newIssue: ITransactionBase = {
      memberId: testMember.id,
      bookId: testBook.id,
    };
    const transaction: ITransaction = await transactionRepo.create(newIssue);

    const deletedTransaction = await transactionRepo.delete(transaction.id);
    expect(deletedTransaction?.id).toBe(transaction.id);
  });
});
