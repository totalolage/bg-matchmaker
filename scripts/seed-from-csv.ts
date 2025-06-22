#!/usr/bin/env bun

import { Presets, SingleBar } from "cli-progress";
import { parse } from "csv-parse";
import { createReadStream } from "fs";
import * as fs from "fs/promises";
import { createInterface } from "readline";

import { ConvexHttpClient } from "convex/browser";

import { api } from "../convex/_generated/api";

// Type for CSV row data
interface CSVRow {
  id: string;
  name: string;
  yearpublished?: string;
  rank?: string;
  bayesaverage?: string;
  average?: string;
  usersrated?: string;
  is_expansion?: string;
  abstracts_rank?: string;
  cgs_rank?: string;
  childrensgames_rank?: string;
  familygames_rank?: string;
  partygames_rank?: string;
  strategygames_rank?: string;
  thematic_rank?: string;
  wargames_rank?: string;
}

// Type for parsed game data
interface ParsedGameData {
  bggId: string;
  name: string;
  yearPublished?: number;
  rank?: number;
  bayesAverage?: number;
  average?: number;
  usersRated?: number;
  isExpansion: boolean;
  abstractsRank?: number;
  cgsRank?: number;
  childrensGamesRank?: number;
  familyGamesRank?: number;
  partyGamesRank?: number;
  strategyGamesRank?: number;
  thematicRank?: number;
  wargamesRank?: number;
}

// Get CSV file path from command line arguments
const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Please provide a CSV file path as an argument");
  console.error("Usage: bun run seed:csv <path-to-csv>");
  process.exit(1);
}

// Check if file exists
try {
  await fs.access(csvPath);
} catch {
  console.error(`File not found: ${csvPath}`);
  process.exit(1);
}

// Get Convex URL from environment
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  console.error("NEXT_PUBLIC_CONVEX_URL environment variable is not set");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// First, count total lines for progress bar
async function countLines(filePath: string): Promise<number> {
  let lineCount = 0;
  const rl = createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });

  for await (const _line of rl) {
    lineCount++;
  }

  return lineCount - 1; // Subtract header line
}

// Parse game data from CSV row
function parseGameData(row: CSVRow): ParsedGameData {
  return {
    bggId: row.id,
    name: row.name,
    yearPublished: row.yearpublished ? parseInt(row.yearpublished, 10) : undefined,
    rank: row.rank ? parseInt(row.rank, 10) : undefined,
    bayesAverage: row.bayesaverage ? parseFloat(row.bayesaverage) : undefined,
    average: row.average ? parseFloat(row.average) : undefined,
    usersRated: row.usersrated ? parseInt(row.usersrated, 10) : undefined,
    isExpansion: row.is_expansion === "1",
    abstractsRank: row.abstracts_rank ? parseInt(row.abstracts_rank, 10) : undefined,
    cgsRank: row.cgs_rank ? parseInt(row.cgs_rank, 10) : undefined,
    childrensGamesRank: row.childrensgames_rank ? parseInt(row.childrensgames_rank, 10) : undefined,
    familyGamesRank: row.familygames_rank ? parseInt(row.familygames_rank, 10) : undefined,
    partyGamesRank: row.partygames_rank ? parseInt(row.partygames_rank, 10) : undefined,
    strategyGamesRank: row.strategygames_rank ? parseInt(row.strategygames_rank, 10) : undefined,
    thematicRank: row.thematic_rank ? parseInt(row.thematic_rank, 10) : undefined,
    wargamesRank: row.wargames_rank ? parseInt(row.wargames_rank, 10) : undefined,
  };
}

async function seedFromCSV(): Promise<void> {
  console.log(`🎲 Starting BGG data import from ${csvPath}\n`);

  // Count total lines
  console.log("📊 Counting games in CSV...");
  const totalGames = await countLines(csvPath);
  console.log(`Found ${totalGames} games to import\n`);

  // Create progress bar
  const progressBar = new SingleBar({
    format: "Import Progress |{bar}| {percentage}% | {value}/{total} Games | ETA: {eta}s",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
  }, Presets.shades_classic);

  progressBar.start(totalGames, 0);

  let processed = 0;
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const batch: ParsedGameData[] = [];
  const BATCH_SIZE = 50; // Process in batches to avoid overwhelming the database

  // Create CSV parser
  const parser = parse({
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  // Create a promise to handle the async stream processing
  return new Promise<void>((resolve, reject) => {
    // Process CSV
    let processingBatch = false;
    
    const processBatch = async () => {
      if (processingBatch || batch.length === 0) return;
      
      processingBatch = true;
      parser.pause();
      
      try {
        await client.mutation(api.admin.batchUpsertGames, { games: [...batch] });
        imported += batch.length;
      } catch (error) {
        console.error(`\nError importing batch: ${error}`);
        errors += batch.length;
      }
      
      batch.length = 0; // Clear batch
      processingBatch = false;
      parser.resume(); // Resume parser
    };
    
    parser.on("readable", function() {
      let record: CSVRow | null;
      while ((record = parser.read()) !== null) {
        try {
          const gameData = parseGameData(record);
          
          // Only import non-expansion games with valid data
          if (!gameData.isExpansion && gameData.name && gameData.bggId) {
            batch.push(gameData);
            
            // Process batch when it reaches the size limit
            if (batch.length >= BATCH_SIZE) {
              void processBatch();
            }
          } else {
            skipped++;
          }
          
          processed++;
          progressBar.update(processed);
        } catch (error) {
          errors++;
          console.error(`\nError processing row: ${error}`);
        }
      }
    });

    parser.on("end", function() {
      // Process any remaining games in the batch
      if (batch.length > 0) {
        client.mutation(api.admin.batchUpsertGames, { games: batch })
          .then(() => {
            imported += batch.length;
          })
          .catch((error) => {
            console.error(`\nError importing final batch: ${error}`);
            errors += batch.length;
          })
          .finally(() => {
            progressBar.stop();

            console.log("\n✅ Import complete!");
            console.log(`📊 Summary:`);
            console.log(`   - Total processed: ${processed}`);
            console.log(`   - Successfully imported: ${imported}`);
            console.log(`   - Skipped (expansions/invalid): ${skipped}`);
            console.log(`   - Errors: ${errors}`);
            
            resolve();
          });
      } else {
        progressBar.stop();

        console.log("\n✅ Import complete!");
        console.log(`📊 Summary:`);
        console.log(`   - Total processed: ${processed}`);
        console.log(`   - Successfully imported: ${imported}`);
        console.log(`   - Skipped (expansions/invalid): ${skipped}`);
        console.log(`   - Errors: ${errors}`);
        
        resolve();
      }
    });

    parser.on("error", (err) => {
      progressBar.stop();
      console.error("\n❌ Error parsing CSV:", err);
      reject(err);
    });

    // Start processing
    createReadStream(csvPath).pipe(parser);
  });
}

// Run the seeding
seedFromCSV().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});