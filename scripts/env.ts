#!/usr/bin/env bun

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdtempSync,
  rmSync,
} from "fs";
import { execSync } from "child_process";
import { resolve, join } from "path";
import { tmpdir } from "os";
import readline from "readline";

// CLI colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const source = args[1]; // 'convex' or 'vercel'
const environment = args[2] || "dev";

// Show help if no command or help flag
if (!command || command === "-h" || command === "--help") {
  showHelp();
  process.exit(0);
}

// Validate command
if (!["push", "pull", "list", "sync"].includes(command)) {
  console.error(
    `${colors.red}Error: Unknown command '${command}'${colors.reset}`,
  );
  showHelp();
  process.exit(1);
}

// Validate source for push/pull/list commands
if (
  ["push", "pull", "list"].includes(command) &&
  (!source || !["convex", "vercel"].includes(source))
) {
  console.error(
    `${colors.red}Error: Source must be 'convex' or 'vercel'${colors.reset}`,
  );
  showHelp();
  process.exit(1);
}

// Validate environment
if (!["dev", "prod", "preview"].includes(environment)) {
  console.error(
    `${colors.red}Error: Environment must be 'dev', 'prod', or 'preview'${colors.reset}`,
  );
  process.exit(1);
}

// Execute command
(async () => {
  switch (command) {
    case "push":
      if (source === "convex") {
        pushEnvVarsToConvex(environment);
      } else {
        pushEnvVarsToVercel(environment);
      }
      break;
    case "pull":
      if (source === "convex") {
        await pullEnvVarsFromConvex(environment);
      } else {
        await pullEnvVarsFromVercel(environment);
      }
      break;
    case "list":
      if (source === "convex") {
        listConvexEnvVars(environment);
      } else {
        listVercelEnvVars(environment);
      }
      break;
    case "sync":
      await syncAllSources(environment);
      break;
  }
})().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});

function showHelp() {
  console.log(`
${colors.bright}Environment Variables Manager${colors.reset}

${colors.yellow}Usage:${colors.reset}
  ${colors.cyan}bun run scripts/convex-env.ts <command> [source] [environment]${colors.reset}

${colors.yellow}Commands:${colors.reset}
  ${colors.green}push <source>${colors.reset}    Push environment variables from .env.local to source
  ${colors.green}pull <source>${colors.reset}    Pull environment variables from source to .env.local
  ${colors.green}list <source>${colors.reset}    List all environment variables in source
  ${colors.green}sync${colors.reset}             Sync between all sources (local, Convex, Vercel)

${colors.yellow}Sources:${colors.reset}
  ${colors.blue}convex${colors.reset}           Convex backend
  ${colors.blue}vercel${colors.reset}           Vercel deployment

${colors.yellow}Environments:${colors.reset}
  ${colors.blue}dev${colors.reset}              Development environment (default)
  ${colors.blue}prod${colors.reset}             Production environment
  ${colors.blue}preview${colors.reset}          Preview environment (Vercel only)

${colors.yellow}Examples:${colors.reset}
  ${colors.dim}# Push to Convex development${colors.reset}
  bun run scripts/convex-env.ts push convex

  ${colors.dim}# Pull from Vercel production${colors.reset}
  bun run scripts/convex-env.ts pull vercel prod

  ${colors.dim}# Sync all sources${colors.reset}
  bun run scripts/convex-env.ts sync

${colors.yellow}Notes:${colors.reset}
  - The pull command will backup existing .env.local to .env.local.backup
  - Interactive merge prompts when values differ between sources
  - Sync command allows 3-way merge between local, Convex, and Vercel
  
${colors.yellow}Authoritative Sources:${colors.reset}
  - ${colors.magenta}VERCEL_*${colors.reset} variables always use Vercel as source
  - ${colors.cyan}CONVEX_*${colors.reset} and ${colors.cyan}VITE_CONVEX_*${colors.reset} variables always use Convex as source
  - Other variables prompt for manual resolution
`);
}

function getConvexDeploymentFlag(env: string): string {
  return env === "prod" ? "--prod" : "";
}

function getVercelEnvironment(env: string): string {
  if (env === "prod") return "production";
  if (env === "preview") return "preview";
  return "development";
}

function getAuthoritativeSource(key: string): "vercel" | "convex" | null {
  // Vercel-specific variables
  if (key.startsWith("VERCEL_")) {
    return "vercel";
  }

  // Convex-specific variables
  if (key.startsWith("CONVEX_") || key.startsWith("VITE_CONVEX_")) {
    return "convex";
  }

  // No authoritative source - require manual resolution
  return null;
}

// Convex operations
function pushEnvVarsToConvex(env: string) {
  console.log(
    `${colors.bright}Pushing environment variables to Convex (${env})...${colors.reset}\n`,
  );

  const envPath = resolve(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    console.error(
      `${colors.red}Error: .env.local file not found${colors.reset}`,
    );
    process.exit(1);
  }

  const envContent = readFileSync(envPath, "utf-8");
  const envVars = parseEnvFile(envContent);

  console.log(`Found ${envVars.size} variables to sync\n`);

  const deploymentFlag = getConvexDeploymentFlag(env);

  let successCount = 0;
  let errorCount = 0;

  for (const [key, value] of envVars) {
    try {
      process.stdout.write(`  ${colors.dim}→${colors.reset} ${key}`);

      const escapedValue = value.replace(/'/g, "'\"'\"'");
      const command = `bunx convex env set ${deploymentFlag} ${key} -- '${escapedValue}'`;

      execSync(command, { stdio: "pipe" });
      process.stdout.write(` ${colors.green}✓${colors.reset}\n`);
      successCount++;
    } catch (error) {
      process.stdout.write(` ${colors.red}✗${colors.reset}\n`);
      console.error(`     ${colors.red}Error: ${error}${colors.reset}`);
      errorCount++;
    }
  }

  console.log(
    `\n${colors.green}✅ Successfully pushed ${successCount} variables to Convex${colors.reset}`,
  );

  if (errorCount > 0) {
    console.log(
      `${colors.red}❌ Failed to push ${errorCount} variables${colors.reset}`,
    );
  }
}

function pushEnvVarsToVercel(env: string) {
  console.log(
    `${colors.bright}Pushing environment variables to Vercel (${env})...${colors.reset}\n`,
  );

  const envPath = resolve(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    console.error(
      `${colors.red}Error: .env.local file not found${colors.reset}`,
    );
    process.exit(1);
  }

  const envContent = readFileSync(envPath, "utf-8");
  const envVars = parseEnvFile(envContent);

  console.log(`Found ${envVars.size} variables to sync\n`);

  const vercelEnv = getVercelEnvironment(env);

  let successCount = 0;
  let errorCount = 0;

  for (const [key, value] of envVars) {
    try {
      process.stdout.write(`  ${colors.dim}→${colors.reset} ${key}`);

      // For Vercel, we need to use stdin to pass the value
      const command = `echo '${value.replace(/'/g, "'\"'\"'")}' | bunx vercel env add ${key} ${vercelEnv} --force`;

      execSync(command, { stdio: "pipe", shell: "/bin/bash" });
      process.stdout.write(` ${colors.green}✓${colors.reset}\n`);
      successCount++;
    } catch (error) {
      process.stdout.write(` ${colors.red}✗${colors.reset}\n`);
      console.error(`     ${colors.red}Error: ${error}${colors.reset}`);
      errorCount++;
    }
  }

  console.log(
    `\n${colors.green}✅ Successfully pushed ${successCount} variables to Vercel${colors.reset}`,
  );

  if (errorCount > 0) {
    console.log(
      `${colors.red}❌ Failed to push ${errorCount} variables${colors.reset}`,
    );
  }
}

async function pullEnvVarsFromConvex(env: string) {
  console.log(
    `${colors.bright}Pulling environment variables from Convex (${env})...${colors.reset}\n`,
  );

  const deploymentFlag = getConvexDeploymentFlag(env);

  let convexOutput: string;
  try {
    convexOutput = execSync(`bunx convex env list ${deploymentFlag}`, {
      encoding: "utf-8",
    });
  } catch (error) {
    console.error(
      `${colors.red}Error: Failed to list Convex environment variables${colors.reset}`,
    );
    console.error(error);
    process.exit(1);
  }

  const convexVars = parseConvexOutput(convexOutput);
  console.log(`Found ${convexVars.size} variables to pull\n`);

  await mergeEnvVars(convexVars, "Convex");
}

async function pullEnvVarsFromVercel(env: string) {
  console.log(
    `${colors.bright}Pulling environment variables from Vercel (${env})...${colors.reset}\n`,
  );

  const vercelEnv = getVercelEnvironment(env);

  let vercelOutput: string;
  try {
    vercelOutput = execSync(`bunx vercel env ls ${vercelEnv}`, {
      encoding: "utf-8",
    });
  } catch (error) {
    console.error(
      `${colors.red}Error: Failed to list Vercel environment variables${colors.reset}`,
    );
    console.error(error);
    process.exit(1);
  }

  const vercelVars = parseVercelOutput(vercelOutput, env);
  console.log(`Found ${vercelVars.size} variables to pull\n`);

  await mergeEnvVars(vercelVars, "Vercel");
}

async function syncAllSources(env: string) {
  console.log(
    `${colors.bright}Syncing environment variables across all sources (${env})...${colors.reset}\n`,
  );

  // Get variables from all sources
  const localVars = new Map<string, string>();
  const convexVars = new Map<string, string>();
  const vercelVars = new Map<string, string>();

  // Read local vars
  const envPath = resolve(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    const parsed = parseEnvFile(envContent);
    for (const [key, value] of parsed) {
      localVars.set(key, value);
    }
  }

  // Get Convex vars
  try {
    const deploymentFlag = getConvexDeploymentFlag(env);
    const convexOutput = execSync(`bunx convex env list ${deploymentFlag}`, {
      encoding: "utf-8",
    });
    const parsed = parseConvexOutput(convexOutput);
    for (const [key, value] of parsed) {
      convexVars.set(key, value);
    }
  } catch (error) {
    console.log(
      `${colors.yellow}Warning: Could not fetch Convex variables${colors.reset}`,
    );
  }

  // Get Vercel vars
  try {
    const vercelEnv = getVercelEnvironment(env);
    const vercelOutput = execSync(`bunx vercel env ls ${vercelEnv}`, {
      encoding: "utf-8",
    });
    const parsed = parseVercelOutput(vercelOutput, vercelEnv);
    for (const [key, value] of parsed) {
      vercelVars.set(key, value);
    }
  } catch (error) {
    console.log(
      `${colors.yellow}Warning: Could not fetch Vercel variables${colors.reset}`,
    );
  }

  console.log(`\nFound variables:`);
  console.log(
    `  ${colors.blue}Local:${colors.reset}  ${localVars.size} variables`,
  );
  console.log(
    `  ${colors.cyan}Convex:${colors.reset} ${convexVars.size} variables`,
  );
  console.log(
    `  ${colors.magenta}Vercel:${colors.reset} ${vercelVars.size} variables\n`,
  );

  console.log(
    `${colors.dim}Note: Authoritative sources will be applied automatically:${colors.reset}`,
  );
  console.log(`${colors.dim}  - VERCEL_* → Vercel${colors.reset}`);
  console.log(
    `${colors.dim}  - CONVEX_*, VITE_CONVEX_* → Convex${colors.reset}\n`,
  );

  // Perform 3-way merge
  await performThreeWayMerge(localVars, convexVars, vercelVars);
}

async function performThreeWayMerge(
  localVars: Map<string, string>,
  convexVars: Map<string, string>,
  vercelVars: Map<string, string>,
) {
  // Backup existing .env.local if it exists
  const envPath = resolve(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    const backupPath = `${envPath}.backup`;
    const content = readFileSync(envPath, "utf-8");
    writeFileSync(backupPath, content);
    console.log(
      `${colors.dim}Backed up existing .env.local to .env.local.backup${colors.reset}\n`,
    );
  }

  // Collect all unique keys
  const allKeys = new Set<string>();
  for (const key of localVars.keys()) allKeys.add(key);
  for (const key of convexVars.keys()) allKeys.add(key);
  for (const key of vercelVars.keys()) allKeys.add(key);

  // Find conflicts and handle them
  const mergedVars = new Map<string, string>();
  const conflicts: Array<{
    key: string;
    localValue?: string;
    convexValue?: string;
    vercelValue?: string;
  }> = [];

  for (const key of allKeys) {
    const localValue = localVars.get(key);
    const convexValue = convexVars.get(key);
    const vercelValue = vercelVars.get(key);

    // Check for authoritative source
    const authSource = getAuthoritativeSource(key);

    if (authSource === "vercel") {
      // Vercel is authoritative for this variable
      if (vercelValue !== undefined) {
        mergedVars.set(key, vercelValue);
        if (
          (localValue !== undefined && localValue !== vercelValue) ||
          (convexValue !== undefined && convexValue !== vercelValue)
        ) {
          console.log(
            `  ${colors.dim}→${colors.reset} ${key} ${colors.magenta}(using Vercel - authoritative)${colors.reset}`,
          );
        }
      } else if (localValue !== undefined) {
        // Vercel doesn't have it but local does - keep local
        mergedVars.set(key, localValue);
        console.log(
          `  ${colors.dim}→${colors.reset} ${key} ${colors.yellow}(Vercel authoritative but not present - keeping local)${colors.reset}`,
        );
      }
    } else if (authSource === "convex") {
      // Convex is authoritative for this variable
      if (convexValue !== undefined) {
        mergedVars.set(key, convexValue);
        if (
          (localValue !== undefined && localValue !== convexValue) ||
          (vercelValue !== undefined && vercelValue !== convexValue)
        ) {
          console.log(
            `  ${colors.dim}→${colors.reset} ${key} ${colors.cyan}(using Convex - authoritative)${colors.reset}`,
          );
        }
      } else if (localValue !== undefined) {
        // Convex doesn't have it but local does - keep local
        mergedVars.set(key, localValue);
        console.log(
          `  ${colors.dim}→${colors.reset} ${key} ${colors.yellow}(Convex authoritative but not present - keeping local)${colors.reset}`,
        );
      }
    } else {
      // No authoritative source, handle normally
      const uniqueValues = new Set(
        [localValue, convexValue, vercelValue].filter(v => v !== undefined),
      );

      if (uniqueValues.size === 1) {
        // All sources agree (or only one source has this key)
        mergedVars.set(key, uniqueValues.values().next().value!);
      } else if (uniqueValues.size > 1) {
        // Conflict detected and no authoritative source
        conflicts.push({ key, localValue, convexValue, vercelValue });
      }
    }
  }

  // Handle conflicts interactively
  if (conflicts.length > 0) {
    console.log(
      `${colors.yellow}Found ${conflicts.length} conflicting variables:${colors.reset}\n`,
    );

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    for (const conflict of conflicts) {
      await displayThreeWayConflict(conflict);

      const answer = await new Promise<string>(resolve => {
        const options: string[] = [];
        if (conflict.localValue !== undefined)
          options.push(`${colors.blue}[L]ocal${colors.reset}`);
        if (conflict.convexValue !== undefined)
          options.push(`${colors.cyan}[C]onvex${colors.reset}`);
        if (conflict.vercelValue !== undefined)
          options.push(`${colors.magenta}[V]ercel${colors.reset}`);
        options.push(`${colors.yellow}[S]kip${colors.reset}`);

        rl.question(`\nChoose ${options.join(", ")}: `, ans =>
          resolve(ans.toLowerCase()),
        );
      });

      if (answer === "l" && conflict.localValue !== undefined) {
        mergedVars.set(conflict.key, conflict.localValue);
        console.log(`  ${colors.dim}→${colors.reset} Using local value`);
      } else if (answer === "c" && conflict.convexValue !== undefined) {
        mergedVars.set(conflict.key, conflict.convexValue);
        console.log(`  ${colors.dim}←${colors.reset} Using Convex value`);
      } else if (answer === "v" && conflict.vercelValue !== undefined) {
        mergedVars.set(conflict.key, conflict.vercelValue);
        console.log(`  ${colors.dim}←${colors.reset} Using Vercel value`);
      } else if (answer === "s") {
        console.log(`  ${colors.dim}✗${colors.reset} Skipped`);
      } else {
        // Default to local if available
        if (conflict.localValue !== undefined) {
          mergedVars.set(conflict.key, conflict.localValue);
          console.log(
            `  ${colors.dim}→${colors.reset} Using local value (default)`,
          );
        } else {
          console.log(
            `  ${colors.dim}✗${colors.reset} Skipped (no local value)`,
          );
        }
      }
    }

    rl.close();
    console.log("");
  }

  // Write merged content
  let newContent = "";
  for (const [key, value] of mergedVars) {
    // Quote value if needed
    let quotedValue = value;
    if (
      value.includes(" ") ||
      value.includes("\n") ||
      value.includes('"') ||
      value.includes("'")
    ) {
      quotedValue = `"${value.replace(/"/g, '\\"')}"`;
    }

    newContent += `${key}=${quotedValue}\n`;
  }

  writeFileSync(envPath, newContent);
  console.log(
    `\n${colors.green}✅ Successfully merged environment variables to .env.local${colors.reset}`,
  );
}

async function mergeEnvVars(pullVars: Map<string, string>, sourceName: string) {
  const envPath = resolve(process.cwd(), ".env.local");
  let existingVars = new Map<string, string>();

  if (existsSync(envPath)) {
    const backupPath = `${envPath}.backup`;
    const existingContent = readFileSync(envPath, "utf-8");
    writeFileSync(backupPath, existingContent);
    console.log(
      `${colors.dim}Backed up existing .env.local to .env.local.backup${colors.reset}\n`,
    );

    existingVars = parseEnvFile(existingContent);
  }

  const mergedVars = new Map<string, string>();
  const conflicts: Array<{
    key: string;
    localValue: string;
    sourceValue: string;
  }> = [];

  // Add all existing vars
  for (const [key, value] of existingVars) {
    mergedVars.set(key, value);
  }

  // Find conflicts
  for (const [key, sourceValue] of pullVars) {
    const authSource = getAuthoritativeSource(key);
    const sourceNameLower = sourceName.toLowerCase();

    // Check if this source is authoritative for this variable
    if (authSource === sourceNameLower) {
      mergedVars.set(key, sourceValue);
      if (existingVars.has(key) && existingVars.get(key) !== sourceValue) {
        console.log(
          `  ${colors.dim}→${colors.reset} ${key} ${colors.green}(authoritative source)${colors.reset}`,
        );
      }
    } else if (existingVars.has(key)) {
      const localValue = existingVars.get(key)!;
      if (localValue !== sourceValue) {
        conflicts.push({ key, localValue, sourceValue });
      } else {
        mergedVars.set(key, sourceValue);
      }
    } else {
      mergedVars.set(key, sourceValue);
    }
  }

  // Handle conflicts
  if (conflicts.length > 0) {
    console.log(
      `${colors.yellow}Found ${conflicts.length} conflicting variables:${colors.reset}\n`,
    );

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    for (const conflict of conflicts) {
      displayConflict(
        conflict.key,
        conflict.localValue,
        conflict.sourceValue,
        sourceName,
      );

      const answer = await new Promise<string>(resolve => {
        rl.question(
          `\nKeep ${colors.blue}[L]ocal${colors.reset}, use ${colors.cyan}[${sourceName[0]}]${sourceName.slice(1)}${colors.reset}, or ${colors.magenta}[S]kip${colors.reset}? `,
          ans => resolve(ans.toLowerCase()),
        );
      });

      if (
        answer === sourceName[0]!.toLowerCase() ||
        answer === sourceName.toLowerCase()
      ) {
        mergedVars.set(conflict.key, conflict.sourceValue);
        console.log(
          `  ${colors.dim}←${colors.reset} Using ${sourceName} value`,
        );
      } else if (answer === "l" || answer === "local") {
        console.log(`  ${colors.dim}→${colors.reset} Keeping local value`);
      } else if (answer === "s" || answer === "skip") {
        mergedVars.delete(conflict.key);
        console.log(`  ${colors.dim}✗${colors.reset} Skipped`);
      } else {
        console.log(
          `  ${colors.dim}→${colors.reset} Keeping local value (default)`,
        );
      }
    }

    rl.close();
    console.log("");
  }

  // Show non-conflicted pulls
  for (const [key, value] of pullVars) {
    if (!conflicts.some(c => c.key === key)) {
      process.stdout.write(
        `  ${colors.dim}←${colors.reset} ${key} ${colors.green}✓${colors.reset}\n`,
      );
    }
  }

  // Write merged content
  let newContent = "";
  for (const [key, value] of mergedVars) {
    let quotedValue = value;
    if (
      value.includes(" ") ||
      value.includes("\n") ||
      value.includes('"') ||
      value.includes("'")
    ) {
      quotedValue = `"${value.replace(/"/g, '\\"')}"`;
    }

    newContent += `${key}=${quotedValue}\n`;
  }

  writeFileSync(envPath, newContent);
  console.log(
    `\n${colors.green}✅ Successfully merged environment variables to .env.local${colors.reset}`,
  );
}

function listConvexEnvVars(env: string) {
  console.log(
    `${colors.bright}Environment variables in Convex (${env}):${colors.reset}\n`,
  );

  const deploymentFlag = getConvexDeploymentFlag(env);

  try {
    execSync(`bunx convex env list ${deploymentFlag}`, { stdio: "inherit" });
  } catch (error) {
    console.error(
      `${colors.red}Error: Failed to list environment variables${colors.reset}`,
    );
    process.exit(1);
  }
}

function listVercelEnvVars(env: string) {
  console.log(
    `${colors.bright}Environment variables in Vercel (${env}):${colors.reset}\n`,
  );

  const vercelEnv = getVercelEnvironment(env);

  try {
    execSync(`bunx vercel env ls ${vercelEnv}`, { stdio: "inherit" });
  } catch (error) {
    console.error(
      `${colors.red}Error: Failed to list environment variables${colors.reset}`,
    );
    process.exit(1);
  }
}

function parseEnvFile(content: string): Map<string, string> {
  const envVars = new Map<string, string>();
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.substring(0, separatorIndex).trim();
    let value = trimmed.substring(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
      value = value.replace(/\\"/g, '"').replace(/\\'/g, "'");
    }

    envVars.set(key, value);
  }

  return envVars;
}

function parseConvexOutput(output: string): Map<string, string> {
  const vars = new Map<string, string>();
  const lines = output.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    if (
      !trimmed ||
      trimmed.includes("Environment Variables") ||
      trimmed.includes("═")
    ) {
      continue;
    }

    const match = trimmed.match(/^(\w+)=(.*)$/);
    if (match) {
      const key = match[1];
      const value = match[2] || "";
      if (key) vars.set(key, value);
    }
  }

  return vars;
}

function parseVercelOutput(
  output: string,
  environment: string = "development",
): Map<string, string> {
  const vars = new Map<string, string>();

  // Use vercel env pull to get all variables at once
  try {
    const tempFile = join(tmpdir(), `.env.vercel.${Date.now()}`);
    execSync(
      `bunx vercel env pull ${tempFile} --environment ${environment} --yes`,
      {
        encoding: "utf-8",
        stdio: "pipe",
      },
    );

    // Read and parse the pulled file
    if (existsSync(tempFile)) {
      const content = readFileSync(tempFile, "utf-8");
      const parsed = parseEnvFile(content);

      // Clean up temp file
      rmSync(tempFile, { force: true });

      return parsed;
    }
  } catch (error) {
    console.log(
      `${colors.yellow}Warning: Could not pull Vercel environment variables${colors.reset}`,
    );
  }

  return vars;
}

function truncateValue(value: string, maxLength: number = 50): string {
  if (value.length <= maxLength) return value;
  return value.substring(0, maxLength - 3) + "...";
}

function displayConflict(
  key: string,
  localValue: string,
  sourceValue: string,
  sourceName: string,
) {
  console.log(`\n${colors.bright}Variable: ${key}${colors.reset}`);

  const tempDir = mkdtempSync(join(tmpdir(), "env-diff-"));
  const localFile = join(tempDir, "local.txt");
  const sourceFile = join(tempDir, "source.txt");

  try {
    writeFileSync(localFile, localValue);
    writeFileSync(sourceFile, sourceValue);

    if (localValue.length <= 100 && sourceValue.length <= 100) {
      console.log(`${colors.blue}Local:${colors.reset}     ${localValue}`);
      console.log(`${colors.cyan}${sourceName}:${colors.reset} ${sourceValue}`);
    } else {
      console.log(
        `${colors.blue}Local (${localValue.length} chars):${colors.reset}     ${truncateValue(localValue, 60)}`,
      );
      console.log(
        `${colors.cyan}${sourceName} (${sourceValue.length} chars):${colors.reset} ${truncateValue(sourceValue, 60)}`,
      );
    }

    if (localValue !== sourceValue) {
      console.log(`\n${colors.yellow}Changes:${colors.reset}`);
      try {
        const diffOutput = execSync(
          `git diff --no-index --color=always --word-diff=color --word-diff-regex=. "${localFile}" "${sourceFile}" || true`,
          { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
        );

        const lines = diffOutput.split("\n");
        const diffLines = lines.slice(5).filter(line => line.trim() !== "");

        if (diffLines.length > 0) {
          const maxLines = 10;
          const displayLines = diffLines.slice(0, maxLines);
          console.log(displayLines.join("\n"));

          if (diffLines.length > maxLines) {
            console.log(
              `${colors.dim}... (${diffLines.length - maxLines} more lines)${colors.reset}`,
            );
          }
        }
      } catch (error) {
        try {
          const diffOutput = execSync(
            `diff -u "${localFile}" "${sourceFile}" | tail -n +4 || true`,
            { encoding: "utf-8" },
          );

          if (diffOutput) {
            const lines = diffOutput.split("\n").slice(0, 10);
            console.log(lines.join("\n"));
          }
        } catch {
          console.log(
            `${colors.dim}(Values differ but diff unavailable)${colors.reset}`,
          );
        }
      }
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

async function displayThreeWayConflict(conflict: {
  key: string;
  localValue?: string;
  convexValue?: string;
  vercelValue?: string;
}) {
  console.log(`\n${colors.bright}Variable: ${conflict.key}${colors.reset}`);

  // Display all available values
  if (conflict.localValue !== undefined) {
    console.log(
      `${colors.blue}Local:${colors.reset}  ${truncateValue(conflict.localValue, 60)}`,
    );
  }
  if (conflict.convexValue !== undefined) {
    console.log(
      `${colors.cyan}Convex:${colors.reset} ${truncateValue(conflict.convexValue, 60)}`,
    );
  }
  if (conflict.vercelValue !== undefined) {
    console.log(
      `${colors.magenta}Vercel:${colors.reset} ${truncateValue(conflict.vercelValue, 60)}`,
    );
  }

  // Show diffs between sources if we have multiple values
  const values = [
    { name: "Local", value: conflict.localValue, color: colors.blue },
    { name: "Convex", value: conflict.convexValue, color: colors.cyan },
    { name: "Vercel", value: conflict.vercelValue, color: colors.magenta },
  ].filter(v => v.value !== undefined);

  if (values.length >= 2) {
    console.log(`\n${colors.yellow}Differences:${colors.reset}`);

    // Compare first two different values
    const tempDir = mkdtempSync(join(tmpdir(), "env-diff-"));
    try {
      for (let i = 0; i < values.length - 1; i++) {
        for (let j = i + 1; j < values.length; j++) {
          if (values[i]!.value !== values[j]!.value) {
            const file1 = join(tempDir, "value1.txt");
            const file2 = join(tempDir, "value2.txt");

            writeFileSync(file1, values[i]!.value!);
            writeFileSync(file2, values[j]!.value!);

            console.log(
              `\n${values[i]!.color}${values[i]!.name}${colors.reset} vs ${values[j]!.color}${values[j]!.name}${colors.reset}:`,
            );

            try {
              const diffOutput = execSync(
                `git diff --no-index --color=always --word-diff=color --word-diff-regex=. "${file1}" "${file2}" || true`,
                { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
              );

              const lines = diffOutput.split("\n");
              const diffLines = lines
                .slice(5)
                .filter(line => line.trim() !== "");

              if (diffLines.length > 0) {
                const displayLines = diffLines.slice(0, 5);
                console.log(displayLines.join("\n"));

                if (diffLines.length > 5) {
                  console.log(
                    `${colors.dim}... (${diffLines.length - 5} more lines)${colors.reset}`,
                  );
                }
              }
            } catch {
              // Fallback if git diff fails
            }
          }
        }
      }
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }
}
