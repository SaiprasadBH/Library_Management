import { describe, test, expect, beforeEach } from "vitest";
import { BookRepository } from "./bookrepository";
import { IBookBase, bookSchema } from "../model/bookSchema";

let bookRepo: BookRepository;

beforeEach(() => {
  bookRepo = new BookRepository();
  bookRepo.books.length = 0;
});

describe("BookRepository", () => {
  test("should create a book", () => {
    const bookData: IBookBase = {
      title: "Test Book",
      author: "Test Author",
      publisher: "Test Publisher",
      genre: ["Test Genre"],
      isbNo: "1234567890",
      numOfPages: 100,
      totalNumOfCopies: 10,
    };

    const createdBook = bookRepo.create(bookData);

    expect(createdBook).toEqual({
      ...bookData,
      id: 1,
      availableNumOfCopies: 10,
    });
  });

  test("should update a book", () => {
    const bookData: IBookBase = {
      title: "Test Book",
      author: "Test Author",
      publisher: "Test Publisher",
      genre: ["Test Genre"],
      isbNo: "1234567890",
      numOfPages: 100,
      totalNumOfCopies: 10,
    };

    const createdBook = bookRepo.create(bookData);
    const updatedData: IBookBase = {
      ...bookData,
      title: "Updated Test Book",
      totalNumOfCopies: 15,
    };

    const updatedBook = bookRepo.update(createdBook.id, updatedData);

    expect(updatedBook).toEqual({
      ...updatedData,
      id: createdBook.id,
      availableNumOfCopies:
        15 - (bookData.totalNumOfCopies - createdBook.availableNumOfCopies),
    });
  });

  test("should delete a book", () => {
    const bookData: IBookBase = {
      title: "Test Book",
      author: "Test Author",
      publisher: "Test Publisher",
      genre: ["Test Genre"],
      isbNo: "1234567890",
      numOfPages: 100,
      totalNumOfCopies: 10,
    };

    const createdBook = bookRepo.create(bookData);
    const deletedBook = bookRepo.delete(createdBook.id);

    expect(deletedBook).toEqual(createdBook);
    expect(bookRepo.getById(createdBook.id)).toBeNull();
  });

  test("should get a book by id", () => {
    const bookData: IBookBase = {
      title: "Test Book",
      author: "Test Author",
      publisher: "Test Publisher",
      genre: ["Test Genre"],
      isbNo: "1234567890",
      numOfPages: 100,
      totalNumOfCopies: 10,
    };

    const createdBook = bookRepo.create(bookData);
    const fetchedBook = bookRepo.getById(createdBook.id);

    expect(fetchedBook).toEqual(createdBook);
  });

  test("should list books with pagination", () => {
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

    bookRepo.create(bookData1);
    bookRepo.create(bookData2);

    const paginatedBooks = bookRepo.list({ offset: 0, limit: 1 });

    expect(paginatedBooks.items.length).toBe(1);
    expect(paginatedBooks.pagination.total).toBe(2);
  });
});
