# Janitorial Quality Control App — MVP Spec

This spec summarizes the resolved MVP decisions from the grill session. The domain glossary lives in [`CONTEXT.md`](./CONTEXT.md); architectural decision records live in [`docs/adr/`](./docs/adr/).

## 1. Product Boundary

The app is a responsive web app for one internal **Janitorial Company**. It is not a multi-company SaaS product and does not include client accounts.

The MVP focuses on one workflow:

> Configure inspection standards → perform building inspection → create tickets from failures → verify corrections → download proof-based PDF reports.

## 2. MVP Goals

The MVP succeeds if the company can:

- configure Clients, Buildings, Areas, Area Types, Inspection Templates, and Building Inspection Plans;
- start Draft Inspections from a Building Inspection Plan;
- submit completed Inspections with Pass / Fail / N/A item results;
- automatically create Tickets from Fail Results;
- close Tickets with supervisor-verified proof;
- download Weekly Inspection Reports and Ticket Resolution Reports as PDFs;
- view simple dashboard charts and active Draft Inspections.

## 3. Platform and Access

- Responsive web app.
- Email/password internal accounts.
- No native mobile app.
- No offline mode or offline sync.
- No client portal or client login.
- No public signup or self-registration.

## 4. Roles and Permissions

### Role hierarchy

**Supervisor** is the highest internal role, owner-like / super-admin in capability.

**Manager** is below Supervisor.

Users may have both Manager and Supervisor roles.

### Permission matrix

| Capability | Supervisor | Manager-only |
| --- | --- | --- |
| Manage internal users | Yes | No |
| Manage Company Branding | Yes | No |
| Manage Clients / Buildings / Areas / Area Types | Yes | No |
| Manage Inspection Templates | Yes | No |
| Manage Building Inspection Plans | Yes | No |
| Start Draft Inspections | Yes | No |
| Edit/continue Draft Inspections | Yes | No |
| Submit Inspections | Yes | No |
| Close Tickets | Yes | No |
| View dashboard | Yes | Yes |
| View inspections/tickets | Yes | Yes |
| Download PDF reports | Yes | Yes |
| Add Correction Notes | Yes | Yes |
| View active Draft metadata | Yes | Yes |

Manager-only users can see active Draft metadata but cannot edit or submit Drafts. Any Supervisor can continue and submit any active Draft Inspection, even if another Supervisor started it.

Cleaner is a future role only. Cleaners do not access the MVP app and Tickets have no assignees in MVP.

## 5. Core Domain Model

### Location/setup hierarchy

- **Client**: paying organization/customer record; not an app user.
- **Building**: physical service location under a Client.
- **Area**: specific inspectable space inside a Building.
- **Area Type**: category for an Area, used to choose templates.
- **Building Inspection Plan**: default set of Areas and Inspection Templates for a Building.

Each planned Area in a Building Inspection Plan uses exactly one Inspection Template.

### Inspection hierarchy

- **Inspection**: dated quality-control event for one Building.
- **Draft Inspection**: editable, not official, may be incomplete.
- **Submitted Inspection**: final proof record; not editable; creates Tickets from Fail Results.
- **Area Inspection**: inspection of one Area using one Inspection Template.
- **Inspection Item Result**: one item answer: Pass, Fail, or N/A.

### Tickets

- Every Fail Result creates one Ticket at submission time.
- Tickets are created only when a Draft Inspection becomes a Submitted Inspection.
- Ticket status is only Open or Closed.
- Closed Tickets are final and never reopened.
- Repeated issues in later Inspections create new Tickets.

## 6. Setup Records

Supervisor-only setup records:

- Company Branding
- internal users
- Clients
- Buildings
- Areas
- Area Types
- Inspection Templates
- Building Inspection Plans

Setup records are archived, not hard-deleted. User-facing “delete” means Archive.

Archived Setup Records:

- are hidden from normal setup/start-inspection workflows;
- can be restored by Supervisors;
- remain available to historical inspections, tickets, and reports;
- can be included in historical filters with an “include archived” option.

Archiving a setup record is allowed even if active Draft Inspections reference its snapshot.

## 7. Starter Data

The MVP should ship with starter Area Types and Inspection Templates.

Starter Area Types:

- Restroom
- Office
- Hallway
- Lobby
- Breakroom
- Stairwell
- Elevator
- Common Area

Starter Inspection Templates:

- Restroom Inspection
- Office Inspection
- Hallway Inspection
- Lobby Inspection

Supervisors can create, edit, duplicate, archive, and restore Inspection Templates. Template import/export is out of scope.

## 8. Inspection Templates

Inspection Templates are reusable global/internal library templates.

Template rules:

- supervisor-facing only;
- no cleaner-facing checklist templates in MVP;
- item name is required;
- item order is required;
- item description is optional;
- Template Sections are optional;
- no per-item photo-required setting because every Fail Result globally requires Before Photos.

Template edits affect only future Draft Inspections. Active Drafts and Submitted Inspections keep their snapshotted item wording.

## 9. Building Inspection Plans

A Building must have a configured Building Inspection Plan before a Draft Inspection can be started.

A Building Inspection Plan:

- must contain at least one Area/template pair;
- preloads Area Inspections when a Draft Inspection starts;
- standardizes inspection content, not schedule;
- may be edited by Supervisors only;
- affects future Draft Inspections only, not active Drafts.

## 10. Inspection Workflow

### Start flow

1. Supervisor selects Client.
2. Supervisor selects Building.
3. App verifies the Building has a non-empty Building Inspection Plan.
4. App starts a Draft Inspection preloaded from the plan.

Each Building may have at most one active Draft Inspection at a time.

### Draft behavior

In a Draft Inspection:

- items may be unanswered;
- Supervisor can add/remove Before Photos for Fail Results;
- Supervisor can add One-off Area Inspections;
- Supervisor can mark planned Area Inspections as skipped with a reason;
- Supervisor can discard the Draft;
- discarded Drafts leave no history/audit record and create no Tickets.

Pass and N/A results may have optional notes. Fail Results require an issue note and Before Photos.

Pass and N/A results do not allow photos.

### Submission rules

Submitting a Draft Inspection requires:

- Supervisor capability;
- at least one completed, non-skipped Area Inspection;
- every non-skipped item answered as Pass, Fail, or N/A;
- every Fail Result to include an issue note and one or more Before Photos;
- every skipped planned Area Inspection to include a skip reason.

Submission should include a review/summary screen showing:

- completed areas;
- skipped areas and reasons;
- one-off areas;
- Pass / Fail / N/A counts;
- Tickets that will be created;
- validation errors.

If planned areas are skipped, submission shows a warning/confirmation before final submit.

Submitted Inspections cannot be edited or reopened. Mistakes are handled with Correction Notes.

## 11. Ticket Workflow

### Ticket creation

On Inspection submission:

- each Fail Result creates exactly one Ticket;
- Ticket is initially Open;
- Ticket Number is app-wide sequential, e.g. `T-000001`;
- Ticket Title is generated from Area name + failed item name, e.g. `2nd Floor Women's Restroom — Mirrors`.

Tickets have no priority/severity and no assignee in MVP.

### Ticket closure

Any Supervisor can close any Open Ticket.

Closing a Ticket requires:

- resolution note;
- one or more After Photos;
- closed by;
- closed at.

After Photos are uploaded only during Ticket closure, not during Draft Inspection.

Tickets may be closed immediately after submission if the issue was fixed on the spot, but they are never auto-closed during submission.

Closed Tickets:

- cannot be edited;
- cannot be reopened;
- require Correction Notes for later clarification.

Manager-only users cannot close Tickets under any circumstance.

## 12. Photo Evidence

Photo evidence supports:

- camera capture;
- file upload / existing photo selection.

Before/after evidence supports one or more photos; at least one is required for each required evidence set.

Photo rules:

- Before Photos are attached only to Fail Results.
- After Photos are attached only during Ticket closure.
- Pass and N/A results do not allow photos.
- No per-photo captions in MVP.
- Fail Result issue note explains the Before Photos set.
- Ticket resolution note explains the After Photos set.
- Photos can be removed only before finalization:
  - Before Photos before Inspection submission;
  - After Photos before Ticket closure.
- After submission/closure, photos are immutable.

Storage/metadata:

- compress/resize photos to optimize storage while preserving high report/evidence quality;
- store uploaded by, uploaded at, and evidence type only;
- ignore/strip EXIF/GPS metadata.

## 13. Correction Notes

Correction Notes are additive notes used to clarify records without changing original evidence.

Allowed targets:

- Submitted Inspections;
- Open Tickets;
- Closed Tickets.

Not allowed:

- Draft Inspections.

Managers and Supervisors can add Correction Notes. Each Correction Note records author and timestamp.

Correction Notes appear in relevant PDF reports.

## 14. Reports

Reports are generated live on download. The app does not store fixed report files and does not record report download history.

Reports are PDF only. No CSV, spreadsheet, Word/editable document export, or in-app email sending in MVP.

Users download PDFs and send them outside the app if needed.

### Weekly Inspection Report

A Weekly Inspection Report is a PDF summary of one Submitted Inspection.

It includes:

- Company Branding;
- Client / Building;
- Inspection date/time;
- submitted by;
- completed Area Inspections;
- skipped planned Area Inspections with reasons;
- one-off Area Inspections labeled as one-off;
- every item result, not just failures;
- Pass / Fail / N/A status for each item;
- notes where present;
- Before Photos for Fail Results;
- Tickets created from Fail Results;
- current Ticket status/proof at download time;
- relevant Correction Notes.

Inspection results are historical. Related Ticket status/proof is current when the report is generated.

### Ticket Resolution Report

A Ticket Resolution Report is available only for Closed Tickets.

It includes:

- Company Branding;
- Ticket Number;
- Ticket Title;
- Client / Building / Area;
- Inspection date/time;
- submitted by;
- failed item name/description;
- issue note;
- Before Photos;
- resolution note;
- After Photos;
- closed by / closed at;
- relevant Correction Notes.

It does not include the full inspection; that belongs in the Weekly Inspection Report.

## 15. Dashboard, Lists, and Search

### Dashboard

Default date range: This Week.

Quick filters:

- This Week
- Last Week
- This Month
- Custom Range, if easy

Dashboard charts use completed data only:

- Submitted Inspections;
- Tickets created from Submitted Inspections.

Draft Inspection data is excluded from charts.

Simple dashboard charts:

- Ticket status: Open vs Closed;
- Inspection result breakdown: Pass vs Fail vs N/A;
- Open Tickets by Building.

Dashboard should visibly show active Draft Inspections with metadata such as Building, started by, and started at. Supervisors see continue/edit actions; Manager-only users see read-only metadata.

### Core list views

MVP list/views:

- Dashboard;
- Open Tickets list;
- Inspections list;
- Setup area.

Open Tickets list:

- filter by Client, Building, Area;
- sort newest first.

Inspections list:

- show Draft/Submitted status;
- filter by Client, Building, Inspection Week.

### Search

Basic search only:

- Tickets by Ticket Number and Ticket Title;
- Clients / Buildings / Areas by name.

No full-text search across notes/photos and no advanced query syntax in MVP.

## 16. Company Branding

One shared Company Branding identity is used across the app and PDF reports.

Fields:

- company display name;
- logo;
- primary brand color;
- optional report contact details: phone, email, website, address.

Out of scope:

- per-client branding;
- multiple brands;
- custom themes;
- font customization.

## 17. Audit and History

No full audit log in MVP.

Store only key accountability metadata:

- Inspection started by / started at;
- Inspection submitted by / submitted at;
- Ticket created by / created at;
- Ticket closed by / closed at;
- Correction Note author / timestamp;
- photo uploaded by / uploaded at.

No report download history.

Discarded Draft Inspections leave no historical record.

## 18. Out of Scope

Not included in MVP:

- multi-company SaaS / tenants;
- client accounts, client portal, or client login;
- Cleaner login;
- Ticket assignees;
- cleaner-facing checklist templates;
- native mobile apps;
- offline mode / offline sync;
- notifications;
- QR codes;
- inventory/supplies module;
- scheduling;
- route planning;
- payroll;
- billing/invoicing;
- contracts;
- advanced analytics;
- recurring issue analytics;
- cleaner performance charts;
- SLA charts;
- AI summaries;
- report email sending;
- report download history;
- template import/export;
- per-photo captions;
- Pass/N/A photos;
- Ticket comments or chat-style discussion threads;
- priority/severity on Tickets;
- reopening Submitted Inspections;
- reopening Closed Tickets.

## 19. Source ADRs

- [`0001-preserve-historical-inspection-content.md`](./docs/adr/0001-preserve-historical-inspection-content.md)
- [`0002-weekly-reports-show-current-ticket-state.md`](./docs/adr/0002-weekly-reports-show-current-ticket-state.md)
- [`0003-keep-submitted-and-closed-records-immutable.md`](./docs/adr/0003-keep-submitted-and-closed-records-immutable.md)
- [`0004-archive-setup-records-instead-of-deleting.md`](./docs/adr/0004-archive-setup-records-instead-of-deleting.md)
- [`0005-single-company-internal-tool.md`](./docs/adr/0005-single-company-internal-tool.md)
- [`0006-supervisor-is-highest-internal-role.md`](./docs/adr/0006-supervisor-is-highest-internal-role.md)
