import readline from "node:readline";
import { printQuestion } from "./output.utils";
import chalk from "chalk";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

export const readLine = (question: string): Promise<string> => {
  return new Promise((resolve) =>
    rl.question(chalk.green(question), (input) => {
      resolve(input);
    })
  );
};

export const readChar = (question: string): Promise<string> => {
  printQuestion(question);
  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.setEncoding("utf-8");
    process.stdin.once("data", (buff) => {
      const char = buff.toString("utf-8");
      clearScreen();
      rl.write(null, { ctrl: true, name: "u" });
      resolve(char);
    });
  });
};

export const clearScreen = () => {
  process.stdout.write("\x1Bc");
};
