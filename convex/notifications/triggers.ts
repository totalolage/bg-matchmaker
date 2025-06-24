import { v } from "convex/values";

import { api } from "../_generated/api";
import { mutation } from "../_generated/server";

// Send notification when a new session proposal is created
export const notifyNewProposal = mutation({
  args: {
    proposalId: v.id("sessionProposals"),
  },
  handler: async (ctx, args) => {
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) return;

    await ctx.runMutation(api.notifications.queueNotification, {
      userId: proposal.proposedToUserId,
      type: "new_proposal",
      title: "New Game Session Proposal",
      body: `You've been invited to play ${proposal.gameName}!`,
      data: {
        url: `/proposals`,
        tag: `proposal-${proposal._id}`,
        requireInteraction: true,
        actions: [
          {
            action: "view",
            title: "View Proposal",
          },
          {
            action: "dismiss",
            title: "Later",
          },
        ],
      },
    });
  },
});

// Send notification when a player joins a session
export const notifyPlayerJoined = mutation({
  args: {
    sessionId: v.id("sessions"),
    playerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;

    const player = await ctx.db.get(args.playerId);
    if (!player) return;

    // Notify the host
    await ctx.runMutation(api.notifications.queueNotification, {
      userId: session.hostId,
      type: "player_joined",
      title: "Player Joined",
      body: `${player.displayName || player.name} joined your ${session.gameName} session`,
      data: {
        url: `/sessions/${session._id}`,
        sessionId: session._id,
        tag: `session-${session._id}`,
      },
    });

    // Notify other players
    for (const otherPlayerId of session.players) {
      if (otherPlayerId !== args.playerId && otherPlayerId !== session.hostId) {
        await ctx.runMutation(api.notifications.queueNotification, {
          userId: otherPlayerId,
          type: "player_joined",
          title: "Player Joined",
          body: `${player.displayName || player.name} joined the ${session.gameName} session`,
          data: {
            url: `/sessions/${session._id}`,
            sessionId: session._id,
            tag: `session-${session._id}`,
          },
        });
      }
    }
  },
});

// Send notification when a session is confirmed
export const notifySessionConfirmed = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.scheduledTime) return;

    const sessionDate = new Date(session.scheduledTime).toLocaleString();

    // Notify all players
    for (const playerId of session.players) {
      await ctx.runMutation(api.notifications.queueNotification, {
        userId: playerId,
        type: "session_confirmed",
        title: "Session Confirmed!",
        body: `${session.gameName} session confirmed for ${sessionDate}`,
        data: {
          url: `/sessions/${session._id}`,
          sessionId: session._id,
          tag: `session-${session._id}`,
          requireInteraction: true,
        },
      });
    }
  },
});

// Send notification when a session is cancelled
export const notifySessionCancelled = mutation({
  args: {
    sessionId: v.id("sessions"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;

    // Notify all players
    for (const playerId of session.players) {
      await ctx.runMutation(api.notifications.queueNotification, {
        userId: playerId,
        type: "session_cancelled",
        title: "Session Cancelled",
        body: `${session.gameName} session has been cancelled${
          args.reason ? `: ${args.reason}` : ""
        }`,
        data: {
          url: `/sessions`,
          sessionId: session._id,
          tag: `session-${session._id}`,
          requireInteraction: true,
        },
      });
    }
  },
});

// Send reminder notification before a session
export const notifySessionReminder = mutation({
  args: {
    sessionId: v.id("sessions"),
    minutesBefore: v.number(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.scheduledTime) return;

    const sessionDate = new Date(session.scheduledTime).toLocaleString();
    const timeText =
      args.minutesBefore >= 60 ?
        `${Math.floor(args.minutesBefore / 60)} hour${
          args.minutesBefore >= 120 ? "s" : ""
        }`
      : `${args.minutesBefore} minutes`;

    // Notify all players
    for (const playerId of session.players) {
      await ctx.runMutation(api.notifications.queueNotification, {
        userId: playerId,
        type: "session_reminder",
        title: "Session Reminder",
        body: `${session.gameName} starts in ${timeText} (${sessionDate}) at ${session.location || "TBD"}`,
        data: {
          url: `/sessions/${session._id}`,
          sessionId: session._id,
          tag: `session-reminder-${session._id}`,
          requireInteraction: true,
          actions: [
            {
              action: "view",
              title: "View Details",
            },
          ],
        },
      });
    }
  },
});
