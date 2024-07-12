import { IInteractor } from "./src/core/interactor";
import { clearScreen, readChar, readLine } from "./src/libs/input.utils";
import { BookInteractor } from "./src/book-management/book.interactor";
import {
  enterButton,
  printError,
  printHint,
  printMenu,
  printPanel,
  printTitle,
} from "./src/libs/output.utils";
import { Menu } from "./src/libs/menu";
import { Database } from "./src/database/db";
import { MemberInteractor } from "./src/member-management/member.interaction";
import { LibraryDataset } from "./src/database/library.dataset";
import { TransactionInteractor } from "./src/transaction-management/transaction.interaction";
import { LibraryDB } from "./src/database/sqlDb";
import { MockLibraryDataset } from "./src/database/mockLibrary.dataset";

const menu = new Menu([
  { key: "1", label: "Book Management" },
  { key: "2", label: "Member Management" },
  { key: "3", label: "Transaction Management" },
  { key: "4", label: "Exit" },
]);

export class LibraryInteractor implements IInteractor {
  private readonly bookInteractor: BookInteractor;
  private readonly memberInteractor: MemberInteractor;
  private readonly transactionInteractor: TransactionInteractor;

  constructor(db: Database<LibraryDataset>) {
    this.bookInteractor = new BookInteractor(db);
    this.memberInteractor = new MemberInteractor(db);
    this.transactionInteractor = new TransactionInteractor(db);
  }

  async showMenu(): Promise<void> {
    clearScreen();
    printTitle();
    printMenu();
    const op = await readChar(menu.serialize());
    switch (op.toLowerCase()) {
      case "1":
        clearScreen();
        await this.bookInteractor.showMenu();
        break;
      case "2":
        clearScreen();
        await this.memberInteractor.showMenu();
        break;
      case "3":
        clearScreen();
        await this.transactionInteractor.showMenu();
        break;
      case "4":
        await sqlDb.shutdownPoolConnection();
        console.log("\n");
        printPanel("! ! ! Bye ! ! !");
        console.log("\n");
        process.exit(0);
      default:
        printError("Invalid choice");
        printHint(`Press ${enterButton} to continue`);
        await readLine("");
        break;
    }
    this.showMenu();
  }
}

// Initialize the database and pass it to LibraryInteractor

const db = new Database<LibraryDataset>("database-files/db.json");
const sqlDb = new LibraryDB<MockLibraryDataset>();
const libManager = new LibraryInteractor(db);

libManager.showMenu();
