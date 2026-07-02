# Progress

## Current Status
Phase 0 complete. All deliverables have been manually verified: monorepo setup confirmed, branch strategy/PR templates established, live Supabase project configured (Auth, schema, and RLS policies active), API contracts finalized, local `.env` keys populated, and backend `/health` verified.

## What Works
* Monorepo folder structure (`frontend/`, `backend/`)
* Basic Next.js frontend rendering a clean starting screen (verifiably builds successfully)
* FastAPI backend with a working `/health` health-check endpoint (verifiably runs successfully)
* Root `.gitignore` and `.env.example` configurations in place
* Branch strategy (`CONTRIBUTING.md`) and PR template (`.github/PULL_REQUEST_TEMPLATE.md`)
* Supabase manual setup guide (`backend/SUPABASE_SETUP.md`) and database schema (`backend/schema.sql`)
* API contract specifications (`backend/API_CONTRACT.md`)
* Standalone Gemini prompt experiment script (`backend/prompt_experiment.py`)

## What's Left to Build

### Phase 0 — Foundation
- [x] Repo + monorepo structure (`frontend/`, `backend/`) and hello-world setup
- [x] Branch strategy and PR template
- [x] Supabase project setup (Auth + draft schema)
- [x] API contract draft (frontend ⇄ backend)
- [x] Early AI categorization prompt experiments (standalone, not wired in)

### Phase 1 — Core Loop
- [ ] Register / login / email verification flow
- [ ] Note submission endpoint (authenticated)
- [ ] AI categorization service (Gemini integration)
- [ ] Note result display on frontend
- [ ] Persistent storage of categorized notes
- [ ] Anonymous sessionStorage note flow

### Phase 2 — Breadth & Polish
- [ ] AI prompt refined and tested across all category templates
- [ ] Note history sidebar (both modes)
- [ ] UI polish pass (calm/minimal direction)
- [ ] Basic edge case handling (empty/short/long input)

### Phase 3 — Hardening
- [ ] QA bug fixes
- [ ] AI output validation/retry logic
- [ ] Response time check
- [ ] Seeded demo accounts

### Phase 4 — Demo Readiness
- [ ] Final pitch materials
- [ ] Deployment finalized
- [ ] README
- [ ] Demo rehearsal

## Known Issues
* None yet — project hasn't started.