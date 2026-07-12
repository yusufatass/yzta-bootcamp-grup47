# Progress

### Current Status
Phase 3 (Hardening) is now fully completed. Phase 4 (Demo Readiness) is actively in progress with major UX enhancements: custom scrollbar for the Note History panel, custom React-controlled category filter dropdown replacing the native `<select>` element, and a new premium "Card Stack" (Not Destesi) view mode for the Note History sidebar — featuring physics-inspired stacked cards grouped by category, accordion expansion/collapse with `max-height` CSS transitions, and a minimalist view toggle button group in the sidebar header. All features have passed a full production build.

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
* Editable Notes: Authenticated users can edit their own notes and trigger full AI re-organization via PUT. Anonymous users can edit notes locally in plaintext. Added a Split Button interface for both the "Save with AI" and "Update with AI" actions, offering a context-aware AI Prompt Dropdown Menu (preset options: 🌸 Simplify, 💡 Explain, 📝 Improve, or custom instructions via 💬 Ask AI Assistant) with outside-click handling, connected to backend FastAPI models and services that parse and inject system prompts to dynamically alter LLM output. Resolved parent container clipping by switching overflow behavior to `overflow-visible` and elevating the dropdown z-index to `z-[100]`. Fixed a sidebar Note History card title rendering bug to explicitly render note titles inside semantic `<h3>` elements with balanced padding and spacing. **[2026-07-12 Audit]** Preset prompt instructions strengthened to produce meaningfully distinct outputs (Simplify → 5th-grade reading level, short sentences, no jargon; Explain → inline term clarifications, Glossary/Key Terms section, Why It Matters section; Improve → professional prose, Executive Summary section, concrete action items with owners). Backend validates `prompt_type` against a whitelist {simplify, explain, improve} returning 422 for unknown values; `custom_prompt` capped at 500 characters server-side. Frontend enforces the 500-char cap via `maxLength` + live character counter (turns red under 50 chars remaining). Escape key now closes either open dropdown and resets its state. All other areas (search filter, loading state, error handling, title lock, raw_text preservation, whitespace-only skip, theme-awareness) verified working correctly. Fixed note history sidebar item rendering: now displays a clean, markdown-stripped preview snippet of the structured content instead of the raw messy input text.
* Password Reset: Native reset-password email triggers and JWT token recovery logic for updating passwords.
* Password UX Enhancements: Show/hide eye icon toggles across login, registration, and reset-password forms, with strict confirm-password match validation on registration.
* Name Fields Registration: First Name + Last Name collected during signup, stored in Supabase user metadata, returned via GET `/api/auth/me`, and displayed in the main workspace header (falling back to email).
* Sign Out Confirmation Modal: Created a visually refined confirmation dialog featuring the waving `logout-goodby.png` sloth mascot centered above the prompt text. Redesigned buttons with "Cancel" on the left (retaining autofocus) and a synchronized soft-red premium button on the right matching the Delete Note dialog.
* Account Settings & Cascade Deletion: Created a dedicated `/settings` page for authenticated users to update first/last name profile metadata or permanently delete their account. Account deletion initiates a secure backend API that first wipes all notes from `public.notes` and then removes the user authentication record from Supabase Auth via the Admin API. Implemented a custom Delete Account Confirmation Dialog that requires confirmation, autofocuses "Cancel" on the left, handles Escape key and backdrop dismissal, and uses standard soft-red premium destructive button styling.
* Authentication Screen Navigation Fallback: Added a top-left logo + "← Back to App" navigation link pointing to the root workspace (`/`) in both the `/login` and `/register` pages, preventing users from getting trapped.
* Premium Showcase Page: A dedicated marketing feature showcase route (`/premium`) highlighting core AI functionalities with 3 detailed cards utilizing transparent mascot graphics, smooth hover elevations, and responsive grids. Added a redesigned Premium action link button in the main header navbar that is conditionally visible only for anonymous/logged-out users, styled with a modern, semi-transparent gold/amber border theme and smooth star icon hover micro-animations.
* Anonymous Onboarding Modal: A 3-step feature tour modal triggering on the 1st note save and every 4th note save thereafter for anonymous users. Dismissing the modal closes the current instance but does not suppress future recurring triggers. Interactive progress dots allow users to jump directly to any step.
* Onboarding Modal Mascot Illustrations: Integrated final transparent sloth mascot illustrations into the onboarding modal's 3-step walkthrough: Step 1 (organizing notes - `onboarding-organize.png`), Step 2 (thinking/working pose - `working-on.png`), and Step 3 (celebrating sloth - `success-thumbsup.png`), styled with clean transparency directly on the modal surface.
* Mascot Illustrations Integration: Integrated and resized final transparent mascot illustrations across the application: refined the header logo (`logo.png`) to 28px height with a compact `py-2.5` padding for a thin, modern navigation header; `empty-state-resting.png` centered in the sidebar (increased to 110px); onboarding step mascots (increased to 200px hero size inside relative aspect-ratio-safe Next.js layout fill containers); and `logout-goodby.png` in the free-trial expiration banner (increased to 24px), ensuring consistent alignment, zero console aspect-ratio warnings, and verified transparent rendering across themes.
* Anonymous Note Creation Flow: Saving a note in anonymous mode correctly clears inputs and returns the user to the clean, empty note creation editor form while adding the note to the history sidebar.
* Delete Confirmation Dialog: Intercepts note deletion actions with a custom modal, defaulting focus to Cancel to avoid accidental deletes, supporting Escape key and click-outside dismissal, animating card fade-out in the sidebar, and showing a success toast on completion.
* Decoupled Notes Schema & Save Flow Refactor (2026-07-11): Added `original_raw_text TEXT` database column to public.notes (Migration 002), populated on note creation and never modified. Updates are saved to `raw_text` and `structured_content`, leaving `original_raw_text` as the first ever unstructured note version.
* Restore Raw Text / AI Version Toggle (2026-07-11): Decoupled to toggle the editor between `original_raw_text` (with a fallback to `raw_text` for pre-migration notes) and the latest `structured_content.markdown` without any backend writes or AI calls. Supports both authenticated and anonymous note paths.
* Edit/Save Flow Bug Fixes (2026-07-11): Three bugs in `handleUpdateNoteAction` fixed: (1) title does not change on "Update as-is" saves, (2) the restore toggle button survives saves since `original_raw_text` remains untouched, and (3) whitespace-only additions do not trigger AI.
* 30-Day Free Trial Flow: Calculates remaining trial duration based on Supabase user registration date. If the trial is active, notes are structured using OpenAI GPT-4o Mini. If 30+ days have passed, AI formatting is skipped, notes are saved as Plain Text, and clear warning banners and UI messages notify the user.
* Manual Formatting Toolbar & Split Save Actions: Added inline markdown formatting controls (Bold, Italic, Underline, Heading, Bullet List, and Checklist) above the note inputs for both creation and editing modes. The list buttons support inserting formatting at the start of the current line or batch-prefixing multiple selected lines. Implemented split save actions ("Save with AI" and "Save as-is") for authenticated users to choose between automated AI categorization and preserving their manual formatting without AI. Enabled plain text markdown rendering for anonymous and trial-expired users with custom `<u>` tag parsing support.
* Interactive Checkboxes: Detects markdown checkbox syntax (`- [ ]`, `- [x]`, `* [ ]`, `* [x]`) and renders them as real, styled clickable checkboxes. Clicking a checkbox toggles its state (visually applying checkmarks and line-through text styling) and persists the updated markdown in the background (to the database for authenticated users and `sessionStorage` for anonymous users) without re-triggering AI processing.
* Global Theme Toggle (Light/Dark) & Presets panel: A fully functioning theme popover in the header. Audited and translated the settings panel (`theme.tsx`) to complete English i18n, including all preset names, labels, titles, and controls. Resolved custom theme background color collisions on note category badges by shifting them in `page.tsx` (`getCategoryColor`) to use non-overridden, high-contrast Tailwind color families (sky, purple, emerald, amber, indigo, slate) with explicit borders and semi-transparent backgrounds to maintain 100% readability across custom palettes (Sepia, Cyberpunk, Forest, Nord Ice). Persists choices in `localStorage` and prevents flash-on-load.
* Multi-LLM AI Fallback: Refactored the AI service to use a clean provider abstraction. The service attempts note analysis with Groq (Llama-3.3-70b-versatile) first, retrying once on failure. If Groq is unavailable or fails after its retry, it automatically falls back to OpenAI GPT-4o Mini. Both providers share the same validation and JSON schema contract, logging success without exposing full note contents.
* AI Prompt Quality Fixes (2026-07-12): Two production-observed issues resolved in the system prompt: (1) **Language leakage** — models would default to English structural terms ("Executive Summary", "Action Items") even in fully Turkish notes. Fixed by adding an emphatic LANGUAGE HARD REQUIREMENT block with an explicit forbidden-terms list and concrete Turkish translations for all template vocabulary. Per-category templates updated to show Turkish/English headings side-by-side, removing ambiguous "or local equivalent" guidance. (2) **Redundant title in body** — the AI would often emit the note title as the first `##` heading inside `markdown`, duplicating what the UI already renders above the content. Fixed by a new TITLE AND MARKDOWN BODY RULE instructing the model to start the markdown directly with the first real content section. Also **refactored "Improve" mode** to remove the forced "Executive Summary" (letting summaries occur naturally only for long/dense notes), stop fabricating TBD action placeholders, and **strictly preserve the author's voice, register, and grammatical perspective** (casual/first-person tone is kept casual/first-person instead of being flattened into distant passive-voice corporate speak). All changes verified live: a casual coworker message maintained first-person verbs, kept warm conversational elements (like 'valla', 'sana zahmet'), corrected typos, and avoided duplicating the title or inventing fake sections/placeholders.

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
- [x] Theme Audit & Invalid Class Typos Audited & Fixed
- [x] Delete Confirmation Dialog (Improvement #10)
- [x] Restore raw text button in edit view
- [x] Response time check
- [x] Seeded demo accounts

### Phase 4 — Demo Readiness
- [ ] Final pitch materials
- [ ] Deployment finalized
- [ ] README
- [ ] Demo rehearsal

## Known Issues
* Users must add a valid `OPENAI_API_KEY` to the `backend/.env` file to trigger the actual AI note-organizing features. Without it, the application falls back gracefully with a configuration warning.