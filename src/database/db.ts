import * as fs from "fs";
import * as path from "path";

export type ColumnData = string | number | boolean | null;
export type Row = Record<string, ColumnData | ColumnData[]>;
export type Dataset = Record<string, Row[]>;

export interface DatabaseStorageAdapter {
  parse: (content: string) => Dataset;
  serialize: (dataset: Dataset) => string;
}

export const JsonAdapter: DatabaseStorageAdapter = {
  parse(content: string) {
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error(
        "Given filePath is not empty and its content is not valid JSON."
      );
      throw e;
    }
  },
  serialize(dataset: Dataset) {
    return JSON.stringify(dataset);
  },
};

export class Database {
  private dataStore: Dataset = {};

  constructor(
    private readonly filePath: string,
    private readonly adapter: DatabaseStorageAdapter = JsonAdapter
  ) {
    if (!filePath) {
      throw new Error("Missing file path argument.");
    }

    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });

    let stats;
    try {
      stats = fs.statSync(filePath);
    } catch (err: any) {
      if (err.code === "ENOENT") {
        return;
      } else if (err.code === "EACCES") {
        throw new Error(`Cannot access path "${filePath}".`);
      } else {
        throw new Error(
          `Error while checking for existence of path "${filePath}": ${err}`
        );
      }
    }

    try {
      fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err: any) {
      throw new Error(
        `Cannot read & write on path "${filePath}". Check permissions!`
      );
    }
    if (stats.size > 0) {
      let data: string;
      try {
        data = fs.readFileSync(filePath, { encoding: "utf-8" });
      } catch (err) {
        throw err;
      }
      this.dataStore = this.adapter.parse(data);
    }
  }

  table<T>(tableName: string): T[] {
    if (typeof this.dataStore[tableName] === "undefined") {
      this.dataStore[tableName] = [];
    }
    return this.dataStore[tableName] as T[];
  }
  async save() {
    try {
      await fs.promises.writeFile(
        this.filePath,
        this.adapter.serialize(this.dataStore)
      );
    } catch (e) {
      console.error("Failed to save data to the given filePath.");
      throw e;
    }
  }
}
