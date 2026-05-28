import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { COMPANY_BRANDING_SINGLETON_KEY } from "@/lib/company-branding/constants";

export const companyBranding = pgTable(
  "company_branding",
  {
    singletonKey: varchar("singleton_key", { length: 32 })
      .default(COMPANY_BRANDING_SINGLETON_KEY)
      .primaryKey(),
    displayName: varchar("display_name", { length: 160 }).notNull(),
    logoUrl: varchar("logo_url", { length: 2048 }),
    primaryBrandColor: varchar("primary_brand_color", { length: 7 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 40 }),
    contactEmail: varchar("contact_email", { length: 320 }),
    contactWebsite: varchar("contact_website", { length: 2048 }),
    contactAddress: varchar("contact_address", { length: 1000 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "company_branding_singleton_key",
      sql`${table.singletonKey} = 'company_branding'`,
    ),
    check(
      "company_branding_primary_color_hex",
      sql`${table.primaryBrandColor} ~ '^#[0-9A-Fa-f]{6}$'`,
    ),
  ],
).enableRLS();

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("clients_name_not_blank", sql`length(btrim(${table.name})) > 0`),
  ],
).enableRLS();

export const buildings = pgTable(
  "buildings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 160 }).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("buildings_client_id_idx").on(table.clientId),
    check("buildings_name_not_blank", sql`length(btrim(${table.name})) > 0`),
  ],
).enableRLS();

export const areaTypes = pgTable(
  "area_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("area_types_name_not_blank", sql`length(btrim(${table.name})) > 0`),
  ],
).enableRLS();

export const areas = pgTable(
  "areas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    buildingId: uuid("building_id")
      .notNull()
      .references(() => buildings.id, { onDelete: "restrict" }),
    areaTypeId: uuid("area_type_id")
      .notNull()
      .references(() => areaTypes.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 160 }).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("areas_building_id_idx").on(table.buildingId),
    index("areas_area_type_id_idx").on(table.areaTypeId),
    check("areas_name_not_blank", sql`length(btrim(${table.name})) > 0`),
  ],
).enableRLS();

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
