import { IInteractor } from "./src/core/interactor";
import { clearScreen, readChar, readLine } from "./src/core/input.utils";
import { BookInteractor } from "./src/book-management/book.interactor";
import { printError, printTitle } from "./src/core/output.utils";
import { Database } from "./src/database/db";

const menu = `
    1. Book Management
    2. Member Management
    3. Transaction Management
    4. Exit`;

export class LibraryInteractor implements IInteractor {
  private readonly bookInteractor: BookInteractor;

  constructor(db: Database) {
    this.bookInteractor = new BookInteractor(db);
  }

  async showMenu(): Promise<void> {
    clearScreen();
    printTitle();
    const op = await readChar(menu);
    switch (op.toLowerCase()) {
      case "1":
        await this.bookInteractor.showMenu();
        break;
      case "4":
        process.exit(0);
      default:
        printError("Invalid Input");
    }
    this.showMenu();
  }
}

// Initialize the database and pass it to LibraryInteractor
const db = new Database("databse-files/json");
const libManager = new LibraryInteractor(db);

libManager.showMenu();
