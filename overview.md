# Janitorial Quality Control App — Product Overview

## 1. Product Summary

This app is an internal quality-control and inspection platform for a janitorial company.

The purpose of the app is to help supervisors perform building inspections, document cleaning issues, create corrective-action tickets, track whether issues were fixed, and generate downloadable reports with before-and-after proof.

The first version should focus on internal use only. It does not need to be a full client portal or enterprise janitorial platform at launch. The immediate goal is to replace scattered paper forms, phone photos, text messages, and manual reporting with one organized workflow.

The app should support the company's weekly inspection process and help management maintain consistent cleaning standards across client buildings.

## 2. Why This App Was Requested

The janitorial company currently needs a better way to manage quality control without paying for third-party janitorial inspection software that costs around $200–$300 per month.

Existing tools like OrangeQC and Otuvy offer useful features, but the company's current need is more focused:

- Perform weekly inspections of buildings.
- Use reusable checklist templates.
- Document failed cleaning items.
- Create tickets for issues that need correction.
- Add before-and-after photos.
- Close tickets once issues are resolved.
- Download reports for internal records or client communication.

The app was requested because the company wants a simple, custom internal tool that matches its real workflow instead of paying monthly for a larger platform with features it may not use yet.

## 3. Business Problem

The company performs janitorial services for different clients and buildings. During inspections, supervisors may identify issues such as dirty floors, dusty surfaces, unclean restrooms, missed trash, smudged glass, low supplies, or other cleaning deficiencies.

Without a dedicated system, the process can become inconsistent.

Current or likely problems include:

- Inspection forms may be paper-based or informal.
- Photos may remain on individual phones.
- Issues may be sent through text messages and forgotten.
- There may be no reliable record of when a problem was found.
- There may be no structured proof that the issue was fixed.
- Reports may need to be created manually.
- Management may have limited visibility into open cleaning issues.
- Weekly inspections may vary depending on who performs them.
- Client-facing documentation may be harder to produce when needed.

The core problem is not just "doing inspections." The real problem is creating a consistent quality-control process from inspection to resolution.

## 4. Product Objective

The objective of the app is to create a simple internal system that helps the company inspect, track, resolve, and document cleaning quality issues.

The app should help answer these questions:

- Which buildings were inspected this week?
- What areas were checked?
- Which checklist items passed or failed?
- What problems were found?
- Are there photos showing the issue?
- Was a ticket created?
- Is the ticket still open or closed?
- Who closed it?
- Is there an after photo showing the correction?
- Can we download a report as proof?

The product should give the company a clear record of quality-control activity.

## 5. MVP Goal

The MVP goal is:

Allow internal users to perform weekly building inspections using reusable templates, create tickets from failed checklist items, close tickets with before-and-after proof, and download reports.

The MVP should not try to solve every janitorial operation problem. It should focus on the most valuable workflow:

**Inspect → Find issue → Create ticket → Fix issue → Add proof → Close ticket → Download report**

This is the core value the company needs first.

## 6. Target Users

### Primary Users

#### Company Owner / Manager

The owner or manager needs visibility into inspections, open tickets, closed tickets, and reports. This user cares about accountability, quality, and being able to prove that work was performed or corrected.

#### Supervisor / Inspector

The supervisor performs weekly inspections. This user needs to quickly select a building, open the right inspection template, mark items as pass or fail, add notes, take photos, and create tickets.

#### Cleaner / Field Staff

For the first version, cleaner access can be limited or optional. Eventually, cleaners may need to view assigned tickets, upload after photos, and mark work as completed.

### Future Users

#### Client

Clients do not need access in the MVP. However, the reports should be designed in a way that they can eventually be shared with clients or later exposed through a client portal.

## 7. Core App Concept

The app is built around four main concepts:

- Templates
- Inspections
- Tickets
- Reports

Each concept supports the next one.

- Templates define the standards.
- Inspections check the standards.
- Tickets track failed items.
- Reports document what happened.

## 8. Templates

Templates are reusable checklists or inspection forms that define what should be checked in a specific type of area.

The uploaded OrangeQC examples show why templates are important. For example, the hallway cleaning checklist includes fields for location, date/time, custodian, signature, checklist items, descriptions, and an "Other issues" section. The checklist items include walls, doors, flooring, lighting, mats, ceiling, trash/recycling, and safety/signage.

The hallway inspection form uses a similar list of items, but instead of a simple completion checkbox, it includes Pass / Fail ratings and an "Overall notes" section for the inspector.

The office inspection form includes office-specific items such as desks, phones, chairs, trash cans, walls/baseboards, switchplates, floors, windows/blinds/sills, and lighting, each with Pass / Fail ratings.

The office cleaning checklist is similar, but it is cleaner-facing and focused on confirming that cleaning tasks were completed.

### Template Purpose

Templates allow the company to standardize what gets checked.

Instead of creating a new inspection from scratch every week, the company can create reusable templates for:

- Offices
- Hallways
- Restrooms
- Lobbies
- Breakrooms
- Stairwells
- Elevators
- Common areas
- Medical offices
- Schools
- Commercial buildings

### Template Types

The app should support two general types of templates.

#### Cleaning Checklist Template

Used to confirm that cleaning tasks were completed.

Example:

| Item | Description | Completion |
| --- | --- | --- |
| Trash cans | Emptied with fresh liners | Completed / Not completed |
| Floors | Clean and clear of debris | Completed / Not completed |
| Desks | Dusted and marks removed | Completed / Not completed |

This is more useful for cleaners or custodians.

#### Inspection Form Template

Used by supervisors to inspect the quality of the work.

Example:

| Item | Description | Rating |
| --- | --- | --- |
| Trash cans | Emptied with fresh liners | Pass / Fail |
| Floors | Clean and clear of debris | Pass / Fail |
| Desks | Dusted and marks removed | Pass / Fail |

This is the more important template type for the MVP because it connects directly to tickets and reports.

## 9. Inspections

Inspections are the main weekly activity inside the app.

A supervisor should be able to select a client building, choose the correct inspection template, and inspect each area using a structured form.

### Inspection Flow

The inspection flow should be simple:

1. Select client.
2. Select building.
3. Select area or inspection template.
4. Review checklist items.
5. Mark each item as pass, fail, or not applicable.
6. Add notes when needed.
7. Add photos when an issue is found.
8. Submit the inspection.
9. Automatically create tickets for failed items.
10. Generate or download an inspection report.

### Inspection Data to Capture

Each inspection should capture:

- Client name
- Building name
- Area inspected
- Inspection date and time
- Inspector name
- Template used
- Checklist items
- Pass/fail status
- Notes
- Photos
- Overall inspection result
- Tickets created from failed items

### Inspection Outcome

At the end of an inspection, the company should know:

- What was inspected
- What passed
- What failed
- What needs correction
- Which tickets were created
- What evidence was collected

## 10. Tickets

Tickets are created when something fails during an inspection.

This is one of the most important parts of the app because it turns an inspection finding into a trackable action item.

### Ticket Purpose

A ticket represents a cleaning issue that needs to be corrected.

Example:

- **Issue:** Restroom mirror has water spots
- **Building:** ABC Office
- **Area:** Restroom
- **Status:** Open
- **Before photo:** Attached

The ticket should remain open until someone fixes the issue and adds proof.

### Ticket Workflow

The MVP ticket workflow should be:

**Open → Closed**

A slightly more advanced version can support:

**Open → In Progress → Resolved → Closed**

For the MVP, simple is better. The most important part is that an issue cannot be forgotten after it is found.

### Ticket Information

Each ticket should include:

- Ticket number
- Client
- Building
- Area
- Issue title
- Issue description
- Related inspection
- Status
- Priority, if needed
- Before photo
- Notes from the inspector
- Created date and time
- Created by
- Resolution note
- After photo
- Closed date and time
- Closed by

### Closing a Ticket

When closing a ticket, the user should provide proof that the issue was corrected.

Closing a ticket should include:

- Resolution note
- After photo
- Date/time closed
- User who closed the ticket

Example:

- **Resolution note:** Mirror was cleaned and inspected again.
- **After photo:** Uploaded.
- **Status:** Closed.

This creates the before-and-after record the company wants.

## 11. Reports

Reports are the output of the inspection and ticket workflow.

The company wants downloadable reports, especially when closing tickets with before-and-after pictures.

The reports should be professional enough to keep internally or share with clients when needed.

### Report Types

The MVP should support two report types.

#### 1. Ticket Resolution Report

This report focuses on one issue.

It should include:

- Company name or logo
- Ticket number
- Client
- Building
- Area
- Issue found
- Original inspection note
- Before photo
- Resolution note
- After photo
- Opened by
- Opened date/time
- Closed by
- Closed date/time
- Final status

**Purpose:** To prove that a specific cleaning issue was found, addressed, and corrected.

#### 2. Weekly Inspection Report

This report summarizes a full inspection.

It should include:

- Company name or logo
- Client
- Building
- Inspection date
- Inspector
- Areas inspected
- Checklist items reviewed
- Passed items
- Failed items
- Tickets created
- Open tickets
- Closed tickets
- Overall notes
- Photos where relevant

**Purpose:** To summarize the quality-control inspection for a building during a specific period.

### Report Value

Reports help the company:

- Keep internal records.
- Show proof of correction.
- Communicate professionally with clients.
- Reduce disputes.
- Demonstrate accountability.
- Track recurring issues over time.

## 12. Main Features Required for MVP

### Client and Building Organization

The app should allow the company to organize inspections by client and building.

A client may have one or multiple buildings. Each building may have multiple areas.

Example:

- **Client:** ABC Property Management
- **Building:** Downtown Office
- **Areas:** Lobby, restrooms, offices, hallways, breakroom

This structure is important because inspections and tickets need to be tied to a specific place.

### Area Management

The company should be able to define areas inside a building.

Examples:

- Lobby
- Restroom
- Office
- Hallway
- Breakroom
- Conference room
- Elevator
- Stairwell

Areas help organize inspections and reports.

### Template Library

The app should include a library of reusable templates.

Users should be able to create, edit, and reuse templates for different areas or cleaning standards.

Templates should include:

- Template name
- Area type
- Checklist items
- Item descriptions
- Response type
- Notes section
- Optional photo requirement when an item fails

### Weekly Inspection Process

The app should allow supervisors to start and complete weekly inspections using the appropriate template.

The inspection should be simple enough to use while walking through a building.

Each checklist item should allow the inspector to mark whether the item passed or failed.

Failed items should allow notes and photos.

### Automatic Ticket Creation

When an inspection item fails, the app should create a ticket.

This keeps the process action-oriented. The inspection should not just record problems; it should create follow-up work.

### Before-and-After Photos

The app should support photo documentation.

Before photos should show the issue when it was found.

After photos should show the correction when the ticket is closed.

This is a major requirement because the company wants downloadable reports that include proof.

### Ticket Management

Users should be able to view open and closed tickets.

The app should make it easy to answer:

- What issues are still open?
- Which building has unresolved problems?
- What was fixed this week?
- Which tickets have before-and-after proof?

### Downloadable Reports

Users should be able to download reports for:

- Individual tickets
- Full weekly inspections

This is one of the most important MVP requirements.

## 13. What the MVP Should Not Include Yet

To keep the first version focused, the MVP should avoid unnecessary complexity.

The MVP does not need:

- Client login portal
- Billing or invoicing
- Payroll
- Employee scheduling
- Inventory tracking
- Route planning
- Advanced analytics
- AI summaries
- Automated email campaigns
- Complex permissions
- Mobile offline mode
- QR code scanning
- Contract management
- Multi-company SaaS features

These can be considered later after the internal inspection and reporting workflow is working well.

## 14. User Journey Example

### Scenario: Weekly Office Inspection

A supervisor visits a client building for the weekly inspection.

They open the app and select:

- **Client:** ABC Office
- **Building:** Main Building
- **Template:** Office Inspection Form

The app displays office inspection items such as desks, phones, chairs, trash cans, floors, windows, and lighting.

The supervisor reviews each item.

Most items pass.

One item fails:

- **Item:** Trash cans
- **Issue:** Trash not removed from conference room

The supervisor marks the item as failed, adds a note, and takes a before photo.

The app creates a ticket.

Later, the issue is corrected. The supervisor or cleaner opens the ticket, adds an after photo, writes a resolution note, and closes the ticket.

The app now has a complete record:

**Issue found → before photo → correction made → after photo → ticket closed**

The supervisor downloads a ticket resolution report.

The company now has proof that the issue was found and corrected.

## 15. Success Criteria

The MVP should be considered successful if it allows the company to:

- Create reusable inspection templates.
- Perform weekly building inspections.
- Capture failed checklist items.
- Create tickets from failed items.
- Add before photos to issues.
- Close tickets with after photos.
- Download ticket reports.
- Download inspection reports.
- Keep inspection records organized by client and building.
- Reduce manual reporting work.
- Improve accountability for cleaning quality.

## 16. Product Vision

The long-term vision is to create a simple but powerful janitorial quality-control system that helps the company maintain high cleaning standards, document its work, and communicate professionally with clients.

The MVP should start as an internal inspection and reporting tool. Over time, it can grow into a broader operations platform with client access, recurring schedules, QR codes, dashboards, automated reports, and performance tracking.

The first version should stay focused on the company's immediate need:

A reliable internal system for quality-control inspections, issue tracking, before-and-after documentation, and downloadable reports.

## 17. Final Product Definition

This app is an internal janitorial quality-control tool designed to help the company standardize inspections, document cleaning issues, manage corrective actions, and generate proof-based reports.

It should contain:

- Client and building organization
- Area-based inspection setup
- Reusable checklist and inspection templates
- Weekly inspection forms
- Pass/fail quality checks
- Notes and photo documentation
- Automatic ticket creation for failed items
- Open and closed ticket tracking
- Before-and-after proof
- Downloadable ticket reports
- Downloadable weekly inspection reports

The app exists to solve a practical business problem:

The company needs a simple, organized, and affordable way to manage janitorial quality control without relying on paper, scattered photos, text messages, or expensive monthly software.
