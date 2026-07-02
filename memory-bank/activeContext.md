# Active Context

## Current Work Focus
Phase 1 — Core Loop. Phase 0 is fully verified. Ready to build out the database integration, user authentication (sign up, login, verification), and raw note submission pipelines.

## Recent Changes
* Completed and manually verified all Phase 0 foundation requirements.
* Configured local `.env` files with active Supabase project credentials and a Gemini API key.
* Verified backend `/health` endpoint and local frontend development builds.

## Next Steps
1. Build the user authentication pages (Register, Login, Verification redirect) on the frontend.
2. Integrate Supabase Auth middleware on the backend to validate incoming JWTs.
3. Create the note database repository and service on the backend to save notes.
4. Implement the note submission endpoint (`POST /api/notes`) and integrate the Gemini client for categorization.
5. Set up the frontend `sessionStorage` flow for anonymous users.

## Active Decisions and Considerations
* Anonymous users must be blocked from the AI pipeline at the backend, not just hidden in the UI — this needs to be true from the first version of the notes endpoint, not patched in later
* Keep the AI prompt single and general-purpose; resist the urge to special-case each note type in code
* Demo reliability matters — plan to seed verified demo accounts well before Phase 4 rather than relying on live signup during the presentation