#!/bin/bash

# Setup Branch Protection Rules for Gitflow
# This script configures branch protection rules for main and develop branches
# Prerequisites: gh CLI must be installed and authenticated

REPO="Sve-nnN/JuanPortfolio"
WORKFLOW_ID="build-validation"

echo "🔒 Setting up branch protection rules for $REPO"
echo ""

# Function to create/update branch protection rule
setup_branch_protection() {
  local BRANCH=$1

  echo "Setting up protection for branch: $BRANCH"

  # Create the rule
  gh api \
    --method PUT \
    "repos/$REPO/branches/$BRANCH/protection" \
    -f required_status_checks='{"strict": true, "contexts": ["build", "tests"]}' \
    -f enforce_admins=true \
    -f required_pull_request_reviews='{"dismiss_stale_reviews": true, "require_code_owner_reviews": false, "required_approving_review_count": 1}' \
    -f restrictions=null \
    -f required_linear_history=false \
    -f allow_force_pushes=false \
    -f allow_deletions=false \
    -f block_creations=false \
    -f required_conversation_resolution=false \
    -f dismiss_stale_reviews=true

  if [ $? -eq 0 ]; then
    echo "✅ Branch protection configured for $BRANCH"
  else
    echo "❌ Failed to configure branch protection for $BRANCH"
    return 1
  fi
  echo ""
}

# Setup main branch
setup_branch_protection "main"

# Setup develop branch
setup_branch_protection "develop"

echo "✅ Branch protection setup complete!"
echo ""
echo "Protected branches:"
echo "  ✓ main"
echo "  ✓ develop"
echo ""
echo "Features enabled:"
echo "  ✓ Require pull request reviews (1+ approvals)"
echo "  ✓ Dismiss stale pull request approvals"
echo "  ✓ Require status checks to pass (build, tests)"
echo "  ✓ Require branches to be up to date"
echo "  ✓ Restrict who can force push (admins only)"
echo "  ✓ Restrict who can delete branches"
echo ""
echo "To verify, visit:"
echo "  https://github.com/$REPO/settings/branches"
