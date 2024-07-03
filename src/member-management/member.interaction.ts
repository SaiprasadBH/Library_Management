import { IInteractor } from "../core/interactor";
import { clearScreen, readChar, readLine } from "../core/input.utils";
import { MemberRepository } from "./member.repository";
import { IMember, IMemberBase } from "../models/member.model";
import {
  printChoice,
  printError,
  printHint,
  printResult,
  printSubTitle,
  printTitle,
} from "../core/output.utils";
import { IPageRequest } from "../core/pagination";
import { Menu } from "../core/menu";
import { Database } from "../database/db";

const menu = new Menu([
  { key: "1", label: "Add a Member" },
  { key: "2", label: "Edit a Member" },
  { key: "3", label: "Search for a Member" },
  { key: "4", label: "Delete a Member" },
  { key: "5", label: "<Previous Menu>\n" },
]);
export class MemberInteractor implements IInteractor {
  private repo: MemberRepository;

  constructor(db: Database) {
    this.repo = new MemberRepository(db);
  }

  async showMenu(): Promise<void> {
    let loop = true;
    while (loop) {
      printTitle();
      printSubTitle("Member Management");
      const op = await readChar(menu.serialize());
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
          printError("Invalid Input");
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

async function getMemberInput(
  existingMember?: IMemberBase
): Promise<IMemberBase> {
  const name = await setUserInputOrDefault(
    "Enter name: ",
    existingMember?.name
  );
  const age = await checkInt(
    await setUserInputOrDefault("Enter age: ", existingMember?.age)
  );
  const address = await setUserInputOrDefault(
    "Enter address: ",
    existingMember?.address
  );
  const phoneNumber = await setUserInputOrDefault(
    "Enter phoneNumber: ",
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
  console.log("");
  try {
    const newMember: IMemberBase = await getMemberInput();
    const createdMember: IMember = await repo.create(newMember);
    printResult("Added the Member successfully");
    console.table(createdMember);
  } catch (error: unknown) {
    if (error instanceof Error) console.log(error.message);
  }
  await readLine("Press Enter to continue");
  return;
}

async function editMember(repo: MemberRepository) {
  const memberId = await checkInt(
    await readLine("\nEnter the Id of the Member to edit: ")
  );
  const existingMember = await repo.getById(memberId);
  if (!existingMember) {
    printError("Member not found");
  } else {
    printHint(
      'Press "Enter" if you don\'t want to change the current property.'
    );
    const updatedData = await getMemberInput(existingMember);
    const updatedMember = await repo.update(existingMember.id, updatedData);
    printResult("Member updated successfully");
    console.table(updatedMember);
  }
  await readLine("Press Enter to continue");
  return;
}

async function searchForMember(repo: MemberRepository) {
  const search = await getNonEmptyInput("\nSearch for title or ISBNo.\n");
  printHint('Press "Enter" to set default offset to 0');
  const defaultOffset: string | number = "-";
  const defaultLimit: number = 5;
  const offset = await checkInt(
    await setUserInputOrDefault("Enter offset: ", defaultOffset)
  );
  printHint('Press "Enter" to set default limit to 5');
  const limit = await checkInt(
    await setUserInputOrDefault("Enter limit: ", defaultLimit)
  );
  const pageRequest: IPageRequest = { search, offset, limit };
  const searchResult = await repo.list(pageRequest);
  if (searchResult.items.length === 0) {
    printError("No match found");
  } else {
    searchResult.items.forEach((matchedMember) => {
      console.table(matchedMember);
    });
    printResult(
      `Showing ${limit} results out of ${searchResult.pagination.total}`
    );
  }
  await readLine("Press Enter to continue");
  return;
}

async function deleteMember(repo: MemberRepository) {
  const memberId = await checkInt(
    await readLine("Enter the Id of the Member to delete: ")
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
