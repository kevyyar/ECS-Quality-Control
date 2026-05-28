# Weekly Reports Show Current Ticket State

A Weekly Inspection Report preserves the inspection results as they were recorded, but shows related Ticket status and closure proof as they exist when the report is generated. This makes the report useful as a current quality-control summary without rewriting the historical inspection answers.

## Considered Options

- Freeze all ticket status counts at inspection submission time, which is historically pure but quickly becomes less useful for management follow-up.
- Show current ticket status and proof alongside historical inspection results, which means report output can change over time but better answers whether failures have been corrected.

## Consequences

Reports should make the distinction clear: the inspection findings are historical records, while ticket closure status reflects the latest available corrective-action state.
