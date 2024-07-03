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
import { Database } from "../database/db";

const menu = `
    1. Add a Book
    2. Edit a Book
    3. Search for a Book
    4. Delete a Book
    5. <Previous Menu>\n`;
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
      const op = await readChar(menu);
      printTitle();
      printSubTitle("Book Management");
      switch (op.toLowerCase()) {
        case "1":
          printChoice("Add Book");
          await addBook(this.repo);
          break;
        case "2":
          printChoice("Edit Book");
          await editBook(this.repo);
          break;
        case "3":
          printChoice("Search Book");
          await searchForBook(this.repo);
          break;
        case "4":
          printChoice("Delete Book");
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

async function getBookInput(existingBook?: IBookBase): Promise<IBookBase> {
  const title = await setUserInputOrDefault(
    "Enter title: ",
    existingBook?.title
  );
  const author = await setUserInputOrDefault(
    "Enter author: ",
    existingBook?.author
  );
  const publisher = await setUserInputOrDefault(
    "Enter publisher: ",
    existingBook?.publisher
  );
  printHint("For multiple genres use ',' for separation between them.");
  let genre = await setUserInputOrDefault("Enter genre: ", existingBook?.genre);
  if (typeof genre === "string") genre = genre.split(",");
  const isbNo = await setUserInputOrDefault(
    "Enter ISB number: ",
    existingBook?.isbNo
  );
  const numOfPages = await checkInt(
    await setUserInputOrDefault(
      "Enter number of pages: ",
      existingBook?.numOfPages
    )
  );
  const totalNumOfCopies = await checkInt(
    await setUserInputOrDefault(
      "Enter total number of copies: ",
      existingBook?.totalNumOfCopies
    )
  );
  return {
    title: title,
    author: author,
    publisher: publisher,
    genre: genre,
    isbNo: isbNo,
    numOfPages: numOfPages,
    totalNumOfCopies: totalNumOfCopies,
  };
}

async function addBook(repo: BookRepository) {
  console.log("");
  const newBook: IBookBase = await getBookInput();
  const createdBook: IBook = await repo.create(newBook);
  printResult("Added the book successfully");
  console.table(createdBook);
  await readLine("Press Enter to continue");
  return;
}

async function editBook(repo: BookRepository) {
  const bookId = await checkInt(
    await readLine("\nEnter the Id of the book to edit: ")
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
  const bookId = await checkInt(
    await readLine("Enter the Id of the book to delete: ")
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
