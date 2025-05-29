import { createFileRoute } from "@tanstack/react-router";
import { Navigation } from "../components/Navigation";
import { GameLibrary } from "../components/GameLibrary";
import { AvailabilitySchedule } from "../components/AvailabilitySchedule";
import { useState } from "react";
import { useCurrentUser } from "../hooks/useCurrentUser";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

function Profile() {
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState<"games" | "availability">("games");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
        <header className="bg-white border-b border-gray-200 p-4">
          <div className="text-center">
            <img
              src={user.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
              alt={user.name}
              className="w-20 h-20 rounded-full mx-auto mb-3"
            />
            <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-sm text-gray-500">
              {user.gameLibrary.length} games • {user.availability.length} time slots
            </p>
          </div>
        </header>

        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("games")}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === "games"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500"
              }`}
            >
              Game Library
            </button>
            <button
              onClick={() => setActiveTab("availability")}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === "availability"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500"
              }`}
            >
              Availability
            </button>
          </nav>
        </div>

        <main className="p-4 pb-20">
          {activeTab === "games" ? (
            <GameLibrary user={user} />
          ) : (
            <AvailabilitySchedule />
          )}
        </main>

        <Navigation />
      </div>
    </div>
  );
}
