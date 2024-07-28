import {
  PreparedStatement,
  QueryTypes,
} from "../../database/oldDbHandlingUtilities/dbTypes";
import { LibraryDataset } from "../../database/library.dataset";
import { MySqlQueryGenerator } from "./mysql-query-generator";
import { QueryConfig } from "../../database/oldDbHandlingUtilities/query-config.type";

export function getMysqlQuery<
  QueryType extends QueryTypes,
  ModelName extends keyof LibraryDataset,
  Model extends LibraryDataset[ModelName],
>(
  queryType: QueryType,
  tableName: ModelName,
  queryConfig?: QueryConfig<Model, QueryType>
): PreparedStatement<Model> | undefined {
  if (queryConfig) {
    switch (queryType) {
      case "insert": {
        const insertConfig = queryConfig as QueryConfig<Model, "insert">;
        if (insertConfig.row)
          return MySqlQueryGenerator.generateInsertSql<
            keyof LibraryDataset,
            Model
          >(tableName, insertConfig.row);
        break;
      }
      case "update": {
        const updateConfig = queryConfig as QueryConfig<Model, "update">;
        if (updateConfig.row && updateConfig.where)
          return MySqlQueryGenerator.generateUpdateSql<
            keyof LibraryDataset,
            Model
          >(tableName, updateConfig.row, updateConfig.where);
        break;
      }
      case "select": {
        const selectConfig = queryConfig as QueryConfig<Model, "select">;
        return MySqlQueryGenerator.generateSelectSql<
          keyof LibraryDataset,
          Model
        >(tableName, selectConfig);
      }
      case "delete": {
        const deleteConfig = queryConfig as QueryConfig<Model, "delete">;
        if (deleteConfig.where)
          return MySqlQueryGenerator.generateDeleteSql<
            keyof LibraryDataset,
            Model
          >(tableName, deleteConfig.where);
        break;
      }
      case "count": {
        const countConfig = queryConfig as QueryConfig<Model, "count">;
        if (countConfig.where)
          return MySqlQueryGenerator.generateCountSql<
            keyof LibraryDataset,
            Model
          >(tableName, countConfig.where);
        else
          return MySqlQueryGenerator.generateCountSql<
            keyof LibraryDataset,
            Model
          >(tableName);
      }
      default:
        throw new Error("Invalid QueryType");
    }
    throw new Error("Invalid QueryConfig");
  } else {
    if (!["select", "update", "insert", "delete", "count"].includes(queryType))
      throw new Error("Invalid QueryType");
    return MySqlQueryGenerator.generateSelectSql<keyof LibraryDataset, Model>(
      tableName
    );
  }
}
