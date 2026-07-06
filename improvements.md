# Phase 2+ Improvements
 
A running list of feature improvements to work through one at a time. Complete each item, test it, push it, then check it off before moving to the next. Do not batch these into a single implementation pass.
 
## Priority Order
 
### 1. Editable notes (highest value)
- [x] Allow an authenticated user to edit a note after it has been saved
- **Decision made:** Editing does NOT re-run AI on every keystroke. The user edits the raw text freely, then triggers a single "Update" action. On update, the AI re-processes the ENTIRE note (not a merge) and overwrites category + structured_content.
- **Technical note:** Reuse the existing "raw text → AI → organize → save" flow, but as an UPDATE on the existing note (PUT/PATCH on /api/notes/{id}) instead of a CREATE. No new merge logic needed.
- Anonymous notes remain plain-text and freely editable locally (no AI), consistent with current behavior.
### 2. Password reset ("forgot password")
- [x] Add a "Forgot password?" flow using Supabase Auth's built-in password reset
- **Technical note:** Supabase Auth provides this natively — request reset email, handle the reset link, set new password. Add /forgot-password and /reset-password pages.
### 3. Name fields on registration
- [x] Add first name + last name fields to the register form
- **Technical note:** Store as Supabase user metadata (user_metadata) during signup. Expose via /api/auth/me. Display the user's name in the top-right header instead of (or alongside) the email.
### 4. Onboarding + free trial messaging
- [x] Show an onboarding screen at the moment an anonymous user saves their first note
- **Content:** Introduce the AI feature and highlight the free trial offer to encourage signup.
- **Decision:** The trial is a real (simple) time limit, not just messaging. On registration, record the signup date. AI features work for 30 days from signup. After 30 days, AI access is disabled and the user sees a "trial ended" message. No real billing — this is purely to encourage signup and simulate a freemium model. Given this is a bootcamp project reviewed by a small evaluation team, a simple date check is enough.
- **Technical note:** Check (now - signup_date) < 30 days before allowing AI calls in the notes endpoint. Signup date is available from Supabase Auth user data.
### 5. Database storage structure review — RESOLVED, no change needed
- **Concern raised:** Storing notes as plain text feels insecure/unprofessional; an admin could read users' notes.
- **Decision:** Keep notes as-is (plain text in the DB). True "admin cannot read" would require client-side encryption, which is fundamentally incompatible with the core AI feature — the AI must be able to read note content to organize it. If notes were encrypted, they could not be sent to the AI at all.
- **What we rely on instead (standard for AI note apps like Notion AI, Google Keep):** RLS restricts per-user access (done), secrets kept in .env (done), and a privacy note stating notes are processed by AI. This is an acceptable, defensible standard for this project.
- **Action:** None. Do not build client-side encryption — it would break the main feature and blow up scope.
### 6. Email verification template polish (cosmetic)
- [ ] Customize the Supabase email verification template so it looks branded, not plain
- **Technical note:** Done via Supabase dashboard → Authentication → Emails → Templates. Requires custom SMTP setup to edit templates. Low risk, cosmetic.
### 7. Anonymous manual formatting toolbar (lowest priority — reconsider)
- [ ] A formatting bar (bold, italic, underline, headings) for anonymous users
- **Caution:** The product's core promise is "you don't format, the AI does." Giving anonymous users a manual formatting toolbar slightly contradicts that message. Discuss whether this is worth building before starting.
### 8. Interactive checkboxes for list-type notes
- [ ] Render `- [ ]` markdown as real clickable checkboxes (not plain text)
- Most valuable for Shopping List and Daily Plan categories — let users check off items
- Technical note: checkbox state needs to persist (save checked state back to the note)
## Working Rules
- One item at a time: implement → test manually → check off here → next.
- The AI agent must NOT run git push or commit. The project lead handles all git operations manually.
- Update progress.md and activeContext.md as normal when a feature is completed.
- Do not start deployment until this list is at a good stopping point — but do not delay deployment to the final days either.