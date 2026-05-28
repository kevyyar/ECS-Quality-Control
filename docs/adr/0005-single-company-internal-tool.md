# Single-Company Internal Tool

The app is built for one janitorial company as an internal quality-control tool, not as a multi-company SaaS platform. The product should not introduce tenants, company switching, subscription plans, or generic multi-company abstractions unless the business direction explicitly changes.

## Considered Options

- Design as a multi-tenant SaaS product, which would make resale possible but add complexity around auth, data isolation, billing, branding, and support.
- Design as a single-company internal tool, which keeps the app simpler and better matched to the actual business need.

## Consequences

Clients are service customers of the janitorial company, not tenants. Managers, Supervisors, and future Cleaners belong to the same janitorial company and operate over one shared internal dataset.
