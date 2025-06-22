#!/usr/bin/env bun

const {
  extractVersionBump,
  getHighestBumpLevel,
  isPrerelease,
  getReleaseConfig,
} = require("./parse-commits.js");

console.log("Testing Version Bump System\n");

// Test 1: Extract version bump from commit messages
console.log("Test 1: Extracting version bumps from commit messages");
const testMessages = [
  { msg: "feat: add new feature [version:minor]", expected: "minor" },
  { msg: "fix: bug fix [version:patch]", expected: "patch" },
  { msg: "BREAKING CHANGE: api update [version:major]", expected: "major" },
  { msg: "chore: update deps", expected: null },
  { msg: "feat: feature [VERSION:MINOR]", expected: "minor" }, // case insensitive
];

testMessages.forEach(({ msg, expected }) => {
  const result = extractVersionBump(msg);
  const status = result === expected ? "✓" : "✗";
  console.log(
    `  ${status} "${msg}" -> ${result || "null"} (expected: ${expected || "null"})`,
  );
});

// Test 2: Get highest bump level
console.log("\nTest 2: Getting highest bump level");
const testLevels = [
  { levels: ["patch", "minor", "patch"], expected: "minor" },
  { levels: ["patch", "major", "minor"], expected: "major" },
  { levels: ["patch", "patch"], expected: "patch" },
  { levels: [], expected: "patch" }, // default
];

testLevels.forEach(({ levels, expected }) => {
  const result = getHighestBumpLevel(levels);
  const status = result === expected ? "✓" : "✗";
  console.log(
    `  ${status} [${levels.join(", ")}] -> ${result} (expected: ${expected})`,
  );
});

// Test 3: Check prerelease status
console.log("\nTest 3: Checking prerelease status");
const prereleaseStatus = isPrerelease();
console.log(
  `  Current version is ${prereleaseStatus ? "in prerelease" : "released"}`,
);

// Test 4: Read release config
console.log("\nTest 4: Reading release configuration");
const config = getReleaseConfig();
console.log(`  Released: ${config.released}`);
console.log(`  Prerelease: ${config.prerelease}`);

console.log("\n✅ All tests completed!");
