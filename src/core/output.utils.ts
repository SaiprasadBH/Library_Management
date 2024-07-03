import chalk from "chalk";

export function printTitle() {
  console.log(chalk.bgGreenBright("\n---Library Management"));
}

export function printSubTitle(subTitle: string) {
  console.log(chalk.bgCyan(`\n--${subTitle}`));
}

export function printChoice(choice: string) {
  console.log(chalk.bgBlueBright(`\n-${choice}`));
}

export function printQuestion(question: string) {
  console.log(chalk.green(question));
}

export function printError(msg: string) {
  console.error(`\n${chalk.red.bold(msg)}\n`);
}

export function printHint(msg: string) {
  console.log(`\n${chalk.grey(msg)}\n`);
}

export function printResult(msg: string) {
  console.log(`\n${chalk.bgGreen(msg)}`);
}

// printQuestion("gsdgngfn");
// printError("sfsdngnz");
// printQuestion("gsdgngfn");
// printHint("asfbfbb");
// printQuestion("gsdgngfn");
