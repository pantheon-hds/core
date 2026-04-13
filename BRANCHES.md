# Branch Naming Guide

## Prefixes

| Prefix | When to use | Example |
|--------|-------------|---------|
| `feat/` | New feature or functionality | `feat/email-notifications` |
| `fix/` | Bug fix | `fix/admin-games-not-loading` |
| `refactor/` | Code improvement without behavior change | `refactor/admin-service-cleanup` |
| `docs/` | Documentation only (README, comments) | `docs/update-readme` |
| `style/` | Visual changes (CSS, UI, layout) | `style/mobile-sidebar` |
| `chore/` | Maintenance (dependencies, configs, CI) | `chore/update-dependencies` |
| `test/` | Adding or fixing tests | `test/e2e-judge-flow` |

## Rules

- Use lowercase and hyphens only: `feat/my-feature` not `feat/MyFeature`
- Keep it short and descriptive: `fix/login-redirect` not `fix/fixed-the-login-redirect-bug`
- One branch = one change. Don't mix unrelated changes in one branch.
- Delete the branch after merge — GitHub will offer this automatically.

## Workflow

1. Create branch from main: `git checkout -b feat/your-feature`
2. Make changes and commit
3. Push and open Pull Request on GitHub
4. CI runs automatically
5. Merge after green checkmark
6. Delete branch
