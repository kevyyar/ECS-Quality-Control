# Thermo Review — Issue #9 Building Inspection Plans

**Date:** 2026-05-28
**Scope:** Uncommitted working tree on `main` (Building Inspection Plans + review-finding fixes)
**Reviewers:** Thermo-nuclear branch audit + Thermo-nuclear code quality audit

## Verdict

No **critical** or **high** security/correctness blockers. Safe to merge for the intended supervisor setup flow. Auth, transactional save, validation, and migration/schema alignment look sound.

Main follow-ups were addressed in the current working tree: zero-entry plan shells hydrate correctly, full hydration uses the canonical active helper, Building Inspection Plan persistence is extracted from `repository.ts`, upstream setup mutations revalidate plan views, and the supervisor UI no longer renders the internal snapshot contract.

---

## Medium — fix recommended

### 1. `getBuildingInspectionPlan` hides plan shells with zero entries — Resolved

- **Where:** `src/lib/client-building-setup/repository.ts` (~705–718)
- **Evidence:** Full hydration uses `innerJoin` on `buildingInspectionPlanEntries`; `listBuildingInspectionPlanSummaries` uses `leftJoin`. A plan row with no child rows yields zero select rows → `null`, while the list path can still surface `planId` with `entryCount: 0`.
- **Impact:** Building detail / edit pages show “No plan configured yet” while the index may still reference a plan row. Post-save reload could throw if entries were ever missing (not reachable via current save path, which always inserts ≥1 entry in the same transaction).
- **Resolution:** Entry hydration now uses `leftJoin`, `toBuildingInspectionPlanRecord` returns `{ …plan, entries: [] }` when the shell exists, and a repository test covers “plan exists, zero entries.”

### 2. `toBuildingInspectionPlanRecord` bypasses the canonical active helper — Resolved

- **Where:** `src/lib/client-building-setup/repository.ts` (~619)
- **Evidence:** Computes `isActive: isAreaActive && isInspectionTemplateActive` instead of calling `isBuildingInspectionPlanEntryActive()`, which summaries use correctly.
- **Impact:** Future activity rule changes could drift between full hydration and summary paths.
- **Resolution:** Full hydration now calls `isBuildingInspectionPlanEntryActive({ …archive timestamps })`.

### 3. `repository.ts` is a ~1,603-line monolith — Resolved for Building Inspection Plans

- **Where:** `src/lib/client-building-setup/repository.ts`
- **Evidence:** Every setup entity (clients, buildings, areas, templates, building inspection plans) lives in one file. Plan feature alone adds ~380 lines.
- **Impact:** Navigation, review, and merge conflict surface grow with each new entity; file is ~60% over the 1k-line rubric threshold.
- **Resolution:** Building Inspection Plan persistence is extracted to `repository/building-inspection-plan.ts`, with a thin barrel re-export preserving existing import paths.

### 4. Duplicated join / validation / status logic

- **Join graph:** Full hydration vs summary aggregation use parallel Drizzle queries with nearly identical topology but different join styles and post-processing.
- **Validation:** Duplicate area detection and error strings in model parser and repository.
- **Status copy:** `buildingInspectionPlanDescription`, `planStatus`, and detail entry labels re-implement configured/stale/pluralization independently.
- **Fix:** Shared join selector, `validateBuildingInspectionPlanEntryShape()` in model, `formatBuildingInspectionPlan*Status()` helpers, delegate summary counts to `summarizeBuildingInspectionPlanEntryCounts`.

---

## Low — optional hardening

| Finding | Where | Notes |
|---------|-------|-------|
| Unbounded plan entry count | `model.ts` parser, `repository.ts` save | Supervisor-only; low abuse risk. Optional cap (e.g. 50–100). |
| Empty `entryErrors` on save without parser | `repository.ts`, `actions.ts` | Internal misuse only; map to `errors.entries` or distinct error type. |
| Migration `0005` required at deploy | `drizzle/0005_*.sql`, journal | Document `pnpm db:migrate` in PR/deploy notes. |
| Test gaps | repository / page tests | Zero-entry plan, txn rollback, non-supervisor page access. |
| Summary aggregation bypasses model helper | `listBuildingInspectionPlanSummaries` | Delegate to `summarizeBuildingInspectionPlanEntryCounts`. |
| Save round-trips through full re-fetch | `saveBuildingInspectionPlan` | Return hydrated record from transaction rows already fetched. |
| Form rebuilds `Set`s per row render | `building-inspection-plan-form.tsx` | Hoist sets above map. |
| Building detail loads full plan for one-line summary | `buildings/[buildingId]/page.tsx` | Future: summary-only API. |
| Ceremonial snapshot contract test | `model.test.ts` | Schema comment is the real documentation. |
| `model.ts` at ~845 lines | `model.ts` | Extract `building-inspection-plan.model.ts` before next entity. |
| `repository.test.ts` at ~1,409 lines | `repository.test.ts` | Split plan fixtures + describe block. |

---

## Verified (no issue)

| Area | Result |
|------|--------|
| **Authorization** | All new routes/actions call `requireProtectedAction("manageSetup")`. Supervisor-only per `capabilities.ts`. |
| **IDOR / cross-building** | Save validates `area.buildingId === input.buildingId`, active parents, non-archived area/type/template. |
| **Active vs archived** | `isConfigured` = `activeEntryCount > 0`. Stale-only plans not marked configured. |
| **Save atomicity** | `db.transaction` with `for("update")`; delete-then-reinsert entries on update. |
| **Validation** | Duplicate areas, cross-building areas, archived entries rejected with field errors. |
| **Schema / migration** | `schema.ts` ↔ `0005` SQL ↔ snapshot consistent (unique constraints, position check, `ON DELETE restrict`, RLS). |
| **Snapshot contract** | Comment + `BUILDING_INSPECTION_PLAN_ENTRY_SNAPSHOT_CONTRACT`; future inspections must not FK plan entry ids. |
| **UI guardrails** | Inactive building / missing active areas or templates disables form; stale pairs shown for remediation. |

---

## Recommended sequencing

| Priority | Action | Effort |
|----------|--------|--------|
| 1 | Fix `innerJoin` → `leftJoin` + empty-plan test | ~30 min |
| 2 | Use `isBuildingInspectionPlanEntryActive` in mapper | 5 min |
| 3 | Extract `repository/building-inspection-plan.ts` + test file | ~2 h |
| 4 | Unify join / validation / status helpers | ~2 h |
| 5 | Split `building-inspection-plan.model.ts` before next setup entity | ~1 h |

---

## What’s already done well

- Layer boundaries: parsers + activity rules in model, persistence in repository, thin server action, client form owns UX state only.
- Review-finding extractions: `isBuildingInspectionPlanEntryActive`, `summarizeBuildingInspectionPlanEntryCounts`, snapshot contract constant.
- Schema: unique `(plan_id, area_id)` and `(plan_id, position)`, positive position check, replaceable entry id documentation.
- Save path: transaction + locks, typed domain errors mapped to form fields.
- Test coverage for real failure modes: stale-only plans, cross-building area, inactive building/template, duplicate areas.
- Pages use `Promise.all` for parallel loads; form preserves stale select options with clear labels.
