# Preserve Historical Inspection Content

Inspection reports are records of what was checked at the time, so an Area Inspection preserves the template item names and descriptions that existed when it was performed. Editing an Inspection Template affects future Area Inspections only; historical Inspection Item Results and reports do not silently change.

## Considered Options

- Reference live template items from historical inspections, which avoids duplicated text but allows old reports to change when templates are edited.
- Preserve the inspected item text on the Area Inspection, which duplicates template content but keeps records trustworthy.

## Consequences

Template edits require clear behavior: existing inspections keep their original wording, while newly started Area Inspections use the updated template.
