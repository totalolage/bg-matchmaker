import { Check, Info, RotateCcw, X } from "lucide-react";

import { Doc } from "../../../convex/_generated/dataModel";
import { SessionCard } from "../SessionCard";
import { Button } from "../ui/button";

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
  const handleGameDetails = () => {
    // TODO: Navigate to game details page when Task #14 is implemented
    // This should open a modal or navigate to a page showing detailed game information
    console.log("Game details for:", session.gameName);
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

        {/* Game info button */}
        <div className="absolute bottom-4 right-4 z-20">
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-14 h-14 p-0 hover:bg-gray-50 bg-white shadow-lg"
            onClick={handleGameDetails}
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
    </div>
  );
};
