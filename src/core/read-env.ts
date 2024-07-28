import "dotenv/config";
import { configDotenv } from "dotenv";

configDotenv();
interface AppEnv {
  DATABASE_URL: string;
}

// Access and validate environment variables
const getAppEnvs = (): AppEnv => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in the environment variables");
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL,
  };
};

export const AppEnvs = getAppEnvs();
