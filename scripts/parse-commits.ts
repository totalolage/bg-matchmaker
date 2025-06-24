#!/usr/bin/env bun

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Get the last version tag in the repository
 * @returns  The last version tag or null if no tags exist
 */
function getLastVersionTag(): string | null {
  try {
    const tag = execSync("git describe --tags --abbrev=0", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"], // Capture stderr
    }).trim();
    return tag;
  } catch (error) {
    // No tags exist yet
    console.log("No version tags found, will analyze all commits");
    return null;
  }
}

/**
 * Get commit messages since the last version tag
 * @param  lastTag - The last version tag or null
 * @returns  Array of commit messages
 */
function getCommitsSince(lastTag: string | null): string[] {
  let command: string;
  if (lastTag) {
    // Get commits since last tag
    command = `git log --format=%B ${lastTag}..HEAD`;
  } else {
    // Get all commits if no tags exist
    command = "git log --format=%B";
  }

  try {
    const commits = execSync(command, { encoding: "utf8" })
      .split("\n\n")
      .filter(msg => msg.trim().length > 0);
    return commits;
  } catch (error) {
    console.error("Failed to get commit messages:", error);
    return [];
  }
}

/**
 * Extract version bump level from a commit message
 * @param  message - The commit message
 * @returns  The version bump level (major, minor, patch) or null
 */
export function extractVersionBump(message: string): string | null {
  const match = message.match(/\[version:(patch|minor|major)\]/i);
  return match ? match[1]!.toLowerCase() : null;
}

/**
 * Determine the highest version bump level from multiple levels
 * @param  levels - Array of version bump levels
 * @returns  The highest level (defaults to patch)
 */
export function getHighestBumpLevel(levels: string[]): string {
  const hierarchy = { patch: 0, minor: 1, major: 2 };
  let highest = "patch";
  let highestValue = 0;

  for (const level of levels) {
    if (level && hierarchy[level] > highestValue) {
      highest = level;
      highestValue = hierarchy[level];
    }
  }

  return highest;
}

/**
 * Check if we're in a prerelease state
 * @returns  True if in prerelease (version < 1.0.0)
 */
export function isPrerelease(): boolean {
  try {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    const version = packageJson.version;
    const major = parseInt(version.split(".")[0]);
    return major === 0;
  } catch (error) {
    console.error("Failed to read package.json:", error);
    return true; // Default to prerelease if we can't read version
  }
}

/**
 * Read release configuration
 * @returns The release configuration
 */
export function getReleaseConfig() {
  try {
    if (fs.existsSync(".versionrc.json")) {
      return JSON.parse(fs.readFileSync(".versionrc.json", "utf8"));
    }
  } catch (error) {
    console.error("Failed to read .versionrc.json:", error);
  }

  return {
    released: false,
    prerelease: "alpha",
  };
}

/**
 * Main function to parse commits and determine version bump
 */
function main() {
  const lastTag = getLastVersionTag();
  const commits = getCommitsSince(lastTag);

  if (commits.length === 0) {
    console.log("No new commits since last version");
    process.exit(0);
  }

  console.log(
    `Analyzing ${commits.length} commits since ${lastTag || "beginning"}`,
  );

  // Extract version bumps from all commits
  const versionBumps = commits
    .map(extractVersionBump)
    .filter(bump => bump !== null);

  if (versionBumps.length === 0) {
    console.log("No version bump indicators found in commit messages");
    console.log("Defaulting to patch version bump");
    console.log("::set-output name=bump::patch");
    return;
  }

  console.log(`Found version bumps: ${versionBumps.join(", ")}`);

  // Get the highest bump level
  let bumpLevel = getHighestBumpLevel(versionBumps);

  // Check if we should prevent major version bump
  const config = getReleaseConfig();
  if (!config.released && bumpLevel === "major" && isPrerelease()) {
    console.log("Preventing major version bump in prerelease state");
    console.log("Downgrading to minor version bump");
    bumpLevel = "minor";
  }

  console.log(`Final version bump level: ${bumpLevel}`);

  // Output for GitHub Actions
  if (process.env.GITHUB_ACTIONS) {
    console.log(`::set-output name=bump::${bumpLevel}`);
    // Also set as environment variable
    fs.appendFileSync(
      process.env.GITHUB_ENV ?? "development",
      `BUMP_LEVEL=${bumpLevel}\n`,
    );
  } else {
    // For local testing
    console.log(`BUMP_LEVEL=${bumpLevel}`);
  }
}

// Run the main function
if (require.main === module) {
  main();
}
