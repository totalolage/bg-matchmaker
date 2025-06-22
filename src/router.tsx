import { createRouter as createTanStackRouter } from "@tanstack/react-router";

import { getNavigationOrder } from "./lib/navigation";
import { routeTree } from "./routeTree.gen";

export function createRouter() {
  const router = createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    context: {
      queryClient: undefined!,
    },
    // Enable view transitions with custom types
    defaultViewTransition: {
      types: ({ fromLocation, toLocation }) => {
        if (!fromLocation || !toLocation) return [];
        
        const pageOrder = getNavigationOrder();
        const fromIndex = pageOrder.indexOf(fromLocation.pathname);
        const toIndex = pageOrder.indexOf(toLocation.pathname);
        
        if (fromIndex !== -1 && toIndex !== -1) {
          const direction = toIndex > fromIndex ? "slide-forward" : "slide-backward";
          console.log(`[TanStack Router] View transition: ${fromLocation.pathname} → ${toLocation.pathname} (${direction})`);
          return [direction];
        }
        
        // Special handling for profile/edit route
        if (fromLocation.pathname === "/profile" && toLocation.pathname === "/profile/edit") {
          console.log(`[TanStack Router] View transition: ${fromLocation.pathname} → ${toLocation.pathname} (slide-forward)`);
          return ["slide-forward"];
        }
        if (fromLocation.pathname === "/profile/edit" && toLocation.pathname === "/profile") {
          console.log(`[TanStack Router] View transition: ${fromLocation.pathname} → ${toLocation.pathname} (slide-backward)`);
          return ["slide-backward"];
        }
        
        console.log(`[TanStack Router] View transition: ${fromLocation.pathname} → ${toLocation.pathname} (fade)`);
        return ["fade"];
      },
    },
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}