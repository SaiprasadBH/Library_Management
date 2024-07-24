import { z } from "zod";
import { clearScreen, readChar, readLine } from "../libs/input.utils";
import { IInteractor } from "../core/interactor";
import { Menu } from "../libs/menu";
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
} from "../libs/output.utils";
import { ITransaction, ITransactionBase } from "../models/transaction.model";
import { ITransactionBaseSchema } from "../models/transaction.schema";
import { TransactionRepository } from "./transaction.repository";
import { MemberRepository } from "../member-management/member.repository";
import { IPageRequest } from "../core/pagination";
import { MySqlConnectionFactory } from "../database/dbConnection";
import { BookRepository } from "../book-management/book.repository";

const menu = new Menu([
  { key: "1", label: "Issue Book" },
  { key: "2", label: "Return Book" },
  { key: "3", label: "Search for Transaction" },
  { key: "4", label: "Previous Menu" },
]);

export class TransactionInteractor implements IInteractor {
  private repo: TransactionRepository;
  private bookRepo: BookRepository;
  private memberRepo: MemberRepository;

  constructor(connFactory: MySqlConnectionFactory) {
    this.repo = new TransactionRepository(connFactory);
    this.bookRepo = new BookRepository(connFactory);
    this.memberRepo = new MemberRepository(connFactory);
  }

  async showMenu(): Promise<void> {
    let loop = true;
    while (loop) {
      printTitle();
      printSubTitle("Transaction Management");
      printMenu();
      const op = await readChar(menu.serialize());
      clearScreen();
      printTitle();
      printSubTitle("Transaction Management");
      const menuItem = menu.getItem(op);
      printChoice(`${menuItem?.label}`);
      switch (op.toLowerCase()) {
        case "1":
          await issueBook(this.repo, this.bookRepo, this.memberRepo);
          break;
        case "2":
          await returnBook(this.repo, this.bookRepo, this.memberRepo);
          break;
        case "3":
          await searchForTransaction(this.repo);
          break;
        case "4":
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

// New function to search for transactions
async function searchForTransaction(repo: TransactionRepository) {
  printHint(
    `Press ${enterButton} on empty search field to show all transactions. Default limit will be set to 5.`
  );
  const searchText = await readLine("Search for bookId or memberId: ");
  const offset = 0;
  const defaultLimit: number = 5;
  printHint(`Press ${enterButton} to set default limit to 5`);
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

// Function to update the page for pagination
function updatePage(key: string, page: IPageRequest, items: ITransaction[]) {
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

// Function to load the paginated results
const loadPage = async (
  initialPage: ITransaction[],
  pageRequest: IPageRequest,
  searchResultItems: ITransaction[],
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
        : "All current transactions in the Library"
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

// Function to display the transactions in a table format
const displayPage = (items: ITransaction | ITransaction[]) => {
  console.table(items);
};
const checkInt = async (value: string | number): Promise<number> => {
  if (typeof value === "number") return value;
  const intValue = parseInt(value);
  if (!Number.isNaN(intValue)) return intValue;
  printError(`Invalid Input, only input of type "number" is allowed!!`);
  return checkInt(await readLine("Enter again: "));
};

async function validateInput<T>(question: string, schema: z.Schema<T>) {
  do {
    const input = await readLine(question);
    try {
      return schema.parse(
        schema instanceof z.ZodNumber ? Number(input) : input
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        printError(`Invalid input: ${error.errors[0].message}`);
      }
    }
  } while (true);
}

async function getIssueInput(
  bookRepo: BookRepository,
  memberRepo: MemberRepository
): Promise<ITransactionBase> {
  let bookId: number;
  while (true) {
    bookId = await validateInput<number>(
      "Enter Book Id: ",
      ITransactionBaseSchema.shape.bookId
    );
    const book = await bookRepo.getById(bookId);
    if (!book || book.availableNumOfCopies === 0) {
      printError(
        "This book is not available for issue. \n Please select other book or come back later."
      );
      continue;
    }
    console.table(book);
    break;
  }

  let memberId: number;
  while (true) {
    memberId = await validateInput<number>(
      "Enter Member Id: ",
      ITransactionBaseSchema.shape.memberId
    );
    const member = await memberRepo.getById(memberId);
    if (!member) {
      printError("Member not found. Please enter a valid Member ID.");
      continue;
    }
    console.table(member);
    break;
  }

  return {
    bookId,
    memberId,
  };
}

async function getReturnInput(): Promise<ITransactionBase> {
  let bookId: number = await validateInput<number>(
    "Enter Book Id: ",
    ITransactionBaseSchema.shape.memberId
  );
  let memberId: number = await validateInput<number>(
    "Enter Member Id: ",
    ITransactionBaseSchema.shape.memberId
  );

  return { memberId, bookId };
}

async function issueBook(
  repo: TransactionRepository,
  bookRepo: BookRepository,
  memberRepo: MemberRepository
) {
  try {
    const bookIssueData: ITransactionBase = await getIssueInput(
      bookRepo,
      memberRepo
    );

    const createdTransaction: ITransaction = await repo.create(bookIssueData);
    if (createdTransaction) {
      const book = await bookRepo.getById(createdTransaction.bookId);
      const member = await memberRepo.getById(createdTransaction.memberId);
      if (book && member) {
        printHint("\nBook issue details:");
        console.table({
          "Book Title": book.title,
          "Member Name": member.name,
          "Issue Date": createdTransaction.dateOfIssue,
          "Return Date": createdTransaction.dueDate,
        });
      }
      printResult(`Book issued successfully.`);
    }
  } catch (error: unknown) {
    if (error instanceof Error) console.log(error.message);
  }

  printHint(`Press ${enterButton} to continue`);
  await readLine("");
  return;
}

async function returnBook(
  repo: TransactionRepository,
  bookRepo: BookRepository,
  memberRepo: MemberRepository
) {
  try {
    const bookReturnData: ITransactionBase = await getReturnInput();
    const transactions = await repo.list(`${bookReturnData.bookId}`);
    const transaction = transactions.find((item) => {
      return (
        item.bookId === bookReturnData.bookId &&
        item.memberId === bookReturnData.memberId &&
        item.bookStatus === "issued"
      );
    });

    if (transaction) {
      const id = transaction.id;
      const updatedTransaction: ITransaction | null = await repo.returnBook(id);
      if (updatedTransaction) {
        const book = await bookRepo.getById(updatedTransaction.bookId);
        const member = await memberRepo.getById(updatedTransaction.memberId);
        if (book && member) {
          printHint("\nBook return details:");
          console.table({
            "Book Title": book.title,
            "Member Name": member.name,
          });
        }
        printResult(`Book returned successfully.`);
      }
    } else {
      throw new Error("Book already returned or Transaction does not exist");
    }
  } catch (error: unknown) {
    if (error instanceof Error) printError(error.message);
  }

  printHint(`Press ${enterButton} to continue`);
  await readLine("");
  return;
}
