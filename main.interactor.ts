import { IInteractor } from "./src/core/interactor";
import { clearScreen, readChar, readLine } from "./src/libs/input.utils";
import { BookInteractor } from "./src/book-management/book.interactor";
import {
  printButton,
  printError,
  printHint,
  printPanel,
} from "./src/libs/output.utils";
import { Menu } from "./src/libs/menu";
import { MySQLConnectionFactory } from "./src/database/oldDbHandlingUtilities/connectionFactory";
import { AppEnvs } from "./src/core/read-env";
import { MemberInteractor } from "./src/member-management/member.interaction";
import { TransactionInteractor } from "./src/transaction-management/transaction.interaction";
import { DrizzleAdapter } from "./drizzle-mysql2-orm/drizzleMysqlAdapter";

const menu = new Menu([
  { key: "1", label: "Book Management" },
  { key: "2", label: "Member Management" },
  { key: "3", label: "Transaction Management" },
  { key: "4", label: "Exit" },
]);

export class LibraryInteractor implements IInteractor {
  private readonly bookInteractor: BookInteractor;
  // private readonly memberInteractor: MemberInteractor;
  //private readonly transactionInteractor: TransactionInteractor;

  constructor(private readonly connFactory: DrizzleAdapter) {
    this.bookInteractor = new BookInteractor(connFactory);
    // this.memberInteractor = new MemberInteractor(connFactory);
    //this.transactionInteractor = new TransactionInteractor(connFactory);
  }

  async showMenu(): Promise<void> {
    const op = await menu.selectMenuItem();
    switch (op.toLowerCase()) {
      case "1":
        await this.bookInteractor.showMenu();
        break;
      case "2":
        clearScreen();
        //await this.memberInteractor.showMenu();
        break;
      case "3":
        clearScreen();
        //  await this.transactionInteractor.showMenu();
        break;
      case "4":
        // await this.connFactory.endConnection();
        menu.updateFrame();
        console.log("\n");
        printPanel("! ! ! Bye ! ! !");
        console.log("\n");
        process.exit(0);
      default:
        printError("Invalid choice");
        printHint(`Press ${printButton} to continue`);
        await readLine("");
        break;
    }
    this.showMenu();
  }
}

// Initialize the database and pass it to LibraryInteractor
const connFactory = new DrizzleAdapter(AppEnvs.DATABASE_URL);
const libManager = new LibraryInteractor(connFactory);

libManager.showMenu();
