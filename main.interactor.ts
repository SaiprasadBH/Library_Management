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
import { MemberInteractor } from "./src/member-management/member.interaction";
import { TransactionInteractor } from "./src/transaction-management/transaction.interaction";
import { AppEnvs } from "./src/core/read-env";
import { MySqlConnectionFactory } from "./src/database/dbConnection";

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

  constructor(private readonly connFactory: MySqlConnectionFactory) {
    this.bookInteractor = new BookInteractor(connFactory);
    this.memberInteractor = new MemberInteractor(connFactory);
    this.transactionInteractor = new TransactionInteractor(connFactory);
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
        this.connFactory.shutdown();
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
const mysqlConnectionFactory = new MySqlConnectionFactory({
  dbURL: AppEnvs.DATABASE_URL,
});

const libManager = new LibraryInteractor(mysqlConnectionFactory);

libManager.showMenu();
