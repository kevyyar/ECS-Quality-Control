import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
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

export const inspectionTemplates = pgTable(
  "inspection_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    description: varchar("description", { length: 1000 }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "inspection_templates_name_not_blank",
      sql`length(btrim(${table.name})) > 0`,
    ),
  ],
).enableRLS();

export const inspectionTemplateSections = pgTable(
  "inspection_template_sections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => inspectionTemplates.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inspection_template_sections_template_id_idx").on(table.templateId),
    check(
      "inspection_template_sections_name_not_blank",
      sql`length(btrim(${table.name})) > 0`,
    ),
    check("inspection_template_sections_position_positive", sql`${table.position} > 0`),
  ],
).enableRLS();

export const inspectionTemplateItems = pgTable(
  "inspection_template_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => inspectionTemplates.id, { onDelete: "restrict" }),
    sectionId: uuid("section_id").references(() => inspectionTemplateSections.id, {
      onDelete: "restrict",
    }),
    position: integer("position").notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    description: varchar("description", { length: 1000 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inspection_template_items_template_id_idx").on(table.templateId),
    index("inspection_template_items_section_id_idx").on(table.sectionId),
    check(
      "inspection_template_items_name_not_blank",
      sql`length(btrim(${table.name})) > 0`,
    ),
    check("inspection_template_items_position_positive", sql`${table.position} > 0`),
  ],
).enableRLS();

export const buildingInspectionPlans = pgTable(
  "building_inspection_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    buildingId: uuid("building_id")
      .notNull()
      .references(() => buildings.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("building_inspection_plans_building_id_unique").on(table.buildingId),
  ],
).enableRLS();

// Plan entry rows are replaceable setup configuration: saves delete and reinsert
// entries, so ids are not stable. Future Draft/Submitted Inspection rows must
// snapshot names and template content — never FK to building_inspection_plan_entries.id.
export const buildingInspectionPlanEntries = pgTable(
  "building_inspection_plan_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => buildingInspectionPlans.id, { onDelete: "restrict" }),
    areaId: uuid("area_id")
      .notNull()
      .references(() => areas.id, { onDelete: "restrict" }),
    inspectionTemplateId: uuid("inspection_template_id")
      .notNull()
      .references(() => inspectionTemplates.id, { onDelete: "restrict" }),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("building_inspection_plan_entries_plan_id_idx").on(table.planId),
    index("building_inspection_plan_entries_area_id_idx").on(table.areaId),
    index("building_inspection_plan_entries_template_id_idx").on(
      table.inspectionTemplateId,
    ),
    uniqueIndex("building_inspection_plan_entries_plan_area_unique").on(
      table.planId,
      table.areaId,
    ),
    uniqueIndex("building_inspection_plan_entries_plan_position_unique").on(
      table.planId,
      table.position,
    ),
    check("building_inspection_plan_entries_position_positive", sql`${table.position} > 0`),
  ],
).enableRLS();

export const inspections = pgTable(
  "inspections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    status: varchar("status", { length: 24 }).notNull().default("draft"),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    buildingId: uuid("building_id")
      .notNull()
      .references(() => buildings.id, { onDelete: "restrict" }),
    clientNameSnapshot: varchar("client_name_snapshot", { length: 160 }).notNull(),
    buildingNameSnapshot: varchar("building_name_snapshot", { length: 160 }).notNull(),
    startedByAuthUserId: uuid("started_by_auth_user_id").notNull(),
    startedByEmail: varchar("started_by_email", { length: 320 }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    submittedByAuthUserId: uuid("submitted_by_auth_user_id"),
    submittedByEmail: varchar("submitted_by_email", { length: 320 }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inspections_status_idx").on(table.status),
    index("inspections_building_id_idx").on(table.buildingId),
    index("inspections_started_at_idx").on(table.startedAt),
    uniqueIndex("inspections_one_active_draft_per_building")
      .on(table.buildingId)
      .where(sql`${table.status} = 'draft'`),
    check("inspections_status_valid", sql`${table.status} in ('draft', 'submitted')`),
    check(
      "inspections_submission_metadata_matches_status",
      sql`(
        ${table.status} = 'draft'
        and ${table.submittedByAuthUserId} is null
        and ${table.submittedByEmail} is null
        and ${table.submittedAt} is null
      ) or (
        ${table.status} = 'submitted'
        and ${table.submittedByAuthUserId} is not null
        and ${table.submittedByEmail} is not null
        and ${table.submittedAt} is not null
      )`,
    ),
  ],
).enableRLS();

export const inspectionAreaInspections = pgTable(
  "inspection_area_inspections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    inspectionId: uuid("inspection_id")
      .notNull()
      .references(() => inspections.id, { onDelete: "cascade" }),
    source: varchar("source", { length: 24 }).notNull().default("planned"),
    position: integer("position").notNull(),
    areaId: uuid("area_id")
      .notNull()
      .references(() => areas.id, { onDelete: "restrict" }),
    areaTypeId: uuid("area_type_id")
      .notNull()
      .references(() => areaTypes.id, { onDelete: "restrict" }),
    inspectionTemplateId: uuid("inspection_template_id")
      .notNull()
      .references(() => inspectionTemplates.id, { onDelete: "restrict" }),
    areaNameSnapshot: varchar("area_name_snapshot", { length: 160 }).notNull(),
    areaTypeNameSnapshot: varchar("area_type_name_snapshot", { length: 160 }).notNull(),
    inspectionTemplateNameSnapshot: varchar("inspection_template_name_snapshot", {
      length: 160,
    }).notNull(),
    inspectionTemplateDescriptionSnapshot: varchar(
      "inspection_template_description_snapshot",
      { length: 1000 },
    ),
    isSkipped: boolean("is_skipped").notNull().default(false),
    skipReason: varchar("skip_reason", { length: 1000 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inspection_area_inspections_inspection_id_idx").on(table.inspectionId),
    uniqueIndex("inspection_area_inspections_inspection_position_unique").on(
      table.inspectionId,
      table.position,
    ),
    check("inspection_area_inspections_source_valid", sql`${table.source} in ('planned', 'one_off')`),
    check("inspection_area_inspections_position_positive", sql`${table.position} > 0`),
    check(
      "inspection_area_inspections_skip_state_valid",
      sql`(
        ${table.isSkipped} = false and ${table.skipReason} is null
      ) or (
        ${table.isSkipped} = true
        and ${table.source} = 'planned'
        and ${table.skipReason} is not null
        and length(btrim(${table.skipReason})) > 0
      )`,
    ),
  ],
).enableRLS();

export const inspectionItems = pgTable(
  "inspection_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    areaInspectionId: uuid("area_inspection_id")
      .notNull()
      .references(() => inspectionAreaInspections.id, { onDelete: "cascade" }),
    sourceTemplateItemId: uuid("source_template_item_id"),
    sourceTemplateSectionId: uuid("source_template_section_id"),
    position: integer("position").notNull(),
    sectionNameSnapshot: varchar("section_name_snapshot", { length: 160 }),
    itemNameSnapshot: varchar("item_name_snapshot", { length: 160 }).notNull(),
    itemDescriptionSnapshot: varchar("item_description_snapshot", { length: 1000 }),
    resultStatus: varchar("result_status", { length: 24 }),
    resultNote: varchar("result_note", { length: 1000 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inspection_items_area_inspection_id_idx").on(table.areaInspectionId),
    uniqueIndex("inspection_items_area_inspection_position_unique").on(
      table.areaInspectionId,
      table.position,
    ),
    check("inspection_items_position_positive", sql`${table.position} > 0`),
    check(
      "inspection_items_result_status_valid",
      sql`${table.resultStatus} is null or ${table.resultStatus} in ('pass', 'fail', 'not_applicable')`,
    ),
    check(
      "inspection_items_result_note_not_blank",
      sql`${table.resultNote} is null or length(btrim(${table.resultNote})) > 0`,
    ),
  ],
).enableRLS();

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketNumber: integer("ticket_number").generatedByDefaultAsIdentity(),
    status: varchar("status", { length: 24 }).notNull().default("open"),
    title: varchar("title", { length: 340 }).notNull(),
    inspectionId: uuid("inspection_id")
      .notNull()
      .references(() => inspections.id, { onDelete: "restrict" }),
    areaInspectionId: uuid("area_inspection_id")
      .notNull()
      .references(() => inspectionAreaInspections.id, { onDelete: "restrict" }),
    inspectionItemId: uuid("inspection_item_id")
      .notNull()
      .references(() => inspectionItems.id, { onDelete: "restrict" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    buildingId: uuid("building_id")
      .notNull()
      .references(() => buildings.id, { onDelete: "restrict" }),
    areaId: uuid("area_id")
      .notNull()
      .references(() => areas.id, { onDelete: "restrict" }),
    createdByAuthUserId: uuid("created_by_auth_user_id").notNull(),
    createdByEmail: varchar("created_by_email", { length: 320 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("tickets_status_idx").on(table.status),
    index("tickets_inspection_id_idx").on(table.inspectionId),
    index("tickets_client_id_idx").on(table.clientId),
    index("tickets_building_id_idx").on(table.buildingId),
    index("tickets_area_id_idx").on(table.areaId),
    uniqueIndex("tickets_ticket_number_unique").on(table.ticketNumber),
    uniqueIndex("tickets_inspection_item_id_unique").on(table.inspectionItemId),
    check("tickets_status_valid", sql`${table.status} in ('open', 'closed')`),
    check("tickets_title_not_blank", sql`length(btrim(${table.title})) > 0`),
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
