# Active Context

## Current Work Focus
Phase 3 — Hardening. We have successfully implemented seeded demo accounts, integrated dual-pass AI output validation with custom paragraph fallback mechanisms, unified backend error responses, implemented editable notes, integrated a password reset flow, added password field UX toggles/validation, added name fields on registration, and implemented an anonymous onboarding modal. Next, we will perform remaining QA bug fixes and check response times.

## Recent Changes
* Created the idempotent `backend/seed_demo.py` seeding script to initialize confirmed demo accounts (`demo@notes.com`, `test@notes.com`) pre-populated with notes for all six categories.
* Implemented double-pass AI output validation in `backend/app/services/ai.py` (checks for non-empty title/markdown, retries once, then falls back to title = raw[:50] and markdown wrapped in a paragraph).
* Unified backend error response formats to consistently return `{"error": "message"}` for HTTP exceptions, validation errors, and unhandled system failures.
* Updated frontend API utilities to read `data.error` as the primary source of error text.
* Replaced frontend `alert()` calls with state-based `setError` rendering in `page.tsx`.
* Implemented editable notes (Improvement #1): added PUT `/api/notes/{note_id}` route with user ownership check and full AI re-organization; built frontend edit mode with textarea inputs, validation, spinning loaders, and anonymous local-edit capabilities.
* Implemented password reset (Improvement #2): added `/forgot-password` and `/reset-password` views on the frontend, a forgot password redirect link on the `/login` view, and implemented POST `/api/auth/forgot-password` and POST `/api/auth/reset-password` endpoints on the backend using Supabase Auth.
* Added password field UX enhancements: implemented interactive show/hide password buttons using custom eye icons on the login, registration, and reset-password forms, and enforced matching validation check for password + confirm password fields before registration submit.
* Implemented Name Fields on Registration (Improvement #3): added required grid layout "First Name" and "Last Name" input fields above "Email" on `/register` page, stored names in `user_metadata` during Supabase signup, exposed metadata through FastAPI's `/api/auth/me` endpoint, and updated the workspace navigation header to display the user's name (falling back to email).
* Implemented Onboarding Modal for Anonymous Users (Improvement #4): created a minimalist 3-step walkthrough modal featuring Next/Back navigation, progress indicators, sign up CTA routing to `/register`, and custom illustration placeholders. Structured saved note count tracking via `sessionStorage` (shows after 1st saved note and every 4th saved note thereafter).
* Fixed Anonymous Save Flow and Onboarding Progress Dots: Modified the anonymous note save flow to clear the selection state and return the user to the blank workspace editor view instead of opening the detailed raw text view of the saved note. Rewrote the progress indicator dots in the onboarding modal as clickable button elements allowing direct navigation jumping between walkthrough steps. Dismissing the modal only closes the current instance rather than suppressing future recurring triggers.
* Implemented 30-Day Free Trial Limit: Added calculation in backend endpoints (POST, PUT, and migrate) checking user's signup date (`created_at`). If 30+ days have passed, AI organization calls are skipped, and notes are saved as plain text under default category/formatting. Exposed trial status via `/api/auth/me`. Integrated frontend UI updates: added top warning banner, header trial badge, updated loading overlay description, and updated bottom editor text area instruction.
* Implemented Manual Formatting Toolbar & Split Save Actions: Added inline formatting controls (B, I, U, H1/H2, Bullet List, and Checklist) that wrap selection with markdown tags (`**`, `*`, `<u>`, `### `) or insert list prefixes (`- `, `- [ ] `). List formatting actions support single-line insertion (at cursor) or batch multi-line prefixing (across a selection range). Added `skip_ai` support to notes creation and update APIs (backend router and frontend client). Created split button views ("Save/Update with AI" and "Save/Update as-is") for active-trial authenticated users to either run note content through OpenAI GPT or preserve manual formatting under "Plain Text" category. Enforced markdown rendering (including custom underline styling) for anonymous and expired-trial notes.
* Implemented Interactive Checkboxes (Improvement #8): Added checkbox list parser to render `- [ ]`/`- [x]` checkbox items as custom, interactive buttons with line-through text styling when checked. Clicking a checkbox toggles its state and propagates changes to both `structured_content` and `raw_text` in the background (via sessionStorage or PUT update notes API using `skip_ai=True` without calling AI), ensuring instant UI updates and complete state persistence.

## Next Steps
1. Verify response times for note generation and DB operations under load.
2. Begin Phase 4 — Demo Readiness.

## Active Decisions and Considerations
* Maintain backend idempotency in database seeding so developers can run migrations/seeding safely on demand.
* Prevent silent failures at all costs — always display a clean local validation error message if the API fails.
* Ensure fallback formats are standard compliant so the markdown parser displays them properly.