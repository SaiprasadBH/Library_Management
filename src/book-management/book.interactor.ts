import { IInteractor } from "../core/interactor";
import { clearScreen, readLine } from "../libs/input.utils";
import { BookRepository } from "./book.repository";
import { IBook, IBookBase } from "../models/book.model";
import {
  printButton,
  printError,
  printHint,
  printResult,
} from "../libs/output.utils";
import { IPagedResponse, IPageRequest } from "../core/pagination";
import { Menu } from "../libs/menu";
import { ZodNumber, z } from "zod";
import {
  BookSchema,
  BookSchemaBase,
  zNonNumString,
} from "../models/book.schema";
import { MySQLConnectionFactory } from "../database/oldDbHandlingUtilities/connectionFactory";
import { displayPage, loadPage } from "../libs/pagination.utils";
import * as readline from "readline";
import { DrizzleAdapter } from "../../drizzle-mysql2-orm/drizzleMysqlAdapter";

const menu = new Menu(
  [
    { key: "1", label: "Add a Book" },
    { key: "2", label: "Edit a Book" },
    { key: "3", label: "Search for a Book" },
    { key: "4", label: "Delete a Book" },
    { key: "5", label: "Back" },
  ],
  "Book Management"
);
export class BookInteractor implements IInteractor {
  private repo: BookRepository;

  constructor(connection: DrizzleAdapter) {
    this.repo = new BookRepository(connection);
  }

  async showMenu(): Promise<void> {
    let loop = true;
    while (loop) {
      const op = await menu.selectMenuItem();

      switch (op.toLowerCase()) {
        case "1":
          await addBook(this.repo);
          break;
        case "2":
          await editBook(this.repo);
          break;
        case "3":
          await searchForBook(this.repo);
          break;
        case "4":
          await deleteBook(this.repo);
          break;
        case "5":
          loop = false;
          break;
        default:
          printError("Invalid choice");
          printHint(`Press ${printButton} to continue`);
          await readLine("");
          break;
      }
    }
  }
}

const checkInt = async (value: string | number): Promise<number> => {
  if (typeof value === "number") return value;
  const intValue = parseInt(value);
  if (!Number.isNaN(intValue)) return intValue;
  printError(`Invalid Input, only input of type "number" is allowed!!`);
  return checkInt(await readLine("Enter again: "));
};

/////////// Depricated
const getNonEmptyInput = async (question: string): Promise<string> => {
  const answer = await readLine(question);
  if (answer.trim() !== "") {
    return answer;
  }
  printError("This field cannot be empty!!");
  return getNonEmptyInput(question);
};

const setUserInputOrDefault = async <_, T>(
  question: string,
  existingData?: T
): Promise<string | NonNullable<T>> => {
  return !existingData
    ? await getNonEmptyInput(question)
    : (await readLine(`${question} (${existingData ?? ""}):`)) || existingData;
};
////////////////////

async function validateInput<T>(
  question: string,
  schema: z.Schema<T>,
  existingValue?: T
): Promise<T> {
  do {
    try {
      let newInput: string;
      if (existingValue) {
        newInput = await readLine(`${question} `, existingValue.toString());
      } else newInput = await readLine(question);
      menu.updateFrame(menu.selectedItem);
      return schema.parse(
        schema instanceof ZodNumber ? Number(newInput) : newInput
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        menu.updateFrame(menu.selectedItem);
        printError(`Invalid input: ${error.errors[0].message}`);
      }
    }
  } while (true);
}

async function getBookInput(existingBook?: IBookBase): Promise<IBookBase> {
  const title = await validateInput<string>(
    "Enter title: ",
    BookSchemaBase.shape.title,
    existingBook?.title
  );
  const author = await validateInput<string>(
    "Enter author: ",
    BookSchemaBase.shape.author,
    existingBook?.author
  );
  const publisher = await validateInput<string>(
    "Enter publisher: ",
    BookSchemaBase.shape.publisher,
    existingBook?.publisher
  );
  printHint("For multiple genres use ',' for separation between them.");
  let genre = await validateInput<string>(
    "Enter genre: ",
    zNonNumString,
    existingBook?.genre
  );

  //await validateInput("Enter genre: ", bookSchema.shape.genre, genreArray);
  const isbnNo = await validateInput<string>(
    "Enter ISB number: ",
    BookSchemaBase.shape.isbnNo,
    existingBook?.isbnNo
  );
  const numOfPages = await validateInput<number>(
    "Enter number of pages: ",
    BookSchemaBase.shape.numOfPages,
    existingBook?.numOfPages
  );
  const totalNumOfCopies = await validateInput<number>(
    "Enter total number of copies: ",
    BookSchemaBase.shape.totalNumOfCopies,
    existingBook?.totalNumOfCopies
  );

  return {
    title,
    author,
    publisher,
    genre,
    isbnNo,
    numOfPages: numOfPages,
    totalNumOfCopies,
  };
}

async function addBook(repo: BookRepository) {
  try {
    const newBook: IBookBase = await getBookInput();
    const createdBook = await repo.create(newBook);
    if (createdBook) {
      printResult("Added the book successfully");
      displayPage(createdBook);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      printError(error.message);
    }
  }
  printHint(`Press ${printButton} to continue`);
  await readLine("");
  return;
}

async function editBook(repo: BookRepository) {
  try {
    const bookId = await validateInput<number>(
      "Enter the Id of the book to edit: ",
      BookSchema.shape.id
    );
    const existingBook = await repo.getById(bookId);
    if (existingBook) {
      printHint(
        `Press ${printButton} if you don't want to change the current property.\n`
      );
      const updatedData = await getBookInput(existingBook);
      const updatedBook = await repo.update(existingBook.id, updatedData);
      if (updatedBook) {
        printResult("Book updated successfully");
        displayPage(updatedBook);
      }
    }
  } catch (err) {
    if (err instanceof Error) printError(err.message);
  } finally {
    printHint(`Press ${printButton} to continue`);
    await readLine("");
  }
  return;
}

async function searchForBook(repo: BookRepository) {
  printHint(
    `Press ${printButton} on empty search field to show all the books.Default limit will be set to 5.`
  );
  const searchText = await readLine("Search for title or ISBNo.: ");
  const offset = 0;
  const defaultLimit: number = 5;
  printHint(`Press ${printButton} to set default limit to 5`);
  const limit = await checkInt(
    await readLine("Enter limit: ", defaultLimit.toString())
  );
  const pageRequest: IPageRequest = { search: searchText, offset, limit };

  await loadPage(repo, pageRequest);
  return;
}

async function deleteBook(repo: BookRepository) {
  const bookId = await validateInput<number>(
    "\nEnter the Id of the book to delete: ",
    BookSchema.shape.id
  );

  try {
    const deletedBook = await repo.delete(bookId);
    if (deletedBook) {
      printResult(
        `The book ${deletedBook.title} with Id ${bookId} deleted successfully`
      );
      displayPage(deletedBook);
    }
  } catch (err) {
    if (err instanceof Error) printError(err.message);
  } finally {
    printHint(`Press ${printButton} to continue`);
    await readLine("");
  }
  return;
}
