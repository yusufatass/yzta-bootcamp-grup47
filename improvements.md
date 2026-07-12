# Phase 2+ Improvements

A running list of feature improvements to work through one at a time. Complete each item, test it, push it, then check it off before moving to the next. Do not batch these into a single implementation pass.

## Priority Order

### 1. Editable notes (highest value) — DONE
- [x] Allow an authenticated user to edit a note after it has been saved
- **Decision made:** Editing does NOT re-run AI on every keystroke. The user edits the raw text freely, then triggers a single "Update" action. On update, the AI re-processes the ENTIRE note (not a merge) and overwrites category + structured_content.
- **Technical note:** Reuses the existing "raw text → AI → organize → save" flow, but as an UPDATE (PUT /api/notes/{id}) instead of a CREATE. Anonymous notes remain locally editable with no AI.

### 2. Password reset ("forgot password") — DONE
- [x] "Forgot password?" flow using Supabase Auth's built-in password reset
- Added /forgot-password and /reset-password pages. Also added show/hide password toggle across all password fields and a confirm-password field on registration.

### 3. Name fields on registration — DONE
- [x] First name + last name fields on the register form
- Stored as Supabase user metadata, exposed via /api/auth/me, shown in the top-right header. Falls back to email for older accounts without name metadata.

### 4. Onboarding + free trial — DONE
- [x] Onboarding modal for anonymous users (1st note, then every 4th note; recurring reminder, dismiss only closes the current instance)
- [x] Real 30-day trial limit: AI works for 30 days from signup, then disables with a "trial ended" message. Notes still save as plain text after expiry. No real billing — simulated for the demo.
- [x] Mascot illustrations wired in (see item 15) — no longer placeholders.

### 5. Database storage structure review — RESOLVED, no change needed
- **Concern:** Storing notes as plain text feels insecure; an admin could read users' notes.
- **Decision:** Keep as-is. True "admin cannot read" requires client-side encryption, which is incompatible with the core AI feature (the AI must read the note to organize it). Rely on RLS (per-user access), secrets in .env, and a privacy note. Standard for AI note apps. No action.

### 6. Email verification template polish (cosmetic) — ON HOLD
- [ ] Customize the Supabase email verification template so it looks branded
- **On hold until fully finalized branding is applied everywhere else** — mascot now exists, but this remains a nice-to-have polish item.
- **Technical note:** Supabase dashboard → Authentication → Emails → Templates. Requires custom SMTP to edit templates. Low risk.

### 7. Manual formatting toolbar — DONE (scope changed)
- [x] A formatting toolbar (bold, italic, underline, headings, bullet list, checklist) is available to ALL users, making the app usable as a plain note-taking tool too.
- Authenticated users get two save actions: "Save with AI" (AI reorganizes) and "Save as-is" (keeps manual formatting, category = Plain Text, no AI). Anonymous users format manually with no AI.
- **Note:** This broadened the product positioning (now competes with general note apps like Notion/Google Keep, not just AI tools). Reflected in productContext.md, projectbrief.md, and globalrules.md.

### 8. Interactive checkboxes for list-type notes — DONE
- [x] `- [ ]` / `- [x]` markdown renders as real clickable checkboxes; toggling persists (DB for authenticated, sessionStorage for anonymous) without re-running AI.
- Works for both AI-organized notes and manually formatted / Plain Text notes. Toolbar has bullet-list and checklist buttons.

### 9. Search / filter — DONE
- [x] Search notes by title/content and filter by category (both run client-side in real-time, case-insensitive).

### 10. Delete confirmation — DONE
- [x] Custom, accessible, theme-aware delete confirmation dialog intercepting note deletions, with smooth entry transitions and note card fade-out animations.

### 11. Multi-LLM fallback (Groq primary, OpenAI fallback) — DONE
- [x] Clean provider abstraction (`AIProvider` base class, `GroqProvider` / `OpenAIProvider` subclasses) in `backend/app/services/ai.py`.
- [x] Order: try Groq (Llama 3.3, model configurable via `GROQ_MODEL` env var) with one retry → if it still fails/is invalid, fall back to OpenAI GPT-4o Mini with one retry.
- [x] Same output contract enforced for both providers (category + structured_content.title/markdown). Logs which provider served each request (no note content logged).
- [x] Verified in production logs: breaking the Groq key correctly triggers the fallback to OpenAI and the note still saves successfully.
- **Rationale:** Groq's free tier lets the whole team develop/test without burning the OpenAI budget. Roles may be swapped (OpenAI primary) closer to demo day for guaranteed quality — revisit before final demo.

### 12. Prompt quality fixes (language + tone + hallucination) — DONE, iterative
- [x] **Language leakage fix:** AI was occasionally outputting English section headings (e.g. "Executive Summary") even when the note was fully in Turkish. Strengthened the system prompt with an explicit hard rule + concrete Turkish equivalents (Summary→Özet, Overview→Genel Bakış, etc.) for ALL structural/heading vocabulary, not just note content.
- [x] **Redundant title fix:** The AI was repeating the note's title as the first heading inside structured_content.markdown. Fixed so the markdown body no longer restates the title as its first line.
- [x] **"Improve" preset — hallucination fix:** The "Improve" preset prompt was fabricating a forced "Executive Summary" section and inventing fake "(Owner: TBD, Deadline: TBD)" action item placeholders even when the original note had no such structure. This violated the core "never invent content" rule. Fixed: Executive Summary only appears if it naturally fits; owner/deadline metadata is never fabricated if absent from the source text.
- [x] **"Improve" preset — tone preservation fix:** After the hallucination fix, tone was still being flattened from casual/first-person into formal/corporate/passive-voice phrasing. Strengthened the prompt to explicitly preserve the original register (casual stays casual, first-person stays first-person) — "Improve" now means clearer writing, not corporate rewriting. Confirmed via real casual Turkish test message (coworker update) that tone is now preserved while grammar/clarity improves.
- **Ongoing:** Language-leakage and tone-matching are inherently imperfect with LLMs (especially Llama/Groq); monitor for edge cases and continue tightening the prompt if new leakage patterns appear.

### 13. Note edit / save-mode bug fixes (title drift, raw text loss, whitespace-only AI calls) — DONE, required a schema change
- [x] **Bug — title changed automatically:** Using "Restore AI version" then "Update as-is" (or generally certain save paths) was overwriting the custom/locked title. Root cause: raw editor content was being used to recompute a title fallback. Fixed so title never changes automatically when `title_is_custom` is true, across ALL save paths (Update with AI, Update as-is, after Restore raw/AI toggle).
- [x] **Bug — "Restore raw text" button permanently disappeared after one use:** Root cause was conflating two different concepts under a single `raw_text` field (the note's latest saved text vs. its very-first original unstructured text). Once `raw_text` got overwritten by an edit, the toggle's visibility check (`markdown !== raw_text`) broke permanently.
  - **Fix — DB schema change:** Added a new column `original_raw_text TEXT` to the `notes` table (Migration 002, run manually in Supabase SQL Editor). Existing rows were backfilled (`original_raw_text = raw_text` where null).
  - New field semantics: `raw_text` = always the user's most recent submitted text (updates on every save); `original_raw_text` = set once at note creation, never modified again, used only by the Restore toggle; `structured_content` = current displayed/organized content.
  - The Restore toggle now always reverts to `original_raw_text` (the true first-ever version), not the latest `raw_text`.
- [x] **Regression caught and fixed:** An earlier attempt at the above fix accidentally made "Update as-is" ignore the user's current editor content and re-save an old version instead. Corrected: "Update as-is" ALWAYS saves exactly what's currently in the editor as the note's current content; only `original_raw_text` stays untouched; title stays locked separately. All three concerns (current content / original raw text / title) are now handled independently and correctly.
- [x] **Bug — whitespace-only edits still triggered a real AI call:** The "skip if unchanged" check now compares the trimmed editor text against both `original_raw_text` and the current `structured_content.markdown`, so adding only a trailing space to either version is correctly treated as no-op (no wasted AI call).
- **Test coverage confirmed:** edit → change content → Update as-is → content updates, title unchanged; re-open edit → Restore raw text still restores the true original; toggle back → shows current AI/structured version; whitespace-only edit → AI call skipped.

### 14. "Update with AI" split button + prompt presets — DONE, then audited/hardened
- [x] Replaced the standalone "Update with AI" button with a split button: main action (default AI reorganization) + dropdown trigger (chevron) opening a preset prompt menu.
- [x] Presets implemented: 🌸 Simplify, 💡 Explain, 📝 Improve, 💬 Ask AI Assistant (custom prompt input).
- [x] Dropdown includes a search/filter input over the preset list, closes on outside click, positions itself to stay fully visible.
- [x] Backend: `prompt_type` / `custom_prompt` optional fields accepted on the update endpoint, injected as instruction overrides into the AI system prompt while preserving the core JSON output contract.
- [x] Audited afterward for: preset distinctiveness (each preset verified to produce meaningfully different output), custom prompt path fully functional (not just a placeholder), loading/error states reusing existing patterns, and — critically — confirmed the title-lock and raw_text/original_raw_text fixes from item 13 still hold correctly through this new code path (they do).
- See item 12 for the specific "Improve" preset quality fixes (hallucination + tone).

### 15. Mascot illustrations (Note Sloth) — DONE
- [x] Designed a sloth mascot ("Note Sloth") via AI image generation, iterated through several rounds (composition + color palette combination, transparent background, no baked-in text) to reach a clean, consistent, reusable asset set.
- [x] Final assets placed in `frontend/public/mascot/`: `logo.png`, `onboarding-organize.png`, `working-on.png`, `success-thumbsup.png`, `empty-state-resting.png`, `logout-goodby.png`, `spellcheck-correct.png` (reserved for a future spellcheck feature, unused for now).
- [x] Wired into: header logo, all 3 onboarding modal steps, sidebar empty state, trial-ended banner. Sized up for better visual prominence (larger hero size in onboarding, clearly visible header logo).
- [x] Fixed issues along the way: old cached/duplicate images being served (Next.js/Turbopack cache issue — resolved by clearing `.next` and restarting), image aspect-ratio console warnings, empty-state image overlapping text, dark/light theme visibility.
- **Backlog carried over:** email template branding (item 6) can now be revisited since the visual identity exists, but remains optional/on-hold for now.

### 16. Light/dark theme — DONE, required real debugging
- [x] Toggle button (sun/moon) in header, persisted in localStorage, defaults to dark, class-based (`.dark` on `<html>`) rather than relying on `prefers-color-scheme`.
- [x] **Root cause found and fixed:** `dark:` utility classes were still responding to the OS-level `prefers-color-scheme` media query instead of the `.dark` class, so toggling did nothing visible when the OS was in dark mode. Fixed the Tailwind v4 + Next.js 16 + Turbopack class-based dark mode configuration, and made `ThemeProvider` explicitly sync the `.dark` class to `document.documentElement` on mount (hydration was silently stripping the class).
- [x] Full theme audit across every screen (workspace, sidebar, note detail, onboarding, all auth pages, banners, loading states) — found and fixed several invalid/typo Tailwind classes (e.g. `bg-zinc-455`, `text-zinc-650`, `text-zinc-808`) that were silently failing to apply any style at all.
- **Dev note:** Turbopack cache can go stale after CSS/asset changes — clearing `.next` and restarting `npm run dev` is a recurring fix for "changes not showing up" issues (came up for both theme and mascot image issues).

## Backlog (not yet started)
- **Email verification template branding (item 6):** optional polish, mascot/visual identity now exists so this is unblocked whenever there's time.
- **OCR note-taking (photographed handwritten notes → text):** roadmap discussed (EasyOCR vs PaddleOCR, new image upload endpoint, OCR output feeds into the existing raw-text editor rather than skipping straight to AI). Not started — treat as its own mini-phase (~3-4 days), and test the chosen OCR library in a deployment-like environment early, not just localhost, since heavy OCR dependencies can behave differently under Render/Railway-style hosting.
- **Internationalization (i18n) — IN PROGRESS:** `next-intl` setup, EN (source) + TR, language switcher in header persisted in localStorage. Stage 1 (infra + switcher + main workspace + login/register) requested — check progress.md for exact current translation coverage before continuing. Remaining screens to translate in a follow-up stage: onboarding modal, note detail view, forgot/reset password, verify page, delete confirmation dialog, AI prompt dropdown, trial banner.
- **Deployment:** still not done. Vercel (frontend) + Render/Railway (backend) planned. This has been repeatedly flagged as the highest-priority remaining risk — the app has only ever run on localhost. Recommended to deploy before adding further scope, especially before OCR (to catch hosting-environment issues with heavy dependencies early).

## Working Rules
- One item at a time: implement → test manually → check off here → next.
- The AI agent must NOT run git push or commit. The project lead handles all git operations manually.
- Update progress.md and activeContext.md as normal when a feature is completed.
- Do not delay deployment to the final days — get a live URL up while there's still time to fix issues.
- When fixing a "regression" or bug that keeps resurfacing (e.g. title drift, raw text loss), look for a shared root cause before patching symptoms individually — several of the trickiest bugs in this project turned out to share one underlying cause (see items 12 and 13).