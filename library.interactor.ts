import { IInteractor } from "./src/core/interactor";
import { clearScreen, readChar, readLine } from "./src/core/input.utils";
import { BookInteractor } from "./src/book-management/book.interactor";
import { printError, printTitle } from "./src/core/output.utils";

const menu = `
    1. Book Management
    2. Member Management
    3. Transaction Management
    4. Exit`;
export class LibraryInteractor implements IInteractor {
  private readonly bookInteractor: BookInteractor = new BookInteractor();
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

const libManager = new LibraryInteractor();

libManager.showMenu();
