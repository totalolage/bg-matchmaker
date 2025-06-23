#!/bin/bash

# Exit with 0 to build, 1 to skip

# Check if this commit has a release tag
if git describe --exact-match --tags HEAD 2>/dev/null | grep -E '^(v|release-)'; then
  echo "✅ Release tag found - proceeding with build"
  exit 0
else
  echo "⏭️ No release tag - skipping build"
  exit 1
fi