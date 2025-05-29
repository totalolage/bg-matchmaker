import { Doc } from "../../convex/_generated/dataModel";
import { Clock, Users, MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";

interface SwipeCardProps {
  session: Doc<"sessions"> & { matchScore?: number };
  onSwipe: (action: "like" | "pass") => void;
}

export function SwipeCard({ session, onSwipe }: SwipeCardProps) {
  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-sm mx-auto"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {session.gameImage && (
        <div className="relative">
          <img
            src={session.gameImage}
            alt={session.gameName}
            className="w-full h-48 object-cover"
          />
          {session.matchScore && session.matchScore > 50 && (
            <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center">
              <Star size={12} className="mr-1" />
              Great Match!
            </div>
          )}
        </div>
      )}
      
      <div className="p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {session.gameName}
          </h2>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              session.status === "proposed"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {session.status === "proposed" ? "Looking for players" : "Established"}
          </span>
        </div>
        
        <div className="space-y-3 text-gray-600">
          <div className="flex items-center">
            <Users size={18} className="mr-3 text-purple-500" />
            <span>
              {session.players.length + session.interestedPlayers.length}/{session.maxPlayers} players
              {session.minPlayers > session.players.length + session.interestedPlayers.length && (
                <span className="text-sm text-gray-400 ml-1">
                  (need {session.minPlayers - session.players.length - session.interestedPlayers.length} more)
                </span>
              )}
            </span>
          </div>
          
          {session.scheduledTime && (
            <div className="flex items-center">
              <Clock size={18} className="mr-3 text-purple-500" />
              <div>
                <div>{new Date(session.scheduledTime).toLocaleDateString()}</div>
                <div className="text-sm text-gray-400">
                  {new Date(session.scheduledTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          )}
          
          {session.location && (
            <div className="flex items-center">
              <MapPin size={18} className="mr-3 text-purple-500" />
              <span>{session.location}</span>
            </div>
          )}
        </div>
        
        {session.description && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{session.description}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
