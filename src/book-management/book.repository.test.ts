import { describe, test, expect, beforeEach, beforeAll } from "vitest";
import { BookRepository } from "./book.repository";
import { IBookBase, IBook } from "../models/book.model";
import { Database, JsonAdapter } from "../database/db";
import { faker } from "@faker-js/faker";
import { LibraryDataset } from "../database/library.dataset";

function createBookObject(): IBookBase {
  return {
    title: faker.lorem.words(),
    author: faker.person.fullName(),
    publisher: faker.company.name(),
    genre: faker.lorem.words().split(" "),
    isbnNo: faker.string.alphanumeric(13),
    numOfPages: faker.number.int({ min: 100, max: 1000 }),
    totalNumOfCopies: faker.number.int({ min: 1, max: 50 }),
  };
}

describe("BookRepository", () => {
  let repository: BookRepository;
  let db: Database<LibraryDataset>;

  beforeAll(() => {
    db = new Database<LibraryDataset>(
      "database-test-files/db.json",
      JsonAdapter<LibraryDataset>()
    );
    repository = new BookRepository(db);
  });

  beforeEach(async () => {
    await repository.reset();
    const booksData: IBookBase[] = faker.helpers.multiple(createBookObject, {
      count: 5,
    });
    await Promise.all(booksData.map((data) => repository.create(data)));
  });

  test("Creating a new book", async () => {
    const bookData: IBookBase = {
      title: "New Book",
      author: "Jane Smith",
      publisher: "Fiction House",
      genre: ["Fantasy", "Adventure"],
      isbnNo: "1234567890123",
      numOfPages: 350,
      totalNumOfCopies: 10,
    };
    const newBook = await repository.create(bookData);
    expect(newBook).toEqual({
      id: 6,
      availableNumOfCopies: 10,
      ...bookData,
    });
    expect(db.table("books")).toContainEqual(newBook);
  });

  test("Updating an existing book's details", async () => {
    const bookData: IBookBase = {
      title: "Old Book",
      author: "John Doe",
      publisher: "Book Publishers",
      genre: ["Drama"],
      isbnNo: "9876543210231",
      numOfPages: 200,
      totalNumOfCopies: 5,
    };
    const createdBook = await repository.create(bookData);

    const updatedData: IBookBase = {
      title: "Updated Book",
      author: "John Doe",
      publisher: "Updated Publishers",
      genre: ["Mystery", "Thriller"],
      isbnNo: "0987654321321",
      numOfPages: 300,
      totalNumOfCopies: 8,
    };
    const updatedBook = await repository.update(createdBook.id, updatedData);
    expect(updatedBook).toEqual({
      id: createdBook.id,
      availableNumOfCopies: 8,
      ...updatedData,
    });
    expect(db.table("books")).toContainEqual(updatedBook);
  });

  test("Deleting a book", async () => {
    const book = await repository.getById(1);
    const deletedBook = await repository.delete(1);
    expect(deletedBook).toEqual(book);
    expect(db.table("books")).not.toContainEqual(deletedBook);
  });

  test("Retrieving a book by ID that exists", async () => {
    const book = await repository.getById(2);
    expect(book).toBeDefined();
    expect(book?.id).toBe(2);
  });

  test("Retrieving a book by ID that does not exist", async () => {
    const book = await repository.getById(999);
    expect(book).toBeNull();
  });

  test("Listing all books", async () => {
    const books = await repository.list();
    expect(books.length).toBe(5);
  });

  test("Listing books with a search term", async () => {
    const bookData: IBookBase = {
      title: "Unique Title",
      author: "Author",
      publisher: "Publisher",
      genre: ["Genre"],
      isbnNo: "1234567890124",
      numOfPages: 150,
      totalNumOfCopies: 20,
    };
    await repository.create(bookData);

    const books = await repository.list("Unique Title");
    expect(books.length).toBe(1);
    expect(books[0].title).toBe("Unique Title");
  });

  test("Updating a book's available number of copies correctly", async () => {
    const bookData: IBookBase = {
      title: "Book with Copies",
      author: "Author",
      publisher: "Publisher",
      genre: ["Genre"],
      isbnNo: "1234567890124",
      numOfPages: 150,
      totalNumOfCopies: 20,
    };
    const createdBook = await repository.create(bookData);
    const updatedBook = await repository.update(
      createdBook.id,
      { ...bookData, totalNumOfCopies: 25 },
      18
    );
    expect(updatedBook.availableNumOfCopies).toBe(18);
  });
});
