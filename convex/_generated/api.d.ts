/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_makeAdmin from "../admin/makeAdmin.js";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as feedback from "../feedback.js";
import type * as games from "../games.js";
import type * as http from "../http.js";
import type * as lib_SessionProposalEngine from "../lib/SessionProposalEngine.js";
import type * as lib_adminAuth from "../lib/adminAuth.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_bggSchemas from "../lib/bggSchemas.js";
import type * as lib_bgg_data_source_api_client from "../lib/bgg_data_source/api_client.js";
import type * as lib_bgg_data_source_bgg_service from "../lib/bgg_data_source/bgg_service.js";
import type * as lib_bgg_data_source_index from "../lib/bgg_data_source/index.js";
import type * as lib_bgg_data_source_mappers from "../lib/bgg_data_source/mappers.js";
import type * as lib_bgg_data_source_rate_limiter from "../lib/bgg_data_source/rate_limiter.js";
import type * as lib_bgg_data_source_types from "../lib/bgg_data_source/types.js";
import type * as lib_bgg_data_source_xml_parser from "../lib/bgg_data_source/xml_parser.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_utils from "../lib/utils.js";
import type * as migrations_populateAlternateNames from "../migrations/populateAlternateNames.js";
import type * as migrations_populateSearchText from "../migrations/populateSearchText.js";
import type * as notifications_helpers from "../notifications/helpers.js";
import type * as notifications_triggers from "../notifications/triggers.js";
import type * as notifications_worker from "../notifications/worker.js";
import type * as notifications from "../notifications.js";
import type * as router from "../router.js";
import type * as seed from "../seed.js";
import type * as sessionInteractions from "../sessionInteractions.js";
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
  "admin/makeAdmin": typeof admin_makeAdmin;
  admin: typeof admin;
  auth: typeof auth;
  feedback: typeof feedback;
  games: typeof games;
  http: typeof http;
  "lib/SessionProposalEngine": typeof lib_SessionProposalEngine;
  "lib/adminAuth": typeof lib_adminAuth;
  "lib/auth": typeof lib_auth;
  "lib/bggSchemas": typeof lib_bggSchemas;
  "lib/bgg_data_source/api_client": typeof lib_bgg_data_source_api_client;
  "lib/bgg_data_source/bgg_service": typeof lib_bgg_data_source_bgg_service;
  "lib/bgg_data_source/index": typeof lib_bgg_data_source_index;
  "lib/bgg_data_source/mappers": typeof lib_bgg_data_source_mappers;
  "lib/bgg_data_source/rate_limiter": typeof lib_bgg_data_source_rate_limiter;
  "lib/bgg_data_source/types": typeof lib_bgg_data_source_types;
  "lib/bgg_data_source/xml_parser": typeof lib_bgg_data_source_xml_parser;
  "lib/constants": typeof lib_constants;
  "lib/utils": typeof lib_utils;
  "migrations/populateAlternateNames": typeof migrations_populateAlternateNames;
  "migrations/populateSearchText": typeof migrations_populateSearchText;
  "notifications/helpers": typeof notifications_helpers;
  "notifications/triggers": typeof notifications_triggers;
  "notifications/worker": typeof notifications_worker;
  notifications: typeof notifications;
  router: typeof router;
  seed: typeof seed;
  sessionInteractions: typeof sessionInteractions;
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
                start?: null;
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
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
      getValue: FunctionReference<
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
                start?: null;
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
          key?: string;
          name: string;
          sampleShards?: number;
        },
        {
          config:
            | {
                capacity?: number;
                kind: "token bucket";
                maxReserved?: number;
                period: number;
                rate: number;
                shards?: number;
                start?: null;
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
          shard: number;
          ts: number;
          value: number;
        }
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
                start?: null;
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
    time: {
      getServerTime: FunctionReference<"mutation", "internal", {}, number>;
    };
  };
};
