/**
 * Data transformation functions for BGG API responses
 */
import { BGGSearchResult, BGGGameDetails, BGGAPIError } from "./types";
import {
  BGGSearchResponse,
  BGGThingResponse,
  BGGHotResponse,
  BGGSearchItem,
  BGGThingItem,
} from "../bggSchemas";
import { hasProperty } from "../utils";

/**
 * Transform BGG search response to search results
 */
export function mapSearchResponse(
  response: BGGSearchResponse,
): BGGSearchResult[] {
  if (!response.items || !response.items.item) {
    return [];
  }

  return response.items.item
    .map((item) => mapSearchItem(item))
    .filter((item): item is BGGSearchResult => item !== null);
}

/**
 * Transform a single search item
 */
function mapSearchItem(item: BGGSearchItem): BGGSearchResult | null {
  const result: BGGSearchResult = {
    id: item.id.toString(),
    name: item.name.value,
  };

  // Add year if available
  if (item.yearpublished)
    result.yearPublished = Number(item.yearpublished.value);

  return result;
}

/**
 * Transform BGG thing response to game details
 */
export function mapThingResponse(
  response: BGGThingResponse,
  bggId: string,
): BGGGameDetails {
  if (!response.items.item?.length)
    throw new BGGAPIError(`Game with BGG ID ${bggId} not found`, 404);

  const item = response.items.item[0];
  if (!item) {
    throw new BGGAPIError(`Game with BGG ID ${bggId} not found`, 404);
  }
  return mapThingItem(item, bggId);
}

/**
 * Transform multiple thing items to game details
 */
export function mapMultipleThingItems(
  response: BGGThingResponse,
): BGGGameDetails[] {
  if (!response.items.item?.length) return [];

  return response.items.item
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
function mapThingItem(item: BGGThingItem, bggId: string): BGGGameDetails {
  // Extract primary name from name field
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
function extractPrimaryName(item: BGGThingItem): string {
  // If name is an array, find the primary name
  if (Array.isArray(item.name)) {
    const primary = item.name.find(n => n.type === 'primary');
    return primary ? primary.value : item.name[0]?.value || 'Unknown';
  }
  // If name is a single object
  return item.name.value;
}

/**
 * Map basic fields from item to game details
 */
function mapBasicFields(item: BGGThingItem, result: BGGGameDetails): void {
  // Direct string fields
  if (
    hasProperty(item, "description") &&
    typeof item.description === "string"
  ) {
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
      const value = Number(item[source].value);
      result[target] = value;
    }
  }
}

/**
 * Map statistics fields from item to game details
 */
function mapStatistics(item: BGGThingItem, result: BGGGameDetails): void {
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
  if (!response.items || !response.items.item) return [];

  return response.items.item
    .map((item) => {
      if (item && typeof item === "object" && hasProperty(item, "id")) {
        return String(item.id);
      }
      return "";
    })
    .filter((id) => id !== "");
}
