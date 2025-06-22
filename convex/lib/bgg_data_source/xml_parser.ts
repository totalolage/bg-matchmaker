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
};

const parser = new XMLParser(parserOptions);

/**
 * Parse and validate BGG search response
 */
export function parseSearchResponse(xmlData: string): BGGSearchResponse {
  const parsed = parser.parse(xmlData);
  
  // Normalize items.item to always be an array
  if (parsed.items && parsed.items.item && !Array.isArray(parsed.items.item)) {
    parsed.items.item = [parsed.items.item];
  }
  
  try {
    validateSearchResponse(parsed);
    return parsed;
  } catch (error) {
    throw new BGGAPIError(
      "Invalid response format from BGG search API",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Parse and validate BGG thing/details response
 */
export function parseThingResponse(xmlData: string): BGGThingResponse {
  const parsed = parser.parse(xmlData);
  
  // Normalize items.item to always be an array
  if (parsed.items && parsed.items.item && !Array.isArray(parsed.items.item)) {
    parsed.items.item = [parsed.items.item];
  }
  
  try {
    validateThingResponse(parsed);
    return parsed;
  } catch (error) {
    throw new BGGAPIError(
      "Invalid response format from BGG thing API",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Parse and validate BGG hot games response
 */
export function parseHotResponse(xmlData: string): BGGHotResponse {
  const parsed = parser.parse(xmlData);
  
  // Normalize items.item to always be an array
  if (parsed.items && parsed.items.item && !Array.isArray(parsed.items.item)) {
    parsed.items.item = [parsed.items.item];
  }
  
  try {
    validateHotResponse(parsed);
    return parsed;
  } catch (error) {
    throw new BGGAPIError(
      "Invalid response format from BGG hot API",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}


