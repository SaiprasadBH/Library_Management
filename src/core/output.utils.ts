import chalk from "chalk";

export function printTitle() {
  console.log(chalk.bgGreenBright.bold(" Library Management "));
}

export function printSubTitle(subTitle: string) {
  console.log(chalk.bgCyan.bold(`\n ${subTitle} `));
}

export function printChoice(choice: string) {
  console.log(chalk.bgBlueBright.bold(`\n ${choice} \n`));
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

export const rArrowButton = chalk.bgGreen(" > ");
export const lArrowButton = chalk.bgGreen(" < ");
export const enterButton = chalk.bgGreen.bold(" Enter ");
