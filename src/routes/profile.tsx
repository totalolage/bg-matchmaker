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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

function Profile() {
  const user = useCurrentUser();
  const { signOut } = useAuthActions();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    await signOut();
    setShowLogoutDialog(false);
  };

  return (
    <>
      <div className="h-full bg-white flex flex-col">
        <header className="bg-white border-b border-gray-200 p-4 relative">
          <Button
            onClick={() => setShowLogoutDialog(true)}
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4 text-red-600 hover:text-red-700 hover:bg-red-50"
            aria-label="Log out"
          >
            <LogOut size={20} />
          </Button>
          
          <Link
            to="/profile/edit"
            className="absolute right-4 top-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Edit profile"
          >
            <Edit size={20} />
          </Link>
          
          <div className="text-center">
            <Avatar className="w-20 h-20 mx-auto mb-3">
              <AvatarImage 
                src={user.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                alt={user.displayName || user.name}
              />
              <AvatarFallback>
                {(user.displayName || user.name).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold text-gray-900">{user.displayName || user.name}</h1>
            {user.displayName && user.displayName !== user.name && (
              <p className="text-sm text-gray-500 mb-1">@{user.name}</p>
            )}
            <p className="text-sm text-gray-500">
              {user.gameLibrary.length} games • {user.availability.length} time slots
            </p>
          </div>
        </header>

        <Tabs defaultValue="games" className="flex-1 flex flex-col">
          <TabsList className="w-full rounded-none bg-white border-b">
            <TabsTrigger value="games" className="flex-1 data-[state=active]:text-purple-600 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none">
              Game Library
            </TabsTrigger>
            <TabsTrigger value="availability" className="flex-1 data-[state=active]:text-purple-600 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none">
              Availability
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="games" className="flex-1 overflow-y-auto p-4 mt-0">
            <GameLibrary user={user} />
          </TabsContent>
          
          <TabsContent value="availability" className="flex-1 overflow-y-auto p-4 mt-0">
            <AvailabilitySchedule />
          </TabsContent>
        </Tabs>
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
