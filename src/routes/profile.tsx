import { createFileRoute, Link } from "@tanstack/react-router";
import { GameLibrary } from "../components/GameLibrary";
import { AvailabilitySchedule } from "../components/AvailabilitySchedule";
import { useState } from "react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useAuthActions } from "@convex-dev/auth/react";
import { LogOut, Edit } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

function Profile() {
  const user = useCurrentUser();
  const { signOut } = useAuthActions();
  const [activeTab, setActiveTab] = useState<"games" | "availability">("games");
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    await signOut();
    setShowLogoutDialog(false);
  };

  return (
    <>
      <div className="h-full bg-white flex flex-col">
        <header className="bg-white border-b border-gray-200 p-4 relative">
          <button
            onClick={() => setShowLogoutDialog(true)}
            className="absolute left-4 top-4 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Log out"
          >
            <LogOut size={20} />
          </button>
          
          <Link
            to="/profile/edit"
            className="absolute right-4 top-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Edit profile"
          >
            <Edit size={20} />
          </Link>
          
          <div className="text-center">
            <img
              src={user.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
              alt={user.displayName || user.name}
              className="w-20 h-20 rounded-full mx-auto mb-3"
            />
            <h1 className="text-xl font-bold text-gray-900">{user.displayName || user.name}</h1>
            {user.displayName && user.displayName !== user.name && (
              <p className="text-sm text-gray-500 mb-1">@{user.name}</p>
            )}
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

        <main className="p-4 flex-1 overflow-y-auto">
          {activeTab === "games" ? (
            <GameLibrary user={user} />
          ) : (
            <AvailabilitySchedule />
          )}
        </main>
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the sign in page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleLogout()}>Log out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
