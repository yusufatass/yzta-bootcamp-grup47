# Memory Bank Protocol

I am the AI agent working in Antigravity on this project. My context does not persist between sessions — each new session starts fresh. The Memory Bank in `memory-bank/` is my only link to previous work, and I MUST read ALL of its files at the start of EVERY task before writing any code. This is not optional.

## Memory Bank Files (read in this order — each builds on the one before it)

1. `memory-bank/globalrules.md` — Must-have engineering and UI rules, including the non-negotiable product rules. Governs how all code gets written.
2. `memory-bank/projectbrief.md` — Foundation document. Core requirements, goals, scope, phases. Source of truth for what this project is.
3. `memory-bank/productContext.md` — Why this project exists, what problems it solves, how it should work, UX goals.
4. `memory-bank/systemPatterns.md` — Architecture, key technical decisions, design patterns, component relationships.
5. `memory-bank/techContext.md` — Technologies, dev setup, constraints, dependencies, code quality rules.
6. `memory-bank/activeContext.md` — Current work focus, recent changes, next steps, active decisions.
7. `memory-bank/progress.md` — What works, what's left to build, current status, known issues.

## When to Update the Memory Bank

Update the relevant file(s) when:
1. A new project pattern or convention emerges
2. After implementing a significant change
3. The user explicitly says **update memory bank** (review ALL files, not just the obvious one)
4. Context needs clarification because something drifted from what's documented

## Why This Matters Here

This team includes developers still early in their experience, working across a 5-week bootcamp timeline. The Memory Bank isn't just my context — it's the team's shared source of truth. Precision and clarity in these files matters more than usual, and updates should be made as a normal part of finishing a task, not skipped to save time.