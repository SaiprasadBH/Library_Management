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
  const db = new Database<LibraryDataset>(
    "database-test-files/db.json",
    JsonAdapter<LibraryDataset>()
  );
  const repository: BookRepository = new BookRepository(db);

  beforeAll(async () => {
    await repository.reset();
    const booksData: IBookBase[] = faker.helpers.multiple(createBookObject, {
      count: 5,
    });
    await Promise.all(booksData.map((data) => repository.create(data)));
  });

  beforeEach(() => {});

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
    await repository.create(bookData);

    const updatedData: IBookBase = {
      title: "Updated Book",
      author: "John Doe",
      publisher: "Updated Publishers",
      genre: ["Mystery", "Thriller"],
      isbnNo: "0987654321321",
      numOfPages: 300,
      totalNumOfCopies: 8,
    };
    const updatedBook = await repository.update(6, updatedData);
    expect(updatedBook).toEqual({
      id: 6,
      availableNumOfCopies: 8,
      ...updatedData,
    });
    expect(db.table("books")).toContainEqual(updatedBook);
  });

  test("should return null when updating a non-existing book", async () => {
    const updatedData: IBookBase = {
      title: "Non-Existent Book",
      author: "Unknown Author",
      publisher: "Unknown Publisher",
      genre: ["None"],
      isbnNo: "1111111111",
      numOfPages: 0,
      totalNumOfCopies: 0,
    };
    const updatedBook = await repository.update(999, updatedData);
    expect(updatedBook).toBeNull();
  });

  test("Deleting a book", async () => {
    const book = await repository.getById(1);
    const deletedBook = await repository.delete(1);
    expect(deletedBook).toEqual(book);
    expect(db.table("books")).not.toContainEqual(deletedBook);
  });

  test("List books with pagination", async () => {
    const params = { offset: 0, limit: 2 };
    const response = await repository.list(params);

    expect(response.items).toEqual([
      await repository.getById(2),
      await repository.getById(3),
    ]);
    expect(response.pagination).toEqual({
      offset: 0,
      limit: 2,
      total: 6,
    });
  });

  test("Search books with pagination", async () => {
    const book = await repository.getById(2);
    const params = { offset: 0, limit: 2, search: book?.title };
    const response = await repository.list(params);

    expect(response.items).toEqual([book]);
    expect(response.pagination).toEqual({
      offset: 0,
      limit: 2,
      total: 1,
    });
  });
});
