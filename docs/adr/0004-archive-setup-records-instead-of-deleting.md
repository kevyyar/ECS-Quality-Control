# Archive Setup Records Instead of Deleting

Clients, Buildings, Areas, Area Types, and Inspection Templates are archived instead of deleted. Quality-control reports depend on historical context, so setup records that are no longer active must remain available for past inspections, tickets, and PDFs.

## Considered Options

- Hard-delete setup records, which keeps setup lists clean but risks breaking historical records or making old reports harder to understand.
- Archive setup records, which requires filtering inactive records out of new workflows but preserves report integrity.

## Consequences

New inspection setup should hide archived records by default. Historical inspections, tickets, and reports may still display archived names and relationships so past proof remains understandable.
