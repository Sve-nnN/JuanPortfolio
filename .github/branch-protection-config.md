# Branch Protection Rules Configuration

This document describes the branch protection rules that should be configured in the GitHub repository.

## Gitflow Structure

- **main** — Production branch
  - Protected
  - Requires PR reviews
  - Requires status checks (CI/CD)
  - No force push

- **develop** — Development/staging branch
  - Protected
  - Requires PR reviews
  - Requires status checks (CI/CD)
  - No force push

- **feature/* or feat/* branches** — Feature branches
  - Not protected (developers can force push)
  - Should be merged via PR to develop
  - Auto-delete on merge

## How to Configure via GitHub UI

### 1. Main Branch Protection

1. Go to **Settings → Branches**
2. Click **Add rule** under "Branch protection rules"
3. **Branch name pattern**: `main`
4. Enable:
   - ✅ Require a pull request before merging
     - ✅ Require approvals (1+)
     - ✅ Require review from Code Owners
   - ✅ Require status checks to pass before merging
     - ✅ Require branches to be up to date before merging
     - Search for and select: **build**, **tests** (from Build Validation workflow)
   - ✅ Restrict who can push to matching branches
     - Allow only administrators
   - ✅ Require deployment to succeed before merging
   - ✅ Enforce all the above rules for administrators
5. **Create** the rule

### 2. Develop Branch Protection

Repeat the same configuration for **develop** branch:

1. **Branch name pattern**: `develop`
2. Same settings as main (except "Restrict who can push" - allow maintainers)
3. **Create** the rule

### 3. Dismiss Stale Pull Request Approvals

- ✅ Enabled (important when CI/CD changes)

### 4. Delete Head Branches

- ✅ Automatically delete head branches after merge (cleanup)

## Enforcing Feature Branch Naming

GitHub doesn't natively enforce branch naming, but you can use:

1. **GitHub Actions** to validate branch names on push
2. **Pre-commit hooks** locally
3. **Repository guidelines** (this file serves as documentation)

### Valid Branch Names

```
feat/feature-name          ✅ Feature
fix/bug-fix-name           ✅ Bug fix
docs/documentation-update  ✅ Documentation
refactor/refactoring-name  ✅ Refactoring
chore/maintenance-task     ✅ Chore
```

Invalid:
```
feature-name               ❌ No prefix
my-random-branch          ❌ No prefix
master                    ❌ Should be main
```

## Checking Current Configuration

Run these commands to verify:

```bash
# List branch protection rules
gh api repos/Sve-nnN/JuanPortfolio/branches/main/protection

# For develop
gh api repos/Sve-nnN/JuanPortfolio/branches/develop/protection
```

## Cleanup Done

✅ Deleted branches:
- copilot/sub-pr-2
- copilot/sub-pr-2-again
- copilot/sub-pr-2-another-one
- vercel/react-server-components-cve-vu-bfqsyx

✅ Kept branches:
- main (production)
- develop (staging)
- feat/sync-content-bilingual (active feature)
- feat/topic-cluster-linking (active feature)
- feature/content-localization-and-fixes (active feature)
- feature/projects-collection (active feature)
