// TODO: A LibraryDB class that will use mysql adapter and
// provide a high level, select/insert/delete/update queries in this file.

import { AppEnvs } from "../core/read-env";
import { MySQLAdapter } from "./dbAdapter";
import { MockLibraryDataset } from "./mockLibrary.dataset";
import { ColumnSet } from "./dbTypes";
import { MySqlQueryGenerator } from "../libs/mysql-query-generator";

export class LibraryDB<Dataset extends MockLibraryDataset> {
  constructor(
    private readonly adapter: MySQLAdapter = new MySQLAdapter({
      dbURL: AppEnvs.DBURL,
    })
  ) {}

  async shutdownPoolConnection() {
    return this.adapter.shutdown();
  }

  // TODO: after implementing parameterized query in mysql-query-generator, implement the following...

  QueryForAdd<Dataset>(tableName: string, dataToAdd: ColumnSet<keyof Dataset>) {
    const query = MySqlQueryGenerator.generateInsertSql(tableName, dataToAdd);
  }

  QueryForUpdate<Dataset>(
    tableName: string,
    dataToUpdate: ColumnSet<keyof Dataset>
  ) {}

  QueryForSearch<Dataset>(tableName: string) {}

  QueryForDelete<Dataset>(
    tableName: string,
    dataToDelete: ColumnSet<keyof Dataset>
  ) {}
}
