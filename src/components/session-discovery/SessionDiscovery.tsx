import { AnimatePresence, motion } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";

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
  const [currentSessionIds, setCurrentSessionIds] = useState<string[]>(
    sessions.map((s) => s._id),
  );
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(
    null,
  );
  const [history, setHistory] = useState<
    { sessionId: string; action: "declined" | "interested" }[]
  >([]);

  const currentSessionId = currentSessionIds[0];
  const currentSession = sessions.find((s) => s._id === currentSessionId);

  const handleDecline = () => {
    if (!currentSession) return;

    setExitDirection("left");
    setTimeout(() => {
      onDecline(currentSession._id);
      setHistory((prev) => [
        ...prev,
        { sessionId: currentSession._id, action: "declined" },
      ]);
      setCurrentSessionIds((prev) => prev.slice(1));
      setExitDirection(null);
    }, 300);

    // Trigger load more when running low on sessions
    if (currentSessionIds.length <= 3 && onLoadMore) {
      onLoadMore();
    }
  };

  const handleInterest = () => {
    if (!currentSession) return;

    setExitDirection("right");
    setTimeout(() => {
      onInterest(currentSession._id);
      setHistory((prev) => [
        ...prev,
        { sessionId: currentSession._id, action: "interested" },
      ]);
      setCurrentSessionIds((prev) => prev.slice(1));
      setExitDirection(null);
    }, 300);

    // Trigger load more when running low on sessions
    if (currentSessionIds.length <= 3 && onLoadMore) {
      onLoadMore();
    }
  };

  const handleReset = () => {
    setCurrentSessionIds(sessions.map((s) => s._id));
    setHistory([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;

    const lastAction = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentSessionIds((prev) => [lastAction!.sessionId, ...prev]);

    // TODO: Also undo the database action when Task #9 is implemented
    // This will require an undo mutation in Convex
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
