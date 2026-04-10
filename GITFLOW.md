# Gitflow Workflow

This repository uses **Gitflow** for managing branches and releases. This ensures a clean, organized branching strategy.

## Branch Structure

```
main          ← Production (always stable)
  ├── Release branches (v1.0.0, v1.1.0, etc.)
  └── Hotfixes (critical bugs in production)

develop       ← Development/Staging (integration branch)
  ├── feat/feature-name         ← New features
  ├── fix/bug-name              ← Bug fixes
  ├── docs/documentation        ← Documentation
  ├── refactor/code-changes     ← Refactoring
  ├── chore/maintenance         ← Maintenance
  └── style/formatting          ← Code style
```

## Workflow

### 1. Create a Feature Branch

Always branch from **develop**:

```bash
git checkout develop
git pull origin develop
git checkout -b feat/your-feature-name
```

**Branch naming conventions:**
- `feat/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation
- `refactor/` — Code refactoring
- `chore/` — Maintenance tasks
- `style/` — Code style/formatting
- `perf/` — Performance improvements
- `ci/` — CI/CD improvements
- `test/` — Tests

Examples:
```
feat/user-authentication
fix/header-alignment
docs/api-documentation
refactor/payment-system
chore/update-dependencies
```

### 2. Work on Your Feature

Make your commits:

```bash
git add .
git commit -m "feat(auth): add JWT token validation"
git push origin feat/your-feature-name
```

Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `ci`, `chore`

### 3. Create a Pull Request

- **Always PR from feature branch → develop** (not directly to main)
- Add description of changes
- Link related issues
- Ensure CI/CD passes
- Request review from team members

### 4. Code Review & Merge

- ✅ Get at least 1 approval
- ✅ All CI/CD checks pass
- ✅ Branch is up to date with develop
- Merge with "Squash and merge" or "Create a merge commit"
- ✅ Auto-delete head branch after merge

### 5. Release to Production

When ready to release (scheduled or on-demand):

```bash
git checkout main
git pull origin main
git merge --no-ff develop
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main
git push origin v1.0.0
```

Then merge back to develop:
```bash
git checkout develop
git merge main
git push origin develop
```

### 6. Hotfixes (Critical Bugs in Production)

For critical bugs in production:

```bash
git checkout main
git pull origin main
git checkout -b fix/critical-bug-name

# Make fix, commit, push
git add .
git commit -m "fix: critical issue description"
git push origin fix/critical-bug-name

# Create PR to main (not develop)
# After merge and release:
git checkout develop
git merge main
git push origin develop
```

## Protected Branches

Both **main** and **develop** are protected:

- ✅ Require pull request before merge
- ✅ Require status checks (CI/CD) to pass
- ✅ Require branch to be up to date
- ✅ Require code review approval
- ❌ No direct pushes allowed
- ❌ No force pushes

## GitHub Actions

### Build Validation (`.github/workflows/build-validation.yml`)
Runs on every push to main/develop and PR:
- ✅ Lint check
- ✅ Build check
- ✅ Type check
- ✅ Tests

### Branch Name Validation (`.github/workflows/validate-branch-name.yml`)
Validates branch naming convention on PR creation.

## Guidelines

### Commit Messages

Good:
```
feat(api): add user authentication endpoint
fix(header): resolve mobile layout issue
docs: update API documentation
```

Bad:
```
fixed stuff
new feature
update
work in progress
```

### Pull Requests

- Keep PRs focused on a single feature/fix
- Write clear description
- Link related issues
- Add screenshots for UI changes
- Keep commits clean (rebase if needed)

### Code Review

- Be constructive and respectful
- Approve only when confident
- Suggest improvements
- Test locally when possible

## Merging Strategy

- **Feature → Develop**: Squash and merge (keeps history clean)
- **Develop → Main**: Create a merge commit (preserves release history)
- **Hotfix → Main/Develop**: Create merge commits (important for traceability)

## Cleanup

Old/abandoned branches are deleted automatically after merge. Manual cleanup:

```bash
# Delete local branch
git branch -d feat/old-feature

# Delete remote branch
git push origin --delete feat/old-feature

# List stale branches (not updated in 30 days)
git branch -a --sort=-version:refname --merged
```

## Common Commands

```bash
# Update local branches
git fetch --all

# List all branches
git branch -a

# See recent branches
git for-each-ref --sort=-committerdate refs/remotes/ --format='%(refname:short) %(committerdate:short)'

# Delete merged branches locally
git branch --merged develop | grep -v develop | xargs git branch -d
```

## Help & Resources

- [Gitflow Cheatsheet](https://danielkummer.github.io/git-flow-cheatsheet/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow vs Git Flow](https://www.atlassian.com/git/tutorials/comparing-workflows)
