import { createFileRoute } from "@tanstack/react-router";

import { UserProposalsPage } from "../components/sessions/UserProposalsPage";

export const Route = createFileRoute("/proposals")({
  component: UserProposalsPage,
});
