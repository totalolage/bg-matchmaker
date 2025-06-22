# Automated Version Bumping System

This project uses an automated version bumping system that analyzes commit messages to determine semantic version increments.

## Overview

The system consists of three main components:

1. **Pre-commit Hook**: Analyzes staged changes and suggests version bumps
2. **Commit Message Parser**: Extracts version bump levels from commit history
3. **GitHub Action**: Automatically updates package.json on the main branch

## How It Works

### Local Development

When you commit changes, the pre-commit hook (`prepare-commit-msg`) automatically:

1. Analyzes your staged changes
2. Attempts to use Claude AI (if available) to suggest an appropriate version bump
3. Falls back to heuristic analysis if Claude is not available
4. Appends `[version:patch|minor|major]` to your commit message

### Version Bump Levels

- **`patch`**: Bug fixes, minor changes, documentation updates
- **`minor`**: New features, enhancements that don't break existing functionality
- **`major`**: Breaking changes, API modifications, major refactors

### CI/CD Pipeline

When commits are pushed to the main branch:

1. GitHub Action parses all commits since the last version tag
2. Determines the highest version bump level from all commits
3. Updates package.json with the new version
4. Commits the version change back to the repository
5. Creates a release (for non-prerelease versions)

## Configuration

### Release Configuration (.versionrc.json)

```json
{
  "released": false,
  "prerelease": "alpha"
}
```

- `released`: Set to `true` to allow major version bumps (1.0.0+)
- `prerelease`: Prerelease identifier (e.g., "alpha", "beta")

### Manual Version Bumps

You can manually specify version bumps in your commit messages:

```bash
git commit -m "feat: add new feature [version:minor]"
git commit -m "fix: critical bug [version:patch]"
git commit -m "BREAKING CHANGE: new API [version:major]"
```

## Troubleshooting

### Hook Not Running

If the pre-commit hook doesn't run:

```bash
# Reinstall husky
bun run prepare
```

### Claude Integration Issues

The system works without Claude but provides better analysis with it. To enable Claude:

1. Install Claude CLI: Follow instructions at [claude.ai/code](https://claude.ai/code)
2. Ensure `claude` is in your PATH
3. The hook will automatically detect and use Claude

### Version Bump Not Applied

Check that:

1. You're pushing to the main branch
2. Your commit messages contain `[version:*]` tags
3. The GitHub Action has write permissions

### Preventing Major Version Bumps

While `released` is `false` in `.versionrc.json`, major version bumps are automatically downgraded to minor bumps to prevent premature 1.0.0 releases.

## Examples

### Feature Development

```bash
# Stage your changes
git add src/new-feature.ts

# Commit - hook will analyze and suggest version bump
git commit -m "feat: implement user authentication"
# Becomes: "feat: implement user authentication [version:minor]"
```

### Bug Fix

```bash
git add src/bug-fix.ts
git commit -m "fix: resolve login error"
# Becomes: "fix: resolve login error [version:patch]"
```

### Breaking Change

```bash
git add src/api-v2.ts
git commit -m "refactor: redesign API endpoints"
# Becomes: "refactor: redesign API endpoints [version:major]"
# Note: If released=false, this becomes [version:minor]
```

## Best Practices

1. **Let the system analyze**: Don't manually add version tags unless necessary
2. **Write clear commit messages**: The better your commit message, the better the analysis
3. **Review suggestions**: The hook suggests but doesn't force - you can always edit
4. **Use conventional commits**: Following conventional commit format improves analysis

## Disabling the System

To temporarily disable version bumping:

```bash
# Commit without hooks
git commit --no-verify -m "your message"
```

To permanently disable:

1. Remove the `.husky/prepare-commit-msg` file
2. Delete the GitHub Action workflow
