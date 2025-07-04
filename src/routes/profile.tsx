import {
  createFileRoute,
  Link,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { type } from "arktype";
import { AnimatePresence, motion } from "framer-motion";
import { Edit, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AvailabilitySchedule } from "@/components/availability";
import { GameLibrary } from "@/components/game-library";
import { LogoutDialog, LogoutDialogRef } from "@/components/LogoutDialog";
import { PageHeader, PageLayout } from "@/components/PageLayout";
import { SessionHistory } from "@/components/session-history";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/UserAvatar";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const searchSchema = type({
  "date?": "string",
});

export const Route = createFileRoute("/profile")({
  component: Profile,
  validateSearch: (search: Record<string, unknown>) => {
    const parsed = searchSchema(search);
    if (parsed instanceof type.errors) {
      // Return empty object if validation fails
      return {};
    }
    return parsed;
  },
});

const TABS = ["games", "availability", "history"] as const;
type Tab = (typeof TABS)[number];

function Profile() {
  const user = useCurrentUser();
  const logoutDialogRef = useRef<LogoutDialogRef>(null);

  // Get tab from URL hash or default to 'games'
  const activeTab = useLocation({
    select: (location): Tab => {
      const tabIndex = TABS.indexOf(location.hash as Tab);
      return tabIndex >= 0 ? (TABS[tabIndex] as Tab) : TABS[0];
    },
  });

  const prevTabRef = useRef(activeTab);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const currentIndex = TABS.indexOf(activeTab);
    const prevIndex = TABS.indexOf(prevTabRef.current);
    const newDirection = currentIndex > prevIndex ? 1 : -1;
    setDirection(newDirection);
    prevTabRef.current = activeTab;
  }, [activeTab]);

  const navigate = useNavigate();
  const handleTabChange = (value: Tab) => {
    void navigate({
      hash: value,
      replace: true,
      viewTransition: false,
    });
  };

  return (
    <>
      <PageLayout>
        <PageHeader className="relative">
          <Button
            onClick={() => logoutDialogRef.current?.open()}
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
            <UserAvatar size="xl" className="mx-auto mb-3" />
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
        </PageHeader>

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
            <TabsTrigger
              value="history"
              className="flex-1 data-[state=active]:text-purple-600 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none"
            >
              History
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <TabsContent
                key={activeTab}
                value={activeTab}
                forceMount
                className="absolute inset-0 mt-0"
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
                  {activeTab === "availability" && (
                    <AvailabilitySchedule user={user} />
                  )}
                  {activeTab === "history" && <SessionHistory />}
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>
      </PageLayout>

      <LogoutDialog ref={logoutDialogRef} />
    </>
  );
}
