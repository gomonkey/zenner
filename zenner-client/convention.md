# Git Conventions for Zenner Client

Branch and commit message conventions for `zenner-client` to ensure consistency and clarity across the team and AI agents:

## 1. Branch Naming Conventions

### General Format

```bash
feat/<screen or page name>/<specific feature name>
```

### Examples

- **Home Page features**:
  - Root branch: `feat/home-page`
  - Calendar filter: `feat/home-page/calendar-filter`
  - Quick notes: `feat/home-page/quick-notes`
  - Eisenhower matrix bugfix: `bugfix/home-page/matrix-rendering` (use `bugfix` or `fix` for bugfix branches)

- **Other pages**:
  - Login page: `feat/login/sso-integration`
  - Settings page: `feat/settings/dark-mode-toggle`

---

## 2. Commit Message Conventions

- **No file names**: Do not include file names or file paths in commit messages (neither in the title nor in bullet points).
- **List items**: When listing changes in a commit body, start each bullet point with a verb in past form with no capitalization (e.g. `- added ...`, `- updated ...`, `- configured ...`, `- removed ...`):
  - `- added ...`
  - `- updated ...`
  - `- configured ...`
  - `- removed ...`
  - `- documented ...`

---
*Note: Always adhere to these conventions when creating branches and commits to maintain a clean and consistent project history.*
