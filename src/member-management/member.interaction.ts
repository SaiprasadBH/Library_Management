import { IInteractor } from "../core/interactor";
import { clearScreen, readChar, readLine } from "../core/input.utils";
import { MemberRepository } from "./member.repository";
import {
  enterButton,
  printChoice,
  printError,
  printHint,
  printMenu,
  printPanel,
  printResult,
  printSubTitle,
  printTitle,
} from "../core/output.utils";
import { IPageRequest } from "../core/pagination";
import { Menu } from "../core/menu";
import { Database } from "../database/db";
import { IMember, IMemberBase, MemberSchema } from "../models/member.schema";
import { ZodNumber, z } from "zod";
import { LibraryDataset } from "../database/library.dataset";

const menu = new Menu([
  { key: "1", label: "Add a Member" },
  { key: "2", label: "Edit a Member" },
  { key: "3", label: "Search for a Member" },
  { key: "4", label: "Delete a Member" },
  { key: "5", label: "<Previous Menu>\n" },
]);
export class MemberInteractor implements IInteractor {
  private repo: MemberRepository;

  constructor(db: Database<LibraryDataset>) {
    this.repo = new MemberRepository(db);
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
          await addMember(this.repo);
          break;
        case "2":
          await editMember(this.repo);
          break;
        case "3":
          await searchForMember(this.repo);
          break;
        case "4":
          await deleteMember(this.repo);
          break;
        case "5":
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

const checkInt = async (value: string | number): Promise<number> => {
  if (typeof value === "number") return value;
  const intValue = parseInt(value);
  if (!Number.isNaN(intValue)) return intValue;
  printError(`Invalid Input, only input of type "number" is allowed!!`);
  return checkInt(await readLine("Enter again: "));
};

//////////////////// Depricated
const getNonEmptyInput = async (question: string): Promise<string> => {
  const answer = await readLine(question);
  if (answer.trim() !== "") {
    return answer;
  }
  printError("This field cannot be empty!!");
  return getNonEmptyInput(question);
};

const setUserInputOrDefault = async <_, T>(
  question: string,
  existingData?: T
): Promise<string | NonNullable<T>> => {
  return !existingData
    ? await getNonEmptyInput(question)
    : (await readLine(`${question} (${existingData ?? ""}):`)) || existingData;
};
////////////////////

async function validateInput<T>(
  question: string,
  schema: z.Schema<T>,
  existingValue?: T
): Promise<T> {
  do {
    try {
      let newInput: string;
      if (existingValue) {
        newInput = await readLine(`${question} `, existingValue.toString());
        return schema.parse(
          schema instanceof ZodNumber ? Number(newInput) : newInput
        );
      }
      newInput = await readLine(question);
      return schema.parse(
        schema instanceof ZodNumber ? Number(newInput) : newInput
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        printError(`Invalid input: ${error.errors[0].message}`);
      }
    }
  } while (true);
}

async function getMemberInput(
  existingMember?: IMemberBase
): Promise<IMemberBase> {
  const name = await validateInput<string>(
    "Enter name: ",
    MemberSchema.shape.name,
    existingMember?.name
  );
  const age = await validateInput<number>(
    "Enter age: ",
    MemberSchema.shape.age,
    existingMember?.age
  );
  const address = await validateInput<string>(
    "Enter address: ",
    MemberSchema.shape.address,
    existingMember?.address
  );
  const phoneNumber = await validateInput<string>(
    "Enter phoneNumber: ",
    MemberSchema.shape.phoneNumber,
    existingMember?.phoneNumber
  );

  return {
    name: name,
    age: age,
    address: address,
    phoneNumber: phoneNumber,
  };
}
async function addMember(repo: MemberRepository) {
  try {
    const newMember: IMemberBase = await getMemberInput();
    const createdMember: IMember = await repo.create(newMember);
    if (createdMember) {
      printResult("Added the Member successfully");
      displayPage(createdMember);
    }
  } catch (error: unknown) {
    if (error instanceof Error) console.log(error.message);
  }
  printHint(`Press ${enterButton} to continue`);
  await readLine("");
  return;
}

async function editMember(repo: MemberRepository) {
  const memberId = await validateInput<number>(
    "Enter the Id of the Member to edit: ",
    MemberSchema.shape.id
  );
  const existingMember = await repo.getById(memberId);
  if (!existingMember) {
    printError("Member not found");
  } else {
    printHint(
      `Press ${enterButton} if you don't want to change the current property.\n`
    );
    const updatedData = await getMemberInput(existingMember);
    const updatedMember = await repo.update(existingMember.id, updatedData);
    printResult("Member updated successfully");
    displayPage(updatedMember);
  }
  printHint(`Press ${enterButton} to continue`);
  await readLine("");
  return;
}

const displayPage = (items: IMember | IMember[]) => {
  console.table(items);
};

function updatePage(key: string, page: IPageRequest, items: IMember[]) {
  const total = items.length;
  let limit = page.limit;

  if (key === "\u001b[C") {
    if (page.offset + limit < total) {
      page.offset = page.offset + limit;
    }
  } else if (key === "\u001b[D") {
    if (page.offset - limit >= 0) {
      page.offset = page.offset - limit;
    }
  }
  const updatedPageIndex = Math.floor(page.offset / page.limit) + 1;
  const updatedPage = items.slice(page.offset, limit + page.offset);
  return { updatedPage, updatedPageIndex };
}

const loadPage = async (
  initialPage: IMember[],
  pageRequest: IPageRequest,
  searchResultItems: IMember[],
  searchText?: string
) => {
  let loadedPage = initialPage;
  let pageIndex = 1;
  const totalPages = Math.ceil(searchResultItems.length / pageRequest.limit);
  while (true) {
    clearScreen();
    printResult(
      searchText
        ? `Search result for "${searchText}"`
        : "All current members of the Library"
    );
    displayPage(loadedPage);

    const navPanel = `${pageIndex === 1 ? "" : "<"} ${pageIndex}/${totalPages} ${pageIndex === totalPages ? "" : ">"}`;
    printPanel(`${navPanel}`);

    printHint(`Press ${enterButton} to continue`);
    const key = await readChar();
    if (key === "\u001b[C" || key === "\u001b[D") {
      const { updatedPage, updatedPageIndex } = updatePage(
        key,
        pageRequest,
        searchResultItems
      );
      loadedPage = updatedPage;
      pageIndex = updatedPageIndex;
    } else if (key === "\r") break;
  }
};

async function searchForMember(repo: MemberRepository) {
  printHint(
    `Press ${enterButton} on empty search field to show all the members. Default limit will be set to 5.`
  );
  const searchText = await readLine("Search for Name or Phone No.: ");
  const offset = 0;
  const defaultLimit: number = 5;
  printHint(`Press ${enterButton} to set default limit to 5`);
  const limit = await checkInt(
    await readLine("Enter limit: ", defaultLimit.toString())
  );
  const pageRequest: IPageRequest = { offset, limit };

  const searchResultItems = await repo.list(searchText);
  if (searchResultItems.length === 0) {
    printError("No match found");
  } else {
    const currPage = searchResultItems.slice(offset, limit);
    await loadPage(currPage, pageRequest, searchResultItems, searchText);
  }

  return;
}

async function deleteMember(repo: MemberRepository) {
  const memberId = await validateInput<number>(
    "\nEnter the Id of the Member to delete: ",
    MemberSchema.shape.id
  );

  const deletedMember = await repo.delete(memberId);
  if (!deletedMember) printError("Member not found");
  else {
    printResult(
      `The Member ${deletedMember.name} with Id ${memberId} deleted successfully`
    );
    console.table(deleteMember);
  }
  await readLine("Press Enter to continue");
  return;
}
