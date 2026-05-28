import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || databaseUrl.startsWith("replace-with")) {
    throw new Error("DATABASE_URL must be configured for server database access.");
  }

  return databaseUrl;
}

const queryClient = postgres(getDatabaseUrl(), { prepare: false });

export const db = drizzle(queryClient, { schema });
