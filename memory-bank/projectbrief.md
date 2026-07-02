# Project Brief

## Overview
A web app that lets users write notes exactly as they think — unstructured, mixed, free-form — and uses AI to turn that raw text into something organized and readable: clear headings, grouped points, key items surfaced. The user's only job is to write; the app handles the rest.

## Core Objectives
* Make note-taking frictionless: zero setup, write immediately
* Use AI to remove the after-the-fact organizing work people normally skip
* Ship a working, demoable MVP within a 5-week bootcamp timeline
* Produce something genuinely useful and portfolio-worthy, not just a tech demo

## Use Cases
The same general system should handle all of these — no separate hardcoded logic per type:
* Lecture / class notes
* Meeting notes
* Shopping lists (groceries, butcher, household items, mixed together)
* Daily plans / to-do lists
* Travel / packing lists

## Features
1. **Free-form note input** — plain text area, save instantly, no formatting required from the user
2. **Anonymous mode** — write and view notes with zero signup, stored only in the browser for the current session, no AI involved
3. **Authenticated mode** — email + password signup with email verification; once verified, notes are sent to the AI, categorized into one of a fixed set of templates, restructured for readability, and stored permanently
4. **Note history sidebar** — left-hand navigation showing past notes (session-only for anonymous, persistent for authenticated)
5. **Automatic full access on signup** — no payment screen, no real billing; verified accounts get full AI access immediately

## Scope & Constraints
* No real payment processing in this version
* Anonymous users never get AI-organized output, under any circumstance
* AI must choose from a fixed list of categories, not invent its own
* Single general-purpose AI flow — not separate prompts/logic per note type

## Development Phases
* **Phase 0 — Foundation:** MVP scope lock, repo + branch setup, tech stack setup, draft API contract, Supabase project (auth + DB schema draft), first AI prompt experiments
* **Phase 1 — Core Loop:** End-to-end happy path — authenticated user writes a note, AI categorizes/structures it, result displays and persists. Anonymous sessionStorage flow built in parallel. Auth (register/login/verify) working
* **Phase 2 — Breadth & Polish:** AI prompt refined across all category templates, sidebar history for both modes, UI polish toward calm/minimal direction, basic edge case handling
* **Phase 3 — Hardening:** Bug fixing, AI output validation/retry logic, response time check, seeded demo accounts for reliable presentations
* **Phase 4 — Demo Readiness:** Final pitch, deployment finalized, README, rehearsed demo using seeded accounts — no new features, only fixes and polish