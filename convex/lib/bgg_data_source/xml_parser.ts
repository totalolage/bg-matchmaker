/**
 * XML parsing utilities for BGG API responses
 */
import { XMLParser } from "fast-xml-parser";
import { BGGAPIError } from "./types";
import {
  validateSearchResponse,
  validateThingResponse,
  validateHotResponse,
  BGGSearchResponse,
  BGGThingResponse,
  BGGHotResponse,
} from "../bggSchemas";

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