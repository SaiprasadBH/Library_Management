import { z } from "zod";
import { clearScreen, readLine } from "../libs/input.utils";
import { IInteractor } from "../core/interactor";
import { Menu } from "../libs/menu";
import {
  printButton,
  printError,
  printHint,
  printResult,
} from "../libs/output.utils";
import { ITransaction, ITransactionBase } from "../models/transaction.model";
import { ITransactionBaseSchema } from "../models/transaction.schema";
import { TransactionRepository } from "./transaction.repository";
import { MemberRepository } from "../member-management/member.repository";
import { IBook } from "../models/book.schema";
import { IMember } from "../models/member.schema";
import { IPagedResponse, IPageRequest } from "../core/pagination";
import { MySQLConnectionFactory } from "../database/oldDbHandlingUtilities/connectionFactory";
import { BookRepository } from "../book-management/book.repository";
import { loadPage, displayPage } from "../libs/pagination.utils";
import * as readline from "readline";

const menu = new Menu(
  [
    { key: "1", label: "Issue Book" },
    { key: "2", label: "Return Book" },
    { key: "3", label: "Search for Transaction" },
    { key: "4", label: "Back" },
  ],
  "Transaction Management"
);

export class TransactionInteractor implements IInteractor {
  private repo: TransactionRepository;
  private bookRepo: BookRepository;
  private memberRepo: MemberRepository;

  constructor(private readonly dbConnFactory: MySQLConnectionFactory) {
    this.repo = new TransactionRepository(this.dbConnFactory);
    this.bookRepo = new BookRepository(this.dbConnFactory);
    this.memberRepo = new MemberRepository(this.dbConnFactory);
  }

  async showMenu(): Promise<void> {
    let loop = true;
    while (loop) {
      const op = await menu.selectMenuItem();

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
          printHint(`Press ${printButton} to continue`);
          await readLine("");
          break;
      }
    }
  }
}

// New function to search for transactions
async function searchForTransaction(repo: TransactionRepository) {
  printHint(
    `Press ${printButton} on empty search field to show all transactions. Default limit will be set to 5.`
  );
  const searchText = await readLine("Search for bookId or memberId: ");
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
      menu.updateFrame(menu.selectedItem);
      return schema.parse(
        schema instanceof z.ZodNumber ? Number(input) : input
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        menu.updateFrame(menu.selectedItem);
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
    displayPage(book);
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
    displayPage(member);
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

    const createdTransaction = await repo.create(bookIssueData);
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
    if (error instanceof Error) printError(error.message);
  }

  printHint(`Press ${printButton} to continue`);
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
    const pageRequest: IPageRequest = {
      search: `${bookReturnData.bookId}`,
      offset: 0,
      limit: 5,
    };
    const transactions = await repo.list(pageRequest);
    const transaction = transactions?.items.find((item) => {
      return (
        item.bookId === bookReturnData.bookId &&
        item.memberId === bookReturnData.memberId &&
        item.bookStatus === "issued"
      );
    });

    if (transaction) {
      const id = transaction.id;
      const deletedTransaction = await repo.delete(id);
      if (deletedTransaction) {
        const book = await bookRepo.getById(deletedTransaction.bookId);
        const member = await memberRepo.getById(deletedTransaction.memberId);
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

  printHint(`Press ${printButton} to continue`);
  await readLine("");
  return;
}
