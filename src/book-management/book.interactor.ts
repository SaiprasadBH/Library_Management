import { IInteractor } from "../core/interactor";
import { clearScreen, readChar, readLine } from "../core/input.utils";
import { BookRepository } from "./book.repository";
import { IBook, IBookBase } from "../models/book.model";
import {
  printChoice,
  printError,
  printHint,
  printResult,
  printSubTitle,
  printTitle,
} from "../core/output.utils";
import { IPageRequest } from "../core/pagination";
import { Menu } from "../core/menu";
import { Database } from "../database/db";
import { ZodNumber, z } from "zod";
import { BookSchema, bookSchema } from "../models/book.schema";

const menu = new Menu([
  { key: "1", label: "Add a Book" },
  { key: "2", label: "Edit a Book" },
  { key: "3", label: "Search for a Book" },
  { key: "4", label: "Delete a Book" },
  { key: "5", label: "Previous Menu" },
]);
export class BookInteractor implements IInteractor {
  private repo: BookRepository;

  constructor(db: Database) {
    this.repo = new BookRepository(db);
  }

  async showMenu(): Promise<void> {
    let loop = true;
    while (loop) {
      printTitle();
      printSubTitle("Book Management");
      const op = await readChar(menu.serialize());
      const menuItem = menu.getItem(op);
      printSubTitle(`${menuItem?.label}`);
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
          printError("Invalid Input");
          break;
      }
      clearScreen();
    }
  }
}

//////////////////// Depricated
const checkInt = async (value: string | number): Promise<number> => {
  if (typeof value === "number") return value;
  const intValue = parseInt(value);
  if (!Number.isNaN(intValue)) return intValue;
  printError(`Invalid Input, only input of type "number" is allowed!!`);
  return checkInt(await readLine("Enter again: "));
};

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
////////////////////////

async function validateInput<T>(
  question: string,
  schema: z.Schema<T>,
  existingValue?: T
): Promise<T> {
  if (existingValue) {
    const newInput =
      (await readLine(`${question} (${existingValue ?? ""}):`)) ||
      existingValue;
    return schema.parse(
      schema instanceof ZodNumber ? Number(newInput) : newInput
    );
  }
  const input = await readLine(question);
  try {
    return schema.parse(schema instanceof ZodNumber ? Number(input) : input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      printError(`Invalid input: ${error.errors[0].message}`);
    }
    return validateInput(question, schema, existingValue);
  }
}

async function getBookInput(existingBook?: IBookBase): Promise<IBookBase> {
  const title = await validateInput<string>(
    "Enter title: ",
    bookSchema.shape.title,
    existingBook?.title
  );
  const author = await validateInput<string>(
    "Enter author: ",
    bookSchema.shape.author,
    existingBook?.author
  );
  const publisher = await validateInput<string>(
    "Enter publisher: ",
    bookSchema.shape.publisher,
    existingBook?.publisher
  );
  printHint("For multiple genres use ',' for separation between them.");
  let genre = await validateInput<string>(
    "Enter genre: ",
    z.string(),
    existingBook?.genre?.join(", ")
  );
  const genreArray = genre.split(",").map((g) => g.trim());
  //await validateInput("Enter genre: ", bookSchema.shape.genre, genreArray);
  const isbNo = await validateInput<string>(
    "Enter ISB number: ",
    bookSchema.shape.isbNo,
    existingBook?.isbNo
  );
  const numOfPages = await validateInput<number>(
    "Enter number of pages: ",
    bookSchema.shape.numOfPages,
    existingBook?.numOfPages
  );
  const totalNumOfCopies = await validateInput<number>(
    "Enter total number of copies: ",
    bookSchema.shape.totalNumOfCopies,
    existingBook?.totalNumOfCopies
  );

  return {
    title,
    author,
    publisher,
    genre: genreArray,
    isbNo,
    numOfPages,
    totalNumOfCopies,
  };
}

async function addBook(repo: BookRepository) {
  console.log("");
  try {
    const newBook: IBookBase = await getBookInput();
    const createdBook: IBook = await repo.create(newBook);
    if (createdBook) {
      printResult("Added the book successfully");
      console.table(createdBook);
    }
  } catch (error: unknown) {
    if (error instanceof Error) console.log(error.message);
  }
  await readLine("Press Enter to continue");
  return;
}

async function editBook(repo: BookRepository) {
  const bookId = await validateInput<number>(
    "\nEnter the Id of the book to edit: ",
    BookSchema.shape.id
  );
  const existingBook = await repo.getById(bookId);
  if (!existingBook) {
    printError("Book not found");
  } else {
    printHint(
      'Press "Enter" if you don\'t want to change the current property.'
    );
    const updatedData = await getBookInput(existingBook);
    const updatedBook = await repo.update(existingBook.id, updatedData);
    printResult("Book updated successfully");
    console.table(updatedBook);
  }
  await readLine("Press Enter to continue");
  return;
}

async function searchForBook(repo: BookRepository) {
  const search = await getNonEmptyInput("\nSearch for title or ISBNo.\n");
  printHint('Press "Enter" to set default offset to 0');
  const defaultOffset: string | number = "-";
  const defaultLimit: number = 5;
  const offset = await checkInt(
    await setUserInputOrDefault("Enter offset: ", defaultOffset)
  );
  printHint('Press "Enter" to set default limit to 5');
  const limit = await checkInt(
    await setUserInputOrDefault("Enter limit: ", defaultLimit)
  );
  const pageRequest: IPageRequest = { search, offset, limit };
  const searchResult = await repo.list(pageRequest);
  if (searchResult.items.length === 0) {
    printError("No match found");
  } else {
    searchResult.items.forEach((matchedBook) => {
      console.table(matchedBook);
    });
    printResult(
      `Showing ${limit} results out of ${searchResult.pagination.total}`
    );
  }
  await readLine("Press Enter to continue");
  return;
}

async function deleteBook(repo: BookRepository) {
  const bookId = await validateInput<number>(
    "\nEnter the Id of the book to delete: ",
    BookSchema.shape.id
  );

  const deletedBook = await repo.delete(bookId);
  if (!deletedBook) printError("Book not found");
  else {
    printResult(
      `The book ${deletedBook.title} with Id ${bookId} deleted successfully`
    );
    console.table(deletedBook);
  }
  await readLine("Press Enter to continue");
  return;
}
