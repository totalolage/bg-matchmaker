#!/usr/bin/env bash

# Exit with 0 to skip build, 1 to continue build

echo "🔍 Checking for release tags..."
echo "Current commit: $(git rev-parse --short HEAD)"

# Fetch tags if in shallow clone (Vercel does shallow clones)
git fetch --tags --depth=10 2>/dev/null || true

# Check if this commit has a release tag
if git describe --exact-match --tags HEAD 2>/dev/null | grep -E '^(v|release-)'; then
  TAG=$(git describe --exact-match --tags HEAD 2>/dev/null)
  echo "✅ Release tag found: $TAG - proceeding with build"
  exit 1
else
  echo "⏭️ No release tag - skipping build"
  exit 0
fi
