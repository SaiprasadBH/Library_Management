import { describe, test, expect, beforeEach } from "vitest";
import { BookRepository } from "./book.repository";
import { IBookBase } from "../models/book.schema";
import { Database, JsonAdapter } from "../database/db";

let bookRepo: BookRepository;
const db = new Database("database-test-files/json", JsonAdapter);

beforeEach(async () => {
  bookRepo = new BookRepository(db);
  await bookRepo.reset();
});

describe("BookRepository", () => {
  test("should create a book", async () => {
    const bookData: IBookBase = {
      title: "Test Book",
      author: "Test Author",
      publisher: "Test Publisher",
      genre: ["Test Genre"],
      isbNo: "1234567890",
      numOfPages: 100,
      totalNumOfCopies: 10,
    };

    const createdBook = await bookRepo.create(bookData);

    expect(createdBook).toEqual({
      ...bookData,
      id: 1,
      availableNumOfCopies: 10,
    });
  });

  test("should update a book", async () => {
    const bookData: IBookBase = {
      title: "Test Book",
      author: "Test Author",
      publisher: "Test Publisher",
      genre: ["Test Genre"],
      isbNo: "1234567890",
      numOfPages: 100,
      totalNumOfCopies: 10,
    };

    const createdBook = await bookRepo.create(bookData);
    const updatedData: IBookBase = {
      ...bookData,
      title: "Updated Test Book",
      totalNumOfCopies: 15,
    };

    const updatedBook = await bookRepo.update(createdBook.id, updatedData);

    expect(updatedBook).toEqual({
      ...updatedData,
      id: createdBook.id,
      availableNumOfCopies:
        15 - (bookData.totalNumOfCopies - createdBook.availableNumOfCopies),
    });
  });

  test("should delete a book", async () => {
    const bookData: IBookBase = {
      title: "Test Book",
      author: "Test Author",
      publisher: "Test Publisher",
      genre: ["Test Genre"],
      isbNo: "1234567890",
      numOfPages: 100,
      totalNumOfCopies: 10,
    };

    const createdBook = await bookRepo.create(bookData);
    const deletedBook = await bookRepo.delete(createdBook.id);

    expect(deletedBook).toEqual(createdBook);
    expect(await bookRepo.getById(createdBook.id)).toBeNull();
  });

  test("should get a book by id", async () => {
    const bookData: IBookBase = {
      title: "Test Book",
      author: "Test Author",
      publisher: "Test Publisher",
      genre: ["Test Genre"],
      isbNo: "1234567890",
      numOfPages: 100,
      totalNumOfCopies: 10,
    };

    const createdBook = await bookRepo.create(bookData);
    const fetchedBook = await bookRepo.getById(createdBook.id);

    expect(fetchedBook).toEqual(createdBook);
  });

  test("should list books with pagination", async () => {
    const bookData1: IBookBase = {
      title: "Test Book 1",
      author: "Test Author 1",
      publisher: "Test Publisher 1",
      genre: ["Test Genre 1"],
      isbNo: "1234567891",
      numOfPages: 100,
      totalNumOfCopies: 10,
    };

    const bookData2: IBookBase = {
      title: "Test Book 2",
      author: "Test Author 2",
      publisher: "Test Publisher 2",
      genre: ["Test Genre 2"],
      isbNo: "1234567892",
      numOfPages: 200,
      totalNumOfCopies: 20,
    };

    await bookRepo.create(bookData1);
    await bookRepo.create(bookData2);

    const paginatedBooks = await bookRepo.list({ offset: 0, limit: 1 });

    expect(paginatedBooks.items.length).toBe(1);
    expect(paginatedBooks.pagination.total).toBe(2);
  });
});
