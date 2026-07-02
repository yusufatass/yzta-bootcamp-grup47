# System Patterns

## System Architecture
* **Frontend:** Next.js (App Router), TypeScript, TailwindCSS, shadcn/ui where useful
* **Backend:** FastAPI (Python), Supabase Python client for DB + Auth calls
* **Authentication:** Supabase Auth, email + password with email verification. No JWT handling needs to be custom-built — Supabase manages this
* **AI Layer:** Single general-purpose categorization/structuring flow using the Gemini API — one prompt design that adapts to note content, not a separate pipeline per note type
* **Storage:** Two-tier — anonymous notes live in browser `sessionStorage` only; authenticated notes are persisted in Supabase Postgres

## Key Technical Decisions
* **Monorepo structure:** `frontend/` and `backend/` together — simpler for a small team sharing one workspace
* **No custom auth system:** rely on Supabase Auth rather than building registration/verification/session logic from scratch — saves significant time for a 5-week timeline
* **Fixed category set, not free-form AI categorization:** keeps output predictable and testable, avoids the AI inventing inconsistent categories across notes
* **No real payment integration:** access control is just "verified account or not" — there's no billing state to model

## Design Patterns in Use
* **Two distinct flows behind one shared note-input component:** the writing experience looks the same for everyone; what happens after "save" diverges based on auth state
* **Validation-before-save for AI output:** the AI's categorized response is checked against the fixed category list before it's persisted; invalid responses trigger one retry, then a graceful fallback to "General / Other"
* **Skeleton/loading states:** for AI processing time and for the note history sidebar while it loads

## Component Relationships
* **Frontend:** Pages → Layouts → Note input / Note history / Auth screens → Core UI components
* **Backend:** Routers (notes, auth-adjacent) → Services (AI categorization service, note service) → Supabase client / Gemini client