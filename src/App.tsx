import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";

import { ConvexProvider, ConvexReactClient } from "convex/react";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { PostHogProvider } from "./components/PostHogProvider";
import { createRouter } from "./router";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL!;
if (!CONVEX_URL) {
  throw new Error("missing VITE_CONVEX_URL envar");
}

const convex = new ConvexReactClient(CONVEX_URL, {
  unsavedChangesWarning: false,
});
const convexQueryClient = new ConvexQueryClient(convex);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
    },
  },
});
convexQueryClient.connect(queryClient);

const router = createRouter();

export default function App() {
  return (
    <ErrorBoundary>
      <PostHogProvider>
        <ConvexProvider client={convex}>
          <ConvexAuthProvider client={convex}>
            <QueryClientProvider client={queryClient}>
              <RouterProvider router={router} context={{ queryClient }} />
            </QueryClientProvider>
          </ConvexAuthProvider>
        </ConvexProvider>
      </PostHogProvider>
    </ErrorBoundary>
  );
}
