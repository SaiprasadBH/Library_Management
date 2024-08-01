import { describe, test, expect, beforeAll } from "vitest";
import { BookRepository } from "./book.repository";
import { IBookBase } from "../models/book.model";
import { faker } from "@faker-js/faker";
import { AppEnvs } from "../core/read-env";
import { MySQLConnectionFactory } from "../database/oldDbHandlingUtilities/connectionFactory";
import { DrizzleAdapter } from "../../drizzle-mysql2-orm/drizzleMysqlAdapter";

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
  let db: DrizzleAdapter;
  let url: string;

  beforeAll(() => {
    url = AppEnvs.DATABASE_URL;
    db = new DrizzleAdapter(url);
    repository = new BookRepository(db);
  });

  // Get a book by id.
  test("Get book by id", async () => {
    const seltectedBook = await repository.getById(7);
    console.log(seltectedBook);
    expect(seltectedBook).toEqual({
      author: "Carlo Ghezzi, Mehdi Jazayeri",
      availableNumOfCopies: 7,
      genre: "Computers",
      id: 7,
      isbnNo: "",
      numOfPages: 456,
      publisher: "John Wiley & Sons",
      title: "Programming Language Concepts",
      totalNumOfCopies: 7,
    });
  }, 10000);

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
    const newBook = (await repository.create(bookData))!;
    const selectedBook = await repository.getById(newBook.id);
    expect(newBook).toEqual({
      ...selectedBook,
    });
    const deletedBook = await repository.delete(newBook.id);
  }, 10000);

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
    const createdBook = (await repository.create(bookData))!;
    const updatedData: IBookBase = {
      title: "Updated Book",
      author: "John Doe",
      publisher: "Updated Publishers",
      genre: "Thriller",
      isbnNo: "9876543210321",
      numOfPages: 300,
      totalNumOfCopies: 8,
    };
    const updatedBook = (await repository.update(createdBook.id, updatedData))!;
    expect(updatedBook).toEqual({
      id: createdBook?.id,
      availableNumOfCopies: 8,
      ...updatedData,
    });

    const deletedBook = await repository.delete(updatedBook.id);
  }, 10000);

  // Deleting a book.
  test("Deleting a book", async () => {
    const bookData: IBookBase = createBookObject();
    const createdBook = (await repository.create(bookData))!;
    const deletedBook = await repository.delete(createdBook.id);

    expect(deletedBook).toEqual(createdBook);

    await expect(repository.getById(createdBook.id)).rejects.toThrow(
      "Book not found"
    );
  }, 10000);

  // Retrieving a book by ID
  test("Retrieving a book by ID that exists", async () => {
    const bookData: IBookBase = createBookObject();
    const createdBook = (await repository.create(bookData))!;

    const retrievedBook = await repository.getById(createdBook.id);
    expect(retrievedBook).toEqual(createdBook);
    // await repository.delete(createdBook.id);
  }, 10000);

  test("Retrieving a book by ID that does not exist", async () => {
    await expect(repository.getById(9999)).rejects.toThrow("Book not found");
  }, 10000);

  // List the books with default limit.
  test("Listing all books", async () => {
    const books = (await repository.list({ offset: 0, limit: 5 }))!;
    console.table(books);

    expect(books.pagination.limit).toBe(5);
  }, 10000);

  // Searching book with search term that doesn't match
  test("Listing books with a non-matching search", async () => {
    const result = await repository.list({
      search: "Non-Existent Title",
      offset: 0,
      limit: 5,
    });

    expect(result!.items).toEqual([]);
    expect(result!.pagination.total).toBe(0);
  }, 10000);

  // Searching book with search term
  test("Listing books with a search term", async () => {
    const bookData: IBookBase = {
      title: "Unique Title",
      author: "Jane Smith",
      publisher: "Fiction House",
      genre: "Adventure",
      isbnNo: "1234567890123",
      numOfPages: 350,
      totalNumOfCopies: 10,
    };
    const newBook = (await repository.create(bookData))!;
    const seltectedBook = await repository.getById(newBook.id);
    expect(newBook).toEqual({
      ...seltectedBook,
    });

    const books = await repository.list({
      search: "Unique Title",
      offset: 0,
      limit: 5,
    });
    expect(books?.items.length).toBeGreaterThan(0);
    expect(books?.items[0].title).toBe("Unique Title");
    const deletedBook = await repository.delete(newBook.id);
  });
});
