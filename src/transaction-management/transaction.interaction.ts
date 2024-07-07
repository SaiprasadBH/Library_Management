import { z } from "zod";
import { clearScreen, readChar, readLine } from "../core/input.utils";
import { IInteractor } from "../core/interactor";
import { Menu } from "../core/menu";
import {
  enterButton,
  printChoice,
  printError,
  printHint,
  printMenu,
  printResult,
  printSubTitle,
  printTitle,
} from "../core/output.utils";
import { Database } from "../database/db";
import { LibraryDataset } from "../database/library.dataset";
import { ITransaction, ITransactionBase } from "../models/transaction.model";
import { ITransactionBaseSchema } from "../models/transaction.schema";
import { TransactionRepository } from "./transaction.repository";
import { BookRepository } from "../book-management/book.repository";
import { MemberRepository } from "../member-management/member.repository";
import { IBook } from "../models/book.schema";
import { IMember } from "../models/member.schema";

const menu = new Menu([
  { key: "1", label: "Issue Book" },
  { key: "2", label: "Return Book" },
  { key: "3", label: "Previous Menu" },
]);

export class TransactionInteractor implements IInteractor {
  private repo: TransactionRepository;
  private bookRepo: BookRepository;
  private memberRepo: MemberRepository;

  constructor(db: Database<LibraryDataset>) {
    this.repo = new TransactionRepository(db);
    this.bookRepo = new BookRepository(db);
    this.memberRepo = new MemberRepository(db);
  }

  async showMenu(): Promise<void> {
    let loop = true;
    while (loop) {
      printTitle();
      printSubTitle("Member Management");
      printMenu();
      const op = await readChar(menu.serialize());
      clearScreen();
      printTitle();
      printSubTitle("Member Management");
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
          "Issue Date": createdTransaction.dateOfIssue.toDateString(),
          "Return Date": createdTransaction.dueDate.toDateString(),
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
    const id = bookReturnData.bookId;
    const deletedTransaction: ITransaction | null = await repo.delete(id);
    if (deletedTransaction) {
      const book = await bookRepo.getById(deletedTransaction.bookId);
      const member = await memberRepo.getById(deletedTransaction.memberId);
      if (book && member) {
        console.table({
          "Book Title": book.title,
          "Member Name": member.name,
        });
      }
      printResult(`Book returned successfully.`);
    }
  } catch (error: unknown) {
    if (error instanceof Error) console.log(error.message);
  }
  printHint(`Press ${enterButton} to continue`);
  await readLine("");
  return;
}
