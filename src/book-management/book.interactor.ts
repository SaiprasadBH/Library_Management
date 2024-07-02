import { IInteractor } from "../core/interactor";
import { readChar, readLine } from "../core/input.utils";
import { BookRepository } from "./bookrepository";
import { IBook, IBookBase } from "../model/bookmodel";
import {
  printError,
  printHint,
  printResult,
  printSubTitle,
  printTitle,
} from "../src/core/output.utils";
import { IPageRequest } from "../core/pagination";

const menu = `
    1. Add a Book
    2. Edit a Book
    3. Search for a Book
    4. Delete a Book
    5. Previous Menu`;
export class BookInteractor implements IInteractor {
  private repo = new BookRepository();
  async showMenu(): Promise<void> {
    printTitle();
    printSubTitle("Book Management");
    let loop = true;
    while (loop) {
      const op = await readChar(menu);

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
  const newBook: IBookBase = await getBookInput();
  const createdBook: IBook = repo.create(newBook);
  printResult("Added the book successfully");
  console.table(createdBook);
  await readLine("Press Enter to continue");
  return;
}

async function editBook(repo: BookRepository) {
  printHint('Press "Enter" if you don\'t want to change the current property.');
  const bookId = await checkInt(
    await readLine("Enter the Id of the book to edit: ")
  );
  const existingBook = repo.getById(bookId);
  if (!existingBook) {
    printError("Book not found");
  } else {
    const updatedData = await getBookInput(existingBook);
    const updatedBook = repo.update(existingBook.id, updatedData);
    printResult("Book updated successfully");
    console.table(updatedBook);
  }
  await readLine("Press Enter to continue");
  return;
}

async function searchForBook(repo: BookRepository) {
  const search = await getNonEmptyInput("Search for title or ISBNo.\n");
  printHint('Press "Enter" to set default offset to 0');
  const offset = await checkInt(
    await setUserInputOrDefault("Enter offset: ", 0)
  );
  printHint('Press "Enter" to set default limit to 5');
  const limit = await checkInt(await setUserInputOrDefault("Enter limit: ", 5));
  const pageRequest: IPageRequest = { search, offset, limit };
  const searchResult = repo.list(pageRequest);
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
  const deletedBook = repo.delete(bookId);
  if (!deletedBook) printError("Book not found");
  else {
    printResult(
      `The book ${deletedBook.title} with Id ${bookId} deleted successfully`
    );
    console.table(deleteBook);
  }
  await readLine("Press Enter to continue");
  return;
}
