# Supervisor Is the Highest Internal Role

In this app, Supervisor is the owner-like super-admin role, and Manager is the role below it. This is intentionally different from some workplace hierarchies where managers outrank supervisors; submitting Inspections and closing Tickets require Supervisor capability, while users may still have both Manager and Supervisor roles.

## Considered Options

- Treat Manager as the top administrative role and Supervisor as the field inspection role, which matches common software naming but not this company's intended role language.
- Treat Supervisor as the top owner-like role and Manager as the lower role, which matches the user's business language even though it may surprise future readers.

## Consequences

Authorization checks should key off Supervisor capability for setup management, user management, branding configuration, inspection submission, and ticket closure. Manager-only users have view/report/correction access; if a real-life manager needs higher powers, that user should have both Manager and Supervisor roles.
