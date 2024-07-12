//TODO
//Note: we can give a robust implementation using data validation library such as zod and then export the parsed object.

interface AppEnv {
  DATABASE_URL: string;
}

export const AppEnvs = process.env as unknown as AppEnv;
