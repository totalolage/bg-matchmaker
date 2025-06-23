import { type } from "arktype";

// BGG API XML Response Schemas

// Common types
const bggNameType = type({
  value: "string",
  type: "string",
});

const bggValueType = type({
  value: "number",
});

// Search API response types
export const bggSearchItemType = type({
  id: "number",
  name: bggNameType,
  "yearpublished?": bggValueType,
});

export const bggSearchResponseType = type({
  items: {
    "item?": type(bggSearchItemType, "[]"),
  },
});

// Thing API response types
const bggStatisticsType = type({
  ratings: {
    "average?": bggValueType,
    "averageweight?": bggValueType,
    "bayesaverage?": bggValueType,
    "stddev?": bggValueType,
    "median?": bggValueType,
    "owned?": bggValueType,
    "trading?": bggValueType,
    "wanting?": bggValueType,
    "wishing?": bggValueType,
    "numcomments?": bggValueType,
    "numweights?": bggValueType,
    "usersrated?": bggValueType,
  },
});

export const bggThingItemType = type({
  id: "number",
  name: type([bggNameType, "|", type(bggNameType, "[]")]),
  "description?": "string",
  "yearpublished?": bggValueType,
  "minplayers?": bggValueType,
  "maxplayers?": bggValueType,
  "playingtime?": bggValueType,
  "minplaytime?": bggValueType,
  "maxplaytime?": bggValueType,
  "minage?": bggValueType,
  "image?": "string",
  "thumbnail?": "string",
  "statistics?": bggStatisticsType,
});

export const bggThingResponseType = type({
  items: {
    "item?": type(bggThingItemType, "[]"),
  },
});

// Hot games API response types
export const bggHotItemType = type({
  id: "number",
  rank: "number",
  name: bggNameType,
  "yearpublished?": {
    value: type(["string", "|", "number"]),
  },
  thumbnail: {
    value: "string",
  },
});

export const bggHotResponseType = type({
  items: {
    "item?": type(bggHotItemType, "[]"),
  },
});

// Type guards and validators
export function validateSearchResponse(
  data: unknown
): asserts data is typeof bggSearchResponseType.infer {
  const result = bggSearchResponseType(data);
  if (result instanceof type.errors) {
    throw new Error(`Invalid BGG search response: ${result.summary}`);
  }
}

export function validateThingResponse(
  data: unknown
): asserts data is typeof bggThingResponseType.infer {
  const result = bggThingResponseType(data);
  if (result instanceof type.errors) {
    throw new Error(`Invalid BGG thing response: ${result.summary}`);
  }
}

export function validateHotResponse(
  data: unknown
): asserts data is typeof bggHotResponseType.infer {
  const result = bggHotResponseType(data);
  if (result instanceof type.errors) {
    throw new Error(`Invalid BGG hot response: ${result.summary}`);
  }
}

// Type exports for use in other files
export type BGGSearchItem = typeof bggSearchItemType.infer;
export type BGGThingItem = typeof bggThingItemType.infer;
export type BGGHotItem = typeof bggHotItemType.infer;
export type BGGName = typeof bggNameType.infer;
export type BGGSearchResponse = typeof bggSearchResponseType.infer;
export type BGGThingResponse = typeof bggThingResponseType.infer;
export type BGGHotResponse = typeof bggHotResponseType.infer;
