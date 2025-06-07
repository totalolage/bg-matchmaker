/**
 * Data transformation functions for BGG API responses
 */
import { BGGSearchResult, BGGGameDetails, BGGAPIError } from "./types";
import {
  BGGSearchItem,
  BGGThingItem,
  BGGHotItem,
  BGGSearchResponse,
  BGGThingResponse,
  BGGHotResponse,
} from "../bggSchemas";
import { castArray, extractNameValue, hasProperty } from "../utils";

/**
 * Transform BGG search response to search results
 */
export function mapSearchResponse(response: BGGSearchResponse): BGGSearchResult[] {
  if (!response.items || !response.items.item) {
    return [];
  }

  const items = castArray(response.items.item);
  
  return items
    .map((item) => mapSearchItem(item))
    .filter((item): item is BGGSearchResult => item !== null);
}

/**
 * Transform a single search item
 */
function mapSearchItem(item: unknown): BGGSearchResult | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const result: BGGSearchResult = {
    id: hasProperty(item, "id") ? String(item.id) : "",
    name: hasProperty(item, "name") ? extractNameValue(item.name) : "Unknown",
  };

  // Add year if available
  if (
    hasProperty(item, "yearpublished") &&
    item.yearpublished &&
    typeof item.yearpublished === "object" &&
    hasProperty(item.yearpublished, "value")
  ) {
    result.yearPublished = Number(item.yearpublished.value);
  }

  return result.id ? result : null;
}

/**
 * Transform BGG thing response to game details
 */
export function mapThingResponse(response: BGGThingResponse, bggId: string): BGGGameDetails {
  if (!response.items || !response.items.item) {
    throw new BGGAPIError(`Game with BGG ID ${bggId} not found`, 404);
  }

  const items = castArray(response.items.item);
  if (items.length === 0) {
    throw new BGGAPIError(`Game with BGG ID ${bggId} not found`, 404);
  }

  const item = items[0];
  return mapThingItem(item, bggId);
}

/**
 * Transform multiple thing items to game details
 */
export function mapMultipleThingItems(response: BGGThingResponse): BGGGameDetails[] {
  if (!response.items || !response.items.item) {
    return [];
  }

  const items = castArray(response.items.item);
  return items
    .map((item) => {
      try {
        const id = hasProperty(item, "id") ? String(item.id) : "";
        return mapThingItem(item, id);
      } catch {
        return null;
      }
    })
    .filter((item): item is BGGGameDetails => item !== null);
}

/**
 * Transform a single thing item to game details
 */
function mapThingItem(item: unknown, bggId: string): BGGGameDetails {
  if (!item || typeof item !== "object") {
    throw new BGGAPIError(`Invalid item data for BGG ID ${bggId}`, 400);
  }

  const primaryName = extractPrimaryName(item);
  
  const result: BGGGameDetails = {
    id: bggId,
    name: primaryName,
  };

  // Map optional fields
  mapBasicFields(item, result);
  mapStatistics(item, result);

  return result;
}

/**
 * Extract primary name from item
 */
function extractPrimaryName(item: any): string {
  if (!hasProperty(item, "name") || !item.name) {
    return "Unknown";
  }

  const names = castArray(item.name);

  // Look for primary name
  for (const name of names) {
    if (
      typeof name === "object" &&
      name &&
      hasProperty(name, "type") &&
      hasProperty(name, "value") &&
      name.type === "primary" &&
      typeof name.value === "string"
    ) {
      return name.value;
    }
  }

  // Fallback to first name
  return extractNameValue(names[0]);
}

/**
 * Map basic fields from item to game details
 */
function mapBasicFields(item: any, result: BGGGameDetails): void {
  // Direct string fields
  if (hasProperty(item, "description") && typeof item.description === "string") {
    result.description = item.description;
  }
  if (hasProperty(item, "image") && typeof item.image === "string") {
    result.image = item.image;
  }
  if (hasProperty(item, "thumbnail") && typeof item.thumbnail === "string") {
    result.thumbnail = item.thumbnail;
  }

  // Numeric fields with value property
  const numericFields = [
    { source: "yearpublished", target: "yearPublished" },
    { source: "minplayers", target: "minPlayers" },
    { source: "maxplayers", target: "maxPlayers" },
    { source: "playingtime", target: "playingTime" },
    { source: "minage", target: "minAge" },
  ] as const;

  for (const { source, target } of numericFields) {
    if (
      hasProperty(item, source) &&
      item[source] &&
      typeof item[source] === "object" &&
      hasProperty(item[source], "value")
    ) {
      (result as any)[target] = Number(item[source].value);
    }
  }
}

/**
 * Map statistics fields from item to game details
 */
function mapStatistics(item: any, result: BGGGameDetails): void {
  if (
    !hasProperty(item, "statistics") ||
    !item.statistics ||
    typeof item.statistics !== "object" ||
    !hasProperty(item.statistics, "ratings")
  ) {
    return;
  }

  const ratings = item.statistics.ratings;
  if (!ratings || typeof ratings !== "object") {
    return;
  }

  // Map weight and rating
  if (
    hasProperty(ratings, "averageweight") &&
    ratings.averageweight &&
    typeof ratings.averageweight === "object" &&
    hasProperty(ratings.averageweight, "value")
  ) {
    result.averageWeight = Number(ratings.averageweight.value);
  }

  if (
    hasProperty(ratings, "average") &&
    ratings.average &&
    typeof ratings.average === "object" &&
    hasProperty(ratings.average, "value")
  ) {
    result.averageRating = Number(ratings.average.value);
  }
}

/**
 * Transform BGG hot response to game IDs
 */
export function mapHotResponse(response: BGGHotResponse): string[] {
  if (!response.items || !response.items.item) {
    return [];
  }

  const items = castArray(response.items.item);
  
  return items
    .map((item) => {
      if (item && typeof item === "object" && hasProperty(item, "id")) {
        return String(item.id);
      }
      return "";
    })
    .filter((id) => id !== "");
}