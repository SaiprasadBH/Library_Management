import { describe, test, expect, beforeAll, beforeEach } from "vitest";
import { TransactionRepository } from "../transaction-management/transaction.repository";
import { ITransactionBase } from "../models/transaction.model";
import { MemberRepository } from "../member-management/member.repository";
import { BookRepository } from "../book-management/book.repository";
import { faker } from "@faker-js/faker";
import { MySqlConnectionFactory } from "../database/dbConnection";
import { IBookBase } from "../models/book.model";
import { IMemberBase } from "../models/member.model";

function createMemberObject(): IMemberBase {
  return {
    name: faker.person.fullName(),
    age: faker.number.int({ min: 18, max: 80 }),
    phoneNumber: faker.string.numeric(10),
    address: faker.location.city(),
  };
}

function createBookObject(): IBookBase {
  return {
    title: faker.lorem.words(),
    author: faker.person.fullName(),
    publisher: faker.company.name(),
    genre: faker.lorem.word().split(" ")[0],
    isbnNo: faker.string.alphanumeric(13),
    numOfPages: faker.number.int({ min: 100, max: 1000 }),
    totalNumOfCopies: faker.number.int({ min: 1, max: 50 }),
  };
}

describe("TransactionRepository", () => {
  let transactionRepo: TransactionRepository;
  let memberRepo: MemberRepository;
  let bookRepo: BookRepository;

  beforeAll(() => {
    const mysqlConnectionFactory = new MySqlConnectionFactory({
      dbURL: "mysql://user:user_password@localhost:3306/library_db",
    });
    transactionRepo = new TransactionRepository(mysqlConnectionFactory);
    memberRepo = new MemberRepository(mysqlConnectionFactory);
    bookRepo = new BookRepository(mysqlConnectionFactory);
  });

  test("Creating a transaction: issuing book", async () => {
    const testMember = await memberRepo.create(createMemberObject());
    const testBook = await bookRepo.create(createBookObject());

    const newIssue: ITransactionBase = {
      memberId: testMember.id,
      bookId: testBook.id,
    };
    const transaction = await transactionRepo.create(newIssue);

    expect(transaction.memberId).toBe(testMember.id);
    expect(transaction.bookId).toBe(testBook.id);
    expect(transaction.id).toBeGreaterThan(0);

    const updatedBook = await bookRepo.getById(testBook.id);
    expect(updatedBook?.availableNumOfCopies).toBe(
      testBook.totalNumOfCopies - 1
    );
  });

  test("Returning a book", async () => {
    const testMember = await memberRepo.create(createMemberObject());
    const testBook = await bookRepo.create(createBookObject());

    const newIssue: ITransactionBase = {
      memberId: testMember.id,
      bookId: testBook.id,
    };
    const transaction = await transactionRepo.create(newIssue);

    const returnedTransaction = await transactionRepo.returnBook(
      transaction.id
    );
    expect(returnedTransaction.id).toBe(transaction.id);
    expect(returnedTransaction.bookStatus).toBe("returned");

    const updatedBook = await bookRepo.getById(testBook.id);
    expect(updatedBook?.availableNumOfCopies).toBe(testBook.totalNumOfCopies);
  });

  test("Attempting to return a non-existent transaction", async () => {
    await expect(transactionRepo.returnBook(999)).rejects.toThrow(
      "Transaction not found. Please enter correct transaction ID."
    );
  });

  test("Attempting to return an already returned transaction", async () => {
    const testMember = await memberRepo.create(createMemberObject());
    const testBook = await bookRepo.create(createBookObject());

    const newIssue: ITransactionBase = {
      memberId: testMember.id,
      bookId: testBook.id,
    };
    const transaction = await transactionRepo.create(newIssue);
    await transactionRepo.returnBook(transaction.id);

    await expect(transactionRepo.returnBook(transaction.id)).rejects.toThrow(
      "This book has already been returned."
    );
  });

  test("Listing transactions", async () => {
    const transactions = await transactionRepo.list();
    expect(transactions.length).toBeGreaterThanOrEqual(0);
  });

  test("Listing transactions with search term", async () => {
    const testMember = await memberRepo.create(createMemberObject());
    const testBook = await bookRepo.create(createBookObject());

    const newIssue: ITransactionBase = {
      memberId: testMember.id,
      bookId: testBook.id,
    };
    const transaction = await transactionRepo.create(newIssue);

    const transactions = await transactionRepo.list(testMember.id.toString());
    expect(transactions.length).toBeGreaterThan(0);
    expect(transactions[0].memberId).toBe(testMember.id);
  });
});
