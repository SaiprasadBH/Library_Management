import { clearScreen } from "./input.utils";
import { printTitle } from "./output.utils";

export interface IMenuItem {
  key: string;
  label: string;
}

export class Menu {
  private items: IMenuItem[] = [];
  constructor(items: IMenuItem[]) {
    this.items = items;
  }

  serialize(): string {
    return this.items.reduce((str, item) => {
      if (str) {
        str += "\n";
      }
      str += `${item.key}.\t${item.label}`;
      return str;
    }, "");
  }

  getItem(key: string): IMenuItem | null {
    return this.items.find((item) => item.key === key) || null;
  }

  updateFrame() {
    clearScreen();
    printTitle();
    this.serialize();
  }

  show(subTitle: string) {
    this.updateFrame();
  }
}

interface UpdateFrameI {
  subTitle?: string;
}
