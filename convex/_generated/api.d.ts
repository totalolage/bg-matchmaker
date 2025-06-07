/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as feedback from "../feedback.js";
import type * as games from "../games.js";
import type * as http from "../http.js";
import type * as lib_bggSchemas from "../lib/bggSchemas.js";
import type * as lib_bgg_data_source_api_client from "../lib/bgg_data_source/api_client.js";
import type * as lib_bgg_data_source_bgg_service from "../lib/bgg_data_source/bgg_service.js";
import type * as lib_bgg_data_source_index from "../lib/bgg_data_source/index.js";
import type * as lib_bgg_data_source_mappers from "../lib/bgg_data_source/mappers.js";
import type * as lib_bgg_data_source_rate_limiter from "../lib/bgg_data_source/rate_limiter.js";
import type * as lib_bgg_data_source_types from "../lib/bgg_data_source/types.js";
import type * as lib_bgg_data_source_xml_parser from "../lib/bgg_data_source/xml_parser.js";
import type * as lib_utils from "../lib/utils.js";
import type * as router from "../router.js";
import type * as sessions from "../sessions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  feedback: typeof feedback;
  games: typeof games;
  http: typeof http;
  "lib/bggSchemas": typeof lib_bggSchemas;
  "lib/bgg_data_source/api_client": typeof lib_bgg_data_source_api_client;
  "lib/bgg_data_source/bgg_service": typeof lib_bgg_data_source_bgg_service;
  "lib/bgg_data_source/index": typeof lib_bgg_data_source_index;
  "lib/bgg_data_source/mappers": typeof lib_bgg_data_source_mappers;
  "lib/bgg_data_source/rate_limiter": typeof lib_bgg_data_source_rate_limiter;
  "lib/bgg_data_source/types": typeof lib_bgg_data_source_types;
  "lib/bgg_data_source/xml_parser": typeof lib_bgg_data_source_xml_parser;
  "lib/utils": typeof lib_utils;
  router: typeof router;
  sessions: typeof sessions;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: {
    lib: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
    public: {
      checkRateLimit: FunctionReference<
        "query",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      rateLimit: FunctionReference<
        "mutation",
        "internal",
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
              }
            | {
                capacity?: number;
                kind: "fixed window";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: number;
              };
          count?: number;
          key?: string;
          name: string;
          reserve?: boolean;
          throws?: boolean;
        },
        { ok: true; retryAfter?: number } | { ok: false; retryAfter: number }
      >;
      resetRateLimit: FunctionReference<
        "mutation",
        "internal",
        { key?: string; name: string },
        null
      >;
    };
  };
};
