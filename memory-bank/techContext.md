# Tech Context

## Technologies Used
* Next.js (App Router)
* React
* TypeScript
* TailwindCSS
* shadcn/ui (optional, for forms/dialogs/cards — kept minimal)
* FastAPI
* Python
* PostgreSQL (via Supabase)
* Supabase Auth (email + password, email verification)
* AI Layer: Groq API (Primary, Llama-3.3-70b-versatile) with OpenAI API (Fallback, GPT-4o Mini) — Multi-LLM provider abstraction with automatic fallback and single-retry capability.


## Development Setup
Monorepo. Distinct directories for frontend and backend:
* `frontend/` — Next.js application
* `backend/` — FastAPI application
* `memory-bank/` — project context files (this folder)
* `.antigravity/rules.md` — agent rules entry point

## Technical Constraints
* Anonymous users must never trigger a call to the AI API — this is enforced at the backend route level, not just hidden in the UI
* AI output must be constrained to the fixed category list — validate the AI's response against that list before saving; retry once if it returns something invalid
* No payment processor integration of any kind in this version
* Note content is personal — avoid logging full note text in plaintext server logs

## Dependencies
* Frontend: `next`, `react`, `tailwindcss`, `clsx`, `tailwind-merge` (`shadcn/ui` components as needed)
* Backend: `fastapi`, `uvicorn`, `pydantic`, `supabase` (Python client), `openai` (OpenAI Python SDK used for both OpenAI and Groq APIs)


## Code Quality Rules
* Type-safe architecture (TypeScript frontend, Pydantic models backend)
* Scalable, modular structure
* Clean naming, avoid spaghetti code
* Reusable abstractions and separation of concerns
* Code written to be reviewable and learnable from — most of the team is early-career