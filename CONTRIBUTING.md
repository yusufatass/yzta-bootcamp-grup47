# Contributing Guidelines & Branch Strategy

Welcome! As a team, we follow a simple and consistent Git workflow to keep our repository clean, readable, and ready for bootcamp demo presentations.

## Branch Naming Strategy

Always create a new branch for any task or feature. Do not commit directly to the `main` branch. Use the following naming structure:

- **Features**: `feature/short-description-of-feature` (e.g. `feature/supabase-auth-setup`)
- **Bug Fixes**: `fix/short-description-of-bug` (e.g. `fix/cors-origins-issue`)
- **Documentation/Chore**: `chore/short-description` or `docs/short-description` (e.g. `docs/api-contracts`)

## Development Workflow

1. **Pull the Latest Changes**: Always start by pulling the latest changes from `main`:
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create Your Branch**: Create and switch to your branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Commit Messages**: Write clear, imperative-style commit messages:
   - *Good*: `feat: add notes submission endpoint`
   - *Good*: `fix: resolve auth validation redirect loop`
   - *Avoid*: `fixed stuff`, `updates`, `working`

4. **Update the Memory Bank**: If you introduce new system patterns, change configurations, or advance project status, update the relevant files in the `memory-bank/` folder as part of your branch's commit.

5. **Open a Pull Request**: Push your branch and open a PR on GitHub. Fill out the Pull Request template completely, including testing steps and UI screenshots (if applicable).
