import {
  createFileRoute,
  Link,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { GameLibrary } from "../components/GameLibrary";
import { AvailabilitySchedule } from "../components/AvailabilitySchedule";
import { useState, useRef, useEffect } from "react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

const TABS = ["games", "availability"] as const;
type Tab = (typeof TABS)[number];

function Profile() {
  const user = useCurrentUser();
  const { signOut } = useAuthActions();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Get tab from URL hash or default to 'games'
  const activeTab = useLocation({
    select: (location): Tab => {
      const tabIndex = TABS.indexOf(location.hash as Tab);
      return tabIndex >= 0 ? TABS[tabIndex] : TABS[0];
    },
  });

  const prevTabRef = useRef(activeTab);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const currentIndex = TABS.indexOf(activeTab);
    const prevIndex = TABS.indexOf(prevTabRef.current);
    const newDirection = currentIndex > prevIndex ? 1 : -1;
    // console.log('Tab change detected', { 
    //   activeTab, 
    //   prevTab: prevTabRef.current, 
    //   currentIndex, 
    //   prevIndex, 
    //   direction: newDirection 
    // });
    setDirection(newDirection);
    prevTabRef.current = activeTab;
  }, [activeTab]);

  const navigate = useNavigate();
  const handleTabChange = (value: Tab) => {
    // console.log('handleTabChange called', { value, currentTab: activeTab });
    void navigate({
      hash: value,
      replace: true,
      viewTransition: false,
    });
  };

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
                src={
                  user.profilePic ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
                }
                alt={user.displayName || user.name}
              />
              <AvatarFallback>
                {(user.displayName || user.name).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold text-gray-900">
              {user.displayName || user.name}
            </h1>
            {user.displayName && user.displayName !== user.name && (
              <p className="text-sm text-gray-500 mb-1">@{user.name}</p>
            )}
            <p className="text-sm text-gray-500">
              {user.gameLibrary.length} games • {user.availability.length} time
              slots
            </p>
          </div>
        </header>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="flex-1 flex flex-col"
        >
          <TabsList className="w-full rounded-none bg-white border-b">
            <TabsTrigger
              value="games"
              className="flex-1 data-[state=active]:text-purple-600 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none"
            >
              Game Library
            </TabsTrigger>
            <TabsTrigger
              value="availability"
              className="flex-1 data-[state=active]:text-purple-600 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none"
            >
              Availability
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <TabsContent
                key={activeTab}
                value={activeTab}
                forceMount
                className="absolute inset-0"
                asChild
              >
                <motion.div
                  custom={direction}
                  initial={{ x: direction * 200, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: direction * 200, opacity: 0 }}
                  transition={{
                    type: "tween",
                    duration: 0.1,
                  }}
                  // onAnimationStart={() => console.log(`${activeTab} animation START`, { direction, activeTab })}
                  // onAnimationComplete={() => console.log(`${activeTab} animation COMPLETE`, { direction, activeTab })}
                  className="overflow-y-auto p-4"
                >
                  {activeTab === "games" && <GameLibrary user={user} />}
                  {activeTab === "availability" && <AvailabilitySchedule user={user} />}
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to log out?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the sign in page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleLogout()}>
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
