# Global Must-Have Instructions

Before writing any code:

* Read the entire memory bank first (`memory-bank/` — all files)
* Understand the current architecture before adding to it
* Reuse existing components and patterns
* Never create duplicate UI patterns
* Maintain strict UI consistency
* Keep components modular and reusable
* Avoid overengineering
* Avoid unnecessary dependencies
* Maintain a scalable folder structure
* Use clean architecture principles
* Prioritize readability and maintainability — this team is still learning, code should teach, not just work

## Critical Product Rules (non-negotiable)

* Anonymous (not logged-in) users get ZERO AI access — plain text notes only, stored in browser `sessionStorage`, cleared on tab close
* AI categorization/structuring is only available to authenticated, email-verified users
* No real payment system of any kind — no Stripe, no checkout flow, no card form. A verified signup grants full access automatically
* Auth = email + password with email verification (Supabase Auth)
* The AI assigns each note to one of a fixed set of predefined categories — it does not invent new ones. Unclear notes fall back to a "General / Other" category

## UI Rules

* Use TailwindCSS consistently; shadcn/ui components are welcome for forms, dialogs, and cards where they save time, but keep them restrained
* Maintain consistent spacing, typography, and color usage
* Keep layouts clean, calm, and minimal — this product's whole point is reducing mental clutter, the UI should not add more
* Avoid cluttered screens
* Use responsive design everywhere
* Include loading, empty, and error states for every data-driven view
* Keep animations minimal and purposeful, not decorative

## Code Rules

* Strong TypeScript typing on the frontend
* No hardcoded values when avoidable
* Use environment variables properly — never commit API keys (Gemini, Supabase)
* Use reusable hooks/services/utils
* Separate business logic from UI
* Keep files small and maintainable
* Naming conventions: snake_case (Python), camelCase (TS/JS), PascalCase (React components)
* Avoid spaghetti code

## Backend Rules

* Maintain modular FastAPI architecture
* Separate routes/services/repositories/models
* Use async for anything calling the AI API or the database
* Write scalable, simple database schemas (Supabase/PostgreSQL)
* Use proper validation (Pydantic) on every request/response
* Sanitize user-submitted text before sending it to the AI API or rendering it back as HTML
* Don't log full note content in plaintext server logs — these are personal notes

## Workflow Rules

* Split work into phases (see `projectbrief.md`)
* Complete one phase before moving forward
* At the end of each phase:
  * Summarize completed work in `progress.md`
  * Note any architecture decisions in `systemPatterns.md`
  * Validate consistency against this file
  * List next steps in `activeContext.md`

## Do Not

* Randomly refactor working systems
* Create inconsistent UI
* Introduce breaking architectural changes without flagging them first
* Generate unnecessary complexity
* Duplicate components or logic
* Build a real payment integration "just in case"
* Let anonymous users touch the AI pipeline, even for testing convenience

Always optimize for: scalability, maintainability, developer experience, clean UX, and demo-day reliability.