import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, FileSpreadsheet, Upload } from "lucide-react";
import Papa from "papaparse";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { api } from "@convex/_generated/api";
import { CSV_IMPORT } from "@convex/lib/constants";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface CSVRow {
  id: string;
  name: string;
  yearpublished?: string;
  rank?: string;
  bayesaverage?: string;
  average?: string;
  usersrated?: string;
  is_expansion?: string;
  [key: string]: string | undefined;
}

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

export function CSVUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<
    "parsing" | "uploading" | null
  >(null);
  const [gamesToUpload, setGamesToUpload] = useState(0);
  const [stats, setStats] = useState<{
    total: number;
    processed: number;
    imported: number;
    skipped: number;
    errors: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const batchUpsertGames = useConvexMutation(api.admin.batchUpsertGames);

  const uploadMutation = useMutation({
    mutationFn: async (games: ParsedGameData[]) => batchUpsertGames({ games }),
  });

  const parseGameData = (row: CSVRow): ParsedGameData => ({
    bggId: row.id,
    name: row.name,
    yearPublished:
      row.yearpublished ? parseInt(row.yearpublished, 10) : undefined,
    rank: row.rank ? parseInt(row.rank, 10) : undefined,
    bayesAverage: row.bayesaverage ? parseFloat(row.bayesaverage) : undefined,
    average: row.average ? parseFloat(row.average) : undefined,
    usersRated: row.usersrated ? parseInt(row.usersrated, 10) : undefined,
    isExpansion: row.is_expansion === "1",
    abstractsRank:
      row.abstracts_rank ? parseInt(row.abstracts_rank, 10) : undefined,
    cgsRank: row.cgs_rank ? parseInt(row.cgs_rank, 10) : undefined,
    childrensGamesRank:
      row.childrensgames_rank ?
        parseInt(row.childrensgames_rank, 10)
      : undefined,
    familyGamesRank:
      row.familygames_rank ? parseInt(row.familygames_rank, 10) : undefined,
    partyGamesRank:
      row.partygames_rank ? parseInt(row.partygames_rank, 10) : undefined,
    strategyGamesRank:
      row.strategygames_rank ? parseInt(row.strategygames_rank, 10) : undefined,
    thematicRank:
      row.thematic_rank ? parseInt(row.thematic_rank, 10) : undefined,
    wargamesRank:
      row.wargames_rank ? parseInt(row.wargames_rank, 10) : undefined,
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setParseProgress(0);
    setUploadProgress(0);
    setCurrentStage("parsing");
    setStats(null);

    const localStats = {
      total: 0,
      processed: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
    };

    const allGames: ParsedGameData[] = [];

    // First, parse the entire file
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        localStats.total = results.data.length;

        // Process each row
        for (const row of results.data) {
          try {
            const gameData = parseGameData(row);

            // Only import non-expansion games with valid data
            if (!gameData.isExpansion && gameData.name && gameData.bggId) {
              allGames.push(gameData);
            } else {
              localStats.skipped++;
            }

            localStats.processed++;
            setParseProgress((localStats.processed / localStats.total) * 100);
          } catch (error) {
            localStats.errors++;
            console.error("Error processing row:", error);
          }
        }

        // Process games in batches of 1000
        setGamesToUpload(allGames.length);

        void (async () => {
          setCurrentStage("uploading");
          setUploadProgress(0);

          let totalImported = 0;
          const totalBatches = Math.ceil(
            allGames.length / CSV_IMPORT.BATCH_SIZE,
          );

          for (let i = 0; i < allGames.length; i += CSV_IMPORT.BATCH_SIZE) {
            const batch = allGames.slice(i, i + CSV_IMPORT.BATCH_SIZE);
            const batchNumber = Math.floor(i / CSV_IMPORT.BATCH_SIZE) + 1;

            try {
              await uploadMutation.mutateAsync(batch);
              totalImported += batch.length;
              localStats.imported = totalImported;

              // Update progress based on batches completed
              const progress = (batchNumber / totalBatches) * 100;
              setUploadProgress(progress);
              setStats({ ...localStats });
            } catch (error) {
              console.error(`Error importing batch ${batchNumber}:`, error);
              localStats.errors += batch.length;
              toast.error(
                `Failed to import batch ${batchNumber} of ${totalBatches} (${batch.length} games)`,
              );
            }
          }

          if (totalImported > 0) {
            toast.success(
              `Import complete! Imported ${totalImported} games out of ${localStats.total} total.`,
            );
          }

          setIsUploading(false);
          setCurrentStage(null);
          setGamesToUpload(0);

          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        })();
      },
      error: error => {
        setIsUploading(false);
        console.error("CSV parsing error:", error);
        toast.error("Failed to parse CSV file");
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            CSV Import
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Import board games from a CSV file with the following columns:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              id, name, yearpublished, rank, average, usersrated, is_expansion
            </li>
            <li>Optional: bayesaverage, various category ranks</li>
          </ul>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />

        {!isUploading && (
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            Select CSV File
          </Button>
        )}

        {isUploading && (
          <div className="space-y-4">
            {currentStage === "parsing" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Parsing CSV File</span>
                  <span>{parseProgress.toFixed(1)}%</span>
                </div>
                <Progress value={parseProgress} />
                <div className="text-sm text-muted-foreground text-center">
                  Reading and validating game data...
                </div>
              </div>
            )}

            {currentStage === "uploading" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading to Database</span>
                  <span>{uploadProgress.toFixed(1)}%</span>
                </div>
                <Progress
                  value={uploadProgress}
                  className="transition-all duration-500"
                />
                <div className="text-sm text-muted-foreground text-center">
                  Saving {gamesToUpload.toLocaleString()} games to database in
                  batches of {CSV_IMPORT.BATCH_SIZE.toLocaleString()}...
                </div>
              </div>
            )}
          </div>
        )}

        {stats && (
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Rows</p>
                <p className="font-semibold">{stats.total.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Processed</p>
                <p className="font-semibold">
                  {stats.processed.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Imported</p>
                <p className="font-semibold text-green-600">
                  {stats.imported.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Skipped</p>
                <p className="font-semibold text-blue-600">
                  {stats.skipped.toLocaleString()}
                </p>
              </div>
            </div>
            {stats.errors > 0 && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{stats.errors} errors occurred during import</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
