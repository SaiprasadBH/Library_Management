import readline from "node:readline";
import { printQuestion } from "./output.utils";
import { emitKeypressEvents } from "node:readline";
import chalk from "chalk";
import { sys } from "typescript";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const readLine = (
  question: string,
  defaultInput?: string
): Promise<string> => {
  // console.log(chalk.green(question));
  return new Promise((resolve) => {
    if (defaultInput) populateInputBuffer(defaultInput);
    // let g: string;
    // if (defaultInput) g = prompt(question, defaultInput)!;
    // else g = prompt(question)!;
    // resolve(g);
    rl.question(chalk.green(question), (input) => {
      resolve(input);
    });
  });
};

export const readChar = (question?: string): Promise<string> => {
  if (question) printQuestion(question);
  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.setEncoding("utf-8");
    process.stdin.once("data", (buff) => {
      const char = buff.toString("utf-8");
      clearInputBuffer();
      resolve(char);
    });
  });
};

export const clearScreen = () => process.stdout.write("\x1Bc");

export const clearInputBuffer = () => rl.write(null, { ctrl: true, name: "u" });

export const populateInputBuffer = (defaultInput: string) => {
  rl.write(`${defaultInput}`);
  readline.moveCursor(process.stdout, defaultInput.length, 0);
  // process.stdin.write("\u001b[0;116");
  // console.log("hi");
  // rl.write(null, { ctrl: true, name: "e" });

  // process.stdin.write(rl.getCursorPos());

  // while(defaultInput.length>0){
  //   rl
  // }

  // readline.cursorTo(process.stdin, defaultInput.length);
  // process.stdin.unshift(defaultInput);
  // rl.write(defaultInput);
  // readline.cursorTo(process.stdin, defaultInput.length + 1);
};
