# Project Brief

## Overview
An AI-assisted note-taking web application that lets users write notes exactly as they think — either writing unstructured, free-form notes and letting AI categorize and restructure them, or taking manual control to format and structure their own notes as they please. It serves as both a powerful AI organizer and a clean, plain note-taking tool.

## Core Objectives
* Make note-taking frictionless: zero setup, write immediately.
* Provide user empowerment: allow users to choose between automated AI organization ("Save with AI") and manual, as-is plain-text formatting ("Save as-is").
* Position in the note-taking landscape: bridge the gap between traditional manual note apps (like Notion or Google Keep) and modern, automated AI organizers.
* Ship a working, demoable MVP within a 5-week bootcamp timeline.
* Produce something genuinely useful and portfolio-worthy, not just a tech demo.

## Use Cases
The same general system should handle all of these — no separate hardcoded logic per type:
* Lecture / class notes (AI-organized or manually structured)
* Meeting notes (AI-summarized or typed as-is)
* Shopping lists (groceries, butcher, household items, mixed together or checked off)
* Daily plans / to-do lists
* Travel / packing lists

## Features
1. **Free-form note input & formatting toolbar** — plain text area with a lightweight toolbar (Bold, Italic, Underline, Headings) available to all users.
2. **Anonymous mode** — write and format notes with zero signup, stored only in the browser's sessionStorage for the current tab. No AI features are available.
3. **Authenticated mode** — email + password signup with email verification; once verified, users get permanent cloud storage and two explicit save options:
   * **Save with AI:** Runs the raw text through AI, structures it into one of a small set of templates, and saves it permanently.
   * **Save as-is:** Saves the note with user's manual formatting preserved under the "Plain Text" category, skipping AI processing entirely.
4. **Note history sidebar** — left-hand navigation showing past notes (session-only for anonymous, persistent for authenticated).
5. **Automatic full access on signup** — no payment screen, no real billing; verified accounts get full access (including AI-powered features for 30 days during trial) immediately.

## Scope & Constraints
* No real payment processing in this version.
* Anonymous users never get AI-organized output under any circumstance.
* AI must choose from a fixed list of categories, not invent its own.
* Single general-purpose AI flow (when AI is requested) — not separate prompts/logic per note type.
* Simulated 30-day free trial limits AI capability for accounts registered over 30 days ago, falling back to as-is plain-text saving.

## Competitive Landscape
By supporting both manual formatting and automated AI organization, the application competes not only with dedicated AI organization tools but also with general-purpose note-taking apps like **Notion**, **Obsidian**, and **Google Keep**. It serves users who want the structure of a plain note-taking application alongside the optional power of automated AI classification.

## Development Phases
* **Phase 0 — Foundation:** MVP scope lock, repo + branch setup, tech stack setup, draft API contract, Supabase project (auth + DB schema draft), first AI prompt experiments
* **Phase 1 — Core Loop:** End-to-end happy path — authenticated user writes a note, AI categorizes/structures it, result displays and persists. Anonymous sessionStorage flow built in parallel. Auth (register/login/verify) working
* **Phase 2 — Breadth & Polish:** AI prompt refined across all category templates, sidebar history for both modes, UI polish toward calm/minimal direction, basic edge case handling
* **Phase 3 — Hardening:** Bug fixing, AI output validation/retry logic, response time check, seeded demo accounts for reliable presentations
* **Phase 4 — Demo Readiness:** Final pitch, deployment finalized, README, rehearsed demo using seeded accounts — no new features, only fixes and polish