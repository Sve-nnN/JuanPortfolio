#!/bin/bash

# Setup Branch Protection Rules for Gitflow
#
# NOTE: The GitHub API has complex JSON requirements for branch protection.
# This script provides manual instructions instead.
#
# For the latest branch protection API, see:
# https://docs.github.com/en/rest/branches/branch-protection

REPO="Sve-nnN/JuanPortfolio"
DASHBOARD_URL="https://github.com/$REPO/settings/branches"

echo "🔒 Branch Protection Rules Setup"
echo "=================================="
echo ""
echo "Repository: $REPO"
echo ""
echo "⚠️  Due to GitHub API complexity, manual setup via dashboard is recommended."
echo ""
echo "Follow these steps to enable branch protection:"
echo ""
echo "1️⃣  MAIN BRANCH"
echo "   Dashboard: $DASHBOARD_URL"
echo "   - Click 'Add rule'"
echo "   - Pattern: 'main'"
echo "   - ✅ Require a pull request before merging"
echo "     - ✅ Require approvals (1+)"
echo "   - ✅ Require status checks to pass"
echo "     - ✅ Require branches to be up to date"
echo "     - Check: 'build' and 'tests' (from Build Validation workflow)"
echo "   - ✅ Restrict who can push to matching branches"
echo "     - Allow only: Administrators"
echo "   - ✅ Dismiss stale pull request approvals"
echo "   - ✅ Delete head branch on merge"
echo "   - ✅ Require conversation resolution before merging"
echo "   - Click 'Create'"
echo ""
echo "2️⃣  DEVELOP BRANCH"
echo "   - Repeat step 1️⃣  with pattern: 'develop'"
echo "   - (Same settings, but allow maintainers to push)"
echo ""
echo "3️⃣  VALIDATE"
echo "   Open: $DASHBOARD_URL"
echo "   You should see both 'main' and 'develop' listed."
echo ""
echo "✅ Once complete, both branches will be protected!"
echo ""
echo "Features will be enforced:"
echo "  • PR reviews required"
echo "  • CI/CD must pass (build + tests)"
echo "  • Branches kept up to date"
echo "  • Force push disabled"
echo "  • Branch deletion disabled"
echo "  • Stale reviews dismissed automatically"
echo ""
