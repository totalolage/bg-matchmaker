/**
 * XML parsing utilities for BGG API responses
 */
import { XMLParser } from "fast-xml-parser";

import {
  BGGHotResponse,
  BGGSearchResponse,
  BGGThingResponse,
  validateHotResponse,
  validateSearchResponse,
  validateThingResponse,
} from "../bggSchemas";

import { BGGAPIError } from "./types";

// Parser configuration
const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "text",
  parseAttributeValue: true,
  processEntities: true,
  htmlEntities: true,
};

const parser = new XMLParser(parserOptions);

/**
 * Helper to normalize items.item to always be an array
 * We can't use arktype here because it doesn't support dynamic object manipulation
 * in the way we need for this normalization
 */
function normalizeItemsArray(data: unknown): unknown {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  // Create a shallow copy to avoid mutation
  const result = { ...data } as Record<string, unknown>;

  if (
    result.items &&
    typeof result.items === "object" &&
    result.items !== null
  ) {
    const items = { ...result.items } as Record<string, unknown>;

    if (items.item && !Array.isArray(items.item)) {
      items.item = [items.item];
    }

    result.items = items;
  }

  return result;
}

/**
 * Parse and validate BGG search response
 */
export function parseSearchResponse(xmlData: string): BGGSearchResponse {
  const parsed = parser.parse(xmlData);

  // Create a normalized version of the parsed data
  const normalized = normalizeItemsArray(parsed);

  try {
    validateSearchResponse(normalized);
    return normalized;
  } catch (error) {
    throw new BGGAPIError(
      "Invalid response format from BGG search API",
      undefined,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

/**
 * Parse and validate BGG thing/details response
 */
export function parseThingResponse(xmlData: string): BGGThingResponse {
  const parsed = parser.parse(xmlData);

  // Create a normalized version of the parsed data
  const normalized = normalizeItemsArray(parsed);

  try {
    validateThingResponse(normalized);
    return normalized;
  } catch (error) {
    throw new BGGAPIError(
      "Invalid response format from BGG thing API",
      undefined,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

/**
 * Parse and validate BGG hot games response
 */
export function parseHotResponse(xmlData: string): BGGHotResponse {
  const parsed = parser.parse(xmlData);

  // Create a normalized version of the parsed data
  const normalized = normalizeItemsArray(parsed);

  try {
    validateHotResponse(normalized);
    return normalized;
  } catch (error) {
    throw new BGGAPIError(
      "Invalid response format from BGG hot API",
      undefined,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}
