import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Toaster } from "sonner";

import { Authenticated, Unauthenticated } from "convex/react";

import { Navigation } from "@/components/Navigation";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { SignInForm } from "@/SignInForm";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: () => (
    <div className="min-h-dvh bg-gradient-to-br from-purple-50 to-blue-50 overscroll-none">
      <Authenticated>
        <div className="relative max-w-xl mx-auto bg-white min-h-dvh shadow-xl flex flex-col safe-x">
          <div
            className="grid flex-1 overflow-hidden"
            style={{ viewTransitionName: "content", contain: "layout" }}
          >
            <Outlet />
          </div>
          <Navigation />
        </div>
      </Authenticated>

      <Unauthenticated>
        <div className="min-h-dvh flex items-center justify-center p-4 safe-x safe-y">
          <div className="w-full max-w-xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🎲 DeskoSpojka
              </h1>
              <p className="text-gray-600">
                Find your perfect board game session
              </p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>

      <Toaster
        position="bottom-left"
        toastOptions={{
          style: {
            bottom: "calc(80px + env(safe-area-inset-bottom))", // Position above the navbar with safe area
            left: "env(safe-area-inset-left)",
            right: "env(safe-area-inset-right)",
          },
        }}
      />
      <PWAInstallPrompt />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  ),
});
