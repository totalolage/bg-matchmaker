#!/usr/bin/env bun

import fs from "fs";
import { execSync } from "child_process";
import path from "path";

// Get the commit message file path from command line arguments
const commitMsgFile = process.argv[2];

if (!commitMsgFile) {
  console.error("Missing commit message file argument");
  process.exit(1);
}

// Read the current commit message
let commitMsg = "";
try {
  commitMsg = fs.readFileSync(commitMsgFile, "utf8");
} catch (error) {
  console.error("Failed to read commit message file:", error);
  process.exit(1);
}

// Check if version bump is already specified
if (commitMsg.match(/\[version:(patch|minor|major)\]/)) {
  // Version bump already specified, don't override
  process.exit(0);
}

// Get staged changes
let stagedDiff = "";
try {
  stagedDiff = execSync("git diff --staged", {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 10,
  });
} catch (error) {
  console.error("Failed to get staged diff:", error);
  process.exit(1);
}

// If no staged changes, skip
if (!stagedDiff.trim()) {
  process.exit(0);
}

// Function to analyze changes and determine version bump
function analyzeVersionBump(diff: string) {
  // Basic heuristics for version bump detection
  const lines = diff.split("\n");

  let hasBreakingChanges = false;
  let hasNewFeatures = false;
  let hasBugFixes = false;

  // Check for breaking changes indicators
  const breakingPatterns = [
    /BREAKING CHANGE:/i,
    /\bremove[d]?\s+\w+\s+(api|interface|method|function|export)/i,
    /\brename[d]?\s+\w+\s+(api|interface|method|function|export)/i,
    /\bchange[d]?\s+\w+\s+(signature|interface|api)/i,
    /\bdeprecate[d]?\s+and\s+remove[d]?/i,
    /\bdelete[d]?\s+\w+\s+(api|interface|method|function|export)/i,
  ];

  // Check for new feature indicators
  const featurePatterns = [
    /\+\s*(export\s+)?(function|const|class|interface|type)\s+\w+/,
    /\+\s*app\.(get|post|put|delete|patch)\(/,
    /\+\s*router\.(get|post|put|delete|patch)\(/,
    /feat:/i,
    /feature:/i,
    /add(ed|ing)?\s+new\s+/i,
    /implement(ed|ing)?\s+/i,
    /create[d]?\s+new\s+/i,
  ];

  // Check for bug fix indicators
  const bugFixPatterns = [
    /fix(es|ed|ing)?[:]/i,
    /bug\s*fix/i,
    /patch(es|ed|ing)?[:]/i,
    /resolve[d]?\s+(issue|bug|problem)/i,
    /correct(s|ed|ing)?\s+/i,
  ];

  for (const line of lines) {
    if (breakingPatterns.some(pattern => pattern.test(line))) {
      hasBreakingChanges = true;
    }
    if (featurePatterns.some(pattern => pattern.test(line))) {
      hasNewFeatures = true;
    }
    if (bugFixPatterns.some(pattern => pattern.test(line))) {
      hasBugFixes = true;
    }
  }

  // Check for specific file patterns
  if (
    diff.includes("package.json") &&
    (diff.includes('"dependencies"') || diff.includes('"peerDependencies"'))
  ) {
    // Dependency changes might be breaking
    const depChanges = diff.match(/[-+]\s*"[^"]+"\s*:\s*"[^"]+"/g) || [];
    for (const change of depChanges) {
      if (change.startsWith("-")) {
        // Removing a dependency is potentially breaking
        hasBreakingChanges = true;
      }
    }
  }

  // Determine version bump
  if (hasBreakingChanges) {
    return "major";
  } else if (hasNewFeatures) {
    return "minor";
  } else if (hasBugFixes || stagedDiff.trim()) {
    return "patch";
  }

  return "patch"; // Default to patch
}

// Try to use Claude API if available
async function getClaudeAnalysis(diff: string) {
  // Check if claude CLI is available
  try {
    execSync("which claude", { stdio: "ignore" });
  } catch {
    // Claude CLI not available, fall back to heuristics
    return null;
  }

  // Create a temporary file with the prompt
  const tempFile = path.join(
    process.env.TMPDIR || "/tmp",
    `claude-prompt-${Date.now()}.txt`,
  );
  const prompt = `Analyze the following git diff and determine what semver bump it constitutes. Consider:
- Breaking changes that would require a major version bump
- New features that would require a minor version bump  
- Bug fixes or minor changes that would require a patch version bump

Output only one word: "major", "minor", or "patch".

Git diff:
${diff.substring(0, 50000)}`; // Limit diff size to avoid token limits

  try {
    fs.writeFileSync(tempFile, prompt);
    const result = execSync(`claude --model sonnet --print < "${tempFile}"`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"], // Ignore stderr
    })
      .trim()
      .toLowerCase();

    fs.unlinkSync(tempFile);

    if (["major", "minor", "patch"].includes(result)) {
      return result;
    }
  } catch (error) {
    // Claude analysis failed, fall back to heuristics
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }

  return null;
}

// Main execution
(async () => {
  let versionBump = "patch";

  // Try Claude first if available
  const claudeResult = await getClaudeAnalysis(stagedDiff);
  if (claudeResult) {
    versionBump = claudeResult;
  } else {
    // Fall back to heuristic analysis
    versionBump = analyzeVersionBump(stagedDiff);
  }

  // Append version bump to commit message
  const updatedMsg = commitMsg.trimEnd() + `\n\n[version:${versionBump}]`;

  try {
    fs.writeFileSync(commitMsgFile, updatedMsg);
  } catch (error) {
    console.error("Failed to update commit message:", error);
    process.exit(1);
  }

  process.exit(0);
})();
