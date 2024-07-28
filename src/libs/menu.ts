import { clearScreen, readChar } from "./input.utils";
import {
  printChoice,
  printExit,
  printMenu,
  printQuestion,
  printSubTitle,
  printTitle,
} from "./output.utils";

export interface IMenuItem {
  key: string;
  label: string;
}

type LibraryPath =
  | "Book Management"
  | "Member Management"
  | "Transaction Management";

export class Menu {
  private path: LibraryPath | null = null;
  private items: IMenuItem[] = [];
  selectedItem: string | undefined = "";
  constructor(items: IMenuItem[], path?: LibraryPath) {
    this.items = items;
    if (path) this.path = path;
  }

  serialize(selectedIndex: number = 0): string {
    printMenu();
    return this.items.reduce((str, item, index) => {
      if (str) {
        str += "\n";
      }
      if (index === selectedIndex) {
        if (item.label === "Exit" || item.label === "Back") {
          str += `${printExit("<")} ${printExit(item.label)}\n`;
        } else if (this.path)
          str += `${printChoice(">")} ${printChoice(item.label)}\n`;
        else str += `${printSubTitle(">")} ${printSubTitle(item.label)}\n`;
      } else str += `    ${item.label}\n`;
      return str;
    }, "");
  }

  async selectMenuItem() {
    const totalItems = this.items.length;
    let currItem = 1;
    while (true) {
      this.updateFrame();
      printQuestion(this.serialize(currItem - 1));
      const key = await readChar();
      if (key === "\u001b") {
        return totalItems.toString();
      }
      if (parseInt(key) <= totalItems) {
        currItem = parseInt(key);
      } else if (key === "\u001b[A" || key === "\u001b[B") {
        if (currItem === 1 && key === "\u001b[A") currItem = totalItems;
        else if (currItem === totalItems && key === "\u001b[B") currItem = 1;
        else {
          if (key === "\u001b[A") {
            currItem -= 1;
          } else currItem += 1;
        }
      } else if (key === "\r") {
        const currItemStr = currItem.toString();
        this.selectedItem = this.getItem(currItemStr)?.label;
        if (this.path) this.updateFrame(this.selectedItem);
        return currItemStr;
      }
    }
  }

  getItem(key: string): IMenuItem | null {
    return this.items.find((item) => item.key === key) || null;
  }

  updateFrame(choice?: string) {
    let updatedPath = `${printTitle()}`;
    if (this.path) updatedPath += ` > ${printSubTitle(this.path)}`;
    if (choice) updatedPath += ` > ${printChoice(choice)}`;
    clearScreen();
    console.log(updatedPath);
  }
}
