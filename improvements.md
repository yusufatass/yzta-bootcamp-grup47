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
- **Pending:** Mascot illustrations are placeholders (solid black boxes) until the mascot is finalized.

### 5. Database storage structure review — RESOLVED, no change needed
- **Concern:** Storing notes as plain text feels insecure; an admin could read users' notes.
- **Decision:** Keep as-is. True "admin cannot read" requires client-side encryption, which is incompatible with the core AI feature (the AI must read the note to organize it). Rely on RLS (per-user access), secrets in .env, and a privacy note. Standard for AI note apps. No action.

### 6. Email verification template polish (cosmetic) — ON HOLD
- [ ] Customize the Supabase email verification template so it looks branded
- **On hold until the mascot/branding is finalized** — easier to design once visual identity exists.
- **Technical note:** Supabase dashboard → Authentication → Emails → Templates. Requires custom SMTP to edit templates. Low risk.

### 7. Manual formatting toolbar — DONE (scope changed)
- [x] Originally scoped as "anonymous only, reconsider." Decision expanded it: a formatting toolbar (bold, italic, underline, headings, bullet list, checklist) is available to ALL users, making the app usable as a plain note-taking tool too.
- Authenticated users get two save actions: "Save with AI" (AI reorganizes) and "Save as-is" (keeps manual formatting, category = Plain Text, no AI). Anonymous users format manually with no AI.
- **Note:** This broadened the product positioning (now competes with general note apps like Notion/Google Keep, not just AI tools). Reflected in productContext.md, projectbrief.md, and globalrules.md.

### 8. Interactive checkboxes for list-type notes — DONE
- [x] `- [ ]` / `- [x]` markdown renders as real clickable checkboxes; toggling persists (DB for authenticated, sessionStorage for anonymous) without re-running AI
- Works for both AI-organized notes and manually formatted / Plain Text notes. Toolbar has bullet-list and checklist buttons.

### 9. Search / filter — DONE
- [x] Search notes by title/content and filter by category (both search query and category filters run client-side in real-time, matching queries case-insensitively).

### 10. Delete confirmation — DONE
- [x] Implement a custom, accessible, theme-aware delete confirmation dialog that intercepts note deletions, with smooth entry transitions and note card fade-out animations.

## Backlog (not yet started)
- **Mascot illustrations:** Replace placeholder boxes in the onboarding modal once the mascot is designed.

## Working Rules
- One item at a time: implement → test manually → check off here → next.
- The AI agent must NOT run git push or commit. The project lead handles all git operations manually.
- Update progress.md and activeContext.md as normal when a feature is completed.
- Do not delay deployment to the final days — get a live URL up while there's still time to fix issues.