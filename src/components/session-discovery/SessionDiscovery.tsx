import { AnimatePresence, motion } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Doc } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

import { SessionProposal } from "./SessionProposal";

interface SessionDiscoveryProps {
  sessions: (Doc<"sessions"> & { matchScore?: number })[];
  onDecline: (sessionId: string) => void;
  onInterest: (sessionId: string) => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
}

const variants = {
  enter: {
    x: 0,
    opacity: 0,
    scale: 0.8,
  },
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exitLeft: {
    x: -400,
    opacity: 0,
    scale: 0.8,
  },
  exitRight: {
    x: 400,
    opacity: 0,
    scale: 0.8,
  },
};

export const SessionDiscovery = ({
  sessions,
  onDecline,
  onInterest,
  onLoadMore,
  isLoading = false,
}: SessionDiscoveryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(
    null
  );
  const [history, setHistory] = useState<
    { sessionId: string; action: "declined" | "interested" }[]
  >([]);

  // Reset index when sessions change (e.g., after optimistic updates)
  useEffect(() => {
    setCurrentIndex(0);
  }, [sessions]);

  const currentSession = sessions[currentIndex];

  const handleDecline = () => {
    if (!currentSession) return;

    setExitDirection("left");

    // Update history immediately for undo functionality
    setHistory(prev => [
      ...prev,
      { sessionId: currentSession._id, action: "declined" },
    ]);

    // Call the parent handler immediately (optimistic update)
    onDecline(currentSession._id);

    // Reset exit direction after animation completes
    setTimeout(() => {
      setExitDirection(null);
    }, 300);

    // Trigger load more when running low on sessions
    if (sessions.length <= 3 && onLoadMore) {
      onLoadMore();
    }
  };

  const handleInterest = () => {
    if (!currentSession) return;

    setExitDirection("right");

    // Update history immediately for undo functionality
    setHistory(prev => [
      ...prev,
      { sessionId: currentSession._id, action: "interested" },
    ]);

    // Call the parent handler immediately (optimistic update)
    onInterest(currentSession._id);

    // Reset exit direction after animation completes
    setTimeout(() => {
      setExitDirection(null);
    }, 300);

    // Trigger load more when running low on sessions
    if (sessions.length <= 3 && onLoadMore) {
      onLoadMore();
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setHistory([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;

    setHistory(prev => prev.slice(0, -1));

    // TODO: Also undo the database action and re-show the session
    // This will require coordination with the parent component
    console.log("Undo not yet fully implemented for optimistic updates");
  };

  if (!currentSession && !isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            No more sessions to discover
          </h3>
          <p className="text-muted-foreground">
            You've gone through all available sessions. Check back later for new
            ones!
          </p>
          {sessions.length > 0 && (
            <Button onClick={handleReset} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Start over
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Card display */}
      <AnimatePresence>
        {currentSession && (
          <motion.div
            key={currentSession._id}
            className="absolute inset-0"
            custom={exitDirection}
            variants={variants}
            initial="enter"
            animate="center"
            exit={
              exitDirection === "left"
                ? "exitLeft"
                : exitDirection === "right"
                  ? "exitRight"
                  : "exitLeft"
            }
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          >
            <SessionProposal
              session={currentSession}
              onDecline={handleDecline}
              onInterest={handleInterest}
              onUndo={handleUndo}
              canUndo={history.length > 0}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator */}
      {isLoading && !currentSession && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};
