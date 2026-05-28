# Janitorial Quality Control

This context defines the domain language for an internal janitorial quality-control app. The app standardizes building inspections, tracks corrective actions for cleaning issues, and produces proof-based records.

## Language

**Janitorial Company**:
The single company that owns and uses the app internally. The app is not a multi-company SaaS product and does not model multiple operating companies or tenants.
_Avoid_: tenant, vendor account, SaaS customer, company account.

**Company Branding**:
The single **Janitorial Company** identity shown in the app and PDF reports. Company Branding is shared across the app and is not customized per Client.
_Avoid_: tenant branding, per-client branding, multi-brand settings.

**Client**:
The paying organization or customer account that receives janitorial services. A Client may have one or more **Buildings** and is a record in the MVP, not an app user.
_Avoid_: customer, account when referring to the served organization; client login or portal in the MVP.

**Building**:
One physical service location belonging to a **Client**. A Building contains one or more saved **Areas** and has a **Building Inspection Plan** for recurring inspections.
_Avoid_: site, location unless used informally.

**Building Inspection Plan**:
The saved default set of **Areas** and **Inspection Templates** used when starting a recurring **Inspection** for a Building. Each planned Area uses exactly one Inspection Template; the plan standardizes inspection content, not the inspection schedule.
_Avoid_: rebuilding a weekly inspection from scratch; treating the plan as a calendar schedule; multiple templates for the same planned Area in the MVP.

**Inspection Week**:
A reporting period derived from Inspection dates, used to answer which Buildings were inspected during a week.
_Avoid_: an enforced weekly assignment or one-inspection-per-week rule in the MVP.

**Archived Setup Record**:
A **Client**, **Building**, **Area**, **Area Type**, or **Inspection Template** that is no longer used for new setup or inspections but remains available to historical inspections, tickets, and reports.
_Avoid_: deleted, removed, deactivated when referring to the canonical archived state.

**Area**:
A specific inspectable space inside a **Building**, such as “2nd Floor Women's Restroom” or “Main Lobby.” An Area has an **Area Type**.
_Avoid_: using Area to mean only a generic category.

**Area Type**:
The category of an **Area**, such as Restroom, Lobby, Hallway, or Office. Area Type helps choose the appropriate **Inspection Template**.
_Avoid_: template type when referring to the space category.

**Manager**:
An internal role below **Supervisor**. A Manager may view quality-control records, download reports, and add **Correction Notes**, but does not manage setup, manage users, configure branding, submit Inspections, or close Tickets unless the user also has Supervisor capability.
_Avoid_: owner, super admin, setup admin, or the person who verified a correction.

**Supervisor**:
The highest internal role for the **Janitorial Company**, owner-like and super-admin in capability. Only users with Supervisor capability manage setup records, manage users, configure branding, submit Inspections, and close Tickets.
_Avoid_: treating Supervisor as lower than Manager in this app.

**Cleaner**:
A field staff member of the **Janitorial Company** who performs cleaning work. Cleaners are future app users for assigned Tickets, but they do not access the MVP app and do not close Tickets.
_Avoid_: using Cleaner to mean the Supervisor who verifies correction.

**Inspection**:
A dated quality-control event for one **Building**, usually representing a supervisor visit. An Inspection contains one or more **Area Inspections** and is either a **Draft Inspection** or a **Submitted Inspection**.
_Avoid_: using Inspection to mean a single area form; treating weekly inspections as an enforced schedule in the MVP.

**Draft Inspection**:
An Inspection that has been started but not submitted, usually preloaded from the Building's **Building Inspection Plan**. A Draft Inspection may contain incomplete Area Inspections and unanswered items, and remains editable until submission.
_Avoid_: treating draft data as report-ready.

**Submitted Inspection**:
An Inspection that has been completed and submitted. A Submitted Inspection has all included items answered, creates Tickets for failed results at submission time, can be used for reports, and is not edited after submission.
_Avoid_: finalized inspection when referring to normal submission; editing submitted records.

**Area Inspection**:
The quality-control check of one **Area** within an **Inspection**, using exactly one **Inspection Template**. An Area Inspection contains multiple **Inspection Item Results** and preserves the inspection items as they existed when the Area Inspection was performed; it may be planned, added as a one-off, or skipped with a reason.
_Avoid_: standalone inspection, checklist submission; silently deleting a planned area.

**Skipped Area Inspection**:
A planned Area Inspection that was not performed during a specific **Inspection**, with a recorded reason.
_Avoid_: removing planned areas without explanation.

**One-off Area Inspection**:
An Area Inspection added to a specific **Draft Inspection** without changing the Building's **Building Inspection Plan**.
_Avoid_: changing the recurring plan for a single-visit exception.

**Inspection Template**:
A reusable supervisor-facing quality-control form from the global internal template library, usually for a type of **Area**. Supervisors assign Inspection Templates to Areas in a **Building Inspection Plan**; a template contains ordered items that may optionally be organized into **Template Sections**.
_Avoid_: cleaning checklist, cleaner checklist, task completion checklist; client-specific template overrides in the MVP.

**Template Section**:
An optional grouping label used to organize related items inside an **Inspection Template**.
_Avoid_: requiring sections for every template.

**Inspection Item Result**:
The recorded answer for one item on an **Inspection Template** during an **Area Inspection**. Each Inspection Item Result is intentionally marked as **Pass Result**, **Fail Result**, or **Not Applicable Result**; a Fail Result includes an issue note and one or more before photos, and creates a **Ticket**.
_Avoid_: checklist item when referring to the completed answer; blank or unanswered item; scoring or partial ratings in the MVP.

**Pass Result**:
An Inspection Item Result showing the item met the expected cleaning standard during an **Area Inspection**.
_Avoid_: completed, acceptable, score-based pass.

**Fail Result**:
An Inspection Item Result showing the item did not meet the expected cleaning standard during an **Area Inspection**. A Fail Result requires an issue note and one or more **Before Photos**.
_Avoid_: needs attention, partial pass, informal issue without a Ticket.

**Before Photos**:
One or more photos attached to a **Fail Result** showing the cleaning issue when it was found. At least one Before Photo is required for each Fail Result; the Fail Result issue note explains the photo set.
_Avoid_: making failure evidence optional; limiting evidence to exactly one image; per-photo captions in the MVP.

**Not Applicable Result**:
An Inspection Item Result used when the item does not apply to the inspected **Area**.
_Avoid_: leaving the item blank.

**Ticket**:
A corrective action record for a cleaning issue found during a **Submitted Inspection**. Every **Fail Result** creates one Ticket at submission time, even if the issue is corrected immediately; a Ticket is either **Open** or **Closed** and has an auto-generated **Ticket Title**.
_Avoid_: task, issue, work order unless specifically distinguishing another concept; priority/severity or assignee in the MVP.

**Ticket Title**:
The readable Ticket label generated from the **Area** name and failed inspection item name, such as “2nd Floor Women's Restroom — Mirrors.”
_Avoid_: manually entered Ticket titles in the MVP.

**Ticket Number**:
The app-wide sequential identifier for a **Ticket**, formatted like “T-000001.”
_Avoid_: client-specific, building-specific, or date-based ticket numbering in the MVP.

**Open Ticket**:
A Ticket whose correction has not yet been verified by a **Supervisor**.
_Avoid_: in progress, resolved for the MVP workflow.

**Closed Ticket**:
A Ticket whose correction has been verified by a **Supervisor** with a resolution note and one or more **After Photos**. A Closed Ticket is not edited after closure.
_Avoid_: completed, done when referring to verified ticket closure; editing closed proof.

**After Photos**:
One or more photos attached when closing a **Ticket**, showing the corrected cleaning issue after supervisor verification. At least one After Photo is required to close a Ticket; the resolution note explains the photo set.
_Avoid_: making closure proof optional; limiting evidence to exactly one image; per-photo captions in the MVP.

**Weekly Inspection Report**:
A PDF summary of one **Inspection**. It preserves the historical inspection results while showing the current status and proof for related **Tickets** when the report is generated.
_Avoid_: treating ticket status in the report as frozen at inspection submission time; CSV, spreadsheet, editable document export, or in-app email sending in the MVP.

**Ticket Resolution Report**:
A PDF proof document for one **Closed Ticket**. It includes the failure evidence, the supervisor-verified correction evidence, and the ticket closure details.
_Avoid_: generating a resolution report for an Open Ticket; CSV, spreadsheet, editable document export, or in-app email sending in the MVP.

**Correction Note**:
An additive note from a **Manager** or **Supervisor** used to explain or clarify a **Submitted Inspection** or any **Ticket** without changing the original inspection or ticket evidence. A Correction Note records who added it and when.
_Avoid_: replacing the original record; adding Correction Notes to Draft Inspections.

## Flagged ambiguities

- The overview used “inspection” both for a weekly building visit and for an area-specific form. Resolved: **Inspection** means the weekly building-level event; **Area Inspection** means the area/template-specific form within it.
- A **Fail Result** always creates a **Ticket**, even when the cleaning issue is corrected immediately during the inspection.
- MVP Ticket status language is intentionally limited to **Open Ticket** and **Closed Ticket**.
- MVP **Tickets** do not have priority or severity.
- MVP **Tickets** do not have assignees; future Cleaner assignment is intentionally out of scope for the first version.
- MVP **Ticket Titles** are auto-generated from the **Area** name and failed inspection item name.
- MVP **Ticket Numbers** are app-wide sequential identifiers like “T-000001”.
- Inspection items are never left blank; items that do not apply are marked with a **Not Applicable Result**.
- Unanswered items are allowed only in a **Draft Inspection**; a **Submitted Inspection** must have every included item answered.
- **Tickets** are created only when a **Draft Inspection** becomes a **Submitted Inspection**, not while the inspection is still draft.
- Starting a **Draft Inspection** for a **Building** preloads Area Inspections from that Building's **Building Inspection Plan**.
- Each planned **Area** in a **Building Inspection Plan** uses exactly one **Inspection Template** in the MVP.
- In the MVP, “weekly” is a reporting filter based on Inspection dates, not an enforced schedule or one-per-week rule.
- A Supervisor may add a **One-off Area Inspection** during Draft, but a planned area that is not inspected becomes a **Skipped Area Inspection** with a reason.
- The overview distinguished cleaner-facing checklists from supervisor-facing inspection forms. Resolved: MVP domain language uses **Inspection Template** for supervisor quality checks only.
- MVP **Inspection Templates** are reusable global/internal library templates, not client-specific or building-specific override chains.
- **Inspection Templates** may use optional **Template Sections** to organize items.
- **Inspection Item Results** allow only **Pass Result**, **Fail Result**, and **Not Applicable Result** in the MVP.
- **Fail Results** require an issue note and one or more **Before Photos**.
- Before/after evidence supports one or more photos; at least one is required for each required evidence set.
- MVP photo evidence does not use per-photo captions; **Fail Result** issue notes and Ticket resolution notes explain photo sets.
- Closing a **Ticket** requires a resolution note and one or more **After Photos**.
- A **Weekly Inspection Report** treats inspection results as historical, but related **Ticket** status/proof as current when the report is generated.
- MVP downloadable reports are PDFs only.
- MVP report delivery is download-only; users send PDFs outside the app if needed.
- MVP **Clients** are records only; there are no client accounts, logins, or portals.
- The app is a single-company internal tool for one **Janitorial Company**, not a multi-company SaaS product now or later.
- The app uses one shared **Company Branding** identity for the app and PDF reports.
- Setup records are archived, not deleted; historical inspections, tickets, and reports must keep their references meaningful.
- A **Ticket Resolution Report** is only generated for a **Closed Ticket** because it requires complete before-and-after evidence.
- **Submitted Inspections** and **Closed Tickets** are not edited; later clarifications use **Correction Notes**.
- **Correction Notes** may be added to **Submitted Inspections** and any **Ticket**, including Open Tickets, but not Draft Inspections.
- Both **Managers** and **Supervisors** may add **Correction Notes**.
- **Supervisor** is the highest, owner-like role; **Manager** is below Supervisor.
- Submitting Inspections and closing Tickets require Supervisor capability, even if the user also has Manager capability.
- Managing setup records, internal users, and **Company Branding** also requires Supervisor capability; Manager-only users have view/report/correction access.
- Internal users may have both **Manager** and **Supervisor** roles.

## Example dialogue

**Supervisor**: “I started this week’s Draft Inspection for ABC Office / Main Building.”

**Manager**: “Did it preload the Building Inspection Plan?”

**Supervisor**: “Yes — Main Lobby, 2nd Floor Women's Restroom, East Hallway, and the Executive Offices. Each planned Area uses its assigned Inspection Template.”

**Manager**: “Did any Inspection Item Results fail?”

**Supervisor**: “Yes, the Restroom mirror item failed, so I created an Open Ticket from the failure’s Before Photos and issue note.”

**Manager**: “When does it become a Closed Ticket?”

**Supervisor**: “Only after I verify the correction, add a resolution note, and attach After Photos.”
