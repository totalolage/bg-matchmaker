import { beforeEach, describe, expect, it } from "vitest";

import { Doc, Id } from "../_generated/dataModel";

import { SessionProposalEngine } from "./SessionProposalEngine";

// Mock user data for testing
const mockUser1: Doc<"users"> = {
  _id: "user1" as Id<"users">,
  _creationTime: Date.now(),
  discordId: "discord1",
  name: "user1",
  displayName: "User One",
  profilePic: "https://example.com/avatar1.png",
  email: "user1@example.com",
  role: "User",
  gameLibrary: [
    { gameId: "game1", gameName: "Game 1", expertiseLevel: "beginner" },
    { gameId: "game2", gameName: "Game 2", expertiseLevel: "intermediate" },
    { gameId: "game3", gameName: "Game 3", expertiseLevel: "expert" },
  ],
  availability: [
    {
      date: "2024-01-01",
      intervals: [
        { start: 600, end: 720 }, // 10am-12pm
        { start: 840, end: 960 }, // 2pm-4pm
      ],
    },
  ],
};

const mockUser2: Doc<"users"> = {
  _id: "user2" as Id<"users">,
  _creationTime: Date.now(),
  discordId: "discord2",
  name: "user2",
  displayName: "User Two",
  profilePic: "https://example.com/avatar2.png",
  email: "user2@example.com",
  role: "User",
  gameLibrary: [
    { gameId: "game2", gameName: "Game 2", expertiseLevel: "beginner" },
    { gameId: "game3", gameName: "Game 3", expertiseLevel: "intermediate" },
    { gameId: "game4", gameName: "Game 4", expertiseLevel: "expert" },
  ],
  availability: [
    {
      date: "2024-01-01",
      intervals: [
        { start: 660, end: 780 }, // 11am-1pm
        { start: 900, end: 1020 }, // 3pm-5pm
      ],
    },
  ],
};

const mockInteractions: Doc<"sessionInteractions">[] = [
  {
    _id: "interaction1" as Id<"sessionInteractions">,
    _creationTime: Date.now(),
    userId: "user1" as Id<"users">,
    sessionId: "session1" as Id<"sessions">,
    interactionType: "interested",
    createdAt: Date.now(),
    metadata: {
      swipeDirection: "right",
      deviceType: "desktop",
    },
  },
  {
    _id: "interaction2" as Id<"sessionInteractions">,
    _creationTime: Date.now(),
    userId: "user1" as Id<"users">,
    sessionId: "session2" as Id<"sessions">,
    interactionType: "accepted",
    createdAt: Date.now(),
    metadata: {
      swipeDirection: "right",
      deviceType: "mobile",
    },
  },
  {
    _id: "interaction3" as Id<"sessionInteractions">,
    _creationTime: Date.now(),
    userId: "user1" as Id<"users">,
    sessionId: "session3" as Id<"sessions">,
    interactionType: "declined",
    createdAt: Date.now(),
    metadata: {
      swipeDirection: "left",
      deviceType: "desktop",
    },
  },
];

describe("SessionProposalEngine", () => {
  let engine: SessionProposalEngine;

  beforeEach(() => {
    engine = new SessionProposalEngine(mockUser1, mockInteractions);
  });

  describe("calculateGamePreferenceOverlap", () => {
    it("should return 0 for empty game lists", () => {
      expect(engine.calculateGamePreferenceOverlap([], [])).toBe(0);
      expect(engine.calculateGamePreferenceOverlap(["game1"], [])).toBe(0);
      expect(engine.calculateGamePreferenceOverlap([], ["game1"])).toBe(0);
    });

    it("should return 1 for identical game lists", () => {
      const games = ["game1", "game2", "game3"];
      expect(engine.calculateGamePreferenceOverlap(games, games)).toBe(1);
    });

    it("should calculate correct overlap for partial matches", () => {
      const user1Games = ["game1", "game2", "game3"];
      const user2Games = ["game2", "game3", "game4"];
      // Intersection: game2, game3 (2 games)
      // Union: game1, game2, game3, game4 (4 games)
      // Score: 2/4 = 0.5
      expect(
        engine.calculateGamePreferenceOverlap(user1Games, user2Games)
      ).toBe(0.5);
    });

    it("should return 0 for no overlap", () => {
      const user1Games = ["game1", "game2"];
      const user2Games = ["game3", "game4"];
      expect(
        engine.calculateGamePreferenceOverlap(user1Games, user2Games)
      ).toBe(0);
    });

    it("should handle duplicate games correctly", () => {
      const user1Games = ["game1", "game1", "game2"];
      const user2Games = ["game1", "game2", "game2"];
      // Should treat as sets: {game1, game2} for both
      expect(
        engine.calculateGamePreferenceOverlap(user1Games, user2Games)
      ).toBe(1);
    });
  });

  describe("calculateTimeSlotCompatibility", () => {
    it("should return 0 for empty schedules", () => {
      expect(engine.calculateTimeSlotCompatibility([], [])).toBe(0);
      expect(
        engine.calculateTimeSlotCompatibility(
          [{ date: "2024-01-01", start: 600, end: 720 }],
          []
        )
      ).toBe(0);
    });

    it("should return high score for identical time slots", () => {
      const slots = [
        { date: "2024-01-01", start: 600, end: 720 },
        { date: "2024-01-01", start: 840, end: 960 },
      ];
      expect(engine.calculateTimeSlotCompatibility(slots, slots)).toBe(1);
    });

    it("should calculate partial overlap correctly", () => {
      const user1Slots = [{ date: "2024-01-01", start: 600, end: 720 }]; // 120 minutes duration
      const user2Slots = [{ date: "2024-01-01", start: 660, end: 780 }]; // 120 minutes duration
      // Overlap: 60 minutes (from 660 to 720)
      // Total time: 240 minutes
      // Score: (60 * 2) / 240 = 0.5
      expect(
        engine.calculateTimeSlotCompatibility(user1Slots, user2Slots)
      ).toBe(0.5);
    });

    it("should return 0 for non-overlapping schedules", () => {
      const user1Slots = [{ date: "2024-01-01", start: 600, end: 720 }];
      const user2Slots = [{ date: "2024-01-01", start: 840, end: 960 }];
      expect(
        engine.calculateTimeSlotCompatibility(user1Slots, user2Slots)
      ).toBe(0);
    });

    it("should return 0 for different dates", () => {
      const user1Slots = [{ date: "2024-01-01", start: 600, end: 720 }];
      const user2Slots = [{ date: "2024-01-02", start: 600, end: 720 }];
      expect(
        engine.calculateTimeSlotCompatibility(user1Slots, user2Slots)
      ).toBe(0);
    });

    it("should handle multiple overlapping slots", () => {
      const user1Slots = [
        { date: "2024-01-01", start: 600, end: 720 }, // 120 minutes
        { date: "2024-01-01", start: 840, end: 960 }, // 120 minutes
      ];
      const user2Slots = [
        { date: "2024-01-01", start: 660, end: 780 }, // 120 minutes
        { date: "2024-01-01", start: 900, end: 1020 }, // 120 minutes
      ];
      // Overlaps: 60 minutes (660-720) + 60 minutes (900-960) = 120 minutes total
      // Total time: 480 minutes
      // Score: (120 * 2) / 480 = 0.5
      expect(
        engine.calculateTimeSlotCompatibility(user1Slots, user2Slots)
      ).toBe(0.5);
    });
  });

  describe("calculateSuccessRate", () => {
    it("should return 0.5 for users with no interactions", () => {
      expect(engine.calculateSuccessRate("newuser" as Id<"users">, [])).toBe(
        0.5
      );
    });

    it("should return 0.5 for empty interaction list", () => {
      expect(engine.calculateSuccessRate("user1" as Id<"users">, [])).toBe(0.5);
    });

    it("should calculate success rate correctly", () => {
      const interactions: Doc<"sessionInteractions">[] = [
        {
          _id: "int1" as Id<"sessionInteractions">,
          _creationTime: Date.now(),
          userId: "user1" as Id<"users">,
          sessionId: "session1" as Id<"sessions">,
          interactionType: "interested",
          createdAt: Date.now(),
          metadata: { swipeDirection: "right", deviceType: "desktop" },
        },
        {
          _id: "int2" as Id<"sessionInteractions">,
          _creationTime: Date.now(),
          userId: "user1" as Id<"users">,
          sessionId: "session2" as Id<"sessions">,
          interactionType: "accepted",
          createdAt: Date.now(),
          metadata: { swipeDirection: "right", deviceType: "desktop" },
        },
        {
          _id: "int3" as Id<"sessionInteractions">,
          _creationTime: Date.now(),
          userId: "user1" as Id<"users">,
          sessionId: "session3" as Id<"sessions">,
          interactionType: "declined",
          createdAt: Date.now(),
          metadata: { swipeDirection: "left", deviceType: "desktop" },
        },
      ];

      // Score: interested (1.0) + accepted (1.2) + declined (0) = 2.2
      // Max possible: 3 * 1.2 = 3.6
      // Result: 2.2 / 3.6 ≈ 0.611
      const rate = engine.calculateSuccessRate(
        "user1" as Id<"users">,
        interactions
      );
      expect(rate).toBeCloseTo(0.611, 2);
    });

    it("should give higher weight to accepted interactions", () => {
      const acceptedOnly: Doc<"sessionInteractions">[] = [
        {
          _id: "int1" as Id<"sessionInteractions">,
          _creationTime: Date.now(),
          userId: "user1" as Id<"users">,
          sessionId: "session1" as Id<"sessions">,
          interactionType: "accepted",
          createdAt: Date.now(),
          metadata: { swipeDirection: "right", deviceType: "desktop" },
        },
      ];

      const interestedOnly: Doc<"sessionInteractions">[] = [
        {
          _id: "int2" as Id<"sessionInteractions">,
          _creationTime: Date.now(),
          userId: "user1" as Id<"users">,
          sessionId: "session2" as Id<"sessions">,
          interactionType: "interested",
          createdAt: Date.now(),
          metadata: { swipeDirection: "right", deviceType: "desktop" },
        },
      ];

      const acceptedRate = engine.calculateSuccessRate(
        "user1" as Id<"users">,
        acceptedOnly
      );
      const interestedRate = engine.calculateSuccessRate(
        "user1" as Id<"users">,
        interestedOnly
      );

      expect(acceptedRate).toBeGreaterThan(interestedRate);
    });

    it("should return 0 for all declined interactions", () => {
      const allDeclined: Doc<"sessionInteractions">[] = [
        {
          _id: "int1" as Id<"sessionInteractions">,
          _creationTime: Date.now(),
          userId: "user1" as Id<"users">,
          sessionId: "session1" as Id<"sessions">,
          interactionType: "declined",
          createdAt: Date.now(),
          metadata: { swipeDirection: "left", deviceType: "desktop" },
        },
        {
          _id: "int2" as Id<"sessionInteractions">,
          _creationTime: Date.now(),
          userId: "user1" as Id<"users">,
          sessionId: "session2" as Id<"sessions">,
          interactionType: "declined",
          createdAt: Date.now(),
          metadata: { swipeDirection: "left", deviceType: "desktop" },
        },
      ];

      expect(
        engine.calculateSuccessRate("user1" as Id<"users">, allDeclined)
      ).toBe(0);
    });
  });

  describe("generateProposals", () => {
    it("should generate proposals for compatible users", async () => {
      const potentialMatches = [
        {
          user: mockUser2,
          interactions: [],
        },
      ];

      const proposals = await engine.generateProposals(potentialMatches, 5);

      expect(proposals.length).toBeGreaterThan(0);
      const firstProposal = proposals[0];
      expect(firstProposal).toBeDefined();
      if (firstProposal) {
        expect(firstProposal.proposedToUserId).toBe(mockUser1._id);
        expect(firstProposal.proposedParticipants).toContain(mockUser1._id);
        expect(firstProposal.proposedParticipants).toContain(mockUser2._id);
      }
    });

    it("should not generate self-matching proposals", async () => {
      const potentialMatches = [
        {
          user: mockUser1, // Same user
          interactions: [],
        },
      ];

      const proposals = await engine.generateProposals(potentialMatches, 5);

      expect(proposals.length).toBe(0);
    });

    it("should respect the limit parameter", async () => {
      const manyMatches = Array(20)
        .fill(null)
        .map((_, i) => ({
          user: {
            ...mockUser2,
            _id: `user${i}` as Id<"users">,
          },
          interactions: [],
        }));

      const proposals = await engine.generateProposals(manyMatches, 5);

      expect(proposals.length).toBeLessThanOrEqual(5);
    });

    it("should sort proposals by overall score", async () => {
      // Create users with varying compatibility
      const matches = [
        {
          user: {
            ...mockUser2,
            _id: "lowMatch" as Id<"users">,
            gameLibrary: [
              {
                gameId: "game10",
                gameName: "Game 10",
                expertiseLevel: "beginner" as const,
              },
            ], // No overlap
          },
          interactions: [],
        },
        {
          user: {
            ...mockUser2,
            _id: "highMatch" as Id<"users">,
            gameLibrary: mockUser1.gameLibrary, // Perfect overlap
          },
          interactions: [],
        },
      ];

      const proposals = await engine.generateProposals(matches, 10);

      expect(proposals.length).toBe(1); // Only high match should pass threshold
      const firstProposal = proposals[0];
      expect(firstProposal).toBeDefined();
      if (firstProposal) {
        expect(firstProposal.proposedParticipants).toContain("highMatch");
      }
    });
  });
});
