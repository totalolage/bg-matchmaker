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

// Types
type Environment = "dev" | "prod" | "preview";
type Source = "convex" | "vercel";
type Command = "push" | "pull" | "list" | "sync";
type EnvVars = Map<string, string>;

interface ConflictInfo {
  key: string;
  localValue?: string;
  convexValue?: string;
  vercelValue?: string;
  sourceValue?: string;
}

// Constants
const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
} as const;

const ENV_PATH = resolve(process.cwd(), ".env.local");
const BACKUP_PATH = `${ENV_PATH}.backup`;

// Utility functions
class Logger {
  static error(message: string): void {
    console.error(`${COLORS.red}Error: ${message}${COLORS.reset}`);
  }

  static success(message: string): void {
    console.log(`${COLORS.green}✅ ${message}${COLORS.reset}`);
  }

  static warning(message: string): void {
    console.log(`${COLORS.yellow}Warning: ${message}${COLORS.reset}`);
  }

  static info(message: string): void {
    console.log(`${COLORS.bright}${message}${COLORS.reset}`);
  }

  static progress(key: string, success: boolean = true): void {
    process.stdout.write(
      `  ${COLORS.dim}→${COLORS.reset} ${key} ${
        success ? `${COLORS.green}✓` : `${COLORS.red}✗`
      }${COLORS.reset}\n`,
    );
  }
}

class EnvFileManager {
  static parse(content: string): EnvVars {
    const envVars = new Map<string, string>();
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;

      const key = trimmed.substring(0, separatorIndex).trim();
      let value = trimmed.substring(separatorIndex + 1);

      // Handle quoted values
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
        value = value
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r");
      } else {
        value = value.trim();
      }

      envVars.set(key, value);
    }

    return envVars;
  }

  static write(vars: EnvVars, path: string = ENV_PATH): void {
    let content = "";

    for (const [key, value] of vars) {
      const quotedValue = this.quoteValue(value);
      content += `${key}=${quotedValue}\n`;
    }

    writeFileSync(path, content);
  }

  static backup(): void {
    if (existsSync(ENV_PATH)) {
      const content = readFileSync(ENV_PATH, "utf-8");
      writeFileSync(BACKUP_PATH, content);
      console.log(
        `${COLORS.dim}Backed up existing .env.local to .env.local.backup${COLORS.reset}\n`,
      );
    }
  }

  private static quoteValue(value: string): string {
    if (
      value.includes(" ") ||
      value.includes("\n") ||
      value.includes("\r") ||
      value.includes('"') ||
      value.includes("'") ||
      value.includes("\\")
    ) {
      const escaped = value
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");
      return `"${escaped}"`;
    }
    return value;
  }

  static load(): EnvVars {
    if (!existsSync(ENV_PATH)) {
      Logger.error(".env.local file not found");
      process.exit(1);
    }
    const content = readFileSync(ENV_PATH, "utf-8");
    return this.parse(content);
  }
}

class ConvexClient {
  static getDeploymentFlag(env: Environment): string {
    return env === "prod" ? "--prod" : "";
  }

  static async push(env: Environment): Promise<void> {
    Logger.info(`Pushing environment variables to Convex (${env})...\n`);

    const envVars = EnvFileManager.load();
    console.log(`Found ${envVars.size} variables to sync\n`);

    const deploymentFlag = this.getDeploymentFlag(env);
    let successCount = 0;
    let errorCount = 0;

    for (const [key, value] of envVars) {
      try {
        process.stdout.write(`  ${COLORS.dim}→${COLORS.reset} ${key}`);
        const escapedValue = value.replace(/'/g, "'\"'\"'");
        const command = `bunx convex env set ${deploymentFlag} ${key} -- '${escapedValue}'`;
        execSync(command, { stdio: "pipe" });
        Logger.progress(key, true);
        successCount++;
      } catch (error) {
        Logger.progress(key, false);
        console.error(`     ${COLORS.red}Error: ${error}${COLORS.reset}`);
        errorCount++;
      }
    }

    Logger.success(`Successfully pushed ${successCount} variables to Convex`);
    if (errorCount > 0) {
      Logger.error(`Failed to push ${errorCount} variables`);
    }
  }

  static async pull(env: Environment): Promise<EnvVars> {
    Logger.info(`Pulling environment variables from Convex (${env})...\n`);

    const deploymentFlag = this.getDeploymentFlag(env);
    try {
      const output = execSync(`bunx convex env list ${deploymentFlag}`, {
        encoding: "utf-8",
      });
      const vars = this.parseOutput(output);
      console.log(`Found ${vars.size} variables to pull\n`);
      return vars;
    } catch (error) {
      Logger.error("Failed to list Convex environment variables");
      console.error(error);
      process.exit(1);
    }
  }

  static list(env: Environment): void {
    Logger.info(`Environment variables in Convex (${env}):\n`);
    const deploymentFlag = this.getDeploymentFlag(env);

    try {
      execSync(`bunx convex env list ${deploymentFlag}`, { stdio: "inherit" });
    } catch (error) {
      Logger.error("Failed to list environment variables");
      process.exit(1);
    }
  }

  private static parseOutput(output: string): EnvVars {
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
}

class VercelClient {
  static getEnvironment(env: Environment): string {
    if (env === "prod") return "production";
    if (env === "preview") return "preview";
    return "development";
  }

  static async push(env: Environment): Promise<void> {
    Logger.info(`Pushing environment variables to Vercel (${env})...\n`);

    const envVars = EnvFileManager.load();
    console.log(`Found ${envVars.size} variables to sync\n`);

    const vercelEnv = this.getEnvironment(env);
    let successCount = 0;
    let errorCount = 0;

    for (const [key, value] of envVars) {
      try {
        process.stdout.write(`  ${COLORS.dim}→${COLORS.reset} ${key}`);

        const escapedValue = value
          .replace(/\\/g, "\\\\")
          .replace(/'/g, "'\"'\"'")
          .replace(/\n/g, "\\n")
          .replace(/\r/g, "\\r");

        const command = `printf '%s' '${escapedValue}' | bunx vercel env add ${key} ${vercelEnv} --force`;
        execSync(command, { stdio: "pipe", shell: "/bin/bash" });
        Logger.progress(key, true);
        successCount++;
      } catch (error) {
        Logger.progress(key, false);
        console.error(`     ${COLORS.red}Error: ${error}${COLORS.reset}`);
        errorCount++;
      }
    }

    Logger.success(`Successfully pushed ${successCount} variables to Vercel`);
    if (errorCount > 0) {
      Logger.error(`Failed to push ${errorCount} variables`);
    }
  }

  static async pull(env: Environment): Promise<EnvVars> {
    Logger.info(`Pulling environment variables from Vercel (${env})...\n`);

    const vercelEnv = this.getEnvironment(env);
    try {
      const tempFile = join(tmpdir(), `.env.vercel.${Date.now()}`);
      execSync(
        `bunx vercel env pull ${tempFile} --environment ${vercelEnv} --yes`,
        {
          encoding: "utf-8",
          stdio: "pipe",
        },
      );

      if (existsSync(tempFile)) {
        const content = readFileSync(tempFile, "utf-8");
        const parsed = EnvFileManager.parse(content);
        rmSync(tempFile, { force: true });

        // Clean up trailing newlines that Vercel might add
        const cleanedVars = new Map<string, string>();
        for (const [key, value] of parsed) {
          let cleanValue = value;
          if (!value.includes("\\n") && value.endsWith("\n")) {
            cleanValue = value.trimEnd();
          }
          cleanedVars.set(key, cleanValue);
        }

        console.log(`Found ${cleanedVars.size} variables to pull\n`);
        return cleanedVars;
      }
    } catch (error) {
      Logger.warning("Could not pull Vercel environment variables");
      console.error(error);
    }

    return new Map();
  }

  static list(env: Environment): void {
    Logger.info(`Environment variables in Vercel (${env}):\n`);
    const vercelEnv = this.getEnvironment(env);

    try {
      execSync(`bunx vercel env ls ${vercelEnv}`, { stdio: "inherit" });
    } catch (error) {
      Logger.error("Failed to list environment variables");
      process.exit(1);
    }
  }
}

class ConflictResolver {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  close(): void {
    this.rl.close();
  }

  async resolveConflict(
    conflict: ConflictInfo,
    sourceName: string,
  ): Promise<string | null> {
    this.displayConflict(conflict, sourceName);
    return this.promptUser(conflict, sourceName);
  }

  private displayConflict(conflict: ConflictInfo, sourceName: string): void {
    console.log(`\n${COLORS.bright}Variable: ${conflict.key}${COLORS.reset}`);

    if (conflict.localValue !== undefined) {
      console.log(
        `${COLORS.blue}Local:${COLORS.reset}  ${this.truncateValue(conflict.localValue)}`,
      );
    }
    if (conflict.convexValue !== undefined) {
      console.log(
        `${COLORS.cyan}Convex:${COLORS.reset} ${this.truncateValue(conflict.convexValue)}`,
      );
    }
    if (conflict.vercelValue !== undefined) {
      console.log(
        `${COLORS.magenta}Vercel:${COLORS.reset} ${this.truncateValue(conflict.vercelValue)}`,
      );
    }
    if (conflict.sourceValue !== undefined && sourceName) {
      console.log(
        `${COLORS.cyan}${sourceName}:${COLORS.reset} ${this.truncateValue(conflict.sourceValue)}`,
      );
    }

    this.showDiff(conflict);
  }

  private async promptUser(
    conflict: ConflictInfo,
    sourceName?: string,
  ): Promise<string | null> {
    const options: string[] = [];

    if (conflict.localValue !== undefined) {
      options.push(`${COLORS.blue}[L]ocal${COLORS.reset}`);
    }
    if (conflict.convexValue !== undefined) {
      options.push(`${COLORS.cyan}[C]onvex${COLORS.reset}`);
    }
    if (conflict.vercelValue !== undefined) {
      options.push(`${COLORS.magenta}[V]ercel${COLORS.reset}`);
    }
    if (conflict.sourceValue !== undefined && sourceName) {
      options.push(
        `${COLORS.cyan}[${sourceName[0]}]${sourceName.slice(1)}${COLORS.reset}`,
      );
    }
    options.push(`${COLORS.yellow}[S]kip${COLORS.reset}`);

    return new Promise(resolve => {
      this.rl.question(`\nChoose ${options.join(", ")}: `, answer =>
        resolve(answer.toLowerCase()),
      );
    });
  }

  private showDiff(conflict: ConflictInfo): void {
    const values = [
      { name: "Local", value: conflict.localValue },
      { name: "Convex", value: conflict.convexValue },
      { name: "Vercel", value: conflict.vercelValue },
    ].filter(v => v.value !== undefined);

    if (values.length < 2) return;

    console.log(`\n${COLORS.yellow}Differences:${COLORS.reset}`);

    const tempDir = mkdtempSync(join(tmpdir(), "env-diff-"));
    try {
      // Show diff between first two different values
      for (let i = 0; i < Math.min(values.length - 1, 1); i++) {
        for (let j = i + 1; j < Math.min(values.length, 2); j++) {
          if (values[i]!.value !== values[j]!.value) {
            this.displayDiff(
              values[i]!.name,
              values[i]!.value!,
              values[j]!.name,
              values[j]!.value!,
              tempDir,
            );
          }
        }
      }
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }

  private displayDiff(
    name1: string,
    value1: string,
    name2: string,
    value2: string,
    tempDir: string,
  ): void {
    const file1 = join(tempDir, "value1.txt");
    const file2 = join(tempDir, "value2.txt");

    writeFileSync(file1, value1);
    writeFileSync(file2, value2);

    console.log(`\n${name1} vs ${name2}:`);

    try {
      const diffOutput = execSync(
        `git diff --no-index --color=always --word-diff=color --word-diff-regex=. "${file1}" "${file2}" || true`,
        { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
      );

      const lines = diffOutput.split("\n");
      const diffLines = lines.slice(5).filter(line => line.trim() !== "");

      if (diffLines.length > 0) {
        const displayLines = diffLines.slice(0, 5);
        console.log(displayLines.join("\n"));

        if (diffLines.length > 5) {
          console.log(
            `${COLORS.dim}... (${diffLines.length - 5} more lines)${COLORS.reset}`,
          );
        }
      }
    } catch {
      // Fallback if git diff fails
      console.log(
        `${COLORS.dim}(Values differ but diff unavailable)${COLORS.reset}`,
      );
    }
  }

  private truncateValue(value: string, maxLength: number = 60): string {
    if (value.length <= maxLength) return value;
    return value.substring(0, maxLength - 3) + "...";
  }
}

class EnvManager {
  static getAuthoritativeSource(key: string): Source | null {
    if (key.startsWith("VERCEL_")) return "vercel";
    if (key.startsWith("CONVEX_") || key.startsWith("VITE_CONVEX_"))
      return "convex";
    return null;
  }

  static async mergeAndWrite(
    pullVars: EnvVars,
    sourceName: string,
  ): Promise<void> {
    EnvFileManager.backup();

    const existingVars =
      existsSync(ENV_PATH) ?
        EnvFileManager.parse(readFileSync(ENV_PATH, "utf-8"))
      : new Map();

    const mergedVars = new Map(existingVars);
    const conflicts: ConflictInfo[] = [];

    // Process variables
    for (const [key, sourceValue] of pullVars) {
      const authSource = this.getAuthoritativeSource(key);
      const sourceNameLower = sourceName.toLowerCase();

      if (authSource === sourceNameLower) {
        mergedVars.set(key, sourceValue);
        if (existingVars.has(key) && existingVars.get(key) !== sourceValue) {
          console.log(
            `  ${COLORS.dim}→${COLORS.reset} ${key} ${COLORS.green}(authoritative source)${COLORS.reset}`,
          );
        }
      } else if (existingVars.has(key)) {
        const localValue = existingVars.get(key)!;
        if (localValue !== sourceValue) {
          conflicts.push({ key, localValue, sourceValue });
        }
      } else {
        mergedVars.set(key, sourceValue);
      }
    }

    // Handle conflicts
    if (conflicts.length > 0) {
      Logger.warning(`Found ${conflicts.length} conflicting variables:\n`);

      const resolver = new ConflictResolver();
      for (const conflict of conflicts) {
        const answer = await resolver.resolveConflict(conflict, sourceName);

        if (
          answer === sourceName[0]?.toLowerCase() ||
          answer === sourceName.toLowerCase()
        ) {
          mergedVars.set(conflict.key, conflict.sourceValue!);
          console.log(
            `  ${COLORS.dim}←${COLORS.reset} Using ${sourceName} value`,
          );
        } else if (answer === "l" || answer === "local") {
          console.log(`  ${COLORS.dim}→${COLORS.reset} Keeping local value`);
        } else if (answer === "s" || answer === "skip") {
          mergedVars.delete(conflict.key);
          console.log(`  ${COLORS.dim}✗${COLORS.reset} Skipped`);
        } else {
          console.log(
            `  ${COLORS.dim}→${COLORS.reset} Keeping local value (default)`,
          );
        }
      }

      resolver.close();
      console.log("");
    }

    // Show non-conflicted pulls
    for (const [key] of pullVars) {
      if (!conflicts.some(c => c.key === key)) {
        Logger.progress(key, true);
      }
    }

    EnvFileManager.write(mergedVars);
    Logger.success("Successfully merged environment variables to .env.local");
  }

  static async syncAllSources(env: Environment): Promise<void> {
    Logger.info(
      `Syncing environment variables across all sources (${env})...\n`,
    );

    // Get variables from all sources
    const localVars =
      existsSync(ENV_PATH) ?
        EnvFileManager.parse(readFileSync(ENV_PATH, "utf-8"))
      : new Map();

    let convexVars = new Map<string, string>();
    let vercelVars = new Map<string, string>();

    try {
      convexVars = await ConvexClient.pull(env);
    } catch (error) {
      Logger.warning("Could not fetch Convex variables");
    }

    try {
      vercelVars = await VercelClient.pull(env);
    } catch (error) {
      Logger.warning("Could not fetch Vercel variables");
    }

    console.log(`\nFound variables:`);
    console.log(
      `  ${COLORS.blue}Local:${COLORS.reset}  ${localVars.size} variables`,
    );
    console.log(
      `  ${COLORS.cyan}Convex:${COLORS.reset} ${convexVars.size} variables`,
    );
    console.log(
      `  ${COLORS.magenta}Vercel:${COLORS.reset} ${vercelVars.size} variables\n`,
    );

    console.log(
      `${COLORS.dim}Note: Authoritative sources will be applied automatically:${COLORS.reset}`,
    );
    console.log(`${COLORS.dim}  - VERCEL_* → Vercel${COLORS.reset}`);
    console.log(
      `${COLORS.dim}  - CONVEX_*, VITE_CONVEX_* → Convex${COLORS.reset}\n`,
    );

    await this.performThreeWayMerge(localVars, convexVars, vercelVars);
  }

  private static async performThreeWayMerge(
    localVars: EnvVars,
    convexVars: EnvVars,
    vercelVars: EnvVars,
  ): Promise<void> {
    EnvFileManager.backup();

    // Collect all unique keys
    const allKeys = new Set<string>();
    for (const key of localVars.keys()) allKeys.add(key);
    for (const key of convexVars.keys()) allKeys.add(key);
    for (const key of vercelVars.keys()) allKeys.add(key);

    const mergedVars = new Map<string, string>();
    const conflicts: ConflictInfo[] = [];

    for (const key of allKeys) {
      const localValue = localVars.get(key);
      const convexValue = convexVars.get(key);
      const vercelValue = vercelVars.get(key);

      const authSource = this.getAuthoritativeSource(key);

      if (authSource === "vercel" && vercelValue !== undefined) {
        mergedVars.set(key, vercelValue);
        if (
          (localValue !== undefined && localValue !== vercelValue) ||
          (convexValue !== undefined && convexValue !== vercelValue)
        ) {
          console.log(
            `  ${COLORS.dim}→${COLORS.reset} ${key} ${COLORS.magenta}(using Vercel - authoritative)${COLORS.reset}`,
          );
        }
      } else if (authSource === "convex" && convexValue !== undefined) {
        mergedVars.set(key, convexValue);
        if (
          (localValue !== undefined && localValue !== convexValue) ||
          (vercelValue !== undefined && vercelValue !== convexValue)
        ) {
          console.log(
            `  ${COLORS.dim}→${COLORS.reset} ${key} ${COLORS.cyan}(using Convex - authoritative)${COLORS.reset}`,
          );
        }
      } else {
        const uniqueValues = new Set(
          [localValue, convexValue, vercelValue].filter(v => v !== undefined),
        );

        if (uniqueValues.size === 1) {
          mergedVars.set(key, uniqueValues.values().next().value!);
        } else if (uniqueValues.size > 1) {
          conflicts.push({ key, localValue, convexValue, vercelValue });
        }
      }
    }

    // Handle conflicts
    if (conflicts.length > 0) {
      Logger.warning(`Found ${conflicts.length} conflicting variables:\n`);

      const resolver = new ConflictResolver();
      for (const conflict of conflicts) {
        const answer = await resolver.resolveConflict(conflict, "");

        if (answer === "l" && conflict.localValue !== undefined) {
          mergedVars.set(conflict.key, conflict.localValue);
          console.log(`  ${COLORS.dim}→${COLORS.reset} Using local value`);
        } else if (answer === "c" && conflict.convexValue !== undefined) {
          mergedVars.set(conflict.key, conflict.convexValue);
          console.log(`  ${COLORS.dim}←${COLORS.reset} Using Convex value`);
        } else if (answer === "v" && conflict.vercelValue !== undefined) {
          mergedVars.set(conflict.key, conflict.vercelValue);
          console.log(`  ${COLORS.dim}←${COLORS.reset} Using Vercel value`);
        } else if (answer === "s") {
          console.log(`  ${COLORS.dim}✗${COLORS.reset} Skipped`);
        } else {
          if (conflict.localValue !== undefined) {
            mergedVars.set(conflict.key, conflict.localValue);
            console.log(
              `  ${COLORS.dim}→${COLORS.reset} Using local value (default)`,
            );
          } else {
            console.log(
              `  ${COLORS.dim}✗${COLORS.reset} Skipped (no local value)`,
            );
          }
        }
      }

      resolver.close();
      console.log("");
    }

    EnvFileManager.write(mergedVars);
    Logger.success("Successfully merged environment variables to .env.local");
  }
}

// CLI
class CLI {
  static showHelp(): void {
    console.log(`
${COLORS.bright}Environment Variables Manager${COLORS.reset}

${COLORS.yellow}Usage:${COLORS.reset}
  ${COLORS.cyan}bun run env <command> [source] [environment]${COLORS.reset}

${COLORS.yellow}Commands:${COLORS.reset}
  ${COLORS.green}push <source>${COLORS.reset}    Push environment variables from .env.local to source
  ${COLORS.green}pull <source>${COLORS.reset}    Pull environment variables from source to .env.local
  ${COLORS.green}list <source>${COLORS.reset}    List all environment variables in source
  ${COLORS.green}sync${COLORS.reset}             Sync between all sources (local, Convex, Vercel)

${COLORS.yellow}Sources:${COLORS.reset}
  ${COLORS.blue}convex${COLORS.reset}           Convex backend
  ${COLORS.blue}vercel${COLORS.reset}           Vercel deployment

${COLORS.yellow}Environments:${COLORS.reset}
  ${COLORS.blue}dev${COLORS.reset}              Development environment (default)
  ${COLORS.blue}prod${COLORS.reset}             Production environment
  ${COLORS.blue}preview${COLORS.reset}          Preview environment (Vercel only)

${COLORS.yellow}Examples:${COLORS.reset}
  ${COLORS.dim}# Push to Convex development${COLORS.reset}
  bun run env push convex

  ${COLORS.dim}# Pull from Vercel production${COLORS.reset}
  bun run env pull vercel prod

  ${COLORS.dim}# Sync all sources${COLORS.reset}
  bun run env sync

${COLORS.yellow}Notes:${COLORS.reset}
  - The pull command will backup existing .env.local to .env.local.backup
  - Interactive merge prompts when values differ between sources
  - Sync command allows 3-way merge between local, Convex, and Vercel
  
${COLORS.yellow}Authoritative Sources:${COLORS.reset}
  - ${COLORS.magenta}VERCEL_*${COLORS.reset} variables always use Vercel as source
  - ${COLORS.cyan}CONVEX_*${COLORS.reset} and ${COLORS.cyan}VITE_CONVEX_*${COLORS.reset} variables always use Convex as source
  - Other variables prompt for manual resolution
`);
  }

  static async run(): Promise<void> {
    const args = process.argv.slice(2);
    const command = args[0] as Command;
    const source = args[1] as Source;
    const environment = (args[2] || "dev") as Environment;

    // Show help
    if (!command || command === "-h" || command === "--help") {
      this.showHelp();
      process.exit(0);
    }

    // Validate command
    if (!["push", "pull", "list", "sync"].includes(command)) {
      Logger.error(`Unknown command '${command}'`);
      this.showHelp();
      process.exit(1);
    }

    // Validate source for non-sync commands
    if (
      ["push", "pull", "list"].includes(command) &&
      (!source || !["convex", "vercel"].includes(source))
    ) {
      Logger.error("Source must be 'convex' or 'vercel'");
      this.showHelp();
      process.exit(1);
    }

    // Validate environment
    if (!["dev", "prod", "preview"].includes(environment)) {
      Logger.error("Environment must be 'dev', 'prod', or 'preview'");
      process.exit(1);
    }

    try {
      await this.executeCommand(command, source, environment);
    } catch (error) {
      Logger.error((error as Error).message);
      process.exit(1);
    }
  }

  private static async executeCommand(
    command: Command,
    source: Source,
    environment: Environment,
  ): Promise<void> {
    switch (command) {
      case "push":
        if (source === "convex") {
          await ConvexClient.push(environment);
        } else {
          await VercelClient.push(environment);
        }
        break;

      case "pull":
        const vars =
          source === "convex" ?
            await ConvexClient.pull(environment)
          : await VercelClient.pull(environment);
        await EnvManager.mergeAndWrite(
          vars,
          source === "convex" ? "Convex" : "Vercel",
        );
        break;

      case "list":
        if (source === "convex") {
          ConvexClient.list(environment);
        } else {
          VercelClient.list(environment);
        }
        break;

      case "sync":
        await EnvManager.syncAllSources(environment);
        break;
    }
  }
}

// Run the CLI
CLI.run().catch(error => {
  Logger.error(error.message);
  process.exit(1);
});
