import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";

import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";

export function useCurrentUser(): Doc<"users"> {
  const { data: user } = useSuspenseQuery({
    ...convexQuery(api.users.getCurrentUser, {}),
  });

  // Since we're wrapped in an Authenticated component at the App level,
  // and getCurrentUser should return a user for authenticated users,
  // we can assert that user exists. If it doesn't, there's a bug.
  if (!user) {
    throw new Error(
      "User not found. This should not happen when authenticated."
    );
  }

  return user;
}
