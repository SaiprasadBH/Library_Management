import { IInteractor } from "../core/interactor";
import { clearScreen, readLine } from "../libs/input.utils";
import { MemberRepository } from "./member.repository";
import {
  printButton,
  printError,
  printHint,
  printResult,
} from "../libs/output.utils";
import { IPagedResponse, IPageRequest } from "../core/pagination";
import { Menu } from "../libs/menu";
import { IMember, IMemberBase, MemberSchema } from "../models/member.schema";
import { ZodNumber, z } from "zod";
import { MySQLConnectionFactory } from "../database/oldDbHandlingUtilities/connectionFactory";
import { LibraryDataset } from "../database/library.dataset";
import { displayPage, loadPage } from "../libs/pagination.utils";

const menu = new Menu(
  [
    { key: "1", label: "Add a Member" },
    { key: "2", label: "Edit a Member" },
    { key: "3", label: "Search for a Member" },
    { key: "4", label: "Delete a Member" },
    { key: "5", label: "Back" },
  ],
  "Member Management"
);
export class MemberInteractor implements IInteractor {
  private repo: MemberRepository;

  constructor(private readonly dbConnFactory: MySQLConnectionFactory) {
    this.repo = new MemberRepository(this.dbConnFactory);
  }

  async showMenu(): Promise<void> {
    let loop = true;
    while (loop) {
      const op = await menu.selectMenuItem();
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
          printHint(`Press ${printButton} to continue`);
          await readLine("");
          break;
      }
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
      } else newInput = await readLine(question);

      menu.updateFrame(menu.selectedItem);
      return schema.parse(
        schema instanceof ZodNumber ? Number(newInput) : newInput
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        menu.updateFrame(menu.selectedItem);
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
    const createdMember = await repo.create(newMember);
    if (createdMember) {
      printResult("Added the Member successfully");
      displayPage(createdMember);
    }
  } catch (error: unknown) {
    if (error instanceof Error) printError(error.message);
  }
  printHint(`Press ${printButton} to continue`);
  await readLine("");
  return;
}

async function editMember(repo: MemberRepository) {
  try {
    const memberId = await validateInput<number>(
      "Enter the Id of the Member to edit: ",
      MemberSchema.shape.id
    );
    const existingMember = await repo.getById(memberId);
    if (existingMember) {
      printHint(
        `Press ${printButton} if you don't want to change the current property.\n`
      );
      const updatedData = await getMemberInput(existingMember);
      const updatedMember = await repo.update(existingMember.id, updatedData);
      if (updatedMember) {
        printResult("Member updated successfully");
        displayPage(updatedMember);
      }
    }
  } catch (err) {
    if (err instanceof Error) printError(err.message);
  } finally {
    printHint(`Press ${printButton} to continue`);
    await readLine("");
  }
  return;
}

async function searchForMember(repo: MemberRepository) {
  printHint(
    `Press ${printButton} on empty search field to show all the members. Default limit will be set to 5.`
  );
  const searchText = await readLine("Search for Name or Phone No.: ");
  const offset = 0;
  const defaultLimit: number = 5;
  printHint(`Press ${printButton} to set default limit to 5`);
  const limit = await checkInt(
    await readLine("Enter limit: ", defaultLimit.toString())
  );
  const pageRequest: IPageRequest = { offset, limit };

  await loadPage(repo, pageRequest);
  return;
}

async function deleteMember(repo: MemberRepository) {
  const memberId = await validateInput<number>(
    "\nEnter the Id of the Member to delete: ",
    MemberSchema.shape.id
  );

  try {
    const deletedMember = await repo.delete(memberId);
    if (deletedMember) {
      printResult(
        `The Member ${deletedMember.name} with Id ${memberId} deleted successfully`
      );
      console.table(deleteMember);
    }
  } catch (err) {
    if (err instanceof Error) printError(err.message);
  } finally {
    printHint(`Press ${printButton} to continue`);
    await readLine("");
  }
  return;
}
