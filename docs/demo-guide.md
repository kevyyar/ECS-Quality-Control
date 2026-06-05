# ECS QC Demo Guide

This guide walks through the working MVP flow for a client demo. The UI can be redesigned later; the important demo path is the operational workflow.

## Demo story

ECS QC helps a Supervisor:

1. Configure Clients, Buildings, Areas, Area Types, Inspection Templates, and Building Inspection Plans.
2. Start a Draft Inspection from a Building Inspection Plan.
3. Inspect each Area, marking items Pass, Fail, or N/A.
4. Attach Before Photos and issue notes for failed items.
5. Submit the Draft Inspection.
6. Automatically create Open Tickets from failed items.
7. Close Tickets with resolution notes and After Photos.
8. Download Weekly Inspection and Ticket Resolution PDF reports.

## Recommended local demo login

Use a Supervisor-capable internal user. For local demos, create one through Supabase Auth and add the matching `internal_users` row with `supervisor = true` and `manager = true`.

The current local demo environment has a Supervisor login available. Do not use demo credentials in staging or production.

## Setup records

Before starting an inspection, confirm this setup exists:

- At least one active Client.
- At least one active Building under that Client.
- Active Area Types.
- Active Areas under the Building.
- Active Inspection Templates with items.
- A Building Inspection Plan with at least one active Area/template pair.

Navigate from **Home → Building Inspection Plans** to confirm each demo Building shows active pairs ready.

## Start and complete a Draft Inspection

1. Go to **Home → Draft Inspections**.
2. In **Start a Draft**, click **Start Draft for _Building Name_**.
3. Open the new Draft via **Continue Draft**.
4. For each Area Inspection item:
   - Choose **Pass**, **Fail**, or **Not Applicable**.
   - Add notes when helpful.
   - For **Fail**, add an issue note and attach at least one Before Photo.
5. Review the **Pre-submit review** panel.
6. Click **Submit Draft Inspection** once validation blockers are gone.

Submitted Inspections are proof records and cannot be edited. Use Correction Notes for later clarification.

## Ticket workflow

1. Go to **Home → Open Tickets**.
2. Failed inspection items appear as Open Tickets automatically.
3. Open a Ticket to view failure proof and add Correction Notes.
4. Click **Close Ticket**.
5. Add a resolution note and at least one After Photo.
6. Submit to close the Ticket.

Tickets are not created manually in the MVP. They are created from failed inspection items when submitting a Draft Inspection.

## Reports

- From a Submitted Inspection detail page, click **Download Weekly Inspection Report PDF**.
- From a Closed Ticket detail page, click **Download Ticket Resolution Report PDF**.

The Weekly Inspection Report preserves the submitted inspection results while showing the current state of related Tickets. The Ticket Resolution Report is available only for Closed Tickets.
