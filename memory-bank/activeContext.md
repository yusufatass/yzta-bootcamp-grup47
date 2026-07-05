# Active Context

## Current Work Focus
Phase 2 — Breadth & Polish. The core loop (user authentication, notes database persistence, anonymous sessionStorage migration, and OpenAI GPT-4o Mini note organization) is complete. Next is prompt template refinement and general UI styling polish.

## Recent Changes
* Created the OpenAI GPT-4o Mini analyzer service (`backend/app/services/ai.py`) to categorize and structure note content with JSON schema retry validations.
* Wired the AI service into backend note creation and migration database pipelines.
* Built a custom React markdown rendering parser to display structured note summaries in the workspace.
* Implemented an "Organizing your note..." client loading screen during note submission.
* Integrated color-coded category badges on sidebar cards.

## Next Steps
1. Refine the AI prompt template and test categorization across multiple edge cases.
2. Conduct a general UI/UX polish pass to align with the calm/minimalist direction.
3. Establish seeding scripts for verified demo accounts.


## Active Decisions and Considerations
* Anonymous users must be blocked from the AI pipeline at the backend, not just hidden in the UI — this needs to be true from the first version of the notes endpoint, not patched in later
* Keep the AI prompt single and general-purpose; resist the urge to special-case each note type in code
* Demo reliability matters — plan to seed verified demo accounts well before Phase 4 rather than relying on live signup during the presentation