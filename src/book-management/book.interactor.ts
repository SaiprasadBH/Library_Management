import { IInteractor } from "../core/interactor";
import { clearScreen, readChar, readLine } from "../core/input.utils";
import { BookRepository } from "./book.repository";
import { IBook, IBookBase } from "../models/book.model";
import {
  enterButton,
  printChoice,
  printError,
  printHint,
  printMenu,
  printPanel,
  printResult,
  printSubTitle,
  printTitle,
} from "../core/output.utils";
import { IPageRequest } from "../core/pagination";
import { Menu } from "../core/menu";
import { Database } from "../database/db";
import { ZodNumber, z } from "zod";
import { BookSchema, BookSchemaBase } from "../models/book.schema";
import { LibraryDataset } from "../database/library.dataset";

const menu = new Menu([
  { key: "1", label: "Add a Book" },
  { key: "2", label: "Edit a Book" },
  { key: "3", label: "Search for a Book" },
  { key: "4", label: "Delete a Book" },
  { key: "5", label: "Previous Menu" },
]);
export class BookInteractor implements IInteractor {
  private repo: BookRepository;

  constructor(db: Database<LibraryDataset>) {
    this.repo = new BookRepository(db);
  }

  async showMenu(): Promise<void> {
    let loop = true;
    while (loop) {
      printTitle();
      printSubTitle("Book Management");
      printMenu();
      const op = await readChar(menu.serialize());
      clearScreen();
      printTitle();
      printSubTitle("Book Management");
      const menuItem = menu.getItem(op);
      printChoice(`${menuItem?.label}`);
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
          printHint(`Press ${enterButton} to continue`);
          await readLine("");
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

//////////////////// Depricated
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
  do {
    try {
      let newInput: string;
      if (existingValue) {
        newInput = await readLine(`${question} `, existingValue.toString());
        return schema.parse(
          schema instanceof ZodNumber ? Number(newInput) : newInput
        );
      }
      newInput = await readLine(question);
      return schema.parse(
        schema instanceof ZodNumber ? Number(newInput) : newInput
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
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
    z.string(),
    existingBook?.genre?.join(", ")
  );
  const genreArray = genre.split(",").map((g) => g.trim());
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
    genre: genreArray,
    isbnNo,
    numOfPages,
    totalNumOfCopies,
  };
}

async function addBook(repo: BookRepository) {
  try {
    const newBook: IBookBase = await getBookInput();
    const createdBook: IBook = await repo.create(newBook);
    if (createdBook) {
      printResult("Added the book successfully");
      displayPage(createdBook);
    }
  } catch (error: unknown) {
    if (error instanceof Error) console.log(error.message);
  }
  printHint(`Press ${enterButton} to continue`);
  await readLine("");
  return;
}

async function editBook(repo: BookRepository) {
  const bookId = await validateInput<number>(
    "Enter the Id of the book to edit: ",
    BookSchema.shape.id
  );
  const existingBook = await repo.getById(bookId);
  if (!existingBook) {
    printError("Book not found");
  } else {
    printHint(
      `Press ${enterButton} if you don't want to change the current property.\n`
    );
    const updatedData = await getBookInput(existingBook);
    const updatedBook = await repo.update(existingBook.id, updatedData);
    printResult("Book updated successfully");
    displayPage(updatedBook);
  }
  printHint(`Press ${enterButton} to continue`);
  await readLine("");
  return;
}

const displayPage = (items: IBook | IBook[]) => {
  console.table(items);
};

function updatePage(key: string, page: IPageRequest, items: IBook[]) {
  const total = items.length;
  let limit = page.limit;

  if (key === "\u001b[C") {
    if (page.offset + limit < total) {
      page.offset = page.offset + limit;
    }
  } else if (key === "\u001b[D") {
    if (page.offset - limit >= 0) {
      page.offset = page.offset - limit;
    }
  }
  const updatedPageIndex = Math.floor(page.offset / page.limit) + 1;
  const updatedPage = items.slice(page.offset, limit + page.offset);
  return { updatedPage, updatedPageIndex };
}

const loadPage = async (
  initialPage: IBook[],
  pageRequest: IPageRequest,
  searchResultItems: IBook[],
  searchText?: string
) => {
  let loadedPage = initialPage;
  let pageIndex = 1;
  const totalPages = Math.ceil(searchResultItems.length / pageRequest.limit);
  while (true) {
    clearScreen();
    printResult(
      searchText
        ? `Search result for "${searchText}"`
        : "All current books in the Library"
    );
    displayPage(loadedPage);

    const navPanel = `${pageIndex === 1 ? "" : "<"} ${pageIndex}/${totalPages} ${pageIndex === totalPages ? "" : ">"}`;
    printPanel(`${navPanel}`);

    printHint(`Press ${enterButton} to continue`);
    const key = await readChar();
    if (key === "\u001b[C" || key === "\u001b[D") {
      const { updatedPage, updatedPageIndex } = updatePage(
        key,
        pageRequest,
        searchResultItems
      );
      loadedPage = updatedPage;
      pageIndex = updatedPageIndex;
    } else if (key === "\r") break;
  }
};

async function searchForBook(repo: BookRepository) {
  printHint(
    'Press "Enter" on empty search field to show all the books.Default limit will be set to 5.'
  );
  const searchText = await readLine("Search for title or ISBNo.: ");
  const offset = 0;
  const defaultLimit: number = 5;
  printHint('Press "Enter" to set default limit to 5');
  const limit = await checkInt(
    await readLine("Enter limit: ", defaultLimit.toString())
  );
  const pageRequest: IPageRequest = { offset, limit };

  const searchResultItems = await repo.list(searchText);
  if (searchResultItems.length === 0) {
    printError("No match found");
  } else {
    const currPage = searchResultItems.slice(offset, limit);
    await loadPage(currPage, pageRequest, searchResultItems, searchText);
  }
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
    displayPage(deletedBook);
  }
  await readLine("Press Enter to continue");
  return;
}
