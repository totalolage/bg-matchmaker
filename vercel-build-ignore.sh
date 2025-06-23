#!/usr/bin/env bash

# Exit with 0 to skip build, 1 to continue build

echo "🔍 Checking for release tags..."
CURRENT_SHA=$(git rev-parse HEAD)
echo "Current commit SHA: $CURRENT_SHA"
echo "Current commit short: $(git rev-parse --short HEAD)"

# Debug: Show Vercel environment variables
echo "VERCEL_GIT_COMMIT_SHA: ${VERCEL_GIT_COMMIT_SHA:-not set}"
echo "VERCEL_GIT_COMMIT_MESSAGE: ${VERCEL_GIT_COMMIT_MESSAGE:-not set}"
echo "VERCEL_GIT_COMMIT_REF: ${VERCEL_GIT_COMMIT_REF:-not set}"

# Check if this is a release commit based on commit message
if [ -n "$VERCEL_GIT_COMMIT_MESSAGE" ]; then
  if echo "$VERCEL_GIT_COMMIT_MESSAGE" | grep -E '^chore\(release\):'; then
    echo "✅ Release commit detected from message - proceeding with build"
    exit 1
  fi
fi

# Fetch all tags with unshallow to get full history
echo "Fetching tags with full history..."
git fetch --unshallow --tags 2>&1 || git fetch --tags 2>&1 || true

# Check if this commit has a release tag
if git describe --exact-match --tags HEAD 2>/dev/null | grep -E '^(v|release-)'; then
  TAG=$(git describe --exact-match --tags HEAD 2>/dev/null)
  echo "✅ Release tag found: $TAG - proceeding with build"
  exit 1
fi

# Check if any tags point to this commit SHA
TAGS_ON_COMMIT=$(git tag --points-at "$CURRENT_SHA" 2>/dev/null | grep -E '^(v|release-)' || true)
if [ -n "$TAGS_ON_COMMIT" ]; then
  echo "✅ Release tag(s) found on commit: $TAGS_ON_COMMIT - proceeding with build"
  exit 1
fi

echo "⏭️ No release tag or release commit - skipping build"
exit 0
