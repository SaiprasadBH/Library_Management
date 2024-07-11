//TODO
//Note: we can give a robust implementation using data validation library such as zod and then export the parsed object.

interface AppEnv {
  DBURL: string;
}

export const AppEnvs = process.env as unknown as AppEnv;
