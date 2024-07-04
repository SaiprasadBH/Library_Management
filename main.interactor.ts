import { IInteractor } from "./src/core/interactor";
import { clearScreen, readChar, readLine } from "./src/core/input.utils";
import { BookInteractor } from "./src/book-management/book.interactor";
import { printError, printTitle } from "./src/core/output.utils";
import { Menu } from "./src/core/menu";
import { Database } from "./src/database/db";
import { MemberInteractor } from "./src/member-management/member.interaction";

const menu = new Menu([
  { key: "1", label: "Book Management" },
  { key: "2", label: "Member Management" },
  { key: "3", label: "Transaction Management" },
  { key: "4", label: "Exit" },
]);

export class LibraryInteractor implements IInteractor {
  private readonly bookInteractor: BookInteractor;
  private readonly memberInteractor: MemberInteractor;

  constructor(db: Database) {
    this.bookInteractor = new BookInteractor(db);
    this.memberInteractor = new MemberInteractor(db);
  }

  async showMenu(): Promise<void> {
    clearScreen();
    printTitle();
    const op = await readChar(menu.serialize());
    switch (op.toLowerCase()) {
      case "1":
        await this.bookInteractor.showMenu();
        break;
      case "2":
        await this.memberInteractor.showMenu();
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
const db = new Database("databse-files/db.json");
const libManager = new LibraryInteractor(db);

libManager.showMenu();
