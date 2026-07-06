# Progress

## Current Status
Phase 3 (Hardening) is in progress. We have successfully implemented a global light/dark theme toggle (Improvement #6), created idempotent seeding scripts for demo user accounts, implemented robust title/markdown validation with a safe fallback mechanism, unified backend error responses, implemented fully editable notes (Improvement #1), added a password reset flow (Improvement #2), added password field UX toggles/validation enhancements, implemented First Name/Last Name registration and display (Improvement #3), and implemented an onboarding modal walkthrough for anonymous users (Improvement #4).

## What Works
* Monorepo folder structure (`frontend/`, `backend/`)
* Next.js frontend rendering a clean note-taking application (builds successfully)
* FastAPI backend with a working `/health` health-check endpoint (runs successfully)
* Root `.gitignore` and `.env.example` configurations in place
* Branch strategy (`CONTRIBUTING.md`) and PR template (`.github/PULL_REQUEST_TEMPLATE.md`)
* Supabase manual setup guide (`backend/SUPABASE_SETUP.md`) and database schema (`backend/schema.sql`)
* API contract specifications (`backend/API_CONTRACT.md`)
* Authentication System: User registration, login, and verification state management across Next.js and FastAPI using Supabase Auth.
* OpenAI GPT-4o Mini integration with resilient formatting prompts for all six note types (Shopping List, Meeting Notes, Lecture Notes, Daily Plan, Travel List, General / Other).
* Inline validation and edge-case handling (rejection of notes under 10 chars, truncation of notes over 4000 chars).
* Polished minimalist visual design with smooth indicator animations, responsive sidebar layout, and sticky glassmorphic navigation header.
* Automated seeding script (`backend/seed_demo.py`) creating verified, pre-confirmed demo accounts (`demo@notes.com`, `test@notes.com`) with realistic notes.
* Comprehensive global exception handlers returning consistent `{"error": "message"}` structures.
* Strict AI output validation ensuring `title` and `markdown` exist, with double-pass retry logic and paragraph fallbacks.
* Editable Notes: Authenticated users can edit their own notes and trigger full AI re-organization via PUT. Anonymous users can edit notes locally in plaintext.
* Password Reset: Native reset-password email triggers and JWT token recovery logic for updating passwords.
* Password UX Enhancements: Show/hide eye icon toggles across login, registration, and reset-password forms, with strict confirm-password match validation on registration.
* Name Fields Registration: First Name + Last Name collected during signup, stored in Supabase user metadata, returned via GET `/api/auth/me`, and displayed in the main workspace header (falling back to email).
* Anonymous Onboarding Modal: A 3-step feature tour modal triggering on the 1st note save and every 4th note save thereafter for anonymous users. Dismissing the modal closes the current instance but does not suppress future recurring triggers. Interactive progress dots allow users to jump directly to any step.
* Anonymous Note Creation Flow: Saving a note in anonymous mode correctly clears inputs and returns the user to the clean, empty note creation editor form while adding the note to the history sidebar.
* 30-Day Free Trial Flow: Calculates remaining trial duration based on Supabase user registration date. If the trial is active, notes are structured using OpenAI GPT-4o Mini. If 30+ days have passed, AI formatting is skipped, notes are saved as Plain Text, and clear warning banners and UI messages notify the user.
* Manual Formatting Toolbar & Split Save Actions: Added inline markdown formatting controls (Bold, Italic, Underline, Heading, Bullet List, and Checklist) above the note inputs for both creation and editing modes. The list buttons support inserting formatting at the start of the current line or batch-prefixing multiple selected lines. Implemented split save actions ("Save with AI" and "Save as-is") for authenticated users to choose between automated AI categorization and preserving their manual formatting without AI. Enabled plain text markdown rendering for anonymous and trial-expired users with custom `<u>` tag parsing support.
* Interactive Checkboxes: Detects markdown checkbox syntax (`- [ ]`, `- [x]`, `* [ ]`, `* [x]`) and renders them as real, styled clickable checkboxes. Clicking a checkbox toggles its state (visually applying checkmarks and line-through text styling) and persists the updated markdown in the background (to the database for authenticated users and `sessionStorage` for anonymous users) without re-triggering AI processing.
* Global Theme Toggle (Light/Dark): A fully functioning theme-toggle (sun/moon icon button) in the header (visible to all users), persisting choices in `localStorage` and defaulting to dark mode. Leverages custom-variant class-based styling for Tailwind v4 and prevents flash-on-load via an inlined blocking head script. Applies cleanly to all routes, dialogs, badges, checklists, custom title forms, and the onboarding walkthrough.


## What's Left to Build

### Phase 0 — Foundation
- [x] Repo + monorepo structure (`frontend/`, `backend/`) and hello-world setup
- [x] Branch strategy and PR template
- [x] Supabase project setup (Auth + draft schema)
- [x] API contract draft (frontend ⇄ backend)
- [x] Early AI categorization prompt experiments (standalone, not wired in)

### Phase 1 — Core Loop
- [x] Register / login / email verification flow
- [x] Note submission endpoint (authenticated)
- [x] AI categorization service (OpenAI GPT integration)
- [x] Note result display on frontend
- [x] Persistent storage of categorized notes
- [x] Anonymous sessionStorage note flow

### Phase 2 — Breadth & Polish
- [x] AI prompt refined and tested across all category templates
- [x] Note history sidebar (both modes)
- [x] Client-side real-time Search and Category Filtering in note history sidebar (authenticated users)
- [x] Manual inline title rename (click pencil icon → edit → Enter/blur to save; AI updates preserve custom title via title_is_custom flag)
- [x] UI polish pass (calm/minimal direction)
- [x] Basic edge case handling (empty/short/long input)


### Phase 3 — Hardening
- [x] QA bug fixes
- [x] AI output validation/retry logic
- [x] Skip redundant update when raw text is unchanged ("Update with AI" / "Update as-is" no-ops if content hasn't changed)
- [x] Global light/dark theme toggle (Improvement #6)
- [ ] Response time check
- [x] Seeded demo accounts

### Phase 4 — Demo Readiness
- [ ] Final pitch materials
- [ ] Deployment finalized
- [ ] README
- [ ] Demo rehearsal

## Known Issues
* Users must add a valid `OPENAI_API_KEY` to the `backend/.env` file to trigger the actual AI note-organizing features. Without it, the application falls back gracefully with a configuration warning.