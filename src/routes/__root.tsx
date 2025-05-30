import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "../SignInForm";
import { Toaster } from "sonner";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Authenticated>
        <Outlet />
      </Authenticated>
      
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🎲 GameMatch
              </h1>
              <p className="text-gray-600">
                Find your perfect board game session
              </p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
      
      <Toaster />
      <TanStackRouterDevtools />
    </div>
  ),
});
