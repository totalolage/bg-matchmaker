import { Doc } from "../../convex/_generated/dataModel";
import { Clock, Users, MapPin } from "lucide-react";

interface SessionCardProps {
  session: Doc<"sessions">;
}

export function SessionCard({ session }: SessionCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "proposed":
        return "bg-yellow-100 text-yellow-800";
      case "established":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start space-x-3">
        {session.gameImage && (
          <img
            src={session.gameImage}
            alt={session.gameName}
            className="w-16 h-16 rounded-lg object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {session.gameName}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                session.status
              )}`}
            >
              {session.status}
            </span>
          </div>
          
          <div className="space-y-1 text-sm text-gray-500">
            <div className="flex items-center">
              <Users size={14} className="mr-1" />
              <span>
                {session.players.length}/{session.maxPlayers} players
              </span>
            </div>
            
            {session.scheduledTime && (
              <div className="flex items-center">
                <Clock size={14} className="mr-1" />
                <span>
                  {new Date(session.scheduledTime).toLocaleDateString()} at{" "}
                  {new Date(session.scheduledTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
            
            {session.location && (
              <div className="flex items-center">
                <MapPin size={14} className="mr-1" />
                <span>{session.location}</span>
              </div>
            )}
          </div>
          
          {session.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {session.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
