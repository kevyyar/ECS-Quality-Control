import { sql } from "drizzle-orm";
import { boolean, check, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const internalUsers = pgTable(
  "internal_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authUserId: uuid("auth_user_id").notNull().unique(),
    email: varchar("email", { length: 320 }).notNull(),
    manager: boolean("manager").notNull().default(false),
    supervisor: boolean("supervisor").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "internal_users_requires_capability",
      sql`${table.manager} OR ${table.supervisor}`,
    ),
  ],
).enableRLS();
