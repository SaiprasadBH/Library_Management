import express, { Request, Response, NextFunction } from "express";
import {
  drizzleAdapter,
  books,
} from "../../drizzle-mysql2-orm/drizzleMysqlAdapter";
import { BookRepository } from "../../src/book-management/book.repository";
import { IBookBase } from "../../src/models/book.model";
import { IPageRequest } from "../../src/core/pagination";
import { IBook } from "../../src/models/book.schema";

const app = express();
const port = 3000;
const bookRepository = new BookRepository(drizzleAdapter);

// Middleware to set headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  next();
});

// Middleware to parse JSON body
app.use(express.json());

// Book Routes
app.get("/books", async (req: Request, res: Response) => {
  try {
    const bookId = req.query.id as string;
    const offset = req.query.offset as string;
    const limit = req.query.limit as string;
    const search = req.query.search || "";

    if (bookId) {
      const book = await bookRepository.getById(Number(bookId));
      res.status(200).json(book);
    } else if (offset && limit) {
      const pageRequest: IPageRequest = {
        offset: Number(offset),
        limit: Number(limit),
        search: search as string,
      };
      const paginatedBooks = await bookRepository.list(pageRequest);
      res.status(200).json(paginatedBooks);
    } else {
      const db = await drizzleAdapter.getStandaloneConnection();
      const allBooks = await db.select().from(books);
      res.status(200).json(allBooks);
    }
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

app.post("/books", async (req: Request, res: Response) => {
  try {
    const bookData: IBookBase = req.body;
    const newBook = await bookRepository.create(bookData);
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

app.patch("/books", async (req: Request, res: Response) => {
  try {
    const bookId = Number(req.query.id as string);
    const bookData: IBookBase = req.body;
    const updatedBook = await bookRepository.update(bookId, bookData);
    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

app.delete("/books", async (req: Request, res: Response) => {
  try {
    const bookId = Number(req.query.id as string);
    const deletedBook = await bookRepository.delete(bookId);
    res.status(200).json(deletedBook);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
