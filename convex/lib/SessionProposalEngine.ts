import { Doc, Id } from "../_generated/dataModel";

export interface TimeSlot {
  date: string;
  start: number;
  end: number;
}

export interface SessionInteraction {
  participantIds: Id<"users">[];
  interactionType: "interested" | "declined" | "accepted";
  sessionId: Id<"sessions">;
}

export interface ProposalScore {
  preferenceScore: number;
  timeCompatibilityScore: number;
  successRateScore: number;
  overallScore: number;
}

export interface SessionProposal extends ProposalScore {
  proposedToUserId: Id<"users">;
  proposedByAlgorithm: boolean;
  gameId: string;
  gameName: string;
  gameImage?: string;
  proposedParticipants: Id<"users">[];
  proposedDateTime: number;
  status: "pending" | "accepted" | "declined" | "expired";
  reason: string;
  createdAt: number;
  expiresAt?: number;
  metadata?: {
    commonGames?: string[];
    overlappingTimeSlots?: number;
  };
}

export class SessionProposalEngine {
  private user: Doc<"users">;
  private userInteractions: Doc<"sessionInteractions">[];

  constructor(
    user: Doc<"users">,
    userInteractions: Doc<"sessionInteractions">[],
  ) {
    this.user = user;
    this.userInteractions = userInteractions;
  }

  /**
   * Calculate the overlap between two users' game preferences
   * Returns a score between 0 and 1
   */
  calculateGamePreferenceOverlap(
    user1Games: string[],
    user2Games: string[],
  ): number {
    if (!user1Games.length || !user2Games.length) {
      return 0;
    }

    const user1Set = new Set(user1Games);
    const user2Set = new Set(user2Games);
    const intersection = new Set(
      [...user1Set].filter(game => user2Set.has(game)),
    );

    // Jaccard similarity coefficient
    const union = new Set([...user1Set, ...user2Set]);
    return intersection.size / union.size;
  }

  /**
   * Calculate time slot compatibility between two users
   * Returns a score between 0 and 1 based on overlapping availability
   */
  calculateTimeSlotCompatibility(
    user1Schedule: TimeSlot[],
    user2Schedule: TimeSlot[],
  ): number {
    if (!user1Schedule.length || !user2Schedule.length) {
      return 0;
    }

    let totalOverlap = 0;
    let totalPossibleTime = 0;

    // Calculate total overlap duration
    for (const slot1 of user1Schedule) {
      for (const slot2 of user2Schedule) {
        // Only compare slots on the same date
        if (slot1.date === slot2.date) {
          const overlapStart = Math.max(slot1.start, slot2.start);
          const overlapEnd = Math.min(slot1.end, slot2.end);

          if (overlapStart < overlapEnd) {
            totalOverlap += overlapEnd - overlapStart;
          }
        }
      }
    }

    // Calculate total possible time (sum of all time slots)
    const allSlots = [...user1Schedule, ...user2Schedule];
    for (const slot of allSlots) {
      totalPossibleTime += slot.end - slot.start;
    }

    // Avoid division by zero
    if (totalPossibleTime === 0) {
      return 0;
    }

    // Return normalized overlap score (doubled to account for counting both users' time)
    return Math.min((totalOverlap * 2) / totalPossibleTime, 1);
  }

  /**
   * Calculate success rate based on user's previous interactions
   * Returns a score between 0 and 1
   */
  calculateSuccessRate(
    userId: Id<"users">,
    interactions: Doc<"sessionInteractions">[],
  ): number {
    if (!interactions.length) {
      // New users get a neutral score
      return 0.5;
    }

    const userInteractions = interactions.filter(
      interaction => interaction.userId === userId,
    );

    if (!userInteractions.length) {
      return 0.5;
    }

    // Calculate success rate with a slight boost for accepted interactions
    let score = 0;
    for (const interaction of userInteractions) {
      if (interaction.interactionType === "accepted") {
        score += 1.2; // Accepted is worth more
      } else if (interaction.interactionType === "interested") {
        score += 1.0;
      }
      // Declined adds 0
    }

    // Normalize to 0-1 range
    const maxPossibleScore = userInteractions.length * 1.2;
    return Math.min(score / maxPossibleScore, 1);
  }

  /**
   * Calculate overall proposal score combining all factors
   */
  private calculateOverallScore(
    scores: Omit<ProposalScore, "overallScore">,
  ): number {
    // Weighted average with game preference being most important
    const weights = {
      preference: 0.5,
      time: 0.3,
      success: 0.2,
    };

    return (
      scores.preferenceScore * weights.preference +
      scores.timeCompatibilityScore * weights.time +
      scores.successRateScore * weights.success
    );
  }

  /**
   * Generate session proposals for the current user
   */
  async generateProposals(
    potentialMatches: Array<{
      user: Doc<"users">;
      interactions: Doc<"sessionInteractions">[];
    }>,
    limit: number = 10,
  ): Promise<SessionProposal[]> {
    const proposals: SessionProposal[] = [];

    for (const match of potentialMatches) {
      const otherUser = match.user;

      // Skip self-matching
      if (otherUser._id === this.user._id) {
        continue;
      }

      // Calculate individual scores
      const preferenceScore = this.calculateGamePreferenceOverlap(
        this.user.gameLibrary.map(g => g.gameId),
        otherUser.gameLibrary.map(g => g.gameId),
      );

      // Convert availability to TimeSlot format
      const userTimeSlots: TimeSlot[] = [];
      for (const dayAvail of this.user.availability) {
        for (const interval of dayAvail.intervals) {
          userTimeSlots.push({
            date: dayAvail.date,
            start: interval.start,
            end: interval.end,
          });
        }
      }

      const otherUserTimeSlots: TimeSlot[] = [];
      for (const dayAvail of otherUser.availability) {
        for (const interval of dayAvail.intervals) {
          otherUserTimeSlots.push({
            date: dayAvail.date,
            start: interval.start,
            end: interval.end,
          });
        }
      }

      const timeCompatibilityScore = this.calculateTimeSlotCompatibility(
        userTimeSlots,
        otherUserTimeSlots,
      );

      const successRateScore = this.calculateSuccessRate(
        otherUser._id,
        match.interactions,
      );

      const overallScore = this.calculateOverallScore({
        preferenceScore,
        timeCompatibilityScore,
        successRateScore,
      });

      // Only propose if there's some minimum compatibility
      if (overallScore > 0.3) {
        // Find common games for the proposal
        const commonGames = this.user.gameLibrary
          .filter(g1 =>
            otherUser.gameLibrary.some(g2 => g2.gameId === g1.gameId),
          )
          .map(g => g.gameId);

        if (commonGames.length > 0) {
          // Find overlapping time slots
          const overlappingSlots = this.findOverlappingTimeSlots(
            userTimeSlots,
            otherUserTimeSlots,
          );

          if (overlappingSlots.length > 0 && commonGames[0]) {
            const firstSlot = overlappingSlots[0];
            if (firstSlot) {
              // Get the game details from the user's library
              const gameDetails = this.user.gameLibrary.find(
                g => g.gameId === commonGames[0],
              );

              proposals.push({
                proposedToUserId: this.user._id,
                proposedByAlgorithm: true,
                gameId: commonGames[0], // Pick the first common game
                gameName: gameDetails?.gameName || "Unknown Game",
                gameImage: gameDetails?.gameImage,
                proposedParticipants: [this.user._id, otherUser._id],
                proposedDateTime: this.calculateProposedDateTime(firstSlot),
                status: "pending",
                preferenceScore,
                timeCompatibilityScore,
                successRateScore,
                overallScore,
                reason: this.generateProposalReason(
                  preferenceScore,
                  timeCompatibilityScore,
                  successRateScore,
                ),
                createdAt: Date.now(),
                expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
                metadata: {
                  commonGames,
                  overlappingTimeSlots: overlappingSlots.length,
                },
              });
            }
          }
        }
      }
    }

    // Sort by overall score and return top proposals
    return proposals
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, limit);
  }

  /**
   * Find overlapping time slots between two schedules
   */
  private findOverlappingTimeSlots(
    schedule1: TimeSlot[],
    schedule2: TimeSlot[],
  ): TimeSlot[] {
    const overlaps: TimeSlot[] = [];

    for (const slot1 of schedule1) {
      for (const slot2 of schedule2) {
        // Only find overlaps on the same date
        if (slot1.date === slot2.date) {
          const overlapStart = Math.max(slot1.start, slot2.start);
          const overlapEnd = Math.min(slot1.end, slot2.end);

          if (overlapStart < overlapEnd) {
            overlaps.push({
              date: slot1.date,
              start: overlapStart,
              end: overlapEnd,
            });
          }
        }
      }
    }

    return overlaps;
  }

  /**
   * Calculate proposed date time from time slot
   */
  private calculateProposedDateTime(slot: TimeSlot): number {
    const proposedDate = new Date(slot.date);
    proposedDate.setHours(Math.floor(slot.start / 60));
    proposedDate.setMinutes(slot.start % 60);
    return proposedDate.getTime();
  }

  /**
   * Generate a human-readable reason for the proposal
   */
  private generateProposalReason(
    preferenceScore: number,
    timeScore: number,
    successScore: number,
  ): string {
    const reasons: string[] = [];

    if (preferenceScore > 0.7) {
      reasons.push("Strong game preference match");
    } else if (preferenceScore > 0.4) {
      reasons.push("Good game overlap");
    }

    if (timeScore > 0.7) {
      reasons.push("Excellent schedule compatibility");
    } else if (timeScore > 0.4) {
      reasons.push("Good availability match");
    }

    if (successScore > 0.8) {
      reasons.push("High engagement history");
    }

    return (
      reasons.join(", ") || "Potential match based on overall compatibility"
    );
  }
}
