import {
  describe,
  test,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";
import { BookRepository } from "./book.repository";
import { IBookBase, IBook } from "../models/book.model";
import { Database, JsonAdapter } from "../database/db";
import { faker } from "@faker-js/faker";
import { LibraryDataset } from "../database/library.dataset";
import { MySQLDatabase } from "../database/libraryDb";
import { MySQLAdapter } from "../database/dbAdapter";
import { AppEnvs } from "../core/read-env";
import { MySqlConnectionFactory } from "../database/dbConnection";

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

describe("BookRepository", () => {
  let repository: BookRepository;

  beforeAll(() => {
    const mysqlConnectionFactory = new MySqlConnectionFactory({
      dbURL: "mysql://user:user_password@localhost:3306/library_db",
    });
    repository = new BookRepository(mysqlConnectionFactory);
  });

  // Get a book by id.
  test("Get book by id", async () => {
    const seltectedBook = await repository.getById(1);
    expect(seltectedBook).toEqual({
      id: 1,
      title: "The Rust Programming Language (Covers Rust 2018)",
      author: "Steve Klabnik, Carol Nichols",
      publisher: "No Starch Press",
      genre: "Computers",
      isbnNo: "9781718500457",
      numOfPages: 561,
      totalNumOfCopies: 2,
      availableNumOfCopies: 2,
    });
  });

  // Creating a new book
  test("Creating a new book", async () => {
    const bookData: IBookBase = {
      title: "New Book",
      author: "Jane Smith",
      publisher: "Fiction House",
      genre: "Adventure",
      isbnNo: "1234567890123",
      numOfPages: 350,
      totalNumOfCopies: 10,
    };
    const newBook = await repository.create(bookData);
    const seltectedBook = await repository.getById(newBook.id);
    expect(newBook).toEqual({
      ...seltectedBook,
    });
    const deletedBook = await repository.delete(newBook.id);
  });

  // Updating a book
  test("Updating an existing book's details", async () => {
    const bookData: IBookBase = {
      title: "Old Book",
      author: "John Doe",
      publisher: "Book Publishers",
      genre: "Drama",
      isbnNo: "9876543210231",
      numOfPages: 200,
      totalNumOfCopies: 5,
    };
    const createdBook = await repository.create(bookData);

    const updatedData: IBookBase = {
      title: "Updated Book",
      author: "John Doe",
      publisher: "Updated Publishers",
      genre: "Thriller",
      isbnNo: "9876543210321",
      numOfPages: 300,
      totalNumOfCopies: 8,
    };
    const updatedBook = await repository.update(createdBook.id, updatedData);
    expect(updatedBook).toEqual({
      id: createdBook?.id,
      availableNumOfCopies: 8,
      ...updatedData,
    });

    const deletedBook = await repository.delete(updatedBook.id);
  });

  // Deleting a book.
  test("Deleting a book", async () => {
    const bookData: IBookBase = createBookObject();
    const createdBook = await repository.create(bookData);
    const deletedBook = await repository.delete(createdBook.id);

    expect(deletedBook).toEqual(createdBook);

    await expect(repository.getById(createdBook.id)).rejects.toThrow(
      "Book not found"
    );
  });

  // Retrieving a book by ID
  test("Retrieving a book by ID that exists", async () => {
    const bookData: IBookBase = createBookObject();
    const createdBook = await repository.create(bookData);

    const retrievedBook = await repository.getById(createdBook.id);
    expect(retrievedBook).toEqual(createdBook);
    const deletedBook = await repository.delete(retrievedBook.id);
  });

  test("Retrieving a book by ID that does not exist", async () => {
    await expect(() => repository.getById(9999)).rejects.toThrow(
      "Book not found"
    );
  });

  // List the books with default limit.
  test.skip("Listing all books", async () => {
    const books = await repository.list();
    expect(books.length).toBe(60);
  });

  // Searching book with search term that doesn't match
  test("Listing books with a non-matching search", async () => {
    await expect(repository.list("Non-Existent Title")).rejects.toThrow(
      "No books found matching the criteria"
    );
  });

  // Searching book with search term
  test("Listing books with a search term", async () => {
    const bookData: IBookBase = {
      title: "New Book",
      author: "Jane Smith",
      publisher: "Fiction House",
      genre: "Adventure",
      isbnNo: "1234567890123",
      numOfPages: 350,
      totalNumOfCopies: 10,
    };
    const newBook = await repository.create(bookData);
    const seltectedBook = await repository.getById(newBook.id);
    expect(newBook).toEqual({
      ...seltectedBook,
    });

    const books = await repository.list("Unique Title");
    expect(books.length).toBeGreaterThan(0);
    expect(books[0].title).toBe("Unique Title");
    const deletedBook = await repository.delete(newBook.id);
  });
});
