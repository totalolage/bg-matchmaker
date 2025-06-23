#!/usr/bin/env bash

# Exit with 0 to skip build, 1 to continue build

echo "🔍 Checking for release tags..."
CURRENT_SHA=$(git rev-parse HEAD)
echo "Current commit: $(git rev-parse --short HEAD)"

# Fetch all tags to ensure we have them
git fetch --tags --force 2>/dev/null || true

# Check if this commit has a release tag using multiple methods
# Method 1: Direct tag check
if git describe --exact-match --tags HEAD 2>/dev/null | grep -E '^(v|release-)'; then
  TAG=$(git describe --exact-match --tags HEAD 2>/dev/null)
  echo "✅ Release tag found: $TAG - proceeding with build"
  exit 1
fi

# Method 2: Check if any tags point to this commit SHA
TAGS_ON_COMMIT=$(git tag --points-at "$CURRENT_SHA" 2>/dev/null | grep -E '^(v|release-)' || true)
if [ -n "$TAGS_ON_COMMIT" ]; then
  echo "✅ Release tag(s) found on commit: $TAGS_ON_COMMIT - proceeding with build"
  exit 1
fi

echo "⏭️ No release tag - skipping build"
exit 0
