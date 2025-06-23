import { Link } from "@tanstack/react-router";
import { Check, Eye, Info, RotateCcw, X } from "lucide-react";
import { useState } from "react";

import { GameDetailsModal } from "@/components/games/GameDetailsModal";
import { SessionCard } from "@/components/SessionCard";
import { Button } from "@/components/ui/button";

import { Doc } from "../../../convex/_generated/dataModel";

interface SessionCardProps {
  session: Doc<"sessions"> & { matchScore?: number };
  onDecline: () => void;
  onInterest: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

export const SessionProposal = ({
  session,
  onDecline,
  onInterest,
  onUndo,
  canUndo = false,
}: SessionCardProps) => {
  const [showGameDetails, setShowGameDetails] = useState(false);

  const handleGameDetails = () => {
    setShowGameDetails(true);
  };

  return (
    <div className="h-full flex flex-col gap-4 px-2 py-4">
      <div className="grid flex-1 relative">
        <SessionCard session={session} />

        {/* Undo button */}
        <div className="absolute bottom-4 left-4 z-20">
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-14 h-14 p-0 hover:bg-gray-50 bg-white shadow-lg"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>

        {/* View details button */}
        <div className="absolute bottom-4 right-20 z-20">
          <Link to="/sessions/$sessionId" params={{ sessionId: session._id }}>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full w-14 h-14 p-0 hover:bg-gray-50 bg-white shadow-lg"
              title="View session details"
            >
              <Eye className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Game info button */}
        <div className="absolute bottom-4 right-4 z-20">
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-14 h-14 p-0 hover:bg-gray-50 bg-white shadow-lg"
            onClick={handleGameDetails}
            title="View game details"
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main action buttons */}
      <div className="flex gap-4">
        <Button
          size="lg"
          variant="outline"
          className="flex-1 h-14 border-2 border-red-500 hover:bg-red-50 text-red-500"
          onClick={onDecline}
        >
          <X className="w-6 h-6 mr-2" />
          Pass
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1 h-14 border-2 border-green-500 hover:bg-green-50 text-green-500"
          onClick={onInterest}
        >
          <Check className="w-6 h-6 mr-2" />
          Interested
        </Button>
      </div>

      <GameDetailsModal
        gameId={session.gameId}
        isOpen={showGameDetails}
        onClose={() => setShowGameDetails(false)}
      />
    </div>
  );
};
