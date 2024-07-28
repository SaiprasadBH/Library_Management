import chalk from "chalk";

export function printTitle() {
  return chalk.bgGreenBright.bold(" Library Management ");
}

export function printSubTitle(subTitle: string) {
  return chalk.bgCyan.bold(` ${subTitle} `);
}

export function printChoice(choice: string) {
  return chalk.bgBlueBright.bold(` ${choice} `);
}

export function printExit(str: string) {
  return chalk.bgRed.bold(` ${str} `);
}

export function printMenu() {
  console.log(chalk.bgGreen.bold("\n        Menu        \n"));
}

export function printQuestion(question: string) {
  console.log(chalk.green(question));
}

export function printError(msg: string) {
  console.error(`\n${chalk.red.bold(msg)}`);
}

export function printHint(msg: string) {
  console.log(`\n${chalk.grey(msg)}`);
}

export function printResult(msg: string) {
  console.log(`\n${chalk.bgGreen.bold(` ${msg} `)}`);
}

export function printPanel(panelTemplate: string) {
  const panelItems = panelTemplate.trim().split(" ");
  const formatedPanelItems = panelItems.map((item) =>
    chalk.bgGreen.bold(` ${item} `)
  );
  console.log(...formatedPanelItems);
}

export const printButton = chalk.bgGreen.bold(" Enter ");
